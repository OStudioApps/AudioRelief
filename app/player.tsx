import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import { PressScale } from '../src/components/Motion';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import { Aurora } from '../src/components/Aurora';
import { Chip, RoundButton } from '../src/components/Glass';
import { Icon } from '../src/components/Icon';
import { artFor, formatDuration, TIMERS } from '../src/data/sounds';
import { usePlayer } from '../src/state';
import { LOUD_THRESHOLD } from '../src/audio/assets';
import { color, glow, motion, safe, space, type as t } from '../src/theme';

function Visualiser({
  colors,
  active,
  size,
}: {
  colors: readonly [string, string];
  active: boolean;
  /** Set from whatever height is left over, so the screen never has to scroll. */
  size: number;
}) {
  const rings = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  const breath = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) return;
    const loops = rings.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay((motion.breath / 3) * i),
          Animated.timing(v, { toValue: 1, duration: motion.breath, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        ]),
      ),
    );
    const b = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 1, duration: motion.breath / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(breath, { toValue: 0, duration: motion.breath / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loops.forEach((l) => l.start());
    b.start();
    return () => {
      loops.forEach((l) => l.stop());
      b.stop();
    };
  }, [active]);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        {rings.map((v, i) => (
          <Animated.View
            key={i}
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: size / 2,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.22)',
                opacity: active ? v.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 0.5, 0] }) : 0,
                transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1.5] }) }],
              },
            ]}
          />
        ))}
        <Animated.View
          style={{
            width: size * 0.79,
            height: size * 0.79,
            borderRadius: (size * 0.79) / 2,
            overflow: 'hidden',
            boxShadow: glow(colors[0], 0.4, 56, 0),
            transform: [{ scale: breath.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.06] }) }],
          }}
        >
          <LinearGradient
            colors={colors as unknown as readonly [string, string]}
            start={{ x: 0.35, y: 0.2 }}
            end={{ x: 0.9, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
    </View>
  );
}

/**
 * The head of a control group: one uppercase label, with an optional plain
 * reading on the right. One component so the three groups cannot drift into
 * three different sizes, colours and alignments — which is what they had.
 */
function SectionHead({ label, value }: { label: string; value?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
      <Text style={[t.label, { color: color.ink58 }]}>{label}</Text>
      {value ? <Text style={[t.meta, { color: color.ink58 }]}>{value}</Text> : null}
    </View>
  );
}

