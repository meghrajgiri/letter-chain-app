import { DIRECTION_NAMES, getDirectionCategory, getDirectionName, isReverseDirection } from './directions';
import { cellKey, findWordOccurrences } from './gridScan';
import type { DirectionDistribution, DirectionName, Grid, PuzzleMetrics, WordPlacement } from './types';

const region = (index: number, size: number) => Math.min(2, Math.floor((index * 3) / size));

function mean(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;
}

function stdDev(values: number[]): number {
  const m = mean(values);
  return Math.sqrt(mean(values.map((v) => (v - m) ** 2)));
}

export function getDirectionDistribution(placements: readonly WordPlacement[]): DirectionDistribution {
  const byDirection = Object.fromEntries(DIRECTION_NAMES.map((d) => [d, 0])) as Record<DirectionName, number>;
  const result: DirectionDistribution = { horizontal: 0, vertical: 0, diagonal: 0, reverse: 0, byDirection };
  for (const p of placements) {
    result[getDirectionCategory(p.direction)]++;
    if (isReverseDirection(p.direction)) result.reverse++;
    byDirection[getDirectionName(p.direction)]++;
  }
  return result;
}

/** Side of the largest all-filler square (classic maximal-square DP). */
function largestEmptySquare(size: number, used: Set<string>): number {
  const dp: number[][] = Array.from({ length: size }, () => Array(size).fill(0));
  let best = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (used.has(`${r},${c}`)) continue;
      dp[r][c] = r === 0 || c === 0 ? 1 : 1 + Math.min(dp[r - 1][c], dp[r][c - 1], dp[r - 1][c - 1]);
      best = Math.max(best, dp[r][c]);
    }
  }
  return best;
}

/**
 * Prefix fragments of each word that appear in the grid but do not lead to
 * the real word — what makes a hard grid feel "busy".
 */
function falseStarts(grid: Grid, placements: readonly WordPlacement[]): number {
  let total = 0;
  for (const p of placements) {
    const length = Math.min(p.word.length - 1, Math.max(3, Math.ceil(p.word.length / 2)));
    const prefix = p.word.slice(0, length);
    const own = new Set(p.cells.slice(0, length).map(cellKey));
    for (const occurrence of findWordOccurrences(grid, prefix)) {
      if (!occurrence.every((cell) => own.has(cellKey(cell)))) total++;
    }
  }
  return total;
}

export function computeMetrics(grid: Grid, placements: readonly WordPlacement[]): PuzzleMetrics {
  const size = grid.length;
  const owners = new Map<string, number[]>();
  placements.forEach((p, i) => {
    for (const cell of p.cells) {
      const key = cellKey(cell);
      const list = owners.get(key);
      if (list) list.push(i);
      else owners.set(key, [i]);
    }
  });

  const used = new Set(owners.keys());
  const intersecting = placements.map(() => new Set<number>());
  let sharedCells = 0;
  for (const list of owners.values()) {
    if (list.length < 2) continue;
    sharedCells++;
    for (const a of list) for (const b of list) if (a !== b) intersecting[a].add(b);
  }
  const overlappingWords = intersecting.filter((s) => s.size > 0).length;

  const lengths = placements.map((p) => p.word.length);
  const totalLetters = lengths.reduce((a, b) => a + b, 0);

  const regionCells = Array(9).fill(0);
  const regionLetters = Array(9).fill(0);
  let sumRow = 0;
  let sumCol = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const ri = region(r, size) * 3 + region(c, size);
      regionCells[ri]++;
      if (used.has(`${r},${c}`)) {
        regionLetters[ri]++;
        sumRow += r;
        sumCol += c;
      }
    }
  }
  const regionCoverage = regionCells.map((n, i) => (n === 0 ? 0 : regionLetters[i] / n));
  const coverageMean = mean(regionCoverage);
  const evenness = coverageMean === 0 ? 0 : Math.max(0, 1 - stdDev(regionCoverage) / coverageMean);

  const centre = (size - 1) / 2;
  const centroidOffset =
    used.size === 0 ? 0 : Math.hypot(sumRow / used.size - centre, sumCol / used.size - centre) / size;

  // How closely filler letters mimic the words' own letter mix (1 - total variation distance).
  const wordFreq = new Map<string, number>();
  const fillerFreq = new Map<string, number>();
  let fillerCount = 0;
  for (const p of placements) for (const l of p.word) wordFreq.set(l, (wordFreq.get(l) ?? 0) + 1);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (used.has(`${r},${c}`)) continue;
      fillerCount++;
      fillerFreq.set(grid[r][c], (fillerFreq.get(grid[r][c]) ?? 0) + 1);
    }
  }
  let distance = 0;
  for (const letter of new Set([...wordFreq.keys(), ...fillerFreq.keys()])) {
    distance += Math.abs((wordFreq.get(letter) ?? 0) / Math.max(1, totalLetters) - (fillerFreq.get(letter) ?? 0) / Math.max(1, fillerCount));
  }
  const fillerSimilarity = fillerCount === 0 || totalLetters === 0 ? 0 : 1 - distance / 2;

  return {
    gridSize: size,
    wordCount: placements.length,
    totalLetters,
    averageWordLength: mean(lengths),
    wordLengthStdDev: stdDev(lengths),
    distinctWordLengths: new Set(lengths).size,
    directions: getDirectionDistribution(placements),
    overlapScore: placements.length === 0 ? 0 : overlappingWords / placements.length,
    sharedCells,
    maxIntersectionsPerWord: Math.max(0, ...intersecting.map((s) => s.size)),
    density: used.size / (size * size),
    largestEmptySquare: largestEmptySquare(size, used),
    regionCoverage,
    emptyRegions: regionLetters.filter((n) => n === 0).length,
    distributionEvenness: evenness,
    centroidOffset,
    fillerSimilarity,
    falseStartsPerWord: placements.length === 0 ? 0 : falseStarts(grid, placements) / placements.length,
  };
}
