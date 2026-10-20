import { memo } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { Pop } from '@/components/ui/Pop';
import { LIP, colors, radius, shadows, spacing, wordColors } from '@/theme/tokens';
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
 * "Find these words" card. Always shows every word (never clipped). Found words
 * pop into their grid colour, get a check and are struck through.
 */
export const WordList = memo(function WordList({ words, found, hinted = [], onLayout }: Props) {
  const foundByWord = new Map(found.map((f) => [f.word, f]));
  const remaining = words.length - found.length;
  const compact = words.length > COMPACT_AFTER;
  return (
    <View style={styles.card} onLayout={onLayout}>
      <View style={styles.header}>
        <AppText variant="headlineSm" accessibilityRole="header" style={styles.title}>
          {remaining === 0 ? 'All found!' : 'Find these words'}
        </AppText>
        <View style={[styles.counter, remaining === 0 && styles.counterDone]}>
          <AppText variant="labelBadge" color={remaining === 0 ? colors.greenInk : colors.primaryDark}>
            {found.length} / {words.length}
          </AppText>
        </View>
      </View>
      <View style={[styles.list, compact && styles.listCompact]}>
        {words.map((word) => {
          const f = foundByWord.get(word);
          const c = f ? wordColors[f.colorIndex % wordColors.length] : null;
          const isHinted = !f && hinted.includes(word);
          return (
            <Pop key={word} trigger={f ? 'found' : isHinted ? 'hinted' : 'todo'} skipInitial>
              <View
                style={[
                  styles.chip,
                  compact && styles.chipCompact,
                  c ? { backgroundColor: c.bg, borderBottomColor: c.lip } : isHinted ? styles.chipHinted : styles.chipTodo,
                ]}
                accessibilityLabel={`${word}${f ? (f.revealed ? ', revealed' : ', found') : isHinted ? ', hinted' : ''}`}
              >
                {/* Fixed-size slot: the check and the dot take the same width, so finding a word never reflows the list. */}
                <View style={styles.lead}>
                  {c ? (
                    <Icon name={f?.revealed ? 'visibility' : 'check'} size={14} color={c.ink} />
                  ) : isHinted ? (
                    <Icon name="lightbulb-outline" size={14} color={colors.yellowInk} />
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
    paddingBottom: 6,
    gap: 10,
    boxShadow: shadows.card,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  title: { fontSize: 18, lineHeight: 24, flexShrink: 1 },
  counter: { backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  counterDone: { backgroundColor: colors.greenSoft },
  list: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 8 },
  listCompact: { gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    minHeight: 36,
    borderRadius: radius.pill,
    borderBottomWidth: LIP.sm,
  },
  chipCompact: { minHeight: 30, paddingHorizontal: 9, gap: 3 },
  chipTodo: { backgroundColor: colors.primarySoft, borderBottomColor: colors.lipSoft },
  chipHinted: { backgroundColor: colors.yellowSoft, borderBottomColor: colors.yellow },
  // Barely wider than the 7px dot, so chips stay compact while still fitting the check.
  lead: { width: 14, height: 14, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary },
  struck: { textDecorationLine: 'line-through', opacity: 0.85 },
});
