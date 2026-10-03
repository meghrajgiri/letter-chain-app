import { THEMES } from '../../puzzle/data/themes';
import { createRng, hashString, normalizeSeed, randomSeed } from '../../puzzle/engine/random';
import { normalizeWordList, resolveWordSource } from '../../puzzle/engine/wordBank';
import { CHAIN_CONFIGS, CHAIN_MAX_SAME_LENGTH } from './config';
import { countTurns } from './grid';
import { partitionGrid } from './partitionGrid';
import { selectChainWords } from './selectChainWords';
import { solveChain } from './solver';
import type { ChainPlacement, ChainPuzzle, GenerateChainOptions } from './types';

/** Layout attempts before giving up. Each tries new words and/or a new partition. */
const MAX_ATTEMPTS = 40;

export class ChainGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChainGenerationError';
  }
}

/**
 * Generates a Chain puzzle: hidden words that exactly tile the grid along
 * orthogonal paths, with exactly one solution. Deterministic for a given
 * seed + options.
 *
 * Per attempt: pick words summing to rows × cols → split the grid into paths
 * of those lengths → write each word along a path (random direction) →
 * solve; keep the puzzle only if the solver finds exactly one solution.
 */
export function generateChainPuzzle(options: GenerateChainOptions): ChainPuzzle {
  const seed = options.seed === undefined ? randomSeed() : normalizeSeed(options.seed);
  const { difficulty } = options;
  const config = { ...CHAIN_CONFIGS[difficulty], ...options.config };
  const source = resolveWordSource(options, THEMES);
  const avoid = normalizeWordList(options.avoidWords ?? []);
  const { rows, cols } = config;

  const size = options.config ? `-${rows}x${cols}` : '';
  const base = ['chain', source.themeId, difficulty, seed].join('-') + size;
  const id = avoid.length > 0 ? `${base}-a${hashString(avoid.join(',')).toString(36)}` : base;
  const rng = createRng(id);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const attemptRng = rng.fork(`attempt-${attempt}`);
    const words = selectChainWords({
      candidates: source.words,
      totalLetters: rows * cols,
      count: config.wordCount,
      length: config.wordLength,
      rng: attemptRng.fork('words'),
      avoid,
      maxSameLength: CHAIN_MAX_SAME_LENGTH,
    });
    if (!words) continue;

    const paths = partitionGrid({ rows, cols, lengths: words.map((w) => w.length), rng: attemptRng.fork('partition') });
    if (!paths) continue;

    // Assign words to paths of matching length, each written in a random direction.
    const placeRng = attemptRng.fork('place');
    const pool = placeRng.shuffle(words);
    const grid: string[][] = Array.from({ length: rows }, () => Array(cols).fill(''));
    const placements: ChainPlacement[] = [];
    for (const path of paths) {
      const index = pool.findIndex((w) => w.length === path.length);
      const word = pool.splice(index, 1)[0];
      const cells = placeRng.chance(0.5) ? path : path.slice().reverse();
      cells.forEach((cell, i) => {
        grid[cell.row][cell.col] = word[i];
      });
      placements.push({ word, cells });
    }

    if (solveChain(grid, words, 2).count !== 1) continue;

    placements.sort((a, b) => a.word.length - b.word.length || a.word.localeCompare(b.word));
    return {
      id,
      seed,
      theme: source.themeId,
      themeName: source.themeName,
      difficulty,
      rows,
      cols,
      grid,
      words: placements.map((p) => p.word),
      placements,
      reusedWords: placements.map((p) => p.word).filter((w) => avoid.includes(w)),
      generationAttempts: attempt + 1,
      turnsPerWord: placements.reduce((sum, p) => sum + countTurns(p.cells), 0) / placements.length,
    };
  }
  throw new ChainGenerationError(`Could not generate a unique Chain puzzle for ${id}`);
}
