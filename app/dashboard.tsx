import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Aurora } from '../src/components/Aurora';
import { GlassCard, RoundButton } from '../src/components/Glass';
import { Icon } from '../src/components/Icon';
import { PressScale } from '../src/components/Motion';
import { LOUD_THRESHOLD } from '../src/audio/assets';
import { useHistory } from '../src/history';
import { useTinnitus } from '../src/tinnitus';
import { setFlowMode } from '../src/onboardingFlow';
import { CHECKIN_DAYS } from '../src/data/recommend';
import {
  averageVolume,
  bySlot,
  formatSpan,
  impactTrend,
  nightlySeconds,
  SLOT_LABEL,
  sessionsSince,
  streak,
  topSounds,
  totalSeconds,
} from '../src/data/insights';
import { color, font, glow, motion, radius, safe, space, type as t } from '../src/theme';

/**
 * The dashboard.
 *
 * The rule for this screen: every number is something the app has actually
 * observed on this phone. Nothing is estimated, nothing is seeded, and where
 * there is not enough history yet the card says so instead of showing a zero
 * dressed up as a measurement.
 *
 * What it deliberately does not claim: that any of this is clinical progress.
 * Listening time is listening time, and the impact score is the person's own
 * answer to one question. Sound is not a treatment, and a chart that implied
 * otherwise would be the most dishonest thing in the app.
 */

const NIGHTS = 14;

/** "12 Jul" in the phone's own locale. */
function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function Stat({ value, label, tint }: { value: string; label: string; tint?: string }) {
  return (
    <GlassCard style={{ flex: 1, minHeight: 86, padding: 15, justifyContent: 'center', gap: 5 }}>
      {/* One line each. Three tiles across a phone is tight, so the numbers
          are sized to fit rather than wrapped mid-value — "27h" above "30m"
          reads as two separate figures. */}
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{
          fontFamily: font.display,
          // 17 fits "27h 30m" in a third of a phone's width. adjustsFontSizeToFit
          // is a native-only safety net; on web it truncates instead, so the
          // base size has to be right on its own.
          fontSize: 17,
          color: tint ?? color.ink,
          letterSpacing: -0.4,
          fontVariant: ['tabular-nums'],
        }}
      >
        {value}
      </Text>
      <Text style={[t.meta, { color: color.ink58 }]} numberOfLines={1}>
        {label}
      </Text>
    </GlassCard>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: space.sm }}>
      <Text style={[t.label, { color: color.ink58 }]}>{label}</Text>
      {children}
    </View>
  );
}

