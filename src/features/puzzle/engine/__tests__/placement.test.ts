import { DIRECTION_VECTORS } from '../directions';
import { getDifficultyConfig } from '../difficultyConfig';
import { canPlaceWord, createEmptyGrid, makePlacement, placeWords, writeWord } from '../placeWords';
import { createRng } from '../random';
import { getCellsBetween } from '../getCellsBetween';

describe('canPlaceWord', () => {
  it('accepts a word that fits', () => {
    const grid = createEmptyGrid(5);
    const result = canPlaceWord(grid, 'CAT', { row: 0, col: 0 }, DIRECTION_VECTORS.E);
    expect(result.ok).toBe(true);
  });

  it('rejects a word that runs off the grid', () => {
    const grid = createEmptyGrid(5);
    expect(canPlaceWord(grid, 'TIGER', { row: 0, col: 1 }, DIRECTION_VECTORS.E)).toEqual({ ok: false, reason: 'out-of-bounds' });
    expect(canPlaceWord(grid, 'CAT', { row: 1, col: 1 }, DIRECTION_VECTORS.NW)).toEqual({ ok: false, reason: 'out-of-bounds' });
  });

  it('accepts a word exactly at the boundary', () => {
    const grid = createEmptyGrid(5);
    expect(canPlaceWord(grid, 'TIGER', { row: 4, col: 0 }, DIRECTION_VECTORS.E).ok).toBe(true);
    expect(canPlaceWord(grid, 'TIGER', { row: 4, col: 4 }, DIRECTION_VECTORS.NW).ok).toBe(true);
    expect(canPlaceWord(grid, 'TIGER', { row: 4, col: 4 }, DIRECTION_VECTORS.N).ok).toBe(true);
  });

  it('allows overlapping on a matching letter', () => {
    const grid = createEmptyGrid(5);
    writeWord(grid, makePlacement('CAT', { row: 0, col: 0 }, DIRECTION_VECTORS.E));
    const result = canPlaceWord(grid, 'CAR', { row: 0, col: 0 }, DIRECTION_VECTORS.S);
    expect(result).toMatchObject({ ok: true, intersections: 1 });
    const vertical = canPlaceWord(grid, 'TAR', { row: 0, col: 1 }, DIRECTION_VECTORS.S);
    expect(vertical).toMatchObject({ ok: false, reason: 'conflict' }); // T ≠ A
    const cross = canPlaceWord(grid, 'OAR', { row: -1, col: 1 }, DIRECTION_VECTORS.S);
    expect(cross.ok).toBe(false); // starts outside
    const crossOk = canPlaceWord(grid, 'AXE', { row: 0, col: 1 }, DIRECTION_VECTORS.S);
    expect(crossOk).toMatchObject({ ok: true, intersections: 1 });
  });

  it('rejects conflicting letters', () => {
    const grid = createEmptyGrid(5);
    writeWord(grid, makePlacement('CAT', { row: 0, col: 0 }, DIRECTION_VECTORS.E));
    expect(canPlaceWord(grid, 'DOG', { row: 0, col: 0 }, DIRECTION_VECTORS.S)).toEqual({ ok: false, reason: 'conflict' });
  });
});

describe('makePlacement', () => {
  it('computes end and cells for every direction', () => {
    for (const direction of Object.values(DIRECTION_VECTORS)) {
      const placement = makePlacement('WORD', { row: 4, col: 4 }, direction);
      expect(placement.end).toEqual({ row: 4 + direction.row * 3, col: 4 + direction.col * 3 });
      expect(placement.cells).toEqual(getCellsBetween(placement.start, placement.end));
    }
  });
});

describe('placeWords', () => {
  it('places all words without conflicts and respects allowed directions', () => {
    const config = getDifficultyConfig('easy');
    const result = placeWords({
      words: ['TIGER', 'LION', 'ZEBRA', 'PANDA', 'WOLF', 'BEAR'],
      reserves: [],
      gridSize: 8,
      config,
      minCount: 6,
      letterBudget: 40,
      rng: createRng(1),
    });
    expect(result).not.toBeNull();
    for (const p of result!.placements) {
      expect([0, 1]).toContain(p.direction.row);
      expect([0, 1]).toContain(p.direction.col);
      p.cells.forEach((cell, i) => expect(result!.grid[cell.row][cell.col]).toBe(p.word[i]));
    }
  });

  it('returns null when too few words can be placed', () => {
    const result = placeWords({
      words: ['ABCDEFGH', 'IJKLMNOP'],
      reserves: [],
      gridSize: 5,
      config: getDifficultyConfig('easy'),
      minCount: 2,
      letterBudget: 100,
      rng: createRng(1),
    });
    expect(result).toBeNull();
  });
});
