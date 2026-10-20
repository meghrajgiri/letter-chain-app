import { memo } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { Pop } from '@/components/ui/Pop';
import { LIP, colors, radius, shadows, spacing, wordColors } from '@/theme/tokens';
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
        <AppText variant="headlineSm" accessibilityRole="header" style={styles.title} numberOfLines={1}>
          {remaining === 0 ? 'Grid complete!' : `Hidden ${themeName} words`}
        </AppText>
        <View style={[styles.counter, remaining === 0 && styles.counterDone]}>
          <AppText variant="labelBadge" color={remaining === 0 ? colors.greenInk : colors.primaryDark}>
            {found.length} / {words.length}
          </AppText>
        </View>
      </View>
      <View style={styles.list}>
        {words.map((word) => {
          const f = foundByWord.get(word);
          const isHinted = !f && hinted.includes(word);
          const c = f ? wordColors[f.colorIndex % wordColors.length] : null;
          return (
            <Pop key={word} trigger={f ? 'found' : isHinted ? 'hinted' : 'hidden'} skipInitial>
              {c ? (
                <View style={[styles.chip, { minWidth: chainChipWidth(word.length), backgroundColor: c.bg, borderBottomColor: c.lip }]} accessibilityLabel={`${word}, found`}>
                  <Icon name="check" size={14} color={c.ink} />
                  <AppText variant="labelMd" color={c.ink}>
                    {word}
                  </AppText>
                </View>
              ) : isHinted ? (
                <View style={[styles.chip, styles.hinted, { minWidth: chainChipWidth(word.length) }]} accessibilityLabel={`${word}, revealed by hint`}>
                  <Icon name="lightbulb-outline" size={14} color={colors.yellowInk} />
                  <AppText variant="labelMd" color={colors.yellowInk}>
                    {word}
                  </AppText>
                </View>
              ) : (
                <View style={[styles.chip, styles.hidden, { minWidth: chainChipWidth(word.length) }]} accessibilityLabel={`Hidden word, ${word.length} letters`}>
                  <View style={styles.boxes}>
                    {Array.from({ length: word.length }, (_, i) => (
                      <View key={i} style={styles.box} />
                    ))}
                  </View>
                  <AppText variant="labelMd" color={colors.primaryDark}>
                    {word.length}
                  </AppText>
                </View>
              )}
            </Pop>
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
    borderBottomWidth: LIP.md,
    borderBottomColor: colors.lip,
    paddingHorizontal: spacing.md,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 10,
    boxShadow: shadows.card,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  title: { fontSize: 18, lineHeight: 24, flexShrink: 1 },
  counter: { backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  counterDone: { backgroundColor: colors.greenSoft },
  list: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 32, paddingHorizontal: 8, borderRadius: radius.pill, borderBottomWidth: LIP.sm },
  hidden: { backgroundColor: colors.primarySoft, borderBottomColor: colors.lipSoft },
  hinted: { backgroundColor: colors.yellowSoft, borderBottomColor: colors.yellow },
  boxes: { flexDirection: 'row', gap: 3 },
  box: { width: 8, height: 8, borderRadius: 2, backgroundColor: '#B4A9F5' },
});
