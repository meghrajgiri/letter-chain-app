import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, wordColors } from '@/theme/tokens';

/** -2 = idle, -1 = in the current selection, ≥0 = found word colour index. */
export type TileState = number;
export const TILE_IDLE = -2;
export const TILE_SELECTED = -1;

type Props = {
  letter: string;
  size: number;
  state: TileState;
  /** Hint marker: a yellow ring (Chain mode's revealed word start). */
  ring?: boolean;
};

/** Screen-reader label for a tile: "A, row 2, column 5, selected". */
export function tileLabel(letter: string, row: number, col: number, state: TileState, ring?: boolean): string {
  const status = state === TILE_SELECTED ? ', selected' : state >= 0 ? ', found' : ring ? ', hint' : '';
  return `${letter}, row ${row + 1}, column ${col + 1}${status}`;
}

/** One letter tile with the design's tactile bottom lip. */
export const LetterTile = memo(function LetterTile({ letter, size, state, ring }: Props) {
  const lip = size >= 30 ? 3 : 2;
  const found = state >= 0 ? wordColors[state % wordColors.length] : null;
  const selected = state === TILE_SELECTED;

  return (
    <View
      style={[
        styles.tile,
        { width: size, height: size, borderRadius: Math.round(size * 0.24), borderBottomWidth: lip },
        found && { backgroundColor: found.bg, borderColor: found.lip },
        selected && styles.selected,
        ring && !found && !selected && styles.ring,
      ]}
    >
      <Text
        allowFontScaling={false}
        style={[
          styles.letter,
          { fontSize: Math.round(size * 0.5), lineHeight: Math.round(size * 0.62) },
          found && { color: found.ink },
          selected && styles.selectedLetter,
        ]}
      >
        {letter}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    userSelect: 'none',
  },
  selected: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
    transform: [{ scale: 1.06 }],
  },
  letter: { fontFamily: fonts.extrabold, color: colors.ink, textAlign: 'center', includeFontPadding: false, userSelect: 'none' },
  selectedLetter: { color: colors.primaryInk },
  ring: { borderColor: colors.yellow, borderWidth: 2, backgroundColor: colors.yellowSoft },
});
