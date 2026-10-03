import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, type TypeVariant } from '@/theme/tokens';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

type Props = {
  label: string;
  icon?: IconName;
  /** Emoji or custom node before the label. */
  leading?: ReactNode;
  bg?: string;
  color?: string;
  variant?: TypeVariant;
  style?: StyleProp<ViewStyle>;
};

/** Small rounded chip: badges, category tags, stat chips. */
export function Pill({ label, icon, leading, bg = colors.surfaceMuted, color = colors.inkMuted, variant = 'labelBadge', style }: Props) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }, style]}>
      {icon ? <Icon name={icon} size={variant === 'labelBadge' ? 14 : 18} color={color} /> : null}
      {leading}
      <AppText variant={variant} color={color} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
});
