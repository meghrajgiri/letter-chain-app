import { wordsConflict } from './selectWords';
import { DIRECTION_NAMES, DIRECTION_VECTORS } from './directions';
import type { Rng } from './random';
import type { Cell, DifficultyConfig, DirectionName, DirectionVector, WordPlacement, WorkingGrid } from './types';

export function createEmptyGrid(size: number): WorkingGrid {
  return Array.from({ length: size }, () => Array<string | null>(size).fill(null));
}

export type PlacementCheck =
  | { ok: true; intersections: number; cells: Cell[] }
  | { ok: false; reason: 'out-of-bounds' | 'conflict' };

/**
 * Whether `word` can be written at `start` going `direction`: it must fit
 * inside the grid and every occupied cell it crosses must hold the same letter.
 */
export function canPlaceWord(
  grid: WorkingGrid,
  word: string,
  start: Cell,
  direction: DirectionVector,
): PlacementCheck {
  const size = grid.length;
  const endRow = start.row + direction.row * (word.length - 1);
  const endCol = start.col + direction.col * (word.length - 1);
  if (
    start.row < 0 || start.col < 0 || start.row >= size || start.col >= size ||
    endRow < 0 || endCol < 0 || endRow >= size || endCol >= size
  ) {
    return { ok: false, reason: 'out-of-bounds' };
  }

  let intersections = 0;
  const cells: Cell[] = [];
  for (let i = 0; i < word.length; i++) {
    const row = start.row + direction.row * i;
    const col = start.col + direction.col * i;
    const existing = grid[row][col];
    if (existing !== null) {
      if (existing !== word[i]) return { ok: false, reason: 'conflict' };
      intersections++;
    }
    cells.push({ row, col });
  }
  return { ok: true, intersections, cells };
}

export function writeWord(grid: WorkingGrid, placement: WordPlacement): void {
  placement.cells.forEach((cell, i) => {
    grid[cell.row][cell.col] = placement.word[i];
  });
}

export function makePlacement(word: string, start: Cell, direction: DirectionVector): WordPlacement {
  const cells: Cell[] = [];
  for (let i = 0; i < word.length; i++) {
    cells.push({ row: start.row + direction.row * i, col: start.col + direction.col * i });
  }
  return { word, start, end: cells[cells.length - 1], direction, cells };
}

export type PlaceWordsInput = {
  words: string[];
  reserves: string[];
  gridSize: number;
  config: DifficultyConfig;
  minCount: number;
  letterBudget: number;
  rng: Rng;
};

export type PlaceWordsResult = {
  grid: WorkingGrid;
  placements: WordPlacement[];
  notes: string[];
};

type Candidate = {
  start: Cell;
  direction: DirectionName;
  cells: Cell[];
  intersections: number;
  crossed: number[];
  score: number;
};

const MAX_INTERSECTIONS_PER_WORD = 2;
const TOP_CANDIDATES = 6;
const SELECTION_TEMPERATURE = 0.45;

const region = (index: number, size: number) => Math.min(2, Math.floor((index * 3) / size));

/**
 * Places words one by one (longest first, with jitter). For each word every
 * legal start/direction is enumerated and scored on:
 *  - direction balance vs. the difficulty's (per-puzzle jittered) weights
 *  - steering the share of overlapping words towards a sampled target
 *  - spreading letters into emptier regions of the grid
 *  - avoiding parallel "slabs" of words and border-hugging layouts
 *  - random jitter for variety
 * One of the top candidates is then sampled, so identical inputs with a
 * different seed give structurally different puzzles. Words that cannot be
 * placed are swapped for reserve words.
 */
