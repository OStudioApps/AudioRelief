import React, { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import { Aurora } from '../src/components/Aurora';
import { RoundButton } from '../src/components/Glass';
import { Icon, IconName } from '../src/components/Icon';
import { PressScale } from '../src/components/Motion';
import { PlayerOptionsSheet } from '../src/components/PlayerOptionsSheet';
import { SleepTimerSheet } from '../src/components/SleepTimerSheet';
import { useNowPlaying } from '../src/audio/nowPlaying';
import { useTrackPlayer, useTrackProgress } from '../src/audio/tracks';
import { formatClock } from '../src/data/library';
import { useMixes } from '../src/mixes';
import { useAdminMixes } from '../src/data/adminMixes';
import { usePlayer } from '../src/state';
import { color, glow, motion, radius, safe, space, type as t } from '../src/theme';

/** A secondary transport control; `on` lights it and adds a dot under it, as music apps do. */
function ModeButton({
  icon,
  on,
  label,
  onPress,
}: {
  icon: IconName;
  on: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <PressScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: on }}
      hitSlop={6}
      scaleTo={0.88}
      style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
    >
      <Icon name={icon} size={22} color={on ? color.accent : color.ink62} strokeWidth={on ? 2 : 1.7} />
      <View
        style={{
          position: 'absolute',
          bottom: 3,
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: on ? color.accent : 'transparent',
        }}
      />
    </PressScale>
  );
}

/** Keeps the transport row centred when a side slot has nothing to show. */
const Spacer = () => <View style={{ width: 44, height: 44 }} />;

/** The scrub bar. Holds its own value while the thumb is down so playback updates don't fight the finger. */
function Scrubber({ onSeek, tint }: { onSeek: (s: number) => void; tint: string }) {
  const { position, duration } = useTrackProgress();
  const [scrub, setScrub] = useState<number | null>(null);
  const shown = scrub ?? position;
  const max = Math.max(duration, 1);

  return (
    <View>
      <Slider
        style={{ height: 32, marginHorizontal: -6 }}
        accessibilityLabel="Position in track"
        minimumValue={0}
        maximumValue={max}
        value={Math.min(shown, max)}
        disabled={duration <= 0}
        onSlidingStart={(v) => setScrub(v)}
        onValueChange={(v) => scrub != null && setScrub(v)}
        onSlidingComplete={(v) => {
          onSeek(v);
          setScrub(null);
        }}
        minimumTrackTintColor={tint}
        maximumTrackTintColor="rgba(255,255,255,0.16)"
        thumbTintColor={color.ink}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={[t.meta, { color: color.ink58, fontVariant: ['tabular-nums'] }]}>{formatClock(shown)}</Text>
        <Text style={[t.meta, { color: color.ink58, fontVariant: ['tabular-nums'] }]}>
          {duration > 0 ? `-${formatClock(duration - shown)}` : '--:--'}
        </Text>
      </View>
    </View>
  );
}

/**
 * Where the scrub bar sits for a loop. A noise or a mix has no position to
 * scrub — it is the same sound forever — so the bar shows the one length that
 * does exist: how far through the sleep timer the night is.
 */
