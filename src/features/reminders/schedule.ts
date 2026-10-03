/** Pure reminder rules (tested). */

/**
 * When the next daily reminder should fire: today at the chosen time if the
 * daily isn't done yet and that time is still ahead, otherwise tomorrow.
 */
export function nextReminderDate(now: Date, hour: number, minute: number, todayDone: boolean): Date {
  const today = new Date(now);
  today.setHours(hour, minute, 0, 0);
  if (!todayDone && today.getTime() > now.getTime()) return today;
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
}

export function reminderMessage(streakDays: number): { title: string; body: string } {
  if (streakDays > 0) {
    return { title: `Keep your ${streakDays}-day streak 🔥`, body: 'Today’s Letter Chain puzzle is waiting for you.' };
  }
  return { title: 'Your daily puzzle is ready 🧩', body: 'A fresh Letter Chain puzzle is waiting. Two minutes, one streak.' };
}

export function formatReminderTime(hour: number, minute: number): string {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
}
