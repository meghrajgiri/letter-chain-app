import { generatePuzzle } from './generatePuzzle';
import { cellKey } from './gridScan';
import type { QualityCheckId, QualityStatus } from './qualityReport';
import type { Difficulty, GeneratePuzzleOptions, Puzzle, ValidationResult } from './types';
import { DIFFICULTIES } from './types';
import { validatePuzzle } from './validatePuzzle';

export type BatchItem = {
  index: number;
  options: GeneratePuzzleOptions;
  puzzle: Puzzle | null;
  validation: ValidationResult;
  error: string | null;
  durationMs: number;
};

export type BatchSummary = {
  generated: number;
  valid: number;
  failed: number;
  /** Count per measured difficulty band. */
  ratedDifficulty: Record<Difficulty, number>;
  /** Share of puzzles whose measured band equals the requested one. */
  difficultyMatchRate: number;
  averageScore: number;
  minScore: number;
  maxScore: number;
  averageOverlap: number;
  averageDensity: number;
  averageWordCount: number;
  directionShare: { horizontal: number; vertical: number; diagonal: number; reverse: number };
  /** Puzzles with no failed / no warned quality checks. */
  cleanPuzzles: number;
  qualityIssues: Record<QualityCheckId, Record<Exclude<QualityStatus, 'pass'>, number>>;
  /**
   * Mean Jaccard similarity of word-cell layouts between puzzles of the same
   * grid size (0 = nothing in common, 1 = identical layout). Lower = more varied.
   */
  layoutSimilarity: number;
  /** Similarity expected if word cells were scattered at random at the same density. */
  layoutSimilarityBaseline: number;
  /** Mean Jaccard similarity of word sets between puzzles of the same theme. */
  wordSetSimilarity: number;
  /**
   * Words each puzzle shares with the previous puzzle of the same theme and
   * difficulty in batch order — what a player feels when tapping "New Puzzle".
   */
  repeatedFromPrevious: { averageWords: number; puzzlesWithRepeats: number; compared: number };
  averageAttempts: number;
  averageDurationMs: number;
};

/** Generates one puzzle and validates it independently, never throwing. */
export function generateBatchItem(index: number, options: GeneratePuzzleOptions): BatchItem {
  const started = Date.now();
  try {
    const puzzle = generatePuzzle(options);
    return { index, options, puzzle, validation: validatePuzzle(puzzle), error: null, durationMs: Date.now() - started };
  } catch (error) {
    return {
      index,
      options,
      puzzle: null,
      validation: { valid: false, errors: [String(error)], warnings: [] },
      error: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - started,
    };
  }
}

export function generateBatch(specs: GeneratePuzzleOptions[]): BatchItem[] {
  return specs.map((spec, i) => generateBatchItem(i, spec));
}

function jaccard<T>(a: Set<T>, b: Set<T>): number {
  let intersection = 0;
  for (const item of a) if (b.has(item)) intersection++;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/** Mean pairwise similarity within groups, sampling at most `maxPairs` pairs. */
function groupedSimilarity<T>(items: { group: string; set: Set<T> }[], maxPairs = 5000): number {
  let total = 0;
  let pairs = 0;
  for (let i = 0; i < items.length && pairs < maxPairs; i++) {
    for (let j = i + 1; j < items.length && pairs < maxPairs; j++) {
      if (items[i].group !== items[j].group) continue;
      total += jaccard(items[i].set, items[j].set);
      pairs++;
    }
  }
  return pairs === 0 ? 0 : total / pairs;
}

function repeatsFromPrevious(puzzles: readonly Puzzle[]): BatchSummary['repeatedFromPrevious'] {
  const previous = new Map<string, Set<string>>();
  let words = 0;
  let withRepeats = 0;
  let compared = 0;
  for (const p of puzzles) {
    const key = `${p.theme}|${p.difficulty}`;
    const last = previous.get(key);
    if (last) {
      const shared = p.words.filter((w) => last.has(w)).length;
      words += shared;
      if (shared > 0) withRepeats++;
      compared++;
    }
    previous.set(key, new Set(p.words));
  }
  return { averageWords: compared === 0 ? 0 : words / compared, puzzlesWithRepeats: withRepeats, compared };
}

const average = (values: number[]) => (values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length);

export function summarizeBatch(items: readonly BatchItem[]): BatchSummary {
  const puzzles = items.filter((i) => i.puzzle && i.validation.valid).map((i) => i.puzzle!) as Puzzle[];
  const ratedDifficulty = Object.fromEntries(DIFFICULTIES.map((d) => [d, 0])) as Record<Difficulty, number>;
  const qualityIssues = {} as BatchSummary['qualityIssues'];
  let words = 0;
  const share = { horizontal: 0, vertical: 0, diagonal: 0, reverse: 0 };

  for (const p of puzzles) {
    ratedDifficulty[p.difficultyBreakdown.rated]++;
    words += p.metrics.wordCount;
    share.horizontal += p.metrics.directions.horizontal;
    share.vertical += p.metrics.directions.vertical;
    share.diagonal += p.metrics.directions.diagonal;
    share.reverse += p.metrics.directions.reverse;
    for (const check of p.quality.checks) {
      qualityIssues[check.id] ??= { warn: 0, fail: 0 };
      if (check.status !== 'pass') qualityIssues[check.id][check.status]++;
    }
  }
  const scores = puzzles.map((p) => p.difficultyScore);

  return {
    generated: items.length,
    valid: puzzles.length,
    failed: items.length - puzzles.length,
    ratedDifficulty,
    difficultyMatchRate: puzzles.length === 0 ? 0 : puzzles.filter((p) => p.difficultyBreakdown.rated === p.difficulty).length / puzzles.length,
    averageScore: average(scores),
    minScore: scores.length ? Math.min(...scores) : 0,
    maxScore: scores.length ? Math.max(...scores) : 0,
    averageOverlap: average(puzzles.map((p) => p.metrics.overlapScore)),
    averageDensity: average(puzzles.map((p) => p.metrics.density)),
    averageWordCount: average(puzzles.map((p) => p.metrics.wordCount)),
    directionShare: {
      horizontal: words ? share.horizontal / words : 0,
      vertical: words ? share.vertical / words : 0,
      diagonal: words ? share.diagonal / words : 0,
      reverse: words ? share.reverse / words : 0,
    },
    cleanPuzzles: puzzles.filter((p) => p.quality.failCount === 0 && p.quality.warnCount === 0).length,
    qualityIssues,
    layoutSimilarity: groupedSimilarity(
      puzzles.map((p) => ({ group: String(p.gridSize), set: new Set(p.placements.flatMap((pl) => pl.cells.map(cellKey))) })),
    ),
    layoutSimilarityBaseline: (() => {
      const d = average(puzzles.map((p) => p.metrics.density));
      return d === 0 ? 0 : d / (2 - d);
    })(),
    wordSetSimilarity: groupedSimilarity(puzzles.map((p) => ({ group: p.theme, set: new Set(p.words) }))),
    repeatedFromPrevious: repeatsFromPrevious(puzzles),
    averageAttempts: average(puzzles.map((p) => p.generationAttempts)),
    averageDurationMs: average(items.map((i) => i.durationMs)),
  };
}
