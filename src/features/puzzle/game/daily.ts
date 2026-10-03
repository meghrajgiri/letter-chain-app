/**
 * Daily puzzle definition: one puzzle per calendar day, identical for every
 * player (seeded by date, no recent-word history).
 */
import { THEMES } from '../data/themes';
import { hashString } from '../engine/random';
import type { Difficulty } from '../engine/types';

export type DailyPuzzle = {
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  seed: string;
  theme: string;
  difficulty: Difficulty;
  wordCount: number;
};

export const DAILY_DIFFICULTY: Difficulty = 'medium';
export const DAILY_WORD_COUNT = 8;

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getDailyPuzzle(date: Date = new Date()): DailyPuzzle {
  const key = toDateKey(date);
  return {
    date: key,
    seed: `daily-${key}`,
    theme: THEMES[hashString(`theme-${key}`) % THEMES.length].id,
    difficulty: DAILY_DIFFICULTY,
    wordCount: DAILY_WORD_COUNT,
  };
}

/** Milliseconds until the next local midnight (when the next daily unlocks). */
export function msUntilNextDaily(now: Date = new Date()): number {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - now.getTime();
}
