import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/tokens';

type Props = {
  letter: string;
  size: number;
  /** Part of a found word: rendered bold. */
  emphasized: boolean;
  /** Faded (Studio "answers" view: filler letters). */
  dimmed?: boolean;
};

export const PuzzleCell = memo(function PuzzleCell({ letter, size, emphasized, dimmed }: Props) {
  return (
    <View style={[styles.cell, { width: size, height: size }]}>
      <Text
        allowFontScaling={false}
        style={[
          styles.letter,
          { fontSize: Math.round(size * 0.52) },
          emphasized && styles.emphasized,
          dimmed && styles.dimmed,
        ]}
      >
        {letter}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  cell: { alignItems: 'center', justifyContent: 'center', userSelect: 'none' },
  letter: { color: colors.ink, fontWeight: '600', includeFontPadding: false, textAlign: 'center', userSelect: 'none' },
  emphasized: { fontWeight: '900' },
  dimmed: { color: '#C5C8D0' },
});
