import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { test } from 'node:test';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
function load(file, mocks = {}, bindings = {}) {
  const code = ts.transpileModule(source(file), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const loaded = { exports: {} };
  new Function('require', 'module', 'exports', ...Object.keys(bindings), code)(
    name => Object.hasOwn(mocks, name) ? mocks[name] : require(name), loaded, loaded.exports, ...Object.values(bindings),
  );
  return loaded.exports;
}
const validation = load('lib/push/validation.ts');
const now = Date.parse('2026-11-09T12:00:00Z');
const freshPrice = { data: { price: 100_000 }, updatedAt: new Date(now).toISOString(), cached: false };
const delivery = {
  id: 'delivery-1', alert_id: 'alert-1', claim_token: 'claim-1', channel: 'email',
  payload: { email: 'owner@example.test' }, event: { target_price: 90_000, direction: 'above', price: 100_000 },
};
function alerts({ price = freshPrice, fetch = async () => ({ ok: true }), push = async () => {}, env = { RESEND_API_KEY: 'test' } } = {}) {
  return load('lib/alerts.ts', {
    '@/lib/price': { getBitcoinPrice: async () => price },
    '@/lib/push/sendPush': { sendPushNotification: push },
  }, { fetch, process: { env }, Date: class extends Date { static now() { return now; } } });
}

test('provider allowlist rejects SSRF, credentials, fragments, ports, and lookalike suffixes', () => {
  for (const endpoint of [
    'https://fcm.googleapis.com/fcm/send/token', 'https://updates.push.services.mozilla.com/wpush/v2/token',
    'https://updates-autopush.us-east-1.push.services.mozilla.com/wpush/v2/token', 'https://web.push.apple.com/token',
  ]) assert.equal(validation.validPushEndpoint(endpoint), true, endpoint);
  for (const endpoint of [
    null, '', 'http://fcm.googleapis.com/token', 'https://127.0.0.1/token', 'https://[::1]/token',
    'https://169.254.169.254/latest', 'https://evil.test/token', 'https://fcm.googleapis.com.evil.test/token',
    'https://evilpush.services.mozilla.com/token', 'https://fcm.googleapis.com:8443/token',
    'https://user:secret@fcm.googleapis.com/token', 'https://fcm.googleapis.com/token#fragment',
    'https://fcm.googleapis.com./token', 'https://fcm.googleapis.com/' + 'x'.repeat(4096),
  ]) assert.equal(validation.validPushEndpoint(endpoint), false, String(endpoint));
});

test('send revalidates direct database subscriptions before any request and sanitizes failures', async () => {
  let generated = 0;
  let requested = 0;
  const push = load('lib/push/sendPush.ts', {
    './validation': validation,
    'web-push': { generateRequestDetails: () => { generated++; return { headers: {}, body: Buffer.from('encrypted') }; } },
  }, {
    process: { env: { NEXT_PUBLIC_VAPID_PUBLIC_KEY: 'public', VAPID_PRIVATE_KEY: 'secret' } },
    fetch: async (_url, options) => {
      requested++;
      assert.equal(options.redirect, 'error');
      assert.ok(options.signal instanceof AbortSignal);
      throw new Error('https://secret-endpoint.test and auth-key');
    },
  });
  await assert.rejects(push.sendPushNotification({ endpoint: 'https://127.0.0.1', p256dh: 'a', auth: 'b' }, {}), /push_invalid_subscription/);
  assert.equal(generated, 0);
  assert.equal(requested, 0);
  await assert.rejects(push.sendPushNotification({ endpoint: 'https://fcm.googleapis.com/token', p256dh: 'a', auth: 'b' }, {}), /^Error: push_delivery_failed$/);
  assert.equal(requested, 1);
});

test('fresh prices reject stale, invalid, future, and over-age authoritative timestamps', () => {
  const { freshAlertPrice } = alerts();
  assert.equal(freshAlertPrice(freshPrice, now), true);
  for (const price of [null, { ...freshPrice, stale: true }, { ...freshPrice, updatedAt: 'invalid' },
    { ...freshPrice, updatedAt: new Date(now + 1).toISOString() },
    { ...freshPrice, updatedAt: new Date(now - 120_001).toISOString() },
    { ...freshPrice, data: { price: NaN } }, { ...freshPrice, data: { price: 0 } },
  ]) assert.equal(freshAlertPrice(price, now), false);
});

test('Resend retries keep the same deterministic key and immutable body, with deadline and no redirects', async () => {
  const calls = [];
  const { sendAlertDelivery } = alerts({ fetch: async (url, options) => {
    calls.push({ url, options });
    return { ok: calls.length > 1 };
  } });
  await assert.rejects(sendAlertDelivery(delivery), /email_delivery_failed/);
  await sendAlertDelivery(delivery);
  assert.equal(calls[0].url, 'https://api.resend.com/emails');
  assert.equal(calls[0].options.headers['Idempotency-Key'], 'price-alert/alert-1/email');
  assert.equal(calls[0].options.body, calls[1].options.body);
  assert.equal(calls[0].options.redirect, 'error');
  assert.ok(calls[0].options.signal instanceof AbortSignal);
  await assert.rejects(alerts({ env: {} }).sendAlertDelivery(delivery), /email_unavailable/);
  await assert.rejects(sendAlertDelivery({ ...delivery, payload: null }), /recipient_unavailable/);
});

test('user-scoped worker persists send failure then retries without re-evaluating a stale price', async () => {
  const calls = [];
  let claimed = false;
  let fail = true;
  const db = { from: () => ({ select: () => ({ eq: (column, owner) => ({ in: async (_column, ids) => {
    assert.equal(column, 'user_id');
    assert.equal(owner, 'owner-id');
    assert.deepEqual(ids, ['alert-1']);
    return { data: [{ id: 'alert-1', triggered: true }] };
  } }) }) }), rpc: async (name, args) => {
    calls.push({ name, args });
    if (name === 'queue_price_alerts') return { data: { queued: 1, checked: 1 } };
    if (name === 'claim_alert_delivery') {
      if (claimed) return { data: null };
      claimed = true;
      return { data: delivery };
    }
    return { data: !args.p_error };
  } };
  const options = { fetch: async () => ({ ok: !fail }) };
  let response = await alerts(options).checkAlerts(db, 'owner-id');
  assert.equal(response.status, 200);
  assert.equal((await response.json()).retrying, 1);
  assert.equal(calls.at(-2).args.p_error, 'delivery_failed');
  assert.ok(calls.filter(call => call.name !== 'finish_alert_delivery').every(call => call.args.p_user_id === 'owner-id'));
  calls.length = 0;
  claimed = false;
  fail = false;
  response = await alerts({ ...options, price: { ...freshPrice, stale: true } }).checkAlerts(db, 'owner-id');
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.triggered, 1);
  assert.deepEqual(body.alerts, [{ id: 'alert-1', triggered: true }]);
  assert.equal(calls.some(call => call.name === 'queue_price_alerts'), false);
  assert.equal(calls.at(-2).args.p_error, null);
});