function LoopBar({ tint }: { tint: string }) {
  const p = usePlayer();
  const timed = p.sleepTotal != null && p.sleepRemaining != null;
  const f = timed ? 1 - p.sleepRemaining! / p.sleepTotal! : 0;

  return (
    <View>
      <View style={{ height: 32, justifyContent: 'center' }}>
        <View style={{ height: 4, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.16)', overflow: 'hidden' }}>
          <View style={{ width: `${Math.max(0, Math.min(1, f)) * 100}%`, height: '100%', backgroundColor: tint }} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={[t.meta, { color: color.ink58 }]}>Loops seamlessly</Text>
        <Text style={[t.meta, { color: color.ink58, fontVariant: ['tabular-nums'] }]}>
          {timed ? `-${formatClock(p.sleepRemaining!)}` : 'No end'}
        </Text>
      </View>
    </View>
  );
}

/** One player for everything: library tracks, steady noise and mixes. */
export default function Player() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const np = useNowPlaying();
  const tp = useTrackPlayer();
  const p = usePlayer();
  const { mixes } = useMixes();
  const [sheet, setSheet] = useState<'sleep' | 'options' | null>(null);
  // Artwork takes whatever height the controls leave, measured, so the screen never scrolls.
  const [box, setBox] = useState({ w: 0, h: 0 });
  const art = Math.max(0, Math.min(box.w, box.h - 12, 380));

  const isTrack = np.kind === 'track';
  const colors = np.colors;
  // Only a mix the person made can be opened in the editor; the built-in ones have no editor.
  const ownMix = np.kind === 'mix' && mixes.some((m) => m.id === p.selection.id);
  // One of the dashboard's mixes: it cannot be edited, but it can be copied
  // into the person's own mixes and changed there.
  const { mixes: adminMixes } = useAdminMixes();
  const appMix = np.kind === 'mix' ? adminMixes.find((m) => m.id === p.selection.id) : undefined;

  const sleepLabel =
    p.sleep == null
      ? 'Sleep timer'
      : p.sleep === 'track'
        ? 'Stops at end of track'
        : `Stops in ${formatClock(p.sleepRemaining ?? 0)}`;

  return (
    // Clipped: the aurora drifts past the edges, which made the page scroll on web.
    <View style={{ flex: 1, backgroundColor: color.ground, overflow: 'hidden' }}>
      <Aurora
        blobs={[
          { size: 360, color: colors[0], opacity: 0.4, left: -80, top: 20, duration: motion.driftFast },
          { size: 300, color: colors[1], opacity: 0.5, right: -100, top: 160, dx: -28, dy: 30, duration: motion.driftSlow },
          { size: 300, color: color.violet, opacity: 0.2, left: 40, bottom: -160 },
        ]}
        scrim={['rgba(7,10,22,0.30)', 'rgba(7,10,22,0.55)', 'rgba(7,10,22,0.92)']}
      />
      {np.art ? (
        <>
          <Image
            source={np.art}
            blurRadius={40}
            style={[StyleSheet.absoluteFill, { width: '100%', height: '100%', opacity: 0.35 }]}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(7,10,22,0.30)', 'rgba(7,10,22,0.60)', 'rgba(7,10,22,0.94)']}
            locations={[0, 0.5, 1]}
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
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
          <RoundButton onPress={() => router.back()} label="Close player">
            <Icon name="chevronDown" />
          </RoundButton>
          <View style={{ alignItems: 'center', gap: 2, flex: 1, paddingHorizontal: space.sm }}>
            <Text style={[t.label, { color: color.ink58, fontSize: 10 }]}>Playing from</Text>
            <Text style={[t.card, { color: color.ink, fontSize: 13.5 }]} numberOfLines={1}>
              {np.context}
            </Text>
          </View>
          <RoundButton onPress={() => setSheet('options')} label="Sound options">
            <Icon name="more" size={22} />
          </RoundButton>
        </View>

        <View
          style={{ flex: 1, minHeight: 0, alignItems: 'center', justifyContent: 'center' }}
          onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
        >
          {art > 80 ? (
            <View
              style={{
                width: art,
                height: art,
                borderRadius: radius.xl,
                overflow: 'hidden',
                boxShadow: glow(colors[0], 0.35, 60, 18),
              }}
            >
              <LinearGradient colors={colors} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
              {np.art ? (
                <Image source={np.art} style={StyleSheet.absoluteFill} resizeMode="cover" />
              ) : (
                <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
                  <Icon name="waves" size={art * 0.28} color="rgba(255,255,255,0.75)" />
                </View>
              )}
            </View>
          ) : null}
        </View>

        <View style={{ gap: space.lg, paddingTop: space.md }}>
          <View style={{ gap: 4 }}>
            <Text style={[t.title, { color: color.ink }]} numberOfLines={2}>
              {np.title}
            </Text>
            <Text style={[t.body, { color: color.ink62 }]} numberOfLines={1}>
              {np.subtitle}
            </Text>
          </View>

          {isTrack ? <Scrubber onSeek={tp.seek} tint={color.accent} /> : <LoopBar tint={color.accent} />}

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            {isTrack ? (
              <ModeButton icon="shuffle" on={tp.shuffle} label="Shuffle" onPress={tp.toggleShuffle} />
            ) : ownMix ? (
              <ModeButton
                icon="mixer"
                on={false}
                label="Edit this mix"
                onPress={() => router.push({ pathname: '/mix-edit', params: { id: p.selection.id } })}
              />
            ) : (
              <Spacer />
            )}
            <PressScale
              onPress={np.prev}
              disabled={!np.canSkip && !isTrack}
              accessibilityRole="button"
              accessibilityLabel={isTrack ? 'Previous track' : 'Previous sound'}
              hitSlop={6}
              scaleTo={0.88}
              style={{
                width: 52,
                height: 52,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: np.canSkip || isTrack ? 1 : 0.35,
              }}
            >
              <Icon name="skipBack" size={30} color={color.ink} />
            </PressScale>
            <PressScale
              onPress={np.toggle}
              accessibilityRole="button"
              accessibilityLabel={np.playing ? 'Pause' : 'Play'}
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: color.accent,
                boxShadow: glow(color.accent, 0.36, 28, 8),
              }}
            >
              {np.buffering ? (
                <ActivityIndicator color={color.onAccent} />
              ) : (
                <Icon name={np.playing ? 'pause' : 'play'} size={28} color={color.onAccent} />
              )}
            </PressScale>
            <PressScale
              onPress={np.next}
              disabled={!np.canSkip}
              accessibilityRole="button"
              accessibilityLabel={isTrack ? 'Next track' : 'Next sound'}
              hitSlop={6}
              scaleTo={0.88}
              style={{
                width: 52,
                height: 52,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: np.canSkip ? 1 : 0.35,
              }}
            >
              <Icon name="skipForward" size={30} color={color.ink} />
            </PressScale>
            {isTrack ? (
              <ModeButton
                icon={tp.repeat === 'one' ? 'repeatOne' : 'repeat'}
                on={tp.repeat !== 'off'}
                label={tp.repeat === 'off' ? 'Repeat off' : tp.repeat === 'all' ? 'Repeat all' : 'Repeat this track'}
                onPress={tp.cycleRepeat}
              />
            ) : (
              <Spacer />
            )}
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: space.sm }}>
            {/* The sleep timer, readable at a glance without opening the sheet. */}
            <PressScale
              onPress={() => setSheet('sleep')}
              accessibilityRole="button"
              accessibilityLabel={sleepLabel}
              style={{
                alignSelf: 'center',
                minHeight: 40,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingHorizontal: 16,
                borderRadius: 999,
                backgroundColor: p.sleep ? 'rgba(95,224,210,0.12)' : color.glassFill,
                borderWidth: 1,
                borderColor: p.sleep ? 'rgba(95,224,210,0.4)' : color.glassBorder,
              }}
            >
              <Icon name="sleepTimer" size={16} color={p.sleep ? color.accent : color.ink62} />
              <Text
                style={[
                  t.meta,
                  { fontSize: 12.5, color: p.sleep ? color.accent : color.ink72, fontVariant: ['tabular-nums'] },
                ]}
              >
                {sleepLabel}
              </Text>
            </PressScale>
            {appMix ? (
              <PressScale
                onPress={() => router.push({ pathname: '/mix-edit', params: { from: appMix.id } })}
                accessibilityRole="button"
                accessibilityLabel={`Make ${appMix.name} yours: copy it into your mixes to change it`}
                style={{
                  minHeight: 40,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingHorizontal: 16,
                  borderRadius: 999,
                  backgroundColor: color.glassFill,
                  borderWidth: 1,
                  borderColor: color.glassBorder,
                }}
              >
                <Icon name="mixer" size={16} color={color.ink62} />
                <Text style={[t.meta, { fontSize: 12.5, color: color.ink72 }]}>Make it yours</Text>
              </PressScale>
            ) : null}
          </View>
        </View>
      </View>

      <SleepTimerSheet
        visible={sheet === 'sleep'}
        selected={p.sleep}
        remaining={p.sleepRemaining}
        allowEndOfTrack={isTrack}
        onPick={p.setSleep}
        onClose={() => setSheet(null)}
      />
      <PlayerOptionsSheet visible={sheet === 'options'} showChannels={!isTrack} onClose={() => setSheet(null)} />
    </View>
  );
}
