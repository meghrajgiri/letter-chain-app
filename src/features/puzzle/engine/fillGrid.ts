import { findBlockedWords } from './blockedWords';
import { DIRECTIONS } from './directions';
import { cellKey, cellSetKey, findWordOccurrences } from './gridScan';
import { canPlaceWord } from './placeWords';
import type { Rng } from './random';
import type { Cell, DifficultyConfig, Grid, WordPlacement, WorkingGrid } from './types';

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Approximate English letter frequencies (%). Rare letters stay rare so they don't stand out. */
const ENGLISH_FREQUENCY: Record<string, number> = {
  A: 8.2, B: 1.5, C: 2.8, D: 4.3, E: 12.7, F: 2.2, G: 2.0, H: 6.1, I: 7.0, J: 0.15, K: 0.77, L: 4.0, M: 2.4,
  N: 6.7, O: 7.5, P: 1.9, Q: 0.1, R: 6.0, S: 6.3, T: 9.1, U: 2.8, V: 0.98, W: 2.4, X: 0.15, Y: 2.0, Z: 0.07,
};

const ENGLISH_LETTERS = ALPHABET.split('');
const ENGLISH_WEIGHTS = ENGLISH_LETTERS.map((l) => ENGLISH_FREQUENCY[l]);

export type FillGridInput = {
  grid: WorkingGrid;
  placements: WordPlacement[];
  config: DifficultyConfig;
  rng: Rng;
};

export type FillGridResult = {
  grid: Grid;
  decoys: number;
};

const MAX_REPAIR_PASSES = 40;

/**
 * Fills empty cells and guarantees every target word appears exactly once.
 *
 * 1. Plants decoy fragments (a word's first few letters, going nowhere).
 * 2. Fills the rest with letters drawn from English frequency, blended with
 *    the puzzle's own letters by `fillerWordLetterBias` so words don't pop out.
 * 3. Re-rolls filler cells that accidentally spell a second copy of a word,
 *    or a blocked (rude) word.
 *
 * Returns `null` when a duplicate or blocked word is made only of placed
 * letters (the caller should retry with a different layout).
 */
export function fillGrid(input: FillGridInput): FillGridResult | null {
  const { placements, config, rng } = input;
  const size = input.grid.length;
  const grid: WorkingGrid = input.grid.map((row) => row.slice());
  const filler = new Set<string>();

  const wordLetters: string[] = [];
  for (const p of placements) wordLetters.push(...p.word.split(''));

  const drawLetter = (): string =>
    rng.chance(config.fillerWordLetterBias) && wordLetters.length > 0
      ? rng.pick(wordLetters)
      : ENGLISH_LETTERS[rng.weightedIndex(ENGLISH_WEIGHTS)];

  // 1. Decoy fragments: a word's opening letters that lead nowhere.
  const decoyTarget = rng.int(config.decoyCount.min, config.decoyCount.max);
  const decoySource = placements.filter((p) => p.word.length >= 5);
  let decoys = 0;
  for (let i = 0; i < decoyTarget && decoySource.length > 0; i++) {
    const word = rng.pick(decoySource).word;
    const length = rng.int(Math.max(3, Math.ceil(word.length * 0.45)), Math.max(3, Math.min(word.length - 2, Math.ceil(word.length * 0.7))));
    const fragment = word.slice(0, length);
    const spots: { start: Cell; direction: (typeof DIRECTIONS)[number] }[] = [];
    for (const direction of DIRECTIONS) {
      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          const check = canPlaceWord(grid, fragment, { row, col }, direction);
          // Must add at least two new letters so it isn't hidden inside a real word.
          if (check.ok && fragment.length - check.intersections >= 2 && check.intersections <= 1) {
            spots.push({ start: { row, col }, direction });
          }
        }
      }
    }
    if (spots.length === 0) continue;
    const spot = rng.pick(spots);
    for (let k = 0; k < fragment.length; k++) {
      const row = spot.start.row + spot.direction.row * k;
      const col = spot.start.col + spot.direction.col * k;
      if (grid[row][col] === null) {
        grid[row][col] = fragment[k];
        filler.add(`${row},${col}`);
      }
    }
    decoys++;
  }

  // 2. Random filler.
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (grid[row][col] === null) {
        grid[row][col] = drawLetter();
        filler.add(`${row},${col}`);
      }
    }
  }

  // 3. Remove accidental duplicates and blocked words by re-rolling a filler letter.
  const intended = new Map(placements.map((p) => [p.word, cellSetKey(p.cells)]));
  const wordCells = placements.map((p) => p.cells);
  const reroll = (occurrence: readonly Cell[]): boolean => {
    const fixable = occurrence.filter((cell) => filler.has(cellKey(cell)));
    if (fixable.length === 0) return false;
    const cell = rng.pick(fixable);
    const current = grid[cell.row][cell.col];
    let next = current;
    while (next === current) next = ENGLISH_LETTERS[rng.weightedIndex(ENGLISH_WEIGHTS)];
    grid[cell.row][cell.col] = next;
    return true;
  };
  for (let pass = 0; pass < MAX_REPAIR_PASSES; pass++) {
    let clean = true;
    for (const placement of placements) {
      for (const occurrence of findWordOccurrences(grid, placement.word)) {
        if (cellSetKey(occurrence) === intended.get(placement.word)) continue;
        clean = false;
        if (!reroll(occurrence)) return null;
      }
    }
    for (const occurrence of findBlockedWords(grid, wordCells)) {
      clean = false;
      if (!reroll(occurrence)) return null;
    }
    if (clean) return { grid: grid as Grid, decoys };
  }
  return null;
}
