import { addDays, weekOf } from './dates';
import type { GameResult, StreakSave } from './types';

export type StreakInfo = {
  /** Consecutive days with a completed (or saved) daily, ending today (or yesterday if today isn't done yet). */
  current: number;
  longest: number;
  todayDone: boolean;
  /** Mon → Sun of the current week: daily completed (or saved) that day. */
  week: boolean[];
  /** Mon → Sun: the day was kept by a streak save rather than played. */
  weekSaved: boolean[];
  /** Index (0 = Mon) of today in `week`. */
  todayIndex: number;
};

/** Days whose daily was completed. */
export function playedDays(results: readonly GameResult[]): Set<string> {
  return new Set(results.filter((r) => r.isDaily && r.dailyDate).map((r) => r.dailyDate!));
}

/** Streaks count days on which the daily puzzle was completed, plus days kept by a streak save. */
export function computeStreak(results: readonly GameResult[], todayKey: string, saves: readonly StreakSave[] = []): StreakInfo {
  const played = playedDays(results);
  const saved = new Set(saves.map((s) => s.day));
  const days = new Set([...played, ...saved]);
  const todayDone = played.has(todayKey);

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
  return {
    current,
    longest,
    todayDone,
    week: week.map((d) => days.has(d)),
    weekSaved: week.map((d) => saved.has(d) && !played.has(d)),
    todayIndex: week.indexOf(todayKey),
  };
}
