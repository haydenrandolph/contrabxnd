-- Captures the remaining user-owned tables created by hand and never tracked:
-- bookmarks and highlights (used by /account and the /api/bookmarks +
-- /api/highlights routes). Both are accessed through the user-scoped Supabase
-- client, so RLS policies that key on auth.uid() are required. Idempotent and
-- safe to apply to the existing production database.

-- ---------------------------------------------------------------------------
-- bookmarks
-- ---------------------------------------------------------------------------
create table if not exists bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_type text not null check (content_type in ('article', 'lesson')),
  content_slug text not null,
  created_at timestamptz default now(),
  unique (user_id, content_type, content_slug)
);

create index if not exists idx_bookmarks_user on bookmarks (user_id);

alter table bookmarks enable row level security;

drop policy if exists "Users can read own bookmarks" on bookmarks;
create policy "Users can read own bookmarks" on bookmarks
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own bookmarks" on bookmarks;
create policy "Users can insert own bookmarks" on bookmarks
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own bookmarks" on bookmarks;
create policy "Users can update own bookmarks" on bookmarks
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own bookmarks" on bookmarks;
create policy "Users can delete own bookmarks" on bookmarks
  for delete using (auth.uid() = user_id);

drop policy if exists "Service role full access bookmarks" on bookmarks;
create policy "Service role full access bookmarks" on bookmarks
  for all using (true);

-- ---------------------------------------------------------------------------
-- highlights
-- ---------------------------------------------------------------------------
create table if not exists highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_type text not null check (content_type in ('article', 'lesson')),
  content_slug text not null,
  text text not null,
  note text,
  created_at timestamptz default now()
);

create index if not exists idx_highlights_user on highlights (user_id);
create index if not exists idx_highlights_content on highlights (user_id, content_type, content_slug);

alter table highlights enable row level security;

drop policy if exists "Users can read own highlights" on highlights;
create policy "Users can read own highlights" on highlights
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own highlights" on highlights;
create policy "Users can insert own highlights" on highlights
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own highlights" on highlights;
create policy "Users can update own highlights" on highlights
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own highlights" on highlights;
create policy "Users can delete own highlights" on highlights
  for delete using (auth.uid() = user_id);

drop policy if exists "Service role full access highlights" on highlights;
create policy "Service role full access highlights" on highlights
  for all using (true);
