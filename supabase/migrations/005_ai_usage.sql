create table if not exists ai_usage (
  id bigint generated always as identity primary key,
  usage_key text not null unique,
  count integer not null default 0,
  user_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_usage_key on ai_usage(usage_key);
