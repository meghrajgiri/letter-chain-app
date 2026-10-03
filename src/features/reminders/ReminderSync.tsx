import { useEffect } from 'react';

import { useProgress } from '../progress/ProgressProvider';
import { syncReminder } from './reminders';

/**
 * Keeps the scheduled reminder in step with settings and progress: after the
 * daily is done the next reminder moves to tomorrow, and its text tracks the
 * streak. Renders nothing.
 */
export function ReminderSync() {
  const { settings, summary } = useProgress();
  const { reminderEnabled, reminderHour, reminderMinute } = settings;
  const { todayDone, current } = summary.streak;
  useEffect(() => {
    syncReminder({ enabled: reminderEnabled, hour: reminderHour, minute: reminderMinute, todayDone, streakDays: current }).catch((error) =>
      console.warn('Could not schedule reminder', error),
    );
  }, [reminderEnabled, reminderHour, reminderMinute, todayDone, current]);
  return null;
}
