/** Web build: no rewarded ads. */
export function useRewardedHint(_options: { enabled: boolean; onReward: () => void; onClosed?: () => void }): { available: boolean; show: () => void } {
  return { available: false, show: () => {} };
}
