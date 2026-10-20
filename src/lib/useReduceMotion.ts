import { useSyncExternalStore } from 'react';
import { AccessibilityInfo } from 'react-native';

// One app-wide query and listener, started at import, so components that
// mount later already have the real value instead of animating on a stale `false`.
let reduceMotion = false;
const listeners = new Set<() => void>();

function set(value: boolean) {
  if (value === reduceMotion) return;
  reduceMotion = value;
  listeners.forEach((listener) => listener());
}

AccessibilityInfo.isReduceMotionEnabled()
  .then(set)
  .catch(() => {});
AccessibilityInfo.addEventListener('reduceMotionChanged', set);

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const getSnapshot = () => reduceMotion;

/** True when the player has asked the OS to reduce motion (Android "Remove animations"). */
export function useReduceMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
