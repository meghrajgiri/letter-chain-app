-- Streak saves only come from Google's server-side verification (the admob-ssv
-- Edge Function, service role): players can no longer insert them, so a save
-- can't be faked without really watching the rewarded ad. Safe to re-run.

alter table public.streak_saves add column if not exists transaction_id text;
-- One save per rewarded ad, even when Google retries the callback.
create unique index if not exists streak_saves_transaction on public.streak_saves (transaction_id);

drop policy if exists "streak saves: insert own" on public.streak_saves;
revoke insert on public.streak_saves from authenticated;

-- "Automatically expose new tables" is off, so the service role needs explicit grants.
grant select, insert on public.streak_saves to service_role;
