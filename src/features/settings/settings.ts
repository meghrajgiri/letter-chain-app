/** Player settings, stored on the device (settings table, key "app"). */
export type AppSettings = {
  haptics: boolean;
  /** Sound effects (found, hint, complete…). */
  sound: boolean;
  /** Background music loop. */
  music: boolean;
  reminderEnabled: boolean;
  /** Local time of the daily reminder. */
  reminderHour: number;
  reminderMinute: number;
  /** First-play tutorial shown per mode. */
  tutorialsSeen: { classic: boolean; chain: boolean };
  /** Guest sign-in reminders are snoozed until this many puzzles are solved. */
  signInSnoozeUntil: number;
  /** Missed day whose "save your streak" offer the player dismissed (hidden for that day only). */
  streakSaveDismissed: string | null;
};

export const DEFAULT_SETTINGS: AppSettings = {
  haptics: true,
  sound: true,
  music: true,
  reminderEnabled: false,
  reminderHour: 19,
  reminderMinute: 0,
  tutorialsSeen: { classic: false, chain: false },
  signInSnoozeUntil: 0,
  streakSaveDismissed: null,
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
