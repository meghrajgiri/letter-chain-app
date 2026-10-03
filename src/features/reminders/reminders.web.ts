/** Reminders aren't supported on web; these are no-ops with the same API. */
export async function requestReminderPermission(): Promise<boolean> {
  return false;
}

export async function syncReminder(_options: { enabled: boolean; hour: number; minute: number; todayDone: boolean; streakDays: number }) {}
