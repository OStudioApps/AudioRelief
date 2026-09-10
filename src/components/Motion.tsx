import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from 'react-native';

/**
 * Motion for a sleep app: slow-out easing, short distances, nothing springy.
 * Everything here animates transform and opacity only, so it can run on the
 * native driver, and everything collapses to a static end-state when the OS
 * reduce-motion setting is on.
 */

export const DUR = { press: 110, release: 220, enter: 420, settle: 260 } as const;

/**
 * `AccessibilityInfo.isReduceMotionEnabled()` is always a Promise, so on
 * first render `reduced` defaults to false and only flips true once that
 * resolves. Anything that reads `reduced` synchronously in its very first
 * render — an entrance animation deciding its starting position, say — sees
 * the wrong answer for a beat, plays the full motion, then has the true
 * value land underneath it a moment later, snapping mid-animation. On web,
 * `matchMedia` is synchronous, so read it directly for the initial value and
 * skip that gap; native still has to wait for the real async check.
 */
function initialReducedMotion(): boolean {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.matchMedia) {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  }
  return false;
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(initialReducedMotion);

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        if (alive) setReduced(v);
      })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      alive = false;
      sub?.remove?.();
    };
  }, []);

  return reduced;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * A Pressable that sinks slightly under the finger. This is the single biggest
 * thing separating "alive" from "dead" — every tappable surface should use it.
 */
export function PressScale({
  onPress,
  disabled,
  style,
  children,
  scaleTo = 0.97,
  dimTo = 0.9,
  ...rest
}: PressableProps & {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  dimTo?: number;
  children?: React.ReactNode;
}) {
  const v = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();

  const to = (toValue: number) =>
    Animated.timing(v, {
      toValue,
      duration: toValue ? DUR.press : DUR.release,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => !reduced && !disabled && to(1)}
      onPressOut={() => !reduced && to(0)}
      style={[
        style,
        {
          transform: [
            { scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, scaleTo] }) },
          ],
          opacity: v.interpolate({ inputRange: [0, 1], outputRange: [1, dimTo] }),
        },
      ]}
    >
      {children}
    </AnimatedPressable>
  );
}

/** Content easing up into place on mount. Use `delay` to stagger a few blocks. */
export function FadeIn({
  delay = 0,
  y = 14,
  duration = DUR.enter,
  style,
  children,
}: {
  delay?: number;
  y?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  const v = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      v.setValue(1);
      return;
    }
    const a = Animated.timing(v, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    a.start();
    return () => a.stop();
  }, [reduced, v, delay, duration]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: v,
          transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [y, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/**
 * Eases a value toward 1 when `on` flips true and back to 0 when it flips
 * false — for selection states, so a card settles into being chosen rather
 * than snapping.
 */
export function useToggleValue(on: boolean, duration: number = DUR.settle) {
  const v = useRef(new Animated.Value(on ? 1 : 0)).current;
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      v.setValue(on ? 1 : 0);
      return;
    }
    const a = Animated.timing(v, {
      toValue: on ? 1 : 0,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    a.start();
    return () => a.stop();
  }, [on, reduced, v, duration]);

  return v;
}
