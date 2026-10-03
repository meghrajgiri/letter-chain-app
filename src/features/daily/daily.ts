/**
 * Daily puzzle: one per UTC day, identical for every player. Classic and
 * Chain alternate by day, and every daily has exactly five words of 4, 5, 6,
 * 7 and 8 letters. Pure TypeScript (no React Native), seeded by the date.
 */
import { generateChainPuzzle } from '../chain/engine/generateChainPuzzle';
import type { ChainPuzzle } from '../chain/engine/types';
import type { GameMode } from '../progress/types';
import { THEMES } from '../puzzle/data/themes';
import { generatePuzzle } from '../puzzle/engine/generatePuzzle';
import { createRng, hashString, type Rng } from '../puzzle/engine/random';
import { wordsConflict } from '../puzzle/engine/selectWords';
import type { Puzzle } from '../puzzle/engine/types';
import { normalizeWordList } from '../puzzle/engine/wordBank';

/** One word of each length, shortest first. */
export const DAILY_WORD_LENGTHS = [4, 5, 6, 7, 8] as const;
/** Same base difficulty every day, so times are comparable. */
export const DAILY_DIFFICULTY = 'medium' as const;
/** Classic daily grid (fits the 8-letter word). */
export const DAILY_CLASSIC_GRID = 8;
/** Chain daily grid: 4 + 5 + 6 + 7 + 8 = 30 letters = 5 × 6. */
export const DAILY_CHAIN_GRID = { rows: 5, cols: 6 } as const;

/**
 * Themes the date-based daily rotates through. Fixed on purpose: adding new
 * themes to the word bank must not shift which theme past/published days use.
 */
export const DAILY_ROTATION = [
  'animals', 'food', 'travel', 'technology', 'space', 'ocean', 'sports', 'music', 'weather', 'fruits', 'garden', 'kitchen',
  'body', 'jobs', 'colors', 'countries', 'cities', 'vehicles', 'school', 'nature', 'birds', 'insects', 'fantasy', 'home',
] as const;

export type DailySource = 'generated' | 'trending' | 'manual';

type DailyBase = {
  /** UTC calendar date, YYYY-MM-DD. */
  date: string;
  theme: string;
  themeName: string;
  seed: string;
  words: string[];
  /** Where a server daily came from (absent for dailies generated on the device). */
  source?: DailySource;
};

export type DailyPuzzle =
  | (DailyBase & { mode: 'classic'; puzzle: Puzzle })
  | (DailyBase & { mode: 'chain'; puzzle: ChainPuzzle });

/** Today's daily key: the UTC date (the whole world shares one daily). */
export function dailyKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

const dayNumber = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
};

/** Classic on even days, Chain on odd days (days counted from 1970-01-01 UTC). */
export function dailyModeFor(key: string): GameMode {
  return dayNumber(key) % 2 === 0 ? 'classic' : 'chain';
}

/** Milliseconds until the next daily unlocks (next UTC midnight). */
export function msUntilNextDaily(now: Date = new Date()): number {
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return next - now.getTime();
}

/**
 * One word per requested length, none contained in another (that would make
 * the puzzle ambiguous). Returns null if the list can't supply every length.
 */
export function pickDailyWords(candidates: readonly string[], lengths: readonly number[], rng: Rng): string[] | null {
  const byLength = lengths.map((n) => rng.shuffle(candidates.filter((w) => w.length === n)));
  const chosen: string[] = [];
  const search = (i: number): boolean => {
    if (i === lengths.length) return true;
    for (const word of byLength[i].slice(0, 12)) {
      if (chosen.some((c) => wordsConflict(c, word))) continue;
      chosen.push(word);
      if (search(i + 1)) return true;
      chosen.pop();
    }
    return false;
  };
  return search(0) ? chosen : null;
}

function build(mode: GameMode, base: DailyBase): DailyPuzzle {
  const source = { theme: base.theme, themeName: base.themeName, words: base.words, seed: base.seed, difficulty: DAILY_DIFFICULTY };
  if (mode === 'chain') {
    const puzzle = generateChainPuzzle({
      ...source,
      config: { ...DAILY_CHAIN_GRID, wordCount: { min: 5, max: 5 }, wordLength: { min: 4, max: 8 } },
    });
    return { ...base, words: puzzle.words, mode, puzzle };
  }
  const puzzle = generatePuzzle({
    ...source,
    gridSize: DAILY_CLASSIC_GRID,
    config: { wordCount: { min: 5, max: 5 }, wordLength: { min: 4, max: 8 } },
  });
  if (puzzle.words.length !== DAILY_WORD_LENGTHS.length) throw new Error('daily lost a word during placement');
  return { ...base, words: puzzle.words, mode, puzzle };
}

const cache = new Map<string, DailyPuzzle>();

/**
 * The daily for a UTC date key. Same key → same puzzle on every device. The
 * theme rotates by date; if a theme can't produce a valid puzzle, the next
 * theme is tried (deterministically).
 */
export function getDailyPuzzle(key: string = dailyKey()): DailyPuzzle {
  const hit = cache.get(key);
  if (hit) return hit;
  const mode = dailyModeFor(key);
  const rotation = DAILY_ROTATION.map((id) => THEMES.find((t) => t.id === id)!);
  const start = hashString(`theme-${key}`) % rotation.length;
  for (let t = 0; t < rotation.length; t++) {
    const theme = rotation[(start + t) % rotation.length];
    const candidates = normalizeWordList(theme.words);
    for (let attempt = 0; attempt < 3; attempt++) {
      const seed = t === 0 && attempt === 0 ? `daily-${key}` : `daily-${key}-${t}.${attempt}`;
      const words = pickDailyWords(candidates, DAILY_WORD_LENGTHS, createRng(`${seed}-words`));
      if (!words) break;
      try {
        const daily = build(mode, { date: key, theme: theme.id, themeName: theme.name, seed, words });
        cache.set(key, daily);
        return daily;
      } catch {
        // Couldn't lay these words out; try another word set.
      }
    }
  }
  throw new Error(`Could not build the daily puzzle for ${key}`);
}

/**
 * A daily for `key` from a specific theme (used by the publisher for trend
 * themes). Words in `avoidWords` (recent dailies) are skipped when the theme
 * has enough others. Returns null if the theme can't make a valid daily.
 */
export function buildDailyForTheme(key: string, themeId: string, avoidWords: readonly string[] = []): DailyPuzzle | null {
  const theme = THEMES.find((t) => t.id === themeId);
  if (!theme) return null;
  const mode = dailyModeFor(key);
  const all = normalizeWordList(theme.words);
  const recent = new Set(avoidWords);
  const fresh = all.filter((w) => !recent.has(w));
  for (const [p, pool] of [fresh, all].entries()) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const seed = `daily-${key}-${theme.id}-${p}.${attempt}`;
      const words = pickDailyWords(pool, DAILY_WORD_LENGTHS, createRng(`${seed}-words`));
      if (!words) break;
      try {
        return build(mode, { date: key, theme: theme.id, themeName: theme.name, seed, words });
      } catch {
        // Try another word set.
      }
    }
  }
  return null;
}
