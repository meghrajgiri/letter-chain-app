/**
 * Progression is derived from an append-only list of finished games.
 * Pure TypeScript — no React / React Native. See docs/progression-and-sync.md.
 */

export type GameMode = 'classic' | 'chain';

export type GameResult = {
  /** UUID generated on the device; also the server id (idempotent upload). */
  id: string;
  mode: GameMode;
  puzzleId: string;
  theme: string;
  difficulty: string;
  isDaily: boolean;
  /** Player's local date of the daily puzzle ('YYYY-MM-DD') when `isDaily`. */
  dailyDate: string | null;
  wordCount: number;
  durationMs: number;
  hintsUsed: number;
  /** ISO timestamp. */
  completedAt: string;
  /** Player's local date of completion ('YYYY-MM-DD'). */
  localDate: string;
  appVersion?: string | null;
  /** ISO timestamp of upload; null = not synced yet. */
  syncedAt?: string | null;
};

/**
 * A missed daily the player saved (by watching a rewarded ad), so the streak
 * carries on through it. Append-only and synced like results.
 */
export type StreakSave = {
  /** UUID generated on the device; also the server id (idempotent upload). */
  id: string;
  /** The daily date ('YYYY-MM-DD', UTC like `dailyDate`) that was missed and saved. */
  day: string;
  /** ISO timestamp. */
  savedAt: string;
  /** ISO timestamp of upload; null = not synced yet. */
  syncedAt?: string | null;
};

/** Input for recording a new result (id/timestamps are filled in). */
export type NewGameResult = Omit<GameResult, 'id' | 'completedAt' | 'localDate' | 'syncedAt'>;
