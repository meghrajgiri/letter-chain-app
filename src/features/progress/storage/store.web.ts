/**
 * Web progress store (localStorage). expo-sqlite's web support is alpha and
 * needs special headers, so the web build (used for browser testing) keeps
 * the same data in localStorage behind the same interface.
 */
import type { GameResult } from '../types';
import type { ProgressStore, WordHistoryEntry } from './types';

const KEY = 'letterchain.progress.v1';

type Data = { results: GameResult[]; wordHistory: WordHistoryEntry[]; settings: Record<string, string> };

function read(): Data {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    if (raw) return JSON.parse(raw) as Data;
  } catch {
    // Private mode / blocked storage: start empty.
  }
  return { results: [], wordHistory: [], settings: {} };
}

function write(data: Data) {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(data));
  } catch {
    // Ignore quota / blocked storage; progress stays in memory for this session.
  }
}

export async function openProgressStore(): Promise<ProgressStore> {
  let data = read();
  const save = () => write(data);
  return {
    async loadResults() {
      return [...data.results].sort((a, b) => a.completedAt.localeCompare(b.completedAt));
    },
    async addResult(result) {
      if (data.results.some((r) => r.id === result.id)) return;
      data = { ...data, results: [...data.results, result] };
      save();
    },
    async loadWordHistory() {
      return [...data.wordHistory].sort((a, b) => a.playedAt.localeCompare(b.playedAt));
    },
    async addWordHistory(entry, keepPerTheme) {
      if (data.wordHistory.some((e) => e.puzzleId === entry.puzzleId)) return;
      const sameTheme = [...data.wordHistory.filter((e) => e.theme === entry.theme), entry]
        .sort((a, b) => b.playedAt.localeCompare(a.playedAt))
        .slice(0, keepPerTheme);
      data = { ...data, wordHistory: [...data.wordHistory.filter((e) => e.theme !== entry.theme), ...sameTheme] };
      save();
    },
    async markSynced(ids, syncedAt) {
      const set = new Set(ids);
      data = { ...data, results: data.results.map((r) => (set.has(r.id) ? { ...r, syncedAt } : r)) };
      save();
    },
    async deleteSyncedResults() {
      data = { ...data, results: data.results.filter((r) => !r.syncedAt) };
      save();
    },
    async deleteAllResults() {
      data = { ...data, results: [] };
      save();
    },
    async getSetting(key) {
      return data.settings[key] ?? null;
    },
    async setSetting(key, value) {
      data = { ...data, settings: { ...data.settings, [key]: value } };
      save();
    },
  };
}
