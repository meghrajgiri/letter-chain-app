import { useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Pop } from '@/components/ui/Pop';
import { useToast } from '@/components/ui/Toast';
import { useRewardedHint } from '@/features/ads/useRewardedHint';
import { playFeedback } from '@/features/feedback/feedback';
import { SAVE_COOLDOWN_DAYS } from '@/features/progress';
import { useProgress } from '@/features/progress/ProgressProvider';
import { LIP, colors, radius, shadows, spacing } from '@/theme/tokens';

/**
 * "Save your streak" on Home: shown the day after a missed daily (rules in
 * progress/streakSave.ts). Watching a rewarded ad to the end fills the missed
 * day; "Not now" hides it until the next offer.
 */
export function StreakSaveCard() {
  const { summary, saveStreak, settings, updateSettings } = useProgress();
  const toast = useToast();
  const offer = summary.streakSave;
  const visible = Platform.OS !== 'web' && offer !== null && settings.streakSaveDismissed !== offer.day;

  const rewarded = useRef(false);
  const ad = useRewardedHint({
    unit: 'streakSave',
    enabled: visible,
    onReward: () => {
      if (!offer) return;
      rewarded.current = true;
      saveStreak(offer.day);
      playFeedback('complete');
      // The run, the saved day, and today if it's already played.
      const days = offer.streak + 1 + (summary.streak.todayDone ? 1 : 0);
      toast.show(`Streak saved! Your ${days}-day streak lives on`);
    },
    onClosed: () => {
      // "Closed" can arrive just before "reward earned", so give the reward a moment to land.
      setTimeout(() => {
        if (!rewarded.current) toast.show('Watch the ad to the end to save your streak');
      }, 500);
    },
  });

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
          label={ad.available ? 'Watch ad to save' : 'Loading ad…'}
          icon="smart-display"
          disabled={!ad.available}
          onPress={() => {
            rewarded.current = false;
            ad.show();
          }}
          accessibilityHint={`Plays a short video ad, then keeps your ${offer.streak}-day streak`}
        />
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
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: -4 },
});
