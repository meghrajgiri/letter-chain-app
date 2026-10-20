import { getCellsBetween } from '../../engine/getCellsBetween';
import type { Grid } from '../../engine/types';
import { getCellFromTouchPoint, matchSelection, readCells, resolveTap, snapSelectionEnd, snapSelectionFromPoint } from '../selection';

const grid: Grid = ['CATS', 'XOXX', 'XXWX', 'TACX'].map((r) => r.split(''));

describe('getCellsBetween', () => {
  it('returns horizontal cells', () => {
    expect(getCellsBetween({ row: 0, col: 0 }, { row: 0, col: 2 })).toEqual([
      { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 },
    ]);
  });

  it('returns vertical cells', () => {
    expect(getCellsBetween({ row: 0, col: 1 }, { row: 2, col: 1 })).toHaveLength(3);
  });

  it('returns diagonal cells', () => {
    expect(getCellsBetween({ row: 0, col: 0 }, { row: 2, col: 2 })).toEqual([
      { row: 0, col: 0 }, { row: 1, col: 1 }, { row: 2, col: 2 },
    ]);
  });

  it('returns reverse cells in drag order', () => {
    expect(getCellsBetween({ row: 0, col: 2 }, { row: 0, col: 0 })).toEqual([
      { row: 0, col: 2 }, { row: 0, col: 1 }, { row: 0, col: 0 },
    ]);
  });

  it('rejects L-shaped / non-45° selections', () => {
    expect(getCellsBetween({ row: 0, col: 0 }, { row: 1, col: 2 })).toBeNull();
    expect(getCellsBetween({ row: 0, col: 0 }, { row: 3, col: 1 })).toBeNull();
  });

  it('returns a single cell when start equals end', () => {
    expect(getCellsBetween({ row: 1, col: 1 }, { row: 1, col: 1 })).toEqual([{ row: 1, col: 1 }]);
  });
});

describe('getCellFromTouchPoint', () => {
  it('maps points to cells', () => {
    expect(getCellFromTouchPoint({ x: 5, y: 5 }, 40, 4)).toEqual({ row: 0, col: 0 });
    expect(getCellFromTouchPoint({ x: 85, y: 125 }, 40, 4)).toEqual({ row: 3, col: 2 });
  });

  it('returns null outside the grid unless clamped', () => {
    expect(getCellFromTouchPoint({ x: -3, y: 10 }, 40, 4)).toBeNull();
    expect(getCellFromTouchPoint({ x: 500, y: -20 }, 40, 4, { clamp: true })).toEqual({ row: 0, col: 3 });
  });
});

describe('snapSelectionEnd', () => {
  it('keeps exact straight lines', () => {
    expect(snapSelectionEnd({ row: 0, col: 0 }, { row: 0, col: 3 }, 4)).toEqual({ row: 0, col: 3 });
    expect(snapSelectionEnd({ row: 0, col: 0 }, { row: 3, col: 3 }, 4)).toEqual({ row: 3, col: 3 });
  });

  it('snaps a wobbly horizontal drag to horizontal', () => {
    expect(snapSelectionEnd({ row: 1, col: 0 }, { row: 2, col: 3 }, 4)).toEqual({ row: 1, col: 3 });
  });

  it('snaps a near-diagonal drag to diagonal', () => {
    expect(snapSelectionEnd({ row: 0, col: 0 }, { row: 3, col: 2 }, 4)).toEqual({ row: 3, col: 3 });
  });

  it('keeps the end inside the grid', () => {
    const end = snapSelectionEnd({ row: 3, col: 0 }, { row: 0, col: 2 }, 4);
    expect(end.row).toBeGreaterThanOrEqual(0);
    expect(end.col).toBeLessThan(4);
    expect(getCellsBetween({ row: 3, col: 0 }, end)).not.toBeNull();
  });
});

