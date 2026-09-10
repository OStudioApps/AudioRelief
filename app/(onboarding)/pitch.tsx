import React from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingScreen } from '../../src/components/Onboarding';
import { Icon } from '../../src/components/Icon';
import { PressScale } from '../../src/components/Motion';
import { useSample } from '../../src/components/SamplePlayer';
import { TONE_SAMPLES } from '../../src/audio/samples';
import { TONES } from '../../src/data/tinnitus';
import { useTinnitus } from '../../src/tinnitus';
import { color, font, radius } from '../../src/theme';

/**
 * Step 2 — pitch matching.
 *
 * This is the screen that makes the app a tinnitus product rather than a sleep
 * app with different copy: the matched frequency is what the notch is cut
 * around, and it is why a person's settings are not portable to a free noise
 * app.
 */
export default function PitchStep() {
  const router = useRouter();
  const { tone, setTone } = useTinnitus();
  const { playing, play } = useSample();

  const answered = tone !== null;

  return (
    <OnboardingScreen
      step={2}
      eyebrow="Your pitch"
      title="Which is closest to your pitch?"
      subtitle="Play each one and compare it to what you hear. Keep your volume low — these are tones, and louder is not more accurate."
      cta="Continue"
      ctaDisabled={!answered}
      onNext={() => router.push('/(onboarding)/profile')}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {TONES.map((x) => {
          const on = tone === x.id;
          return (
            <PressScale
              key={x.id}
              onPress={() => {
                setTone(x.id);
                play(x.id, TONE_SAMPLES[x.id]);
              }}
              style={{
                width: '31%',
                flexGrow: 1,
                minHeight: 92,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                borderRadius: radius.md,
                backgroundColor: on ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.045)',
                borderWidth: 1.5,
                borderColor: on ? color.accent : color.glassBorder,
              }}
            >
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: playing === x.id ? color.accent : 'rgba(255,255,255,0.08)',
                }}
              >
                <Icon
                  name="play"
                  size={14}
                  color={playing === x.id ? color.onAccent : color.ink}
                />
              </View>
              <Text
                style={{
                  fontFamily: font.semibold,
                  fontSize: 13,
                  color: on ? color.accent : color.ink,
                }}
              >
                {x.label}
              </Text>
            </PressScale>
          );
        })}
      </View>
    </OnboardingScreen>
  );
}
