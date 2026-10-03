import { Redirect, useLocalSearchParams } from 'expo-router';

import { CHAIN_DIFFICULTIES, type ChainDifficulty } from '@/features/chain/engine/types';
import { DAILY_DIFFICULTY, dailyKey } from '@/features/daily/daily';
import { useDailyForPlay } from '@/features/daily/dailyStore';
import { THEMES } from '@/features/puzzle/data/themes';
import { normalizeSeed } from '@/features/puzzle/engine/random';
import { ChainPuzzleScreen } from '@/screens/ChainPuzzleScreen';

type Params = { theme?: string; difficulty?: string; seed?: string; avoid?: string; mode?: string; date?: string };

export default function ChainRoute() {
  const params = useLocalSearchParams<Params>();
  const daily = useDailyForPlay(params.mode === 'daily' ? (params.date ?? dailyKey()) : null);
  if (daily) {
    if (daily.mode === 'classic') return <Redirect href={{ pathname: '/puzzle', params: { mode: 'daily', date: daily.date } }} />;
    return (
      <ChainPuzzleScreen
        key={`daily-${daily.date}`}
        theme={daily.theme}
        difficulty={DAILY_DIFFICULTY}
        mode="daily"
        preset={daily.puzzle}
        dailyDate={daily.date}
      />
    );
  }
  const theme = THEMES.some((t) => t.id === params.theme) ? params.theme! : THEMES[0].id;
  const difficulty = CHAIN_DIFFICULTIES.includes(params.difficulty as ChainDifficulty) ? (params.difficulty as ChainDifficulty) : 'medium';
  return (
    <ChainPuzzleScreen
      key={`${theme}-${difficulty}-${params.seed ?? 'random'}`}
      theme={theme}
      difficulty={difficulty}
      seed={params.seed ? normalizeSeed(params.seed) : undefined}
      avoidWords={params.avoid ? params.avoid.split(',') : undefined}
    />
  );
}

/** Friendly fallback if the puzzle can't be generated or the screen crashes. */
export { ErrorScreen as ErrorBoundary } from '@/components/ErrorScreen';
