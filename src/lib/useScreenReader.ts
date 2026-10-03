import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

/** True while TalkBack / VoiceOver is running. */
export function useScreenReader(): boolean {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isScreenReaderEnabled()
      .then((value) => mounted && setEnabled(value))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('screenReaderChanged', setEnabled);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);
  return enabled;
}

/**
 * Speaks game feedback through VoiceOver. Android needs no call: TalkBack
 * already reads the same text from SelectionChip's live region.
 */
export function announceFeedback(message: string): void {
  if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(message);
}
