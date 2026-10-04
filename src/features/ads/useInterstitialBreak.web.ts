/** Web build: no interstitials; always moves straight on. */
export function useInterstitialBreak(_options: { enabled: boolean; isDaily: boolean }): { proceed: (next: () => void) => void } {
  return { proceed: (next) => next() };
}
