-- Forward-only repair: rebuild the known tables' policies rather than relying
-- on policy names from manually provisioned databases. No application data is deleted.
begin;

alter table public.api_keys add column if not exists tier text not null default 'free';
alter table public.api_keys alter column tier set default 'free';
alter table public.api_keys alter column tier set not null;
do $$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.api_keys'::regclass and conname = 'api_keys_tier_check') then
    alter table public.api_keys add constraint api_keys_tier_check check (tier in ('free', 'paid'));
  end if;
end;
$$;

create table if not exists public.network_applications (
  id uuid primary key default gen_random_uuid(),
  business_name text not null check (char_length(btrim(business_name)) between 1 and 200),
  website text not null unique check (char_length(website) between 1 and 2048),
  category text not null check (category in ('E-commerce', 'SaaS', 'Services', 'Retail', 'Food & Drink', 'Travel', 'Entertainment', 'Education', 'Finance', 'Other')),
  description text check (char_length(description) <= 10000),
  contact_email text not null check (char_length(contact_email) between 3 and 254),
  payment_method text not null check (payment_method in ('lightning', 'onchain', 'both', 'processor')),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);
create index if not exists idx_network_applications_user on public.network_applications(user_id);

create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (char_length(email) between 3 and 254 and email = lower(btrim(email))),
  created_at timestamptz not null default now()
);

-- Only the server RPC writes these buckets. The expiry index makes each bounded
-- cleanup batch proportional to expired rows, not the total number of subjects.
create table public.api_rate_limits (
  bucket_key text primary key check (char_length(bucket_key) = 64),
  count integer not null check (count > 0),
  reset_at timestamptz not null
);
create index idx_api_rate_limits_expiry on public.api_rate_limits(reset_at, bucket_key);

do $$
declare
  table_name text;
  policy_row record;
  column_names text;
