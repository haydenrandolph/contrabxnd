create table if not exists market_briefs (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  score integer,
  score_label text,
  headline text not null,
  summary text not null,
  sections jsonb not null default '[]'::jsonb,
  signal_data jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_market_briefs_date on market_briefs (date desc);

alter table market_briefs enable row level security;

create policy "Allow public read" on market_briefs
  for select using (true);

create policy "Allow service role insert" on market_briefs
  for insert with check (true);

create policy "Allow service role update" on market_briefs
  for update using (true);
