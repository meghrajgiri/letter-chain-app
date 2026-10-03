import { StyleSheet, View } from 'react-native';

import { colors, fonts } from '@/theme/tokens';
import { AppText } from './AppText';

const TILES = [
  { letter: 'L', bg: colors.surface, ink: colors.primary },
  { letter: 'C', bg: colors.yellow, ink: colors.ink },
  { letter: 'H', bg: colors.green, ink: colors.surface },
  { letter: 'N', bg: colors.primarySoft, ink: colors.primary },
];

/** Letter Chain logo (rebuilt from the Stitch SVG with Views; no SVG dependency). */
export function AppLogo({ size = 40 }: { size?: number }) {
  const tile = size * 0.29;
  const inset = size * 0.1875;
  const gap = size * 0.042;
  return (
    <View
      style={[styles.box, { width: size, height: size, borderRadius: size * 0.25, padding: inset, gap }]}
      accessibilityLabel="Letter Chain"
      accessibilityRole="image"
    >
      {[0, 1].map((row) => (
        <View key={row} style={[styles.row, { gap }]}>
          {TILES.slice(row * 2, row * 2 + 2).map((t) => (
            <View key={t.letter} style={[styles.tile, { width: tile, height: tile, borderRadius: tile * 0.28, backgroundColor: t.bg }]}>
              <AppText style={{ fontFamily: fonts.extrabold, fontSize: tile * 0.62, lineHeight: tile * 0.8 }} color={t.ink}>
                {t.letter}
              </AppText>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: colors.primary, justifyContent: 'center' },
  row: { flexDirection: 'row' },
  tile: { alignItems: 'center', justifyContent: 'center' },
});