export default function Player() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const p = usePlayer();
  // Not the selection id: a saved mix borrows its first sound's photograph.
  const art = artFor(p.artId);
  // How far through the session we are — the timeline fills as it runs.
  const elapsedPct =
    p.timerTotal > 0 ? Math.max(0, Math.min(1, 1 - p.timerRemaining / p.timerTotal)) : 0;

  // Starts at 0 so the first paint has no orb rather than an oversized one;
  // the real value lands on the next frame from onLayout.
  const [orbBox, setOrbBox] = useState(0);
  const orb = Math.max(0, Math.min(196, orbBox - 24));
  /*
    Below this the orb is a speck, which reads as a bug rather than as a
    visualiser. It is the one decorative element on the screen, so on a very
    short phone it gives up its place entirely and the space becomes plain
    breathing room above the controls.
  */
  const showOrb = orb >= 72;

  /*
    Short phones get a tighter version of the same screen. Without this the
    controls eat the whole height and the orb is squeezed down to a dot — the
    controls have to fit, so everything else gives up a few points instead.

    Measured from the frame rather than read from the window: the frame is what
    the layout actually has to fit inside, already minus the safe areas. The
    frame's own height does not depend on this flag, so there is no loop.
  */
  const [frameH, setFrameH] = useState(0);
  const tight = frameH > 0 && frameH < 660;

  /*
    Two spacing steps, and only two: `space.sm` holds a group together and
    `section` separates one group from the next. Every gap on this screen was a
    different hand-picked number before, all of them close to each other, so
    nothing looked grouped — the label of one section sat as far from its own
    controls as it did from the section above.
  */
  const section = tight ? space.lg : space.xl;

  return (
    <View style={{ flex: 1, backgroundColor: color.ground }}>
      <Aurora
        blobs={[
          { size: 340, color: p.colors[0], opacity: 0.38, left: -60, top: 40, duration: motion.driftFast },
          { size: 300, color: color.accent, opacity: 0.24, right: -100, top: -40, dx: -28, dy: 30, duration: motion.driftSlow },
          { size: 300, color: color.violet, opacity: 0.24, left: 60, bottom: -160 },
        ]}
        scrim={['rgba(7,10,22,0.44)', 'rgba(7,10,22,0.28)', 'rgba(7,10,22,0.86)']}
      />

      {/*
        The same photograph as the sound's card, carried into the player so it
        reads as opening that card rather than arriving somewhere new. Held
        well back, and graded darker toward the bottom where the controls sit.
      */}
      {art ? (
        <>
          <Image
            source={art}
            style={[StyleSheet.absoluteFill, { width: '100%', height: '100%', opacity: 0.4 }]}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(7,10,22,0.35)', 'rgba(7,10,22,0.55)', 'rgba(7,10,22,0.92)']}
            locations={[0, 0.45, 1]}
            style={StyleSheet.absoluteFill}
          />
        </>
      ) : null}

      <View
        style={{
          flex: 1,
          paddingTop: Math.max(insets.top, safe.top),
          paddingBottom: Math.max(insets.bottom, safe.bottom),
          paddingHorizontal: safe.side,
        }}
        onLayout={(e) => setFrameH(e.nativeEvent.layout.height)}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
          <RoundButton onPress={() => router.back()} label="Back">
            <Icon name="chevronDown" />
          </RoundButton>
          <Text style={[t.label, { color: color.ink58 }]}>{p.playing ? 'Playing' : 'Paused'}</Text>
          {/*
            There was a mixer button here with no action wired to it. The
            layers button beside play already opens the mixer, so rather than
            a second route to the same place, the slot is left empty — the
            spacer only keeps the label centred.
          */}
          <View style={{ width: 44 }} />
        </View>

        {/*
          One screenful, never a scroll. The controls are a fixed block at the
          bottom and the orb takes whatever height is left above them, measured
          rather than guessed — a hard-coded orb pushed the play button off the
          bottom of shorter phones.
        */}
        <View
          style={{ flex: 1, minHeight: 0, alignItems: 'center', justifyContent: 'center' }}
          onLayout={(e) => setOrbBox(e.nativeEvent.layout.height)}
        >
          {showOrb ? <Visualiser colors={p.colors} active={p.playing} size={orb} /> : null}
        </View>

        <View style={{ gap: section }}>
          {/*
            What is playing. Centred under the orb and the only display-size
            text here, so the eye lands on the sound's name first.
          */}
          <View style={{ alignItems: 'center', gap: space.xs }}>
            <Text
              style={[
                tight ? t.screen : t.title,
                { color: color.ink, textAlign: 'center' },
              ]}
            >
              {p.title}
            </Text>
            <Text style={[t.bodyMuted, { color: color.ink62, textAlign: 'center' }]}>{p.subtitle}</Text>
          </View>

          {/*
            Other recordings of the same subject. Hidden entirely for the
            generated noises, which are a single defined signal each.
          */}
          {p.channels.length > 1 ? (
            <View style={{ gap: space.sm }}>
              <SectionHead label="Channels" />
              <View style={{ flexDirection: 'row', gap: space.sm }}>
                {/* Numbered on screen. The descriptive names stay in the
                    data as a brief for which recording to source. */}
                {p.channels.map((c, i) => (
                  <Chip
                    key={c.id}
                    label={`Channel ${i + 1}`}
                    selected={p.channel === c.id}
                    onPress={() => p.setChannel(c.id)}
                    style={{ flex: 1, paddingHorizontal: 6 }}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {/*
            The sleep timer. The reading, its bar and the three lengths are one
            group — the lengths used to float between this group and the volume
            with no way to tell which they belonged to.
          */}
          <View style={{ gap: space.sm }}>
            <SectionHead label="Sleep timer" value={p.timerFade} />

            {/*
              Re-picking the length someone is already on restarts the
              countdown, so a separate Restart button was a second door to the
              same room.
            */}
            <Text
              accessibilityLabel={`${formatDuration(p.timerRemaining)} left`}
              style={[
                tight ? t.title : t.screen,
                {
                  color: color.ink,
                  // Without tabular figures the countdown jitters sideways
                  // every second as digit widths change.
                  fontVariant: ['tabular-nums'],
                },
              ]}
            >
              {formatDuration(p.timerRemaining)}
            </Text>

            {/*
              A timeline of the session, not an audio scrub — white noise
              has no position to seek to. It runs left to right: filled
              behind you, empty ahead, a playhead where you are now, and the
              two ends labelled so the line says what it is measuring. It
              used to be a bare bar that drained right-to-left, which read
              as a battery.
            */}
            <View style={{ gap: 7 }}>
              <View style={{ height: 14, justifyContent: 'center' }}>
                <View style={{ height: 4, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.10)' }}>
                  <LinearGradient
                    colors={[color.accent, p.colors[0]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ width: `${elapsedPct * 100}%`, height: '100%', borderRadius: 999 }}
                  />
                </View>
                {/* The playhead. Pulled back by half its width so its centre
                    sits on the mark rather than its left edge. */}
                <View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    left: `${elapsedPct * 100}%`,
                    marginLeft: -6,
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: color.ink,
                    boxShadow: glow(color.accent, 0.45, 12, 0),
                  }}
                />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={[t.meta, { color: color.ink58, fontVariant: ['tabular-nums'] }]}>
                  {formatDuration(p.timerTotal - p.timerRemaining)}
                </Text>
                <Text style={[t.meta, { color: color.ink58, fontVariant: ['tabular-nums'] }]}>
                  {formatDuration(p.timerTotal)}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.xs }}>
              {TIMERS.map((x) => (
                <Chip
                  key={x.id}
                  label={x.label}
                  selected={p.timer === x.id}
                  onPress={() => p.setTimer(x.id)}
                  style={{ flex: 1 }}
                />
              ))}
            </View>
          </View>

          <View style={{ gap: space.sm }}>
            {/* The number is here so last night's setting can be found again. */}
            <SectionHead label="Volume" value={String(p.volume)} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <Icon name="volume" size={18} color={color.ink58} />
              <Slider
                style={{ flex: 1, height: 40 }}
                accessibilityLabel="Volume"
                minimumValue={0}
                maximumValue={100}
                step={1}
                value={p.volume}
                onValueChange={(v) => p.setVolume(Math.round(v))}
                minimumTrackTintColor={color.accent}
                maximumTrackTintColor="rgba(255,255,255,0.14)"
                thumbTintColor={color.ink}
              />
              <Icon name="volumeHigh" size={18} color={color.ink58} />
            </View>
            {p.volume > LOUD_THRESHOLD ? (
              <Text style={[t.meta, { color: color.scaleMid }]}>
                Loud enough to matter over a full night. Masking works better just under your
                tinnitus, not over it.
              </Text>
            ) : null}
          </View>

          {/*
            One control, centred. The layers button and the heart both used to
            sit here: the first duplicated the Mix tab, and the second saved to
            a list that does not exist anywhere in the app. A button that
            pretends to remember something is worse than no button.
          */}
          <View style={{ alignItems: 'center' }}>
            <PressScale
              onPress={p.togglePlay}
              accessibilityRole="button"
              accessibilityLabel={p.playing ? 'Pause' : 'Play'}
              style={{
                // Never below the 44pt minimum, tight screen or not.
                width: tight ? 68 : 78,
                height: tight ? 68 : 78,
                borderRadius: tight ? 34 : 39,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: color.accent,
                boxShadow: glow(color.accent, 0.36, 28, 8),
              }}
            >
              <Icon name={p.playing ? 'pause' : 'play'} size={26} color={color.onAccent} />
            </PressScale>
          </View>
        </View>
      </View>
    </View>
  );
}
