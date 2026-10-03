# Supabase + Google sign-in setup

One-time setup for accounts and sync (Phase 2b). Project: `wslyfakxemgoluqupofu`
(`https://wslyfakxemgoluqupofu.supabase.co`). Android package: `com.letterchain.app`.

Never put the Supabase **secret / service_role key** or the **database password** in the app, `.env`, or chat.

## 1. Create the database tables (Supabase)

1. Supabase dashboard → **SQL Editor** → **New query**.
2. Paste the whole of [`supabase/migrations/20261005000000_init.sql`](../supabase/migrations/20261005000000_init.sql) and click **Run**.
3. Check **Table Editor**: `profiles` and `game_results` exist, each with a shield icon (RLS on).

The script is safe to run again.

## 2. Google Cloud: OAuth clients

1. Go to <https://console.cloud.google.com/> → create a project (e.g. "Letter Chain").
2. **APIs & Services → OAuth consent screen** (Google Auth Platform → Branding/Audience):
   - User type **External**, app name **Letter Chain**, your support email.
   - Scopes: `openid`, `email`, `profile` (the defaults).
   - While in **Testing**, add your Google account under **Test users**. Publish the app before launch.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**, twice:
   - **Web application** — name "Letter Chain web (Supabase)". No URIs needed. Copy its **Client ID** (and Client secret).
   - **Android** — package name `com.letterchain.app`, SHA-1 of the debug build:

     ```
     5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
     ```

     (from `android/app/debug.keystore`; re-check with
     `keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android`).
     Before publishing, add another Android client (or fingerprint) with the **release / Play App Signing SHA-1**.

The app never uses the Android client ID directly; Google checks package + SHA-1 against it.

## 3. Supabase: enable Google

Dashboard → **Authentication → Sign In / Providers → Google**:

- **Enable** it.
- **Client IDs**: the **Web** client ID (if you add more later, comma-separate them with the web ID first).
- **Client Secret**: the Web client's secret.
- **Skip nonce check**: **on** (native Google Sign-In on Android doesn't send a nonce).
- Save.

## 4. App config

Put the **Web** client ID in `.env`:

```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=1234567890-abc...apps.googleusercontent.com
```

## 5. Deploy the delete-account function

Required by Google Play (in-app account deletion). Either:

- **CLI** (from the project folder):
  ```bash
  npx supabase login
  npx supabase functions deploy delete-account --project-ref wslyfakxemgoluqupofu
  ```
- **Dashboard**: **Edge Functions → Deploy a new function → Via editor**, name it `delete-account`,
  paste [`supabase/functions/delete-account/index.ts`](../supabase/functions/delete-account/index.ts), deploy.

Keep **Verify JWT** on (the function only deletes the signed-in caller).

## 6. Rebuild the app

Google Sign-In is a native module, so rebuild once:

```bash
npx expo prebuild --platform android --clean
npx expo run:android
```

## 7. Test

1. Play a few puzzles as a guest.
2. Profile → **Sign in with Google**. Afterwards Profile shows your name, photo and "Synced just now".
3. Supabase → Table Editor → `game_results`: your guest games are there.
4. Second device (or after uninstall/reinstall): sign in → history, streak and XP come back.
5. Profile → **Sign out** → device becomes a fresh guest; sign in again → everything returns.
6. Profile → **Delete account** → user, profile and results are gone from Supabase.

### Troubleshooting

- **"Google sign-in is misconfigured" (DEVELOPER_ERROR 10)**: package name or SHA-1 in the Android client doesn't match the installed build, or `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` isn't the *Web* client ID.
- **"Unacceptable audience in id_token"**: the Web client ID is missing from Supabase → Google → Client IDs.
- **"Nonces mismatch"**: turn on **Skip nonce check**.
- **Sync shows "Couldn't sync"**: run step 1 (tables/permissions) and check you're online.


## Daily puzzles

Migration `20261006000000_daily_puzzles.sql` adds `daily_puzzles`: one finished puzzle per UTC date. Guests and signed-in players can read today's and tomorrow's rows (and older ones); only the service role can write. A published day is never overwritten.

Publish upcoming days from your machine (uses the CLI's linked project, no keys):

```bash
npm run dailies              # next 60 days from today (UTC); existing days are kept
npm run dailies -- 90        # next 90 days
npm run dailies -- 7 --dry-run
```

To swap a published day by hand, delete its row in the dashboard (Table editor → daily_puzzles) and re-run the script, or insert a replacement with `source = 'manual'`.

The script keeps a backlog of evergreen days. The `publish-daily` Edge Function (below) upgrades each day to a trending theme the day before it goes live. Keep the backlog topped up now and then; if it ever runs out, the function still publishes each next day, and the app falls back to generating the daily on the device.

## Trending dailies (`publish-daily` Edge Function)

Every day at **12:00 UTC** (pg_cron + pg_net, migration `20261007000000_publish_daily_schedule.sql`) the function plans **tomorrow's** daily:

1. Fetches yesterday's most viewed English Wikipedia articles and their Wikidata facts (free, no keys).
2. Keeps only allowlisted topics (films, TV, albums, sports events, living athletes/actors/musicians, space missions, festivals…). News, crimes, accidents, politics and deaths are never used. See `src/features/daily/trends/classify.ts`.
3. Maps the top topic to a theme (football, cricket, movies, TV shows, gaming…), avoiding themes from the last 4 dailies and words from the last 2 weeks, and builds the puzzle with the app's own engine.
4. Upgrades tomorrow's evergreen row to `source = 'trending'` (it never changes a day that's live, or one marked `trending`/`manual`). With nothing safe trending, the evergreen day stays.
5. Sends a Telegram preview to the owner with a **Swap puzzle** button, which replaces it with an evergreen theme (`source = 'manual'`) until it goes live at 00:00 UTC.

**Preview notifications** go to the owner's Telegram, from their own bot. Set up once with `npm run telegram:setup`: create a bot with @BotFather, paste its token (hidden), tap Start in the bot, and the script stores `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` as function secrets and sends a test message. Each preview has a **Swap puzzle** button (a signed link for that date only); a swap sends a confirmation message. Run the script again to change bot or chat; `supabase secrets unset TELEGRAM_BOT_TOKEN` stops previews.

**Secrets** (never in git or the app): `PUBLISH_DAILY_SECRET` (function secret) must equal Vault's `publish_daily_secret`, which the cron job sends. To rotate:

```bash
S=$(openssl rand -hex 32)
supabase secrets set PUBLISH_DAILY_SECRET="$S"
supabase db query --linked "update vault.secrets set secret = '$S' where name = 'publish_daily_secret'"   # or vault.update_secret
```

**Deploy after changing the daily or trend code** (the function bundles the app's engine):

```bash
npm run build:edge
supabase functions deploy publish-daily --no-verify-jwt --use-api
```

Run it by hand for a specific date (same path as the schedule): in the SQL editor, run the `net.http_post(...)` from the migration with `?date=YYYY-MM-DD` appended to the URL; responses land in `net._http_response`.
