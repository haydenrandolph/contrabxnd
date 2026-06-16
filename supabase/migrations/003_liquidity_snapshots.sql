create table if not exists liquidity_snapshots (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  fed_balance_sheet numeric,
  tga_balance numeric,
  reverse_repo numeric,
  bank_reserves numeric,
  m2 numeric,
  net_liquidity numeric,
  sofr numeric,
  effr numeric,
  source text not null default 'fred+treasury+nyfed',
  raw_data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_liquidity_date on liquidity_snapshots (date desc);

alter table liquidity_snapshots enable row level security;

create policy "Allow public read" on liquidity_snapshots
  for select using (true);

create policy "Allow service role insert" on liquidity_snapshots
  for insert with check (true);

create policy "Allow service role update" on liquidity_snapshots
  for update using (true);
