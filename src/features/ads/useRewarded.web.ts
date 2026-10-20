import type { RewardedUnit } from './adPolicy';

/** Web build: no rewarded ads. */
export function useRewarded(_options: {
  unit: RewardedUnit;
  enabled: boolean;
  onReward: () => void;
  onClosed?: (outcome: { failed: boolean }) => void;
}): { available: boolean; show: () => void } {
  return { available: false, show: () => {} };
}
