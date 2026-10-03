import { THEMES } from '../data/themes';
import { MIN_WORD_LENGTH } from './difficultyConfig';
import type { GeneratePuzzleOptions, ThemeConfig } from './types';

/** Uppercases and strips anything that is not A–Z ("ice cream" → "ICECREAM"). */
export function normalizeWord(word: string): string {
  return word.toUpperCase().replace(/[^A-Z]/g, '');
}

/** Normalises, de-duplicates and drops words too short to be fair. */
export function normalizeWordList(words: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of words) {
    const word = normalizeWord(raw);
    if (word.length < MIN_WORD_LENGTH || seen.has(word)) continue;
    seen.add(word);
    result.push(word);
  }
  return result;
}

export type WordSource = {
  themeId: string;
  themeName: string;
  words: string[];
};

/**
 * Resolves the word collection for a generation request. The engine only
 * ever sees a plain list of words; themes are just a lookup convenience.
 */
export function resolveWordSource(
  options: Pick<GeneratePuzzleOptions, 'theme' | 'words' | 'themeName'>,
  themes: readonly ThemeConfig[] = THEMES,
): WordSource {
  if (options.words && options.words.length > 0) {
    return {
      themeId: options.theme ?? 'custom',
      themeName: options.themeName ?? 'Custom',
      words: normalizeWordList(options.words),
    };
  }
  const themeId = options.theme ?? themes[0].id;
  const theme = themes.find((t) => t.id === themeId);
  if (!theme) throw new Error(`Unknown theme "${themeId}"`);
  return { themeId: theme.id, themeName: theme.name, words: normalizeWordList(theme.words) };
}
