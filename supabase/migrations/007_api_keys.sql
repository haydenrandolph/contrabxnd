create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  key_hash text not null unique,
  key_prefix text not null,
  name text not null default 'default',
  last_used_at timestamptz,
  created_at timestamptz default now(),
  revoked_at timestamptz
);

create index if not exists idx_api_keys_user on api_keys (user_id);
create index if not exists idx_api_keys_hash on api_keys (key_hash);

alter table api_keys enable row level security;

create policy "Users can read own keys" on api_keys
  for select using (auth.uid() = user_id);

create policy "Users can insert own keys" on api_keys
  for insert with check (auth.uid() = user_id);

create policy "Users can update own keys" on api_keys
  for update using (auth.uid() = user_id);

create policy "Service role full access" on api_keys
  for all using (true);
