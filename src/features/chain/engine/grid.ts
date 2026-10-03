import type { Cell } from '../../puzzle/engine/types';

/** Orthogonal neighbours only (Chain mode never moves diagonally). */
export const ORTHOGONAL: readonly Cell[] = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
];

export function isAdjacent(a: Cell, b: Cell): boolean {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
}

/** Number of direction changes along a path. */
export function countTurns(cells: readonly Cell[]): number {
  let turns = 0;
  for (let i = 2; i < cells.length; i++) {
    const d1 = { r: cells[i - 1].row - cells[i - 2].row, c: cells[i - 1].col - cells[i - 2].col };
    const d2 = { r: cells[i].row - cells[i - 1].row, c: cells[i].col - cells[i - 1].col };
    if (d1.r !== d2.r || d1.c !== d2.c) turns++;
  }
  return turns;
}

/** Shape label used for quality stats: straight line, tight zigzag, or snake. */
export function pathShape(cells: readonly Cell[]): 'straight' | 'zigzag' | 'snake' {
  const turns = countTurns(cells);
  if (turns === 0) return 'straight';
  if (cells.length >= 4 && turns >= cells.length - 2) return 'zigzag';
  return 'snake';
}
