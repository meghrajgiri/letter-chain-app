import { Stack } from 'expo-router';

import { colors } from '@/theme/tokens';

/** Home always sits under Trophies/Profile, even when one is opened from a deep link. */
export const unstable_settings = { initialRouteName: 'index' };

/**
 * Single lobby: Home is the only hub. Trophies and Profile are pushed over it
 * and draw their own headers, so there is no tab bar anywhere in the game.
 */
export default function LobbyLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="progress" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="play" />
    </Stack>
  );
}
