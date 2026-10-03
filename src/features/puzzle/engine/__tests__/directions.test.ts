import {
  DIRECTIONS,
  DIRECTION_VECTORS,
  cellsAlong,
  getDirectionCategory,
  getDirectionName,
  isReverseDirection,
  isValidDirection,
} from '../directions';
import { findWordOccurrences } from '../gridScan';
import { gridFrom } from './helpers';

describe('directions', () => {
  it('defines 8 unique unit vectors', () => {
    expect(DIRECTIONS).toHaveLength(8);
    const keys = new Set(DIRECTIONS.map((d) => `${d.row},${d.col}`));
    expect(keys.size).toBe(8);
    DIRECTIONS.forEach((d) => expect(isValidDirection(d)).toBe(true));
  });

  it('rejects non-unit vectors', () => {
    expect(isValidDirection({ row: 0, col: 0 })).toBe(false);
    expect(isValidDirection({ row: 2, col: 0 })).toBe(false);
  });

  it('categorises directions', () => {
    expect(getDirectionCategory(DIRECTION_VECTORS.E)).toBe('horizontal');
    expect(getDirectionCategory(DIRECTION_VECTORS.W)).toBe('horizontal');
    expect(getDirectionCategory(DIRECTION_VECTORS.S)).toBe('vertical');
    expect(getDirectionCategory(DIRECTION_VECTORS.N)).toBe('vertical');
    expect(getDirectionCategory(DIRECTION_VECTORS.NE)).toBe('diagonal');
    expect(getDirectionCategory(DIRECTION_VECTORS.SW)).toBe('diagonal');
  });

  it('treats right-to-left and bottom-to-top as reverse', () => {
    expect(isReverseDirection(DIRECTION_VECTORS.E)).toBe(false);
    expect(isReverseDirection(DIRECTION_VECTORS.S)).toBe(false);
    expect(isReverseDirection(DIRECTION_VECTORS.SE)).toBe(false);
    expect(isReverseDirection(DIRECTION_VECTORS.NE)).toBe(false);
    expect(isReverseDirection(DIRECTION_VECTORS.W)).toBe(true);
    expect(isReverseDirection(DIRECTION_VECTORS.N)).toBe(true);
    expect(isReverseDirection(DIRECTION_VECTORS.NW)).toBe(true);
    expect(isReverseDirection(DIRECTION_VECTORS.SW)).toBe(true);
  });

  it('round-trips names', () => {
    for (const [name, vector] of Object.entries(DIRECTION_VECTORS)) {
      expect(getDirectionName(vector)).toBe(name);
    }
  });

  it('walks cells along a direction', () => {
    expect(cellsAlong({ row: 2, col: 2 }, DIRECTION_VECTORS.NW, 3)).toEqual([
      { row: 2, col: 2 },
      { row: 1, col: 1 },
      { row: 0, col: 0 },
    ]);
  });
});

describe('findWordOccurrences', () => {
  const grid = gridFrom([
    'CATX', // CAT horizontal
    'XOXD', // DOG reverse vertical (col 3 bottom-to-top: G,O,D)
    'XXOO',
    'TAXG',
  ]);

  it('finds horizontal words', () => {
    expect(findWordOccurrences(grid, 'CAT')).toEqual([[{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }]]);
  });

  it('finds reverse words', () => {
    expect(findWordOccurrences(grid, 'GOD')).toEqual([[{ row: 3, col: 3 }, { row: 2, col: 3 }, { row: 1, col: 3 }]]);
  });

  it('finds diagonal words', () => {
    expect(findWordOccurrences(grid, 'COO')).toEqual([[{ row: 0, col: 0 }, { row: 1, col: 1 }, { row: 2, col: 2 }]]);
  });

  it('counts a palindrome once', () => {
    const g = gridFrom(['ABA', 'XXX', 'XXX']);
    expect(findWordOccurrences(g, 'ABA')).toHaveLength(1);
  });
});
