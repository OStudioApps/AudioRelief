import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChoiceRow, OnboardingScreen } from '../../src/components/Onboarding';
import { WORST_WHEN } from '../../src/data/tinnitus';
import { useTinnitus } from '../../src/tinnitus';

/**
 * Step 5 — when it is hardest.
 *
 * The one question here that changes the app's behaviour rather than its
 * content: it decides when the app should be ready for you. Someone whose
 * tinnitus is worst at 3am needs a different default than someone who
 * struggles in a quiet office.
 */
export default function PatternStep() {
  const router = useRouter();
  const { pattern, setPattern } = useTinnitus();

  return (
    <OnboardingScreen
      step={5}
      eyebrow="Your pattern"
      title="When is it hardest?"
      subtitle="This sets when the app has something ready for you."
      cta="Continue"
      ctaDisabled={!pattern}
      onNext={() => router.push('/(onboarding)/why')}
    >
      <View style={{ gap: 10 }}>
        {WORST_WHEN.map((w) => (
          <ChoiceRow
            key={w.id}
            label={w.label}
            selected={pattern === w.id}
            onPress={() => setPattern(w.id)}
          />
        ))}
      </View>
    </OnboardingScreen>
  );
}
