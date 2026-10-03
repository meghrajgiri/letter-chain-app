import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { TAB_BAR_SPACE } from '@/components/ui/FloatingTabBar';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { useAccount } from '@/features/account/AccountProvider';
import { useProgress } from '@/features/progress/ProgressProvider';
import { confirmAction } from '@/lib/confirm';
import { colors, radius, shadows, spacing } from '@/theme/tokens';

function Row({ icon, label, detail, onPress, danger }: { icon: IconName; label: string; detail?: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
        <Icon name={icon} size={22} color={danger ? colors.fail : colors.primary} />
      </View>
      <View style={styles.flex}>
        <AppText variant="labelLg" color={danger ? colors.fail : colors.ink}>
          {label}
        </AppText>
        {detail ? (
          <AppText variant="bodySm" color={colors.inkMuted}>
            {detail}
          </AppText>
        ) : null}
      </View>
      <Icon name="chevron-right" size={22} color={colors.inkSubtle} />
    </Pressable>
  );
}

function syncLabel(state: 'idle' | 'syncing' | 'error', lastSyncedAt: string | null): string {
  if (state === 'syncing') return 'Syncing…';
  if (state === 'error') return 'Couldn’t sync — tap to retry';
  if (!lastSyncedAt) return 'Waiting to sync';
  const minutes = Math.round((Date.now() - new Date(lastSyncedAt).getTime()) / 60000);
  return minutes < 1 ? 'Synced just now' : `Synced ${minutes} min ago`;
}

/** Profile: guest or Google account, sync status, settings, and the developer Studio link. */
export function ProfileScreen() {
  const toast = useToast();
  const { summary } = useProgress();
  const account = useAccount();
  const [busy, setBusy] = useState(false);
  const user = account.user;

  const run = async (task: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await task();
    } catch (error) {
      toast.show(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const signIn = () =>
    run(async () => {
      if (await account.signInWithGoogle()) toast.show('Signed in — your progress is saved');
    });

  const signOut = async () => {
    const ok = await confirmAction('Sign out?', 'Your progress stays in your account. This device will start fresh as a guest.', 'Sign out');
    if (ok) run(() => account.signOut());
  };

  const deleteAccount = async () => {
    const ok = await confirmAction(
      'Delete your account?',
      'This permanently deletes your account and all synced progress (streaks, XP, badges, history). This can’t be undone.',
      'Delete',
      true,
    );
    if (ok)
      run(async () => {
        await account.deleteAccount();
        toast.show('Your account has been deleted');
      });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Avatar size={96} uri={user?.avatarUrl} />
          <AppText variant="headlineMd">{user?.name ?? (user ? 'Player' : 'Guest')}</AppText>
          {user?.email ? (
            <AppText variant="bodySm" color={colors.inkMuted}>
              {user.email}
            </AppText>
          ) : null}
          <View style={styles.levelPill}>
            <Icon name="stars" size={16} color={colors.primary} />
            <AppText variant="labelMd" color={colors.primary}>
              LEVEL {summary.level.level} · {summary.xp.toLocaleString('en-US')} XP
            </AppText>
          </View>
        </View>

        {account.status === 'guest' && (
          <View style={styles.signInCard}>
            <AppText variant="headlineSm">Save your progress</AppText>
            <AppText variant="bodySm" color={colors.inkMuted}>
              You’re playing as a guest. Sign in with Google to keep your streak, XP and badges safe and play on any device.
            </AppText>
            <Button label={busy ? 'Signing in…' : 'Sign in with Google'} icon="login" disabled={busy} onPress={signIn} />
          </View>
        )}

        {user && (
          <View style={styles.group}>
            <Row
              icon={account.syncState === 'error' ? 'sync-problem' : 'cloud-done'}
              label="Progress sync"
              detail={syncLabel(account.syncState, account.lastSyncedAt)}
              onPress={() => account.syncNow()}
            />
          </View>
        )}

        <View style={styles.group}>
          <Row icon="notifications-none" label="Reminders" detail="Daily puzzle notifications" onPress={() => router.push('/settings')} />
          <Row icon="tune" label="Settings" detail="Haptics and reminders" onPress={() => router.push('/settings')} />
        </View>

        {user && (
          <View style={styles.group}>
            <Row icon="logout" label="Sign out" onPress={signOut} />
            <Row icon="delete-outline" label="Delete account" detail="Permanently remove your account and data" onPress={deleteAccount} danger />
          </View>
        )}

        <AppText variant="labelMd" color={colors.inkMuted} style={styles.sectionLabel}>
          DEVELOPER
        </AppText>
        <View style={styles.group}>
          <Row icon="science" label="Puzzle Studio" detail="Generate, inspect and batch-test puzzles" onPress={() => router.push('/studio')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: TAB_BAR_SPACE, gap: spacing.md },
  hero: { alignItems: 'center', gap: 6, paddingVertical: spacing.lg },
  levelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 4,
  },
  signInCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.md, gap: 10, boxShadow: shadows.card },
  group: { backgroundColor: colors.surface, borderRadius: radius.xl, overflow: 'hidden', boxShadow: shadows.card },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  pressed: { backgroundColor: colors.surfaceLow },
  rowIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  rowIconDanger: { backgroundColor: '#FFE4E4' },
  flex: { flex: 1 },
  sectionLabel: { marginTop: spacing.sm, marginLeft: 4, letterSpacing: 0.8 },
});
