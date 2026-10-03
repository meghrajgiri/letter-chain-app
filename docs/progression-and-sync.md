# Progression, accounts and sync — design

Status: Phase 2a (local) done. Phase 2b (Supabase) implemented in the app; one-time project setup in [supabase-setup.md](supabase-setup.md).

## Decisions

| Topic | Decision |
|---|---|
| Backend | Supabase (Postgres, Auth, Row Level Security) |
| Accounts | Guest play by default; optional **Google** sign-in (Android first). Guests are reminded to sign in to keep their progress. |
| Platforms | Android first |
| Data model | **Local-first.** The device keeps a complete local copy in SQLite; the server is the cross-device copy. |

## Core idea: store facts, derive progress

The only progress data we store is an **append-only list of finished games** (`game_results`). Everything else — score totals, XP, level, streaks, stats, personal bests, badges — is *calculated* from that list by pure TypeScript functions (`src/features/progress/`).

Why:

- **Sync can't conflict.** A result is created once and never edited. Merging two devices = union of results by `id`.
- **Rules can change.** Tweaking the XP curve or adding a badge recalculates everyone's progress from history; no data migration.
- **Testable.** Progress is a pure function of results.
- **Server-checkable later.** A result carries the puzzle id; the engine is pure TS, so a server can regenerate the puzzle and check a submitted time is plausible (needed before leaderboards).

## Guest vs signed-in

- **Guest:** no server account. Results are saved locally with `synced_at = NULL`. Nothing leaves the device.
- **Sign in with Google** (native Google Sign-In → `supabase.auth.signInWithIdToken({ provider: 'google', token })`):
  1. Upload all unsynced local results to that user.
  2. Download the user's results from other devices into the local DB.
  3. From then on, each new result is saved locally first, then uploaded (retried when offline).
