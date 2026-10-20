import { randomUUID } from 'expo-crypto';
import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Pop } from '@/components/ui/Pop';
import { useToast } from '@/components/ui/Toast';
import { useAccount } from '@/features/account/AccountProvider';
import type { StreakSaveCustomData } from '@/features/ads/ssv';
import { useRewarded } from '@/features/ads/useRewarded';
import { playFeedback } from '@/features/feedback/feedback';
import { SAVE_COOLDOWN_DAYS, type StreakSaveOffer } from '@/features/progress';
import { useProgress } from '@/features/progress/ProgressProvider';
import { LIP, colors, radius, shadows, spacing } from '@/theme/tokens';

/** How long "Loading ad…" may show before we say there's no ad right now (no fill, no consent, offline). */
const AD_WAIT_MS = 12_000;

/**
 * "Save your streak" on Home: shown the day after a missed daily (rules in
 * progress/streakSave.ts). Watching a rewarded ad to the end fills the missed
 * day; "Not now" hides it until the next offer.
 *
 * Signed in, the save only reaches the server through Google's server-side
 * verification (admob-ssv), so it can't be faked without watching the ad.
 * Guests' saves stay on their device.
 */
export function StreakSaveCard() {
  const { summary, settings } = useProgress();
  const live = summary.streakSave && settings.streakSaveDismissed !== summary.streakSave.day ? summary.streakSave : null;
  // While an ad plays, keep showing its day even if the offer changes underneath.
  const [busyDay, setBusyDay] = useState<string | null>(null);
  const day = busyDay ?? live?.day ?? null;
  if (Platform.OS === 'web' || !day) return null;
  // Keyed by day: each offer gets its own save id (sent to Google with the ad).
  return <SaveOffer key={day} live={live?.day === day ? live : null} onBusy={setBusyDay} />;
}

/** `userId`: who the ad was loaded for (Google's verification callback names them). */
type Pending = StreakSaveOffer & { todayDone: boolean; userId: string | null };

function SaveOffer({ live, onBusy }: { live: StreakSaveOffer | null; onBusy: (day: string | null) => void }) {
  const { summary, saveStreak, updateSettings } = useProgress();
  const account = useAccount();
  const toast = useToast();
  const [saveId] = useState(() => randomUUID());

  // The offer as it was when the player pressed Watch: the reward still applies if
  // the day rolls over, a sync changes the offer, or the save itself clears it mid-ad.
  const [pending, setPendingState] = useState<Pending | null>(null);
  // Mirrors `pending` for the ad callbacks, which can fire before a re-render.
  const pendingRef = useRef<Pending | null>(null);
  const setPending = (next: Pending | null) => {
    pendingRef.current = next;
    setPendingState(next);
    onBusy(next?.day ?? null);
  };
  const rewarded = useRef(false);

  const offer = pending ?? live;
  // Frozen while an ad is in progress: changing the verification options reloads
  // (and so destroys) the ad, which would lose the reward if it was showing.
  const userId = pending ? pending.userId : (account.user?.id ?? null);
  const customData: StreakSaveCustomData | null = offer ? { saveId, day: offer.day } : null;
  const ad = useRewarded({
    unit: 'streakSave',
    // Wait for the saved session: an ad loaded before it knows the player can't be verified.
    enabled: offer !== null && account.status !== 'loading',
    serverSideVerification: userId && customData ? { userId, customData: JSON.stringify(customData) } : undefined,
    onReward: () => {
      const saved = pendingRef.current;
      if (!saved) return;
      rewarded.current = true;
      saveStreak(saved.day, saveId);
      playFeedback('complete');
      // The run, the saved day, and today if it was already played.
      toast.show(`Streak saved! Your ${saved.streak + 1 + (saved.todayDone ? 1 : 0)}-day streak lives on`);
      // AccountProvider picks up the verified copy once Google's callback reaches the server.
    },
    onClosed: ({ failed }) => {
      if (failed) {
        setPending(null);
        toast.show('The ad couldn’t play. Try again in a moment');
        return;
      }
      // "Closed" can arrive just before "reward earned", so give the reward a moment to land.
      setTimeout(() => {
        if (!rewarded.current) toast.show('Watch the ad to the end to save your streak');
        setPending(null);
      }, 500);
    },
  });

  // Rewarded ads can be unavailable for a while (no fill, ads not allowed yet, offline).
  const waiting = offer !== null && !ad.available && !pending;
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    if (!waiting) return;
    const timer = setTimeout(() => setTimedOut(true), AD_WAIT_MS);
    return () => clearTimeout(timer);
  }, [waiting]);
  const waitedTooLong = waiting && timedOut;

  if (!offer) return null;

  return (
    <Pop>
      <View style={styles.card} accessibilityRole="summary">
        <View style={styles.top}>
          <View style={styles.flame}>
            <Icon name="local-fire-department" size={28} color={colors.coral} />
          </View>
          <View style={styles.text}>
            <AppText variant="headlineSm" color={colors.coralInk} accessibilityRole="header">
              Save your {offer.streak}-day streak
            </AppText>
            <AppText variant="bodySm" color={colors.ink}>
              You missed yesterday’s daily. Watch a short ad and your streak carries on.
            </AppText>
          </View>
        </View>
        <Button
          label={ad.available ? 'Watch ad to save' : waitedTooLong ? 'No ad right now' : 'Loading ad…'}
          icon="smart-display"
          disabled={!ad.available || pending !== null}
          onPress={() => {
            setPending({ ...offer, todayDone: summary.streak.todayDone, userId });
            rewarded.current = false;
            ad.show();
          }}
          accessibilityHint={`Plays a short video ad, then keeps your ${offer.streak}-day streak`}
        />
        {waitedTooLong && !ad.available ? (
          <AppText variant="bodySm" color={colors.inkMuted} style={styles.center}>
            Check your connection, or come back later today. The offer lasts until the next daily.
          </AppText>
        ) : null}
        <View style={styles.footer}>
          <AppText variant="labelMd" color={colors.inkMuted}>
            One save every {SAVE_COOLDOWN_DAYS} days
          </AppText>
          <Button label="Not now" variant="ghost" size="sm" onPress={() => updateSettings({ streakSaveDismissed: offer.day })} />
        </View>
      </View>
    </Pop>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.coralSoft,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: 12,
    borderBottomWidth: LIP.md,
    borderBottomColor: colors.coral,
    boxShadow: shadows.card,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flame: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
  center: { textAlign: 'center', marginTop: -4 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: -4 },
});
