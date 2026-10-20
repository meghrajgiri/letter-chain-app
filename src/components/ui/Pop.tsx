import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';

import { useReduceMotion } from '@/lib/useReduceMotion';

type Props = {
  children: ReactNode;
  /** Replays the pop whenever this changes (e.g. a word's found state). */
  trigger?: unknown;
  /** Skips the entrance animation on first mount; only later `trigger` changes pop. */
  skipInitial?: boolean;
  delay?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Springs its content in from small to full size: the game's "juice" for found
 * words, stars and badges. Does nothing when the OS asks for reduced motion.
 */
export function Pop({ children, trigger, skipInitial = false, delay = 0, style }: Props) {
  const reduceMotion = useReduceMotion();
  const [scale] = useState(() => new Animated.Value(skipInitial ? 1 : 0.4));
  const mounted = useRef(false);

  useEffect(() => {
    const firstRun = !mounted.current;
    mounted.current = true;
    if (firstRun && skipInitial) return;
    if (reduceMotion) {
      scale.setValue(1);
      return;
    }
    scale.setValue(0.4);
    const anim = Animated.spring(scale, { toValue: 1, delay, friction: 5, tension: 120, useNativeDriver: true });
    anim.start();
    return () => anim.stop();
    // `trigger` is the replay key; the other values are stable for a given instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, reduceMotion]);

  return <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>;
}
