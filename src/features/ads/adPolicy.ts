/**
 * When ads may appear. Pure TypeScript so the rules are easy to test and tune.
 *
 *  - Interstitials: only between free-play puzzles (never around the daily),
 *    at most one every 3 finished free-play puzzles and 3 minutes apart.
 *  - Rewarded: the player chooses to watch one for an extra hint, up to 3
 *    times per puzzle.
 */

export const INTERSTITIAL_EVERY_GAMES = 3;
export const INTERSTITIAL_MIN_GAP_MS = 3 * 60_000;
export const MAX_AD_HINTS_PER_PUZZLE = 3;

export type InterstitialState = {
  /** Free-play puzzles finished since the last interstitial (or app start). */
  gamesSinceAd: number;
  /** When the last interstitial was shown (ms epoch), null if none yet. */
  lastAdAt: number | null;
};

export const INITIAL_INTERSTITIAL_STATE: InterstitialState = { gamesSinceAd: 0, lastAdAt: null };

/** Count a finished game. Dailies never count towards interstitials. */
export function recordFinishedGame(state: InterstitialState, isDaily: boolean): InterstitialState {
  return isDaily ? state : { ...state, gamesSinceAd: state.gamesSinceAd + 1 };
}

/** Whether moving on from a finished puzzle is a good moment for an interstitial. */
export function interstitialDue(state: InterstitialState, now: number, isDaily: boolean): boolean {
  if (isDaily) return false;
  if (state.gamesSinceAd < INTERSTITIAL_EVERY_GAMES) return false;
  return state.lastAdAt === null || now - state.lastAdAt >= INTERSTITIAL_MIN_GAP_MS;
}

export function recordInterstitialShown(now: number): InterstitialState {
  return { gamesSinceAd: 0, lastAdAt: now };
}

/** Whether a "watch an ad for a hint" offer may be shown. */
export function canOfferAdHint(hintsLeft: number, adHintsUsed: number): boolean {
  return hintsLeft < 1 && adHintsUsed < MAX_AD_HINTS_PER_PUZZLE;
}
