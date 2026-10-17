import React from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNowPlaying } from '../audio/nowPlaying';
import { useTrackProgress } from '../audio/tracks';
import { usePlayer } from '../state';
import { color, radius, safe, type as t } from '../theme';
import { Icon } from './Icon';
import { PressScale } from './Motion';

/** The tab bar's own height and the gap the mini player keeps above it. */
const TAB_BAR_H = 64;
const GAP = 8;
export const MINI_PLAYER_H = 60;

/** What a tab's scroll content has to clear at the bottom: the tab bar, plus the mini player when it shows. */
export function useTabClearance() {
  const { source } = useNowPlaying();
  return 118 + (source ? MINI_PLAYER_H + GAP : 0);
}

/** A hairline along the bottom edge: how far through the track, or through the sleep timer for a loop. */
function ProgressLine({ tint, track }: { tint: string; track: boolean }) {
  const { position, duration } = useTrackProgress();
  const p = usePlayer();
  const raw = track
    ? duration > 0
      ? position / duration
      : 0
    : p.sleepTotal && p.sleepRemaining != null
      ? 1 - p.sleepRemaining / p.sleepTotal
      : 0;
  const f = Math.max(0, Math.min(1, raw));
  return (
    <View style={{ position: 'absolute', left: 12, right: 12, bottom: 0, height: 2, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.10)' }}>
      <View style={{ width: `${f * 100}%`, height: '100%', borderRadius: 999, backgroundColor: tint }} />
    </View>
  );
}

/**
 * Whatever is playing — a track, a noise or a mix — docked above the tab bar
 * on every tab. Tapping the bar opens the full player; the buttons only play,
 * pause and skip. It appears once something has been played this session.
 */
export function MiniPlayer({ aboveTabBar = true }: { aboveTabBar?: boolean }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const np = useNowPlaying();
  const p = usePlayer();
  if (!np.source) return null;

  const colors = np.colors;
  const isTrack = np.kind === 'track';

  return (
    <View
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        // Off the tabs (a playlist, say) there is no bar to sit on, so it docks at the bottom edge.
        bottom: Math.max(insets.bottom, safe.bottom) + (aboveTabBar ? TAB_BAR_H + GAP : 0),
        height: MINI_PLAYER_H,
        borderRadius: radius.md,
        boxShadow: '0px 10px 30px rgba(2,4,10,0.6)',
      }}
    >
      <View
        style={{
          flex: 1,
          borderRadius: radius.md,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.13)',
        }}
      >
        <BlurView intensity={55} tint="dark" pointerEvents="none" style={StyleSheet.absoluteFill} />
        {/* The track's colour bleeding in from the left, so the bar reads as this sound. */}
        <LinearGradient
          pointerEvents="none"
          colors={[`${colors[1]}EE`, 'rgba(14,18,36,0.94)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 0.75, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingRight: 6 }}>
          {/* Siblings, not nested: a button inside a button is invalid on web and confuses screen readers. */}
          <Pressable
            onPress={() => router.push('/player')}
            accessibilityRole="button"
            accessibilityLabel={`Now playing: ${np.title}. Open player`}
            style={{ flex: 1, alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 11, paddingLeft: 9, paddingRight: 4 }}
          >
            <View style={{ width: 42, height: 42, borderRadius: radius.xs - 2, overflow: 'hidden' }}>
              <LinearGradient colors={colors} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
              {np.art ? (
                <Image source={np.art} style={StyleSheet.absoluteFill} resizeMode="cover" />
              ) : (
                <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
                  <Icon name="waves" size={18} color="rgba(255,255,255,0.8)" />
                </View>
              )}
            </View>

            <View style={{ flex: 1, gap: 1 }}>
              <Text style={[t.card, { color: color.ink, fontSize: 14 }]} numberOfLines={1}>
                {np.title}
              </Text>
              <Text style={[t.meta, { color: color.ink62 }]} numberOfLines={1}>
                {p.sleep ? <Text style={{ color: color.accent }}>{'☾ '}</Text> : null}
                {np.subtitle}
              </Text>
            </View>
          </Pressable>

          <PressScale
            onPress={np.toggle}
            accessibilityRole="button"
            accessibilityLabel={np.playing ? 'Pause' : 'Play'}
            hitSlop={6}
            scaleTo={0.88}
            style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            {np.buffering ? (
              <ActivityIndicator color={color.ink} size="small" />
            ) : (
              <Icon name={np.playing ? 'pause' : 'play'} size={22} color={color.ink} />
            )}
          </PressScale>
          <PressScale
            onPress={np.next}
            disabled={!np.canSkip}
            accessibilityRole="button"
            accessibilityLabel={isTrack ? 'Next track' : 'Next sound'}
            hitSlop={6}
            scaleTo={0.88}
            style={{ width: 40, height: 44, alignItems: 'center', justifyContent: 'center', opacity: np.canSkip ? 1 : 0.35 }}
          >
            <Icon name="skipForward" size={20} color={color.ink82} />
          </PressScale>
        </View>

        <ProgressLine tint={color.ink} track={isTrack} />
      </View>
    </View>
  );
}
