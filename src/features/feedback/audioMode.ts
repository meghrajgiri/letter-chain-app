import { setAudioModeAsync } from 'expo-audio';

let configured = false;

/**
 * Game audio etiquette, set once before the first sound: stay quiet when the
 * phone is on silent/vibrate, mix with whatever else is playing (the player's
 * own music keeps going), and never play in the background.
 */
export function ensureAudioMode() {
  if (configured) return;
  configured = true;
  setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers', shouldPlayInBackground: false }).catch(() => {});
}
