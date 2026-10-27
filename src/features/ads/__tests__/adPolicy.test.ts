import {
  canOfferAdHint,
  INITIAL_INTERSTITIAL_STATE,
  INTERSTITIAL_MIN_GAP_MS,
  interstitialDue,
  MAX_AD_HINTS_PER_PUZZLE,
  recordFinishedGame,
  recordInterstitialShown,
  recordRewardedShown,
} from '../adPolicy';

describe('interstitials', () => {
  const after = (games: number, daily = false) => {
    let s = INITIAL_INTERSTITIAL_STATE;
    for (let i = 0; i < games; i++) s = recordFinishedGame(s, daily);
    return s;
  };

  it('waits for 3 finished free-play puzzles', () => {
    expect(interstitialDue(after(2), 0, false)).toBe(false);
    expect(interstitialDue(after(3), 0, false)).toBe(true);
  });

  it('never shows around the daily, and dailies do not count', () => {
    expect(interstitialDue(after(5), 0, true)).toBe(false);
    expect(after(5, true).gamesSinceAd).toBe(0);
  });

  it('never shows an interstitial straight after a rewarded ad', () => {
    // Three puzzles done, so an interstitial would be due, but a hint ad just closed.
    let state = INITIAL_INTERSTITIAL_STATE;
    for (let i = 0; i < 3; i++) state = recordFinishedGame(state, false);
    expect(interstitialDue(state, 10_000, false)).toBe(true);
    state = recordRewardedShown(state, 10_000);
    expect(interstitialDue(state, 10_000 + INTERSTITIAL_MIN_GAP_MS - 1, false)).toBe(false);
    expect(interstitialDue(state, 10_000 + INTERSTITIAL_MIN_GAP_MS, false)).toBe(true);
  });

  it('keeps at least 3 minutes between interstitials', () => {
    const shown = recordInterstitialShown(1_000);
    const three = { ...shown, gamesSinceAd: 3 };
    expect(interstitialDue(three, 1_000 + INTERSTITIAL_MIN_GAP_MS - 1, false)).toBe(false);
    expect(interstitialDue(three, 1_000 + INTERSTITIAL_MIN_GAP_MS, false)).toBe(true);
    expect(shown.gamesSinceAd).toBe(0);
  });
});

describe('rewarded hints', () => {
  it('are offered only when out of hints, up to the per-puzzle cap', () => {
    expect(canOfferAdHint(1, 0)).toBe(false);
    expect(canOfferAdHint(0, 0)).toBe(true);
    expect(canOfferAdHint(0, MAX_AD_HINTS_PER_PUZZLE)).toBe(false);
  });
});
