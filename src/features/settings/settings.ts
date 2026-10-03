/** Player settings, stored on the device (settings table, key "app"). */
export type AppSettings = {
  haptics: boolean;
  reminderEnabled: boolean;
  /** Local time of the daily reminder. */
  reminderHour: number;
  reminderMinute: number;
  /** First-play tutorial shown per mode. */
  tutorialsSeen: { classic: boolean; chain: boolean };
  /** Guest sign-in reminders are snoozed until this many puzzles are solved. */
  signInSnoozeUntil: number;
};

export const DEFAULT_SETTINGS: AppSettings = {
  haptics: true,
  reminderEnabled: false,
  reminderHour: 19,
  reminderMinute: 0,
  tutorialsSeen: { classic: false, chain: false },
  signInSnoozeUntil: 0,
};

export const SETTINGS_KEY = 'app';

export function parseSettings(raw: string | null): AppSettings {
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const saved = JSON.parse(raw) as Partial<AppSettings>;
    return { ...DEFAULT_SETTINGS, ...saved, tutorialsSeen: { ...DEFAULT_SETTINGS.tutorialsSeen, ...saved.tutorialsSeen } };
  } catch {
    return DEFAULT_SETTINGS;
  }
}
