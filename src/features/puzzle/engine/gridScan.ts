import { DIRECTIONS } from './directions';
import type { Cell, WorkingGrid } from './types';

export function cellKey(cell: Cell): string {
  return `${cell.row},${cell.col}`;
}

/** Order-independent key for a set of cells (so a palindrome read both ways counts once). */
export function cellSetKey(cells: readonly Cell[]): string {
  return cells.map(cellKey).sort().join('|');
}

/**
 * Every straight-line occurrence of `word` in the grid, in all 8 directions.
 * Occurrences covering the same cells (palindromes) are reported once.
 */
export function findWordOccurrences(grid: WorkingGrid, word: string): Cell[][] {
  const size = grid.length;
  const found = new Map<string, Cell[]>();
  if (word.length === 0) return [];

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (grid[row][col] !== word[0]) continue;
      for (const dir of DIRECTIONS) {
        const endRow = row + dir.row * (word.length - 1);
        const endCol = col + dir.col * (word.length - 1);
        if (endRow < 0 || endCol < 0 || endRow >= size || endCol >= size) continue;
        let match = true;
        for (let i = 1; i < word.length; i++) {
          if (grid[row + dir.row * i][col + dir.col * i] !== word[i]) {
            match = false;
            break;
          }
        }
        if (!match) continue;
        const cells: Cell[] = [];
        for (let i = 0; i < word.length; i++) cells.push({ row: row + dir.row * i, col: col + dir.col * i });
        const key = cellSetKey(cells);
        if (!found.has(key)) found.set(key, cells);
      }
    }
  }
  return [...found.values()];
}

/** Number of straight-line occurrences of `fragment` (direction-sensitive, not de-duplicated). */
export function countFragmentOccurrences(grid: WorkingGrid, fragment: string): number {
  return findWordOccurrences(grid, fragment).length;
}
