/**
 * Turning a `daily_puzzles` row into a playable daily. Rows come from the
 * network, so every field is checked and the puzzle is re-validated with the
 * engine's own checks; anything off returns null and the app falls back to
 * the on-device daily. Pure TypeScript.
 */
import { validateChainPuzzle } from '../chain/engine/validateChain';
import type { ChainPuzzle } from '../chain/engine/types';
import { validatePuzzle } from '../puzzle/engine/validatePuzzle';
import type { Puzzle } from '../puzzle/engine/types';
import type { DailyPuzzle, DailySource } from './daily';

/** Highest row format this app understands. */
export const DAILY_FORMAT_VERSION = 1;

export type DailyRow = {
  date: string;
  mode: string;
  theme: string;
  theme_name: string;
  words: string[];
  puzzle: unknown;
  format_version: number;
  source?: string;
};

const SOURCES: readonly DailySource[] = ['generated', 'trending', 'manual'];

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

export function parseDailyRow(row: unknown): DailyPuzzle | null {
  try {
    if (!isObject(row)) return null;
    const { date, mode, theme, theme_name: themeName, puzzle, format_version: version, source: rawSource } = row as DailyRow;
    const source = SOURCES.find((s) => s === rawSource);
    if (version !== DAILY_FORMAT_VERSION) return null;
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
    if (typeof theme !== 'string' || typeof themeName !== 'string' || !isObject(puzzle)) return null;
    const base = { date, theme, themeName, seed: `remote-${date}`, source };

    if (mode === 'classic') {
      const p = puzzle as unknown as Puzzle;
      if (!Array.isArray(p.grid) || !Array.isArray(p.words) || !Array.isArray(p.placements) || typeof p.id !== 'string') return null;
      if (!validatePuzzle(p).valid) return null;
      return { ...base, mode, words: p.words, puzzle: p };
    }
    if (mode === 'chain') {
      const p = puzzle as unknown as ChainPuzzle;
      if (!Array.isArray(p.grid) || !Array.isArray(p.words) || !Array.isArray(p.placements) || typeof p.id !== 'string') return null;
      if (!validateChainPuzzle(p).valid) return null;
      return { ...base, mode, words: p.words, puzzle: p };
    }
    return null;
  } catch {
    return null;
  }
}
