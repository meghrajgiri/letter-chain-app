/**
 * Chooses the daily for a date: a trend theme when something safe is
 * trending, otherwise an evergreen theme. Avoids themes from the last few
 * dailies and words from the last two weeks. Pure TypeScript.
 */
import { buildDailyForTheme, DAILY_ROTATION, type DailyPuzzle } from '../daily';
import { hashString } from '../../puzzle/engine/random';
import { matchTrends, type TrendArticle, type TrendCategory } from './classify';

/** A theme used in this many recent dailies sits out. */
export const RECENT_THEME_DAYS = 4;

export type RecentDaily = { date: string; theme: string; words: readonly string[] };

export type DailyPlan = {
  daily: DailyPuzzle;
  source: 'trending' | 'generated';
  /** The article that inspired a trending daily (kept for the preview, never shown in the app). */
  trend: { title: string; views: number; category: TrendCategory } | null;
};

export type PlanInput = {
  /** UTC date being planned. */
  key: string;
  trends: readonly TrendArticle[];
  /** Earlier dailies, any order. */
  recent: readonly RecentDaily[];
  /** Themes that must not be used (e.g. the one being swapped out). */
  excludeThemes?: readonly string[];
};

function recentState(input: PlanInput) {
  const sorted = [...input.recent].filter((r) => r.date < input.key).sort((a, b) => b.date.localeCompare(a.date));
  const themes = new Set([...sorted.slice(0, RECENT_THEME_DAYS).map((r) => r.theme), ...(input.excludeThemes ?? [])]);
  const words = sorted.slice(0, 14).flatMap((r) => r.words);
  return { themes, words };
}

/** Evergreen daily: rotation order by date, skipping recent/excluded themes. */
export function planEvergreen(input: Omit<PlanInput, 'trends'>): DailyPlan {
  const { themes, words } = recentState({ ...input, trends: [] });
  const start = hashString(`theme-${input.key}`) % DAILY_ROTATION.length;
  for (let i = 0; i < DAILY_ROTATION.length; i++) {
    const theme = DAILY_ROTATION[(start + i) % DAILY_ROTATION.length];
    if (themes.has(theme)) continue;
    const daily = buildDailyForTheme(input.key, theme, words);
    if (daily) return { daily, source: 'generated', trend: null };
  }
  throw new Error(`No evergreen theme could build the daily for ${input.key}`);
}

export function planDaily(input: PlanInput): DailyPlan {
  const { themes, words } = recentState(input);
  for (const match of matchTrends(input.trends)) {
    if (themes.has(match.theme)) continue;
    const daily = buildDailyForTheme(input.key, match.theme, words);
    if (daily) {
      const { title, views } = match.article;
      return { daily, source: 'trending', trend: { title, views, category: match.category } };
    }
  }
  return planEvergreen(input);
}
