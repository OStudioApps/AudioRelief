import React from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Circle, Path } from 'react-native-svg';
import { OnboardingScreen } from '../../src/components/Onboarding';
import { GlassCard } from '../../src/components/Glass';
import { SVG_LAYER } from '../../src/components/Icon';
import { RESEARCH } from '../../src/data/tinnitus';
import { color, radius, type as t } from '../../src/theme';

/**
 * Step 6 — why the app is built this way.
 *
 * The one screen that carries an idea rather than a question, and the most
 * valuable in the flow: the shift from "my ears are broken" to "my brain has
 * flagged a signal" is what makes the rest of the product make sense.
 *
 * Claims stay at the level of mechanism. The app describes what sound does and
 * what the research examined; it never says this will work for you. Sources are
 * named in text only, exactly as they are — no links, no invented institutions,
 * and no implication that this app is any of those therapies.
 *
 * Kept to the two citations that speak directly to the idea on this screen —
 * the habituation model and the notching approach the app's audio uses. The
 * rest of RESEARCH (prevalence, CBT, the clinical guideline) is real and
 * verified but belongs elsewhere; a seven-screen flow can't carry all five
 * without feeling like a literature review.
 */
const SHOWN_RESEARCH = [RESEARCH[3], RESEARCH[0]];

/** Attention narrowing onto one signal, then widening again. */
function AttentionArt() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 220 96" style={SVG_LAYER}>
      {/* the competing sounds of an ordinary day */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Path
          key={i}
          d={`M${14 + i * 34} 62 q 8 -${10 + (i % 3) * 7} 16 0`}
          stroke={color.ink58}
          strokeWidth={1.6}
          fill="none"
          strokeLinecap="round"
          opacity={0.5}
        />
      ))}
      {/* the one the brain has singled out */}
      <Path
        d="M104 74 L104 20"
        stroke={color.accent}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <Circle cx="104" cy="16" r="4" fill={color.accent} />
      <Path
        d="M6 80 L214 80"
        stroke={color.ink58}
        strokeWidth={1.4}
        opacity={0.35}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default function WhyStep() {
  const router = useRouter();

  return (
    <OnboardingScreen
      step={6}
      eyebrow="Why this works"
      title="The sound is real. So is the reason it stays loud."
      cta="Continue"
      onNext={() => router.push('/(onboarding)/safety')}
    >
      <View style={{ gap: 14 }}>
        <GlassCard style={{ padding: 18, gap: 14 }}>
          <View style={{ height: 96 }}>
            <AttentionArt />
          </View>
          <Text style={[t.body, { color: color.ink62, fontSize: 13.5, lineHeight: 21 }]}>
            Your brain filters out sounds it decides do not matter — a fan, traffic outside.
            Tinnitus stays loud partly because it has been flagged as one worth listening to. That
            flag is a pattern, and patterns can shift.
          </Text>
        </GlassCard>

        <View style={{ gap: 10 }}>
          <Text style={[t.label, { color: color.ink58 }]}>What this is based on</Text>
          {SHOWN_RESEARCH.map((r) => (
            <View
              key={r.source}
              style={{
                padding: 14,
                borderRadius: radius.md,
                backgroundColor: 'rgba(255,255,255,0.035)',
                borderWidth: 1,
                borderColor: color.glassBorder,
                gap: 5,
              }}
            >
              <Text style={[t.body, { color: color.ink, fontSize: 13.5, lineHeight: 20 }]}>
                {r.claim}
              </Text>
              <Text style={[t.meta, { color: color.ink58 }]}>{r.source}</Text>
            </View>
          ))}
        </View>
      </View>
    </OnboardingScreen>
  );
}
