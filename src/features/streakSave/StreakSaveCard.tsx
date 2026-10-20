import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Pop } from '@/components/ui/Pop';
import { useToast } from '@/components/ui/Toast';
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
 */
export function StreakSaveCard() {
  const { summary, saveStreak, settings, updateSettings } = useProgress();
  const toast = useToast();
  // The offer as it was when the player pressed Watch. It keeps the card (and its
  // ad) mounted until the ad closes, and the reward still applies if the day rolls
  // over, a sync changes the offer, or the save itself clears the offer mid-ad.
  type Pending = StreakSaveOffer & { todayDone: boolean };
  const [pending, setPendingState] = useState<Pending | null>(null);
  // Mirrors `pending` for the ad callbacks, which can fire before a re-render.
  const pendingRef = useRef<Pending | null>(null);
  const setPending = (next: Pending | null) => {
    pendingRef.current = next;
    setPendingState(next);
  };
  const rewarded = useRef(false);

  const live = summary.streakSave && settings.streakSaveDismissed !== summary.streakSave.day ? summary.streakSave : null;
  const offer = pending ?? live;
  const visible = Platform.OS !== 'web' && offer !== null;
  const ad = useRewarded({
    unit: 'streakSave',
    enabled: visible,
    onReward: () => {
      const saved = pendingRef.current;
      if (!saved) return;
      rewarded.current = true;
      saveStreak(saved.day);
      playFeedback('complete');
      // The run, the saved day, and today if it was already played.
      toast.show(`Streak saved! Your ${saved.streak + 1 + (saved.todayDone ? 1 : 0)}-day streak lives on`);
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
  const waiting = visible && !ad.available && !pending;
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    if (!waiting) return;
    const timer = setTimeout(() => setTimedOut(true), AD_WAIT_MS);
    return () => clearTimeout(timer);
  }, [waiting]);
  const waitedTooLong = waiting && timedOut;

  if (!visible || !offer) return null;

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
            setPending({ ...offer, todayDone: summary.streak.todayDone });
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
