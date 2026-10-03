/**
 * Remembers which words recent puzzles used, per theme, so the next puzzle
 * can avoid repeating them. Pure TypeScript and in-memory; ProgressProvider
 * loads it from device storage at startup and saves new entries.
 */

/** Puzzles remembered per theme. The engine reuses the oldest words first if the bank runs short. */
export const DEFAULT_HISTORY_SIZE = 8;

type Entry = { puzzleId: string; words: readonly string[] };

export type WordHistoryListener = (theme: string, puzzleId: string, words: readonly string[]) => void;

export type WordHistory = {
  /** Records a puzzle's words. Recording the same puzzle again is a no-op. */
  record(theme: string, puzzleId: string, words: readonly string[]): void;
  /** Called for each newly recorded puzzle (used to persist history). Returns an unsubscribe function. */
  subscribe(listener: WordHistoryListener): () => void;
  /** Unique words from recent puzzles of this theme, most recent first. */
  recentWords(theme: string): string[];
  clear(): void;
};

export function createWordHistory(maxPuzzles = DEFAULT_HISTORY_SIZE): WordHistory {
  const byTheme = new Map<string, Entry[]>();
  const listeners = new Set<WordHistoryListener>();
  return {
    record(theme, puzzleId, words) {
      const entries = byTheme.get(theme) ?? [];
      if (entries.some((e) => e.puzzleId === puzzleId)) return;
      byTheme.set(theme, [{ puzzleId, words }, ...entries].slice(0, maxPuzzles));
      listeners.forEach((l) => l(theme, puzzleId, words));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    recentWords(theme) {
      const seen = new Set<string>();
      for (const entry of byTheme.get(theme) ?? []) for (const word of entry.words) seen.add(word);
      return [...seen];
    },
    clear() {
      byTheme.clear();
    },
  };
}

/** App-wide history shared by every play session. */
export const wordHistory = createWordHistory();
