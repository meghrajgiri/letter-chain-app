/**
 * Google AdMob (native). Gathers consent first (Google's UMP form, shown only
 * where the law requires it, e.g. EU/UK), then starts the SDK. Screens use
 * `useRewarded` and `useInterstitialBreak`; both wait for `ready`.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import mobileAds, { AdsConsent, AdsConsentPrivacyOptionsRequirementStatus, TestIds } from 'react-native-google-mobile-ads';

import {
  INITIAL_INTERSTITIAL_STATE,
  interstitialDue,
  recordFinishedGame,
  recordInterstitialShown,
  type InterstitialState,
  type RewardedUnit,
} from './adPolicy';

/** Real ad units in release builds; Google's test units in development (never click real ads). */
export const AD_UNITS = {
  rewardedHint: __DEV__ ? TestIds.REWARDED : 'ca-app-pub-6296571874627648/6139609264',
  betweenPuzzles: __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-6296571874627648/8715913553',
  streakSave: __DEV__ ? TestIds.REWARDED : 'ca-app-pub-6296571874627648/2808311873',
} as const satisfies Record<RewardedUnit | 'betweenPuzzles', string>;

export type AdsApi = {
  /** Consent gathered and SDK started: ads may be requested. */
  ready: boolean;
  /** Whether Settings must offer "Ad privacy choices" (EU/UK users). */
  privacyOptionsRequired: boolean;
  showPrivacyOptions: () => Promise<void>;
  /** Call when a puzzle is finished (counts towards interstitial spacing). */
  recordGameFinished: (isDaily: boolean) => void;
  /** Whether moving on from this puzzle may show an interstitial. */
  isInterstitialDue: (isDaily: boolean) => boolean;
  markInterstitialShown: () => void;
};

const AdsContext = createContext<AdsApi | null>(null);

export function useAds(): AdsApi {
  const api = useContext(AdsContext);
  if (!api) throw new Error('useAds must be used inside <AdsProvider>');
  return api;
}

export function AdsProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [privacyOptionsRequired, setPrivacyOptionsRequired] = useState(false);
  // Spacing between interstitials; per app session, so a fresh launch starts calm.
  const interstitial = useRef<InterstitialState>(INITIAL_INTERSTITIAL_STATE);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let consent;
      try {
        consent = await AdsConsent.gatherConsent();
      } catch (error) {
        // Consent couldn't be refreshed (offline, or no consent message published in AdMob).
        // As Google recommends, fall back to the result saved from an earlier launch.
        console.warn('Ad consent check failed; using the saved result', error);
        consent = await AdsConsent.getConsentInfo().catch(() => null);
      }
      if (cancelled || !consent) return;
      setPrivacyOptionsRequired(consent.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED);
      // Without consent where it's required, no ads at all; the game works without them.
      if (!consent.canRequestAds) return;
      try {
        await mobileAds().initialize();
        if (!cancelled) setReady(true);
      } catch (error) {
        console.warn('Ads unavailable', error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const showPrivacyOptions = useCallback(async () => {
    const consent = await AdsConsent.showPrivacyOptionsForm();
    if (consent.canRequestAds && !ready) {
      await mobileAds().initialize();
      setReady(true);
    }
  }, [ready]);

  const recordGameFinished = useCallback((isDaily: boolean) => {
    interstitial.current = recordFinishedGame(interstitial.current, isDaily);
  }, []);
  const isInterstitialDue = useCallback((isDaily: boolean) => interstitialDue(interstitial.current, Date.now(), isDaily), []);
  const markInterstitialShown = useCallback(() => {
    interstitial.current = recordInterstitialShown(Date.now());
  }, []);

  const api = useMemo<AdsApi>(
    () => ({ ready, privacyOptionsRequired, showPrivacyOptions, recordGameFinished, isInterstitialDue, markInterstitialShown }),
    [ready, privacyOptionsRequired, showPrivacyOptions, recordGameFinished, isInterstitialDue, markInterstitialShown],
  );
  return <AdsContext.Provider value={api}>{children}</AdsContext.Provider>;
}
