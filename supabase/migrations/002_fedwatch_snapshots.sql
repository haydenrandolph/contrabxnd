create table if not exists fedwatch_snapshots (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  current_rate numeric not null,
  target_lower numeric not null,
  target_upper numeric not null,
  meetings jsonb not null default '[]'::jsonb,
  sources text[] not null default '{}',
  created_at timestamptz default now()
);

create index if not exists idx_fedwatch_date on fedwatch_snapshots (date desc);

alter table fedwatch_snapshots enable row level security;

create policy "Allow public read" on fedwatch_snapshots
  for select using (true);

create policy "Allow service role insert" on fedwatch_snapshots
  for insert with check (true);

create policy "Allow service role update" on fedwatch_snapshots
  for update using (true);
