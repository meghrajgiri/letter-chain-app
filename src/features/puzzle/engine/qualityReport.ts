import type { Difficulty, DifficultyConfig, PuzzleMetrics } from './types';
import { DIFFICULTIES } from './types';

export type QualityStatus = 'pass' | 'warn' | 'fail';

export type QualityCheckId =
  | 'directionVariety'
  | 'reverseWords'
  | 'overlap'
  | 'distribution'
  | 'emptySpace'
  | 'wordLengthVariety'
  | 'difficultyMatch';

export type QualityCheck = {
  id: QualityCheckId;
  status: QualityStatus;
  label: string;
  detail: string;
};

export type QualityReport = {
  checks: QualityCheck[];
  passCount: number;
  warnCount: number;
  failCount: number;
  /** Lower is better; used to pick the best of several generation attempts. */
  penalty: number;
};

export type QualityInput = {
  difficulty: Difficulty;
  config: DifficultyConfig;
  metrics: PuzzleMetrics;
  ratedDifficulty: Difficulty;
};

const pct = (value: number) => `${Math.round(value * 100)}%`;

/**
 * Heuristic "is this puzzle fun?" checks. These flag the boring patterns
 * from the brief: one-direction puzzles, no/too much overlap, clustering,
 * big empty areas, same-length words and mis-rated difficulty.
 */
export function assessPuzzleQuality(input: QualityInput): QualityReport {
  const { difficulty, config, metrics: m, ratedDifficulty } = input;
  const checks: QualityCheck[] = [];
  const add = (id: QualityCheckId, status: QualityStatus, label: string, detail: string) =>
    checks.push({ id, status, label, detail });

  // Direction variety: no single category should dominate.
  const n = Math.max(1, m.wordCount);
  const shares = { horizontal: m.directions.horizontal / n, vertical: m.directions.vertical / n, diagonal: m.directions.diagonal / n };
  const [topCategory, topShare] = Object.entries(shares).sort((a, b) => b[1] - a[1])[0];
  const allowedCategories = new Set(
    Object.entries(config.directionWeights)
      .filter(([, w]) => (w ?? 0) > 0)
      .map(([d]) => (d === 'E' || d === 'W' ? 'horizontal' : d === 'N' || d === 'S' ? 'vertical' : 'diagonal')),
  );
  const maxShare = allowedCategories.size <= 2 ? 0.75 : 0.55;
  const usedCategories = Object.values(shares).filter((s) => s > 0).length;
  if (topShare > maxShare + 0.15 || usedCategories < Math.min(2, allowedCategories.size)) {
    add('directionVariety', 'fail', 'Direction variety', `${pct(topShare)} of words are ${topCategory}`);
  } else if (topShare > maxShare || usedCategories < allowedCategories.size) {
    add('directionVariety', 'warn', 'Direction variety', `${pct(topShare)} ${topCategory}; ${usedCategories}/${allowedCategories.size} categories used`);
  } else {
    add('directionVariety', 'pass', 'Good direction variety', `Max ${pct(topShare)} ${topCategory}`);
  }

  // Reverse words should exist from medium upwards.
  const reverseAllowed = ['W', 'N', 'SW', 'NW'].some((d) => (config.directionWeights[d as 'W'] ?? 0) > 0);
  if (reverseAllowed) {
    const reverseShare = m.directions.reverse / n;
    const minReverse = difficulty === 'medium' ? 0.15 : 0.3;
    if (reverseShare === 0) add('reverseWords', 'fail', 'Reverse words', 'No backwards words');
    else if (reverseShare < minReverse) add('reverseWords', 'warn', 'Reverse words', `Only ${pct(reverseShare)} backwards`);
    else add('reverseWords', 'pass', 'Reverse words present', `${pct(reverseShare)} backwards`);
  }

  // Overlap within the difficulty's target band (with tolerance).
  const { min, max } = config.overlapTarget;
  if (m.overlapScore < min - 0.15 || m.overlapScore > max + 0.15) {
    add('overlap', 'fail', 'Overlap', `${pct(m.overlapScore)} of words overlap (target ${pct(min)}–${pct(max)})`);
  } else if (m.overlapScore < min - 0.05 || m.overlapScore > max + 0.05) {
    add('overlap', 'warn', 'Overlap', `${pct(m.overlapScore)} (target ${pct(min)}–${pct(max)})`);
  } else {
    add('overlap', 'pass', 'Reasonable overlap', `${pct(m.overlapScore)} of words overlap`);
  }

  // Distribution: words should reach every part of the grid.
  if (m.emptyRegions >= 2 || m.centroidOffset > 0.18) {
    add('distribution', 'fail', 'Distribution', `${m.emptyRegions} empty regions, centroid offset ${pct(m.centroidOffset)}`);
  } else if (m.emptyRegions === 1 || m.distributionEvenness < 0.55 || m.centroidOffset > 0.1) {
    add('distribution', 'warn', 'Distribution', `Evenness ${pct(m.distributionEvenness)}, ${m.emptyRegions} empty region(s)`);
  } else {
    add('distribution', 'pass', 'Good distribution', `Evenness ${pct(m.distributionEvenness)}`);
  }

  // Empty space: no big blank blocks.
  const emptyRatio = m.largestEmptySquare / m.gridSize;
  if (emptyRatio > 0.5) {
    add('emptySpace', 'fail', 'Empty space', `${m.largestEmptySquare}×${m.largestEmptySquare} block with no words`);
  } else if (emptyRatio > 0.38) {
    add('emptySpace', 'warn', 'Empty space', `${m.largestEmptySquare}×${m.largestEmptySquare} block with no words`);
  } else {
    add('emptySpace', 'pass', 'No excessive empty space', `Largest empty block ${m.largestEmptySquare}×${m.largestEmptySquare}`);
  }

  // Word length variety.
  if (m.distinctWordLengths <= 2 || m.wordLengthStdDev < 0.8) {
    add('wordLengthVariety', 'fail', 'Word length variety', `${m.distinctWordLengths} distinct lengths`);
  } else if (m.distinctWordLengths === 3 || m.wordLengthStdDev < 1.1) {
    add('wordLengthVariety', 'warn', 'Word length variety', `${m.distinctWordLengths} distinct lengths, σ ${m.wordLengthStdDev.toFixed(1)}`);
  } else {
    add('wordLengthVariety', 'pass', 'Good word length variety', `${m.distinctWordLengths} distinct lengths`);
  }

  // Measured difficulty vs requested.
  const gap = Math.abs(DIFFICULTIES.indexOf(ratedDifficulty) - DIFFICULTIES.indexOf(difficulty));
  if (gap >= 2) add('difficultyMatch', 'fail', 'Difficulty match', `Requested ${difficulty}, measured ${ratedDifficulty}`);
  else if (gap === 1) add('difficultyMatch', 'warn', 'Difficulty match', `Requested ${difficulty}, measured ${ratedDifficulty}`);
  else add('difficultyMatch', 'pass', 'Difficulty matches request', `Measured ${ratedDifficulty}`);

  const passCount = checks.filter((c) => c.status === 'pass').length;
  const warnCount = checks.filter((c) => c.status === 'warn').length;
  const failCount = checks.filter((c) => c.status === 'fail').length;
  return { checks, passCount, warnCount, failCount, penalty: failCount * 3 + warnCount };
}
