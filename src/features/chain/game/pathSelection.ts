/**
 * Pure path-drag logic for Chain mode: the selection is a list of
 * orthogonally connected cells, grown and shrunk as the finger moves.
 */
import { cellKey, cellSetKey } from '../../puzzle/engine/gridScan';
import type { Cell } from '../../puzzle/engine/types';
import type { Point } from '../../puzzle/game/selection';
import { isAdjacent } from '../engine/grid';
import type { ChainPlacement } from '../engine/types';

const same = (a: Cell, b: Cell) => a.row === b.row && a.col === b.col;

/**
 * Cell under the finger, but only when it's near that tile's centre (inside
 * the inner `tolerance` share of a pitch). Ignoring tile edges and corners
 * stops a finger crossing a corner from registering a stray neighbour.
 */
export function getCellNearCenter(point: Point, pitch: number, tile: number, rows: number, cols: number, tolerance = 0.42): Cell | null {
  if (pitch <= 0) return null;
  const col = Math.floor(point.x / pitch);
  const row = Math.floor(point.y / pitch);
  if (row < 0 || col < 0 || row >= rows || col >= cols) return null;
  const cx = col * pitch + tile / 2;
  const cy = row * pitch + tile / 2;
  const limit = tolerance * pitch;
  return Math.abs(point.x - cx) <= limit && Math.abs(point.y - cy) <= limit ? { row, col } : null;
}

/**
 * Next selection path after the finger reaches `cell`:
 *  - empty path → start at `cell` (unless blocked)
 *  - previous cell → step back (undo the last cell)
 *  - an earlier cell in the path → truncate back to it
 *  - orthogonal neighbour of the last cell → extend
 *  - same row/column further away with a clear straight run → extend through it (fast drags)
 *  - anything else (diagonal, blocked, already found) → unchanged
 */
export function extendPath(path: readonly Cell[], cell: Cell, blocked: (cell: Cell) => boolean): Cell[] {
  if (path.length === 0) return blocked(cell) ? [] : [cell];
  const last = path[path.length - 1];
  if (same(last, cell)) return path as Cell[];

  const index = path.findIndex((c) => same(c, cell));
  if (index !== -1) return path.slice(0, index + 1);

  if (isAdjacent(last, cell)) return blocked(cell) ? (path as Cell[]) : [...path, cell];

  if (last.row === cell.row || last.col === cell.col) {
    const steps = Math.abs(cell.row - last.row) + Math.abs(cell.col - last.col);
    const dr = Math.sign(cell.row - last.row);
    const dc = Math.sign(cell.col - last.col);
    const run: Cell[] = [];
    for (let i = 1; i <= steps; i++) {
      const next = { row: last.row + dr * i, col: last.col + dc * i };
      if (blocked(next) || path.some((c) => same(c, next))) return path as Cell[];
      run.push(next);
    }
    return [...path, ...run];
  }
  return path as Cell[];
}

export type ChainMatch =
  | { type: 'found'; word: string }
  | { type: 'wrong-path'; word: string }
  | { type: 'already-found'; word: string }
  | { type: 'miss' };

/**
 * Checks a released path against the solution. The path must cover exactly a
 * solution word's cells, read forwards or backwards. Spelling a hidden word
 * along a different route reports `wrong-path` (accepting it could make the
 * rest of the board unsolvable).
 */
export function matchChainPath(
  path: readonly Cell[],
  grid: readonly (readonly string[])[],
  placements: readonly ChainPlacement[],
  foundWords: ReadonlySet<string>,
): ChainMatch {
  if (path.length < 2) return { type: 'miss' };
  const forward = path.map((c) => grid[c.row][c.col]).join('');
  const backward = forward.split('').reverse().join('');
  const key = cellSetKey(path);
  for (const p of placements) {
    if (p.word !== forward && p.word !== backward) continue;
    if (cellSetKey(p.cells) !== key) return foundWords.has(p.word) ? { type: 'already-found', word: p.word } : { type: 'wrong-path', word: p.word };
    return foundWords.has(p.word) ? { type: 'already-found', word: p.word } : { type: 'found', word: p.word };
  }
  return { type: 'miss' };
}

/** Set of `row,col` keys for quick blocked-cell checks. */
export function cellKeySet(cells: readonly Cell[]): Set<string> {
  return new Set(cells.map(cellKey));
}
