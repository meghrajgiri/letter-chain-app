import { router, type ErrorBoundaryProps } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { reportError } from '@/lib/sentry';
import { colors, radius, spacing } from '@/theme/tokens';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';

/**
 * Shown when a screen throws (e.g. a puzzle that can't be generated).
 * Uses plain Text so it still renders if fonts or providers failed.
 */
export function ErrorScreen({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => reportError(error), [error]);
  return (
    <View style={styles.screen} accessibilityRole="alert">
      <View style={styles.icon}>
        <Icon name="extension-off" size={34} color={colors.primary} />
      </View>
      <Text style={styles.title}>This puzzle didn’t load</Text>
      <Text style={styles.body}>Something went wrong setting it up. Try again, or pick another puzzle.</Text>
      <View style={styles.actions}>
        <Button label="Try again" icon="refresh" onPress={retry} />
        <Button label="Go home" variant="secondary" onPress={() => router.replace('/')} />
      </View>
      {__DEV__ ? <Text style={styles.detail}>{error.message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: 12, backgroundColor: colors.background },
  icon: { width: 72, height: 72, borderRadius: radius.xl, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  title: { fontSize: 22, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  body: { fontSize: 16, lineHeight: 24, color: colors.inkMuted, textAlign: 'center' },
  actions: { alignSelf: 'stretch', gap: 10, marginTop: 8 },
  detail: { fontSize: 12, color: colors.inkMuted, textAlign: 'center', marginTop: 8 },
});
