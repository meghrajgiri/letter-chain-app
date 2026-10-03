import type { Cell, DirectionVector } from './types';

/**
 * Cells on the straight line from `start` to `end` (inclusive), or `null`
 * when the two cells are not on a horizontal, vertical or 45° diagonal line.
 * L-shaped or arbitrary paths are rejected by design.
 */
export function getCellsBetween(start: Cell, end: Cell): Cell[] | null {
  const dRow = end.row - start.row;
  const dCol = end.col - start.col;

  if (dRow === 0 && dCol === 0) return [{ row: start.row, col: start.col }];
  if (dRow !== 0 && dCol !== 0 && Math.abs(dRow) !== Math.abs(dCol)) return null;

  const steps = Math.max(Math.abs(dRow), Math.abs(dCol));
  const direction = { row: Math.sign(dRow), col: Math.sign(dCol) } as DirectionVector;
  const cells: Cell[] = [];
  for (let i = 0; i <= steps; i++) {
    cells.push({ row: start.row + direction.row * i, col: start.col + direction.col * i });
  }
  return cells;
}
