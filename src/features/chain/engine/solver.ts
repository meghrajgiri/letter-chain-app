import { cellSetKey } from '../../puzzle/engine/gridScan';
import type { Cell } from '../../puzzle/engine/types';
import { ORTHOGONAL } from './grid';

/** Every orthogonal self-avoiding path spelling `word` (same cells + word counted once). */
export function findTracings(grid: readonly (readonly string[])[], word: string): Cell[][] {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const found = new Map<string, Cell[]>();
  const used: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
  const path: Cell[] = [];

  const extend = (r: number, c: number, i: number) => {
    if (grid[r][c] !== word[i]) return;
    used[r][c] = true;
    path.push({ row: r, col: c });
    if (i === word.length - 1) {
      const key = cellSetKey(path);
      if (!found.has(key)) found.set(key, path.slice());
    } else {
      for (const o of ORTHOGONAL) {
        const nr = r + o.row;
        const nc = c + o.col;
        if (nr >= 0 && nc >= 0 && nr < rows && nc < cols && !used[nr][nc]) extend(nr, nc, i + 1);
      }
    }
    path.pop();
    used[r][c] = false;
  };

  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) extend(r, c, 0);
  return [...found.values()];
}

export type SolveResult = {
  /** Number of distinct solutions found, capped at `limit`. */
  count: number;
  /** The first solution found (word → cells), if any. */
  first: { word: string; cells: Cell[] }[] | null;
};

/**
 * Counts ways to cover every cell exactly once with the words, each traced
 * along an orthogonal path (an exact-cover search). Stops at `limit`.
 * A good Chain puzzle has exactly one solution.
 */
export function solveChain(grid: readonly (readonly string[])[], words: readonly string[], limit = 2): SolveResult {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const tracings = words.map((w) => findTracings(grid, w));
  // cell index → candidate (word, tracing) pairs covering it
  const byCell: { w: number; t: number }[][] = Array.from({ length: rows * cols }, () => []);
  tracings.forEach((list, w) => list.forEach((cells, t) => cells.forEach((cell) => byCell[cell.row * cols + cell.col].push({ w, t }))));

  const covered: boolean[] = Array(rows * cols).fill(false);
  const usedWord: boolean[] = Array(words.length).fill(false);
  const chosen: { w: number; t: number }[] = [];
  let count = 0;
  let first: SolveResult['first'] = null;

  const valid = (w: number, t: number) => !usedWord[w] && tracings[w][t].every((c) => !covered[c.row * cols + c.col]);

  const search = () => {
    if (count >= limit) return;
    // Pick the uncovered cell with the fewest options.
    let bestCell = -1;
    let bestOptions: { w: number; t: number }[] = [];
    for (let i = 0; i < covered.length; i++) {
      if (covered[i]) continue;
      const options = byCell[i].filter((o) => valid(o.w, o.t));
      if (bestCell === -1 || options.length < bestOptions.length) {
        bestCell = i;
        bestOptions = options;
        if (options.length === 0) return;
      }
    }
    if (bestCell === -1) {
      count++;
      if (!first) first = chosen.map(({ w, t }) => ({ word: words[w], cells: tracings[w][t] }));
      return;
    }
    for (const option of bestOptions) {
      const cells = tracings[option.w][option.t];
      usedWord[option.w] = true;
      for (const c of cells) covered[c.row * cols + c.col] = true;
      chosen.push(option);
      search();
      chosen.pop();
      for (const c of cells) covered[c.row * cols + c.col] = false;
      usedWord[option.w] = false;
      if (count >= limit) return;
    }
  };

  search();
  return { count, first };
}
