/**
 * Native progress store (expo-sqlite). Schema and rationale:
 * docs/progression-and-sync.md. Migrations use PRAGMA user_version.
 */
import * as SQLite from 'expo-sqlite';

import type { GameResult } from '../types';
import type { ProgressStore, WordHistoryEntry } from './types';

const DB_NAME = 'letterchain.db';

const MIGRATIONS: string[] = [
  // v1
  `CREATE TABLE IF NOT EXISTS game_results (
     id TEXT PRIMARY KEY NOT NULL,
     mode TEXT NOT NULL,
     puzzle_id TEXT NOT NULL,
     theme TEXT NOT NULL,
     difficulty TEXT NOT NULL,
     is_daily INTEGER NOT NULL DEFAULT 0,
     daily_date TEXT,
     word_count INTEGER NOT NULL,
     duration_ms INTEGER NOT NULL,
     hints_used INTEGER NOT NULL DEFAULT 0,
     completed_at TEXT NOT NULL,
     local_date TEXT NOT NULL,
     app_version TEXT,
     synced_at TEXT
   );
   CREATE INDEX IF NOT EXISTS game_results_completed ON game_results(completed_at);
   CREATE TABLE IF NOT EXISTS word_history (
     puzzle_id TEXT PRIMARY KEY NOT NULL,
     theme TEXT NOT NULL,
     words TEXT NOT NULL,
     played_at TEXT NOT NULL
   );
   CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);`,
];

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  while (version < MIGRATIONS.length) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATIONS[version]);
    });
    version++;
    await db.execAsync(`PRAGMA user_version = ${version}`);
  }
}

type ResultRow = {
  id: string;
  mode: string;
  puzzle_id: string;
  theme: string;
  difficulty: string;
  is_daily: number;
  daily_date: string | null;
  word_count: number;
  duration_ms: number;
  hints_used: number;
  completed_at: string;
  local_date: string;
  app_version: string | null;
  synced_at: string | null;
};

const fromRow = (r: ResultRow): GameResult => ({
  id: r.id,
  mode: r.mode === 'chain' ? 'chain' : 'classic',
  puzzleId: r.puzzle_id,
  theme: r.theme,
  difficulty: r.difficulty,
  isDaily: r.is_daily === 1,
  dailyDate: r.daily_date,
  wordCount: r.word_count,
  durationMs: r.duration_ms,
  hintsUsed: r.hints_used,
  completedAt: r.completed_at,
  localDate: r.local_date,
  appVersion: r.app_version,
  syncedAt: r.synced_at,
});

export async function openProgressStore(): Promise<ProgressStore> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await migrate(db);

  return {
    async loadResults() {
      const rows = await db.getAllAsync<ResultRow>('SELECT * FROM game_results ORDER BY completed_at');
      return rows.map(fromRow);
    },
    async addResult(r) {
      await db.runAsync(
        `INSERT OR IGNORE INTO game_results
           (id, mode, puzzle_id, theme, difficulty, is_daily, daily_date, word_count, duration_ms, hints_used, completed_at, local_date, app_version, synced_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [r.id, r.mode, r.puzzleId, r.theme, r.difficulty, r.isDaily ? 1 : 0, r.dailyDate, r.wordCount, r.durationMs, r.hintsUsed, r.completedAt, r.localDate, r.appVersion ?? null, r.syncedAt ?? null],
      );
    },
    async loadWordHistory() {
      const rows = await db.getAllAsync<{ puzzle_id: string; theme: string; words: string; played_at: string }>(
        'SELECT * FROM word_history ORDER BY played_at',
      );
      return rows.map((r): WordHistoryEntry => ({ puzzleId: r.puzzle_id, theme: r.theme, words: JSON.parse(r.words), playedAt: r.played_at }));
    },
    async addWordHistory(entry, keepPerTheme) {
      await db.withTransactionAsync(async () => {
        await db.runAsync('INSERT OR IGNORE INTO word_history (puzzle_id, theme, words, played_at) VALUES (?, ?, ?, ?)', [
          entry.puzzleId,
          entry.theme,
          JSON.stringify(entry.words),
          entry.playedAt,
        ]);
        await db.runAsync(
          `DELETE FROM word_history WHERE theme = ? AND puzzle_id NOT IN
             (SELECT puzzle_id FROM word_history WHERE theme = ? ORDER BY played_at DESC LIMIT ?)`,
          [entry.theme, entry.theme, keepPerTheme],
        );
      });
    },
    async markSynced(ids, syncedAt) {
      if (ids.length === 0) return;
      await db.withTransactionAsync(async () => {
        for (const id of ids) await db.runAsync('UPDATE game_results SET synced_at = ? WHERE id = ?', [syncedAt, id]);
      });
    },
    async deleteSyncedResults() {
      await db.runAsync('DELETE FROM game_results WHERE synced_at IS NOT NULL');
    },
    async deleteAllResults() {
      await db.runAsync('DELETE FROM game_results');
    },
    async getSetting(key) {
      const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key]);
      return row?.value ?? null;
    },
    async setSetting(key, value) {
      await db.runAsync('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [key, value]);
    },
  };
}
