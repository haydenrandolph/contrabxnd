import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const NOW = Date.parse('2026-11-09T23:59:59Z');
const DAY = '2026-11-09';
const jobs = ['analyst-predict', 'market-brief'];
const request = signal => new Request('https://example.test', {
  headers: { authorization: 'Bearer test-secret' }, signal,
});

// Each harness has its own clock, environment, network and DB. No global mocks
// or process.env mutations: concurrent requests exercise the same actual routes.
function harness(job, options = {}) {
  const state = {
    time: NOW, ai: 0, fetches: 0, rows: [], finishes: [], lease: null,
    existing: 0, writeError: false, lookupError: false, deadlines: [], ...options,
  };
  class Clock extends Date {
    constructor(...args) { super(...(args.length ? args : [state.time])); }
    static now() { return state.time; }
  }
  const predictions = ['price', 'macro', 'sentiment'].map(category => ({
    text: `BTC ${category} prediction`, confidence: 0.7, category,
    targetDate: '2026-11-12T00:00:00Z',
  }));
  const brief = { headline: 'Daily brief', summary: 'Summary', sections: [{ title: 'Signal', body: 'Body' }] };
  const db = {
    async rpc(name, args) {
      if (name === 'claim_ai_job') {
        state.claims = (state.claims ?? 0) + 1;
        if (state.claimThrows) throw new Error('claim transport failure');
        if (state.claimError) return { error: { message: 'missing RPC or unavailable' } };
        const old = state.lease;
        if (old?.day === args.p_day && (old.status === 'completed' || old.until > state.time)) {
          return { data: { status: old.status === 'completed' ? 'completed' : 'busy' } };
        }
        state.lease = { day: args.p_day, status: 'running', token: `token-${state.claims}`, until: state.time + 120_000 };
        return { data: { status: 'claimed', token: state.lease.token } };
      }
      assert.equal(name, 'finish_ai_job');
      state.finishes.push(args);
      if (state.finishError) return { error: { message: 'finish unavailable' } };
      if (state.finishThrows) throw new Error('finish transport failure');
      const valid = state.lease.token === args.p_token && state.lease.until > state.time;
      if (valid) Object.assign(state.lease, { status: args.p_completed ? 'completed' : 'failed', until: 0 });
      return { data: valid };
    },
    from(table) {
      const q = { select: () => q, eq: () => q, is: () => q, or: filter => {
        assert.ok(filter.includes(`job_day.eq.${state.lease.day}`)); return q;
      }, maybeSingle: () => q, single: () => q,
      insert: rows => { q.rows = rows; return q; }, upsert: row => { q.rows = row; return q; },
      then(resolve, reject) {
        let result;
        if (q.rows) {
          state.writes = (state.writes ?? 0) + 1;
          if (state.writeError) result = { error: { message: 'write failed' } };
          else {
            const rows = Array.isArray(q.rows) ? q.rows : [q.rows];
            state.rows.push(...rows);
            result = { data: rows.map((row, i) => ({ ...row, id: `id-${i}` })) };
          }
        } else if (state.lookupError) result = { error: { message: 'lookup failed' } };
        else if (table === 'agents') result = { data: state.agentMissing ? null : { id: 'analyst' } };
        else if (table === 'market_briefs') result = { data: state.existing || state.rows.length ? { id: 'brief' } : null };
        else result = { data: Array.from({ length: state.existing + state.rows.length }, (_, id) => ({ id })) };
        return Promise.resolve(result).then(resolve, reject);
      } };
      if (state.agentMissing && table === 'agents') q.insert = () => ({ select: () => ({ single: async () => ({ error: {} }) }) });
      return q;
    },
  };
  const mocks = {
    'next/server': { NextResponse: Response },
    '@/lib/supabase/server': { createAdminClient: () => { state.admin = (state.admin ?? 0) + 1; return db; } },
    '@/lib/agent-credit': { hashPrediction: (...parts) => parts.join(':') },
    '@anthropic-ai/sdk': class {
      constructor(config) {
        assert.equal(config.timeout, 10_000);
        assert.equal(config.maxRetries, 0);
        this.messages = { create: async (_body, { signal }) => {
          state.ai++;
          assert.ok(signal instanceof AbortSignal);
          if (state.generate) await state.generate();
          if (state.aiError || signal.aborted) throw new Error('provider failed');
          return { content: [{ type: 'text', text: state.raw ?? JSON.stringify(job === 'market-brief' ? brief : predictions).slice(1) }] };
        } };
      }
    },
  };
  function load(file) {
    const code = ts.transpileModule(source(file), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    const record = { exports: {} };
    new Function('require', 'module', 'exports', 'Date', 'process', 'AbortSignal', 'fetch', code)(name => {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (name.startsWith('@/')) return load(`${name.slice(2)}.ts`);
      return require(name);
    }, record, record.exports, Clock, { env: { CRON_SECRET: 'test-secret', ANTHROPIC_API_KEY: 'test' } },
    { any: signals => AbortSignal.any(signals), timeout: ms => { state.deadlines.push(ms); return AbortSignal.timeout(ms); } },
    async (_url, { signal }) => {
      state.fetches++;
      assert.ok(signal instanceof AbortSignal);
      if (state.fetchError || signal.aborted) throw new Error('fetch failed');
      return { ok: true, json: async () => ({ price: 100_000, score: 60 }) };
    });
    return record.exports;
  }
  state.route = load(`app/api/cron/${job}/route.ts`);
  return state;
}

for (const job of jobs) {
  test(`${job}: auth and migration preflight prevent all paid work`, async () => {
    const h = harness(job, { claimError: true });
    assert.equal((await h.route.GET(new Request('https://example.test'))).status, 401);
    assert.equal(h.admin, undefined);
    const response = await h.route.GET(request());
    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /migration 015/);
    assert.equal(h.ai, 0);
    assert.equal(h.fetches, 0);
    assert.equal(h.writes, undefined);
    assert.equal(h.finishes.length, 0);
  });

  test(`${job}: simultaneous actual route calls spend once, then remain completed`, async () => {
    let release;
    let entered;
    const started = new Promise(resolve => { entered = resolve; });
    const blocked = new Promise(resolve => { release = resolve; });
    const h = harness(job, { generate: async () => { entered(); await blocked; } });
    const first = h.route.GET(request());
    await started;
    const others = await Promise.all(Array.from({ length: 12 }, () => h.route.GET(request())));
    assert.ok(others.every(response => response.status === 202));
    assert.equal(h.ai, 1);
    assert.deepEqual(h.deadlines, Array(job === 'market-brief' ? 8 : 7).fill(10_000));
    release();
    assert.equal((await first).status, 200);
    assert.equal(h.lease.status, 'completed');
    assert.equal((await h.route.GET(request())).status, 200);
    assert.equal(h.ai, 1);
    assert.equal(h.finishes.length, 1);
    assert.equal(h.finishes[0].p_completed, true);
  });

  test(`${job}: legacy daily output becomes durably completed without AI`, async () => {
    const h = harness(job, { existing: 3 });
    assert.equal((await h.route.GET(request())).status, 200);
    assert.equal(h.ai, 0);
    assert.equal(h.lease.status, 'completed');
    h.existing = 0;
    await h.route.GET(request());
    assert.equal(h.ai, 0);
  });

  for (const failure of ['lookupError', 'fetchError', 'aiError', 'writeError', 'raw']) {
    test(`${job}: ${failure} always fails the claim and permits retry`, async () => {
      const h = harness(job, { [failure]: failure === 'raw' ? 'invalid JSON' : true });
      assert.ok((await h.route.GET(request())).status >= 500);
      assert.equal(h.finishes.length, 1);
      assert.equal(h.finishes[0].p_completed, false);
      assert.equal(h.lease.status, 'failed');
      h[failure] = false;
      if (failure === 'raw') delete h.raw;
      assert.equal((await h.route.GET(request())).status, 200);
      assert.equal(h.lease.status, 'completed');
      assert.equal(h.rows.length, job === 'market-brief' ? 1 : 3);
    });
  }

  test(`${job}: validation early return fails rather than completing`, async () => {
    const h = harness(job, { raw: job === 'market-brief' ? '"headline":"x"}' : ']' });
    assert.equal((await h.route.GET(request())).status, 502);
    assert.equal(h.finishes[0].p_completed, false);
    assert.equal(h.rows.length, 0);
  });

  for (const failure of ['finishError', 'finishThrows']) {
    test(`${job}: ${failure} after durable output recovers without another AI call`, async () => {
      const h = harness(job, { [failure]: true, time: NOW - 12 * 3600000 });
      assert.equal((await h.route.GET(request())).status, 503);
      assert.equal(h.finishes[0].p_completed, true);
      assert.equal((await h.route.GET(request())).status, 202);
      h[failure] = false;
      h.time += 120_001;
      assert.equal((await h.route.GET(request())).status, 200);
      assert.equal(h.ai, 1);
      assert.equal(h.lease.status, 'completed');
    });
  }

  test(`${job}: request abort still releases the claim as failed`, async () => {
    const h = harness(job);
    const controller = new AbortController();
    controller.abort();
    assert.equal((await h.route.GET(request(controller.signal))).status, 503);
    assert.equal(h.ai, 0);
    assert.equal(h.finishes[0].p_completed, false);
  });

  test(`${job}: abort during paid work still persists failure without reusing the aborted signal`, async () => {
    const controller = new AbortController();
    const h = harness(job, { generate: async () => { controller.abort(); } });
    assert.equal((await h.route.GET(request(controller.signal))).status, 503);
    assert.equal(h.ai, 1);
    assert.equal(h.finishes[0].p_completed, false);
    assert.equal(h.lease.status, 'failed');
  });

  test(`${job}: preflight transport failure returns migration-required 503`, async () => {
    const h = harness(job, { claimThrows: true });
    const response = await h.route.GET(request());
    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /migration 015/);
    assert.equal(h.ai, 0);
    assert.equal(h.finishes.length, 0);
  });

  test(`${job}: UTC day is fixed for output even if generation crosses midnight`, async () => {
    const h = harness(job);
    h.generate = async () => { h.time += 2000; };
    assert.equal((await h.route.GET(request())).status, 200);
    assert.equal(h.finishes[0].p_day, DAY);
    assert.ok(h.rows.every(row => (row.job_day ?? row.date) === DAY));
    assert.ok(h.route.maxDuration < 120);
  });
}

