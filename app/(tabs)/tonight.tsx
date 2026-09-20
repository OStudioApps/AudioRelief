import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Aurora } from '../../src/components/Aurora';
import { GlassCard, RoundButton, SectionLabel } from '../../src/components/Glass';
import { Icon } from '../../src/components/Icon';
import { FadeIn, PressScale, useReducedMotion } from '../../src/components/Motion';
import { usePlayer } from '../../src/state';
import { useTinnitus } from '../../src/tinnitus';
import { artFor, MIXES, MIX_ART, NOISES, soundById } from '../../src/data/sounds';
import {
  alternativeTo,
  CHECKIN_DAYS,
  checkinDue,
  LEVEL_GUIDANCE,
  pickByPitch,
  profileSummary,
  timingFor,
} from '../../src/data/recommend';
import { setFlowMode } from '../../src/onboardingFlow';
import { color, font, glow, motion, radius, rgba, safe, type as t } from '../../src/theme';

const TAB_CLEARANCE = 118;

/** Evening is the common case, but this app is used at 3am and at a desk too. */
function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Still awake';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function BreathingHalo({ tint, active }: { tint: string; active: boolean }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: motion.breath / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: motion.breath / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, v]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        right: -50,
        top: -60,
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: tint,
        opacity: active ? v.interpolate({ inputRange: [0, 1], outputRange: [0.22, 0.4] }) : 0.16,
        transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] }) }],
      }}
    />
  );
}

/**
 * One of the four generated noises.
 *
 * Each of these is a different signal, so each tile carries its own colour
 * rather than four identical grey boxes with a dot in them: the sound's
 * gradient as a glowing bead, the same colour washed faintly across the tile
 * behind it, and a light ring to give the bead some glass.
 *
 * The one actually playing breathes, on the same 7-second cycle as the orb
 * in the player — the app's one piece of shared body language for "this is
 * the sound you are hearing".
 */
