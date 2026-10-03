import { Redirect, useLocalSearchParams } from 'expo-router';

import { DAILY_DIFFICULTY, dailyKey } from '@/features/daily/daily';
import { useDailyForPlay } from '@/features/daily/dailyStore';
import { THEMES } from '@/features/puzzle/data/themes';
import { normalizeSeed } from '@/features/puzzle/engine/random';
import { DIFFICULTIES, type Difficulty } from '@/features/puzzle/engine/types';
import { PuzzleScreen, type PuzzleMode } from '@/screens/PuzzleScreen';

type Params = {
  theme?: string;
  difficulty?: string;
  /** Number or string (e.g. "daily-2026-10-03"); omitted = random. */
  seed?: string;
  gridSize?: string;
  wordCount?: string;
  /** Comma-separated avoid list; with `seed`, reproduces a Studio puzzle exactly. */
  avoid?: string;
  mode?: string;
  /** Daily puzzle's UTC date (YYYY-MM-DD), with `mode=daily`. */
  date?: string;
};

const toNumber = (value?: string) => (value && /^\d+$/.test(value) ? Number(value) : undefined);

export default function PuzzleRoute() {
  const params = useLocalSearchParams<Params>();
  const theme = THEMES.some((t) => t.id === params.theme) ? params.theme! : THEMES[0].id;
  const difficulty = DIFFICULTIES.includes(params.difficulty as Difficulty) ? (params.difficulty as Difficulty) : 'medium';
  const mode: PuzzleMode = params.mode === 'daily' ? 'daily' : 'free';

  const daily = useDailyForPlay(mode === 'daily' ? (params.date ?? dailyKey()) : null);
  if (daily) {
    if (daily.mode === 'chain') return <Redirect href={{ pathname: '/chain', params: { mode: 'daily', date: daily.date } }} />;
    return (
      <PuzzleScreen
        key={`daily-${daily.date}`}
        theme={daily.theme}
        difficulty={DAILY_DIFFICULTY}
        mode="daily"
        seed={0}
        preset={daily.puzzle}
        dailyDate={daily.date}
      />
    );
  }

  return (
    // Remount on a new puzzle request so per-puzzle state starts fresh.
    <PuzzleScreen
      key={`${theme}-${difficulty}-${params.seed ?? 'random'}`}
      theme={theme}
      difficulty={difficulty}
      mode={mode}
      seed={params.seed ? normalizeSeed(params.seed) : undefined}
      gridSize={toNumber(params.gridSize)}
      wordCount={toNumber(params.wordCount)}
      avoidWords={params.avoid ? params.avoid.split(',') : undefined}
    />
  );
}

/** Friendly fallback if the puzzle can't be generated or the screen crashes. */
export { ErrorScreen as ErrorBoundary } from '@/components/ErrorScreen';
