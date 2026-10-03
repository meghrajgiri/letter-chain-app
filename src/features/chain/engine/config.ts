import type { ChainConfig, ChainDifficulty } from './types';

/** Chain grid sizes and word mix. rows × cols letters are split exactly across the words. */
export const CHAIN_CONFIGS: Record<ChainDifficulty, ChainConfig> = {
  easy: { rows: 6, cols: 6, wordCount: { min: 5, max: 7 }, wordLength: { min: 4, max: 8 } },
  medium: { rows: 7, cols: 7, wordCount: { min: 6, max: 8 }, wordLength: { min: 4, max: 10 } },
  hard: { rows: 8, cols: 8, wordCount: { min: 7, max: 10 }, wordLength: { min: 4, max: 11 } },
};
