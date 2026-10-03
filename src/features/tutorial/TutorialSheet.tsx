import { useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { colors, radius, shadows, spacing, wordColors } from '@/theme/tokens';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { LetterTile, TILE_IDLE, TILE_SELECTED } from '../puzzle/components/LetterTile';

export type TutorialMode = 'classic' | 'chain';

type Step = { title: string; body: string; art: ReactNode };

const TILE = 38;
const GAP = 6;

/** Small tile grid used as step artwork. `states[r][c]`: -2 idle, -1 selected, ≥0 found colour. */
function MiniGrid({
  letters,
  states,
  links = [],
  rings = [],
}: {
  letters: string[];
  states: number[][];
  links?: { r: number; c: number; dir: 'h' | 'v'; color: string }[];
  /** [row, col] tiles shown with the hint ring. */
  rings?: [number, number][];
}) {
  const pitch = TILE + GAP;
  return (
    <View style={styles.art}>
      <View style={{ width: letters[0].length * pitch - GAP, height: letters.length * pitch - GAP }}>
        {links.map((l, i) => (
          <View
            key={i}
            style={[
              styles.link,
              { backgroundColor: l.color, left: l.c * pitch + (l.dir === 'h' ? TILE / 2 : TILE / 2 - 6), top: l.r * pitch + (l.dir === 'v' ? TILE / 2 : TILE / 2 - 6) },
              l.dir === 'h' ? { width: pitch, height: 12 } : { width: 12, height: pitch },
            ]}
          />
        ))}
        {letters.map((row, r) => (
          <View key={r} style={[styles.row, { gap: GAP, marginBottom: r < letters.length - 1 ? GAP : 0 }]}>
            {row.split('').map((letter, c) => (
              <LetterTile key={c} letter={letter} size={TILE} state={states[r][c]} ring={rings.some(([rr, cc]) => rr === r && cc === c)} />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const I = TILE_IDLE;
const S = TILE_SELECTED;

/** Built on demand (the artwork uses styles declared below). */
function stepsFor(mode: TutorialMode): Step[] {
  const all: Record<TutorialMode, Step[]> = {
  classic: [
    {
      title: 'Find the hidden words',
      body: 'Words hide in straight lines: across, down and diagonally. On harder levels they can run backwards too.',
      art: <MiniGrid letters={['CATX', 'QOWE', 'ZTWS', 'DOGK']} states={[[0, 0, 0, I], [I, 1, I, I], [I, I, 1, I], [2, 2, 2, I]]} />,
    },
    {
      title: 'Drag or tap to select',
      body: 'Slide from the first letter to the last, or tap the first letter and then the last. Found words keep their colour.',
      art: <MiniGrid letters={['LION', 'XKQZ']} states={[[S, S, S, S], [I, I, I, I]]} />,
    },
    {
      title: 'Stuck? Use a hint',
      body: 'A hint rings the first letter of a word. Reveal finds a whole word for 2 hints. Fewer hints, higher score.',
      art: <MiniGrid letters={['BEAR', 'QXZK']} states={[[I, I, I, I], [I, I, I, I]]} rings={[[0, 0]]} />,
    },
  ],
  chain: [
    {
      title: 'Every letter is used',
      body: 'The grid is made only of hidden words. Each letter belongs to exactly one of them — find them all and the grid is complete.',
      art: (
        <MiniGrid
          letters={['CAT', 'OEM', 'WLU']}
          states={[[0, 0, 0], [1, 2, 2], [1, 1, 2]]}
          links={[
            // CAT across the top
            { r: 0, c: 0, dir: 'h', color: wordColors[0].lip },
            { r: 0, c: 1, dir: 'h', color: wordColors[0].lip },
            // OWL: down, then right
            { r: 1, c: 0, dir: 'v', color: wordColors[1].lip },
            { r: 2, c: 0, dir: 'h', color: wordColors[1].lip },
            // EMU: right, then down
            { r: 1, c: 1, dir: 'h', color: wordColors[2].lip },
            { r: 1, c: 2, dir: 'v', color: wordColors[2].lip },
          ]}
        />
      ),
    },
    {
      title: 'Trace winding paths',
      body: 'Drag or tap through neighbouring letters — up, down or sideways, never diagonally. Go back a letter to undo it.',
      art: (
        <MiniGrid
          letters={['SNA', 'XEK']}
          states={[[S, S, S], [I, S, S]]}
          links={[
            { r: 0, c: 0, dir: 'h', color: colors.primaryDark },
            { r: 0, c: 1, dir: 'h', color: colors.primaryDark },
            { r: 0, c: 2, dir: 'v', color: colors.primaryDark },
            { r: 1, c: 1, dir: 'h', color: colors.primaryDark },
          ]}
        />
      ),
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
  row: { flexDirection: 'row' },
  link: { position: 'absolute', borderRadius: 6 },
  chips: { gap: 8, alignItems: 'flex-start' },
  lengthChip: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 30, paddingHorizontal: 10, borderRadius: radius.pill, backgroundColor: colors.primarySoft },
  boxes: { flexDirection: 'row', gap: 3 },
  box: { width: 8, height: 8, borderRadius: 2, backgroundColor: '#B4A9F5' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { width: 22, backgroundColor: colors.primary },
});
