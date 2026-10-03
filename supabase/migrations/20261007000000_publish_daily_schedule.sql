-- Trend info for daily puzzles, and the daily schedule for the
-- `publish-daily` Edge Function.

-- The article that inspired a trending daily. Only for the owner's preview:
-- the app never selects these columns.
alter table public.daily_puzzles
  add column trend_title text,
  add column trend_views int;

-- Scheduling: pg_cron runs the job, pg_net makes the HTTP call.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- Every day at 12:00 UTC, publish tomorrow's daily (live at 00:00 UTC), from
-- yesterday's trends. That leaves ~12 hours to swap it from the preview.
-- The shared secret lives in Vault (created once, outside git):
--   select vault.create_secret('<secret>', 'publish_daily_secret');
select cron.schedule(
  'publish-daily',
  '0 12 * * *',
  $$
  select net.http_post(
    url := 'https://wslyfakxemgoluqupofu.supabase.co/functions/v1/publish-daily',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-publish-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'publish_daily_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);
