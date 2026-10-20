/** Web build: no rewarded ads. */
export function useRewardedHint(_options: {
  enabled: boolean;
  onReward: () => void;
  onClosed?: () => void;
  unit?: 'rewardedHint' | 'streakSave';
}): { available: boolean; show: () => void } {
  return { available: false, show: () => {} };
}
