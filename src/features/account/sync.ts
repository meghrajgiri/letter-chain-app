/**
 * Result sync between the device and the server. Results are append-only,
 * so syncing is: upload what the server doesn't have, download what the
 * device doesn't have. Duplicates are ignored on both sides by id.
 * Pure logic over a small API so it can be tested without a server.
 */
import type { GameMode, GameResult, StreakSave } from '../progress/types';

export type ResultRow = {
  id: string;
  mode: GameMode;
  puzzle_id: string;
  theme: string;
  difficulty: string;
  is_daily: boolean;
  daily_date: string | null;
  word_count: number;
  duration_ms: number;
  hints_used: number;
  completed_at: string;
  local_date: string;
  app_version: string | null;
  uploaded_at?: string;
};

export function toRow(r: GameResult): ResultRow {
  return {
    id: r.id,
    mode: r.mode,
    puzzle_id: r.puzzleId,
    theme: r.theme,
    difficulty: r.difficulty,
    is_daily: r.isDaily,
    daily_date: r.dailyDate,
    word_count: r.wordCount,
    duration_ms: r.durationMs,
    hints_used: r.hintsUsed,
    completed_at: r.completedAt,
    local_date: r.localDate,
    app_version: r.appVersion ?? null,
  };
}

export function fromRow(row: ResultRow): GameResult {
  return {
    id: row.id,
    mode: row.mode === 'chain' ? 'chain' : 'classic',
    puzzleId: row.puzzle_id,
    theme: row.theme,
    difficulty: row.difficulty,
    isDaily: row.is_daily,
    dailyDate: row.daily_date,
    wordCount: row.word_count,
    durationMs: row.duration_ms,
    hintsUsed: row.hints_used,
    // Postgres returns full ISO timestamps; keep them comparable with local ones.
    completedAt: new Date(row.completed_at).toISOString(),
    localDate: row.local_date,
    appVersion: row.app_version,
    syncedAt: row.uploaded_at ?? new Date().toISOString(),
  };
}

/**
 * Applies a sync outcome to a local list of append-only records: marks the
 * uploaded (or server-confirmed) ones synced and adds downloaded ones not already here (by id),
 * sorted by `sortKey`. `fresh` is what still needs saving on the device.
 */
export function mergeSynced<T extends { id: string; syncedAt?: string | null }>(
  local: readonly T[],
  uploadedIds: readonly string[],
  downloaded: readonly T[],
  syncedAt: string,
  sortKey: (item: T) => string,
): { next: T[]; fresh: T[] } {
  const uploaded = new Set(uploadedIds);
  const known = new Set(local.map((item) => item.id));
  const fresh = downloaded.filter((item) => !known.has(item.id));
  const next = [...local.map((item) => (uploaded.has(item.id) ? { ...item, syncedAt } : item)), ...fresh].sort((a, b) =>
    sortKey(a).localeCompare(sortKey(b)),
  );
  return { next, fresh };
}

export type SyncApi = {
  /** Insert rows, ignoring ids the server already has. */
  upload(rows: ResultRow[]): Promise<void>;
  /** Rows uploaded after `after` (all if null), oldest first, at most `limit`. */
  pull(after: string | null, limit: number): Promise<ResultRow[]>;
};

export type SyncOutcome = {
  uploadedIds: string[];
  downloaded: GameResult[];
  /** New pull cursor (latest uploaded_at seen), or the old one if nothing new. */
  cursor: string | null;
};

const UPLOAD_BATCH = 200;
const PULL_PAGE = 500;

export async function syncResults(api: SyncApi, pending: readonly GameResult[], cursor: string | null): Promise<SyncOutcome> {
  const uploadedIds: string[] = [];
  for (let i = 0; i < pending.length; i += UPLOAD_BATCH) {
    const batch = pending.slice(i, i + UPLOAD_BATCH);
    await api.upload(batch.map(toRow));
    uploadedIds.push(...batch.map((r) => r.id));
  }

  const downloaded: GameResult[] = [];
  let next = cursor;
  for (;;) {
    const page = await api.pull(next, PULL_PAGE);
    downloaded.push(...page.map(fromRow));
    if (page.length > 0) next = page[page.length - 1].uploaded_at ?? next;
    if (page.length < PULL_PAGE) break;
  }
  return { uploadedIds, downloaded, cursor: next };
}

// ------------------------------------------------------------ streak saves

export type StreakSaveRow = { id: string; day: string; saved_at: string; uploaded_at?: string };

export const saveFromRow = (row: StreakSaveRow): StreakSave => ({
  id: row.id,
  day: row.day,
  savedAt: new Date(row.saved_at).toISOString(),
  syncedAt: row.uploaded_at ?? new Date().toISOString(),
});

export type StreakSaveApi = {
  /** Every save of the player. There are at most a few a month, so no paging or cursor. */
  pullAll(): Promise<StreakSaveRow[]>;
};

/**
 * Saves are created on the server only, by Google's server-side verification
 * (admob-ssv), never uploaded by the app. A local save counts as synced once
 * its verified copy (same id) is on the server; until then it stays pending and
 * only this device counts it. Guest saves never get a server copy.
 */
export async function syncStreakSaves(
  api: StreakSaveApi,
  pending: readonly StreakSave[],
): Promise<{ confirmedIds: string[]; downloaded: StreakSave[] }> {
  const downloaded = (await api.pullAll()).map(saveFromRow);
  const onServer = new Set(downloaded.map((s) => s.id));
  return { confirmedIds: pending.filter((s) => onServer.has(s.id)).map((s) => s.id), downloaded };
}
