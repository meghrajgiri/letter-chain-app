import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useReduceMotion } from '@/lib/useReduceMotion';
import { colors, radius, shadows } from '@/theme/tokens';
import { AppText } from './AppText';
import { Icon } from './Icon';

type ToastApi = {
  show: (message: string) => void;
  /** For placeholder features from the design that aren't built yet. */
  comingSoon: (feature: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error('useToast must be used inside <ToastProvider>');
  return api;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const [message, setMessage] = useState<string | null>(null);
  const [opacity] = useState(() => new Animated.Value(0));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (next: string) => {
      if (timer.current) clearTimeout(timer.current);
      setMessage(next);
      Animated.timing(opacity, { toValue: 1, duration: reduceMotion ? 0 : 160, useNativeDriver: true }).start();
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: reduceMotion ? 0 : 220, useNativeDriver: true }).start(() => setMessage(null));
      }, 1800);
    },
    [opacity, reduceMotion],
  );
  const comingSoon = useCallback((feature: string) => show(`${feature} is coming soon`), [show]);
  const api = useMemo<ToastApi>(() => ({ show, comingSoon }), [show, comingSoon]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {message && (
        <View style={[styles.wrap, { bottom: insets.bottom + 96 }]}>
          <Animated.View style={[styles.toast, { opacity }]} accessibilityLiveRegion="polite">
            <Icon name="auto-awesome" size={16} color={colors.yellow} />
            <AppText variant="labelMd" color={colors.surface}>
              {message}
            </AppText>
          </Animated.View>
        </View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', pointerEvents: 'none' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#302F3A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    boxShadow: shadows.sheet,
  },
});
