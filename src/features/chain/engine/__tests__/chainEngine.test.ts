import { THEMES } from '../../../puzzle/data/themes';
import { createRng } from '../../../puzzle/engine/random';
import { CHAIN_CONFIGS } from '../config';
import { generateChainPuzzle } from '../generateChainPuzzle';
import { countTurns, isAdjacent, pathShape } from '../grid';
import { partitionGrid } from '../partitionGrid';
import { selectChainWords } from '../selectChainWords';
import { findTracings, solveChain } from '../solver';
import { CHAIN_DIFFICULTIES } from '../types';
import { validateChainPuzzle } from '../validateChain';

describe('selectChainWords', () => {
  it('picks words whose lengths sum exactly to the grid size', () => {
    const words = selectChainWords({
      candidates: THEMES[0].words,
      totalLetters: 36,
      count: { min: 5, max: 7 },
      length: { min: 4, max: 8 },
      rng: createRng(1),
    })!;
    expect(words.reduce((s, w) => s + w.length, 0)).toBe(36);
    expect(words.length).toBeGreaterThanOrEqual(5);
    expect(words.length).toBeLessThanOrEqual(7);
  });

  it('returns null when no combination exists', () => {
    expect(selectChainWords({ candidates: ['ABCD', 'EFGH'], totalLetters: 9, count: { min: 2, max: 2 }, length: { min: 3, max: 8 }, rng: createRng(1) })).toBeNull();
  });
});

describe('partitionGrid', () => {
  it('covers every cell exactly once with orthogonal paths of the requested lengths', () => {
    const lengths = [8, 7, 7, 6, 4, 4];
    const paths = partitionGrid({ rows: 6, cols: 6, lengths, rng: createRng(7) })!;
    expect(paths).not.toBeNull();
    expect(paths.map((p) => p.length).sort()).toEqual([...lengths].sort());
    const seen = new Set<string>();
    for (const path of paths) {
      path.forEach((cell, i) => {
        seen.add(`${cell.row},${cell.col}`);
        if (i > 0) expect(isAdjacent(path[i - 1], cell)).toBe(true);
      });
    }
    expect(seen.size).toBe(36);
  });
});

describe('solver', () => {
  const grid = ['CAT', 'DOG', 'EMU'].map((r) => r.split(''));

  it('finds orthogonal tracings only', () => {
    expect(findTracings(grid, 'CAT')).toHaveLength(1);
    expect(findTracings(grid, 'COU')).toHaveLength(0); // diagonal-only path
  });

  it('counts a unique solution', () => {
    expect(solveChain(grid, ['CAT', 'DOG', 'EMU']).count).toBe(1);
  });

  it('detects ambiguous puzzles', () => {
    // AB/BA: "AB" can be traced in several ways that still tile the 2×2 grid.
    const g = ['AB', 'BA'].map((r) => r.split(''));
    expect(solveChain(g, ['AB', 'BA']).count).toBeGreaterThan(1);
  });
});

describe('path shape helpers', () => {
  it('classifies paths', () => {
    expect(pathShape([{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }])).toBe('straight');
    expect(countTurns([{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 1 }])).toBe(1);
  });
});

describe.each(CHAIN_DIFFICULTIES)('generating 60 %s Chain puzzles', (difficulty) => {
  const puzzles = Array.from({ length: 60 }, (_, i) =>
    generateChainPuzzle({ theme: THEMES[i % THEMES.length].id, difficulty, seed: 4000 + i }),
  );
  const config = CHAIN_CONFIGS[difficulty];

  it('every puzzle is valid with exactly one solution', () => {
    expect(puzzles.map((p) => validateChainPuzzle(p)).filter((v) => !v.valid)).toEqual([]);
  });

  it('finding every word uses every letter in the grid (no filler)', () => {
    for (const p of puzzles) {
      const letters = p.words.reduce((s, w) => s + w.length, 0);
      expect(letters).toBe(config.rows * config.cols);
      const covered = new Set(p.placements.flatMap((pl) => pl.cells.map((c) => `${c.row},${c.col}`)));
      expect(covered.size).toBe(config.rows * config.cols);
    }
  });

  it('respects word count and length ranges', () => {
    for (const p of puzzles) {
      expect(p.words.length).toBeGreaterThanOrEqual(config.wordCount.min);
      expect(p.words.length).toBeLessThanOrEqual(config.wordCount.max);
      for (const w of p.words) {
        expect(w.length).toBeGreaterThanOrEqual(config.wordLength.min);
        expect(w.length).toBeLessThanOrEqual(config.wordLength.max);
      }
    }
  });

  it('mostly produces winding (snake) paths', () => {
    const shapes = puzzles.flatMap((p) => p.placements.map((pl) => pathShape(pl.cells)));
    expect(shapes.filter((s) => s === 'snake').length / shapes.length).toBeGreaterThan(0.75);
  });
});

describe('determinism and history', () => {
  it('same seed gives the same puzzle', () => {
    const a = generateChainPuzzle({ theme: 'animals', difficulty: 'medium', seed: 12345 });
    const b = generateChainPuzzle({ theme: 'animals', difficulty: 'medium', seed: 12345 });
    expect(a).toEqual(b);
  });

  it('avoids recently used words when possible', () => {
    const first = generateChainPuzzle({ theme: 'food', difficulty: 'easy', seed: 1 });
    const next = generateChainPuzzle({ theme: 'food', difficulty: 'easy', seed: 2, avoidWords: first.words });
    expect(next.words.filter((w) => first.words.includes(w))).toEqual([]);
  });
});
