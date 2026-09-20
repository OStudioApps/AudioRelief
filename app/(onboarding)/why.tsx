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

/**
 * The filter, drawn.
 *
 * This is the paragraph below it as a picture, not decoration: a day's worth
 * of sound sits as quiet ticks along the floor, a dashed line marks the level
 * the brain stops paying attention at, and one signal — the flagged one —
 * crosses it. The gap either side of that signal is what "singled out" looks
 * like.
 *
 * The heights are written out rather than generated. A formula gives a sine
 * wave and a random seed gives noise; neither looks like a room.
 */
const AMBIENT = [
  13, 22, 10, 26, 16, 9, 23, 14, 30, 12, 19, 25,
  22, 13, 29, 17, 10, 25, 14, 20, 9, 28, 16, 12,
];

/** Where the ordinary sounds stand, and where the flagged one rises. */
const FLOOR = 80;
const FILTER_Y = 44;
const FOCUS_X = 110;

function AttentionArt() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 220 96" style={SVG_LAYER}>
      {/*
        The attention line. Dashed because it is a threshold rather than a
        thing — nothing in the ear draws it.
      */}
      <Path
        d={`M8 ${FILTER_Y} L212 ${FILTER_Y}`}
        stroke={color.ink58}
        strokeWidth={1}
        strokeDasharray="3 6"
        strokeLinecap="round"
        opacity={0.5}
      />

      {AMBIENT.map((h, i) => {
        const x = 12 + i * 8.2;
        // A clear space around the flagged signal. Everything else recedes
        // from it, which is the whole idea in one gap.
        if (Math.abs(x - FOCUS_X) < 16) return null;
        // Fading at both edges so the row reads as continuing past the frame
        // rather than as twenty-four bars of something counted.
        const edge = 1 - Math.abs(x - FOCUS_X) / 118;
        return (
          <Path
            key={i}
            d={`M${x} ${FLOOR} L${x} ${FLOOR - h}`}
            stroke={color.ink}
            strokeWidth={1.7}
            strokeLinecap="round"
            opacity={0.1 + edge * 0.2}
          />
        );
      })}

      {/* The one the brain has flagged: the only thing above the line. */}
      <Circle cx={FOCUS_X} cy={18} r={13} fill={color.accent} opacity={0.08} />
      <Circle cx={FOCUS_X} cy={18} r={7.5} fill={color.accent} opacity={0.16} />
      <Path
        d={`M${FOCUS_X} ${FLOOR} L${FOCUS_X} 18`}
        stroke={color.accent}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <Circle cx={FOCUS_X} cy={18} r={3.4} fill={color.accent} />

      {/* The floor everything stands on, held quieter than the ticks. */}
      <Path
        d={`M8 ${FLOOR} L212 ${FLOOR}`}
        stroke={color.ink}
        strokeWidth={1}
        strokeLinecap="round"
        opacity={0.14}
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
