/** Web build (browser testing): no ads. Same API as the native provider. */
import { createContext, useContext, useMemo, type ReactNode } from 'react';

export type AdsApi = {
  ready: boolean;
  privacyOptionsRequired: boolean;
  showPrivacyOptions: () => Promise<void>;
  recordGameFinished: (isDaily: boolean) => void;
  isInterstitialDue: (isDaily: boolean) => boolean;
  markInterstitialShown: () => void;
  markRewardedShown: () => void;
};

const NO_ADS: AdsApi = {
  ready: false,
  privacyOptionsRequired: false,
  showPrivacyOptions: async () => {},
  recordGameFinished: () => {},
  isInterstitialDue: () => false,
  markInterstitialShown: () => {},
  markRewardedShown: () => {},
};

const AdsContext = createContext<AdsApi>(NO_ADS);

export function useAds(): AdsApi {
  return useContext(AdsContext);
}

export function AdsProvider({ children }: { children: ReactNode }) {
  const api = useMemo(() => NO_ADS, []);
  return <AdsContext.Provider value={api}>{children}</AdsContext.Provider>;
}
