import { useCallback, useEffect, useRef } from 'react';
import { useInterstitialAd } from 'react-native-google-mobile-ads';

import { holdMusic } from '../feedback/music';
import { AD_UNITS, useAds } from './AdsProvider';

/**
 * An interstitial between puzzles. `proceed(next)` shows the ad first when one
 * is ready and due (see adPolicy), then runs `next`; otherwise runs `next` now.
 */
export function useInterstitialBreak({ enabled, isDaily }: { enabled: boolean; isDaily: boolean }): { proceed: (next: () => void) => void } {
  const { ready, isInterstitialDue, markInterstitialShown } = useAds();
  const active = ready && enabled && !isDaily;
  const { status, show, load } = useInterstitialAd({ adUnitId: AD_UNITS.betweenPuzzles, autoLoad: active });
  const pending = useRef<(() => void) | null>(null);
  // The ad has its own audio, so the music waits until it closes (or the screen goes away).
  const releaseMusic = useRef<(() => void) | null>(null);
  useEffect(() => () => releaseMusic.current?.(), []);

  const runPending = useCallback(() => {
    releaseMusic.current?.();
    releaseMusic.current = null;
    const next = pending.current;
    pending.current = null;
    next?.();
  }, []);

  useEffect(() => {
    if (status === 'closed') {
      runPending();
      if (active) load();
    } else if (status === 'error') {
      runPending();
    }
  }, [status, active, load, runPending]);

  const proceed = useCallback(
    (next: () => void) => {
      if (!active || status !== 'loaded' || !isInterstitialDue(isDaily)) {
        next();
        return;
      }
      pending.current = next;
      markInterstitialShown();
      releaseMusic.current ??= holdMusic();
      // Press-safe: a failed show arrives as status 'error', which runs `next`.
      show();
    },
    [active, status, isInterstitialDue, isDaily, markInterstitialShown, show],
  );

  return { proceed };
}
