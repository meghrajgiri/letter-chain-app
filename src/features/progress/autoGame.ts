/**
 * Free play picks the theme and difficulty for the player. Difficulty follows
 * the player's level in that mode; Classic and Chain levels are separate.
 */
import { levelForXp, type LevelInfo } from './level';
import { scoreGame } from './scoring';
import type { GameMode, GameResult } from './types';

/** Difficulty by mode level: each entry applies from `fromLevel` until the next entry. */
export const DIFFICULTY_LADDER: Record<GameMode, readonly { fromLevel: number; difficulty: string }[]> = {
  classic: [
    { fromLevel: 1, difficulty: 'easy' },
    { fromLevel: 3, difficulty: 'medium' },
    { fromLevel: 6, difficulty: 'hard' },
    { fromLevel: 10, difficulty: 'expert' },
  ],
  chain: [
    { fromLevel: 1, difficulty: 'easy' },
    { fromLevel: 3, difficulty: 'medium' },
    { fromLevel: 7, difficulty: 'hard' },
  ],
};

/** How many of the most recently played themes sit out when picking the next one. */
export const RECENT_THEMES_SKIPPED = 5;

export function difficultyForLevel(mode: GameMode, level: number): string {
  const ladder = DIFFICULTY_LADDER[mode];
  let difficulty = ladder[0].difficulty;
  for (const step of ladder) if (level >= step.fromLevel) difficulty = step.difficulty;
  return difficulty;
}

/** The mode level where the next harder difficulty starts, or null at the top. */
export function nextDifficultyStep(mode: GameMode, level: number): { fromLevel: number; difficulty: string } | null {
  return DIFFICULTY_LADDER[mode].find((step) => step.fromLevel > level) ?? null;
}

/** XP and level per mode: only that mode's games count towards it. */
export function levelsByMode(results: readonly GameResult[]): Record<GameMode, LevelInfo> {
  const xp: Record<GameMode, number> = { classic: 0, chain: 0 };
  for (const r of results) xp[r.mode] += scoreGame(r);
  return { classic: levelForXp(xp.classic), chain: levelForXp(xp.chain) };
}

/**
 * A theme the player hasn't played recently (in any mode). The last few
 * themes sit out; the pick among the rest is random.
 */
export function pickTheme(themeIds: readonly string[], results: readonly GameResult[], random: () => number = Math.random): string {
  const recent: string[] = [];
  const newestFirst = [...results].sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  const skip = Math.min(RECENT_THEMES_SKIPPED, themeIds.length - 1);
  for (const r of newestFirst) {
    if (recent.length >= skip) break;
    if (!recent.includes(r.theme)) recent.push(r.theme);
  }
  const options = themeIds.filter((id) => !recent.includes(id));
  return options[Math.floor(random() * options.length)] ?? themeIds[0];
}

export type AutoGame = { theme: string; difficulty: string; level: number };

/** Theme and difficulty for the next free-play game in `mode`. */
export function nextAutoGame(mode: GameMode, results: readonly GameResult[], themeIds: readonly string[], random: () => number = Math.random): AutoGame {
  const { level } = levelsByMode(results)[mode];
  return { theme: pickTheme(themeIds, results, random), difficulty: difficultyForLevel(mode, level), level };
}
