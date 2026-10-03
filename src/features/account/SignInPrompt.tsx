import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { colors, radius, shadows, spacing } from '@/theme/tokens';
import type { CompletionSummary } from '../progress';
import { useProgress } from '../progress/ProgressProvider';
import { useAccount } from './AccountProvider';
import { shouldPromptSignIn, SNOOZE_PUZZLES } from './promptRules';

/** "Save your progress" card shown to guests on the completion screen. */
export function SignInPrompt({ completion }: { completion: CompletionSummary | null }) {
  const account = useAccount();
  const { settings, updateSettings } = useProgress();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  if (account.status !== 'guest' || !completion || !shouldPromptSignIn(completion, settings.signInSnoozeUntil)) return null;

  const signIn = async () => {
    setBusy(true);
    try {
      if (await account.signInWithGoogle()) toast.show('Signed in — your progress is saved');
    } catch (error) {
      toast.show(error instanceof Error ? error.message : 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.icon}>
          <Icon name="cloud-upload" size={24} color={colors.primary} />
        </View>
        <View style={styles.flex}>
          <AppText variant="headlineSm">Save your progress</AppText>
          <AppText variant="bodySm" color={colors.inkMuted}>
            {completion.streak.current >= 3
              ? `Don’t lose your ${completion.streak.current}-day streak. Sign in to keep it on any device.`
              : 'Sign in with Google to keep your streak, XP and badges, and play on any device.'}
          </AppText>
        </View>
      </View>
      <View style={styles.actions}>
        <Button label={busy ? 'Signing in…' : 'Sign in with Google'} icon="login" disabled={busy} onPress={signIn} style={styles.flex} />
        <Pressable
          onPress={() => updateSettings({ signInSnoozeUntil: completion.puzzlesSolved + SNOOZE_PUZZLES })}
          accessibilityRole="button"
          hitSlop={8}
          style={styles.later}
        >
          <AppText variant="labelLg" color={colors.inkMuted}>
            Not now
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.md,
    gap: 14,
    borderWidth: 1.5,
    borderColor: colors.primarySoft,
    boxShadow: shadows.card,
  },
  top: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  icon: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, gap: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  later: { paddingHorizontal: 8, paddingVertical: 10 },
});