export function placeWords(input: PlaceWordsInput): PlaceWordsResult | null {
  const { gridSize, config, rng, minCount } = input;
  const notes: string[] = [];
  const grid = createEmptyGrid(gridSize);
  const owners: number[][][] = Array.from({ length: gridSize }, () => Array.from({ length: gridSize }, () => []));
  const placements: WordPlacement[] = [];
  const overlapping = new Set<number>();
  const reserves = input.reserves.slice();
  let letterBudget = input.letterBudget - input.words.reduce((sum, w) => sum + w.length, 0);

  // Per-puzzle personality: jitter direction weights and overlap target.
  const allowed = DIRECTION_NAMES.filter((d) => (config.directionWeights[d] ?? 0) > 0);
  const jittered = allowed.map((d) => (config.directionWeights[d] ?? 0) * rng.float(0.7, 1.3));
  const weightSum = jittered.reduce((a, b) => a + b, 0);
  const targetShare = new Map<DirectionName, number>(allowed.map((d, i) => [d, jittered[i] / weightSum]));
  const overlapTarget = rng.float(config.overlapTarget.min, config.overlapTarget.max);

  const queue = input.words
    .map((word) => ({ word, key: word.length + rng.float(0, 2.5) }))
    .sort((a, b) => b.key - a.key)
    .map((x) => x.word);
  const totalWords = queue.length;

  const regionCells = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (let r = 0; r < gridSize; r++) for (let c = 0; c < gridSize; c++) regionCells[region(r, gridSize) * 3 + region(c, gridSize)]++;
  const regionLetters = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  const directionUsed = new Map<DirectionName, number>();

  const isParallel = (a: DirectionVector, b: DirectionVector) =>
    (a.row === b.row && a.col === b.col) || (a.row === -b.row && a.col === -b.col);

  const scoreCandidate = (word: string, start: Cell, dirName: DirectionName, cells: Cell[], intersections: number): Candidate | null => {
    const direction = DIRECTION_VECTORS[dirName];
    const crossed = new Set<number>();
    let parallelNeighbours = 0;
    let regionLoad = 0;
    let onBorder = 0;

    for (let i = 0; i < cells.length; i++) {
      const { row, col } = cells[i];
      const cellOwners = owners[row][col];
      if (cellOwners.length > 0) {
        for (const owner of cellOwners) {
          // Collinear overlaps (sharing a run of letters on the same line) read as one blob.
          if (isParallel(placements[owner].direction, direction)) return null;
          crossed.add(owner);
        }
      } else {
        const ri = region(row, gridSize) * 3 + region(col, gridSize);
        regionLoad += regionLetters[ri] / regionCells[ri];
        // Orthogonal neighbours owned by parallel words create dense, boring slabs.
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nr = row + dr;
          const nc = col + dc;
          if (nr < 0 || nc < 0 || nr >= gridSize || nc >= gridSize) continue;
          if (owners[nr][nc].some((o) => isParallel(placements[o].direction, direction))) {
            parallelNeighbours++;
            break;
          }
        }
      }
      if (row === 0 || col === 0 || row === gridSize - 1 || col === gridSize - 1) onBorder++;
    }

    const newCells = cells.length - intersections;
    let score = 0;

    // Direction balance: favour directions that are below their target share.
    const target = (targetShare.get(dirName) ?? 0) * totalWords;
    const used = directionUsed.get(dirName) ?? 0;
    score += 2.5 * ((target - used) / Math.max(1, target));

    // Overlap steering: aim for overlapTarget share of words intersecting something.
    const gained = (intersections > 0 ? 1 : 0) + [...crossed].filter((o) => !overlapping.has(o)).length;
    const gap = overlapTarget * (placements.length + 1) - overlapping.size;
    score -= 1.4 * Math.abs(gap - gained);
    if (intersections > 1) score -= 0.4;

    // Spread: prefer regions with fewer letters so far.
    if (newCells > 0) score -= 2.2 * (regionLoad / newCells) / Math.max(0.1, config.maxDensity);

    // Anti-slab and anti-frame penalties.
    score -= 1.2 * (parallelNeighbours / cells.length);
    if (onBorder === cells.length) score -= 0.7;

    score += rng.float(0, 1.0);
    return { start, direction: dirName, cells, intersections, crossed: [...crossed], score };
  };

  const tryPlace = (word: string): boolean => {
    const candidates: Candidate[] = [];
    for (const dirName of allowed) {
      const direction = DIRECTION_VECTORS[dirName];
      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          const check = canPlaceWord(grid, word, { row, col }, direction);
          if (!check.ok || check.intersections > MAX_INTERSECTIONS_PER_WORD) continue;
          const candidate = scoreCandidate(word, { row, col }, dirName, check.cells, check.intersections);
          if (candidate) candidates.push(candidate);
        }
      }
    }
    if (candidates.length === 0) return false;

    candidates.sort((a, b) => b.score - a.score);
    const top = candidates.slice(0, TOP_CANDIDATES);
    const best = top[0].score;
    const chosen = top[rng.weightedIndex(top.map((c) => Math.exp((c.score - best) / SELECTION_TEMPERATURE)))];

    const index = placements.length;
    const placement = makePlacement(word, chosen.start, DIRECTION_VECTORS[chosen.direction]);
    placements.push(placement);
    writeWord(grid, placement);
    for (const cell of chosen.cells) {
      if (owners[cell.row][cell.col].length === 0) {
        regionLetters[region(cell.row, gridSize) * 3 + region(cell.col, gridSize)]++;
      }
      owners[cell.row][cell.col].push(index);
    }
    if (chosen.crossed.length > 0) {
      overlapping.add(index);
      chosen.crossed.forEach((o) => overlapping.add(o));
    }
    directionUsed.set(chosen.direction, (directionUsed.get(chosen.direction) ?? 0) + 1);
    return true;
  };

  for (const word of queue) {
    if (tryPlace(word)) continue;

    // Substitute a reserve word that is no longer and does not collide with placed words.
    let substituted = false;
    letterBudget += word.length;
    for (let i = 0; i < reserves.length; i++) {
      const reserve = reserves[i];
      if (reserve.length > word.length || reserve.length > letterBudget) continue;
      if (placements.some((p) => wordsConflict(p.word, reserve))) continue;
      reserves.splice(i, 1);
      i--;
      if (tryPlace(reserve)) {
        notes.push(`Replaced ${word} with ${reserve} (no valid placement)`);
        letterBudget -= reserve.length;
        substituted = true;
        break;
      }
    }
    if (!substituted) notes.push(`Dropped ${word} (no valid placement)`);
  }

  if (placements.length < minCount) return null;
  return { grid, placements, notes };
}

