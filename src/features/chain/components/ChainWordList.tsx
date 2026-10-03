import { memo } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { colors, radius, shadows, spacing, wordColors } from '@/theme/tokens';
import type { FoundChainWord } from '../hooks/useChainPuzzle';

type Props = {
  words: readonly string[];
  found: readonly FoundChainWord[];
  hinted: readonly string[];
  themeName: string;
  onLayout?: (e: LayoutChangeEvent) => void;
};

/**
 * Chip width depends only on the word's length, so a chip keeps its size when
 * it changes from hidden (boxes) to found (text) and the list never reflows.
 */
export function chainChipWidth(length: number): number {
  return Math.round(34 + length * 11);
}

/**
 * Hidden-word list: each word shows only its letter count until found (or
 * revealed by a hint). The theme is the clue.
 */
export const ChainWordList = memo(function ChainWordList({ words, found, hinted, themeName, onLayout }: Props) {
  const foundByWord = new Map(found.map((f) => [f.word, f]));
  const remaining = words.length - found.length;
  return (
    <View style={styles.card} onLayout={onLayout}>
      <View style={styles.header}>
        <AppText variant="labelMd" color={colors.inkMuted} style={styles.title} accessibilityRole="header">
          Hidden words ({found.length}/{words.length})
        </AppText>
        <AppText variant="labelMd" color={colors.primary}>
          {remaining === 0 ? 'Grid complete!' : `${remaining} Remaining`}
        </AppText>
      </View>
      <View style={styles.list}>
        {words.map((word) => {
          const f = foundByWord.get(word);
          if (f) {
            const c = wordColors[f.colorIndex % wordColors.length];
            return (
              <View key={word} style={[styles.chip, { width: chainChipWidth(word.length), backgroundColor: c.bg }]} accessibilityLabel={`${word}, found`}>
                <Icon name="check" size={14} color={c.ink} />
                <AppText variant="labelMd" color={c.ink}>
                  {word}
                </AppText>
              </View>
            );
          }
          if (hinted.includes(word)) {
            return (
              <View key={word} style={[styles.chip, styles.hinted, { width: chainChipWidth(word.length) }]} accessibilityLabel={`${word}, revealed by hint`}>
                <Icon name="lightbulb-outline" size={14} color={colors.yellowInk} />
                <AppText variant="labelMd" color={colors.yellowInk}>
                  {word}
                </AppText>
              </View>
            );
          }
          return (
            <View key={word} style={[styles.chip, styles.hidden, { width: chainChipWidth(word.length) }]} accessibilityLabel={`Hidden word, ${word.length} letters`}>
              <View style={styles.boxes}>
                {Array.from({ length: word.length }, (_, i) => (
                  <View key={i} style={styles.box} />
                ))}
              </View>
              <AppText variant="labelMd" color={colors.primary}>
                {word.length}
              </AppText>
            </View>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: 14,
    paddingBottom: 14,
    gap: 10,
    boxShadow: shadows.card,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  title: { textTransform: 'uppercase', letterSpacing: 0.8, flexShrink: 1 },
  list: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 30, paddingHorizontal: 8, borderRadius: radius.pill },
  hidden: { backgroundColor: colors.primarySoft },
  hinted: { backgroundColor: colors.yellowSoft, borderWidth: 1, borderColor: colors.yellow },
  boxes: { flexDirection: 'row', gap: 3 },
  box: { width: 8, height: 8, borderRadius: 2, backgroundColor: '#B4A9F5' },
});
