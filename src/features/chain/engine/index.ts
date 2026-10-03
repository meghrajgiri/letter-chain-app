/** Public API of the Chain engine. Pure TypeScript — no React / React Native. */
export * from './types';
export { CHAIN_CONFIGS } from './config';
export { generateChainPuzzle, ChainGenerationError } from './generateChainPuzzle';
export { validateChainPuzzle } from './validateChain';
export { solveChain, findTracings } from './solver';
export { isAdjacent, countTurns } from './grid';
