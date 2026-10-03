import { computeStreak } from './streak';
import type { GameResult } from './types';

export type BadgeIcon = 'emoji-events' | 'local-fire-department' | 'bolt' | 'explore' | 'gesture' | 'psychology' | 'public' | 'military-tech';

export type Badge = {
  id: string;
  title: string;
  description: string;
  icon: BadgeIcon;
  progress: number;
  goal: number;
  earned: boolean;
  /** completedAt of the result that earned it. */
  earnedAt: string | null;
};

type BadgeRule = {
  id: string;
  title: string;
  description: string;
  icon: BadgeIcon;
  goal: number;
  /** Progress after the given (chronologically sorted) results. */
  progress: (results: readonly GameResult[], themeCount: number) => number;
};

export const BADGE_RULES: BadgeRule[] = [
  { id: 'first', title: 'First Find', description: 'Solve your first puzzle', icon: 'emoji-events', goal: 1, progress: (r) => r.length },
  {
    id: 'streak7',
    title: '7-Day Champion',
    description: 'Complete the daily puzzle 7 days in a row',
    icon: 'local-fire-department',
    goal: 7,
    progress: (r) => computeStreak(r, r.length ? r[r.length - 1].localDate : '1970-01-01').longest,
  },
  {
    id: 'speed',
    title: 'Speed Reader',
    description: 'Clear a 6-word grid in under 2 minutes',
    icon: 'bolt',
    goal: 1,
    progress: (r) => (r.some((x) => x.wordCount >= 6 && x.durationMs < 120_000) ? 1 : 0),
  },
  { id: 'fifty', title: 'Puzzle Explorer', description: 'Solve 50 puzzles', icon: 'explore', goal: 50, progress: (r) => r.length },
  { id: 'chain10', title: 'Chain Linker', description: 'Solve 10 Chain puzzles', icon: 'gesture', goal: 10, progress: (r) => r.filter((x) => x.mode === 'chain').length },
  { id: 'pure25', title: 'Pure Solver', description: 'Solve 25 puzzles without hints', icon: 'psychology', goal: 25, progress: (r) => r.filter((x) => x.hintsUsed === 0).length },
  {
    id: 'expert',
    title: 'Expert Mind',
    description: 'Solve an Expert Classic puzzle',
    icon: 'military-tech',
    goal: 1,
    progress: (r) => (r.some((x) => x.mode === 'classic' && x.difficulty === 'expert') ? 1 : 0),
  },
  {
    id: 'themes',
    title: 'World Tour',
    description: 'Play every theme',
    icon: 'public',
    goal: 24,
    progress: (r) => new Set(r.map((x) => x.theme)).size,
  },
];

/**
 * Badge state from history. Results are processed chronologically so each
 * badge knows which game earned it (used for "new badge!" on completion).
 */
export function computeBadges(results: readonly GameResult[], themeCount: number): Badge[] {
  const sorted = [...results].sort((a, b) => a.completedAt.localeCompare(b.completedAt));
  return BADGE_RULES.map((rule) => {
    const goal = rule.id === 'themes' ? themeCount : rule.goal;
    let earnedAt: string | null = null;
    // Find the first prefix of history at which the goal was reached.
    for (let i = 0; i < sorted.length && !earnedAt; i++) {
      if (rule.progress(sorted.slice(0, i + 1), themeCount) >= goal) earnedAt = sorted[i].completedAt;
    }
    const progress = Math.min(goal, rule.progress(sorted, themeCount));
    return { id: rule.id, title: rule.title, description: rule.description, icon: rule.icon, progress, goal, earned: earnedAt !== null, earnedAt };
  });
}
