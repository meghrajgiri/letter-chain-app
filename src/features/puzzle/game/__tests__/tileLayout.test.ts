import { getCellFromTouchPoint } from '../selection';
import { getTileLayout } from '../tileLayout';

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
