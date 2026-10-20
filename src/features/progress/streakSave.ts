/**
 * Rules for saving a broken streak by watching a rewarded ad. Pure, so the
 * offer is the same on every device (it only depends on synced facts).
 */
import { addDays } from './dates';
import { playedDays } from './streak';
import type { GameResult, StreakSave } from './types';

/** A streak shorter than this isn't worth an ad. */
export const MIN_STREAK_TO_SAVE = 2;
/** At most one save in any window of this many days. */
export const SAVE_COOLDOWN_DAYS = 7;

export type StreakSaveOffer = {
  /** The missed daily date (yesterday) that a save would fill. */
  day: string;
  /** Length of the run that ended the day before the missed one: what the player stands to lose. */
  streak: number;
};

/**
 * Offered only when the streak broke by exactly one missed day (yesterday), the
 * run before it was long enough, and no other day was saved in the last
 * SAVE_COOLDOWN_DAYS. Stays on offer all of today, even after today's daily is done.
 */
export function streakSaveOffer(results: readonly GameResult[], saves: readonly StreakSave[], todayKey: string): StreakSaveOffer | null {
  const kept = new Set([...playedDays(results), ...saves.map((s) => s.day)]);
  const missed = addDays(todayKey, -1);
  if (kept.has(missed)) return null;

  let streak = 0;
  for (let cursor = addDays(missed, -1); kept.has(cursor); cursor = addDays(cursor, -1)) streak++;
  if (streak < MIN_STREAK_TO_SAVE) return null;

  const cooldownStart = addDays(missed, -(SAVE_COOLDOWN_DAYS - 1));
  if (saves.some((s) => s.day >= cooldownStart && s.day <= missed)) return null;

  return { day: missed, streak };
}
