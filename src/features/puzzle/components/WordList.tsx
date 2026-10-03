import { memo } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { colors, radius, shadows, spacing, wordColors } from '@/theme/tokens';
import type { FoundWord } from '../hooks/usePuzzle';

type Props = {
  words: readonly string[];
  found: readonly FoundWord[];
  /** Words pointed out by a hint (shown in yellow until found). */
  hinted?: readonly string[];
  onLayout?: (e: LayoutChangeEvent) => void;
};

/** Above this many words, chips get smaller so the whole list stays visible. */
const COMPACT_AFTER = 10;

/**
 * "Words to find" card. Always shows every word (never clipped). Found words
 * take their grid colour, get a check and are struck through.
 */
export const WordList = memo(function WordList({ words, found, hinted = [], onLayout }: Props) {
  const foundByWord = new Map(found.map((f) => [f.word, f]));
  const remaining = words.length - found.length;
  const compact = words.length > COMPACT_AFTER;
  return (
    <View style={styles.card} onLayout={onLayout}>
      <View style={styles.header}>
        <AppText variant="labelMd" color={colors.inkMuted} style={styles.title} accessibilityRole="header">
          Words to find ({found.length}/{words.length})
        </AppText>
        <AppText variant="labelMd" color={colors.ink}>
          {remaining === 0 ? 'All found!' : `${remaining} Remaining`}
        </AppText>
      </View>
      <View style={[styles.list, compact && styles.listCompact]}>
        {words.map((word) => {
          const f = foundByWord.get(word);
          const c = f ? wordColors[f.colorIndex % wordColors.length] : null;
          const isHinted = !f && hinted.includes(word);
          return (
            <View
              key={word}
              style={[styles.chip, compact && styles.chipCompact, c ? { backgroundColor: c.bg } : isHinted ? styles.chipHinted : styles.chipTodo]}
              accessibilityLabel={`${word}${f ? (f.revealed ? ', revealed' : ', found') : isHinted ? ', hinted' : ''}`}
            >
              {/* Fixed-size slot: the check and the dot take the same width, so finding a word never reflows the list. */}
              <View style={[styles.lead, compact && styles.leadCompact]}>
                {c ? (
                  <Icon name={f?.revealed ? 'visibility' : 'check'} size={13} color={c.ink} />
                ) : isHinted ? (
                  <Icon name="lightbulb-outline" size={13} color={colors.yellowInk} />
                ) : (
                  <View style={styles.dot} />
                )}
              </View>
              <AppText
                variant={compact ? 'labelMd' : 'labelLg'}
                color={c ? c.ink : isHinted ? colors.yellowInk : colors.primaryDark}
                style={c ? styles.struck : undefined}
                maxFontSizeMultiplier={1.2}
              >
                {word}
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
    paddingBottom: 6,
    gap: 10,
    boxShadow: shadows.card,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { textTransform: 'uppercase', letterSpacing: 0.8 },
  list: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 8 },
  listCompact: { gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    minHeight: 34,
    borderRadius: radius.pill,
  },
  chipCompact: { minHeight: 28, paddingHorizontal: 9, gap: 3 },
  chipTodo: { backgroundColor: colors.primarySoft },
  chipHinted: { backgroundColor: colors.yellowSoft },
  // Barely wider than the 7px dot, so chips stay compact while still fitting the check.
  lead: { width: 12, height: 14, alignItems: 'center', justifyContent: 'center' },
  leadCompact: { width: 12 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary },
  struck: { textDecorationLine: 'line-through', opacity: 0.85 },
});
