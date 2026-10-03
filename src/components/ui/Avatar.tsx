import { Image, StyleSheet } from 'react-native';

import { colors } from '@/theme/tokens';

/** Player avatar: the Google photo when signed in, otherwise the default art. */
export function Avatar({ size = 36, uri }: { size?: number; uri?: string | null }) {
  return (
    <Image
      source={uri ? { uri } : require('../../../assets/avatar.jpg')}
      style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
      accessibilityLabel="Profile picture"
    />
  );
}

const styles = StyleSheet.create({
  avatar: { backgroundColor: colors.primarySoft },
});
