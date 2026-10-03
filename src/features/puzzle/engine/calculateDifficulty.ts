import { rateDifficulty } from './difficultyConfig';
import type { DifficultyBreakdown, DifficultyFactorKey, PuzzleMetrics } from './types';

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Maximum points per factor (sums to 100) and how each factor's raw metric
 * maps onto 0–1. Tune here; thresholds live in `difficultyConfig.ts`.
 */
export const DIFFICULTY_FACTORS: Record<DifficultyFactorKey, { max: number; normalize: (m: PuzzleMetrics) => number }> = {
  // Bigger grids mean more scanning.
  gridSize: { max: 14, normalize: (m) => clamp01((m.gridSize - 6) / 10) },
  // More words means a longer solve.
  wordCount: { max: 11, normalize: (m) => clamp01((m.wordCount - 4) / 16) },
  // Longer words are easier to spot once started but slower to confirm; mild weight.
  wordLength: { max: 8, normalize: (m) => clamp01((m.averageWordLength - 3.5) / 6) },
  // Diagonals are harder to scan than rows/columns.
  diagonalWords: {
    max: 13,
    normalize: (m) => clamp01((m.wordCount === 0 ? 0 : m.directions.diagonal / m.wordCount) / 0.6),
  },
  // Backwards words are the single biggest difficulty jump for most players.
  reverseWords: {
    max: 16,
    normalize: (m) => clamp01((m.wordCount === 0 ? 0 : m.directions.reverse / m.wordCount) / 0.65),
  },
  // Shared letters hide words inside each other.
  overlap: { max: 8, normalize: (m) => clamp01(m.overlapScore) },
  // More filler relative to word letters = more noise per word.
  density: { max: 6, normalize: (m) => clamp01((1 - m.density) / 0.7) },
  // Words spread across the grid can't be found by scanning one area.
  distribution: { max: 6, normalize: (m) => clamp01(m.distributionEvenness) },
  // Filler that reuses the words' letters plus decoy fragments.
  visualNoise: {
    max: 18,
    normalize: (m) => 0.5 * clamp01((m.fillerSimilarity - 0.55) / 0.35) + 0.5 * clamp01(m.falseStartsPerWord / 0.8),
  },
};

/** Numeric difficulty (0–100) with a per-factor breakdown for tuning. */
export function calculateDifficultyScore(metrics: PuzzleMetrics): DifficultyBreakdown {
  const factors = {} as Record<DifficultyFactorKey, number>;
  let total = 0;
  for (const key of Object.keys(DIFFICULTY_FACTORS) as DifficultyFactorKey[]) {
    const { max, normalize } = DIFFICULTY_FACTORS[key];
    const points = Math.round(max * normalize(metrics) * 10) / 10;
    factors[key] = points;
    total += points;
  }
  const rounded = Math.round(total);
  return { total: rounded, rated: rateDifficulty(rounded), factors };
}
