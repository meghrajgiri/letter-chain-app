-- Daily puzzles, fixed server-side so every app version plays the identical
-- daily. One row per UTC date. Rows are written by trusted tooling only (the
-- publish script now, a scheduled Edge Function later) and are never
-- overwritten once published.

create table public.daily_puzzles (
  date           date primary key,
  mode           text not null check (mode in ('classic', 'chain')),
  theme          text not null,
  theme_name     text not null,
  words          text[] not null check (cardinality(words) between 4 and 6),
  -- The finished puzzle exactly as the app plays it (grid + placements).
  puzzle         jsonb not null,
  -- Lets old apps skip rows written in a format they don't understand.
  format_version int  not null default 1,
  -- 'generated' (word bank), 'trending' (trend-based theme), 'manual' (swapped by hand).
  source         text not null default 'generated' check (source in ('generated', 'trending', 'manual')),
  created_at     timestamptz not null default now()
);

alter table public.daily_puzzles enable row level security;

-- Everyone (guests included) can read today's daily, earlier ones, and
-- tomorrow's (so the app can cache it for offline play at midnight).
create policy "read published dailies" on public.daily_puzzles
  for select to anon, authenticated
  using (date <= (now() at time zone 'utc')::date + 1);

-- Read-only for the app; writes need the service role (bypasses RLS).
grant usage on schema public to anon;
grant select on public.daily_puzzles to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public.daily_puzzles from anon, authenticated;
