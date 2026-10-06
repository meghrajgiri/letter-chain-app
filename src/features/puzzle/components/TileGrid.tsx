import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, type GestureResponderHandlers } from 'react-native';

import { colors, fonts, wordColors } from '@/theme/tokens';
import { getCellsBetween } from '../engine/getCellsBetween';
import { cellKey } from '../engine/gridScan';
import type { Cell, Grid } from '../engine/types';
import { isOnLineFrom, strokeBetween, type Stroke } from '../game/marker';
import type { TileLayout } from '../game/tileLayout';
import type { FoundWord } from '../hooks/usePuzzle';
import type { Selection } from '../hooks/usePuzzleSelection';
import { TILE_IDLE, TILE_SELECTED, tileLabel } from './LetterTile';

type Props = {
  grid: Grid;
  layout: TileLayout;
  found: readonly FoundWord[];
  selection: Selection | null;
  /** Hint markers: first letters of hinted words. */
  hintCells?: readonly Cell[];
  panHandlers?: GestureResponderHandlers;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /**
   * Screen reader mode: every tile becomes a button that calls `onTileTap`
   * (dragging isn't possible with TalkBack/VoiceOver).
   */
  screenReader?: boolean;
  onTileTap?: (cell: Cell) => void;
};

/** Inner padding around the letters. */
export const TILE_WELL_PADDING = 6;

/** Letters that can't continue the current line fade to this, so the player sees where to aim. */
const OFF_LINE_OPACITY = 0.22;

type Letter = { letter: string; color: string; dim: boolean };

/** One letter on the paper board. No tile box: strokes behind it carry the state. */
const MarkerLetter = memo(function MarkerLetter({ letter, size, color, dim }: { letter: string; size: number; color: string; dim: boolean }) {
  return (
    <View style={[styles.cell, { width: size, height: size, opacity: dim ? OFF_LINE_OPACITY : 1 }]}>
      <Text allowFontScaling={false} style={[styles.letter, { fontSize: Math.round(size * 0.54), lineHeight: Math.round(size * 0.66), color }]}>
        {letter}
      </Text>
    </View>
  );
});

function StrokeView({ stroke, color }: { stroke: Stroke; color: string }) {
  return (
    <View
      style={[
        styles.stroke,
        {
          left: stroke.left,
          top: stroke.top,
          width: stroke.width,
          height: stroke.height,
          borderRadius: stroke.height / 2,
          backgroundColor: color,
          transform: [{ rotate: `${stroke.angle}deg` }],
        },
      ]}
    />
  );
}

/**
 * The Classic board, drawn like a pen-and-paper word search: plain letters on
 * a white card, found words highlighted with a coloured marker stroke and the
 * live selection with a violet one. While a selection is under way, letters
 * off its 8 straight lines fade so the player knows where a word can run.
 */
export const TileGrid = memo(function TileGrid({
  grid,
  layout,
  found,
  selection,
  hintCells,
  panHandlers,
  accessibilityLabel,
  accessibilityHint,
  screenReader = false,
  onTileTap,
}: Props) {
  const thickness = Math.round(layout.tile * 0.88);

  const foundColor = useMemo(() => {
    const map = new Map<string, number>();
    // Later finds paint over earlier ones where words cross.
    for (const f of found) for (const c of getCellsBetween(f.start, f.end) ?? []) map.set(cellKey(c), f.colorIndex);
    return map;
  }, [found]);

  const foundStrokes = useMemo(
    () =>
      found.map((f) => ({
        key: f.word,
        stroke: strokeBetween(f.start, f.end, layout, thickness),
        // Slightly see-through so crossing words both stay visible.
        color: `${wordColors[f.colorIndex % wordColors.length].bg}E6`,
      })),
    [found, layout, thickness],
  );

  const selected = useMemo(() => {
    const cells = selection ? getCellsBetween(selection.start, selection.end) : null;
    return new Set((cells ?? []).map(cellKey));
  }, [selection]);
  const selectionStroke = selection ? strokeBetween(selection.start, selection.end, layout, thickness) : null;
  const guide = selection?.start ?? null;

  const rings = useMemo(() => new Set((hintCells ?? []).map(cellKey)), [hintCells]);
  const ringStrokes = useMemo(
    () => (hintCells ?? []).map((c) => ({ key: cellKey(c), stroke: strokeBetween(c, c, layout, thickness) })),
    [hintCells, layout, thickness],
  );

  const letters: Letter[][] = grid.map((row, r) =>
    row.map((letter, c) => {
      const key = `${r},${c}`;
      const colorIndex = foundColor.get(key);
      const color = selected.has(key)
        ? colors.primaryInk
        : colorIndex !== undefined
          ? wordColors[colorIndex % wordColors.length].ink
          : colors.ink;
      return { letter, color, dim: guide !== null && !isOnLineFrom(guide, { row: r, col: c }) };
    }),
  );

  return (
    <View style={styles.well} accessibilityLabel={accessibilityLabel} accessibilityHint={accessibilityHint}>
      {/* box-only: this view is the touch target, so locationX/Y are grid-relative. */}
      <View
        style={{ width: layout.size, height: layout.size, gap: layout.gap, pointerEvents: screenReader ? 'auto' : 'box-only' }}
        {...(screenReader ? undefined : panHandlers)}
      >
        {foundStrokes.map(({ key, stroke, color }) => (
          <StrokeView key={key} stroke={stroke} color={color} />
        ))}
        {ringStrokes
          .filter(({ key }) => !foundColor.has(key))
          .map(({ key, stroke }) => (
            <View
              key={`ring-${key}`}
              style={[styles.stroke, styles.ring, { left: stroke.left, top: stroke.top, width: stroke.width, height: stroke.height, borderRadius: stroke.height / 2 }]}
            />
          ))}
        {selectionStroke && <StrokeView stroke={selectionStroke} color={colors.primary} />}

        {letters.map((row, r) => (
          <View key={r} style={[styles.row, { gap: layout.gap }]}>
            {row.map(({ letter, color, dim }, c) => {
              const el = <MarkerLetter key={c} letter={letter} size={layout.tile} color={color} dim={dim} />;
              if (!screenReader) return el;
              const key = `${r},${c}`;
              const state = selected.has(key) ? TILE_SELECTED : (foundColor.get(key) ?? TILE_IDLE);
              return (
                <Pressable
                  key={c}
                  accessibilityRole="button"
                  accessibilityLabel={tileLabel(letter, r, c, state, rings.has(key))}
                  onPress={() => onTileTap?.({ row: r, col: c })}
                >
                  {el}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  well: { padding: TILE_WELL_PADDING },
  row: { flexDirection: 'row' },
  cell: { alignItems: 'center', justifyContent: 'center' },
  letter: { fontFamily: fonts.extrabold, textAlign: 'center', includeFontPadding: false, userSelect: 'none' },
  stroke: { position: 'absolute' },
  ring: { borderWidth: 2.5, borderColor: colors.yellow, backgroundColor: colors.yellowSoft },
});
