-- Forward-only. Apply after 013; this file does not send notifications.
begin;

alter table public.price_alerts add column delivery_status text not null default 'pending'
  check (delivery_status in ('pending', 'queued', 'retry', 'delivered'));
update public.price_alerts set delivery_status = 'delivered' where triggered;

-- A match is immutable even if the owner subsequently edits the alert or the
-- market moves away. Legacy triggered alerts are not replayed.
create table public.alert_events (
  alert_id uuid primary key references public.price_alerts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  target_price numeric not null,
  direction text not null,
  price numeric not null,
  price_updated_at timestamptz not null,
  matched_at timestamptz not null default now()
);

create table public.alert_deliveries (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid not null references public.alert_events(alert_id) on delete cascade,
  channel text not null check (channel in ('email', 'push')),
  recipient text not null,
  -- Snapshot recipients and push keys so retries have identical payloads.
  payload jsonb,
  status text not null default 'pending' check (status in ('pending', 'processing', 'retry', 'sent')),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  lease_until timestamptz,
  claim_token uuid,
  last_error text,
  sent_at timestamptz,
  unique (alert_id, channel, recipient)
);
create index alert_deliveries_due on public.alert_deliveries(next_attempt_at, id) where status <> 'sent';
create index alert_events_user on public.alert_events(user_id);

alter table public.alert_events enable row level security;
alter table public.alert_deliveries enable row level security;
revoke all on public.alert_events, public.alert_deliveries from public, anon, authenticated;
grant all on public.alert_events, public.alert_deliveries to service_role;
create policy "Service only" on public.alert_events for all to service_role using (true) with check (true);
create policy "Service only" on public.alert_deliveries for all to service_role using (true) with check (true);