describe('snapSelectionFromPoint', () => {
  const size = 40;
  const centre = (row: number, col: number) => ({ x: (col + 0.5) * size, y: (row + 0.5) * size });

  it('stays on the start cell for small movements', () => {
    expect(snapSelectionFromPoint({ row: 1, col: 1 }, { x: 70, y: 55 }, size, 4)).toEqual({ row: 1, col: 1 });
  });

  it('follows a horizontal drag', () => {
    expect(snapSelectionFromPoint({ row: 0, col: 0 }, centre(0, 3), size, 4)).toEqual({ row: 0, col: 3 });
  });

  it('follows a reverse vertical drag', () => {
    expect(snapSelectionFromPoint({ row: 3, col: 2 }, centre(0, 2), size, 4)).toEqual({ row: 0, col: 2 });
  });

  it('snaps an imprecise diagonal drag onto the diagonal', () => {
    // Finger ends between (2,2) and (2,3): still clearly diagonal.
    expect(snapSelectionFromPoint({ row: 0, col: 0 }, { x: 115, y: 100 }, size, 4)).toEqual({ row: 2, col: 2 });
  });

  it('keeps the end inside the grid', () => {
    expect(snapSelectionFromPoint({ row: 0, col: 0 }, { x: 900, y: 900 }, size, 4)).toEqual({ row: 3, col: 3 });
  });
});

describe('matchSelection', () => {
  const words = ['CAT', 'COW', 'SOX'];

  it('matches a horizontal word', () => {
    expect(matchSelection(grid, { row: 0, col: 0 }, { row: 0, col: 2 }, words, new Set())).toEqual({ word: 'CAT', reversed: false });
  });

  it('matches a diagonal word', () => {
    expect(matchSelection(grid, { row: 0, col: 0 }, { row: 2, col: 2 }, words, new Set())).toEqual({ word: 'COW', reversed: false });
  });

  it('reports a word selected in reverse as reversed', () => {
    expect(matchSelection(grid, { row: 0, col: 2 }, { row: 0, col: 0 }, words, new Set())).toEqual({ word: 'CAT', reversed: true });
  });

  it('matches a vertical word', () => {
    const g: Grid = ['DXX', 'OXX', 'GXX'].map((r) => r.split(''));
    expect(matchSelection(g, { row: 2, col: 0 }, { row: 0, col: 0 }, ['DOG'], new Set())).toEqual({ word: 'DOG', reversed: true });
  });

  it('prefers a word read forwards over one read backwards on the same line', () => {
    const g: Grid = ['TOP', 'XXX', 'XXX'].map((r) => r.split(''));
    // POT comes first in the list but only reads backwards; TOP reads forwards.
    expect(matchSelection(g, { row: 0, col: 0 }, { row: 0, col: 2 }, ['POT', 'TOP'], new Set())).toEqual({ word: 'TOP', reversed: false });
  });

  it('ignores already found words', () => {
    expect(matchSelection(grid, { row: 0, col: 0 }, { row: 0, col: 2 }, words, new Set(['CAT']))).toBeNull();
  });

  it('rejects L-shaped selections', () => {
    expect(matchSelection(grid, { row: 0, col: 0 }, { row: 1, col: 2 }, words, new Set())).toBeNull();
  });

  it('reads letters from cells', () => {
    expect(readCells(grid, [{ row: 3, col: 0 }, { row: 3, col: 1 }, { row: 3, col: 2 }])).toBe('TAC');
  });
});

describe('resolveTap', () => {
  const at = (row: number, col: number) => ({ row, col });

  it('sets the anchor on the first tap', () => {
    expect(resolveTap(null, at(2, 3))).toEqual({ type: 'anchor', anchor: at(2, 3) });
  });

  it('cancels when the anchor is tapped again', () => {
    expect(resolveTap(at(2, 3), at(2, 3))).toEqual({ type: 'cancel' });
  });

  it('submits a straight line in any of the 8 directions', () => {
    expect(resolveTap(at(2, 2), at(2, 6))).toEqual({ type: 'submit', start: at(2, 2), end: at(2, 6) });
    expect(resolveTap(at(2, 2), at(0, 2))).toEqual({ type: 'submit', start: at(2, 2), end: at(0, 2) });
    expect(resolveTap(at(2, 2), at(5, 5))).toEqual({ type: 'submit', start: at(2, 2), end: at(5, 5) });
    expect(resolveTap(at(2, 2), at(4, 0))).toEqual({ type: 'submit', start: at(2, 2), end: at(4, 0) });
  });

  it('moves the anchor when the second tap is not in line', () => {
    expect(resolveTap(at(0, 0), at(1, 2))).toEqual({ type: 'anchor', anchor: at(1, 2) });
  });
});