/** Nights as columns. Height is time, so a short night still shows up. */
function NightlyBars({ data }: { data: Array<{ key: string; seconds: number }> }) {
  const peak = Math.max(...data.map((d) => d.seconds), 1);

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 72 }}>
        {data.map((d) => {
          const used = d.seconds > 0;
          // A floor of 3px so an unused night reads as an empty slot rather
          // than as nothing at all.
          const h = used ? Math.max((d.seconds / peak) * 72, 8) : 3;
          return (
            <View
              key={d.key}
              style={{
                flex: 1,
                height: h,
                borderRadius: 3,
                backgroundColor: used ? color.accent : color.ink,
                opacity: used ? 0.8 : 0.12,
              }}
            />
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={[t.meta, { color: color.ink58 }]}>{NIGHTS} nights ago</Text>
        <Text style={[t.meta, { color: color.ink58 }]}>Last night</Text>
      </View>
    </View>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sessions, impacts, loaded } = useHistory();
  const tin = useTinnitus();

  const recent = sessionsSince(sessions, NIGHTS);
  const week = sessionsSince(sessions, 7);
  const nights = nightlySeconds(sessions, NIGHTS);
  const nightsUsed = nights.filter((n) => n.seconds > 0).length;
  const run = streak(sessions);
  const slots = bySlot(recent);
  const busiest = [...slots].sort((a, b) => b.seconds - a.seconds)[0];
  const top = topSounds(recent, 3);
  const avgVol = averageVolume(recent);
  const trend = impactTrend(impacts);
  const hasHistory = sessions.length > 0;

  const daysToCheckin =
    tin.daysSinceImpact === null ? null : Math.max(CHECKIN_DAYS - tin.daysSinceImpact, 0);

  const weekSeconds = totalSeconds(week);
  const typicalNight = nightsUsed > 0 ? Math.round(totalSeconds(recent) / nightsUsed) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: color.ground }}>
      <Aurora
        blobs={[
          { size: 300, color: color.accent, opacity: 0.22, left: -90, top: -70, duration: motion.driftSlow },
          { size: 280, color: color.violet, opacity: 0.24, right: -100, top: 320, dx: -24, dy: 26 },
        ]}
        scrim={['rgba(7,10,22,0.30)', 'rgba(7,10,22,0.70)', 'rgba(7,10,22,0.92)']}
      />

      <View style={{ flex: 1, paddingTop: Math.max(insets.top, safe.top) }}>
        <View
          style={{
            paddingHorizontal: safe.side,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: 44,
          }}
        >
          <RoundButton label="Close" onPress={() => router.back()}>
            <Icon name="chevronDown" />
          </RoundButton>
          <Text style={[t.label, { color: color.ink58 }]}>Your dashboard</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: safe.side,
            paddingTop: space.lg,
            paddingBottom: Math.max(insets.bottom, safe.bottom) + 24,
            gap: space.xl,
          }}
        >
          {!loaded ? (
            <View style={{ height: 200 }} />
          ) : !hasHistory ? (
            /*
              Nothing has been listened to yet. Rather than four cards of
              zeros, say what will appear and why it is worth having.
            */
            <GlassCard r={radius.lg} style={{ padding: 22, gap: space.md }}>
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  borderWidth: 1,
                  borderColor: color.glassBorder,
                }}
              >
                <Icon name="dashboard" size={23} color={color.ink72} />
              </View>
              <Text style={[t.card, { color: color.ink, fontSize: 17 }]}>Nothing to show yet</Text>
              <Text style={[t.body, { color: color.ink62, lineHeight: 21 }]}>
                Once you have listened for a few nights, this is where you will see how much you
                used it, when you reach for it, which sounds you keep going back to, and how your
                answer to the check-in question moves over the weeks.
              </Text>
              <Text style={[t.meta, { color: color.ink58, lineHeight: 17 }]}>
                Sessions under a minute are not counted.
              </Text>
            </GlassCard>
          ) : (
            <>
              <Section label="Last 14 nights">
                <GlassCard r={radius.lg} style={{ padding: 18, gap: space.md }}>
                  <NightlyBars data={nights} />
                </GlassCard>
                <View style={{ flexDirection: 'row', gap: space.sm }}>
                  <Stat value={`${nightsUsed}/${NIGHTS}`} label="nights used" />
                  <Stat value={formatSpan(weekSeconds)} label="this week" />
                  <Stat value={formatSpan(typicalNight)} label="typical night" />
                </View>
                {run > 1 ? (
                  <Text style={[t.meta, { color: color.ink58, lineHeight: 17 }]}>
                    {run} nights in a row. Regular use is the part that matters — the sound works
                    by being there, not by being loud.
                  </Text>
                ) : null}
              </Section>

              <Section label="When you reach for it">
                <GlassCard r={radius.lg} style={{ padding: 18, gap: space.md }}>
                  {slots.map((s) => {
                    const peak = Math.max(...slots.map((x) => x.seconds), 1);
                    const pct = s.seconds / peak;
                    return (
                      <View key={s.slot} style={{ gap: 6 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={[t.meta, { color: color.ink72 }]}>{SLOT_LABEL[s.slot]}</Text>
                          <Text style={[t.meta, { color: color.ink58, fontVariant: ['tabular-nums'] }]}>
                            {s.seconds > 0 ? formatSpan(s.seconds) : '—'}
                          </Text>
                        </View>
                        <View style={{ height: 5, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)' }}>
                          <View
                            style={{
                              width: `${Math.max(pct * 100, s.seconds > 0 ? 4 : 0)}%`,
                              height: '100%',
                              borderRadius: 999,
                              backgroundColor: color.accent,
                              opacity: s.seconds > 0 ? 0.8 : 0,
                            }}
                          />
                        </View>
                      </View>
                    );
                  })}
                  {busiest && busiest.seconds > 0 ? (
                    <Text style={[t.meta, { color: color.ink58, lineHeight: 17 }]}>
                      Mostly {SLOT_LABEL[busiest.slot].toLowerCase()}. Worth knowing if you are
                      deciding when to set aside quiet time.
                    </Text>
                  ) : null}
                </GlassCard>
              </Section>

              {top.length ? (
                <Section label="What you go back to">
                  <GlassCard r={radius.lg} style={{ overflow: 'hidden' }}>
                    {top.map((s, i) => (
                      <View
                        key={s.id}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: space.md,
                          minHeight: 54,
                          paddingHorizontal: 16,
                          borderTopWidth: i === 0 ? 0 : 1,
                          borderTopColor: 'rgba(255,255,255,0.07)',
                        }}
                      >
                        <Text style={[t.meta, { color: color.ink58, width: 14 }]}>{i + 1}</Text>
                        <Text style={{ fontFamily: font.medium, fontSize: 14.5, color: color.ink, flex: 1 }} numberOfLines={1}>
                          {s.name}
                        </Text>
                        <Text style={[t.meta, { color: color.ink62, fontVariant: ['tabular-nums'] }]}>
                          {formatSpan(s.seconds)}
                        </Text>
                      </View>
                    ))}
                  </GlassCard>
                </Section>
              ) : null}

              {avgVol !== null ? (
                <Section label="Listening level">
                  <GlassCard r={radius.lg} style={{ padding: 18, gap: space.sm }}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                      <Text style={{ fontFamily: font.display, fontSize: 22, color: color.ink, fontVariant: ['tabular-nums'] }}>
                        {avgVol}
                      </Text>
                      <Text style={[t.meta, { color: color.ink58 }]}>average volume</Text>
                    </View>
                    <View style={{ height: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                      <View
                        style={{
                          width: `${avgVol}%`,
                          height: '100%',
                          borderRadius: 999,
                          backgroundColor: avgVol > LOUD_THRESHOLD ? color.scaleMid : color.accent,
                          opacity: 0.85,
                        }}
                      />
                    </View>
                    <Text
                      style={[
                        t.meta,
                        { color: avgVol > LOUD_THRESHOLD ? color.scaleMid : color.ink58, lineHeight: 17 },
                      ]}
                    >
                      {avgVol > LOUD_THRESHOLD
                        ? 'Loud, night after night. Masking works better just under your tinnitus than over it, and long exposure at this level is worth avoiding.'
                        : 'Sitting under the level where masking starts to work against you.'}
                    </Text>
                  </GlassCard>
                </Section>
              ) : null}
            </>
          )}

          {/* The check-in lives on its own, whether or not there is listening
              history — it is the one measure that is about the tinnitus
              rather than about the app. */}
          <Section label="How much it gets in the way">
            <GlassCard r={radius.lg} style={{ padding: 18, gap: space.md }}>
              {trend ? (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 14 }}>
                    <Text
                      style={{
                        fontFamily: font.display,
                        fontSize: 34,
                        lineHeight: 36,
                        color: color.ink,
                        fontVariant: ['tabular-nums'],
                      }}
                    >
                      {trend.latest.value}
                      <Text style={{ fontSize: 18, color: color.ink58 }}> / 10</Text>
                    </Text>
                    <Text
                      style={[
                        t.meta,
                        {
                          color: trend.change < 0 ? color.scaleGood : trend.change > 0 ? color.scaleMid : color.ink58,
                          paddingBottom: 4,
                        },
                      ]}
                    >
                      {trend.change === 0
                        ? 'unchanged'
                        : `${trend.change < 0 ? '↓' : '↑'} ${Math.abs(trend.change)} since you started`}
                    </Text>
                  </View>

                  {/*
                    Every answer, oldest to newest, standing on a common
                    baseline — taller is worse. Hanging them from the top
                    read as coloured swatches rather than as a trend.
                  */}
                  <View style={{ gap: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, height: 76 }}>
                      {impacts.map((e, i) => (
                        <View
                          key={`${e.at}-${i}`}
                          style={{
                            flex: 1,
                            // Narrow enough to read as a bar. Wide ones with
                            // mid-range values looked like three swatches.
                            maxWidth: 20,
                            height: Math.max((e.value / 10) * 76, 6),
                            borderRadius: 4,
                            backgroundColor:
                              e.value <= 3 ? color.scaleGood : e.value <= 7 ? color.scaleMid : color.scaleBad,
                            // Only the current answer at full strength; the
                            // older ones are there for comparison.
                            opacity: i === impacts.length - 1 ? 0.95 : 0.35,
                          }}
                        />
                      ))}
                    </View>
                    <View style={{ height: 1, backgroundColor: color.ink, opacity: 0.12 }} />
                    {/* Dated at both ends, so the row is a timeline rather
                        than a set of numbers standing next to each other. */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={[t.meta, { color: color.ink58 }]}>{shortDate(trend.first.at)}</Text>
                      <Text style={[t.meta, { color: color.ink58 }]}>{shortDate(trend.latest.at)}</Text>
                    </View>
                  </View>

                  <Text style={[t.meta, { color: color.ink58, lineHeight: 17 }]}>
                    Your own answer, {trend.weeks} {trend.weeks === 1 ? 'week' : 'weeks'} apart. It
                    moves for many reasons — sleep, stress, a loud week at work — so read it as a
                    direction, not a score.
                  </Text>
                </>
              ) : (
                <>
                  <Text style={[t.body, { color: color.ink62, lineHeight: 21 }]}>
                    {tin.impact === null
                      ? 'You have not answered the check-in question yet. It is one question, and it is what every later comparison is measured against.'
                      : `You said ${tin.impact} out of 10. One answer is a starting point — the second one, a few weeks later, is what makes it a trend.`}
                  </Text>
                  {daysToCheckin !== null ? (
                    <Text style={[t.meta, { color: color.ink58 }]}>
                      {daysToCheckin === 0
                        ? 'The next check-in is ready now.'
                        : `Next check-in in ${daysToCheckin} ${daysToCheckin === 1 ? 'day' : 'days'}.`}
                    </Text>
                  ) : null}
                  <PressScale
                    onPress={() => {
                      setFlowMode(tin.impact === null ? 'edit' : 'checkin');
                      router.push('/(onboarding)/impact');
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={tin.impact === null ? 'Answer the check-in' : 'Check in now'}
                    style={{
                      minHeight: 46,
                      borderRadius: radius.md,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: color.accent,
                      boxShadow: glow(color.accent, 0.3, 20, 5),
                    }}
                  >
                    <Text style={{ fontFamily: t.card.fontFamily, fontSize: 14, color: color.onAccent }}>
                      {tin.impact === null ? 'Answer the question' : 'Check in now'}
                    </Text>
                  </PressScale>
                </>
              )}
            </GlassCard>
          </Section>

          <View style={{ gap: 4, alignItems: 'center' }}>
            <Text style={[t.meta, { color: color.ink58, textAlign: 'center', lineHeight: 17 }]}>
              Counted on this phone, and kept on it.
            </Text>
            <Text style={[t.meta, { color: color.ink58, textAlign: 'center', lineHeight: 17 }]}>
              A sound tool, not a medical device. None of this is a clinical measure.
            </Text>
          </View>

          <LinearGradient
            pointerEvents="none"
            colors={['rgba(7,10,22,0)', 'rgba(7,10,22,0)'] as const}
            style={{ height: 1 }}
          />
        </ScrollView>
      </View>
    </View>
  );
}
