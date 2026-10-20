import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ChipGroup } from '@/components/ui/ChipGroup';
import { Icon, type IconName } from '@/components/ui/Icon';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useToast } from '@/components/ui/Toast';
import { APP_NAME, DELETE_ACCOUNT_URL, PRIVACY_URL, SUPPORT_EMAIL } from '@/config/app';
import { useAccount } from '@/features/account/AccountProvider';
import { useAds } from '@/features/ads/AdsProvider';
import { haptic } from '@/features/feedback/haptics';
import { playSound } from '@/features/feedback/sounds';
import { useProgress } from '@/features/progress/ProgressProvider';
import { requestReminderPermission } from '@/features/reminders/reminders';
import { formatReminderTime } from '@/features/reminders/schedule';
import { confirmAction } from '@/lib/confirm';
import { LIP, colors, radius, shadows, spacing } from '@/theme/tokens';

const TIMES = [
  { hour: 8, minute: 0 },
  { hour: 12, minute: 0 },
  { hour: 18, minute: 0 },
  { hour: 19, minute: 0 },
  { hour: 21, minute: 0 },
] as const;

const TIME_OPTIONS = TIMES.map((t) => ({ value: `${t.hour}:${t.minute}`, label: formatReminderTime(t.hour, t.minute) }));

function RowIcon({ icon, danger }: { icon: IconName; danger?: boolean }) {
  return (
    <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
      <Icon name={icon} size={22} color={danger ? colors.fail : colors.primary} />
    </View>
  );
}

function RowText({ label, detail, danger }: { label: string; detail?: string; danger?: boolean }) {
  return (
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
  );
}

/** A row that does something inside the app. */
function Row({ icon, label, detail, onPress, danger }: { icon: IconName; label: string; detail?: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <RowIcon icon={icon} danger={danger} />
      <RowText label={label} detail={detail} danger={danger} />
      <Icon name="chevron-right" size={22} color={colors.inkSubtle} />
    </Pressable>
  );
}

/** A row that opens a web page or email (outside the app). */
function LinkRow({ icon, label, detail, onPress }: { icon: IconName; label: string; detail: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="link" accessibilityLabel={label} accessibilityHint={detail} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <RowIcon icon={icon} />
      <RowText label={label} detail={detail} />
      <Icon name="open-in-new" size={20} color={colors.inkSubtle} />
    </Pressable>
  );
}

function ToggleRow({ icon, label, detail, value, onChange }: { icon: IconName; label: string; detail: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      aria-checked={value}
      accessibilityLabel={label}
      accessibilityHint={detail}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <RowIcon icon={icon} />
      <RowText label={label} detail={detail} />
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.green, false: colors.border }}
        thumbColor={colors.surface}
        // The whole row is the control for screen readers.
        accessible={false}
        importantForAccessibility="no-hide-descendants"
      />
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="headlineSm" style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </AppText>
      <View style={styles.group}>{children}</View>
    </View>
  );
}

function syncLabel(state: 'idle' | 'syncing' | 'error', lastSyncedAt: string | null): string {
  if (state === 'syncing') return 'Syncing…';
  if (state === 'error') return 'Couldn’t sync — tap to retry';
  if (!lastSyncedAt) return 'Waiting to sync';
  const minutes = Math.round((Date.now() - new Date(lastSyncedAt).getTime()) / 60000);
  return minutes < 1 ? 'Synced just now' : `Synced ${minutes} min ago`;
}

/**
 * Profile and settings in one place, reached from the gear on the lobby:
 * account (guest or Google), sync, gameplay options, reminders, about, and the developer Studio link.
 */