test('persistence errors return generic 503, leaving the lease for crash recovery', async () => {
  const logs = [];
  const calls = [];
  const worker = load('lib/alerts.ts', {
    '@/lib/price': { getBitcoinPrice: async () => freshPrice },
    '@/lib/push/sendPush': { sendPushNotification: async () => {} },
  }, { console: { error: message => logs.push(message) },
    Date: class extends Date { static now() { return now; } },
    fetch: async () => ({ ok: true }), process: { env: { RESEND_API_KEY: 'test' } },
  });
  const response = await worker.checkAlerts({ rpc: async (name, args) => {
    calls.push({ name, args });
    if (name === 'queue_price_alerts') return { data: { queued: 1, checked: 1 } };
    if (name === 'claim_alert_delivery') return { data: delivery };
    return { error: { message: 'secret endpoint and keys' } };
  } });
  assert.equal(response.status, 503);
  assert.equal(calls.at(-1).name, 'finish_alert_delivery');
  assert.equal(calls.at(-1).args.p_error, null, 'successful send must not be treated as a provider failure');
  assert.equal(JSON.stringify(logs).includes('secret'), false);
});

test('user check uses only verified ownership; cronGuard denies before creating service client', async () => {
  const calls = [];
  let auth = { user: { id: 'owner' }, supabase: 'unprivileged' };
  const userRoute = load('app/api/alerts/check/route.ts', {
    'next/server': { NextResponse: Response },
    '@/lib/supabase/auth': { requireUser: async () => auth },
    '@/lib/supabase/server': { createAdminClient: () => 'service' },
    '@/lib/alerts': { checkAlerts: async (...args) => { calls.push(args); return Response.json({}); } },
  });
  await userRoute.POST(new Request('https://example.test', { method: 'POST', body: '{"userId":"victim","price":1}' }));
  assert.deepEqual(calls, [['service', 'owner']]);
  auth = { error: Response.json({}, { status: 401 }) };
  assert.equal((await userRoute.POST()).status, 401);
  const guards = load('lib/audit-guards.ts', {}, { process: { env: { CRON_SECRET: 'test-secret' } } });
  const cron = load('app/api/cron/alerts-check/route.ts', {
    '@/lib/audit-guards': guards,
    '@/lib/supabase/server': { createAdminClient: () => { calls.push('admin'); return 'service'; } },
    '@/lib/alerts': { checkAlerts: async (...args) => { calls.push(args); return Response.json({}); } },
  });
  assert.equal((await cron.GET(new Request('https://example.test'))).status, 401);
  assert.equal(calls.length, 1);
  await cron.GET(new Request('https://example.test', { headers: { authorization: 'Bearer test-secret' } }));
  assert.deepEqual(calls.at(-1), ['service']);
  const config = JSON.parse(source('vercel.json'));
  assert.equal(config.crons.find(job => job.path === '/api/cron/alerts-check').schedule, '*/5 * * * *');
});

