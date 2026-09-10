import React from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingScreen } from '../../src/components/Onboarding';
import { Icon } from '../../src/components/Icon';
import { RED_FLAGS } from '../../src/data/tinnitus';
import { OUTPUT_CEILING } from '../../src/audio/assets';
import { getFlowMode } from '../../src/onboardingFlow';
import { color, font, radius, type as t } from '../../src/theme';

/**
 * Step 7 — the honest one.
 *
 * Last rather than first on purpose: buried in settings nobody reads it, and
 * shown first it frightens people off before they know what the app is. Here
 * it lands as the closing note, right before they start using it.
 *
 * Three things it has to do: say plainly this is not a medical device, name
 * the symptoms that warrant a doctor, and explain the volume limit — loud
 * masking risks hearing damage, which makes tinnitus worse, so the ceiling is
 * a safeguard rather than a limitation to apologise for.
 */
export default function SafetyStep() {
  const router = useRouter();

  return (
    <OnboardingScreen
      step={7}
      eyebrow="Before you start"
      title="Two things worth saying plainly"
      cta={getFlowMode() === 'firstRun' ? 'Set up my account' : 'Save my profile'}
      onNext={() =>
        // Only a first run ends at the account screen. Someone editing their
        // profile is already signed in — sending them there was a loop with
        // no way out.
        getFlowMode() === 'firstRun'
          ? router.push('/(onboarding)/auth')
          : router.replace('/(tabs)/tonight')
      }
    >
      <View style={{ gap: 14 }}>
        <View
          style={{
            padding: 18,
            borderRadius: radius.md,
            backgroundColor: 'rgba(242,163,101,0.08)',
            borderWidth: 1,
            borderColor: 'rgba(242,163,101,0.28)',
            gap: 12,
          }}
        >
          <Text style={{ fontFamily: font.semibold, fontSize: 14, color: '#F2A365' }}>
            See a doctor if any of these are true
          </Text>
          <View style={{ gap: 9 }}>
            {RED_FLAGS.map((f) => (
              <View key={f} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                <View
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 3,
                    backgroundColor: '#F2A365',
                    marginTop: 7,
                  }}
                />
                <Text style={[t.body, { color: color.ink62, fontSize: 13.5, lineHeight: 20, flex: 1 }]}>
                  {f}
                </Text>
              </View>
            ))}
          </View>
          <Text style={[t.meta, { color: color.ink58 }]}>
            You can keep using the app either way. These are just worth getting looked at.
          </Text>
        </View>

        <View
          style={{
            padding: 18,
            borderRadius: radius.md,
            backgroundColor: 'rgba(255,255,255,0.04)',
            borderWidth: 1,
            borderColor: color.glassBorder,
            gap: 10,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Icon name="volumeLow" size={19} color={color.accent} />
            <Text style={{ fontFamily: font.semibold, fontSize: 14, color: color.ink }}>
              Keep it quieter than you think
            </Text>
          </View>
          <Text style={[t.body, { color: color.ink62, fontSize: 13.5, lineHeight: 21 }]}>
            The app caps its own volume at {Math.round(OUTPUT_CEILING * 100)}% and warns you before
            that. Sound played loudly for hours can damage hearing, and damaged hearing tends to
            make tinnitus worse — so turning it up until the ringing disappears works against you.
            Aim for a level that sits alongside it, not over it.
          </Text>
        </View>

        <Text style={[t.meta, { color: color.ink58, textAlign: 'center' }]}>
          AudioRelief is a sound tool. It is not a medical device.
        </Text>
      </View>
    </OnboardingScreen>
  );
}
