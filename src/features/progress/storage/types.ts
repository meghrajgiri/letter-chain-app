import type { GameResult } from '../types';

export type WordHistoryEntry = { puzzleId: string; theme: string; words: string[]; playedAt: string };

/** Device storage for progress. SQLite on native, localStorage on web. */
export type ProgressStore = {
  loadResults(): Promise<GameResult[]>;
  addResult(result: GameResult): Promise<void>;
  /** Oldest first. */
  loadWordHistory(): Promise<WordHistoryEntry[]>;
  addWordHistory(entry: WordHistoryEntry, keepPerTheme: number): Promise<void>;
  /** Marks uploaded results as synced. */
  markSynced(ids: readonly string[], syncedAt: string): Promise<void>;
  /** Removes results that are safely on the server (used on sign-out). */
  deleteSyncedResults(): Promise<void>;
  /** Removes every result (used after deleting the account). */
  deleteAllResults(): Promise<void>;
  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;
};
