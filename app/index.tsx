import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Aurora } from '../src/components/Aurora';
import { PrimaryButton, SecondaryButton } from '../src/components/Glass';
import { FadeIn } from '../src/components/Motion';
import { setFlowMode } from '../src/onboardingFlow';
import { color, font, glow, motion, safe, type as t } from '../src/theme';

/** The orb: three rings pulsing outward on a slow-exhale cycle. */
function Orb() {
  const rings = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  const breath = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loops = rings.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay((motion.breath / 3) * i),
          Animated.timing(v, {
            toValue: 1,
            duration: motion.breath,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ),
    );
    const b = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 1, duration: motion.breath / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(breath, { toValue: 0, duration: motion.breath / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loops.forEach((l) => l.start());
    b.start();
    return () => {
      loops.forEach((l) => l.stop());
      b.stop();
    };
  }, []);

  return (
    <View style={{ width: 180, height: 180, alignItems: 'center', justifyContent: 'center' }}>
      {rings.map((v, i) => (
        <Animated.View
          key={i}
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: 90,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.20)',
              opacity: v.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.45, 0] }),
              transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.84, 1.46] }) }],
            },
          ]}
        />
      ))}
      <Animated.View
        style={{
          width: 128,
          height: 128,
          borderRadius: 64,
          overflow: 'hidden',
          borderWidth: 2,
          borderColor: color.accent,
          boxShadow: glow(color.accent, 0.5, 46, 0),
          transform: [{ scale: breath.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.05] }) }],
        }}
      >
        {/* The app icon itself, clipped to the circle by the parent's
            overflow: 'hidden'. It keeps the same breathing and the same
            rings pulsing out from behind it. */}
        {/* Explicit 100% rather than absoluteFill: an Image with intrinsic
            dimensions ignores absoluteFill on web and renders at its natural
            1024px, which just showed a zoomed-in corner of the artwork. */}
        <Image
          source={require('../assets/icon.png')}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      </Animated.View>
    </View>
  );
}

export default function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: color.ground }}>
      <Aurora
        blobs={[
          { size: 360, color: color.accent, opacity: 0.34, left: -80, top: 60, duration: motion.driftFast },
          { size: 320, color: '#6FB3F5', opacity: 0.26, right: -110, top: -60, dx: -28, dy: 30, duration: motion.driftSlow },
          { size: 340, color: color.violet, opacity: 0.3, left: 30, bottom: -170, duration: motion.driftSlow },
        ]}
        scrim={['rgba(7,10,22,0.34)', 'rgba(7,10,22,0.26)', 'rgba(7,10,22,0.86)']}
      />

      <View
        style={{
          flex: 1,
          paddingTop: Math.max(insets.top, safe.top),
          paddingBottom: Math.max(insets.bottom, safe.bottom),
          paddingHorizontal: 24,
        }}
      >
        <View style={{ flex: 1 }} />

        <FadeIn duration={700} y={0} style={{ alignItems: 'center' }}>
          <Orb />
        </FadeIn>

        <View style={{ height: 34 }} />

        <FadeIn delay={180} style={{ alignItems: 'center', gap: 14 }}>
          <Text style={{ fontFamily: font.display, fontSize: 38, color: color.ink, letterSpacing: -1.2, lineHeight: 42 }}>
            AudioRelief
          </Text>
          <Text
            style={{
              fontFamily: font.body,
              fontSize: 15,
              lineHeight: 23,
              textAlign: 'center',
              color: color.ink72,
              maxWidth: 290,
            }}
          >
            Sound that helps you fall asleep, and knows when to stop.
          </Text>
        </FadeIn>

        <View style={{ flex: 1.4 }} />

        <FadeIn delay={360} style={{ gap: 10 }}>
          <PrimaryButton label="Get started" onPress={() => {
            setFlowMode('firstRun');
            router.push('/(onboarding)/sound');
          }} />
          <SecondaryButton label="I already have an account" onPress={() => router.push('/(onboarding)/auth')} />
          <View style={{ height: 4 }} />
          <Text style={[t.meta, { textAlign: 'center', color: color.ink58 }]}>
            Free to use. No account needed to try a sound.
          </Text>
        </FadeIn>
      </View>
    </View>
  );
}
