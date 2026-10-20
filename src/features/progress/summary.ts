import { levelsByMode } from './autoGame';
import { computeBadges, type Badge } from './badges';
import type { LevelInfo } from './level';
import { scoreGame } from './scoring';
import { computeStats, isPersonalBest, type Stats } from './stats';
import { computeStreak, type StreakInfo } from './streak';
import { streakSaveOffer, type StreakSaveOffer } from './streakSave';
import type { GameMode, GameResult, StreakSave } from './types';

export type ProgressSummary = {
  /** Total XP across both modes. */
  xp: number;
  /** Classic and Chain levels are tracked separately (each from its own games). */
  levels: Record<GameMode, LevelInfo>;
  streak: StreakInfo;
  stats: Stats;
  badges: Badge[];
  /** Has today's daily puzzle been completed? (and its result if so) */
  todayDaily: GameResult | null;
  /** Yesterday's missed daily can be saved by watching an ad (null when not on offer). */
  streakSave: StreakSaveOffer | null;
};

/**
 * Everything the UI shows about the player's progress, derived from their results.
 * `todayKey` is the local date (weekly stats); `dailyKey` is today's daily
 * puzzle date (UTC), which streaks and "today's daily" follow.
 */
export function computeProgress(
  results: readonly GameResult[],
  todayKey: string,
  themeCount: number,
  dailyKey: string = todayKey,
  saves: readonly StreakSave[] = [],
): ProgressSummary {
  const xp = results.reduce((sum, r) => sum + scoreGame(r), 0);
  return {
    xp,
    levels: levelsByMode(results),
    streak: computeStreak(results, dailyKey, saves),
    stats: computeStats(results, todayKey),
    badges: computeBadges(results, themeCount),
    todayDaily: results.find((r) => r.isDaily && r.dailyDate === dailyKey) ?? null,
    streakSave: streakSaveOffer(results, saves, dailyKey),
  };
}

export type CompletionSummary = {
  score: number;
  /** XP gained (= score). */
  xpGained: number;
  /** Levels in the game's own mode. */
  levelBefore: number;
  levelAfter: number;
  /** The game's mode level after this game. */
  level: LevelInfo;
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
  /** Today's daily puzzle date (streaks follow it). */
  dailyKey: string,
  themeCount: number,
  saves: readonly StreakSave[] = [],
): CompletionSummary {
  const before = history.filter((r) => r.id !== result.id);
  const after = [...before, result];
  const score = scoreGame(result);
  const levelBefore = levelsByMode(before)[result.mode];
  const levelAfter = levelsByMode(after)[result.mode];
  return {
    score,
    xpGained: score,
    levelBefore: levelBefore.level,
    levelAfter: levelAfter.level,
    level: levelAfter,
    isPersonalBest: isPersonalBest(result, before),
    newBadges: computeBadges(after, themeCount).filter((b) => b.earnedAt === result.completedAt),
    streak: computeStreak(after, dailyKey, saves),
    puzzlesSolved: after.length,
  };
}