create function public.queue_price_alerts(p_price numeric, p_updated_at timestamptz, p_user_id uuid default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  a record;
  v_checked integer;
  v_queued integer := 0;
  v_triggered_ids uuid[] := '{}';
begin
  if p_price is null or p_price <= 0 or p_price::text in ('NaN', 'Infinity', '-Infinity') or
      p_updated_at is null or p_updated_at > clock_timestamp() or
      p_updated_at < clock_timestamp() - interval '2 minutes' then
    raise exception 'Fresh authoritative price required' using errcode = '22023';
  end if;
  select count(*) into v_checked from public.price_alerts
    where not triggered and (p_user_id is null or user_id = p_user_id);
  -- Lock the source alert before creating the unique event/outbox transaction.
  -- Concurrent user checks and cron workers skip each other's source rows.
  for a in select pa.* from public.price_alerts pa
    where not pa.triggered and (p_user_id is null or pa.user_id = p_user_id)
      and ((pa.direction = 'above' and p_price >= pa.target_price) or
           (pa.direction = 'below' and p_price <= pa.target_price))
      and not exists (select 1 from public.alert_events e where e.alert_id = pa.id)
    order by pa.created_at, pa.id for update of pa skip locked
  loop
    insert into public.alert_events(alert_id, user_id, target_price, direction, price, price_updated_at)
      values (a.id, a.user_id, a.target_price, a.direction, p_price, p_updated_at)
      on conflict (alert_id) do nothing;
    if not found then continue; end if;
    v_queued := v_queued + 1;
    if a.notify_email then
      insert into public.alert_deliveries(alert_id, channel, recipient, payload)
        select a.id, 'email', 'email', case when u.email is not null and u.email <> ''
          then jsonb_build_object('email', u.email) end from auth.users u where u.id = a.user_id;
    end if;
    if a.notify_push then
      insert into public.alert_deliveries(alert_id, channel, recipient, payload)
        select a.id, 'push', s.id::text,
          jsonb_build_object('endpoint', s.endpoint, 'p256dh', s.p256dh, 'auth', s.auth)
        from public.push_subscriptions s where s.user_id = a.user_id;
      if not found then
        -- Keep a durable retry rather than silently succeeding with no device.
        insert into public.alert_deliveries(alert_id, channel, recipient) values (a.id, 'push', 'missing');
      end if;
    end if;
    update public.price_alerts set delivery_status = case when a.notify_email or a.notify_push then 'queued' else 'delivered' end,
      triggered = not (a.notify_email or a.notify_push),
      triggered_at = case when not (a.notify_email or a.notify_push) then clock_timestamp() end where id = a.id;
    if not (a.notify_email or a.notify_push) then
      v_triggered_ids := array_append(v_triggered_ids, a.id);
    end if;
  end loop;
  return jsonb_build_object('checked', v_checked, 'queued', v_queued, 'triggered_ids', v_triggered_ids);
end;
$$;

create function public.claim_alert_delivery(p_user_id uuid default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  d public.alert_deliveries;
  e public.alert_events;
  v_token uuid := gen_random_uuid();
begin
  loop
    select delivery.* into d from public.alert_deliveries delivery
      join public.alert_events event on event.alert_id = delivery.alert_id
      where delivery.status <> 'sent' and delivery.next_attempt_at <= clock_timestamp()
        and (delivery.lease_until is null or delivery.lease_until <= clock_timestamp())
        and (p_user_id is null or event.user_id = p_user_id)
      order by delivery.next_attempt_at, delivery.id limit 1 for update of delivery skip locked;
    if not found then return null; end if;
    select * into strict e from public.alert_events where alert_id = d.alert_id;
    if d.channel = 'push' and d.recipient = 'missing' then
      insert into public.alert_deliveries(alert_id, channel, recipient, payload)
        select d.alert_id, 'push', s.id::text,
          jsonb_build_object('endpoint', s.endpoint, 'p256dh', s.p256dh, 'auth', s.auth)
        from public.push_subscriptions s where s.user_id = e.user_id
        on conflict (alert_id, channel, recipient) do nothing;
      if found then
        delete from public.alert_deliveries where id = d.id;
        continue;
      end if;
    elsif d.channel = 'email' and d.payload is null then
      select jsonb_build_object('email', u.email) into d.payload from auth.users u
        where u.id = e.user_id and u.email is not null and u.email <> '';
    end if;
    update public.alert_deliveries set status = 'processing', attempts = attempts + 1,
      payload = d.payload, claim_token = v_token, lease_until = clock_timestamp() + interval '2 minutes'
      where id = d.id returning * into d;
    return to_jsonb(d) || jsonb_build_object('event', to_jsonb(e));
  end loop;
end;
$$;

create function public.finish_alert_delivery(p_id uuid, p_token uuid, p_error text default null)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_alert_id uuid;
  v_done boolean;
begin
  select alert_id into v_alert_id from public.alert_deliveries where id = p_id;
  if not found then return false; end if;
  -- Serialize recipient completions for the same alert before testing all-sent.
  perform 1 from public.price_alerts where id = v_alert_id for update;
  update public.alert_deliveries set
    status = case when p_error is null then 'sent' else 'retry' end,
    sent_at = case when p_error is null then clock_timestamp() end,
    last_error = case when p_error is null then null else 'delivery_failed' end,
    next_attempt_at = clock_timestamp() + least(3600, 30 * power(2, least(attempts, 7))) * interval '1 second',
    lease_until = null, claim_token = null
    where id = p_id and claim_token = p_token and status = 'processing' and lease_until > clock_timestamp();
  if not found then return false; end if;
  v_done := not exists (select 1 from public.alert_deliveries where alert_id = v_alert_id and status <> 'sent');
  update public.price_alerts set triggered = v_done,
    triggered_at = case when v_done then clock_timestamp() end,
    delivery_status = case when v_done then 'delivered'
      when exists (select 1 from public.alert_deliveries where alert_id = v_alert_id and status = 'retry') then 'retry'
      else 'queued' end where id = v_alert_id;
  return v_done;
end;
$$;

revoke all on function public.queue_price_alerts(numeric, timestamptz, uuid),
  public.claim_alert_delivery(uuid), public.finish_alert_delivery(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.queue_price_alerts(numeric, timestamptz, uuid),
  public.claim_alert_delivery(uuid), public.finish_alert_delivery(uuid, uuid, text) to service_role;
commit;
