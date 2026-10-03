/** Native daily reminder via local notifications (no server, no push). */
import * as Notifications from 'expo-notifications';

import { nextReminderDate, reminderMessage } from './schedule';

const CHANNEL_ID = 'daily-reminder';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

async function ensureChannel() {
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Daily puzzle reminder',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/** Asks for notification permission (Android 13+). Returns true if granted. */
export async function requestReminderPermission(): Promise<boolean> {
  await ensureChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

/** Replaces any scheduled reminder with the next one (or none when disabled). */
export async function syncReminder(options: { enabled: boolean; hour: number; minute: number; todayDone: boolean; streakDays: number }) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!options.enabled) return;
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return;
  await ensureChannel();
  await Notifications.scheduleNotificationAsync({
    content: reminderMessage(options.streakDays),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: nextReminderDate(new Date(), options.hour, options.minute, options.todayDone),
      channelId: CHANNEL_ID,
    },
  });
}
