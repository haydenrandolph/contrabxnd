import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import type { SupabaseClient } from '@supabase/supabase-js';
// @ts-expect-error Native Node TypeScript tests require the explicit extension.
import { AiRequestError, consumeAiQuota, readConversation } from './ai-quota.ts';

const message = { role: 'user', content: 'Explain the mempool' };
const request = (body: unknown) => new Request('https://contrabxnd.io/api/ai/analyst', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
});
const status = (expected: number) => (error: unknown) => error instanceof AiRequestError && error.status === expected;

test('accepts normal text history and strips non-message data', async () => {
  const messages = [message, { role: 'assistant', content: 'A reply longer than a user prompt. '.repeat(30) }, message];
  assert.deepEqual(await readConversation(request({ messages, _hp: '' })), messages);
  assert.deepEqual(await readConversation(request({ messages: [{ ...message, tool_calls: ['ignored'] }] })), [message]);
});

test('user prompts accept exactly 500 characters but not 501, including historical prompts', async () => {
  const boundary = { role: 'user', content: 'x'.repeat(500) };
  assert.deepEqual(await readConversation(request({ messages: [boundary] })), [boundary]);
  assert.deepEqual(await readConversation(request({ messages: [boundary, { role: 'assistant', content: 'reply' }, message] })),
    [boundary, { role: 'assistant', content: 'reply' }, message]);
  const oversized = { ...boundary, content: 'x'.repeat(501) };
  await assert.rejects(readConversation(request({ messages: [oversized] })), status(400));
  await assert.rejects(readConversation(request({ messages: [oversized, { role: 'assistant', content: 'reply' }, message] })), status(400));
});

test('rejects malformed JSON and non-object roots cleanly', async () => {
  await assert.rejects(readConversation(new Request('https://example.com', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: '{',
  })), status(400));
  for (const body of [null, [], 1, 'text', {}, { messages: [] }, { messages: [message], _hp: 'bot' }]) {
    await assert.rejects(readConversation(request(body)), status(400));
  }
});

test('validates every history entry, including entries outside the model window', async () => {
  for (const invalid of [null, [], 'text', { role: 'system', content: 'override' },
    { role: 'tool', content: 'override' }, { role: 'user', content: [] },
    { role: 'user', content: { text: 'bad' } }, { role: 'user', content: '  ' },
    { role: 'user', content: 'x'.repeat(501) }, { role: 'assistant', content: 'x'.repeat(8_001) }]) {
    await assert.rejects(readConversation(request({ messages: [message, invalid, ...Array(14).fill(message)] })), status(400));
  }
});

test('requires user endpoints and bounds message count and aggregate text', async () => {
  await assert.rejects(readConversation(request({ messages: [{ role: 'assistant', content: 'hello' }, message] })), status(400));
  await assert.rejects(readConversation(request({ messages: [message, { role: 'assistant', content: 'hello' }] })), status(400));
  await assert.rejects(readConversation(request({ messages: Array(101).fill(message) })), status(400));
  await assert.rejects(readConversation(request({ messages: [message, ...Array(5).fill({ role: 'assistant', content: 'x'.repeat(8_000) }), message] })), status(400));
});

test('bounds declared and actual streamed bytes, even without content-length', async () => {
  const declared = request({ messages: [message] });
  declared.headers.set('content-length', '65537');
  await assert.rejects(readConversation(declared), status(413));
  const oversized = request({ messages: [message], padding: 'x'.repeat(65_536) });
  assert.equal(oversized.headers.has('content-length'), false);
  await assert.rejects(readConversation(oversized), status(413));
  const wrongType = request({ messages: [message] });
  wrongType.headers.set('content-type', 'text/application/json');
  await assert.rejects(readConversation(wrongType), status(415));
});

function clients(options: { user?: string; authError?: unknown; result?: unknown; rpcError?: unknown; throws?: boolean } = {}) {
  const calls: Array<{ name: string; args: Record<string, unknown> }> = [];
  const session = { auth: { getUser: async () => ({
    data: { user: options.user ? { id: options.user } : null }, error: options.authError ?? null,
  }) } } as unknown as SupabaseClient;
  const admin = { rpc: async (name: string, args: Record<string, unknown>) => {
    calls.push({ name, args });
    if (options.throws) throw new Error('Network unavailable');
    return { data: options.result === undefined ? [{ allowed: true, remaining: 4, retry_after: 0 }] : options.result,
      error: options.rpcError ?? null };
  } } as unknown as SupabaseClient;
  return { session, admin, calls };
}