test('subscription validation edits remain enforced; unsafe endpoints never reach storage', async () => {
  let writes = 0;
  const route = load('app/api/push/subscribe/route.ts', {
    'next/server': { NextResponse: Response },
    '@/lib/supabase/auth': {
      requireUser: async () => ({ user: { id: 'owner' }, supabase: { from: () => ({ upsert: async (row, options) => {
        writes++;
        assert.equal(row.user_id, 'owner');
        assert.equal(options.onConflict, 'endpoint');
        return {};
      } }) } }),
      readJson: async request => ({ body: await request.json() }),
    },
    '@/lib/push/validation': validation,
  });
  const post = subscription => route.POST(new Request('https://example.test', { method: 'POST', body: JSON.stringify({ subscription }) }));
  for (const subscription of [null, {}, { endpoint: 'https://fcm.googleapis.com/token', keys: { p256dh: '!', auth: 'b' } },
    { endpoint: 'https://localhost/token', keys: { p256dh: 'a', auth: 'b' } },
  ]) assert.equal((await post(subscription)).status, 400);
  assert.equal(writes, 0);
  assert.equal((await post({ endpoint: 'https://fcm.googleapis.com/token', keys: { p256dh: 'a', auth: 'b' } })).status, 200);
  assert.equal(writes, 1);
});

test('alert creation uses service client and verified owner without writing user-supplied delivery fields', async () => {
  const rows = [];
  const route = load('app/api/alerts/route.ts', {
    'next/server': { NextResponse: Response },
    '@/lib/supabase/auth': {
      requireUser: async () => ({ user: { id: 'owner' }, supabase: { from() { throw new Error('must use service insert'); } } }),
      readJson: async request => ({ body: await request.json() }),
    },
    '@/lib/supabase/server': { createAdminClient: () => ({ from: () => ({ insert: row => {
      rows.push(row);
      return { select: () => ({ single: async () => ({ data: row }) }) };
    } }) }) },
  });
  const post = body => route.POST(new Request('https://example.test', { method: 'POST', body: JSON.stringify(body) }));
  for (const body of [null, { targetPrice: 0, direction: 'above' }, { targetPrice: 100, direction: 'sideways' },
    { targetPrice: 100, direction: 'above', notifyEmail: 'yes' },
  ]) assert.equal((await post(body)).status, 400);
  assert.equal(rows.length, 0);
  assert.equal((await post({ targetPrice: 100, direction: 'above', user_id: 'victim', triggered: true, delivery_status: 'delivered' })).status, 200);
  assert.deepEqual(rows[0], { user_id: 'owner', target_price: 100, direction: 'above', notify_email: true, notify_push: false });
});

