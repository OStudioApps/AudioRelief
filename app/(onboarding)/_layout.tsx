import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { Stack, usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RoundButton } from '../../src/components/Glass';
import { Icon } from '../../src/components/Icon';
import { useReducedMotion } from '../../src/components/Motion';
import { color, HEADER_ROW, safe } from '../../src/theme';

/**
 * The onboarding frame.
 *
 * The back arrow and progress bar are rendered here, once, as an overlay on
 * top of the navigator — so they are simply not part of any screen
 * transition. The steps slide underneath them.
 *
 * The slide itself is the platform's own stack animation rather than
 * something hand-written. That matters: it moves the outgoing step out to
 * the left while the incoming one comes in from the right (a hand-rolled
 * mount animation can only ever animate the arriving screen — the departing
 * one just vanishes), it reverses itself correctly on back, and it runs on
 * the native side where it cannot be stalled by JS frame timing.
 */

const ONBOARDING_STEPS = 7;

/** Route to step number. A route absent from here gets no header at all. */
const STEP_BY_ROUTE: Record<string, number> = {
  '/sound': 1,
  '/pitch': 2,
  '/profile': 3,
  '/impact': 4,
  '/pattern': 5,
  '/why': 6,
  '/safety': 7,
};

/**
 * Thin bar rather than dots — seven dots reads as a lot of work ahead.
 *
 * Because this lives in the layout it is mounted once for the whole flow, so
 * its Animated.Value survives every navigation. That is what lets the fill
 * genuinely tween from the previous step to the next like a loading bar,
 * with no bookkeeping to carry a "previous position" across mounts.
 */
function StepBar({ step }: { step: number }) {
  const target = (step / ONBOARDING_STEPS) * 100;
  const fill = useRef(new Animated.Value(target)).current;
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      fill.setValue(target);
      return;
    }
    const a = Animated.timing(fill, {
      toValue: target,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // width cannot run on the native driver
    });
    a.start();
    return () => a.stop();
  }, [target, reduced, fill]);

  return (
    <View
      style={{
        flex: 1,
        height: 3,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.12)',
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={{
          width: fill.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
          height: '100%',
          borderRadius: 999,
          backgroundColor: color.accent,
        }}
      />
    </View>
  );
}

export default function OnboardingLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();

  const step = STEP_BY_ROUTE[pathname];
  // /auth lives in this group but is not a step — it brings its own frame.
  const showHeader = step !== undefined;

  return (
    <View style={{ flex: 1, backgroundColor: color.ground }}>
      <Stack
        screenOptions={{
          headerShown: false,
          // Opaque on purpose: during the slide the arriving step has to
          // cover the departing one. A transparent screen would let both
          // show through each other mid-transition.
          contentStyle: { backgroundColor: color.ground },
          // iOS's own push: the incoming step comes from the right while the
          // outgoing one drifts left at a slower rate, with the system's
          // native curve. Softer than a flat 1:1 slide, and it reverses
          // itself on back.
          animation: 'ios_from_right',
          animationDuration: 320,
        }}
      />

      {showHeader ? (
        // box-none so only the button and bar catch touches; everything
        // else passes through to the screen sliding underneath.
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            minHeight: HEADER_ROW,
            paddingTop: Math.max(insets.top, safe.top),
            paddingHorizontal: safe.side,
          }}
        >
          <RoundButton onPress={() => router.back()}>
            <Icon name="chevronLeft" />
          </RoundButton>
          <StepBar step={step} />
        </View>
      ) : null}
    </View>
  );
}
