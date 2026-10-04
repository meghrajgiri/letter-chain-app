/**
 * Where the app gets the daily puzzle from, best first:
 *   1. the server's `daily_puzzles` row (fetched in the background)
 *   2. the copy of that row cached on the device (works offline)
 *   3. the on-device generator (same algorithm, but depends on app version)
 *
 * `resolveDaily` is synchronous so routes can use it directly; `refreshDailies`
 * runs in the background and `useDaily` re-renders when a server copy arrives.
 */
import { useState, useSyncExternalStore } from 'react';

import { supabase, supabaseConfigured } from '@/lib/supabase';
import { getDailyPuzzle, type DailyPuzzle } from './daily';
import { DAILY_FORMAT_VERSION, parseDailyRow } from './remoteDaily';

const CACHE_KEY = 'letterchain.dailies.v1';
/** Server rows kept on the device: the newest few days (today, tomorrow, recent). */
const CACHE_DAYS = 5;

/** Valid server rows by date, plus their parsed dailies. */
const rows = new Map<string, unknown>();
const dailies = new Map<string, DailyPuzzle>();
const listeners = new Set<() => void>();
let version = 0;
let cacheLoaded = false;

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** Keeps a row if it parses; returns whether the daily changed. */
function accept(row: unknown): boolean {
  const daily = parseDailyRow(row);
  if (!daily) return false;
  // Compare the grid, not just the id: a corrected re-publish keeps the same id.
  const previous = dailies.get(daily.date);
  const changed = !previous || previous.puzzle.id !== daily.puzzle.id || JSON.stringify(previous.puzzle.grid) !== JSON.stringify(daily.puzzle.grid);
  rows.set(daily.date, row);
  dailies.set(daily.date, daily);
  return changed;
}

function loadCache() {
  if (cacheLoaded) return;
  cacheLoaded = true;
  try {
    const raw = storage()?.getItem(CACHE_KEY);
    if (raw) for (const row of JSON.parse(raw) as unknown[]) accept(row);
  } catch {
    // A broken cache just means we fetch again.
  }
}

function saveCache() {
  const keep = [...rows.keys()].sort().reverse().slice(0, CACHE_DAYS);
  try {
    storage()?.setItem(CACHE_KEY, JSON.stringify(keep.map((date) => rows.get(date))));
  } catch {
    // Not fatal: the server copy still applies for this session.
  }
}

/** The daily for a UTC date: the server copy if we have one, otherwise generated on the device. */
export function resolveDaily(key: string): DailyPuzzle {
  loadCache();
  return dailies.get(key) ?? getDailyPuzzle(key);
}

/** Fetches the server copies of the given days (e.g. today and tomorrow). Never throws. */
export async function refreshDailies(keys: readonly string[]): Promise<void> {
  if (!supabaseConfigured || keys.length === 0) return;
  loadCache();
  try {
    const { data, error } = await supabase
      .from('daily_puzzles')
      .select('date, mode, theme, theme_name, words, puzzle, format_version, source')
      .in('date', [...keys])
      .lte('format_version', DAILY_FORMAT_VERSION);
    if (error || !data) return;
    let changed = false;
    for (const row of data) changed = accept(row) || changed;
    if (!changed) return;
    saveCache();
    version++;
    listeners.forEach((listener) => listener());
  } catch {
    // Offline or server trouble: keep using the cached / generated daily.
  }
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const getVersion = () => version;

/** The daily for `key`, re-rendering when the server copy arrives. */
export function useDaily(key: string): DailyPuzzle {
  useSyncExternalStore(subscribe, getVersion, getVersion);
  return resolveDaily(key);
}

/**
 * The daily to play, fixed when the screen opens: a server copy arriving
 * mid-game never swaps the puzzle under the player. `null` when not a daily.
 */
export function useDailyForPlay(key: string | null): DailyPuzzle | null {
  const [frozen, setFrozen] = useState<DailyPuzzle | null>(() => (key ? resolveDaily(key) : null));
  if (key && frozen?.date !== key) {
    const next = resolveDaily(key);
    setFrozen(next);
    return next;
  }
  return key ? frozen : null;
}