function NoiseTile({
  name,
  colors,
  selected,
  playing,
  suggested,
  onPress,
}: {
  name: string;
  colors: readonly [string, string];
  selected: boolean;
  playing: boolean;
  suggested: boolean;
  onPress: () => void;
}) {
  const breath = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!playing || reduced) {
      breath.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: motion.breath / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: motion.breath / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [playing, reduced, breath]);

  return (
    <PressScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name} noise`}
      accessibilityState={{ selected }}
      style={{
        flex: 1,
        minHeight: 88,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        borderRadius: radius.md,
        overflow: 'hidden',
        backgroundColor: selected ? 'rgba(255,255,255,0.075)' : 'rgba(255,255,255,0.03)',
        borderWidth: 1.5,
        borderColor: selected ? color.accent : suggested ? 'rgba(95,224,210,0.35)' : 'rgba(255,255,255,0.07)',
      }}
    >
      {/* The sound's own colour, washed up from the bead and fading out
          before the top edge so the tiles still read as a set. */}
      <LinearGradient
        pointerEvents="none"
        colors={['transparent', rgba(colors[0], selected ? 0.22 : 0.13)] as const}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          boxShadow: glow(colors[0], selected ? 0.5 : 0.32, selected ? 20 : 14, 0),
          transform: [{ scale: breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] }) }],
        }}
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0.2, y: 0.05 }}
          end={{ x: 0.9, y: 1 }}
          style={{ width: '100%', height: '100%', borderRadius: 17 }}
        />
        {/* A hairline highlight: without it the bead is a flat disc, with it
            it reads as something with a surface. */}
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: 17, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
          ]}
        />
      </Animated.View>

      <Text style={{ fontFamily: font.semibold, fontSize: 12, color: selected ? color.ink : color.ink82 }}>
        {name}
      </Text>
    </PressScale>
  );
}

/**
 * Thirty dots, one per day since the last impact answer.
 *
 * A bar would read as a task to finish. Dots read as a calendar — days
 * passing, which is what this actually is. It is glanceable without being a
 * demand: nothing is owed until the row fills.
 */
function DayDots({ elapsed }: { elapsed: number }) {
  const filled = Math.min(Math.max(elapsed, 0), CHECKIN_DAYS);

  return (
    <View style={{ flexDirection: 'row', gap: 3, alignItems: 'center' }}>
      {Array.from({ length: CHECKIN_DAYS }).map((_, i) => {
        const on = i < filled;
        // The most recent day gets a touch more presence, so the eye lands
        // on where you are rather than on the whole block.
        const latest = on && i === filled - 1;
        return (
          <View
            key={i}
            style={{
              flex: 1,
              height: latest ? 9 : 7,
              borderRadius: 999,
              backgroundColor: on ? color.accent : 'rgba(255,255,255,0.10)',
              opacity: on ? (latest ? 1 : 0.55) : 1,
            }}
          />
        );
      })}
    </View>
  );
}

/**
 * The artwork behind the now-playing card, cross-fading when the sound changes.
 *
 * The incoming image is drawn plain, at its resting opacity, and the outgoing
 * one is laid over it and faded away. Done the other way round — fading the
 * new one in from zero — a stalled animation would leave the card blank. This
 * way the worst case is a stale image lingering for a moment, and a timer
 * clears even that.
 *
 * Anything without artwork falls back to the card's plain glass.
 */
function NowPlayingBackdrop({ source }: { source: number | null }) {
  const [layers, setLayers] = useState<{ current: number | null; leaving: number | null }>({
    current: source,
    leaving: null,
  });
  const fade = useRef(new Animated.Value(0)).current;
  const lastSource = useRef(source);

  useEffect(() => {
    if (lastSource.current === source) return;
    const outgoing = lastSource.current;
    lastSource.current = source;

    setLayers({ current: source, leaving: outgoing });
    fade.setValue(1);

    const anim = Animated.timing(fade, {
      toValue: 0,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start(({ finished }) => {
      if (finished) setLayers((l) => ({ ...l, leaving: null }));
    });

    // Backstop, in case the animation never reports finishing.
    const rescue = setTimeout(() => setLayers((l) => ({ ...l, leaving: null })), 1100);

    return () => {
      anim.stop();
      clearTimeout(rescue);
    };
  }, [source, fade]);

  if (!layers.current && !layers.leaving) return null;

  return (
    <>
      {layers.current ? (
        <Image
          source={layers.current}
          style={[StyleSheet.absoluteFill, { width: '100%', height: '100%', opacity: 0.6 }]}
          resizeMode="cover"
        />
      ) : null}

      {layers.leaving ? (
        <Animated.Image
          source={layers.leaving}
          style={[
            StyleSheet.absoluteFill,
            {
              width: '100%',
              height: '100%',
              opacity: fade.interpolate({ inputRange: [0, 1], outputRange: [0, 0.6] }),
            },
          ]}
          resizeMode="cover"
        />
      ) : null}

      <LinearGradient
        colors={['rgba(7,10,22,0.34)', 'rgba(7,10,22,0.88)']}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </>
  );
}

/** One recommended sound, with the reason it is being suggested. */
function SoundSuggestion({
  id,
  reason,
  lead,
  onPress,
}: {
  id: string;
  reason: string;
  lead: boolean;
  onPress: () => void;
}) {
  const sound = soundById(id);
  if (!sound) return null;

  return (
    <PressScale
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 13,
        padding: 14,
        borderRadius: radius.md,
        backgroundColor: lead ? 'rgba(95,224,210,0.08)' : 'rgba(255,255,255,0.04)',
        borderWidth: 1.5,
        borderColor: lead ? 'rgba(95,224,210,0.45)' : color.glassBorder,
      }}
    >
      <LinearGradient
        colors={sound.colors as unknown as readonly [string, string]}
        start={{ x: 0.2, y: 0.1 }}
        end={{ x: 1, y: 1 }}
        style={{ width: 38, height: 38, borderRadius: 19 }}
      />
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[t.card, { color: color.ink, fontSize: 14.5 }]}>{sound.name}</Text>
        <Text style={[t.meta, { color: color.ink62, lineHeight: 17 }]}>{reason}</Text>
      </View>
      <Icon name="play" size={16} color={lead ? color.accent : color.ink58} />
    </PressScale>
  );
}

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const p = usePlayer();
  const tin = useTinnitus();

  const pick = pickByPitch(tin.hz, tin.character);
  const alt = alternativeTo(pick, tin.hz);
  const timing = timingFor(tin.pattern);
  const dueForCheckin = checkinDue(tin.daysSinceImpact);
  const [open, setOpen] = useState(false);

  // Every sound has artwork now — mixes, library sounds and the noises —
  // so whatever is selected, from home or from the Sounds tab, shows here.
  // artId, not the selection: a saved mix shows its first sound's photograph.
  const nowPlayingArt = artFor(p.artId);

  const startNoise = (id: string) => {
    p.select({ kind: 'noise', id });
    router.push('/player');
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.ground }}>
      <Aurora
        blobs={[
          { size: 300, color: p.colors[0], opacity: 0.34, left: -70, top: -60, duration: motion.driftFast },
          { size: 260, color: color.accent, opacity: 0.22, right: -90, top: 120, dx: -30, dy: 26, duration: motion.driftSlow },
          { size: 320, color: color.violet, opacity: 0.26, left: 40, bottom: -140 },
        ]}
        scrim={['rgba(7,10,22,0.06)', 'rgba(7,10,22,0.56)', 'rgba(7,10,22,0.86)']}
      />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, safe.top),
          paddingHorizontal: safe.side,
          paddingBottom: TAB_CLEARANCE,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 46 }}>
          <View style={{ gap: 3 }}>
            <Text style={[t.label, { color: color.ink58, fontSize: 12 }]}>AudioRelief</Text>
            <Text style={{ fontFamily: font.display, fontSize: 20, color: color.ink, letterSpacing: -0.3 }}>
              {greeting()}
            </Text>
          </View>
          {/*
            A chart, not a moon: this opens usage rather than a night mode,
            and a crescent here read as a dark-mode toggle. The dot is the
            notification channel — anything waiting surfaces on that screen.
          */}
          <View>
            <RoundButton label="Your dashboard" onPress={() => router.push('/dashboard')}>
              <Icon name="dashboard" />
            </RoundButton>
            {dueForCheckin ? (
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: 1,
                  right: 1,
                  width: 11,
                  height: 11,
                  borderRadius: 6,
                  backgroundColor: color.accent,
                  borderWidth: 2,
                  borderColor: color.ground,
                }}
              />
            ) : null}
          </View>
        </View>

        <View style={{ height: 20 }} />

        {/*
          A glanceable strip, not the full explanation. The detail lives at
          the bottom of this screen, folded away: the home screen should open
          quietly, and a wall of guidance every single launch is a cost paid
          daily for something read once.
        */}
        {!tin.loaded ? (
          <GlassCard r={radius.lg} style={{ minHeight: 84 }} />
        ) : !tin.hasProfile ? (
          <FadeIn delay={60}>
            <GlassCard r={radius.lg} style={{ padding: 18, gap: 12 }}>
              <Text style={[t.card, { color: color.ink, fontSize: 15.5 }]}>
                Tell us what yours sounds like
              </Text>
              <Text style={[t.body, { color: color.ink62, fontSize: 13.5, lineHeight: 20 }]}>
                Two minutes — what it sounds like, roughly what pitch, and when it is hardest. The
                app uses that to pick sounds that sit closer to yours.
              </Text>
              <PressScale
                onPress={() => {
                  setFlowMode('edit');
                  router.push('/(onboarding)/sound');
                }}
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
                  Set up my profile
                </Text>
              </PressScale>
            </GlassCard>
          </FadeIn>
        ) : null}

        {/* The day count now lives with the profile card at the foot of the
            page, so the top opens straight onto what is playing. */}
        {!tin.loaded || !tin.hasProfile ? <View style={{ height: 20 }} /> : null}

        <FadeIn delay={140}>
          <PressScale onPress={() => router.push('/player')}>
            <GlassCard r={radius.xl} style={{ minHeight: 168, padding: 20, justifyContent: 'space-between' }}>
              <NowPlayingBackdrop source={nowPlayingArt} />
              <BreathingHalo tint={p.colors[0]} active={p.playing} />
              <Text style={[t.label, { color: color.ink58 }]}>
                {p.playing ? 'Playing now' : 'Pick up where you left off'}
              </Text>
              <View style={{ gap: 6, marginTop: 10 }}>
                <Text style={{ fontFamily: font.display, fontSize: 22, color: color.ink, letterSpacing: -0.5, lineHeight: 26 }}>
                  {p.title}
                </Text>
                <Text style={[t.bodyMuted, { color: color.ink62 }]}>{p.subtitle}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 14 }}>
                <PressScale
                  onPress={(e) => {
                    e.stopPropagation();
                    p.togglePlay();
                  }}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: color.accent,
                    boxShadow: glow(color.accent, 0.34, 22, 6),
                  }}
                >
                  <Icon name={p.playing ? 'pause' : 'play'} color={color.onAccent} />
                </PressScale>
                <Text style={[t.meta, { color: color.ink58, fontSize: 12 }]}>{p.fade}</Text>
              </View>
            </GlassCard>
          </PressScale>
        </FadeIn>

        <View style={{ height: 20 }} />

        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <SectionLabel>Everything else</SectionLabel>
          <Text style={{ fontFamily: t.body.fontFamily, fontSize: 13, color: color.ink58 }}>Mixes</Text>
        </View>

        <View style={{ height: 10 }} />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {MIXES.map((m) => {
            const on = p.selection.kind === 'mix' && p.selection.id === m.id;
            const art = MIX_ART[m.id];
            return (
              <PressScale
                key={m.id}
                onPress={() => p.select({ kind: 'mix', id: m.id })}
                style={{
                  width: '47.5%',
                  flexGrow: 1,
                  minHeight: 112,
                  borderRadius: radius.lg,
                  overflow: 'hidden',
                  backgroundColor: on ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.045)',
                  borderWidth: 1.5,
                  borderColor: on ? color.accent : color.glassBorder,
                }}
              >
                {/*
                  The photograph is atmosphere, not content — held well back so
                  the card still reads as part of the dark glass system rather
                  than becoming a bright tile. The scrim on top guarantees the
                  text stays legible whatever the picture is doing underneath.
                */}
                {art ? (
                  <>
                    <Image
                      source={art.image}
                      style={[StyleSheet.absoluteFill, { width: '100%', height: '100%', opacity: 0.3 }]}
                      resizeMode="cover"
                    />
                    <LinearGradient
                      colors={['rgba(7,10,22,0.30)', 'rgba(7,10,22,0.86)']}
                      start={{ x: 0.2, y: 0 }}
                      end={{ x: 0.6, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                  </>
                ) : null}

                <View style={{ flex: 1, padding: 14, justifyContent: 'space-between' }}>
                  <Icon name={art?.icon ?? 'waves'} size={22} color={on ? color.accent : color.ink82} />
                  <View style={{ gap: 3, marginTop: 12 }}>
                    <Text style={[t.card, { color: color.ink, fontSize: 14, lineHeight: 18 }]}>{m.name}</Text>
                    <Text style={[t.meta, { color: color.ink62 }]}>{m.sub}</Text>
                  </View>
                </View>
              </PressScale>
            );
          })}
        </View>

        <View style={{ height: 18 }} />

        <SectionLabel>Steady noise</SectionLabel>

        <View style={{ height: 10 }} />

        <View style={{ flexDirection: 'row', gap: 10 }}>
          {NOISES.map((n) => {
            const on = p.selection.kind === 'noise' && p.selection.id === n.id;
            const suggested = tin.hasProfile && n.id === pick.id;
            return (
              <NoiseTile
                key={n.id}
                name={n.name}
                colors={n.colors as unknown as readonly [string, string]}
                selected={on}
                playing={on && p.playing}
                suggested={suggested}
                onPress={() => p.select({ kind: 'noise', id: n.id })}
              />
            );
          })}
        </View>

        {tin.loaded && tin.hasProfile ? (
          <>
            {/*
              Everything above this line is the catalogue — things to play.
              Everything below it is about the person: what suits their
              tinnitus, and the check-in. Same 18px gap as the sections above
              made it read as one more row of the same list, so the change of
              subject gets a wider gap and a hairline. No heading: the card
              underneath already says "For your tinnitus", and printing that
              twice would be worse than not marking it at all.
            */}
            <View style={{ height: 26 }} />
            <View style={{ height: 1, backgroundColor: color.ink, opacity: 0.08 }} />
            <View style={{ height: 22 }} />

            {/*
              Folded shut by default. Someone opening the app at 3am wants a
              sound, not a briefing — but the reasoning has to be reachable,
              or the app is just asserting things at people.
            */}
            <View
              style={{
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: color.glassBorder,
                backgroundColor: 'rgba(255,255,255,0.035)',
                overflow: 'hidden',
              }}
            >
              <PressScale
                onPress={() => setOpen((o) => !o)}
                accessibilityRole="button"
                accessibilityLabel="For your tinnitus"
                accessibilityState={{ expanded: open }}
                accessibilityHint={open ? 'Collapses your suggestions' : 'Shows sounds picked for you'}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: 16,
                  minHeight: 56,
                }}
              >
                {/* A small brain mark: the card is the one place the app
                    speaks about the person rather than the catalogue, and
                    the header was pure text against four picture cards. */}
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: rgba(color.accent, 0.12),
                    borderWidth: 1,
                    borderColor: rgba(color.accent, 0.3),
                  }}
                >
                  <Icon name="brain" size={17} color={color.accent} />
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={[t.card, { color: color.ink, fontSize: 14.5 }]}>For your tinnitus</Text>
                  <Text style={[t.meta, { color: color.ink58 }]} numberOfLines={1}>
                    {open
                      ? profileSummary(tin.character, tin.hz, tin.toneUnknown)
                      : `${profileSummary(tin.character, tin.hz, tin.toneUnknown)} · 2 picks`}
                  </Text>
                </View>
                <Icon name={open ? 'chevronDown' : 'chevronRight'} size={16} color={color.ink58} />
              </PressScale>

              {open ? (
                /*
                  Two kinds of thing live in here and they used to be one flat
                  list: sounds you can start, and advice about how to use
                  them. They are now grouped and labelled, so the eye can go
                  straight to the thing it can act on.

                  A "Signed in as / Sign out" row also used to sit at the
                  bottom of this card. Sign-out belongs in Account, not inside
                  a card about somebody's tinnitus.
                */
                <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 16 }}>
                  <View style={{ gap: 8 }}>
                    <Text style={[t.label, { color: color.ink58 }]}>Start with</Text>
                    <SoundSuggestion id={pick.id} reason={pick.reason} lead onPress={() => startNoise(pick.id)} />
                    <SoundSuggestion id={alt.id} reason={alt.reason} lead={false} onPress={() => startNoise(alt.id)} />
                  </View>

                  {/* Advice, set back in its own inset panel so it reads as
                      guidance rather than as two more tappable rows. */}
                  <View
                    style={{
                      gap: 12,
                      padding: 14,
                      borderRadius: radius.md,
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      borderWidth: 1,
                      borderColor: color.glassBorder,
                    }}
                  >
                    <Text style={[t.label, { color: color.ink58 }]}>How to use it</Text>

                    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                      <Icon name="volumeLow" size={17} color={color.accent} />
                      <Text style={[t.meta, { color: color.ink62, flex: 1, lineHeight: 17 }]}>
                        {LEVEL_GUIDANCE}
                      </Text>
                    </View>

                    {timing ? (
                      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                        <Icon name="clock" size={17} color={color.accent} />
                        <Text style={[t.meta, { color: color.ink62, flex: 1, lineHeight: 17 }]}>{timing}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* The one thing here that is not about sound. It keeps the
                      warning colour and an icon, so it cannot be skimmed as
                      more advice. */}
                  {tin.character === 'pulsing' ? (
                    <View
                      style={{
                        flexDirection: 'row',
                        gap: 10,
                        padding: 12,
                        borderRadius: radius.sm,
                        backgroundColor: rgba(color.scaleMid, 0.1),
                        borderWidth: 1,
                        borderColor: rgba(color.scaleMid, 0.28),
                      }}
                    >
                      <Icon name="heart" size={16} color={color.scaleMid} />
                      <Text style={[t.meta, { color: color.scaleMid, flex: 1, lineHeight: 17 }]}>
                        You said yours pulses with your heartbeat. That one is worth having a doctor
                        look at — sound can still help meanwhile.
                      </Text>
                    </View>
                  ) : null}

                  {/* A full-width row with a real touch target. It was a 13px
                      text link with no padding, well under 44pt. */}
                  <View style={{ height: 1, backgroundColor: color.ink, opacity: 0.07 }} />
                  <PressScale
                    onPress={() => {
                      setFlowMode('edit');
                      router.push('/(onboarding)/sound');
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Edit my tinnitus profile"
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      minHeight: 44,
                    }}
                  >
                    <Icon name="refresh" size={16} color={color.ink58} />
                    <Text style={{ fontFamily: t.body.fontFamily, fontSize: 13.5, color: color.ink82, flex: 1 }}>
                      Edit my answers
                    </Text>
                    <Icon name="chevronRight" size={15} color={color.ink58} />
                  </PressScale>
                </View>
              ) : null}
            </View>

            {/*
              Sat directly beneath the profile card rather than floating at
              the top: the day count only means anything next to the thing it
              is counting towards. Tight gap so the two read as one block.
            */}
            <View style={{ height: 8 }} />

            <PressScale
              onPress={() => {
                if (!dueForCheckin) return;
                setFlowMode('checkin');
                router.push('/(onboarding)/impact');
              }}
              disabled={!dueForCheckin}
              style={{
                padding: 16,
                gap: 12,
                borderRadius: radius.lg,
                backgroundColor: 'rgba(255,255,255,0.035)',
                borderWidth: 1,
                borderColor: dueForCheckin ? 'rgba(95,224,210,0.4)' : color.glassBorder,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Icon name={dueForCheckin ? 'refresh' : 'clock'} size={16} color={color.accent} />
                <Text style={{ fontFamily: font.semibold, fontSize: 13.5, color: color.ink, flex: 1 }}>
                  {dueForCheckin
                    ? 'Time for a check-in'
                    : tin.daysSinceImpact === null
                      ? 'Your next check-in'
                      : `Day ${tin.daysSinceImpact} of ${CHECKIN_DAYS}`}
                </Text>
                {dueForCheckin ? <Icon name="chevronRight" size={15} color={color.ink58} /> : null}
              </View>

              <DayDots elapsed={tin.daysSinceImpact ?? 0} />

              <Text style={[t.meta, { color: color.ink58 }]}>
                {tin.daysSinceImpact === null
                  ? `We will ask how it is going in ${CHECKIN_DAYS} days`
                  : dueForCheckin
                    ? `${tin.daysSinceImpact} days since you last told us. One question.`
                    : `${CHECKIN_DAYS - tin.daysSinceImpact} days until we ask how it is going`}
              </Text>
            </PressScale>
          </>
        ) : null}

      </ScrollView>
    </View>
  );
}
