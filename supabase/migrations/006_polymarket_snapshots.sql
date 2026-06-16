create table if not exists polymarket_snapshots (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  market_id text not null,
  question text not null,
  slug text,
  outcome_yes numeric,
  outcome_no numeric,
  volume numeric,
  liquidity numeric,
  active boolean default true,
  source text not null default 'polymarket:gamma',
  raw_data jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  unique(date, market_id)
);

create index if not exists idx_polymarket_date on polymarket_snapshots (date desc);
create index if not exists idx_polymarket_market on polymarket_snapshots (market_id);

alter table polymarket_snapshots enable row level security;

create policy "Allow public read" on polymarket_snapshots
  for select using (true);

create policy "Allow service role insert" on polymarket_snapshots
  for insert with check (true);

create policy "Allow service role update" on polymarket_snapshots
  for update using (true);
