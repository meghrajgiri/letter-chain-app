/**
 * Public API of the puzzle engine. Pure TypeScript — no React / React Native.
 */
export * from './types';
export { generatePuzzle, PuzzleGenerationError, buildPuzzleId } from './generatePuzzle';
export { validatePuzzle } from './validatePuzzle';
export { calculateDifficultyScore, DIFFICULTY_FACTORS } from './calculateDifficulty';
export { computeMetrics, getDirectionDistribution } from './metrics';
export { assessPuzzleQuality } from './qualityReport';
export type { QualityReport, QualityCheck, QualityStatus, QualityCheckId } from './qualityReport';
export { DIFFICULTY_CONFIGS, DIFFICULTY_THRESHOLDS, getDifficultyConfig, rateDifficulty, MIN_WORD_LENGTH, MIN_GRID_SIZE, MAX_GRID_SIZE } from './difficultyConfig';
export { getCellsBetween } from './getCellsBetween';
export { createRng, normalizeSeed, randomSeed, hashString } from './random';
export type { Rng } from './random';
export { DIRECTIONS, DIRECTION_VECTORS, DIRECTION_NAMES, DIRECTION_ARROWS, getDirectionName, getDirectionCategory, isReverseDirection, isDiagonal } from './directions';
export { findWordOccurrences, cellKey } from './gridScan';
export { generateBatch, generateBatchItem, summarizeBatch } from './batch';
export type { BatchItem, BatchSummary } from './batch';
export { normalizeWord, resolveWordSource } from './wordBank';
