import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { Pop } from '@/components/ui/Pop';
import { LIP, colors, radius, shadows } from '@/theme/tokens';

export type SelectionFeedback = { tone: 'found' | 'info'; text: string } | null;

type Props = {
  /** Letters currently under the finger. */
  selectionText: string;
  feedback: SelectionFeedback;
  hint: string;
  /**
   * 'hint' pins the prompt in yellow with a bulb: used for an active hint,
   * which stays until its word is found instead of fading like feedback.
   */
  hintTone?: 'idle' | 'hint';
};

/**
 * The full-width strip above the board: the letters being selected (clear of
 * the finger, which covers them on the board), then a short found / miss
 * confirmation, otherwise a gentle prompt. Fixed height so the board never jumps.
 */
export const SelectionChip = memo(function SelectionChip({ selectionText, feedback, hint, hintTone = 'idle' }: Props) {
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
      <Pop trigger={feedback.text}>
        <View style={[styles.pill, found ? styles.found : styles.info]}>
          <Icon name={found ? 'check-circle' : 'info-outline'} size={20} color={found ? colors.greenInk : colors.inkMuted} />
          <AppText variant="labelLg" color={found ? colors.greenInk : colors.inkMuted} numberOfLines={1} style={styles.feedbackText}>
            {feedback.text}
          </AppText>
        </View>
      </Pop>
    );
  } else if (hint.trim() && hintTone === 'hint') {
    content = (
      <Pop trigger={hint}>
        <View style={[styles.pill, styles.pinned]}>
          <Icon name="lightbulb" size={20} color={colors.yellowInk} />
          <AppText variant="labelLg" color={colors.yellowInk} numberOfLines={1} style={styles.feedbackText}>
            {hint}
          </AppText>
        </View>
      </Pop>
    );
  } else if (hint.trim()) {
    content = (
      <View style={[styles.pill, styles.idle]}>
        <AppText variant="bodySm" color={colors.inkMuted} numberOfLines={1} style={styles.feedbackText}>
          {hint}
        </AppText>
      </View>
    );
  }
  return (
    <View style={styles.slot} accessibilityLiveRegion="polite">
      {content}
    </View>
  );
});

const styles = StyleSheet.create({
  slot: { height: 52, justifyContent: 'center' },
  pill: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 18,
    height: 52,
    borderRadius: radius.xl,
  },
  idle: { backgroundColor: colors.surface, borderBottomWidth: LIP.sm, borderBottomColor: colors.lip },
  active: { backgroundColor: colors.primary, boxShadow: shadows.primaryGlow, borderBottomWidth: LIP.sm, borderBottomColor: colors.primaryDark },
  found: { backgroundColor: colors.greenSoft, boxShadow: shadows.greenGlow, borderBottomWidth: LIP.sm, borderBottomColor: colors.green },
  info: { backgroundColor: colors.surfaceMuted },
  pinned: { backgroundColor: colors.yellowSoft, borderBottomWidth: LIP.sm, borderBottomColor: colors.yellow },
  letters: { letterSpacing: 2.5 },
  feedbackText: { flexShrink: 1 },
  pts: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 2 },
});
