/** Game moments, each with a sound and a matching haptic (each follows its own setting). */
import { haptic, type HapticKind } from './haptics';
import { playSound, type SoundKind } from './sounds';

export type FeedbackKind = SoundKind;

const HAPTIC: Record<FeedbackKind, HapticKind> = {
  select: 'select',
  found: 'found',
  warning: 'warning',
  hint: 'select',
  complete: 'complete',
};

export function playFeedback(kind: FeedbackKind) {
  playSound(kind);
  haptic(HAPTIC[kind]);
}
