create table if not exists etf_snapshots (
  id uuid primary key default gen_random_uuid(),
  ticker text not null,
  date date not null,
  fund_name text not null,
  nav_per_share numeric not null,
  shares_outstanding bigint not null,
  total_net_assets numeric not null,
  market_price numeric,
  volume bigint,
  premium_discount numeric,
  source text not null,
  raw_data jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  unique (ticker, date)
);

create index if not exists idx_etf_snapshots_date on etf_snapshots (date desc);
create index if not exists idx_etf_snapshots_ticker on etf_snapshots (ticker, date desc);

alter table etf_snapshots enable row level security;

create policy "Allow public read" on etf_snapshots
  for select using (true);

create policy "Allow service role insert" on etf_snapshots
  for insert with check (true);

create policy "Allow service role update" on etf_snapshots
  for update using (true);
