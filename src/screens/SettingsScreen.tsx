import Constants from 'expo-constants';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { ChipGroup } from '@/components/ui/ChipGroup';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { APP_NAME, DELETE_ACCOUNT_URL, PRIVACY_URL, SUPPORT_EMAIL } from '@/config/app';
import { useAds } from '@/features/ads/AdsProvider';
import { haptic } from '@/features/feedback/haptics';
import { useProgress } from '@/features/progress/ProgressProvider';
import { requestReminderPermission } from '@/features/reminders/reminders';
import { formatReminderTime } from '@/features/reminders/schedule';
import { colors, radius, shadows, spacing } from '@/theme/tokens';

const TIMES = [
  { hour: 8, minute: 0 },
  { hour: 12, minute: 0 },
  { hour: 18, minute: 0 },
  { hour: 19, minute: 0 },
  { hour: 21, minute: 0 },
] as const;

const TIME_OPTIONS = TIMES.map((t) => ({ value: `${t.hour}:${t.minute}`, label: formatReminderTime(t.hour, t.minute) }));

function ToggleRow({ icon, label, detail, value, onChange }: { icon: IconName; label: string; detail: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      aria-checked={value}
      accessibilityLabel={label}
      accessibilityHint={detail}
      android_ripple={{ color: colors.primarySoft }}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.rowIcon}>
        <Icon name={icon} size={22} color={colors.primary} />
      </View>
      <View style={styles.flex}>
        <AppText variant="labelLg">{label}</AppText>
        <AppText variant="bodySm" color={colors.inkMuted}>
          {detail}
        </AppText>
      </View>
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

/** A row that opens a web page or email (outside the app). */
function LinkRow({ icon, label, detail, onPress }: { icon: IconName; label: string; detail: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={label}
      accessibilityHint={detail}
      android_ripple={{ color: colors.primarySoft }}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.rowIcon}>
        <Icon name={icon} size={22} color={colors.primary} />
      </View>
      <View style={styles.flex}>
        <AppText variant="labelLg">{label}</AppText>
        <AppText variant="bodySm" color={colors.inkMuted}>
          {detail}
        </AppText>
      </View>
      <Icon name="open-in-new" size={20} color={colors.inkSubtle} />
    </Pressable>
  );
}

export function SettingsScreen() {
  const toast = useToast();
  const { settings, updateSettings } = useProgress();
  const ads = useAds();
  const remindersSupported = Platform.OS !== 'web';

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
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="labelMd" color={colors.inkMuted} style={styles.section}>
          GAMEPLAY
        </AppText>
        <View style={styles.group}>
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
        </View>

        <AppText variant="labelMd" color={colors.inkMuted} style={styles.section}>
          DAILY REMINDER
        </AppText>
        <View style={styles.group}>
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
        </View>

        <AppText variant="labelMd" color={colors.inkMuted} style={styles.section}>
          ABOUT
        </AppText>
        <View style={styles.group}>
          <LinkRow icon="privacy-tip" label="Privacy policy" detail="What we store and why" onPress={() => openLink(PRIVACY_URL)} />
          {ads.privacyOptionsRequired && (
            <LinkRow
              icon="tune"
              label="Ad privacy choices"
              detail="Change how ads use your data"
              onPress={() => ads.showPrivacyOptions().catch(() => toast.show('Couldn’t open ad privacy choices'))}
            />
          )}
          <LinkRow icon="person-remove" label="Delete account" detail="Remove your account and data" onPress={() => openLink(DELETE_ACCOUNT_URL)} />
          <LinkRow
            icon="mail-outline"
            label="Contact support"
            detail={SUPPORT_EMAIL}
            onPress={() => openLink(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`${APP_NAME} support`)}`)}
          />
        </View>

        <AppText variant="bodySm" color={colors.inkMuted} style={styles.note}>
          {APP_NAME} {Constants.expoConfig?.version ?? ''} · Sound effects are coming in a later update.
        </AppText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.sm },
  section: { marginTop: spacing.md, marginLeft: 4, letterSpacing: 0.8 },
  group: { backgroundColor: colors.surface, borderRadius: radius.xl, overflow: 'hidden', boxShadow: shadows.card },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: spacing.md, minHeight: 64 },
  rowPressed: { backgroundColor: colors.surfaceLow },
  rowIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  times: { gap: 10, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  note: { marginTop: spacing.md, textAlign: 'center' },
});
