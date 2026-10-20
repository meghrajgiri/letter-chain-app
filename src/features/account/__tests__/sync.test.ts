import type { GameResult, StreakSave } from '../../progress/types';
import { fromRow, mergeSynced, syncResults, syncStreakSaves, toRow, type ResultRow, type StreakSaveApi, type StreakSaveRow, type SyncApi } from '../sync';

const result = (id: string, extra: Partial<GameResult> = {}): GameResult => ({
  id,
  mode: 'classic',
  puzzleId: `p-${id}`,
  theme: 'animals',
  difficulty: 'medium',
  isDaily: false,
  dailyDate: null,
  wordCount: 9,
  durationMs: 120000,
  hintsUsed: 0,
  completedAt: '2026-10-05T10:00:00.000Z',
  localDate: '2026-10-05',
  appVersion: '1.0.0',
  syncedAt: null,
  ...extra,
});

/** In-memory stand-in for the server table. */
function fakeServer(initial: ResultRow[] = []) {
  const rows = [...initial];
  let clock = 0;
  const api: SyncApi = {
    async upload(batch) {
      for (const row of batch) {
        if (rows.some((r) => r.id === row.id)) continue; // ignoreDuplicates
        clock++;
        rows.push({ ...row, uploaded_at: `2026-10-05T12:00:${String(clock).padStart(2, '0')}.000Z` });
      }
    },
    async pull(after, limit) {
      return rows.filter((r) => !after || r.uploaded_at! > after).slice(0, limit);
    },
  };
  return { api, rows };
}

describe('row mapping', () => {
  it('round-trips a result', () => {
    const r = result('a', { isDaily: true, dailyDate: '2026-10-05', hintsUsed: 2 });
    const back = fromRow({ ...toRow(r), uploaded_at: '2026-10-05T12:00:00.000Z' });
    expect({ ...back, syncedAt: null }).toEqual(r);
    expect(back.syncedAt).toBe('2026-10-05T12:00:00.000Z');
  });
});

describe('syncResults', () => {
  it('uploads guest games and downloads games from other devices', async () => {
    const otherDevice = { ...toRow(result('remote')), uploaded_at: '2026-10-05T11:00:00.000Z' };
    const server = fakeServer([otherDevice]);
    const out = await syncResults(server.api, [result('local1'), result('local2')], null);
    expect(out.uploadedIds).toEqual(['local1', 'local2']);
    expect(server.rows.map((r) => r.id).sort()).toEqual(['local1', 'local2', 'remote']);
    expect(out.downloaded.map((r) => r.id).sort()).toEqual(['local1', 'local2', 'remote']);
    expect(out.cursor).toBe('2026-10-05T12:00:02.000Z');
  });

  it('is idempotent: re-uploading does not duplicate, and the cursor skips seen rows', async () => {
    const server = fakeServer();
    const first = await syncResults(server.api, [result('a')], null);
    const second = await syncResults(server.api, [result('a')], first.cursor);
    expect(server.rows).toHaveLength(1);
    expect(second.downloaded).toEqual([]);
    expect(second.cursor).toBe(first.cursor);
  });
});

describe('syncStreakSaves', () => {
  it('uploads new saves once and returns every save on the server', async () => {
    const rows: StreakSaveRow[] = [{ id: 'remote', day: '2026-10-10', saved_at: '2026-10-11T08:00:00.000Z', uploaded_at: '2026-10-11T08:00:01.000Z' }];
    const api: StreakSaveApi = {
      async upload(batch) {
        for (const row of batch) if (!rows.some((r) => r.id === row.id)) rows.push({ ...row, uploaded_at: '2026-10-20T09:00:00.000Z' });
      },
      async pullAll() {
        return [...rows];
      },
    };
    const local: StreakSave = { id: 'local', day: '2026-10-19', savedAt: '2026-10-20T08:30:00.000Z', syncedAt: null };
    const out = await syncStreakSaves(api, [local]);
    expect(out.uploadedIds).toEqual(['local']);
    expect(out.downloaded.map((s) => s.id).sort()).toEqual(['local', 'remote']);
    expect(out.downloaded.find((s) => s.id === 'remote')).toEqual({ id: 'remote', day: '2026-10-10', savedAt: '2026-10-11T08:00:00.000Z', syncedAt: '2026-10-11T08:00:01.000Z' });

    // Uploading again (e.g. after a failed apply) doesn't duplicate.
    await syncStreakSaves(api, [local]);
    expect(rows).toHaveLength(2);
  });
});

describe('mergeSynced', () => {
  it('marks uploaded items synced, adds new downloads once, and sorts', () => {
    const local = [result('b', { completedAt: '2026-10-05T12:00:00.000Z' }), result('a', { completedAt: '2026-10-05T11:00:00.000Z' })];
    const downloaded = [result('a'), result('c', { completedAt: '2026-10-05T10:00:00.000Z' })];
    const { next, fresh } = mergeSynced(local, ['b'], downloaded, 'NOW', (r) => r.completedAt);
    expect(next.map((r) => [r.id, r.syncedAt])).toEqual([
      ['c', null],
      ['a', null],
      ['b', 'NOW'],
    ]);
    expect(fresh.map((r) => r.id)).toEqual(['c']);
  });
});
