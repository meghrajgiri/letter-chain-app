/**
 * Web build: react-native-web's AccessibilityInfo.isScreenReaderEnabled()
 * always resolves `true`, which would switch the board to screen-reader mode
 * (tap buttons, no dragging) for every browser. Browsers can't tell us whether
 * a screen reader is running, so the web build keeps the normal board.
 */
export function useScreenReader(): boolean {
  return false;
}

/** No-op on web (VoiceOver announcements are native-only). */
export function announceFeedback(_message: string): void {}
