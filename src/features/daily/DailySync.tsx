import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useProgress } from '../progress/ProgressProvider';
import { dailyKey } from './daily';
import { refreshDailies } from './dailyStore';

const nextDay = (key: string) => dailyKey(new Date(Date.parse(`${key}T00:00:00Z`) + 86_400_000));

/**
 * Fetches today's and tomorrow's server dailies on launch, when the daily date
 * rolls over and when the app returns to the foreground (tomorrow's copy makes
 * the midnight switch work offline). Renders nothing.
 */
export function DailySync() {
  const { dailyKey: today } = useProgress();
  useEffect(() => {
    const refresh = () => refreshDailies([today, nextDay(today)]);
    refresh();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [today]);
  return null;
}
