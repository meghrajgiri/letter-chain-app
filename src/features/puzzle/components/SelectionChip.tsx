import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { colors, radius, shadows } from '@/theme/tokens';

export type SelectionFeedback = { tone: 'found' | 'info'; text: string } | null;

type Props = {
  /** Letters currently under the finger. */
  selectionText: string;
  feedback: SelectionFeedback;
  hint: string;
};

/**
 * The pill above the grid: live selection while dragging, then a short
 * found / already-found confirmation. Fixed height so the grid never jumps.
 */
export const SelectionChip = memo(function SelectionChip({ selectionText, feedback, hint }: Props) {
  let content;
  if (selectionText) {
    content = (
      <View style={[styles.pill, styles.active]}>
        <AppText variant="headlineSm" color={colors.primaryInk} style={styles.letters}>
          {selectionText}
        </AppText>
        <View style={styles.pts}>
          <AppText variant="labelMd" color={colors.primaryInk}>
            {selectionText.length} letters
          </AppText>
        </View>
      </View>
    );
  } else if (feedback) {
    const found = feedback.tone === 'found';
    content = (
      <View style={[styles.pill, found ? styles.found : styles.info]}>
        <Icon name={found ? 'check-circle' : 'info-outline'} size={20} color={found ? colors.greenInk : colors.inkMuted} />
        <AppText variant="labelLg" color={found ? colors.greenInk : colors.inkMuted} numberOfLines={1} style={styles.feedbackText}>
          {feedback.text}
        </AppText>
      </View>
    );
  } else {
    content = (
      <AppText variant="bodySm" color={colors.inkMuted}>
        {hint}
      </AppText>
    );
  }
  return (
    <View style={styles.slot} accessibilityLiveRegion="polite">
      {content}
    </View>
  );
});

const styles = StyleSheet.create({
  slot: { height: 48, alignItems: 'center', justifyContent: 'center' },
  pill: {
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    height: 44,
    borderRadius: radius.pill,
  },
  active: { backgroundColor: colors.primary, boxShadow: shadows.primaryGlow },
  found: { backgroundColor: colors.greenSoft, boxShadow: shadows.greenGlow },
  info: { backgroundColor: colors.surfaceMuted },
  letters: { letterSpacing: 2.5 },
  feedbackText: { flexShrink: 1 },
  pts: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 2 },
});
