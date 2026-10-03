import type { Cell, DirectionCategory, DirectionName, DirectionVector } from './types';

/**
 * All eight reading directions. Placement, scanning and selection logic all
 * work from these vectors; nothing is duplicated per direction.
 *
 *   NW  N  NE
 *    W     E
 *   SW  S  SE
 */
export const DIRECTION_VECTORS: Record<DirectionName, DirectionVector> = {
  E: { row: 0, col: 1 },
  W: { row: 0, col: -1 },
  S: { row: 1, col: 0 },
  N: { row: -1, col: 0 },
  SE: { row: 1, col: 1 },
  NW: { row: -1, col: -1 },
  NE: { row: -1, col: 1 },
  SW: { row: 1, col: -1 },
};

export const DIRECTION_NAMES = Object.keys(DIRECTION_VECTORS) as DirectionName[];

export const DIRECTIONS: DirectionVector[] = DIRECTION_NAMES.map((name) => DIRECTION_VECTORS[name]);

export const DIRECTION_ARROWS: Record<DirectionName, string> = {
  E: '→',
  W: '←',
  S: '↓',
  N: '↑',
  SE: '↘',
  NW: '↖',
  NE: '↗',
  SW: '↙',
};

export function getDirectionName(direction: DirectionVector): DirectionName {
  const name = DIRECTION_NAMES.find(
    (n) => DIRECTION_VECTORS[n].row === direction.row && DIRECTION_VECTORS[n].col === direction.col,
  );
  if (!name) throw new Error(`Invalid direction ${direction.row},${direction.col}`);
  return name;
}

export function isValidDirection(direction: { row: number; col: number }): boolean {
  return (
    Number.isInteger(direction.row) &&
    Number.isInteger(direction.col) &&
    Math.abs(direction.row) <= 1 &&
    Math.abs(direction.col) <= 1 &&
    !(direction.row === 0 && direction.col === 0)
  );
}

export function getDirectionCategory(direction: DirectionVector): DirectionCategory {
  if (direction.row === 0) return 'horizontal';
  if (direction.col === 0) return 'vertical';
  return 'diagonal';
}

/**
 * A word is "reversed" when it reads against natural reading order:
 * right-to-left, or bottom-to-top for vertical words.
 */
export function isReverseDirection(direction: DirectionVector): boolean {
  return direction.col < 0 || (direction.col === 0 && direction.row < 0);
}

export function isDiagonal(direction: DirectionVector): boolean {
  return direction.row !== 0 && direction.col !== 0;
}

/** Cell `steps` cells away from `start` along `direction`. */
export function stepCell(start: Cell, direction: DirectionVector, steps: number): Cell {
  return { row: start.row + direction.row * steps, col: start.col + direction.col * steps };
}

export function isInsideGrid(cell: Cell, gridSize: number): boolean {
  return cell.row >= 0 && cell.col >= 0 && cell.row < gridSize && cell.col < gridSize;
}

/** Cells of a straight run of `length` cells. */
export function cellsAlong(start: Cell, direction: DirectionVector, length: number): Cell[] {
  const cells: Cell[] = [];
  for (let i = 0; i < length; i++) cells.push(stepCell(start, direction, i));
  return cells;
}
