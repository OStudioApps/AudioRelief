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
import { SleepTimerSheet } from '../src/components/SleepTimerSheet';
import { useTrackPlayer, useTrackProgress } from '../src/audio/tracks';
import { formatClock, trackColors } from '../src/data/library';
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

export default function Track() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tp = useTrackPlayer();
  const [sheet, setSheet] = useState(false);
  // Artwork takes whatever height the controls leave, measured, so the screen never scrolls.
  const [box, setBox] = useState({ w: 0, h: 0 });
  const art = Math.max(0, Math.min(box.w, box.h - 12, 380));

  const track = tp.current;
  const colors = track ? trackColors(track.id) : (['#5FE0D2', '#2E3E78'] as const);

  const sleepLabel =
    tp.sleep == null
      ? 'Sleep timer'
      : tp.sleep === 'track'
        ? 'Stops at end of track'
        : `Stops in ${formatClock(tp.sleepRemaining ?? 0)}`;

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
      {track?.cover_art_url ? (
        <>
          <Image
            source={{ uri: track.cover_art_url }}
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
          <View style={{ alignItems: 'center', gap: 2 }}>
            <Text style={[t.label, { color: color.ink58, fontSize: 10 }]}>Playing from</Text>
            <Text style={[t.card, { color: color.ink, fontSize: 13.5 }]}>Sounds</Text>
          </View>
          <RoundButton
            onPress={() => setSheet(true)}
            label="Sleep timer"
            style={tp.sleep ? { borderColor: color.accent, backgroundColor: color.glassFillActive } : undefined}
          >
            <Icon name="sleepTimer" size={19} color={tp.sleep ? color.accent : color.ink} />
          </RoundButton>
        </View>

        {!track ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md }}>
            <Text style={[t.body, { color: color.ink62 }]}>Nothing is playing.</Text>
          </View>
        ) : (
          <>
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
                  {track.cover_art_url ? (
                    <Image source={{ uri: track.cover_art_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
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
                  {track.title}
                </Text>
                <Text style={[t.body, { color: color.ink62 }]} numberOfLines={1}>
                  {track.artist || 'AudioRelief'}
                </Text>
              </View>

              <Scrubber onSeek={tp.seek} tint={color.accent} />

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <ModeButton icon="shuffle" on={tp.shuffle} label="Shuffle" onPress={tp.toggleShuffle} />
                <PressScale
                  onPress={tp.prev}
                  accessibilityRole="button"
                  accessibilityLabel="Previous track"
                  hitSlop={6}
                  scaleTo={0.88}
                  style={{ width: 52, height: 52, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Icon name="skipBack" size={30} color={color.ink} />
                </PressScale>
                <PressScale
                  onPress={tp.toggle}
                  accessibilityRole="button"
                  accessibilityLabel={tp.playing ? 'Pause' : 'Play'}
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
                  {tp.buffering ? (
                    <ActivityIndicator color={color.onAccent} />
                  ) : (
                    <Icon name={tp.playing ? 'pause' : 'play'} size={28} color={color.onAccent} />
                  )}
                </PressScale>
                <PressScale
                  onPress={tp.next}
                  accessibilityRole="button"
                  accessibilityLabel="Next track"
                  hitSlop={6}
                  scaleTo={0.88}
                  style={{ width: 52, height: 52, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Icon name="skipForward" size={30} color={color.ink} />
                </PressScale>
                <ModeButton
                  icon={tp.repeat === 'one' ? 'repeatOne' : 'repeat'}
                  on={tp.repeat !== 'off'}
                  label={tp.repeat === 'off' ? 'Repeat off' : tp.repeat === 'all' ? 'Repeat all' : 'Repeat this track'}
                  onPress={tp.cycleRepeat}
                />
              </View>

              {/* The sleep timer, readable at a glance without opening the sheet. */}
              <PressScale
                onPress={() => setSheet(true)}
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
                  backgroundColor: tp.sleep ? 'rgba(95,224,210,0.12)' : color.glassFill,
                  borderWidth: 1,
                  borderColor: tp.sleep ? 'rgba(95,224,210,0.4)' : color.glassBorder,
                }}
              >
                <Icon name="timer" size={16} color={tp.sleep ? color.accent : color.ink62} />
                <Text
                  style={[
                    t.meta,
                    { fontSize: 12.5, color: tp.sleep ? color.accent : color.ink72, fontVariant: ['tabular-nums'] },
                  ]}
                >
                  {sleepLabel}
                </Text>
              </PressScale>
            </View>
          </>
        )}
      </View>

      <SleepTimerSheet
        visible={sheet}
        selected={tp.sleep}
        remaining={tp.sleepRemaining}
        onPick={tp.setSleep}
        onClose={() => setSheet(false)}
      />
    </View>
  );
}
