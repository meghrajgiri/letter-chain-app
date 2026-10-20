/** Pure hint rules for Classic mode. */

/** Hints per puzzle. A hint costs 1; revealing a whole word costs 2. */
export const CLASSIC_HINTS = 3;
export const REVEAL_COST = 2;

/** Next word to hint: the first unfound word (list order) that hasn't been hinted yet. */
export function pickHintWord(words: readonly string[], found: ReadonlySet<string>, hinted: readonly string[]): string | null {
  return words.find((w) => !found.has(w) && !hinted.includes(w)) ?? null;
}

/** Word to reveal: an already-hinted unfound word if there is one, otherwise the first unfound word. */
export function pickRevealWord(words: readonly string[], found: ReadonlySet<string>, hinted: readonly string[]): string | null {
  return hinted.find((w) => !found.has(w)) ?? words.find((w) => !found.has(w)) ?? null;
}

/** The latest hinted word that is still unfound (it stays pinned on screen until found), or null. */
export function latestOpenHint(hinted: readonly string[], found: ReadonlySet<string>): string | null {
  for (let i = hinted.length - 1; i >= 0; i--) if (!found.has(hinted[i])) return hinted[i];
  return null;
}
