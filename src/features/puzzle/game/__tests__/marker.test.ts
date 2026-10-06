import { cellCenter, isOnLineFrom, strokeBetween } from '../marker';

const layout = { tile: 40, pitch: 46 };
const c = (row: number, col: number) => ({ row, col });

describe('marker strokes', () => {
  it('centres cells on the tile grid', () => {
    expect(cellCenter(c(0, 0), layout)).toEqual({ x: 20, y: 20 });
    expect(cellCenter(c(2, 1), layout)).toEqual({ x: 66, y: 112 });
  });

  it('covers a horizontal word end to end', () => {
    const s = strokeBetween(c(0, 0), c(0, 3), layout, 34);
    expect(s.angle).toBeCloseTo(0);
    expect(s.width).toBeCloseTo(3 * 46 + 34);
    expect(s.left).toBeCloseTo(20 - 17); // starts half a thickness before the first centre
    expect(s.top).toBeCloseTo(20 - 17);
  });

  it('rotates for vertical, backwards and diagonal words', () => {
    expect(strokeBetween(c(0, 0), c(3, 0), layout, 34).angle).toBeCloseTo(90);
    expect(strokeBetween(c(0, 3), c(0, 0), layout, 34).angle).toBeCloseTo(180);
    const diag = strokeBetween(c(0, 0), c(2, 2), layout, 34);
    expect(diag.angle).toBeCloseTo(45);
    expect(diag.width).toBeCloseTo(Math.hypot(92, 92) + 34);
  });

  it('is a circle for a single cell', () => {
    const s = strokeBetween(c(1, 1), c(1, 1), layout, 34);
    expect(s.width).toBe(34);
    expect(s.height).toBe(34);
  });

  it('knows which cells line up with an origin', () => {
    expect(isOnLineFrom(c(3, 3), c(3, 7))).toBe(true);
    expect(isOnLineFrom(c(3, 3), c(0, 3))).toBe(true);
    expect(isOnLineFrom(c(3, 3), c(5, 1))).toBe(true);
    expect(isOnLineFrom(c(3, 3), c(4, 5))).toBe(false);
  });
});
