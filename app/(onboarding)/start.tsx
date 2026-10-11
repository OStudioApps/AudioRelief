import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingScreen } from '../../src/components/Onboarding';
import { Icon, type IconName } from '../../src/components/Icon';
import { PressScale } from '../../src/components/Motion';
import { useTinnitus } from '../../src/tinnitus';
import { color, font, radius, type as t } from '../../src/theme';

/**
 * The question before the steps: do you have tinnitus?
 *
 * The seven steps that follow are about a person's tinnitus, and asking them
 * of someone who came for sleep or calm is a wall of questions with no right
 * answers. So a "no" skips them and goes straight to the account screen; a
 * "yes" carries on into the questionnaire as before.
 *
 * It sits outside the progress bar on purpose — it decides whether there are
 * any steps at all.
 *
 * The two answers are large cards rather than the list rows every other step
 * uses. Those rows are for picking one detail out of five; this is the one
 * choice that changes what the whole app is for this person, and it should
 * look like it.
 */

const OPTIONS: { value: boolean; label: string; hint: string; icon: IconName }[] = [
  {
    value: true,
    label: 'Yes, I have tinnitus',
    hint: 'A few questions, so the sounds fit yours.',
    icon: 'waves',
  },
  {
    value: false,
    label: 'No, just to relax',
    hint: 'Sounds for sleep and calm. No questions.',
    icon: 'moon',
  },
];

function BigChoice({
  label,
  hint,
  icon,
  selected,
  onPress,
}: {
  label: string;
  hint: string;
  icon: IconName;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <PressScale
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ selected }}
      style={{
        minHeight: 164,
        padding: 20,
        justifyContent: 'space-between',
        borderRadius: radius.xl,
        backgroundColor: selected ? 'rgba(95,224,210,0.10)' : 'rgba(255,255,255,0.045)',
        borderWidth: 1.5,
        borderColor: selected ? color.accent : color.glassBorder,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: selected ? color.accent : 'rgba(255,255,255,0.08)',
          }}
        >
          <Icon name={icon} size={26} color={selected ? color.onAccent : color.ink} />
        </View>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: selected ? color.accent : 'transparent',
            borderWidth: 1.5,
            borderColor: selected ? color.accent : 'rgba(255,255,255,0.20)',
          }}
        >
          {selected ? <Icon name="check" size={15} color={color.onAccent} strokeWidth={3} /> : null}
        </View>
      </View>

      <View style={{ gap: 6, marginTop: 18 }}>
        <Text style={{ fontFamily: font.display, fontSize: 20, lineHeight: 25, letterSpacing: -0.4, color: color.ink }}>
          {label}
        </Text>
        <Text style={[t.body, { color: color.ink62 }]}>{hint}</Text>
      </View>
    </PressScale>
  );
}

export default function StartStep() {
  const router = useRouter();
  const { hasTinnitus, setHasTinnitus } = useTinnitus();
  // Held locally until Continue, so tapping a card to read it does not
  // change what the rest of the app believes about this person.
  const [choice, setChoice] = useState<boolean | null>(hasTinnitus);

  return (
    <OnboardingScreen
      eyebrow="Before we start"
      title="Do you have tinnitus?"
      subtitle="Ringing, buzzing or hissing that only you can hear. Either answer is fine — it only changes what we set up for you."
      cta="Continue"
      ctaDisabled={choice === null}
      onNext={() => {
        if (choice === null) return;
        setHasTinnitus(choice);
        router.push(choice ? '/(onboarding)/sound' : '/(onboarding)/auth');
      }}
      footer={
        <Text style={[t.meta, { color: color.ink58, textAlign: 'center' }]}>
          Saved with your account once you sign in. You can change it later in Account.
        </Text>
      }
    >
      <View accessibilityRole="radiogroup" style={{ gap: 12 }}>
        {OPTIONS.map((o) => (
          <BigChoice
            key={String(o.value)}
            label={o.label}
            hint={o.hint}
            icon={o.icon}
            selected={choice === o.value}
            onPress={() => setChoice(o.value)}
          />
        ))}
      </View>
    </OnboardingScreen>
  );
}
