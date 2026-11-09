import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

// Opt in with CONTRABXND_TEST_POSTGRES=1 and put initdb/pg_ctl/psql on PATH.
// Only this newly initialized, socket-only cluster is used. No connection URLs,
// dotenv files, Supabase credentials, or existing PostgreSQL servers are read.
test('complete migrations 001-015 secure a disposable PostgreSQL database', {
  skip: process.env.CONTRABXND_TEST_POSTGRES !== '1', timeout: 120_000,
}, async t => {
  const root = mkdtempSync(join(process.env.CONTRABXND_TEST_TMPDIR ?? tmpdir(), 'cbmig-'));
  const data = join(root, 'data');
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('PG')));
  const run = (command, args, input) => {
    const result = spawnSync(command, args, { input, encoding: 'utf8', timeout: 30_000, env });
    assert.equal(result.status, 0, `${command}: ${result.stderr || result.error}`);
    return result.stdout.trim();
  };
  const args = ['-X', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=1', '-v', 'VERBOSITY=verbose',
    '-h', root, '-p', '55440', '-U', 'postgres', '-d', 'postgres'];
  const query = sql => run('psql', args, sql);
  const owner = '00000000-0000-0000-0000-000000000001';
  const other = '00000000-0000-0000-0000-000000000002';
  const asUser = (sql, user = owner) => query(`set role authenticated; set request.jwt.claim.sub = '${user}'; ${sql}`);
  const denied = action => assert.throws(action, /42501/, 'expected permission/RLS denial, not a SQL or fixture error');
  const invalid = action => assert.throws(action, /23514/, 'expected check constraint rejection');
  const marketTables = ['etf_snapshots', 'fedwatch_snapshots', 'liquidity_snapshots', 'slr_snapshots',
    'polymarket_snapshots', 'onchain_snapshots', 'market_briefs', 'agent_predictions', 'agent_credit_scores'];
  const ownedTables = ['lesson_progress', 'price_alerts', 'push_subscriptions', 'bookmarks', 'highlights'];
  let started = false;
  try {
    run('initdb', ['-D', data, '-U', 'postgres', '-A', 'trust', '--no-locale']);
    run('pg_ctl', ['-D', data, '-l', join(root, 'server.log'), '-o', `-F -h '' -k ${root} -p 55440`, '-w', 'start']);
    started = true;
    query(`
      create role anon nologin;
      create role authenticated nologin;
      create role service_role nologin bypassrls;
      create schema auth;
      create table auth.users (
        id uuid primary key, email text, raw_user_meta_data jsonb not null default '{}'
      );
      create function auth.uid() returns uuid language sql stable as
        'select nullif(current_setting(''request.jwt.claim.sub'', true), '''')::uuid';
      grant usage on schema auth, public to anon, authenticated, service_role;
      grant execute on function auth.uid() to anon, authenticated, service_role;
      -- Supabase's broad default grants must not mask missing REVOKEs in 013.
      alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
      alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
      insert into auth.users(id, email, raw_user_meta_data)
        values ('${owner}', 'owner@example.com', '{"full_name":"Backfilled Owner"}');
    `);
    const directory = fileURLToPath(new URL('../supabase/migrations/', import.meta.url));
    const files = readdirSync(directory).filter(name => /^(00[1-9]|01[0-5])_.*\.sql$/.test(name)).sort();
    assert.deepEqual(files.map(name => name.slice(0, 3)),
      Array.from({ length: 15 }, (_, i) => String(i + 1).padStart(3, '0')));
    for (const file of files) {
      if (file.startsWith('013_')) {
        assert.equal(query("select to_regclass('public.network_applications') is null and to_regclass('public.subscribers') is null;"), 't');
        query(`
          grant select (email), update (email) on public.profiles to public, anon, authenticated;
          grant select (key_hash), update (key_hash) on public.api_keys to public, anon, authenticated;
          create policy "Unknown legacy policy" on public.bookmarks for all to public using (true) with check (true);
        `);
      }
      // Execute each entire checked-in file, including transactions and triggers.
      run('psql', [...args, '-f', join(directory, file)]);
    }

    await t.test('profile backfill and post-hardening signup trigger both work', () => {
      assert.equal(asUser('select email, display_name from public.profiles;'), 'owner@example.com|Backfilled Owner');
      query(`insert into auth.users(id, email, raw_user_meta_data)
        values ('${other}', 'other@example.com', '{"display_name":"New Signup"}');`);
      assert.equal(asUser('select email, display_name from public.profiles;', other), 'other@example.com|New Signup');
      asUser("update public.profiles set display_name = 'Renamed';");
      assert.equal(asUser('select display_name from public.profiles;'), 'Renamed');
      denied(() => asUser("update public.profiles set email = 'spoof@example.com';"));
      denied(() => asUser("update public.profiles set created_at = '2000-01-01';"));
      assert.equal(asUser(`with changed as (update public.profiles set display_name = 'stolen' where id = '${other}' returning id) select count(*) from changed;`), '0');
    });

    const fixtures = [
      ['lesson_progress', 'user_id, course_slug, lesson_slug', "'course', 'lesson'", "completed = true"],
      ['price_alerts', 'user_id, target_price, direction', "100000, 'above'", 'target_price = 110000'],
      ['push_subscriptions', 'user_id, endpoint, p256dh, auth', "'https://push.example/' || '%USER%', 'p256dh', 'secret'", "p256dh = 'updated'"],
      ['bookmarks', 'user_id, content_type, content_slug', "'article', 'article'", "content_slug = 'updated'"],
      ['highlights', 'user_id, content_type, content_slug, text', "'article', 'article', 'selection'", "note = 'updated'"],
    ];
    await t.test('owner CRUD, cross-user RLS, transfers and upserts use actual policies', () => {
      for (const [table, columns, values, assignment] of fixtures) {
        const insert = user => `insert into public.${table}(${columns}) values ('${user}', ${values.replace('%USER%', user)});`;
        asUser(insert(owner));
        asUser(insert(other), other);
        assert.equal(asUser(`select count(*) from public.${table};`), '1', table);
        assert.equal(asUser(`select count(*) from public.${table} where user_id = '${other}';`), '0', table);
        assert.equal(asUser(`with changed as (update public.${table} set ${assignment} where user_id = '${other}' returning id) select count(*) from changed;`), '0', table);
        assert.equal(asUser(`with removed as (delete from public.${table} where user_id = '${other}' returning id) select count(*) from removed;`), '0', table);
        denied(() => asUser(insert(other)));
        denied(() => asUser(`update public.${table} set user_id = '${other}';`));
        assert.equal(asUser(`with changed as (update public.${table} set ${assignment} returning id) select count(*) from changed;`), '1', table);
        denied(() => asUser(`update public.${table} set created_at = '2000-01-01';`));
      }
      asUser(`insert into public.lesson_progress(user_id, course_slug, lesson_slug, completed, completed_at)
        values ('${owner}', 'course', 'lesson', true, now()) on conflict (user_id, course_slug, lesson_slug)
        do update set user_id = excluded.user_id, completed = excluded.completed, completed_at = excluded.completed_at;`);
      asUser(`insert into public.push_subscriptions(user_id, endpoint, p256dh, auth)
        values ('${owner}', 'https://push.example/${owner}', 'upserted', 'secret') on conflict (endpoint)
        do update set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth;`);
      denied(() => asUser(`insert into public.push_subscriptions(user_id, endpoint, p256dh, auth)
        values ('${owner}', 'https://push.example/${other}', 'stolen', 'secret') on conflict (endpoint)
        do update set user_id = excluded.user_id, p256dh = excluded.p256dh;`));
      denied(() => asUser('update public.price_alerts set triggered = true;'));
      for (const table of ownedTables) {
        assert.equal(asUser(`with removed as (delete from public.${table} returning id) select count(*) from removed;`), '1', table);
        assert.equal(asUser(`select count(*) from public.${table};`, other), '1', table);
      }
    });

    await t.test('anon has no private grants and server-only storage has no client grants', () => {
      for (const table of [...ownedTables, 'profiles', 'api_keys', 'network_applications', 'subscribers', 'ai_usage', 'api_rate_limits', 'ai_job_leases']) {
        assert.equal(query(`select has_any_column_privilege('anon', 'public.${table}', 'SELECT,INSERT,UPDATE,REFERENCES')
          or has_table_privilege('anon', 'public.${table}', 'DELETE,TRUNCATE,TRIGGER');`), 'f', table);
        denied(() => query(`set role anon; select * from public.${table};`));
      }
      for (const role of ['anon', 'authenticated']) {
        for (const table of ['subscribers', 'ai_usage', 'api_rate_limits', 'ai_job_leases']) {
          denied(() => query(`set role ${role}; select * from public.${table};`));
          denied(() => query(`set role ${role}; insert into public.${table} default values;`));
        }
        assert.equal(query(`select has_sequence_privilege('${role}', 'public.ai_usage_id_seq', 'USAGE,SELECT,UPDATE');`), 'f');
        denied(() => query(`set role ${role}; select * from public.consume_ai_quota('analyst', repeat('a', 64), null);`));
        denied(() => query(`set role ${role}; select * from public.consume_api_rate_limit('private', 2, 60000);`));
        denied(() => query(`set role ${role}; select public.claim_ai_job('market-brief', '2026-11-09');`));
        denied(() => query(`set role ${role}; select public.finish_ai_job('market-brief', '2026-11-09', gen_random_uuid(), true);`));
      }
      assert.equal(query("select count(*) from pg_policies where schemaname = 'public' and 'public' = any(roles);"), '0');
      assert.equal(query("select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;"), '0');
    });

    await t.test('daily AI leases remain service-only and durable across separate sessions', () => {
      const service = sql => query(`set role service_role; ${sql}`);
      const claim = () => JSON.parse(service("select public.claim_ai_job('market-brief', '2026-11-09');"));
      const first = claim();
      assert.equal(first.status, 'claimed');
      assert.match(first.token, /^[0-9a-f-]{36}$/);
      assert.equal(claim().status, 'busy');
      assert.equal(service(`select status, claim_token = '${first.token}',
        lease_until > clock_timestamp() + interval '60 seconds', completed_at is null
        from public.ai_job_leases where job = 'market-brief' and day = '2026-11-09';`), 'running|t|t|t');
      for (const role of ['anon', 'authenticated']) {
        denied(() => query(`set role ${role}; select claim_token from public.ai_job_leases;`));
        denied(() => query(`set role ${role}; update public.ai_job_leases set status = 'completed';`));
        denied(() => query(`set role ${role}; delete from public.ai_job_leases;`));
      }
      const finish = (token, completed) => service(`select public.finish_ai_job('market-brief', '2026-11-09', '${token}', ${completed});`);
      assert.equal(finish(owner, true), 'f', 'unrelated token cannot complete a claim');
      assert.equal(finish(first.token, false), 't');
      assert.equal(service("select status, lease_until is null, claim_token is null from public.ai_job_leases;"), 'failed|t|t');
      const retry = claim();
      assert.equal(retry.status, 'claimed');
      assert.notEqual(retry.token, first.token);
      assert.equal(finish(first.token, true), 'f');
      assert.equal(finish(retry.token, true), 't');
      assert.equal(service("select status, completed_at is not null, lease_until is null, claim_token is null from public.ai_job_leases;"), 'completed|t|t|t');
      assert.equal(claim().status, 'completed');
      assert.equal(finish(retry.token, false), 'f');
    });

    await t.test('market data stays public read-only, including migration 012', () => {
      query(`set role service_role;
        insert into public.etf_snapshots(ticker, date, fund_name, nav_per_share, shares_outstanding, total_net_assets, source)
          values ('TEST', current_date, 'Test Fund', 1, 1, 1, 'fixture');
        insert into public.fedwatch_snapshots(date, current_rate, target_lower, target_upper) values (current_date, 1, 1, 2);
        insert into public.liquidity_snapshots(date) values (current_date);
        insert into public.slr_snapshots(date) values (current_date);
        insert into public.polymarket_snapshots(date, market_id, question) values (current_date, 'fixture', 'Question?');
        insert into public.onchain_snapshots(date) values (current_date);
        insert into public.market_briefs(date, headline, summary) values (current_date, 'Headline', 'Summary');
        insert into public.agents(id, owner_id, name) values ('00000000-0000-0000-0000-000000000003', '${owner}', 'Owner Agent');
        insert into public.agent_predictions(agent_id, prediction_hash, prediction_text, confidence, target_date)
          values ('00000000-0000-0000-0000-000000000003', 'hash', 'prediction', 0.5, now());
        insert into public.agent_credit_scores(agent_id) values ('00000000-0000-0000-0000-000000000003');
      `);
      for (const role of ['anon', 'authenticated']) {
        for (const table of marketTables) {
          assert.equal(query(`set role ${role}; select count(*) from public.${table};`), '1', `${role}: ${table}`);
          denied(() => query(`set role ${role}; insert into public.${table} default values;`));
          denied(() => query(`set role ${role}; delete from public.${table};`));
          const column = table === 'agent_credit_scores' ? 'agent_id' : 'id';
          denied(() => query(`set role ${role}; update public.${table} set ${column} = ${column};`));
        }
      }
    });

    await t.test('agent metadata is mutable but ownership and reputation are not', () => {
      assert.equal(query('set role anon; select name from public.agents;'), 'Owner Agent');
      denied(() => query('set role anon; select owner_id from public.agents;'));
      asUser("update public.agents set description = 'safe', status = 'inactive';");
      assert.equal(query('set role anon; select count(id) from public.agents;'), '0');
      assert.equal(asUser('select name from public.agents;'), 'Owner Agent');
      assert.equal(asUser('select count(id) from public.agents;', other), '0');
      for (const assignment of ["verified = true", "featured = true", `owner_id = '${other}'`, "created_at = '2000-01-01'"]) {
        denied(() => asUser(`update public.agents set ${assignment};`));
      }
      denied(() => asUser(`insert into public.agents(owner_id, name) values ('${owner}', 'forged');`));
      asUser("update public.agents set status = 'active';");
      assert.equal(asUser("with changed as (update public.agents set name = 'stolen' returning id) select count(*) from changed;", other), '0');
      assert.equal(asUser('with removed as (delete from public.agents returning id) select count(*) from removed;', other), '0');
    });

    await t.test('API key listing hides hashes and only permits irreversible own-key revocation', () => {
      query(`set role service_role; insert into public.api_keys(user_id, key_hash, key_prefix)
        values ('${owner}', 'owner-hash', 'owner-prefix'), ('${other}', 'other-hash', 'other-prefix');`);
      assert.equal(asUser('select key_prefix, tier from public.api_keys;'), 'owner-prefix|free');
      denied(() => asUser('select key_hash from public.api_keys;'));
      for (const assignment of ["tier = 'paid'", "key_hash = 'replacement'", `user_id = '${other}'`, "key_prefix = 'forged'", "created_at = '2000-01-01'"]) {
        denied(() => asUser(`update public.api_keys set ${assignment}, revoked_at = now();`));
      }
      denied(() => asUser(`insert into public.api_keys(user_id, key_hash, key_prefix) values ('${owner}', 'forged', 'forged');`));
      assert.equal(asUser(`with changed as (update public.api_keys set revoked_at = now() where user_id = '${other}' returning id) select count(*) from changed;`), '0');
      assert.equal(asUser('with changed as (update public.api_keys set revoked_at = now() returning id) select count(*) from changed;'), '1');
      assert.equal(asUser('with changed as (update public.api_keys set revoked_at = null returning id) select count(*) from changed;'), '0');
      assert.equal(asUser('select revoked_at is not null from public.api_keys;'), 't');
      assert.equal(asUser('select revoked_at is null from public.api_keys;', other), 't');
      // Even accidental future grants cannot bypass the immutable-field trigger.
      query('grant update (tier, key_hash) on public.api_keys to authenticated;');
      denied(() => asUser("update public.api_keys set tier = 'paid', revoked_at = now();", other));
      query('revoke update (tier, key_hash) on public.api_keys from authenticated;');
      query("set role service_role; update public.api_keys set tier = 'paid';");
    });

    await t.test('previously missing network/subscriber schemas accept real fields and reject invalid state', () => {
      const application = (user, website, status = 'pending') => `insert into public.network_applications
        (business_name, website, category, description, contact_email, payment_method, user_id, status)
        values ('Merchant', '${website}', 'Retail', 'Description', 'merchant@example.com', 'lightning', '${user}', '${status}');`;
      asUser(application(owner, 'https://owner.example'));
      asUser(application(other, 'https://other.example'), other);
      assert.equal(asUser('select website, status from public.network_applications;'), 'https://owner.example|pending');
      denied(() => asUser(application(other, 'https://spoof.example')));
      denied(() => asUser(application(owner, 'https://approved.example', 'approved')));
      denied(() => asUser("update public.network_applications set status = 'approved';"));
      for (const assignment of ["category = 'invalid'", "payment_method = 'fiat'", "status = 'verified'"]) {
        invalid(() => query(`set role service_role; update public.network_applications set ${assignment};`));
      }
      query("set role service_role; insert into public.subscribers(email) values ('reader@example.com');");
      assert.throws(() => query("set role service_role; insert into public.subscribers(email) values ('reader@example.com');"), /23505/);
      invalid(() => query("set role service_role; insert into public.subscribers(email) values (' READER@EXAMPLE.COM ');"));
      assert.equal(query(`set role service_role; select allowed, remaining, retry_after from public.consume_ai_quota('analyst', repeat('a', 64), '${owner}');`), 't|24|0');
      assert.match(query("set role service_role; select * from public.consume_api_rate_limit('full-chain', 2, 60000);"), /^t\|1\|/);
    });
  } finally {
    if (started) run('pg_ctl', ['-D', data, '-m', 'immediate', '-w', 'stop']);
    rmSync(root, { recursive: true, force: true });
  }
});
