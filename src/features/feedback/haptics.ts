/** Game haptics, respecting the player's setting. Failures (e.g. web) are ignored. */
import * as Haptics from 'expo-haptics';

let enabled = true;

export function setHapticsEnabled(value: boolean) {
  enabled = value;
}

export type HapticKind = 'select' | 'found' | 'complete' | 'warning';

export function haptic(kind: HapticKind) {
  if (!enabled) return;
  const run = () => {
    switch (kind) {
      case 'select':
        return Haptics.selectionAsync();
      case 'found':
        return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      case 'complete':
        return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      case 'warning':
        return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };
  try {
    run()?.catch(() => {});
  } catch {
    // Haptics unavailable on this platform.
  }
}
