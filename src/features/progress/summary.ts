import { computeBadges, type Badge } from './badges';
import { levelForXp, type LevelInfo } from './level';
import { scoreGame } from './scoring';
import { computeStats, isPersonalBest, type Stats } from './stats';
import { computeStreak, type StreakInfo } from './streak';
import type { GameResult } from './types';

export type ProgressSummary = {
  xp: number;
  level: LevelInfo;
  streak: StreakInfo;
  stats: Stats;
  badges: Badge[];
  /** Has today's daily puzzle been completed? (and its result if so) */
  todayDaily: GameResult | null;
};

/** Everything the UI shows about the player's progress, derived from their results. */
export function computeProgress(results: readonly GameResult[], todayKey: string, themeCount: number): ProgressSummary {
  const xp = results.reduce((sum, r) => sum + scoreGame(r), 0);
  return {
    xp,
    level: levelForXp(xp),
    streak: computeStreak(results, todayKey),
    stats: computeStats(results, todayKey),
    badges: computeBadges(results, themeCount),
    todayDaily: results.find((r) => r.isDaily && r.dailyDate === todayKey) ?? null,
  };
}

export type CompletionSummary = {
  score: number;
  /** XP gained (= score). */
  xpGained: number;
  levelBefore: number;
  levelAfter: number;
  isPersonalBest: boolean;
  /** Badges earned by this game. */
  newBadges: Badge[];
  streak: StreakInfo;
  /** How many puzzles the player has finished including this one. */
  puzzlesSolved: number;
};

/** What the completion screen shows for a just-finished game. */
export function summarizeCompletion(
  result: GameResult,
  history: readonly GameResult[],
  todayKey: string,
  themeCount: number,
): CompletionSummary {
  const before = history.filter((r) => r.id !== result.id);
  const after = [...before, result];
  const score = scoreGame(result);
  const xpBefore = before.reduce((s, r) => s + scoreGame(r), 0);
  return {
    score,
    xpGained: score,
    levelBefore: levelForXp(xpBefore).level,
    levelAfter: levelForXp(xpBefore + score).level,
    isPersonalBest: isPersonalBest(result, before),
    newBadges: computeBadges(after, themeCount).filter((b) => b.earnedAt === result.completedAt),
    streak: computeStreak(after, todayKey),
    puzzlesSolved: after.length,
  };
}
