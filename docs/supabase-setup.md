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