// SQL runs only against a new, socket-only temporary cluster. Never uses .env,
// PGHOST, DATABASE_URL, Supabase credentials, or an existing database.
test('SQL fixtures: ownership, privileges, atomic matching/claims, leases, retries, per-device completion', async t => {
  try { execFileSync('initdb', ['--version'], { stdio: 'ignore' }); }
  catch { t.skip('Local PostgreSQL initdb/pg_ctl/psql required for SQL fixtures'); return; }
  const dir = mkdtempSync(join(tmpdir(), 'alerts-test-'));
  const data = join(dir, 'data');
  const args = ['-X', '-h', dir, '-p', '5432', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-At'];
  const sql = text => execFileSync('psql', args, { input: text, encoding: 'utf8', env: { ...process.env, PGPASSWORD: '', PGOPTIONS: '' } }).trim();
  let started = false;
  const holders = [];
  async function hold(query) {
    const child = spawn('psql', args, { stdio: ['pipe', 'pipe', 'pipe'] });
    holders.push(child);
    const ready = new Promise((resolve, reject) => {
      let output = '';
      child.stdout.on('data', chunk => { output += chunk; if (output.includes('READY')) resolve(); });
      child.on('error', reject);
      child.on('exit', code => { if (code) reject(new Error(`holder exited ${code}`)); });
    });
    child.stdin.write(`begin; ${query}; select 'READY';\n`);
    await ready;
    return async () => {
      const exited = new Promise(resolve => child.on('exit', resolve));
      child.stdin.end('commit;\n');
      await exited;
    };
  }
  try {
    execFileSync('initdb', ['-D', data, '-U', 'postgres', '-A', 'trust', '--no-locale'], { stdio: 'ignore' });
    execFileSync('pg_ctl', ['-D', data, '-l', join(dir, 'postgres.log'), '-o', `-F -k ${dir} -p 5432 -c listen_addresses=''`, '-w', 'start'], { stdio: 'ignore' });
    started = true;
    sql(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth;
      create table auth.users(id uuid primary key, email text);
      create table public.price_alerts(
        id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users,
        target_price numeric not null, direction text not null, notify_email boolean not null default true,
        notify_push boolean not null default false, triggered boolean not null default false,
        triggered_at timestamptz, created_at timestamptz default now()
      );
      create table public.push_subscriptions(id uuid primary key default gen_random_uuid(),
        user_id uuid not null references auth.users, endpoint text unique, p256dh text, auth text);
      grant select on public.price_alerts to authenticated;
      grant insert(user_id,target_price,direction,notify_email,notify_push),
        update(target_price,direction,notify_email,notify_push) on public.price_alerts to authenticated;
      insert into auth.users values ('00000000-0000-0000-0000-000000000001','one@example.test'),
        ('00000000-0000-0000-0000-000000000002','two@example.test');
    `);
    sql(source('supabase/migrations/014_alert_delivery.sql'));
    sql(`do $$ begin
      assert not has_function_privilege('authenticated', 'public.queue_price_alerts(numeric,timestamptz,uuid)', 'execute');
      assert not has_function_privilege('anon', 'public.claim_alert_delivery(uuid)', 'execute');
      assert not has_function_privilege('authenticated', 'public.finish_alert_delivery(uuid,uuid,text)', 'execute');
      assert has_function_privilege('service_role', 'public.claim_alert_delivery(uuid)', 'execute');
      assert not has_table_privilege('authenticated', 'public.alert_deliveries', 'select');
      assert not has_table_privilege('anon', 'public.alert_events', 'select');
      assert not has_column_privilege('authenticated', 'public.price_alerts', 'delivery_status', 'update');
      begin perform public.queue_price_alerts(100, now() - interval '3 minutes');
        raise exception 'accepted stale price'; exception when invalid_parameter_value then null; end;
      begin perform public.queue_price_alerts('NaN', now());
        raise exception 'accepted NaN'; exception when invalid_parameter_value then null; end;
    end $$;
    insert into price_alerts(id,user_id,target_price,direction) values
      ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001',100,'above'),
      ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002',100,'below');`);
    const releaseQueue = await hold("set local role service_role; select public.queue_price_alerts(100,clock_timestamp(),'00000000-0000-0000-0000-000000000001')");
    assert.equal(JSON.parse(sql("set role service_role; select public.queue_price_alerts(100,clock_timestamp(),'00000000-0000-0000-0000-000000000001')").split('\n').at(-1)).queued, 0);
    await releaseQueue();
    assert.equal(sql('select count(*) from alert_events'), '1');
    assert.equal(sql('select count(*) from alert_deliveries'), '1');
    assert.equal(sql('select count(*) from price_alerts where triggered'), '0');
    sql(`update auth.users set email = 'changed@example.test' where id = '00000000-0000-0000-0000-000000000001';
      update price_alerts set target_price = 200, notify_email = false where id = '10000000-0000-0000-0000-000000000001';`);
    const releaseClaim = await hold("set local role service_role; select public.claim_alert_delivery('00000000-0000-0000-0000-000000000001')");
    assert.equal(sql("select public.claim_alert_delivery('00000000-0000-0000-0000-000000000001')"), '');
    await releaseClaim();
    let row = JSON.parse(sql('select row_to_json(d) from alert_deliveries d'));
    assert.equal(row.payload.email, 'one@example.test', 'recipient snapshots must not change across retries');
    assert.equal(sql(`select public.finish_alert_delivery('${row.id}','${row.claim_token}','failed')`), 'f');
    assert.equal(sql('select status from alert_deliveries'), 'retry');
    assert.equal(sql('select delivery_status from price_alerts where id = \'10000000-0000-0000-0000-000000000001\''), 'retry');
    assert.equal(sql('select public.claim_alert_delivery()'), '');
    sql("update alert_deliveries set next_attempt_at = now() - interval '1 second'");
    row = JSON.parse(sql('select public.claim_alert_delivery()'));
    assert.equal(row.event.target_price, 100, 'an alert edit must not mutate the matched event');
    const oldToken = row.claim_token;
    assert.equal(sql(`select public.finish_alert_delivery('${row.id}',gen_random_uuid())`), 'f');
    sql("update alert_deliveries set lease_until = now() - interval '1 second'");
    row = JSON.parse(sql('select public.claim_alert_delivery()'));
    assert.notEqual(row.claim_token, oldToken);
    assert.equal(sql(`select public.finish_alert_delivery('${row.id}','${oldToken}')`), 'f');
    assert.equal(sql(`select public.finish_alert_delivery('${row.id}','${row.claim_token}')`), 't');
    assert.equal(sql('select status from alert_deliveries'), 'sent');
    assert.equal(sql('select public.claim_alert_delivery()'), '');
    assert.equal(JSON.parse(sql('select public.queue_price_alerts(100,clock_timestamp())')).queued, 1);
    // The other owner is only matched by the all-user evaluator.
    assert.equal(sql('select count(*) from alert_events'), '2');
    sql(`insert into price_alerts(id,user_id,target_price,direction,notify_email,notify_push) values
      ('10000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001',100,'above',false,true);
      select public.queue_price_alerts(100,clock_timestamp(),'00000000-0000-0000-0000-000000000001');`);
    row = JSON.parse(sql("select public.claim_alert_delivery('00000000-0000-0000-0000-000000000001')"));
    assert.equal(row.payload, null);
    sql(`select public.finish_alert_delivery('${row.id}','${row.claim_token}','no subscription');
      insert into push_subscriptions(user_id,endpoint,p256dh,auth) values
      ('00000000-0000-0000-0000-000000000001','https://fcm.googleapis.com/a','a','b'),
      ('00000000-0000-0000-0000-000000000001','https://fcm.googleapis.com/b','a','b');
      update alert_deliveries set next_attempt_at = now() where recipient = 'missing';`);
    const firstDevice = JSON.parse(sql("select public.claim_alert_delivery('00000000-0000-0000-0000-000000000001')"));
    assert.equal(firstDevice.channel, 'push');
    assert.equal(sql(`select public.finish_alert_delivery('${firstDevice.id}','${firstDevice.claim_token}')`), 'f');
    const secondDevice = JSON.parse(sql("select public.claim_alert_delivery('00000000-0000-0000-0000-000000000001')"));
    assert.notEqual(secondDevice.id, firstDevice.id);
    sql(`select public.finish_alert_delivery('${secondDevice.id}','${secondDevice.claim_token}','provider failed');
      update alert_deliveries set next_attempt_at = now() where status = 'retry';`);
    const retryDevice = JSON.parse(sql("select public.claim_alert_delivery('00000000-0000-0000-0000-000000000001')"));
    assert.equal(retryDevice.id, secondDevice.id, 'successful devices are not resent');
    assert.equal(sql(`select public.finish_alert_delivery('${retryDevice.id}','${retryDevice.claim_token}')`), 't');
    assert.equal(sql("select public.claim_alert_delivery('00000000-0000-0000-0000-000000000001')"), '');
    // Deleting an alert cancels queued retries and removes the internal secrets.
    sql("delete from price_alerts where id = '10000000-0000-0000-0000-000000000002'");
    assert.equal(sql("select count(*) from alert_deliveries where status <> 'sent'"), '0');
    // All qualifying users must be durably matched at this price, not just a
    // capped first page that can disappear when the price moves next run.
    sql(`insert into price_alerts(user_id,target_price,direction,notify_email,notify_push)
      select '00000000-0000-0000-0000-000000000002',100,'above',false,false from generate_series(1,501);`);
    const batch = JSON.parse(sql('select public.queue_price_alerts(100,clock_timestamp())'));
    assert.equal(batch.queued, 501);
    assert.equal(batch.triggered_ids.length, 501);
    assert.equal(sql("select count(*) from price_alerts where delivery_status = 'pending'"), '0');
  } finally {
    for (const child of holders) if (child.exitCode === null) child.kill();
    if (started) execFileSync('pg_ctl', ['-D', data, '-m', 'immediate', '-w', 'stop'], { stdio: 'ignore' });
    rmSync(dir, { recursive: true, force: true });
  }
});
