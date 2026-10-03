import type { Difficulty, DifficultyConfig } from './types';

export const MIN_WORD_LENGTH = 3;
export const MIN_GRID_SIZE = 5;
/** Every game has 4–6 words; difficulty comes from grid size, directions and noise. */
export const MIN_WORDS = 4;
export const MAX_WORDS = 6;
/** No word length appears more than this many times in one puzzle. */
export const MAX_SAME_LENGTH = 2;
export const MAX_GRID_SIZE = 20;

/**
 * Generation parameters per difficulty. These are the main tuning knobs.
 *
 * Direction weights are relative. Easy only reads forwards; medium adds
 * reversed horizontals/verticals and forward diagonals; hard and expert use
 * all eight directions, biased towards the awkward ones.
 */
export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    gridSize: 7,
    wordCount: { min: 4, max: 5 },
    wordLength: { min: 3, max: 7 },
    directionWeights: { E: 0.55, S: 0.45 },
    overlapTarget: { min: 0.15, max: 0.4 },
    maxDensity: 0.62,
    fillerWordLetterBias: 0.1,
    decoyCount: { min: 0, max: 0 },
  },
  medium: {
    gridSize: 8,
    wordCount: { min: 4, max: 6 },
    wordLength: { min: 4, max: 8 },
    directionWeights: { E: 0.22, S: 0.2, W: 0.13, N: 0.12, SE: 0.18, NE: 0.15 },
    overlapTarget: { min: 0.3, max: 0.6 },
    maxDensity: 0.65,
    fillerWordLetterBias: 0.3,
    decoyCount: { min: 1, max: 2 },
  },
  hard: {
    gridSize: 10,
    wordCount: { min: 5, max: 6 },
    wordLength: { min: 4, max: 10 },
    directionWeights: { E: 0.1, S: 0.1, W: 0.14, N: 0.14, SE: 0.12, NE: 0.12, SW: 0.14, NW: 0.14 },
    overlapTarget: { min: 0.4, max: 0.7 },
    maxDensity: 0.68,
    fillerWordLetterBias: 0.5,
    decoyCount: { min: 3, max: 5 },
  },
  expert: {
    gridSize: 11,
    wordCount: { min: 6, max: 6 },
    wordLength: { min: 5, max: 11 },
    directionWeights: { E: 0.08, S: 0.08, W: 0.17, N: 0.17, SE: 0.08, NE: 0.08, SW: 0.17, NW: 0.17 },
    overlapTarget: { min: 0.5, max: 0.8 },
    maxDensity: 0.7,
    fillerWordLetterBias: 0.7,
    decoyCount: { min: 6, max: 9 },
  },
};

/**
 * Score thresholds (inclusive lower bounds) for rating a puzzle's measured
 * difficulty. Tune alongside the factor weights in `calculateDifficulty.ts`.
 */
export const DIFFICULTY_THRESHOLDS: Record<Difficulty, number> = {
  easy: 0,
  medium: 36,
  hard: 61,
  expert: 78,
};

export function rateDifficulty(score: number): Difficulty {
  if (score >= DIFFICULTY_THRESHOLDS.expert) return 'expert';
  if (score >= DIFFICULTY_THRESHOLDS.hard) return 'hard';
  if (score >= DIFFICULTY_THRESHOLDS.medium) return 'medium';
  return 'easy';
}

export function getDifficultyConfig(difficulty: Difficulty, overrides?: Partial<DifficultyConfig>): DifficultyConfig {
  const base = DIFFICULTY_CONFIGS[difficulty];
  if (!base) throw new Error(`Unknown difficulty "${difficulty}"`);
  return { ...base, ...overrides };
}