begin
  foreach table_name in array array[
    'etf_snapshots', 'fedwatch_snapshots', 'liquidity_snapshots', 'slr_snapshots',
    'polymarket_snapshots', 'onchain_snapshots', 'market_briefs', 'ai_usage',
    'api_keys', 'agents', 'agent_predictions', 'agent_credit_scores', 'profiles',
    'lesson_progress', 'price_alerts', 'push_subscriptions', 'bookmarks',
    'highlights', 'network_applications', 'subscribers', 'api_rate_limits'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    for policy_row in
      select policyname from pg_policies where schemaname = 'public' and tablename = table_name
    loop
      execute format('drop policy %I on public.%I', policy_row.policyname, table_name);
    end loop;
    execute format('revoke all on table public.%I from public, anon, authenticated', table_name);
    -- Table REVOKE alone does not remove pre-existing column-level grants.
    select string_agg(quote_ident(attname), ', ') into column_names
      from pg_attribute where attrelid = format('public.%I', table_name)::regclass
      and attnum > 0 and not attisdropped;
    execute format('revoke select (%s), insert (%s), update (%s), references (%s) on public.%I from public, anon, authenticated',
      column_names, column_names, column_names, column_names, table_name);
    execute format('grant all on table public.%I to service_role', table_name);
    execute format('create policy "Service role only" on public.%I for all to service_role using (true) with check (true)', table_name);
  end loop;

  foreach table_name in array array[
    'etf_snapshots', 'fedwatch_snapshots', 'liquidity_snapshots', 'slr_snapshots',
    'polymarket_snapshots', 'onchain_snapshots', 'market_briefs',
    'agent_predictions', 'agent_credit_scores'
  ] loop
    execute format('grant select on public.%I to anon, authenticated', table_name);
    execute format('create policy "Public read" on public.%I for select to anon, authenticated using (true)', table_name);
  end loop;

  foreach table_name in array array[
    'lesson_progress', 'price_alerts', 'push_subscriptions', 'bookmarks', 'highlights'
  ] loop
    execute format('grant select, delete on public.%I to authenticated', table_name);
    execute format('create policy "Owner read" on public.%I for select to authenticated using ((select auth.uid()) = user_id)', table_name);
    execute format('create policy "Owner insert" on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', table_name);
    execute format('create policy "Owner update" on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', table_name);
    execute format('create policy "Owner delete" on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', table_name);
  end loop;
end;
$$;

-- Upserts resubmit ownership columns. Old/new-row RLS checks require the same
-- authenticated owner, so these grants cannot transfer rows to another user.
-- Timestamps, alert delivery state, agent reputation, and key entitlements are server-owned.
grant insert (user_id, course_slug, lesson_slug, completed, completed_at),
  update (user_id, course_slug, lesson_slug, completed, completed_at) on public.lesson_progress to authenticated;
grant insert (user_id, target_price, direction, notify_email, notify_push),
  update (target_price, direction, notify_email, notify_push) on public.price_alerts to authenticated;
grant insert (user_id, endpoint, p256dh, auth),
  update (user_id, endpoint, p256dh, auth) on public.push_subscriptions to authenticated;
grant insert (user_id, content_type, content_slug),
  update (user_id, content_type, content_slug) on public.bookmarks to authenticated;
grant insert (user_id, content_type, content_slug, text, note),
  update (text, note) on public.highlights to authenticated;

grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;
create policy "Owner read" on public.profiles for select to authenticated using ((select auth.uid()) = id);
-- Profiles (including email) are provisioned only by the signup trigger.
create policy "Owner update" on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Discovery must not expose the owner's auth.users UUID.
grant select (id, name, description, endpoint, capabilities, pricing_model, pricing_detail,
  pubkey, verified, featured, status, created_at, updated_at) on public.agents to anon, authenticated;
grant delete on public.agents to authenticated;
grant update (name, description, endpoint, capabilities, pricing_model, pricing_detail, pubkey, status)
  on public.agents to authenticated;
create policy "Active agents public read" on public.agents for select to anon, authenticated using (status = 'active');
create policy "Owner read" on public.agents for select to authenticated using ((select auth.uid()) = owner_id);
create policy "Owner update" on public.agents for update to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "Owner delete" on public.agents for delete to authenticated using ((select auth.uid()) = owner_id);
-- Registration uses the server role; owner clients cannot insert registry rows.

-- Defense in depth: dropping/replacing RLS policies must not turn owner updates
-- into entitlement writes. SECURITY INVOKER is intentional: current_user must be
-- the caller, not this function's owner. Unrecognized database roles fail closed.
create or replace function public.guard_agent_and_key_fields()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  mutable_fields text[];
begin
  if current_user in ('postgres', 'supabase_admin', 'service_role') then
    return new;
  end if;
  if tg_op = 'INSERT' then
    raise exception 'Registry and API key creation require the server role' using errcode = '42501';
  end if;
  if tg_table_name = 'agents' then
    mutable_fields := array['name', 'description', 'endpoint', 'capabilities', 'pricing_model', 'pricing_detail', 'pubkey', 'status'];
  else
    mutable_fields := array['revoked_at'];
    if old.revoked_at is not null or new.revoked_at is null then
      raise exception 'API key revocation is irreversible' using errcode = '42501';
    end if;
  end if;
  if (to_jsonb(new) - mutable_fields) is distinct from (to_jsonb(old) - mutable_fields) then
    raise exception 'Privileged registry or entitlement fields are server-owned' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_agent_and_key_fields() from public, anon, authenticated;
create trigger agents_10_guard_fields before insert or update on public.agents
  for each row execute function public.guard_agent_and_key_fields();
create trigger api_keys_guard_fields before insert or update on public.api_keys
  for each row execute function public.guard_agent_and_key_fields();

-- API count-then-insert checks are advisory only. Serialize every activation
-- (including reactivation and owner transfers) before counting with a fresh
-- READ COMMITTED snapshot. Ownerless platform agents are not user registrations.
create or replace function public.enforce_active_agent_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.owner_id is null or new.status is distinct from 'active' then
    return new;
  end if;
  if tg_op = 'UPDATE' then
    if old.owner_id is not distinct from new.owner_id and old.status = 'active' then
      return new;
    end if;
  end if;
  -- A REPEATABLE READ snapshot can predate the lock winner's commit. Reject
  -- non-default isolation rather than accepting a stale count under that mode.
  if current_setting('transaction_isolation') <> 'read committed' then
    raise exception 'Agent activation requires READ COMMITTED isolation' using errcode = '40001';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('contrabxnd:active-agents:' || new.owner_id::text, 0));
  if (select count(*) from public.agents where owner_id = new.owner_id and status = 'active' and id <> new.id) >= 10 then
    raise exception 'Maximum 10 active agents per account' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.enforce_active_agent_limit() from public, anon, authenticated;
create trigger agents_20_active_limit before insert or update of owner_id, status on public.agents
  for each row execute function public.enforce_active_agent_limit();

-- Do not silently grandfather an already-invalid registry. CREATE TRIGGER holds
-- a write-blocking table lock through this transaction, so this preflight cannot
-- race another registration. Reconciliation requires an explicit operator decision.
do $$
begin
  if exists (select 1 from public.agents where owner_id is not null and status = 'active'
      group by owner_id having count(*) > 10) then
    raise exception 'Existing owner exceeds 10 active agents; reconcile registry before applying migration' using errcode = '23514';
  end if;
end;
$$;

grant select (id, user_id, key_prefix, name, last_used_at, created_at, revoked_at, tier),
  update (revoked_at) on public.api_keys to authenticated;
create policy "Owner read" on public.api_keys for select to authenticated using ((select auth.uid()) = user_id);
create policy "Owner revoke" on public.api_keys for update to authenticated
  using ((select auth.uid()) = user_id and revoked_at is null)
  with check ((select auth.uid()) = user_id and revoked_at is not null);

grant select on public.network_applications to authenticated;
grant insert (business_name, website, category, description, contact_email, payment_method, user_id, status)
  on public.network_applications to authenticated;
create policy "Owner read" on public.network_applications for select to authenticated using ((select auth.uid()) = user_id);
create policy "Owner submit pending" on public.network_applications for insert to authenticated
  with check ((select auth.uid()) = user_id and status = 'pending');
-- subscribers and ai_usage intentionally have no client grants or policies.

