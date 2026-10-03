import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { ToastProvider } from '@/components/ui/Toast';
import { AccountProvider } from '@/features/account/AccountProvider';
import { DailySync } from '@/features/daily/DailySync';
import { ProgressProvider, useProgress } from '@/features/progress/ProgressProvider';
import { ReminderSync } from '@/features/reminders/ReminderSync';
import { colors, fonts } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  if (!loaded && !error) return null;

  return (
    <ProgressProvider>
      <AppShell />
    </ProgressProvider>
  );
}

/** Keeps the splash screen up until fonts and saved progress are loaded. */
function AppShell() {
  const { ready } = useProgress();
  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);
  if (!ready) return null;

  return (
    <AccountProvider>
      <ToastProvider>
        <ReminderSync />
        <DailySync />
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.background },
            headerShadowVisible: false,
            headerTintColor: colors.primary,
            headerTitleStyle: { color: colors.ink, fontFamily: fonts.bold },
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="puzzle" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="chain" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="studio" options={{ title: 'Puzzle Studio' }} />
          <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        </Stack>
      </ToastProvider>
    </AccountProvider>
  );
}

export { ErrorScreen as ErrorBoundary } from '@/components/ErrorScreen';
