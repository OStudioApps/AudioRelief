import React from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
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

/**
 * The band of sound, with a notch cut at their pitch.
 *
 * Written out rather than generated, for the same reason as the drawing on
 * the "why" screen: the old strip was `sin()` across 24 bars, and a perfect
 * arch is the one shape no real spectrum makes. These are low at both ends,
 * fullest through the middle, and uneven along the top.
 */
const BAND = [
  10, 14, 19, 26, 31, 36, 40, 44, 47, 45,
  49, 46, 50, 48, 51, 47, 50, 46, 48, 44,
  46, 41, 43, 38, 35, 31, 26, 21, 16, 11,
];

/**
 * The notch itself.
 *
 * The three bars at their pitch are cut flat to a stub, with the band at
 * full height either side of them. That gap is the whole point of the
 * picture, so it gets hard edges. An earlier version tapered gently into it
 * and faded the stubs nearly to nothing: prettier, but the missing part
 * stopped reading, and the legend below was left explaining something
 * invisible.
 */
const STUB = 8;

const FLOOR = 78;

function NotchChart({ index }: { index: number | null }) {
  // Map the matched tone onto the strip; unmatched gets no notch at all.
  const centre = index === null ? -1 : Math.round((index / (TONES.length - 1)) * (BAND.length - 1));
  const x = (i: number) => 7 + i * 7.8;

  return (
    <Svg width="100%" height="100%" viewBox="0 0 240 90" style={SVG_LAYER}>
      {BAND.map((full, i) => {
        const d = centre >= 0 ? Math.abs(i - centre) : 99;
        // Cut flat at the pitch, stepping back up on either shoulder.
        // Full height right up to the edge of the cut. Easing into it read
        // as the band sagging rather than as a piece deliberately removed.
        const cut = d <= 1;
        const h = cut ? STUB : full;
        return (
          <Rect
            key={i}
            x={x(i)}
            y={FLOOR - h}
            width={4.6}
            height={h}
            rx={2.3}
            fill={cut ? color.ink58 : color.accent}
            // Light enough to be read as bars that are still there, just
            // quiet — not as an empty hole.
            opacity={cut ? 0.4 : 0.62 + (full / 51) * 0.28}
          />
        );
      })}

      {/*
        Where their pitch sits. Dashed, like the attention line on the "why"
        screen — both are reference marks rather than things you could hear.
      */}
      {centre >= 0 ? (
        <>
          <Path
            d={`M${x(centre) + 1.6} ${FLOOR} L${x(centre) + 1.6} 16`}
            stroke={color.accent}
            strokeWidth={1}
            strokeDasharray="3 5"
            strokeLinecap="round"
            opacity={0.55}
          />
          <Circle cx={x(centre) + 1.6} cy={13} r={2.8} fill={color.accent} />
        </>
      ) : null}

      <Rect x="0" y={FLOOR + 2} width="240" height="1" rx={0.5} fill={color.ink} opacity={0.14} />
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
