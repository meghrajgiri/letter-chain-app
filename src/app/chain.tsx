import { useLocalSearchParams } from 'expo-router';

import { CHAIN_DIFFICULTIES, type ChainDifficulty } from '@/features/chain/engine/types';
import { THEMES } from '@/features/puzzle/data/themes';
import { normalizeSeed } from '@/features/puzzle/engine/random';
import { ChainPuzzleScreen } from '@/screens/ChainPuzzleScreen';

type Params = { theme?: string; difficulty?: string; seed?: string; avoid?: string };

export default function ChainRoute() {
  const params = useLocalSearchParams<Params>();
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
