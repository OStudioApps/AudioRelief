import React from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingScreen } from '../../src/components/Onboarding';
import { PressScale } from '../../src/components/Motion';
import { useTinnitus } from '../../src/tinnitus';
import { getFlowMode } from '../../src/onboardingFlow';
import { color, font, glow, radius, rgba, type as t } from '../../src/theme';

/**
 * Step 4 — impact, 0 to 10.
 *
 * This is the baseline everything later is measured against. Loudness is not
 * the useful question — how much it interferes is what changes with time and
 * what a person notices improving, so that is what gets asked and tracked.
 *
 * No percentile chart or "you scored better than X% of members" framing: this
 * audience is anxious enough without being ranked, and the number is only
 * meaningful against their own future answers.
 *
 * Laid out as one rising line rather than a grid of boxes: eleven bars in a
 * single row, each a little taller than the last, coloured in three bands —
 * green through 0-3, orange through 4-7, red for 8-10. The shape reads before
 * the numbers do.
 */
const BAR_MIN = 22;
const BAR_MAX = 74;

function bandColor(n: number) {
  if (n <= 3) return color.scaleGood;
  if (n <= 7) return color.scaleMid;
  return color.scaleBad;
}

export default function ImpactStep() {
  const router = useRouter();
  const { impact, setImpact } = useTinnitus();

  const anchor =
    impact === null
      ? 'Pick the number that fits a typical day.'
      : impact <= 2
        ? 'There, but mostly in the background.'
        : impact <= 5
          ? 'Noticeable, and it costs you some attention.'
          : impact <= 8
            ? 'Hard to work around on a normal day.'
            : 'Dominating most of your day.';

  return (
    <OnboardingScreen
      step={4}
      eyebrow="Where you are now"
      title="How much does it get in the way?"
      subtitle="On an ordinary day — not your worst one."
      cta={getFlowMode() === 'checkin' ? 'Save' : 'Continue'}
      ctaDisabled={impact === null}
      onNext={() =>
        // A check-in is this one question, as the card on home promises.
        // Carrying on through the remaining steps would be a bait and switch.
        getFlowMode() === 'checkin'
          ? router.replace('/(tabs)/tonight')
          : router.push('/(onboarding)/pattern')
      }
      footer={
        <Text style={[t.meta, { color: color.ink58, textAlign: 'center' }]}>
          We ask this again every few weeks. That comparison is the point of it.
        </Text>
      }
    >
      <View style={{ gap: 18 }}>
        <View style={{ gap: 12 }}>
          <View
            style={{
              alignSelf: 'flex-start',
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: radius.sm,
              backgroundColor: rgba(color.accent, 0.12),
              borderWidth: 1,
              borderColor: rgba(color.accent, 0.45),
              boxShadow: glow(color.accent, 0.22, 12, 2),
            }}
          >
            <Text style={[t.meta, { color: color.accent }]}>Tap a bar to choose your number</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
          {Array.from({ length: 11 }).map((_, n) => {
            const on = impact === n;
            const bc = bandColor(n);
            const height = BAR_MIN + ((BAR_MAX - BAR_MIN) * n) / 10;
            return (
              <PressScale
                key={n}
                onPress={() => setImpact(n)}
                scaleTo={0.9}
                hitSlop={{ top: 10, bottom: 22, left: 2, right: 2 }}
                style={{ flex: 1, alignItems: 'center', gap: 7 }}
              >
                <View
                  style={{
                    width: '100%',
                    height,
                    borderRadius: 8,
                    backgroundColor: on ? bc : rgba(bc, 0.14),
                    borderWidth: on ? 0 : 1.5,
                    borderColor: bc,
                    boxShadow: on ? glow(bc, 0.4, 14, 3) : undefined,
                  }}
                />
                <Text
                  style={{
                    fontFamily: font.semibold,
                    fontSize: 11.5,
                    color: on ? bc : color.ink58,
                  }}
                >
                  {n}
                </Text>
              </PressScale>
            );
          })}
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={[t.meta, { color: color.scaleGood }]}>Not at all</Text>
          <Text style={[t.meta, { color: color.scaleBad }]}>Constantly</Text>
        </View>

        <View
          style={{
            padding: 16,
            borderRadius: radius.md,
            backgroundColor: 'rgba(255,255,255,0.04)',
            borderWidth: 1,
            borderColor: color.glassBorder,
          }}
        >
          <Text style={[t.body, { color: color.ink62, fontSize: 13.5, lineHeight: 21 }]}>
            {anchor}
          </Text>
        </View>
      </View>
    </OnboardingScreen>
  );
}
