import type { BottomTabBarProps } from 'expo-router/tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, shadows } from '@/theme/tokens';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

const ICONS: Record<string, IconName> = {
  index: 'home',
  play: 'grid-view',
  progress: 'equalizer',
  profile: 'account-circle',
};

/** Height reserved at the bottom of tab screens so content clears the floating bar. */
export const TAB_BAR_SPACE = 104;

/** The design's floating pill tab bar. */
export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const label = descriptors[route.key].options.title ?? route.name;
          const color = focused ? colors.primary : colors.inkSubtle;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
              }}
              style={styles.item}
            >
              <Icon name={ICONS[route.name] ?? 'circle'} size={26} color={color} />
              <AppText variant="labelBadge" color={color} style={styles.label}>
                {label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, pointerEvents: 'box-none' },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 420,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 6,
    boxShadow: shadows.raised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  item: { minWidth: 64, minHeight: 52, alignItems: 'center', justifyContent: 'center', gap: 2 },
  label: { textTransform: 'none', letterSpacing: 0.2 },
});
