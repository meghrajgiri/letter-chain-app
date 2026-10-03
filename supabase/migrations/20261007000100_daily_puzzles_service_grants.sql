-- "Automatically expose new tables" is off, so the service role (used only by
-- the publish-daily Edge Function, never by the app) needs explicit grants.
grant select, insert, update on public.daily_puzzles to service_role;