alter table public.ai_usage add column if not exists last_request_at timestamptz;
alter table public.ai_usage add column quota_initialized boolean not null default false;
revoke all on sequence public.ai_usage_id_seq from public, anon, authenticated;
grant usage, select on sequence public.ai_usage_id_seq to service_role;

-- The server supplies a verified user ID or a SHA-256 IP subject. Limits and UTC
-- dates are derived here, not accepted from callers. One upsert serializes both
-- the daily counter and cooldown across workers. Existing rows (even pre-seeded
-- v2 keys) are untrusted until initialized after client write access is revoked.
create or replace function public.consume_ai_quota(p_scope text, p_subject text, p_user_id uuid default null)
returns table (allowed boolean, remaining integer, retry_after integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_limit integer;
  v_cooldown interval;
  v_key text;
  v_count integer;
  v_last timestamptz;
  v_now timestamptz := clock_timestamp();
begin
  if p_subject is null or p_subject !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid quota subject' using errcode = '22023';
  end if;
  case p_scope
    when 'analyst' then
      v_limit := case when p_user_id is null then 5 else 25 end;
      v_cooldown := interval '3 seconds';
    when 'explorer' then
      v_limit := case when p_user_id is null then 10 else 50 end;
      v_cooldown := interval '2.5 seconds';
    else raise exception 'Invalid quota scope' using errcode = '22023';
  end case;
  v_key := 'v2:' || p_scope || ':' ||
    case when p_user_id is null then 'ip:' || p_subject else 'user:' || p_user_id::text end ||
    ':' || (v_now at time zone 'UTC')::date::text;

  insert into public.ai_usage as usage (usage_key, count, user_id, last_request_at, quota_initialized)
    values (v_key, 1, p_user_id, v_now, true)
    on conflict (usage_key) do update
      set count = case when usage.quota_initialized then usage.count + 1 else 1 end,
        last_request_at = v_now, user_id = p_user_id, quota_initialized = true
      where not usage.quota_initialized or (usage.count < v_limit
        and (usage.last_request_at is null or usage.last_request_at <= v_now - v_cooldown))
    returning count into v_count;
  if found then
    return query select true, v_limit - v_count, 0;
  else
    select count, last_request_at into v_count, v_last from public.ai_usage where usage_key = v_key;
    return query select false, greatest(0, v_limit - v_count),
      case when v_count >= v_limit then 0
        else greatest(1, ceil(extract(epoch from (v_last + v_cooldown - v_now)))::integer) end;
  end if;
end;
$$;
revoke all on function public.consume_ai_quota(text, text, uuid) from public, anon, authenticated;
grant execute on function public.consume_ai_quota(text, text, uuid) to service_role;

-- Contract shared with lib/audit-rate-limit.ts. Parameters are server-controlled;
-- anon/authenticated cannot call this function or read/write its storage. Keys
-- are bounded and hashed before storage. Windows are at most one day; expired
-- rows are reclaimed opportunistically in bounded batches, not on a cron schedule.
create or replace function public.consume_api_rate_limit(p_key text, p_limit integer, p_window_ms integer)
returns table (allowed boolean, remaining integer, reset_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_key text;
  v_count integer;
  v_reset timestamptz;
  v_allowed boolean;
  v_now timestamptz := clock_timestamp();
begin
  if p_key is null or char_length(btrim(p_key)) = 0 or octet_length(p_key) > 1024
    or p_limit is null or p_limit < 1 or p_limit > 1000000
    or p_window_ms is null or p_window_ms < 1 or p_window_ms > 86400000 then
    raise exception 'Invalid rate limit parameters' using errcode = '22023';
  end if;
  v_key := encode(sha256(convert_to(p_key, 'UTF8')), 'hex');
  insert into public.api_rate_limits as bucket (bucket_key, count, reset_at)
    values (v_key, 1, v_now + p_window_ms * interval '1 millisecond')
    on conflict (bucket_key) do update
      set count = case when bucket.reset_at <= v_now then 1 else bucket.count + 1 end,
        reset_at = case when bucket.reset_at <= v_now then excluded.reset_at else bucket.reset_at end
      where bucket.reset_at <= v_now or bucket.count < p_limit
    returning count, bucket.reset_at into v_count, v_reset;
  v_allowed := found;
  if not v_allowed then
    select bucket.reset_at into v_reset from public.api_rate_limits as bucket where bucket.bucket_key = v_key;
  end if;
  -- Take the requested bucket lock before cleanup. SKIP LOCKED prevents cleanup
  -- from waiting on another consumer's live transaction; no unbounded DELETE.
  delete from public.api_rate_limits as expired where expired.bucket_key in (
    select bucket.bucket_key from public.api_rate_limits as bucket
      where bucket.reset_at <= v_now order by bucket.reset_at, bucket.bucket_key
      limit 256 for update skip locked
  );
  return query select v_allowed, case when v_allowed then greatest(0, p_limit - v_count) else 0 end, v_reset;
end;
$$;
revoke all on function public.consume_api_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, integer, integer) to service_role;

-- Trigger functions are not application RPCs.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

commit;