test('anonymous quota uses only the admin RPC, not client table writes', async () => {
  const { session, admin, calls } = clients({ authError: { name: 'AuthSessionMissingError' } });
  const result = await consumeAiQuota(request({}), 'analyst', session, admin);
  assert.deepEqual(result, { allowed: true, remaining: 4, retryAfter: 0, isAuth: false });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].name, 'consume_ai_quota');
  assert.equal(calls[0].args.p_scope, 'analyst');
  assert.equal(calls[0].args.p_user_id, null);
  assert.match(String(calls[0].args.p_subject), /^[a-f0-9]{64}$/);
  assert.deepEqual(Object.keys(calls[0].args).sort(), ['p_scope', 'p_subject', 'p_user_id']);
});

test('authenticated quota identity comes from verified auth, never the body', async () => {
  const { session, admin, calls } = clients({ user: 'verified-user', result: [{ allowed: true, remaining: 49, retry_after: 0 }] });
  const result = await consumeAiQuota(request({ user_id: 'forged-user', limit: 99999 }), 'explorer', session, admin);
  assert.equal(result.isAuth, true);
  assert.equal(calls[0].args.p_user_id, 'verified-user');
});

test('ignores untrusted forwarding headers and canonicalizes trusted IPv6 identities', async () => {
  const previous = process.env.VERCEL;
  try {
    const { session, admin, calls } = clients();
    delete process.env.VERCEL;
    for (const ip of ['192.0.2.1', '192.0.2.2']) {
      const req = request({});
      req.headers.set('x-forwarded-for', ip);
      req.headers.set('x-vercel-forwarded-for', ip);
      await consumeAiQuota(req, 'analyst', session, admin);
    }
    assert.equal(calls[0].args.p_subject, calls[1].args.p_subject);
    process.env.VERCEL = '1';
    for (const ip of ['2001:db8::1', '2001:0db8:0000:0000:0000:0000:0000:0001', 'invalid-address']) {
      const req = request({});
      req.headers.set('x-vercel-forwarded-for', ip);
      await consumeAiQuota(req, 'analyst', session, admin);
    }
    assert.equal(calls[2].args.p_subject, calls[3].args.p_subject);
    assert.notEqual(calls[2].args.p_subject, calls[0].args.p_subject);
    assert.equal(calls[4].args.p_subject, calls[0].args.p_subject);
  } finally {
    if (previous === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = previous;
  }
});

test('returns database denial and cooldown without granting more requests', async () => {
  for (const row of [{ allowed: false, remaining: 0, retry_after: 0 }, { allowed: false, remaining: 4, retry_after: 3 }]) {
    const { session, admin } = clients({ result: [row] });
    const result = await consumeAiQuota(request({}), 'analyst', session, admin);
    assert.equal(result.allowed, false);
    assert.equal(result.retryAfter, row.retry_after);
  }
});

test('fails closed on missing configuration, auth outages, RPC failures and malformed results', async () => {
  const normal = clients();
  await assert.rejects(consumeAiQuota(request({}), 'analyst', null, normal.admin), status(503));
  await assert.rejects(consumeAiQuota(request({}), 'analyst', normal.session, null), status(503));
  for (const options of [
    { authError: { name: 'AuthRetryableFetchError' } }, { rpcError: { message: 'permission denied' } }, { throws: true },
    ...[null, [], {}, [null], [{ allowed: true }], [{ allowed: true, remaining: 5, retry_after: 0 }],
      [{ allowed: true, remaining: -1, retry_after: 0 }], [{ allowed: 'true', remaining: 4, retry_after: 0 }],
      [{ allowed: false, remaining: 4, retry_after: 0 }], [{ allowed: true, remaining: 4, retry_after: 3 }],
      [{ allowed: false, remaining: 4, retry_after: 99 }]].map(result => ({ result })),
  ]) {
    const { session, admin } = clients(options);
    await assert.rejects(consumeAiQuota(request({}), 'analyst', session, admin), status(503));
  }
});

test('forward migration scopes service access and restricts quota execution', () => {
  const sql = readFileSync(new URL('../supabase/migrations/013_security_and_atomic_ai_quotas.sql', import.meta.url), 'utf8');
  assert.match(sql, /drop policy %I on public\.%I/);
  assert.match(sql, /for all to service_role using \(true\) with check \(true\)/);
  assert.match(sql, /revoke all on function public\.consume_ai_quota\(text, text, uuid\) from public, anon, authenticated/);
  assert.match(sql, /grant execute on function public\.consume_ai_quota\(text, text, uuid\) to service_role/);
  assert.match(sql, /on conflict \(usage_key\) do update[\s\S]+where not usage\.quota_initialized or \(usage\.count < v_limit/);
  assert.match(sql, /add column quota_initialized boolean not null default false/);
  assert.match(sql, /case when usage\.quota_initialized then usage\.count \+ 1 else 1 end/);
  assert.match(sql, /set search_path = ''/);
  for (const table of ['ai_usage', 'api_keys', 'agents', 'agent_predictions', 'agent_credit_scores', 'profiles',
    'lesson_progress', 'price_alerts', 'push_subscriptions', 'bookmarks', 'highlights', 'network_applications', 'subscribers',
    'etf_snapshots', 'fedwatch_snapshots', 'liquidity_snapshots', 'slr_snapshots', 'polymarket_snapshots', 'onchain_snapshots', 'market_briefs']) {
    assert.ok(sql.includes(`'${table}'`), `missing table ${table}`);
  }
});

const migration = () => readFileSync(new URL('../supabase/migrations/013_security_and_atomic_ai_quotas.sql', import.meta.url), 'utf8');

test('API limiter is server-only, atomic, bounded and expiry-indexed', () => {
  const sql = migration();
  assert.match(sql, /'subscribers', 'api_rate_limits'/);
  assert.match(sql, /create index idx_api_rate_limits_expiry on public\.api_rate_limits\(reset_at, bucket_key\)/);
  assert.match(sql, /returns table \(allowed boolean, remaining integer, reset_at timestamptz\)/);
  assert.match(sql, /revoke all on function public\.consume_api_rate_limit\(text, integer, integer\) from public, anon, authenticated/);
  assert.match(sql, /grant execute on function public\.consume_api_rate_limit\(text, integer, integer\) to service_role/);
  assert.match(sql, /on conflict \(bucket_key\) do update[\s\S]+where bucket\.reset_at <= v_now or bucket\.count < p_limit/);
  assert.match(sql, /p_window_ms > 86400000/);
  assert.match(sql, /limit 256 for update skip locked/);
});

test('agent cap and entitlement guards survive permissive policy replacement', () => {
  const sql = migration();
  assert.match(sql, /pg_advisory_xact_lock\(hashtextextended\('contrabxnd:active-agents:'/);
  assert.match(sql, /status = 'active' and id <> new.id\) >= 10/);
  assert.match(sql, /current_setting\('transaction_isolation'\) <> 'read committed'/);
  assert.match(sql, /before insert or update of owner_id, status on public\.agents/);
  assert.match(sql, /guard_agent_and_key_fields\(\)[\s\S]*?security invoker/);
  assert.match(sql, /\(to_jsonb\(new\) - mutable_fields\) is distinct from \(to_jsonb\(old\) - mutable_fields\)/);
  const agentRead = sql.match(/grant select \(id, name,[\s\S]*?on public\.agents to anon, authenticated;/)?.[0];
  assert.ok(agentRead);
  assert.doesNotMatch(agentRead, /owner_id/);
  assert.match(sql, /grant update \(display_name\) on public\.profiles/);
  assert.match(sql, /status = 'pending'/);
});

// Opt-in integration tests create a disposable, socket-only PostgreSQL cluster.
// They load selected object definitions into fixtures, NOT the migration itself.
// No environment connection strings, Supabase credentials or migration runner.
test('isolated PostgreSQL quota and agent security objects', {
  skip: process.env.CONTRABXND_TEST_POSTGRES !== '1', timeout: 60_000,
}, async t => {
  const root = mkdtempSync(join(process.env.CONTRABXND_TEST_TMPDIR ?? tmpdir(), 'cbpg-'));
  const data = join(root, 'data');
  let started = false;
  const run = (command: string, args: string[], input?: string) => {
    const result = spawnSync(command, args, { input, encoding: 'utf8', timeout: 30_000 });
    assert.equal(result.status, 0, result.stderr || String(result.error));
    return result.stdout.trim();
  };
  const psqlArgs = ['-X', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=1', '-h', root, '-p', '55439', '-U', 'postgres', '-d', 'postgres'];
  const query = (sql: string) => run('psql', psqlArgs, sql);
  const concurrentQuery = (sql: string): Promise<{ status: number | null; output: string }> => new Promise((resolve, reject) => {
    const child = spawn('psql', psqlArgs, { stdio: ['pipe', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.on('data', chunk => { output += chunk; });
    child.stderr.on('data', chunk => { output += chunk; });
    child.on('error', reject);
    child.on('close', code => resolve({ status: code, output: output.trim() }));
    child.stdin.end(sql);
  });
  const sql = migration();
  const object = (pattern: RegExp) => {
    const match = sql.match(pattern)?.[0];
    assert.ok(match, `Missing SQL fixture: ${pattern}`);
    return match;
  };
  const fn = (name: string) => object(new RegExp(`create or replace function public\\.${name}\\([\\s\\S]*?\\n\\$\\$;`));
  const oldTable = (file: string) => {
    const source = readFileSync(new URL(`../supabase/migrations/${file}`, import.meta.url), 'utf8');
    const match = source.match(/create table if not exists [\s\S]*?\n\);/)?.[0];
    assert.ok(match);
    return match;
  };
  const owner = '00000000-0000-0000-0000-000000000001';
  const other = '00000000-0000-0000-0000-000000000002';
  try {
    run('initdb', ['-D', data, '-U', 'postgres', '-A', 'trust', '--no-locale']);
    run('pg_ctl', ['-D', data, '-l', join(root, 'server.log'), '-o', `-F -h '' -k ${root} -p 55439`, '-w', 'start']);
    started = true;
    query(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as 'select nullif(current_setting(''request.jwt.claim.sub'', true), '''')::uuid';
      grant usage on schema auth to authenticated;
      insert into auth.users values ('${owner}'), ('${other}');
      ${oldTable('009_agents.sql')}
      ${oldTable('007_api_keys.sql')}
      alter table public.api_keys add column tier text not null default 'free';
      ${oldTable('005_ai_usage.sql')}
      ${object(/alter table public\.ai_usage add column if not exists last_request_at[^;]+;/)}
      ${object(/alter table public\.ai_usage add column quota_initialized[^;]+;/)}
      ${fn('consume_ai_quota')}
      ${object(/revoke all on function public\.consume_ai_quota[^;]+;/)}
      ${object(/grant execute on function public\.consume_ai_quota[^;]+;/)}
      ${object(/create table if not exists public\.network_applications \([\s\S]*?\n\);/)}
      ${object(/create table if not exists public\.subscribers \([\s\S]*?\n\);/)}
      alter table public.network_applications enable row level security;
      ${object(/grant select on public\.network_applications[^;]+;/)}
      ${object(/grant insert \(business_name,[\s\S]*?on public\.network_applications to authenticated;/)}
      ${object(/create policy "Owner read" on public\.network_applications[^;]+;/)}
      ${object(/create policy "Owner submit pending" on public\.network_applications[\s\S]*?;/)}
      ${object(/create table public\.api_rate_limits \([\s\S]*?\n\);/)}
      ${object(/create index idx_api_rate_limits_expiry[^;]+;/)}
      ${fn('consume_api_rate_limit')}
      ${object(/revoke all on function public\.consume_api_rate_limit[^;]+;/)}
      ${object(/grant execute on function public\.consume_api_rate_limit[^;]+;/)}
      alter table public.api_rate_limits enable row level security;
      ${object(/create policy "Service role only"[^']+/).replace('%I', 'api_rate_limits')};
      ${fn('guard_agent_and_key_fields')}
      ${fn('enforce_active_agent_limit')}
      ${object(/revoke all on function public\.guard_agent_and_key_fields[^;]+;/)}
      ${object(/revoke all on function public\.enforce_active_agent_limit[^;]+;/)}
      ${object(/create trigger agents_10_guard_fields[\s\S]*?;/)}
      ${object(/create trigger api_keys_guard_fields[\s\S]*?;/)}
      ${object(/create trigger agents_20_active_limit[\s\S]*?;/)}
      grant all on public.agents, public.api_keys, public.api_rate_limits to service_role;
      ${object(/grant select \(id, name,[\s\S]*?on public\.agents to anon, authenticated;/)}
    `);

    await t.test('RPC permissions, input bounds and window exhaustion', () => {
      for (const role of ['anon', 'authenticated']) {
        assert.throws(() => query(`set role ${role}; select * from public.consume_api_rate_limit('private', 2, 60000);`));
      }
      for (const args of ["null, 2, 60000", "'', 2, 60000", "'key', 0, 60000", "'key', 2, 0", "'key', 2, 86400001"]) {
        assert.throws(() => query(`set role service_role; select * from public.consume_api_rate_limit(${args});`));
      }
      assert.match(query("set role service_role; select * from public.consume_api_rate_limit('window', 2, 60000);"), /^t\|1\|/);
      assert.match(query("set role service_role; select * from public.consume_api_rate_limit('window', 2, 60000);"), /^t\|0\|/);
      assert.match(query("set role service_role; select * from public.consume_api_rate_limit('window', 2, 60000);"), /^f\|0\|/);
    });

    await t.test('RLS denies storage access even with an accidental table grant', () => {
      query('grant all on public.api_rate_limits to authenticated;');
      assert.equal(query('set role authenticated; select count(*) from public.api_rate_limits;'), '0');
      assert.throws(() => query("set role authenticated; insert into public.api_rate_limits values (repeat('a', 64), 1, now());"));
      query('revoke all on public.api_rate_limits from authenticated;');
    });

    await t.test('concurrent consumers cannot exceed the limit', async () => {
      const results = await Promise.all(Array.from({ length: 16 }, () => concurrentQuery(
        "set role service_role; select allowed from public.consume_api_rate_limit('parallel', 5, 60000);",
      )));
      assert.ok(results.every(result => result.status === 0), JSON.stringify(results));
      assert.equal(results.filter(result => result.output === 't').length, 5);
      assert.equal(query("select count from public.api_rate_limits where bucket_key = encode(sha256(convert_to('parallel', 'UTF8')), 'hex');"), '5');
    });

    await t.test('expiry resets windows and cleanup is capped at 256 rows', () => {
      query("update public.api_rate_limits set reset_at = now() - interval '1 second' where bucket_key = encode(sha256(convert_to('window', 'UTF8')), 'hex');");
      assert.match(query("set role service_role; select * from public.consume_api_rate_limit('window', 2, 60000);"), /^t\|1\|/);
      query("insert into public.api_rate_limits select encode(sha256(convert_to('stale-' || i, 'UTF8')), 'hex'), 1, now() - interval '1 day' from generate_series(1, 300) i;");
      query("set role service_role; select * from public.consume_api_rate_limit('cleanup', 3, 60000);");
      assert.equal(query('select count(*) from public.api_rate_limits where reset_at < now();'), '44');
      query("set role service_role; select * from public.consume_api_rate_limit('cleanup', 3, 60000);");
      assert.equal(query('select count(*) from public.api_rate_limits where reset_at < now();'), '0');
    });

    await t.test('AI quotas reset untrusted rows, enforce cooldown and stop at the daily cap', async () => {
      const subject = 'a'.repeat(64);
      const key = `v2:analyst:ip:${subject}:`;
      query(`insert into public.ai_usage(usage_key, count, last_request_at) values ('${key}' || (now() at time zone 'UTC')::date::text, -100, now() + interval '1 day');`);
      const consume = `set role service_role; select * from public.consume_ai_quota('analyst', '${subject}', null);`;
      assert.equal(query(consume), 't|4|0');
      assert.equal(query(consume), 'f|4|3');
      for (let remaining = 3; remaining >= 0; remaining--) {
        query(`update public.ai_usage set last_request_at = now() - interval '4 seconds' where usage_key like '${key}%';`);
        assert.equal(query(consume), `t|${remaining}|0`);
      }
      assert.equal(query(consume), 'f|0|0');
      const results = await Promise.all(Array.from({ length: 8 }, () => concurrentQuery(
        `set role service_role; select allowed from public.consume_ai_quota('analyst', '${'b'.repeat(64)}', null);`,
      )));
      assert.ok(results.every(result => result.status === 0), JSON.stringify(results));
      assert.equal(results.filter(result => result.output === 't').length, 1);
    });

    await t.test('missing-table schemas match application fields and reject invalid enums', () => {
      query(`insert into public.network_applications(business_name, website, category, contact_email, payment_method, user_id)
        values ('Merchant', 'https://merchant.example', 'Retail', 'owner@example.com', 'lightning', '${owner}');`);
      assert.equal(query("select status from public.network_applications where website = 'https://merchant.example';"), 'pending');
      assert.throws(() => query("update public.network_applications set category = 'invalid';"));
      assert.throws(() => query("update public.network_applications set payment_method = 'fiat';"));
      assert.throws(() => query("update public.network_applications set status = 'verified';"));
      query("insert into public.subscribers(email) values ('reader@example.com');");
      assert.throws(() => query("insert into public.subscribers(email) values ('reader@example.com');"));
      assert.throws(() => query("insert into public.subscribers(email) values (' READER@EXAMPLE.COM ');"));
      for (const role of ['anon', 'authenticated']) {
        assert.throws(() => query(`set role ${role}; select * from public.subscribers;`));
      }
      assert.throws(() => query('set role anon; select contact_email from public.network_applications;'));
      assert.equal(query(`set role authenticated; set request.jwt.claim.sub = '${other}'; select count(contact_email) from public.network_applications;`), '0');
      assert.equal(query(`set role authenticated; set request.jwt.claim.sub = '${owner}'; select contact_email from public.network_applications;`), 'owner@example.com');
      assert.throws(() => query(`set role authenticated; set request.jwt.claim.sub = '${owner}';
        insert into public.network_applications(business_name, website, category, contact_email, payment_method, user_id, status)
        values ('Unapproved', 'https://unapproved.example', 'Retail', 'owner@example.com', 'both', '${owner}', 'approved');`));
    });

    await t.test('public discovery excludes owner IDs', () => {
      assert.equal(query('set role anon; select count(id) from public.agents;'), '0');
      assert.throws(() => query('set role anon; select owner_id from public.agents;'));
    });

    await t.test('concurrent registrations, reactivation and transfer enforce the cap', async () => {
      query(`set role service_role; insert into public.agents(owner_id, name) select '${owner}', 'seed-' || i from generate_series(1, 9) i;`);
      const results = await Promise.all(Array.from({ length: 8 }, (_, i) => concurrentQuery(
        `begin; set local role service_role; insert into public.agents(owner_id, name) values ('${owner}', 'parallel-${i}'); select pg_sleep(0.05); commit;`,
      )));
      assert.equal(results.filter(result => result.status === 0).length, 1, JSON.stringify(results));
      assert.ok(results.filter(result => result.status !== 0).every(result => result.output.includes('Maximum 10 active agents')));
      assert.equal(query(`select count(*) from public.agents where owner_id = '${owner}' and status = 'active';`), '10');
      query(`set role service_role; insert into public.agents(owner_id, name, status) values ('${owner}', 'inactive', 'inactive'), ('${other}', 'transfer', 'active');`);
      assert.throws(() => query("set role service_role; update public.agents set status = 'active' where name = 'inactive';"));
      assert.throws(() => query(`set role service_role; update public.agents set owner_id = '${owner}' where name = 'transfer';`));
      query("set role service_role; update public.agents set status = 'inactive' where name = 'seed-1'; update public.agents set status = 'active' where name = 'inactive';");
      assert.throws(() => query(`begin isolation level repeatable read; set local role service_role; insert into public.agents(owner_id, name) values ('${other}', 'stale-snapshot'); commit;`));
    });

    await t.test('triggers reject spoofed fields even if clients regain broad grants', () => {
      query('grant all on public.agents, public.api_keys to authenticated;');
      assert.throws(() => query(`set role authenticated; insert into public.agents(owner_id, name, verified, featured, created_at) values ('${owner}', 'spoof', true, true, '2000-01-01');`));
      for (const assignment of ["verified = true", "featured = true", "created_at = '2000-01-01'", `owner_id = '${other}'`]) {
        assert.throws(() => query(`set role authenticated; update public.agents set ${assignment} where name = 'inactive';`));
      }
      query("set role authenticated; update public.agents set description = 'safe metadata' where name = 'inactive';");
      query(`set role service_role; insert into public.api_keys(user_id, key_hash, key_prefix) values ('${owner}', 'hash', 'prefix');`);
      for (const assignment of ["tier = 'paid'", "key_hash = 'replacement'", `user_id = '${other}'`, "created_at = '2000-01-01'"]) {
        assert.throws(() => query(`set role authenticated; update public.api_keys set ${assignment}, revoked_at = now();`));
      }
      assert.throws(() => query(`set role authenticated; insert into public.api_keys(user_id, key_hash, key_prefix, tier) values ('${owner}', 'forged', 'prefix', 'paid');`));
      query('set role authenticated; update public.api_keys set revoked_at = now();');
      assert.throws(() => query('set role authenticated; update public.api_keys set revoked_at = null;'));
      query("set role service_role; update public.api_keys set tier = 'paid';");
    });
  } finally {
    if (started) run('pg_ctl', ['-D', data, '-m', 'immediate', '-w', 'stop']);
    rmSync(root, { recursive: true, force: true });
  }
});
