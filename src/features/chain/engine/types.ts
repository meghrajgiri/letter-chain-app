/**
 * Chain mode: every letter in the grid belongs to exactly one hidden word,
 * and each word winds through orthogonally adjacent cells. Pure TypeScript.
 */
import type { Cell, Range } from '../../puzzle/engine/types';

export type ChainDifficulty = 'easy' | 'medium' | 'hard';

export const CHAIN_DIFFICULTIES: readonly ChainDifficulty[] = ['easy', 'medium', 'hard'];

export type ChainConfig = {
  rows: number;
  cols: number;
  wordCount: Range;
  wordLength: Range;
};

export type ChainPlacement = {
  word: string;
  /** Cells in reading order; consecutive cells are orthogonal neighbours. */
  cells: Cell[];
};

export type ChainPuzzle = {
  id: string;
  seed: number;
  theme: string;
  themeName: string;
  difficulty: ChainDifficulty;
  rows: number;
  cols: number;
  grid: string[][];
  /** Display order: shortest first. */
  words: string[];
  /** The single solution, in the same order as `words`. */
  placements: ChainPlacement[];
  /** Words reused from `avoidWords` because the bank ran short. */
  reusedWords: string[];
  generationAttempts: number;
  /** Average direction changes per word (higher = windier paths). */
  turnsPerWord: number;
};

export type GenerateChainOptions = {
  theme?: string;
  words?: string[];
  themeName?: string;
  difficulty: ChainDifficulty;
  seed?: number | string;
  /** Recently used words, most recent first (soft-avoided). */
  avoidWords?: readonly string[];
};