test('analyst: failed agent initialization releases claim; legacy partial output only fills missing slots', async () => {
  const failed = harness('analyst-predict', { agentMissing: true });
  assert.equal((await failed.route.GET(request())).status, 500);
  assert.equal(failed.finishes[0].p_completed, false);
  for (const existing of [1, 2]) {
    const h = harness('analyst-predict', { existing });
    assert.equal((await h.route.GET(request())).status, 200);
    assert.equal(h.writes, 1, 'batch must be a single atomic insert');
    assert.equal(h.rows.length, 3 - existing);
    assert.deepEqual(h.rows.map(row => row.job_slot), [0, 1, 2].slice(existing));
  }
});

// Opt in explicitly. Only a fresh socket-only local cluster is ever contacted;
// connection env, dotenv files, remote URLs and Supabase credentials are ignored.
test('SQL: real concurrent claims, fencing, expiry, privileges and output uniqueness', {
  skip: process.env.CONTRABXND_TEST_POSTGRES !== '1', timeout: 120_000,
}, async () => {
  const root = mkdtempSync(join(process.env.CONTRABXND_TEST_TMPDIR ?? tmpdir(), 'cbjob-'));
  const data = join(root, 'data');
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('PG')));
  const run = (command, args, input) => {
    const result = spawnSync(command, args, { input, encoding: 'utf8', timeout: 30_000, env });
    assert.equal(result.status, 0, `${command}: ${result.stderr || result.error}`);
    return result.stdout.trim();
  };
  const args = ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '-v', 'VERBOSITY=verbose', '-h', root, '-p', '55441', '-U', 'postgres', '-d', 'postgres'];
  const sql = text => run('psql', args, text);
  const service = text => sql(`set role service_role; ${text}`);
  const claim = (job = 'analyst-predict', day = DAY) => JSON.parse(service(`select public.claim_ai_job('${job}', '${day}');`));
  let started = false;
  const children = [];
  try {
    run('initdb', ['-D', data, '-U', 'postgres', '-A', 'trust', '--no-locale']);
    run('pg_ctl', ['-D', data, '-l', join(root, 'server.log'), '-o', `-F -h '' -k ${root} -p 55441`, '-w', 'start']);
    started = true;
    sql(`create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql as 'select null::uuid';
      grant usage on schema public, auth to anon, authenticated, service_role;
      alter default privileges in schema public grant all on tables to anon, authenticated, service_role;`);
    sql(source('supabase/migrations/008_market_briefs.sql'));
    sql(source('supabase/migrations/009_agents.sql'));
    sql(source('supabase/migrations/015_ai_job_leases.sql'));
    for (const role of ['anon', 'authenticated']) {
      for (const query of ["select * from public.ai_job_leases", `select public.claim_ai_job('market-brief', '${DAY}')`,
        `select public.finish_ai_job('market-brief', '${DAY}', gen_random_uuid(), true)`]) {
        assert.throws(() => sql(`set role ${role}; ${query};`), /42501/);
      }
    }
    // Independent database sessions race on the unique job/day row.
    const claims = await Promise.all(Array.from({ length: 16 }, () => new Promise((resolve, reject) => {
      const child = spawn('psql', args, { env, stdio: ['pipe', 'pipe', 'pipe'] });
      children.push(child);
      let output = ''; let error = '';
      child.stdout.on('data', chunk => { output += chunk; });
      child.stderr.on('data', chunk => { error += chunk; });
      child.on('error', reject);
      child.on('exit', code => code ? reject(new Error(error)) : resolve(JSON.parse(output.trim())));
      child.stdin.end(`set role service_role; select public.claim_ai_job('analyst-predict', '${DAY}');`);
    })));
    assert.equal(claims.filter(row => row.status === 'claimed').length, 1);
    assert.equal(claims.filter(row => row.status === 'busy').length, 15);
    const first = claims.find(row => row.token);
    assert.equal(sql(`select lease_until > clock_timestamp() + interval '60 seconds' from public.ai_job_leases;`), 't');
    assert.equal(claim('market-brief').status, 'claimed', 'different jobs are independent');
    assert.equal(claim('analyst-predict', '2026-11-10').status, 'claimed', 'different UTC days are independent');
    assert.equal(service(`select public.finish_ai_job('analyst-predict', '2026-11-10', gen_random_uuid(), true);`), 'f');
    sql(`update public.ai_job_leases set lease_until = clock_timestamp() - interval '1 second' where day = '${DAY}' and job = 'analyst-predict';`);
    assert.equal(service(`select public.finish_ai_job('analyst-predict', '${DAY}', '${first.token}', true);`), 'f', 'expired owner cannot finish even before takeover');
    const recovered = claim();
    assert.equal(recovered.status, 'claimed');
    assert.notEqual(first.token, recovered.token);
    const finish = (token, completed) => service(`select public.finish_ai_job('analyst-predict', '${DAY}', '${token}', ${completed});`);
    assert.equal(finish(first.token, true), 'f', 'stale owner cannot complete recovered work');
    assert.equal(finish(first.token, false), 'f', 'stale owner cannot release a newer claim');
    assert.equal(finish(recovered.token, false), 't');
    const retry = claim();
    assert.equal(retry.status, 'claimed');
    assert.equal(finish(retry.token, true), 't');
    assert.equal(claim().status, 'completed');
    assert.equal(finish(retry.token, false), 'f', 'completion cannot be undone');

    sql(`insert into public.agents(id, name) values ('00000000-0000-0000-0000-000000000001', 'Analyst');`);
    const row = slot => `('00000000-0000-0000-0000-000000000001', 'hash', 'text', 0.7, now(), '${DAY}', ${slot})`;
    const insert = values => `insert into public.agent_predictions(agent_id, prediction_hash, prediction_text, confidence, target_date, job_day, job_slot) values ${values};`;
    sql(insert(row(0)));
    assert.throws(() => sql(insert(`${row(1)}, ${row(0)}`)), /23505/);
    assert.equal(sql('select count(*) from public.agent_predictions;'), '1', 'batch failure leaves no partial writes');
    sql(insert(`${row(1)}, ${row(2)}`));
    assert.equal(sql('select count(*) from public.agent_predictions;'), '3');
    sql(`insert into public.market_briefs(date, headline, summary) values ('${DAY}', 'headline', 'summary');`);
    assert.throws(() => sql(`insert into public.market_briefs(date, headline, summary) values ('${DAY}', 'duplicate', 'summary');`), /23505/);
  } finally {
    for (const child of children) if (child.exitCode === null) child.kill();
    if (started) run('pg_ctl', ['-D', data, '-m', 'immediate', '-w', 'stop']);
    rmSync(root, { recursive: true, force: true });
  }
});
