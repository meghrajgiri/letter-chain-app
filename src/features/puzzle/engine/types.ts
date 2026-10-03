import type { QualityReport } from './qualityReport';

/**
 * Core domain types for the word search engine.
 *
 * This module (and everything under `engine/`) must stay free of React,
 * React Native and Expo imports so it can run on a server, in a web app or
 * in a batch job.
 */

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard', 'expert'];

export type Cell = {
  row: number;
  col: number;
};

export type DirectionVector = {
  row: -1 | 0 | 1;
  col: -1 | 0 | 1;
};

export type DirectionName = 'E' | 'W' | 'S' | 'N' | 'SE' | 'NW' | 'NE' | 'SW';

export type DirectionCategory = 'horizontal' | 'vertical' | 'diagonal';

/** A letter grid. Every cell holds exactly one uppercase A–Z letter once filled. */
export type Grid = string[][];

/** Grid under construction: `null` marks an empty cell. */
export type WorkingGrid = (string | null)[][];

export type WordPlacement = {
  word: string;
  start: Cell;
  end: Cell;
  direction: DirectionVector;
  /** Every cell the word occupies, in reading order. */
  cells: Cell[];
};

export type Range = {
  min: number;
  max: number;
};

export type ThemeConfig = {
  id: string;
  name: string;
  description?: string;
  /** Emoji or short glyph for UI; engine ignores it. */
  icon?: string;
  words: string[];
};

export type DirectionWeights = Partial<Record<DirectionName, number>>;

/**
 * Tunable generation parameters for one difficulty level. The placement
 * engine never hardcodes any of these values.
 */
export type DifficultyConfig = {
  gridSize: number;
  wordCount: Range;
  wordLength: Range;
  /** Relative weights of allowed directions. Directions absent here are never used. */
  directionWeights: DirectionWeights;
  /** Target share of words that intersect at least one other word (0–1). */
  overlapTarget: Range;
  /** Max share of grid cells that word letters may occupy before word count is reduced. */
  maxDensity: number;
  /**
   * Probability (0–1) that a filler letter is drawn from the puzzle's own
   * word letters instead of general English frequency. Higher = words blend in more.
   */
  fillerWordLetterBias: number;
  /** Number of truncated word fragments ("false starts") planted in filler space. */
  decoyCount: Range;
};

export type DirectionDistribution = {
  horizontal: number;
  vertical: number;
  diagonal: number;
  /** Words that read right-to-left and/or bottom-to-top. Overlaps the categories above. */
  reverse: number;
  byDirection: Record<DirectionName, number>;
};

/** Structural measurements of a puzzle, used for difficulty and quality reporting. */
export type PuzzleMetrics = {
  gridSize: number;
  wordCount: number;
  totalLetters: number;
  averageWordLength: number;
  wordLengthStdDev: number;
  distinctWordLengths: number;
  directions: DirectionDistribution;
  /** Share of words that intersect at least one other word (0–1). */
  overlapScore: number;
  /** Number of grid cells shared by two or more words. */
  sharedCells: number;
  /** Highest number of other words any single word intersects. */
  maxIntersectionsPerWord: number;
  /** Share of grid cells covered by word letters (0–1). */
  density: number;
  /** Side length of the largest square containing no word letters. */
  largestEmptySquare: number;
  /** Word-letter coverage in each region of a 3×3 partition of the grid (0–1 each). */
  regionCoverage: number[];
  /** Regions (of 9) with no word letters at all. */
  emptyRegions: number;
  /** 0–1: how evenly word letters are spread across regions (1 = perfectly even). */
  distributionEvenness: number;
  /** Distance of word-letter centroid from grid centre, as a fraction of grid size. */
  centroidOffset: number;
  /** 0–1: how closely the filler letter distribution matches the target words' letters. */
  fillerSimilarity: number;
  /** Partial word matches ("false starts") in the grid, per target word. */
  falseStartsPerWord: number;
};

export type DifficultyFactorKey =
  | 'gridSize'
  | 'wordCount'
  | 'wordLength'
  | 'diagonalWords'
  | 'reverseWords'
  | 'overlap'
  | 'density'
  | 'distribution'
  | 'visualNoise';

export type DifficultyBreakdown = {
  /** 0–100 */
  total: number;
  /** Difficulty band implied by `total`. May differ from the requested difficulty. */
  rated: Difficulty;
  /** Points contributed by each factor. Sum equals `total` (before rounding). */
  factors: Record<DifficultyFactorKey, number>;
};

export type Puzzle = {
  /** Stable identifier derived from the generation inputs. */
  id: string;
  seed: number;
  theme: string;
  themeName: string;
  /** Requested difficulty (the config used). See `difficulty.rated` for the measured band. */
  difficulty: Difficulty;
  gridSize: number;
  grid: Grid;
  /** Target words in display order (alphabetical). */
  words: string[];
  placements: WordPlacement[];
  difficultyScore: number;
  difficultyBreakdown: DifficultyBreakdown;
  metrics: PuzzleMetrics;
  quality: QualityReport;
  /** Words from `avoidWords` that had to be reused because the bank ran short. */
  reusedWords: string[];
  /** Layout attempts used (1 = first attempt was clean). */
  generationAttempts: number;
  /** Non-fatal notes from generation, e.g. relaxed constraints. */
  generationNotes: string[];
};

export type ValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export type GeneratePuzzleOptions = {
  /** Theme id from the built-in word bank. Ignored when `words` is supplied. */
  theme?: string;
  /** Custom word collection. Overrides `theme`. */
  words?: string[];
  /** Display name when supplying custom `words`. */
  themeName?: string;
  difficulty: Difficulty;
  /** Same seed + same options = identical puzzle. Random when omitted. */
  seed?: number | string;
  /** Override the difficulty's default grid size. */
  gridSize?: number;
  /** Override the difficulty's word count range with an exact count. */
  wordCount?: number;
  /** Override parts of the difficulty config (for tuning tools). */
  config?: Partial<DifficultyConfig>;
  /**
   * Recently used words, most recent first, to keep out of this puzzle when
   * the word bank allows. Part of the puzzle's identity: the same seed with a
   * different list gives a different puzzle (and id). Omit for daily puzzles
   * that must be identical for everyone.
   */
  avoidWords?: readonly string[];
};
