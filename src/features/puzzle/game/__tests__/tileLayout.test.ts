import { getCellFromTouchPoint } from '../selection';
import { boardSizeFor, getTileLayout } from '../tileLayout';

describe('getTileLayout', () => {
  it('fits the grid inside the available size', () => {
    for (const n of [8, 10, 12, 14]) {
      for (const max of [280, 330, 358, 500]) {
        const l = getTileLayout(n, max);
        expect(l.size).toBeLessThanOrEqual(max);
        expect(l.size).toBeGreaterThan(max - n * 2);
        expect(l.pitch).toBe(l.tile + l.gap);
      }
    }
  });

  it('uses smaller gaps on dense grids', () => {
    expect(getTileLayout(14, 358).gap).toBeLessThan(getTileLayout(8, 358).gap);
  });

  it('maps touches on the last tile and in gaps to a valid cell', () => {
    const l = getTileLayout(10, 358);
    expect(getCellFromTouchPoint({ x: l.size - 1, y: l.size - 1 }, l.pitch, 10)).toEqual({ row: 9, col: 9 });
    // A point in the gap after tile 0 belongs to tile 0 (gap is trailing).
    expect(getCellFromTouchPoint({ x: l.tile + l.gap / 2, y: 1 }, l.pitch, 10)).toEqual({ row: 0, col: 0 });
  });
});

describe('boardSizeFor', () => {
  it('spans the content width on a phone, up to the max', () => {
    expect(boardSizeFor(390, 844, 16, 560)).toBe(358);
    expect(boardSizeFor(800, 2000, 16, 560)).toBe(560);
  });

  it('caps by height on wide, short windows, but never below the floor', () => {
    expect(boardSizeFor(1200, 800, 16, 560)).toBe(440);
    expect(boardSizeFor(1200, 400, 16, 560)).toBe(300);
  });
});
