import { addDays, weekOf } from './dates';
import type { GameResult } from './types';

export type StreakInfo = {
  /** Consecutive days with a completed daily, ending today (or yesterday if today isn't done yet). */
  current: number;
  longest: number;
  todayDone: boolean;
  /** Mon → Sun of the current week: daily completed that day. */
  week: boolean[];
  /** Index (0 = Mon) of today in `week`. */
  todayIndex: number;
};

/** Streaks count days on which the daily puzzle was completed. */
export function computeStreak(results: readonly GameResult[], todayKey: string): StreakInfo {
  const days = new Set(results.filter((r) => r.isDaily && r.dailyDate).map((r) => r.dailyDate!));
  const todayDone = days.has(todayKey);

  let current = 0;
  let cursor = todayDone ? todayKey : addDays(todayKey, -1);
  while (days.has(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }

  let longest = 0;
  for (const day of days) {
    if (days.has(addDays(day, -1))) continue; // not the start of a run
    let length = 1;
    while (days.has(addDays(day, length))) length++;
    longest = Math.max(longest, length);
  }

  const week = weekOf(todayKey);
  return { current, longest, todayDone, week: week.map((d) => days.has(d)), todayIndex: week.indexOf(todayKey) };
}
