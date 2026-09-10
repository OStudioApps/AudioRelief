import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { color, motion } from '../theme';

/**
 * The aurora ground: soft colour fields drifting under a scrim.
 *
 * The web design used `radial-gradient(circle, colour, transparent)`. Earlier
 * versions of this file approximated that with stacked circles plus a blur
 * filter — but RN's `filter` does not render blur on iOS, so the circles showed
 * their edges on device.
 *
 * react-native-svg has real radial gradients, so each blob is now genuinely a
 * gradient fading to transparent. No blur needed, and it renders identically on
 * iOS, Android and web.
 */

export type Blob = {
  size: number;
  color: string;
  opacity: number;
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
  dx?: number;
  dy?: number;
  duration?: number;
};

function DriftBlob({
  id,
  size,
  color: fill,
  opacity,
  dx = 24,
  dy = -30,
  duration = motion.driftFast,
  ...pos
}: Blob & { id: string }) {
  const t = useRef(new Animated.Value(0)).current;
  // The previous stacked-circle build compounded to roughly 1.5x at the centre.
  // A true gradient does not, so lift the core to keep the same brightness.
  const core = Math.min(opacity * 1.5, 1);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, {
          toValue: 1,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(t, {
          toValue: 0,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t, duration]);

  return (
    <Animated.View
      style={[
        { position: 'absolute', width: size, height: size },
        pos as ViewStyle,
        {
          transform: [
            { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, dx] }) },
            { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, dy] }) },
            { scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) },
          ],
        },
      ]}
    >
      <Svg width="100%" height="100%">
        <Defs>
          {/* Bright core, long tail, fully transparent at the rim — no visible edge. */}
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={fill} stopOpacity={core} />
            <Stop offset="0.35" stopColor={fill} stopOpacity={core * 0.72} />
            <Stop offset="0.62" stopColor={fill} stopOpacity={core * 0.34} />
            <Stop offset="0.82" stopColor={fill} stopOpacity={core * 0.12} />
            <Stop offset="1" stopColor={fill} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}

type Props = {
  blobs: Blob[];
  /** Top-to-bottom scrim that settles the colour down into the ground. */
  scrim?: readonly [string, string, string];
  background?: string;
};

const defaultScrim = [
  'rgba(7,10,22,0.14)',
  'rgba(7,10,22,0.60)',
  'rgba(7,10,22,0.86)',
] as const;

let uid = 0;

export function Aurora({ blobs, scrim = defaultScrim, background = color.ground }: Props) {
  // Gradient ids must be unique across every Aurora mounted at once.
  const prefix = useRef(`aur${uid++}`).current;

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: background }]} pointerEvents="none">
      {blobs.map((b, i) => (
        <DriftBlob key={i} id={`${prefix}_${i}`} {...b} />
      ))}
      <LinearGradient
        colors={scrim as unknown as readonly [string, string]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
