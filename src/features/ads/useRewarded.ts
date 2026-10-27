import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useRewardedAd } from 'react-native-google-mobile-ads';

import { holdMusic } from '../feedback/music';
import type { RewardedUnit } from './adPolicy';
import { AD_UNITS, useAds } from './AdsProvider';

/** After a no-fill or failed load, try again this much later (while still wanted). */
const RETRY_MS = 30_000;

type Options = {
  /** Which rewarded unit to load (separate units keep each placement's revenue visible in AdMob). */
  unit: RewardedUnit;
  /** Load an ad only while it could be offered (e.g. puzzle not finished). */
  enabled: boolean;
  /** Called once when Google confirms the reward was earned. */
  onReward: () => void;
  /** Called when the ad closes, or when it failed to show (`failed`), e.g. to resume the clock. */
  onClosed?: (outcome: { failed: boolean }) => void;
  /**
   * Sent to Google with the ad; Google passes it to our admob-ssv Edge Function
   * once the reward is earned (server-side verification). Changing it reloads the ad.
   */
  serverSideVerification?: { userId: string; customData: string };
};

/** A rewarded ad (a hint, a streak save…). `available` is true once an ad is ready to show. */
export function useRewarded({ unit, enabled, onReward, onClosed, serverSideVerification }: Options): { available: boolean; show: () => void } {
  const { ready, markRewardedShown } = useAds();
  const active = ready && enabled;
  const ssvUser = serverSideVerification?.userId;
  const ssvData = serverSideVerification?.customData;
  const requestOptions = useMemo(
    () => (ssvUser ? { serverSideVerificationOptions: { userId: ssvUser, customData: ssvData } } : undefined),
    [ssvUser, ssvData],
  );
  const { status, show, load, earnedReward } = useRewardedAd({ adUnitId: AD_UNITS[unit], autoLoad: active, requestOptions });

  const latest = useRef({ onReward, onClosed });
  useLayoutEffect(() => {
    latest.current = { onReward, onClosed };
  });

  // Grant once per ad, only after the SDK reports the reward (never just for opening it).
  const granted = useRef(false);
  useEffect(() => {
    if (status === 'loading') granted.current = false;
  }, [status]);
  useEffect(() => {
    if (earnedReward && !granted.current) {
      granted.current = true;
      latest.current.onReward();
    }
  }, [earnedReward]);

  // After it closes (or fails to show), tell the screen and get the next ad ready.
  // `show()` is press-safe: failures arrive as status 'error', never as a throw.
  const showing = useRef(false);
  // The ad has its own audio, so the music waits until it closes (or the screen goes away).
  const releaseMusic = useRef<(() => void) | null>(null);
  useEffect(() => () => releaseMusic.current?.(), []);
  useEffect(() => {
    if (status === 'closed' || (status === 'error' && showing.current)) {
      showing.current = false;
      releaseMusic.current?.();
      releaseMusic.current = null;
      if (status === 'closed') markRewardedShown(); // keeps the next interstitial at least a few minutes away
      latest.current.onClosed?.({ failed: status === 'error' });
      if (active) load();
    }
  }, [status, active, load, markRewardedShown]);

  // Nothing to show (no fill, network error): autoLoad doesn't retry, so try again a little later.
  useEffect(() => {
    if (!active || showing.current || (status !== 'no-fill' && status !== 'error')) return;
    const timer = setTimeout(load, RETRY_MS);
    return () => clearTimeout(timer);
  }, [status, active, load]);

  const showAd = useCallback(() => {
    showing.current = true;
    releaseMusic.current ??= holdMusic();
    show();
  }, [show]);

  return { available: status === 'loaded', show: showAd };
}
