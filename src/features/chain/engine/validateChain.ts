import { findBlockedWords } from '../../puzzle/engine/blockedWords';
import { cellKey } from '../../puzzle/engine/gridScan';
import { isAdjacent } from './grid';
import { solveChain } from './solver';
import type { ChainPuzzle } from './types';

export type ChainValidation = { valid: boolean; errors: string[] };

/** Structural checks plus the single-solution guarantee. */
export function validateChainPuzzle(p: Pick<ChainPuzzle, 'rows' | 'cols' | 'grid' | 'words' | 'placements'>): ChainValidation {
  const errors: string[] = [];
  const seen = new Set<string>();
  if (p.grid.length !== p.rows || p.grid.some((row) => row.length !== p.cols)) errors.push('Grid has the wrong shape');
  if (p.grid.some((row) => row.some((l) => !/^[A-Z]$/.test(l)))) errors.push('Grid has empty or invalid cells');
  const total = p.placements.reduce((sum, pl) => sum + pl.cells.length, 0);
  if (total !== p.rows * p.cols) errors.push(`Words cover ${total} cells, grid has ${p.rows * p.cols}`);
  for (const pl of p.placements) {
    if (pl.cells.length !== pl.word.length) errors.push(`${pl.word} has ${pl.cells.length} cells`);
    pl.cells.forEach((cell, i) => {
      const key = cellKey(cell);
      if (seen.has(key)) errors.push(`Cell ${key} is used twice`);
      seen.add(key);
      if (p.grid[cell.row]?.[cell.col] !== pl.word[i]) errors.push(`${pl.word} letter ${i} does not match the grid`);
      if (i > 0 && !isAdjacent(pl.cells[i - 1], cell)) errors.push(`${pl.word} path is not orthogonally connected`);
    });
  }
  if (errors.length === 0) {
    const solutions = solveChain(p.grid, p.words, 2).count;
    if (solutions !== 1) errors.push(`Puzzle has ${solutions} solutions (expected exactly 1)`);
  }
  if (findBlockedWords(p.grid, p.placements.map((pl) => pl.cells)).length > 0) errors.push('Grid spells a blocked word');
  return { valid: errors.length === 0, errors };
}
