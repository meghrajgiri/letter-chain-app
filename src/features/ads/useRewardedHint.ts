import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { useRewardedAd } from 'react-native-google-mobile-ads';

import { holdMusic } from '../feedback/music';
import { AD_UNITS, useAds } from './AdsProvider';

type Options = {
  /** Load an ad only while it could be offered (e.g. puzzle not finished). */
  enabled: boolean;
  /** Called once when Google confirms the reward was earned. */
  onReward: () => void;
  /** Called when the ad closes (or fails to show), e.g. to resume the clock. */
  onClosed?: () => void;
  /** Which rewarded unit to load (separate units keep each placement's revenue visible in AdMob). */
  unit?: 'rewardedHint' | 'streakSave';
};

/** A rewarded ad (by default, one that grants a hint). `available` is true once an ad is ready to show. */
export function useRewardedHint({ enabled, onReward, onClosed, unit = 'rewardedHint' }: Options): { available: boolean; show: () => void } {
  const { ready } = useAds();
  const active = ready && enabled;
  const { status, show, load, earnedReward } = useRewardedAd({ adUnitId: AD_UNITS[unit], autoLoad: active });

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
      latest.current.onClosed?.();
      if (active) load();
    }
  }, [status, active, load]);

  const showAd = useCallback(() => {
    showing.current = true;
    releaseMusic.current ??= holdMusic();
    show();
  }, [show]);

  return { available: status === 'loaded', show: showAd };
}
