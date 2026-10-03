import type { Rng } from '../../puzzle/engine/random';
import type { Cell } from '../../puzzle/engine/types';
import { ORTHOGONAL } from './grid';

export type PartitionInput = {
  rows: number;
  cols: number;
  /** Path lengths; must sum to rows × cols. */
  lengths: readonly number[];
  rng: Rng;
  /** Backtracking step budget before giving up. */
  budget?: number;
};

/** Walks tried per length at each step; keeps the search broad rather than deep. */
const WALKS_PER_LENGTH = 6;

/**
 * Splits a rows × cols grid into non-overlapping orthogonal paths of the
 * given lengths (an exact path cover). Randomised backtracking:
 *
 *  - always extend from the most constrained empty cell (fewest empty
 *    neighbours). A cell with one free neighbour must be a path end, so this
 *    is exact for dead ends and a good heuristic elsewhere;
 *  - random self-avoiding walks with a mild preference for turning, which
 *    gives windier, more interesting word shapes;
 *  - prune when an empty region can't be filled by the remaining lengths.
 *
 * Returns the paths (in placement order) or null if the budget runs out.
 */
export function partitionGrid(input: PartitionInput): Cell[][] | null {
  const { rows, cols, rng } = input;
  const owner: number[][] = Array.from({ length: rows }, () => Array(cols).fill(-1));
  const remaining = new Map<number, number>();
  for (const l of input.lengths) remaining.set(l, (remaining.get(l) ?? 0) + 1);
  const paths: Cell[][] = [];
  let steps = input.budget ?? 40000;

  const inside = (r: number, c: number) => r >= 0 && c >= 0 && r < rows && c < cols;
  const freeDegree = (r: number, c: number) => {
    let d = 0;
    for (const o of ORTHOGONAL) if (inside(r + o.row, c + o.col) && owner[r + o.row][c + o.col] === -1) d++;
    return d;
  };

  /** Every empty region must be fillable by some subset of the remaining lengths. */
  const feasible = (): boolean => {
    const lengths: number[] = [];
    for (const [l, n] of remaining) for (let i = 0; i < n; i++) lengths.push(l);
    // reachable[s] = some subset of the remaining lengths sums to s.
    const total = lengths.reduce((a, b) => a + b, 0);
    const reachable: boolean[] = Array(total + 1).fill(false);
    reachable[0] = true;
    for (const l of lengths) for (let s = total; s >= l; s--) if (reachable[s - l]) reachable[s] = true;
    const seen: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (owner[r][c] !== -1 || seen[r][c]) continue;
        let size = 0;
        const stack: Cell[] = [{ row: r, col: c }];
        seen[r][c] = true;
        while (stack.length) {
          const cell = stack.pop()!;
          size++;
          for (const o of ORTHOGONAL) {
            const nr = cell.row + o.row;
            const nc = cell.col + o.col;
            if (inside(nr, nc) && owner[nr][nc] === -1 && !seen[nr][nc]) {
              seen[nr][nc] = true;
              stack.push({ row: nr, col: nc });
            }
          }
        }
        if (!reachable[size]) return false;
      }
    }
    return true;
  };

  /**
   * Up to `limit` random self-avoiding walks of `target` cells from `start`.
   * Marks cells while exploring and always unmarks them on the way back.
   */
  const collectWalks = (start: Cell, target: number, limit: number): Cell[][] => {
    const found: Cell[][] = [];
    const path: Cell[] = [start];
    owner[start.row][start.col] = -2;
    const extend = () => {
      if (found.length >= limit || --steps < 0) return;
      if (path.length === target) {
        found.push(path.slice());
        return;
      }
      const last = path[path.length - 1];
      // Length of the current straight run (in steps) ending at `last`.
      let run = 0;
      if (path.length > 1) {
        const dr = last.row - path[path.length - 2].row;
        const dc = last.col - path[path.length - 2].col;
        run = 1;
        for (let i = path.length - 2; i > 0; i--) {
          if (path[i].row - path[i - 1].row !== dr || path[i].col - path[i - 1].col !== dc) break;
          run++;
        }
      }
      const options = ORTHOGONAL.map((o) => ({ row: last.row + o.row, col: last.col + o.col }))
        .filter((n) => inside(n.row, n.col) && owner[n.row][n.col] === -1)
        .map((n) => {
          const prev = path.length > 1 ? path[path.length - 2] : null;
          const straight = prev !== null && n.row - last.row === last.row - prev.row && n.col - last.col === last.col - prev.col;
          // Snake-like shapes: keep going straight for ~2-3 cells, then turn.
          // Avoids both long straight lines and tight 2-wide zigzags.
          const shape = prev === null ? 0 : straight ? (run >= 3 ? 0.9 : 0) : run < 2 ? 0.7 : 0;
          // Lower = tried first. Mild hugging of tight spots + shape preference + randomness.
          return { n, key: freeDegree(n.row, n.col) * 0.25 + shape + rng.float(0, 1.1) };
        })
        .sort((a, b) => a.key - b.key);
      for (const { n } of options) {
        owner[n.row][n.col] = -2;
        path.push(n);
        extend();
        path.pop();
        owner[n.row][n.col] = -1;
        if (found.length >= limit) return;
      }
    };
    extend();
    owner[start.row][start.col] = -1;
    return found;
  };

  const place = (): boolean => {
    if (--steps < 0) return false;
    // Most constrained empty cell.
    let best: Cell[] = [];
    let bestDegree = 5;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (owner[r][c] !== -1) continue;
        const d = freeDegree(r, c);
        if (d < bestDegree) {
          bestDegree = d;
          best = [{ row: r, col: c }];
        } else if (d === bestDegree) best.push({ row: r, col: c });
      }
    }
    if (best.length === 0) return true;
    const start = rng.pick(best);
    const lengths = rng.shuffle([...remaining.keys()].filter((l) => remaining.get(l)! > 0));

    for (const length of lengths) {
      for (const walk of collectWalks(start, length, WALKS_PER_LENGTH)) {
        const index = paths.length;
        for (const cell of walk) owner[cell.row][cell.col] = index;
        paths.push(walk);
        remaining.set(length, remaining.get(length)! - 1);
        if (feasible() && place()) return true;
        remaining.set(length, remaining.get(length)! + 1);
        paths.pop();
        for (const cell of walk) owner[cell.row][cell.col] = -1;
        if (steps < 0) return false;
      }
    }
    return false;
  };

  return place() ? paths : null;
}
