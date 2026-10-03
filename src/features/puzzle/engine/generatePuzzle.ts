import { calculateDifficultyScore } from './calculateDifficulty';
import { getDifficultyConfig, MAX_GRID_SIZE, MIN_GRID_SIZE } from './difficultyConfig';
import { fillGrid } from './fillGrid';
import { computeMetrics } from './metrics';
import { placeWords } from './placeWords';
import { assessPuzzleQuality } from './qualityReport';
import { createRng, hashString, normalizeSeed, randomSeed } from './random';
import { selectWords } from './selectWords';
import type { GeneratePuzzleOptions, Puzzle } from './types';
import { validatePuzzle } from './validatePuzzle';
import { normalizeWordList, resolveWordSource } from './wordBank';

/** Layout attempts per puzzle. The best-scoring valid attempt wins. */
const MAX_ATTEMPTS = 8;

export class PuzzleGenerationError extends Error {
  constructor(message: string, readonly attemptErrors: string[]) {
    super(message);
    this.name = 'PuzzleGenerationError';
  }
}

export function buildPuzzleId(parts: {
  themeId: string;
  difficulty: string;
  gridSize: number;
  wordCount?: number;
  seed: number;
  avoidWords?: readonly string[];
}): string {
  const id = [parts.themeId, parts.difficulty, `${parts.gridSize}x${parts.gridSize}`, parts.wordCount ?? 'auto', parts.seed].join('-');
  return parts.avoidWords && parts.avoidWords.length > 0
    ? `${id}-a${hashString(parts.avoidWords.join(',')).toString(36)}`
    : id;
}

/**
 * Generates a complete, validated puzzle. Pure and deterministic: the same
 * options (including `seed`) always produce the same puzzle.
 *
 * Pipeline per attempt: select words → place words → fill grid → validate →
 * measure → score quality. Up to MAX_ATTEMPTS layouts are tried (each with
 * its own seeded sub-generator) and the one with the fewest quality issues
 * is returned, stopping early on a clean result.
 */
export function generatePuzzle(options: GeneratePuzzleOptions): Puzzle {
  const seed = options.seed === undefined ? randomSeed() : normalizeSeed(options.seed);
  const { difficulty } = options;
  const config = getDifficultyConfig(difficulty, options.config);
  const gridSize = Math.min(MAX_GRID_SIZE, Math.max(MIN_GRID_SIZE, Math.round(options.gridSize ?? config.gridSize)));
  const source = resolveWordSource(options);
  const avoidWords = normalizeWordList(options.avoidWords ?? []);

  const id = buildPuzzleId({ themeId: source.themeId, difficulty, gridSize, wordCount: options.wordCount, seed, avoidWords });
  const rng = createRng(id);

  const letterBudget = Math.floor(config.maxDensity * gridSize * gridSize);
  const attemptErrors: string[] = [];
  let best: Puzzle | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const attemptRng = rng.fork(`attempt-${attempt}`);
    const count = options.wordCount ?? attemptRng.int(config.wordCount.min, config.wordCount.max);
    const minCount = Math.max(1, Math.min(count, options.wordCount !== undefined ? count - 1 : config.wordCount.min));

    const selection = selectWords({
      candidates: source.words,
      count,
      minCount,
      length: config.wordLength,
      gridSize,
      letterBudget,
      rng: attemptRng.fork('select'),
      avoid: avoidWords,
    });
    if (selection.words.length < minCount) {
      attemptErrors.push(`Attempt ${attempt}: not enough words (${selection.notes.join('; ')})`);
      continue;
    }

    const placed = placeWords({
      words: selection.words,
      reserves: selection.reserves,
      gridSize,
      config,
      minCount,
      letterBudget,
      rng: attemptRng.fork('place'),
    });
    if (!placed) {
      attemptErrors.push(`Attempt ${attempt}: could not place enough words`);
      continue;
    }

    const filled = fillGrid({ grid: placed.grid, placements: placed.placements, config, rng: attemptRng.fork('fill') });
    if (!filled) {
      attemptErrors.push(`Attempt ${attempt}: unavoidable duplicate word in grid`);
      continue;
    }

    const placements = placed.placements.slice().sort((a, b) => a.word.localeCompare(b.word));
    const words = placements.map((p) => p.word);
    const validation = validatePuzzle({ gridSize, grid: filled.grid, words, placements });
    if (!validation.valid) {
      attemptErrors.push(`Attempt ${attempt}: ${validation.errors.join('; ')}`);
      continue;
    }

    const metrics = computeMetrics(filled.grid, placements);
    const difficultyBreakdown = calculateDifficultyScore(metrics);
    const quality = assessPuzzleQuality({ difficulty, config, metrics, ratedDifficulty: difficultyBreakdown.rated });

    const puzzle: Puzzle = {
      id,
      seed,
      theme: source.themeId,
      themeName: source.themeName,
      difficulty,
      gridSize,
      grid: filled.grid,
      words,
      placements,
      difficultyScore: difficultyBreakdown.total,
      difficultyBreakdown,
      metrics,
      quality,
      reusedWords: words.filter((w) => avoidWords.includes(w)),
      generationAttempts: attempt + 1,
      generationNotes: [...selection.notes, ...placed.notes, ...(filled.decoys > 0 ? [`${filled.decoys} decoy fragment(s)`] : [])],
    };

    if (!best || quality.penalty < best.quality.penalty) best = puzzle;
    if (quality.penalty === 0) break;
  }

  if (!best) {
    throw new PuzzleGenerationError(`Could not generate a valid puzzle for ${id}`, attemptErrors);
  }
  return best;
}
