/**
 * Pure selection logic between raw touch coordinates and word matching.
 * No React Native imports, so every step is unit-testable:
 *
 *   touch point → getCellFromTouchPoint → snapSelectionEnd → getCellsBetween
 *              → readCells → matchSelection
 */
import { getCellsBetween } from '../engine/getCellsBetween';
import type { Cell, Grid } from '../engine/types';

export type Point = { x: number; y: number };

/**
 * Grid cell under a point measured from the grid's top-left corner.
 * With `clamp`, points outside the grid snap to the nearest edge cell
 * (so a drag that overshoots the edge still selects the edge letter).
 */
export function getCellFromTouchPoint(
  point: Point,
  cellSize: number,
  gridSize: number,
  options: { clamp?: boolean } = {},
): Cell | null {
  if (cellSize <= 0) return null;
  let row = Math.floor(point.y / cellSize);
  let col = Math.floor(point.x / cellSize);
  if (options.clamp) {
    row = Math.min(gridSize - 1, Math.max(0, row));
    col = Math.min(gridSize - 1, Math.max(0, col));
  } else if (row < 0 || col < 0 || row >= gridSize || col >= gridSize) {
    return null;
  }
  return { row, col };
}

/**
 * Snaps a free-form drag end to the nearest of the 8 straight directions
 * from `start`, so a slightly wobbly finger still produces a straight line.
 * The result always lies inside the grid.
 */
export function snapSelectionEnd(start: Cell, rawEnd: Cell, gridSize: number): Cell {
  const dRow = rawEnd.row - start.row;
  const dCol = rawEnd.col - start.col;
  if (dRow === 0 && dCol === 0) return { ...start };

  const octant = Math.round(Math.atan2(dRow, dCol) / (Math.PI / 4));
  const angle = octant * (Math.PI / 4);
  const dirRow = Math.round(Math.sin(angle));
  const dirCol = Math.round(Math.cos(angle));

  let length =
    dirRow !== 0 && dirCol !== 0
      ? Math.round((Math.abs(dRow) + Math.abs(dCol)) / 2)
      : Math.max(Math.abs(dRow), Math.abs(dCol));

  // Shorten until the end is inside the grid.
  const inside = (n: number) => {
    const r = start.row + dirRow * n;
    const c = start.col + dirCol * n;
    return r >= 0 && c >= 0 && r < gridSize && c < gridSize;
  };
  while (length > 0 && !inside(length)) length--;

  return { row: start.row + dirRow * length, col: start.col + dirCol * length };
}

/**
 * Like `snapSelectionEnd`, but uses the finger's exact position (in px,
 * relative to the grid) instead of the integer cell under it. Measuring the
 * angle from the start cell's centre makes diagonals far easier to hit on
 * small cells.
 */
export function snapSelectionFromPoint(start: Cell, point: Point, cellSize: number, gridSize: number): Cell {
  if (cellSize <= 0) return { ...start };
  const dx = point.x / cellSize - (start.col + 0.5);
  const dy = point.y / cellSize - (start.row + 0.5);
  // Stay on the start cell until the finger has clearly left it.
  if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return { ...start };

  const octant = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));
  const angle = octant * (Math.PI / 4);
  const dirRow = Math.round(Math.sin(angle));
  const dirCol = Math.round(Math.cos(angle));
  // Project the finger vector onto the direction, in whole steps.
  const steps = (dx * dirCol + dy * dirRow) / (dirRow !== 0 && dirCol !== 0 ? 2 : 1);
  const target = {
    row: start.row + dirRow * Math.max(0, Math.round(steps)),
    col: start.col + dirCol * Math.max(0, Math.round(steps)),
  };
  return snapSelectionEnd(start, target, gridSize);
}

/** Letters under the given cells, in order. */
export function readCells(grid: Grid, cells: readonly Cell[]): string {
  return cells.map((c) => grid[c.row]?.[c.col] ?? '').join('');
}

export type SelectionMatch = {
  word: string;
  /** True when the player dragged from the last letter to the first. */
  reversed: boolean;
};

/**
 * Matches a straight selection against the unfound target words. A forward
 * read (first letter to last) always wins over a backward one, so `reversed`
 * is only true when no word reads forwards along the line. Callers decide
 * whether a reversed match counts (Classic does not). Returns `null` for
 * non-straight selections or no match.
 */
export function matchSelection(
  grid: Grid,
  start: Cell,
  end: Cell,
  words: readonly string[],
  foundWords: ReadonlySet<string>,
): SelectionMatch | null {
  const cells = getCellsBetween(start, end);
  if (!cells || cells.length < 2) return null;
  const forward = readCells(grid, cells);
  const backward = forward.split('').reverse().join('');
  const open = words.filter((word) => !foundWords.has(word));
  const ahead = open.find((word) => word === forward);
  if (ahead) return { word: ahead, reversed: false };
  const behind = open.find((word) => word === backward);
  return behind ? { word: behind, reversed: true } : null;
}

export type TapResult =
  | { type: 'anchor'; anchor: Cell }
  | { type: 'cancel' }
  | { type: 'submit'; start: Cell; end: Cell };

/**
 * Tap-to-select (the alternative to dragging): tap a word's first letter,
 * then its last.
 *  - no anchor → the tapped cell becomes the anchor
 *  - the anchor again → cancel
 *  - a cell in a straight line from the anchor → submit anchor → cell
 *  - any other cell → it becomes the new anchor
 */
export function resolveTap(anchor: Cell | null, cell: Cell): TapResult {
  if (!anchor) return { type: 'anchor', anchor: cell };
  if (anchor.row === cell.row && anchor.col === cell.col) return { type: 'cancel' };
  return getCellsBetween(anchor, cell) ? { type: 'submit', start: anchor, end: cell } : { type: 'anchor', anchor: cell };
}
