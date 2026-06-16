create table if not exists slr_snapshots (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  leverage_subindex numeric,
  tier1_leverage_capital numeric,
  policy_signal smallint default 0,
  policy_event text,
  source text not null default 'fred+fedrss',
  raw_data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_slr_date on slr_snapshots (date desc);

alter table slr_snapshots enable row level security;

create policy "Allow public read" on slr_snapshots
  for select using (true);

create policy "Allow service role insert" on slr_snapshots
  for insert with check (true);

create policy "Allow service role update" on slr_snapshots
  for update using (true);
