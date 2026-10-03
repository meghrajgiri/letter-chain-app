import type { GameMode, GameResult } from './types';

/** Difficulty multipliers. Chain is a little higher than Classic at similar grid sizes. */
export const SCORE_MULTIPLIER: Record<GameMode, Record<string, number>> = {
  classic: { easy: 1, medium: 1.5, hard: 2, expert: 2.5 },
  chain: { easy: 1.5, medium: 2, hard: 2.75 },
};

/** Par times (ms). Beating par earns up to +50%. */
export const PAR_TIME_MS: Record<GameMode, Record<string, number>> = {
  classic: { easy: 90_000, medium: 180_000, hard: 300_000, expert: 480_000 },
  chain: { easy: 120_000, medium: 240_000, hard: 420_000 },
};

export const POINTS_PER_WORD = 10;
export const HINT_PENALTY = 0.15;
export const MAX_SPEED_BONUS = 0.5;

/**
 * Score for one finished game:
 * words × 10 × difficulty multiplier, + up to 50% for speed vs par,
 * − 15% per hint (never below 0).
 */
export function scoreGame(r: Pick<GameResult, 'mode' | 'difficulty' | 'wordCount' | 'durationMs' | 'hintsUsed'>): number {
  const multiplier = SCORE_MULTIPLIER[r.mode][r.difficulty] ?? 1;
  const base = r.wordCount * POINTS_PER_WORD * multiplier;
  const par = PAR_TIME_MS[r.mode][r.difficulty] ?? 180_000;
  const speed = Math.min(1, Math.max(0, 1 - r.durationMs / par));
  const withBonus = base * (1 + MAX_SPEED_BONUS * speed);
  const afterHints = withBonus * Math.max(0, 1 - HINT_PENALTY * r.hintsUsed);
  return Math.round(afterHints);
}

/** Base points for one found word (before speed bonus / hint penalty). */
export function pointsPerWord(mode: GameMode, difficulty: string): number {
  return Math.round(POINTS_PER_WORD * (SCORE_MULTIPLIER[mode][difficulty] ?? 1));
}
