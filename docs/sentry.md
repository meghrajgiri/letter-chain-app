# Crash reporting (Sentry)

The app reports crashes and errors caught by the error screen to Sentry (`src/lib/sentry.ts`). It sends crashes only: no performance tracing, session replay or personal data. Reporting is off in development builds and whenever `EXPO_PUBLIC_SENTRY_DSN` is unset.

## One-time setup

1. Create a free account at <https://sentry.io> and a **React Native** project.
2. In **Project Settings → Security & Privacy**, turn on **Prevent storing of IP addresses** (the privacy policy promises this).
3. Add these EAS environment variables (`production` and `preview`):

   | Name | Value | Visibility |
   |---|---|---|
   | `EXPO_PUBLIC_SENTRY_DSN` | Project Settings → Client Keys (DSN) | Plain text (it ships in the app) |
   | `SENTRY_ORG` | Organisation slug | Plain text |
   | `SENTRY_PROJECT` | Project slug | Plain text |
   | `SENTRY_AUTH_TOKEN` | Settings → Auth Tokens → Create (org token) | **Secret** |

   For local builds, put `SENTRY_AUTH_TOKEN` in `.env` or `.env.local` (both gitignored) and build with `npm run build:android` (production `.aab`) or `npm run build:android:apk` (preview `.apk`). Those commands load the dotenv files into the shell, because the Gradle upload step only reads real environment variables.

During a release build, the Sentry Gradle step uploads source maps and native debug files so stack traces point at the real source. Without `SENTRY_AUTH_TOKEN` the upload fails; to build without uploading, set `SENTRY_DISABLE_AUTO_UPLOAD=true`.

After `eas update`, upload that update's source maps with `npx sentry-expo-upload-sourcemaps dist`.

## Play Console

Data safety: under **App info and performance**, tick **Crash logs** and **Diagnostics**: collected, not shared, processed ephemerally = no, required, purpose **Analytics**. See the table in `docs/ads.md`.
