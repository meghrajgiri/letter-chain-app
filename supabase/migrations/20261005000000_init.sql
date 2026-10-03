-- Letter Chain: profiles + append-only game results.
-- Design: docs/progression-and-sync.md. Run once in the Supabase SQL editor
-- (or `supabase db push`). Safe to re-run.

-- ---------------------------------------------------------------- profiles
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Create a profile automatically when someone signs up (name/photo from Google).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------ game_results
-- One row per finished game. Never updated or deleted by players.
create table if not exists public.game_results (
  id           uuid primary key,                      -- generated on the device
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  mode         text not null check (mode in ('classic', 'chain')),
  puzzle_id    text not null check (char_length(puzzle_id) <= 200),
  theme        text not null check (char_length(theme) <= 50),
  difficulty   text not null check (difficulty in ('easy', 'medium', 'hard', 'expert')),
  is_daily     boolean not null default false,
  daily_date   date,
  word_count   int not null check (word_count between 1 and 100),
  duration_ms  int not null check (duration_ms > 0),
  hints_used   int not null default 0 check (hints_used between 0 and 50),
  completed_at timestamptz not null,
  local_date   date not null,
  app_version  text,
  uploaded_at  timestamptz not null default now()
);

create index if not exists game_results_user_uploaded on public.game_results (user_id, uploaded_at);

alter table public.game_results enable row level security;

drop policy if exists "results: read own" on public.game_results;
create policy "results: read own" on public.game_results
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "results: insert own" on public.game_results;
create policy "results: insert own" on public.game_results
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- ------------------------------------------------------------------ grants
-- "Automatically expose new tables" is off, so grant exactly what the app needs.
grant usage on schema public to authenticated;
grant select, update (display_name, avatar_url) on public.profiles to authenticated;
grant select, insert on public.game_results to authenticated;
revoke all on public.profiles, public.game_results from anon;
-- Drop default extras: TRUNCATE in particular is not subject to RLS.
revoke truncate, references, trigger on public.profiles, public.game_results from authenticated;
