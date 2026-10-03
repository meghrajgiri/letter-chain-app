import type { Rng } from './random';
import { MAX_SAME_LENGTH } from './difficultyConfig';
import type { Range } from './types';

export type SelectWordsInput = {
  candidates: readonly string[];
  count: number;
  /** Fewest words acceptable when the letter budget or pool is tight. */
  minCount: number;
  length: Range;
  gridSize: number;
  /** Max total letters across selected words. */
  letterBudget: number;
  rng: Rng;
  /**
   * Recently used words, most recent first. They are only picked when there
   * aren't enough fresh words, least recent first.
   */
  avoid?: readonly string[];
};

export type SelectWordsResult = {
  /** Words chosen for placement. */
  words: string[];
  /** Unused, compatible candidates to substitute when a word cannot be placed. */
  reserves: string[];
  /** Selected words that were in `avoid` (had to be reused). */
  reused: string[];
  notes: string[];
};

function reverse(word: string): string {
  return word.split('').reverse().join('');
}

/**
 * True if one word could be "found" inside the other (forwards or backwards).
 * Such pairs make a puzzle ambiguous: selecting CAT inside CATERPILLAR.
 */
export function wordsConflict(a: string, b: string): boolean {
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  return long.includes(short) || long.includes(reverse(short));
}

type Tier = 'short' | 'mid' | 'long';

/**
 * Picks a varied set of words: mixes short, medium and long words, caps how
 * many share the same length, avoids substring collisions, respects the
 * grid's letter budget and prefers words not used in recent puzzles.
 */
export function selectWords(input: SelectWordsInput): SelectWordsResult {
  const { candidates, count, minCount, gridSize, letterBudget, rng } = input;
  const notes: string[] = [];

  const fitsGrid = candidates.filter((w) => w.length <= gridSize);
  let range: Range = { min: input.length.min, max: Math.min(input.length.max, gridSize) };
  let pool = fitsGrid.filter((w) => w.length >= range.min && w.length <= range.max);

  // Widen the length range if the theme does not have enough words in it.
  while (pool.length < count + 2 && (range.min > 3 || range.max < gridSize)) {
    range = { min: Math.max(3, range.min - 1), max: Math.min(gridSize, range.max + 1) };
    pool = fitsGrid.filter((w) => w.length >= range.min && w.length <= range.max);
  }
  if (range.min !== input.length.min || range.max !== Math.min(input.length.max, gridSize)) {
    notes.push(`Word length range widened to ${range.min}–${range.max} (theme too small)`);
  }

  // Split the pool into length tiers so every puzzle mixes short and long words.
  const span = range.max - range.min + 1;
  const tierOf = (word: string): Tier => {
    const position = (word.length - range.min) / span;
    return position < 1 / 3 ? 'short' : position < 2 / 3 ? 'mid' : 'long';
  };
  // Recently used words sit out unless the fresh pool runs dry.
  const recency = new Map((input.avoid ?? []).map((w, i) => [w, i] as const));
  const fresh = pool.filter((w) => !recency.has(w));
  const stale = pool.filter((w) => recency.has(w)).sort((a, b) => recency.get(b)! - recency.get(a)!);

  const tiers: Record<Tier, string[]> = { short: [], mid: [], long: [] };
  for (const word of rng.shuffle(fresh)) tiers[tierOf(word)].push(word);

  // Per-puzzle tier mix with jitter so some puzzles lean long, others short.
  const tierNames: Tier[] = ['short', 'mid', 'long'];
  const tierWeights = [rng.float(0.2, 0.4), rng.float(0.3, 0.5), rng.float(0.2, 0.4)];

  const maxSameLength = MAX_SAME_LENGTH;
  const lengthCounts = new Map<number, number>();
  const selected: string[] = [];
  const skipped: string[] = [];
  let letters = 0;

  const canTake = (word: string) =>
    (lengthCounts.get(word.length) ?? 0) < maxSameLength &&
    letters + word.length <= letterBudget &&
    !selected.some((s) => wordsConflict(s, word));

  while (selected.length < count) {
    const available = tierNames.map((t, i) => (tiers[t].length > 0 ? tierWeights[i] : 0));
    if (available.every((w) => w === 0)) break;
    const tier = tierNames[rng.weightedIndex(available)];
    const word = tiers[tier].shift()!;
    if (canTake(word)) {
      selected.push(word);
      letters += word.length;
      lengthCounts.set(word.length, (lengthCounts.get(word.length) ?? 0) + 1);
    } else {
      skipped.push(word);
    }
  }

  // Second pass: only when the length cap leaves too few words (tiny custom
  // word lists), relax it.
  if (selected.length < input.minCount) {
    for (const word of skipped.slice()) {
      if (selected.length >= input.minCount) break;
      if (letters + word.length > letterBudget || selected.some((s) => wordsConflict(s, word))) continue;
      selected.push(word);
      letters += word.length;
      skipped.splice(skipped.indexOf(word), 1);
    }
  }

  // Third pass: reuse recent words, least recently used first.
  const reused: string[] = [];
  for (const word of stale) {
    if (selected.length >= count) break;
    if ((lengthCounts.get(word.length) ?? 0) >= maxSameLength && selected.length >= input.minCount) continue;
    if (letters + word.length > letterBudget || selected.some((s) => wordsConflict(s, word))) continue;
    selected.push(word);
    reused.push(word);
    letters += word.length;
    lengthCounts.set(word.length, (lengthCounts.get(word.length) ?? 0) + 1);
  }
  if (reused.length > 0) notes.push(`Reused ${reused.length} recent word(s): ${reused.join(', ')}`);

  if (selected.length < count) {
    notes.push(`Selected ${selected.length} of ${count} requested words (pool or letter budget limit)`);
  }
  if (selected.length < minCount) {
    notes.push(`Below minimum word count (${selected.length} < ${minCount})`);
  }

  const reserves = [
    ...rng.shuffle([...skipped, ...tiers.short, ...tiers.mid, ...tiers.long]),
    ...stale.filter((w) => !selected.includes(w)),
  ].filter((w) => !selected.some((s) => wordsConflict(s, w)));

  return { words: selected, reserves, reused, notes };
}
