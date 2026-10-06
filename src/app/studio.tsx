import { Redirect } from 'expo-router';

import { PuzzleStudioScreen } from '@/screens/PuzzleStudioScreen';

/** Puzzle Studio is a developer tool: release builds send any link to it back Home. */
export default function StudioRoute() {
  if (!__DEV__) return <Redirect href="/" />;
  return <PuzzleStudioScreen />;
}
