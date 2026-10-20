import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { colors, radius } from '@/theme/tokens';

/** Covers the board while paused so the grid can't be studied with the clock stopped. */
export function PausedOverlay({ onResume }: { onResume: () => void }) {
  return (
    <View style={styles.overlay} accessibilityViewIsModal>
      <View style={styles.icon}>
        <Icon name="pause" size={30} color={colors.primary} />
      </View>
      <AppText variant="headlineMd">Paused</AppText>
      <AppText variant="bodySm" color={colors.inkMuted}>
        The timer is stopped.
      </AppText>
      <Button label="Resume" icon="play-arrow" onPress={onResume} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.surface,
    borderRadius: radius.xxl - 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  button: { marginTop: 12, minWidth: 160 },
});
