-- On-chain valuation aggregates produced by the sovereign UTXO indexer
-- (runs on the Umbrel node, pushes compact daily aggregates here).
create table if not exists onchain_snapshots (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  block_height integer,
  total_supply numeric,        -- BTC in the UTXO set at snapshot time
  realized_cap numeric,        -- USD: sum(utxo_value_btc * price_usd_at_creation)
  realized_price numeric,      -- USD: realized_cap / total_supply
  supply_bands jsonb,          -- HODL waves: {"<1d": pct, "1d-1w": pct, ...}
  source text not null default 'sovereign-utxo-indexer',
  raw_data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_onchain_date on onchain_snapshots (date desc);

alter table onchain_snapshots enable row level security;

create policy "Allow public read" on onchain_snapshots
  for select using (true);

create policy "Allow service role insert" on onchain_snapshots
  for insert with check (true);

create policy "Allow service role update" on onchain_snapshots
  for update using (true);
