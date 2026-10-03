import type { Rng } from '../../puzzle/engine/random';
import { wordsConflict } from '../../puzzle/engine/selectWords';
import type { Range } from '../../puzzle/engine/types';

export type SelectChainWordsInput = {
  candidates: readonly string[];
  /** Exact total number of letters the words must add up to. */
  totalLetters: number;
  count: Range;
  length: Range;
  rng: Rng;
  /** Recently used words, most recent first; tried last. */
  avoid?: readonly string[];
  /** Search step budget. */
  budget?: number;
  /** Most words allowed to share one length (keeps a mix of lengths). */
  maxSameLength?: number;
};

/**
 * Picks words whose lengths add up exactly to `totalLetters`, with a word
 * count in range, no word contained in another and at most `maxSameLength`
 * words of any one length. Fresh words are tried
 * before recently used ones. Returns null if no combination is found.
 */
export function selectChainWords(input: SelectChainWordsInput): string[] | null {
  const { totalLetters, count, length, rng } = input;
  const maxSame = input.maxSameLength ?? Infinity;
  const recent = new Set(input.avoid ?? []);
  const eligible = input.candidates.filter((w) => w.length >= length.min && w.length <= length.max);
  const fresh = rng.shuffle(eligible.filter((w) => !recent.has(w)));
  const stale = (input.avoid ?? []).filter((w) => eligible.includes(w)).reverse();
  const pool = [...fresh, ...stale];
  if (pool.length === 0) return null;

  const minLen = Math.min(...pool.map((w) => w.length));
  const maxLen = Math.max(...pool.map((w) => w.length));
  let steps = input.budget ?? 20000;

  const counts = rng.shuffle(Array.from({ length: count.max - count.min + 1 }, (_, i) => count.min + i));
  for (const k of counts) {
    const chosen: string[] = [];
    const search = (start: number, sum: number): boolean => {
      if (--steps < 0) return false;
      const left = k - chosen.length;
      if (left === 0) return sum === totalLetters;
      const need = totalLetters - sum;
      if (need < left * minLen || need > left * maxLen) return false;
      for (let i = start; i < pool.length; i++) {
        const word = pool[i];
        if (word.length > need) continue;
        if (chosen.filter((c) => c.length === word.length).length >= maxSame) continue;
        if (chosen.some((c) => wordsConflict(c, word))) continue;
        chosen.push(word);
        if (search(i + 1, sum + word.length)) return true;
        chosen.pop();
      }
      return false;
    };
    if (search(0, 0)) return chosen;
  }
  return null;
}
