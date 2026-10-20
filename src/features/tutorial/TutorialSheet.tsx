import { useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { colors, radius, shadows, spacing } from '@/theme/tokens';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { ChainGrid } from '../chain/components/ChainGrid';
import type { FoundChainWord } from '../chain/hooks/useChainPuzzle';
import { TileGrid } from '../puzzle/components/TileGrid';
import type { Cell } from '../puzzle/engine/types';
import { getTileLayout } from '../puzzle/game/tileLayout';
import type { FoundWord } from '../puzzle/hooks/usePuzzle';
import type { Selection } from '../puzzle/hooks/usePuzzleSelection';

export type TutorialMode = 'classic' | 'chain';

type Step = { title: string; body: string; art: ReactNode };

const c = (row: number, col: number): Cell => ({ row, col });

/** Step artwork drawn with the real Classic board (marker strokes, line guidance, hint rings). */
function ClassicArt({ rows, found = [], selection = null, hints = [] }: { rows: string[]; found?: FoundWord[]; selection?: Selection | null; hints?: Cell[] }) {
  return (
    <View style={styles.art} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.static}>
        <TileGrid grid={rows.map((r) => r.split(''))} layout={getTileLayout(rows.length, 176)} found={found} selection={selection} hintCells={hints} />
      </View>
    </View>
  );
}

/** Step artwork drawn with the real Chain board (beads, threads, next-letter rings). */
function ChainArt({ rows, found = [], path = [] }: { rows: string[]; found?: FoundChainWord[]; path?: Cell[] }) {
  const n = Math.max(rows.length, rows[0].length);
  return (
    <View style={styles.art} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.static}>
        <ChainGrid grid={rows.map((r) => r.split(''))} layout={getTileLayout(n, 156, 10)} found={found} path={path} hintCells={[]} />
      </View>
    </View>
  );
}

/** Built on demand (the artwork uses styles declared below). */
function stepsFor(mode: TutorialMode): Step[] {
  const all: Record<TutorialMode, Step[]> = {
  classic: [
    {
      title: 'Find the hidden words',
      body: 'Words hide in straight lines: across, down and diagonally. On harder levels they can run backwards too. Always drag from a word’s first letter to its last.',
      art: (
        <ClassicArt
          rows={['CATX', 'QOWE', 'ZTWS', 'DOGL']}
          found={[
            { word: 'CAT', start: c(0, 0), end: c(0, 2), colorIndex: 0 },
            { word: 'OWL', start: c(1, 1), end: c(3, 3), colorIndex: 1 },
            { word: 'DOG', start: c(3, 0), end: c(3, 2), colorIndex: 2 },
          ]}
        />
      ),
    },
    {
      title: 'Drag or tap to select',
      body: 'Slide from the first letter to the last, or tap the first letter and then the last. Found words keep their colour.',
      art: <ClassicArt rows={['XQZK', 'LION', 'BKTE', 'QRSA']} selection={{ start: c(1, 0), end: c(1, 3) }} />,
    },
    {
      title: 'Stuck? Use a hint',
      body: 'A hint rings the first letter of a word. Reveal finds a whole word for 2 hints. Fewer hints, higher score.',
      art: <ClassicArt rows={['BEAR', 'QXZK', 'TOMS', 'JUNE']} hints={[c(0, 0)]} />,
    },
  ],
  chain: [
    {
      title: 'Every letter is used',
      body: 'The grid is made only of hidden words. Each letter belongs to exactly one of them — find them all and the grid is complete.',
      art: (
        <ChainArt
          rows={['CAT', 'OEM', 'WLU']}
          found={[
            { word: 'CAT', cells: [c(0, 0), c(0, 1), c(0, 2)], colorIndex: 0 },
            { word: 'OWL', cells: [c(1, 0), c(2, 0), c(2, 1)], colorIndex: 1 },
            { word: 'EMU', cells: [c(1, 1), c(1, 2), c(2, 2)], colorIndex: 2 },
          ]}
        />
      ),
    },
    {
      title: 'Trace winding paths',
      body: 'Drag or tap through neighbouring letters — up, down or sideways, never diagonally. Go back a letter to undo it.',
      // SNAKE being traced; the dashed ring shows where it can go next.
      art: <ChainArt rows={['SNA', 'XEK']} path={[c(0, 0), c(0, 1), c(0, 2), c(1, 2), c(1, 1)]} />,
    },
    {
      title: 'Only lengths are shown',
      body: 'The list shows how many letters each word has. The theme is your clue, and a hint reveals a word.',
      art: (
        <View style={styles.art}>
          <View style={styles.chips}>
            {[4, 6, 5].map((n, i) => (
              <View key={i} style={styles.lengthChip}>
                <View style={styles.boxes}>
                  {Array.from({ length: n }, (_, k) => (
                    <View key={k} style={styles.box} />
                  ))}
                </View>
                <AppText variant="labelMd" color={colors.primary}>
                  {n}
                </AppText>
              </View>
            ))}
          </View>
        </View>
      ),
    },
  ],
  };
  return all[mode];
}

type Props = {
  mode: TutorialMode;
  visible: boolean;
  onDone: () => void;
};

/** First-play "how to play" sheet (also reopened from the ? button). */
export function TutorialSheet({ mode, visible, onDone }: Props) {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReduceMotion();
  const steps = stepsFor(mode);
  const step = steps[index];
  const last = index === steps.length - 1;
  const finish = () => {
    setIndex(0);
    onDone();
  };

  return (
    <Modal visible={visible} transparent animationType={reduceMotion ? 'none' : 'fade'} onRequestClose={finish} statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.sheet} accessibilityViewIsModal>
          <View style={styles.top}>
            <AppText variant="labelBadge" color={colors.primary}>
              How to play · {mode === 'chain' ? 'Chain' : 'Classic'}
            </AppText>
            {!last && (
              <Pressable onPress={finish} accessibilityRole="button" hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={({ pressed }) => pressed && { opacity: 0.5 }}>
                <AppText variant="labelLg" color={colors.inkMuted}>
                  Skip
                </AppText>
              </Pressable>
            )}
          </View>
          {step.art}
          <AppText variant="headlineMd" accessibilityRole="header">
            {step.title}
          </AppText>
          <AppText variant="bodyMd" color={colors.inkMuted}>
            {step.body}
          </AppText>
          <View style={styles.footer}>
            <View style={styles.dots} accessibilityLabel={`Step ${index + 1} of ${steps.length}`}>
              {steps.map((_, i) => (
                <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
              ))}
            </View>
            <Button
              label={last ? 'Let’s play' : 'Next'}
              icon={last ? 'play-arrow' : 'arrow-forward'}
              iconPosition={last ? 'left' : 'right'}
              onPress={() => (last ? finish() : setIndex(index + 1))}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end', padding: spacing.md },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    gap: 12,
    marginBottom: spacing.md,
    boxShadow: shadows.sheet,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  art: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceLow, borderRadius: radius.lg, paddingVertical: 20, minHeight: 150 },
  // Artwork only: never takes touches.
  static: { pointerEvents: 'none' },
  chips: { gap: 8, alignItems: 'flex-start' },
  lengthChip: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 30, paddingHorizontal: 10, borderRadius: radius.pill, backgroundColor: colors.primarySoft },
  boxes: { flexDirection: 'row', gap: 3 },
  box: { width: 8, height: 8, borderRadius: 2, backgroundColor: '#B4A9F5' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { width: 22, backgroundColor: colors.primary },
});
