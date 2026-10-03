/** Public API of the progression engine. Pure TypeScript. */
export * from './types';
export { localDateKey, addDays, weekOf, weekdayIndex } from './dates';
export { scoreGame, pointsPerWord, SCORE_MULTIPLIER, PAR_TIME_MS } from './scoring';
export { levelForXp, xpForLevel, type LevelInfo } from './level';
export { computeStreak, type StreakInfo } from './streak';
export { computeStats, isPersonalBest, type Stats, type BestTime } from './stats';
export { computeBadges, BADGE_RULES, type Badge, type BadgeIcon } from './badges';
export { computeProgress, summarizeCompletion, type ProgressSummary, type CompletionSummary } from './summary';
export { buildShareText } from './share';
