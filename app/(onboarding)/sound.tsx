import React from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChoiceRow, OnboardingScreen } from '../../src/components/Onboarding';
import { Icon } from '../../src/components/Icon';
import { PressScale } from '../../src/components/Motion';
import { useSample } from '../../src/components/SamplePlayer';
import { CHARACTER_SAMPLES } from '../../src/audio/samples';
import { CHARACTERS } from '../../src/data/tinnitus';
import { useTinnitus } from '../../src/tinnitus';
import { color, radius, type as t } from '../../src/theme';

/**
 * Step 1 — what it sounds like.
 *
 * Opening with a sound rather than a form is deliberate: it is the fastest way
 * to signal that the app knows what tinnitus is. Each option can be played, so
 * someone recognises theirs by ear instead of picking an adjective.
 */
export default function SoundStep() {
  const router = useRouter();
  const { character, setCharacter } = useTinnitus();
  const { playing, play } = useSample();

  const picked = CHARACTERS.find((c) => c.id === character);

  return (
    <OnboardingScreen
      step={1}
      eyebrow="Your sound"
      title="What does yours sound like?"
      subtitle="Tap to hear each one. Pick whichever is closest — it does not have to be exact."
      cta="Continue"
      ctaDisabled={!character}
      onNext={() => router.push('/(onboarding)/pitch')}
      footer={
        picked?.seeDoctor ? (
          <View
            style={{
              padding: 14,
              borderRadius: radius.md,
              backgroundColor: 'rgba(242,163,101,0.10)',
              borderWidth: 1,
              borderColor: 'rgba(242,163,101,0.30)',
            }}
          >
            <Text style={[t.meta, { color: '#F2A365' }]}>
              Sound that pulses in time with your heartbeat is worth getting checked by a doctor.
              You can carry on here, but do book that.
            </Text>
          </View>
        ) : null
      }
    >
      <View style={{ gap: 10 }}>
        {CHARACTERS.map((c) => (
          <ChoiceRow
            key={c.id}
            label={c.label}
            hint={c.hint}
            selected={character === c.id}
            onPress={() => setCharacter(c.id)}
            left={
              <PressScale
                onPress={() => play(c.id, CHARACTER_SAMPLES[c.id])}
                scaleTo={0.88}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor:
                    playing === c.id ? color.accent : 'rgba(255,255,255,0.08)',
                }}
              >
                <Icon
                  name={playing === c.id ? 'pause' : 'play'}
                  size={16}
                  color={playing === c.id ? color.onAccent : color.ink}
                />
              </PressScale>
            }
          />
        ))}
      </View>
    </OnboardingScreen>
  );
}
