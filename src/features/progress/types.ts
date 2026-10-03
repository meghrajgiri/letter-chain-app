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

/** Input for recording a new result (id/timestamps are filled in). */
export type NewGameResult = Omit<GameResult, 'id' | 'completedAt' | 'localDate' | 'syncedAt'>;
