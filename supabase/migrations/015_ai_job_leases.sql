-- Forward-only; apply separately before deploying the daily AI workers.
begin;

create table public.ai_job_leases (
  job text not null check (job in ('analyst-predict', 'market-brief')),
  day date not null,
  status text not null check (status in ('running', 'failed', 'completed')),
  claim_token uuid,
  lease_until timestamptz,
  completed_at timestamptz,
  primary key (job, day)
);
alter table public.ai_job_leases enable row level security;
revoke all on public.ai_job_leases from public, anon, authenticated;
grant all on public.ai_job_leases to service_role;
create policy "Service only" on public.ai_job_leases for all to service_role using (true) with check (true);

create function public.claim_ai_job(p_job text, p_day date)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_token uuid := gen_random_uuid();
  v_status text;
begin
  if p_job is null or p_job not in ('analyst-predict', 'market-brief') or p_day is null then
    raise exception 'Invalid daily job' using errcode = '22023';
  end if;
  insert into public.ai_job_leases(job, day, status, claim_token, lease_until)
    values (p_job, p_day, 'running', v_token, clock_timestamp() + interval '2 minutes')
    on conflict (job, day) do update set status = 'running', claim_token = v_token,
      lease_until = clock_timestamp() + interval '2 minutes', completed_at = null
    where ai_job_leases.status = 'failed' or
      (ai_job_leases.status = 'running' and ai_job_leases.lease_until <= clock_timestamp());
  if found then return jsonb_build_object('status', 'claimed', 'token', v_token); end if;
  select status into v_status from public.ai_job_leases where job = p_job and day = p_day;
  return jsonb_build_object('status', case when v_status = 'completed' then 'completed' else 'busy' end);
end;
$$;

create function public.finish_ai_job(p_job text, p_day date, p_token uuid, p_completed boolean)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  update public.ai_job_leases set status = case when p_completed then 'completed' else 'failed' end,
    completed_at = case when p_completed then clock_timestamp() end, claim_token = null, lease_until = null
    where job = p_job and day = p_day and claim_token = p_token and status = 'running'
      and lease_until > clock_timestamp();
  return found;
end;
$$;
revoke all on function public.claim_ai_job(text, date), public.finish_ai_job(text, date, uuid, boolean)
  from public, anon, authenticated;
grant execute on function public.claim_ai_job(text, date), public.finish_ai_job(text, date, uuid, boolean)
  to service_role;

-- Existing/manual predictions remain untouched. Daily worker batches get stable
-- output identities independent of their timestamp or generated text.
alter table public.agent_predictions add column job_day date,
  add column job_slot smallint check (job_slot between 0 and 2),
  add constraint agent_predictions_job_identity check ((job_day is null) = (job_slot is null)),
  add constraint agent_predictions_daily_slot unique (agent_id, job_day, job_slot);
commit;