- **Signing in on a second phone after playing as a guest there:** step 1 adds that phone's guest games to the account. Nothing is lost on either side.
- **Sign out:** results already on the server are removed from the device (they're safe in the account), and the device continues as a fresh guest. This prevents one account's progress showing up under another account on a shared phone.

We deliberately do **not** use Supabase anonymous users: converting them to Google uses a browser OAuth flow (not native Google Sign-In) and fails when the Google account already exists from another device — exactly the multi-device case we care about.

### Guest reminders

Shown only to guests, never blocking play:

- After the **3rd** finished puzzle, on the completion screen: "Sign in to save your progress" card (Google button + "Not now").
- When a **streak reaches 3+ days** or a **badge** is earned: reminder on the completion screen (high-value moment).
- Persistent but quiet entry in Profile ("Guest — sign in to sync").
- "Not now" snoozes completion-screen reminders for 5 more puzzles.

## Local database (expo-sqlite)

Migrations via `PRAGMA user_version`.

```sql
CREATE TABLE game_results (
  id            TEXT PRIMARY KEY,        -- UUID generated on device
  mode          TEXT NOT NULL,           -- 'classic' | 'chain'
  puzzle_id     TEXT NOT NULL,
  theme         TEXT NOT NULL,
  difficulty    TEXT NOT NULL,
  is_daily      INTEGER NOT NULL DEFAULT 0,
  daily_date    TEXT,                    -- 'YYYY-MM-DD' (player's local date) when is_daily
  word_count    INTEGER NOT NULL,
  duration_ms   INTEGER NOT NULL,
  hints_used    INTEGER NOT NULL DEFAULT 0,
  completed_at  TEXT NOT NULL,           -- ISO timestamp
  local_date    TEXT NOT NULL,           -- 'YYYY-MM-DD' local date of completion (for weekly stats)
  app_version   TEXT,
  synced_at     TEXT                     -- NULL = not uploaded yet
);
CREATE INDEX game_results_completed ON game_results(completed_at);

CREATE TABLE word_history (              -- recent words per theme (avoid repeats)
  puzzle_id  TEXT PRIMARY KEY,
  theme      TEXT NOT NULL,
  words      TEXT NOT NULL,              -- JSON array
  played_at  TEXT NOT NULL
);

CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
```

Score is **not** stored: it's derived, so formula changes apply retroactively.

## Supabase schema (Phase 2b)

```sql
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

create table public.game_results (
  id           uuid primary key,                -- same id as on device (idempotent upload)
  user_id      uuid not null references auth.users(id) on delete cascade,
  mode         text not null check (mode in ('classic', 'chain')),
  puzzle_id    text not null,
  theme        text not null,
  difficulty   text not null,
  is_daily     boolean not null default false,
  daily_date   date,
  word_count   int  not null check (word_count > 0),
  duration_ms  int  not null check (duration_ms > 0),
  hints_used   int  not null default 0 check (hints_used >= 0),
  completed_at timestamptz not null,
  local_date   date not null,
  app_version  text,
  uploaded_at  timestamptz not null default now()
);
create index on public.game_results (user_id, completed_at);

alter table public.profiles     enable row level security;
alter table public.game_results enable row level security;

create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Append-only: players can read and insert their own results, never update/delete.
create policy "read own results"   on public.game_results for select using (auth.uid() = user_id);
create policy "insert own results" on public.game_results for insert with check (auth.uid() = user_id);
```

- Upload uses `upsert(..., { onConflict: 'id', ignoreDuplicates: true })` so retries are safe.
- Download: results with `uploaded_at` newer than the last pull (stored in `settings`).
- **Account deletion** (required by Google Play): in-app "Delete account" → Edge Function deletes the auth user (cascades to profile and results) → app clears local synced data.
- Later: `daily_puzzles` table (date → seed/theme/word-bank version) so every app version gets the same daily puzzle; server-side plausibility checks before any leaderboard.

## Progression rules (v1, tunable in `src/features/progress/`)

- **Score per game:** words × 10 × difficulty multiplier, plus a speed bonus (up to +50% for beating par time), minus 15% per hint (min 0). Chain multipliers are slightly higher than Classic at the same grid size.
- **XP:** sum of scores. **Level:** level *n* needs `50 · (n − 1) · n` XP (L2 = 100, L3 = 300, L4 = 600 …). **Classic and Chain have separate levels**, each from its own games' XP.
- **Free play is automatic:** the player only picks Classic or Chain. The theme is a random one not among the last 5 played; the difficulty follows that mode's level (`DIFFICULTY_LADDER` in `autoGame.ts`): Classic easy L1, medium L3, hard L6, expert L10; Chain easy L1, medium L3, hard L7.
- **Word mix:** every puzzle has 4–6 words, and no word length appears more than twice.
- **Daily puzzle** (`src/features/daily/daily.ts`): one per **UTC** day, the same for every player. Classic and Chain alternate (even day numbers Classic, odd Chain). Always exactly 5 words of 4, 5, 6, 7 and 8 letters at medium difficulty; Classic on an 8×8 grid, Chain on 5×6 (30 letters). The theme rotates by date. Streaks and "today's daily" follow the UTC daily date. The finished daily is stored server-side in `daily_puzzles` (one row per UTC date, never overwritten), so every app version plays the identical puzzle; the app fetches today's and tomorrow's rows, caches them on the device, re-validates them with the engine, and falls back to generating the daily on the device if the server copy is missing or invalid. A scheduled Edge Function themes each next day on what's trending (allowlisted Wikipedia/Wikidata topics only) and sends the owner a preview with a swap button; see supabase-setup.md.
- **Streak:** consecutive local days with a completed **daily** puzzle. Current streak counts back from today, or from yesterday if today isn't done yet. Longest streak kept.
- **Stats:** puzzles solved, words found, average words per puzzle, best time (per mode + difficulty), total playtime, words per day this week, solved this week.
- **Personal best:** a result faster than every earlier result with the same mode + difficulty.
- **Badges:** rule-based on history (first solve, 7-day streak, sub-2-minute solve, 50 puzzles, 10 Chain puzzles, 25 hint-free solves, every theme played…), each with progress (e.g. 48/50).
- Removed from the design until real data exists: "Top 5% solver" (needs server-wide stats), season numbers.

## Build order

**Phase 2a — local, no backend** (each step ends with a playable build)

1. Progression engine (pure, unit-tested): scoring, XP/levels, streaks, stats, personal bests, badges.
2. Local SQLite store + `ProgressProvider`; record a result when a puzzle is completed; persist word history.
3. Replace all demo data: Home, Completion, Progress, Profile show real values. Delete `demoProgress`.
4. Classic hints + reveal (like Chain); remove Shuffle.
5. Share result (spoiler-free text via the share sheet).
6. Settings (sound, haptics) + daily reminder (local notification).
7. First-play tutorial (Classic and Chain).

**Phase 2b — Supabase**

1. Supabase project, schema + RLS above, env config (`EXPO_PUBLIC_SUPABASE_URL` / anon key).
2. Native Google Sign-In (needs a development build + Google Cloud OAuth client for the Android package).
3. Sign-in flow, upload of unsynced results, pull from other devices, background retry.
4. Guest reminders (rules above).
5. Profile: account state, sign out, delete account (Edge Function).

**Phase 3 — launch prep:** privacy policy + Play data-safety form (accounts now collect email), crash reporting, content review, store listing, EAS Build/Submit/Update, Android soft launch.
