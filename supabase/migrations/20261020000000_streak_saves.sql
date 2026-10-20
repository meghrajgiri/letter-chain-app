-- Letter Chain: missed dailies saved by watching a rewarded ad.
-- Append-only like game_results; the app derives streaks from both.
-- Design: docs/progression-and-sync.md. Safe to re-run.

create table if not exists public.streak_saves (
  id          uuid primary key,                      -- generated on the device
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day         date not null,                         -- the missed daily date (UTC) that was saved
  saved_at    timestamptz not null,
  uploaded_at timestamptz not null default now()
);
-- No unique (user_id, day): two offline devices may save the same day with
-- different ids. The app treats duplicates as one; a unique index would make
-- the second upload fail forever.

create index if not exists streak_saves_user_day on public.streak_saves (user_id, day);

alter table public.streak_saves enable row level security;

drop policy if exists "streak saves: read own" on public.streak_saves;
create policy "streak saves: read own" on public.streak_saves
  for select to authenticated using ((select auth.uid()) = user_id);

-- No insert policy or grant for players: saves are created only by the admob-ssv
-- Edge Function (see 20261021000000_streak_saves_verified.sql), so re-running
-- this script can never reopen client inserts.
drop policy if exists "streak saves: insert own" on public.streak_saves;
grant select on public.streak_saves to authenticated;
revoke all on public.streak_saves from anon;
revoke truncate, references, trigger on public.streak_saves from authenticated;
