import type { ChainConfig, ChainDifficulty } from './types';

/**
 * Chain grid sizes and word mix. rows × cols letters are split exactly across
 * the words (4–6 per game), so bigger grids mean longer words.
 */
export const CHAIN_CONFIGS: Record<ChainDifficulty, ChainConfig> = {
  easy: { rows: 5, cols: 5, wordCount: { min: 4, max: 5 }, wordLength: { min: 4, max: 8 } },
  medium: { rows: 6, cols: 6, wordCount: { min: 5, max: 6 }, wordLength: { min: 4, max: 10 } },
  hard: { rows: 7, cols: 7, wordCount: { min: 6, max: 6 }, wordLength: { min: 5, max: 11 } },
};

/** No word length appears more than this many times in one chain puzzle. */
export const CHAIN_MAX_SAME_LENGTH = 2;