export function ProfileScreen() {
  const toast = useToast();
  const { summary, settings, updateSettings } = useProgress();
  const account = useAccount();
  const ads = useAds();
  const [busy, setBusy] = useState(false);
  const user = account.user;
  const remindersSupported = Platform.OS !== 'web';

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

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => toast.show(url.startsWith('mailto:') ? `No email app found. Write to ${SUPPORT_EMAIL}` : 'Couldn’t open the link'));
  };

  const toggleReminder = async (on: boolean) => {
    if (!on) {
      updateSettings({ reminderEnabled: false });
      return;
    }
    const granted = await requestReminderPermission();
    if (!granted) {
      toast.show('Allow notifications in system settings to get reminders');
      return;
    }
    updateSettings({ reminderEnabled: true });
    toast.show(`Reminder set for ${formatReminderTime(settings.reminderHour, settings.reminderMinute)}`);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScreenHeader title="Profile" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.avatarRing}>
            <Avatar size={92} uri={user?.avatarUrl} />
          </View>
          <AppText variant="headlineMd">{user?.name ?? (user ? 'Player' : 'Guest')}</AppText>
          {user?.email ? (
            <AppText variant="bodySm" color={colors.inkMuted}>
              {user.email}
            </AppText>
          ) : null}
          <View style={styles.levelRow}>
            {(['classic', 'chain'] as const).map((m) => (
              <View key={m} style={[styles.levelPill, m === 'chain' && styles.levelPillChain]}>
                <Icon name={m === 'chain' ? 'gesture' : 'grid-on'} size={16} color={m === 'chain' ? colors.yellowInk : colors.primaryDark} />
                <AppText variant="labelBadge" color={colors.ink}>
                  {m === 'chain' ? 'Chain' : 'Classic'} Lv {summary.levels[m].level}
                </AppText>
              </View>
            ))}
            <View style={styles.levelPillMuted}>
              <AppText variant="labelBadge" color={colors.inkMuted}>
                {summary.xp.toLocaleString('en-US')} XP
              </AppText>
            </View>
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
          <Section title="Account">
            <Row
              icon={account.syncState === 'error' ? 'sync-problem' : 'cloud-done'}
              label="Progress sync"
              detail={syncLabel(account.syncState, account.lastSyncedAt)}
              onPress={() => account.syncNow()}
            />
            <Row icon="logout" label="Sign out" onPress={signOut} />
            <Row icon="delete-outline" label="Delete account" detail="Permanently remove your account and data" onPress={deleteAccount} danger />
          </Section>
        )}

        <Section title="Gameplay">
          <ToggleRow
            icon="volume-up"
            label="Sound effects"
            detail="Chimes when you find words and finish puzzles"
            value={settings.sound}
            onChange={(v) => {
              updateSettings({ sound: v });
              if (v) playSound('found');
            }}
          />
          <ToggleRow
            icon="music-note"
            label="Music"
            detail="Calm background music while you play"
            value={settings.music}
            onChange={(v) => updateSettings({ music: v })}
          />
          <ToggleRow
            icon="vibration"
            label="Haptics"
            detail="Vibrate when you find a word"
            value={settings.haptics}
            onChange={(v) => {
              updateSettings({ haptics: v });
              if (v) haptic('found');
            }}
          />
        </Section>

        <Section title="Daily reminder">
          <ToggleRow
            icon="notifications-none"
            label="Remind me to play"
            detail={remindersSupported ? 'Skipped on days you’ve already played' : 'Available in the mobile app'}
            value={settings.reminderEnabled}
            onChange={remindersSupported ? toggleReminder : () => toast.show('Reminders are available in the mobile app')}
          />
          {settings.reminderEnabled && (
            <View style={styles.times}>
              <AppText variant="bodySm" color={colors.inkMuted}>
                Reminder time
              </AppText>
              <ChipGroup
                options={TIME_OPTIONS}
                value={`${settings.reminderHour}:${settings.reminderMinute}`}
                onChange={(v) => {
                  const [hour, minute] = v.split(':').map(Number);
                  updateSettings({ reminderHour: hour, reminderMinute: minute });
                }}
                accessibilityLabel="Reminder time"
              />
            </View>
          )}
        </Section>

        <Section title="About">
          <LinkRow icon="privacy-tip" label="Privacy policy" detail="What we store and why" onPress={() => openLink(PRIVACY_URL)} />
          {ads.privacyOptionsRequired && (
            <LinkRow
              icon="tune"
              label="Ad privacy choices"
              detail="Change how ads use your data"
              onPress={() => ads.showPrivacyOptions().catch(() => toast.show('Couldn’t open ad privacy choices'))}
            />
          )}
          {!user && <LinkRow icon="person-remove" label="Delete account" detail="Remove your account and data" onPress={() => openLink(DELETE_ACCOUNT_URL)} />}
          <LinkRow
            icon="mail-outline"
            label="Contact support"
            detail={SUPPORT_EMAIL}
            onPress={() => openLink(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`${APP_NAME} support`)}`)}
          />
        </Section>

        {/* Developer tools: development builds only, never in the store version. */}
        {__DEV__ && (
          <Section title="Developer">
            <Row icon="science" label="Puzzle Studio" detail="Generate, inspect and batch-test puzzles" onPress={() => router.push('/studio')} />
          </Section>
        )}

        <AppText variant="bodySm" color={colors.inkMuted} style={styles.note}>
          {APP_NAME} {Constants.expoConfig?.version ?? ''}
        </AppText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingTop: 4, paddingBottom: spacing.xxl, gap: spacing.md },
  hero: { alignItems: 'center', gap: 6, paddingVertical: spacing.md },
  avatarRing: { borderRadius: 999, padding: 4, backgroundColor: colors.surface, borderBottomWidth: LIP.md, borderBottomColor: colors.lip, boxShadow: shadows.card, marginBottom: 4 },
  levelRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 4 },
  levelPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  levelPillChain: { backgroundColor: colors.yellowSoft },
  levelPillMuted: { backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  signInCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.md, gap: 10, boxShadow: shadows.card, borderBottomWidth: LIP.md, borderBottomColor: colors.lip },
  section: { gap: 8 },
  sectionTitle: { fontSize: 17, lineHeight: 22, marginLeft: 4 },
  group: { backgroundColor: colors.surface, borderRadius: radius.xl, overflow: 'hidden', boxShadow: shadows.card, borderBottomWidth: LIP.md, borderBottomColor: colors.lip },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: spacing.md, minHeight: 64, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowPressed: { backgroundColor: colors.surfaceLow },
  rowIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  rowIconDanger: { backgroundColor: '#FFE4E4' },
  flex: { flex: 1 },
  times: { gap: 10, paddingHorizontal: spacing.md, paddingBottom: spacing.md, paddingTop: 4 },
  note: { marginTop: spacing.sm, textAlign: 'center' },
});
