import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme/tokens';
import { AppText } from './AppText';
import { IconButton } from './IconButton';

type Props = {
  title: string;
  /** Content on the right (a chip, a button); the left always holds Back. */
  right?: ReactNode;
};

/** Opened straight from a deep link or reload there is nothing to go back to, so Back goes to the lobby. */
function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

/** Header for screens pushed over the lobby: round back button, bold title, optional right slot. */
export function ScreenHeader({ title, right }: Props) {
  return (
    <View style={styles.header}>
      <View style={styles.side}>
        <IconButton icon="arrow-back" label="Back" size={44} onPress={goBack} />
      </View>
      <AppText variant="headlineSm" accessibilityRole="header" numberOfLines={1} style={styles.title}>
        {title}
      </AppText>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md },
  // Equal flexible sides keep the title centred whatever sits on the right.
  side: { flex: 1, minWidth: 48, alignItems: 'flex-start' },
  right: { alignItems: 'flex-end' },
  title: { flexShrink: 1, textAlign: 'center' },
});
