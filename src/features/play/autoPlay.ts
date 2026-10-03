import { router } from 'expo-router';

import { dailyKey } from '@/features/daily/daily';
import { resolveDaily } from '@/features/daily/dailyStore';
import { nextAutoGame, type GameMode, type GameResult } from '@/features/progress';
import { THEMES } from '@/features/puzzle/data/themes';

const THEME_IDS = THEMES.map((t) => t.id);

/** "medium" → "Medium". */
export const difficultyLabel = (difficulty: string) => difficulty[0].toUpperCase() + difficulty.slice(1);

/**
 * Opens the next free-play game in `mode`: a theme the player hasn't had
 * lately and the difficulty that matches their level in that mode.
 * `replace` swaps the current puzzle screen (Continue after a win).
 */
export function startAutoGame(mode: GameMode, results: readonly GameResult[], options: { replace?: boolean } = {}): void {
  const { theme, difficulty } = nextAutoGame(mode, results, THEME_IDS);
  const href = { pathname: mode === 'chain' ? '/chain' : '/puzzle', params: { theme, difficulty } } as const;
  if (options.replace) router.replace(href);
  else router.push(href);
}

/** Opens today's daily puzzle (Classic or Chain, whichever today is). */
export function openDaily(key: string = dailyKey()): void {
  const { mode, date } = resolveDaily(key);
  router.push({ pathname: mode === 'chain' ? '/chain' : '/puzzle', params: { mode: 'daily', date } });
}
