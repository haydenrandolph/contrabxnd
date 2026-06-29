-- Captures the user-owned tables that were previously created by hand in the
-- Supabase dashboard and never tracked in version control: profiles,
-- lesson_progress, price_alerts, push_subscriptions. Everything here is
-- idempotent so it can be applied safely to the existing production database
-- (it will add the missing trigger + RLS policies without touching live data).

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

drop trigger if exists trg_profiles_updated_at on profiles;
create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function public.set_updated_at();

alter table profiles enable row level security;

drop policy if exists "Users can read own profile" on profiles;
create policy "Users can read own profile" on profiles
  for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on profiles;
create policy "Users can insert own profile" on profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Service role full access profiles" on profiles;
create policy "Service role full access profiles" on profiles
  for all using (true);

-- Create the profile row automatically on signup. Runs as the table owner
-- (security definer) so it works for both email/password and OAuth signups,
-- where the client never has a session to insert with. display_name is pulled
-- from whatever the provider/signup supplied.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- lesson_progress
-- ---------------------------------------------------------------------------
create table if not exists lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_slug text not null,
  lesson_slug text not null,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz default now(),
  unique (user_id, course_slug, lesson_slug)
);

create index if not exists idx_lesson_progress_user on lesson_progress (user_id);

alter table lesson_progress enable row level security;

drop policy if exists "Users can read own progress" on lesson_progress;
create policy "Users can read own progress" on lesson_progress
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own progress" on lesson_progress;
create policy "Users can insert own progress" on lesson_progress
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own progress" on lesson_progress;
create policy "Users can update own progress" on lesson_progress
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own progress" on lesson_progress;
create policy "Users can delete own progress" on lesson_progress
  for delete using (auth.uid() = user_id);

drop policy if exists "Service role full access progress" on lesson_progress;
create policy "Service role full access progress" on lesson_progress
  for all using (true);

-- ---------------------------------------------------------------------------
-- price_alerts
-- ---------------------------------------------------------------------------
create table if not exists price_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_price numeric not null,
  direction text not null check (direction in ('above', 'below')),
  notify_email boolean not null default true,
  notify_push boolean not null default false,
  triggered boolean not null default false,
  triggered_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_price_alerts_user on price_alerts (user_id);
create index if not exists idx_price_alerts_active on price_alerts (triggered) where triggered = false;

alter table price_alerts enable row level security;

drop policy if exists "Users can read own alerts" on price_alerts;
create policy "Users can read own alerts" on price_alerts
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own alerts" on price_alerts;
create policy "Users can insert own alerts" on price_alerts
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own alerts" on price_alerts;
create policy "Users can update own alerts" on price_alerts
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own alerts" on price_alerts;
create policy "Users can delete own alerts" on price_alerts
  for delete using (auth.uid() = user_id);

drop policy if exists "Service role full access alerts" on price_alerts;
create policy "Service role full access alerts" on price_alerts
  for all using (true);

-- ---------------------------------------------------------------------------
-- push_subscriptions
-- ---------------------------------------------------------------------------
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);

create index if not exists idx_push_subscriptions_user on push_subscriptions (user_id);

alter table push_subscriptions enable row level security;

drop policy if exists "Users can read own subscriptions" on push_subscriptions;
create policy "Users can read own subscriptions" on push_subscriptions
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own subscriptions" on push_subscriptions;
create policy "Users can insert own subscriptions" on push_subscriptions
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete own subscriptions" on push_subscriptions;
create policy "Users can delete own subscriptions" on push_subscriptions
  for delete using (auth.uid() = user_id);

drop policy if exists "Service role full access subscriptions" on push_subscriptions;
create policy "Service role full access subscriptions" on push_subscriptions
  for all using (true);

-- Backfill profiles for any users created before the trigger existed.
insert into public.profiles (id, email, display_name)
select
  u.id,
  u.email,
  coalesce(
    u.raw_user_meta_data->>'display_name',
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name'
  )
from auth.users u
on conflict (id) do nothing;
