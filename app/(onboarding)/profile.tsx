import React from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Rect } from 'react-native-svg';
import { OnboardingScreen } from '../../src/components/Onboarding';
import { GlassCard } from '../../src/components/Glass';
import { SVG_LAYER } from '../../src/components/Icon';
import { CHARACTERS, TONES } from '../../src/data/tinnitus';
import { useTinnitus } from '../../src/tinnitus';
import { color, font, radius, type as t } from '../../src/theme';

/**
 * Step 3 — what we do with it.
 *
 * The first three steps ask; this one gives something back before asking
 * again. The band chart shows the notch sitting where their pitch is, so the
 * profile stops being an abstract answer and becomes a visible setting.
 *
 * The copy stays mechanical — what the sound does, never what it will achieve.
 */

/** A spectrum with a gap cut where their tinnitus sits. */
function NotchChart({ index }: { index: number | null }) {
  const bars = 24;
  // Map the matched tone onto the bar strip; unmatched sits centre with no gap.
  const centre = index === null ? -1 : Math.round((index / (TONES.length - 1)) * (bars - 1));

  return (
    <Svg width="100%" height="100%" viewBox="0 0 240 90" style={SVG_LAYER}>
      {Array.from({ length: bars }).map((_, i) => {
        const notched = centre >= 0 && Math.abs(i - centre) <= 1;
        // A gentle arch so the strip reads as a spectrum, not a bar chart.
        const h = 26 + 34 * Math.sin((i / (bars - 1)) * Math.PI);
        return (
          <Rect
            key={i}
            x={6 + i * 9.7}
            y={78 - (notched ? 8 : h)}
            width={6}
            height={notched ? 8 : h}
            rx={3}
            fill={notched ? color.ink58 : color.accent}
            opacity={notched ? 0.35 : 0.9}
          />
        );
      })}
      <Rect x="0" y="80" width="240" height="1.5" rx={1} fill={color.ink58} opacity={0.3} />
    </Svg>
  );
}

export default function ProfileStep() {
  const router = useRouter();
  const { character, tone, toneUnknown, hz } = useTinnitus();

  const charLabel = CHARACTERS.find((c) => c.id === character)?.label ?? 'Your sound';
  const toneIndex = tone ? TONES.findIndex((x) => x.id === tone) : null;

  return (
    <OnboardingScreen
      step={3}
      eyebrow="Your profile"
      title={toneUnknown ? 'We will start broad' : 'This is what we will tune to'}
      subtitle={
        toneUnknown
          ? 'No match is a normal answer. The app starts with broadband sound and you can narrow it later, once you have listened for a while.'
          : 'Sound is shaped around the pitch you picked, rather than played flat across everything.'
      }
      cta="Continue"
      onNext={() => router.push('/(onboarding)/impact')}
    >
      <View style={{ gap: 14 }}>
        <GlassCard style={{ padding: 18, gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: color.accent,
              }}
            />
            <Text style={{ fontFamily: font.semibold, fontSize: 13.5, color: color.ink }}>
              {charLabel}
              {hz ? ` · around ${hz >= 1000 ? `${hz / 1000} kHz` : `${hz} Hz`}` : ' · pitch not matched'}
            </Text>
          </View>

          <View style={{ height: 96 }}>
            <NotchChart index={toneIndex} />
          </View>

          <View style={{ flexDirection: 'row', gap: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <View style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: color.accent }} />
              <Text style={[t.meta, { color: color.ink58 }]}>Sound you hear</Text>
            </View>
            {toneIndex !== null ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <View
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: 3,
                    backgroundColor: color.ink58,
                    opacity: 0.5,
                  }}
                />
                <Text style={[t.meta, { color: color.ink58 }]}>Left quiet</Text>
              </View>
            ) : null}
          </View>
        </GlassCard>

        <View
          style={{
            padding: 16,
            borderRadius: radius.md,
            backgroundColor: 'rgba(255,255,255,0.04)',
            borderWidth: 1,
            borderColor: color.glassBorder,
            gap: 10,
          }}
        >
          <Text style={{ fontFamily: font.semibold, fontSize: 13.5, color: color.ink }}>
            What the app does with this
          </Text>
          <Text style={[t.body, { color: color.ink62, fontSize: 13.5, lineHeight: 21 }]}>
            It shapes the sound you listen to around your pitch, and sets a level that sits
            alongside your tinnitus rather than burying it. Both are adjustable — this is a
            starting point, not a verdict.
          </Text>
        </View>
      </View>
    </OnboardingScreen>
  );
}
