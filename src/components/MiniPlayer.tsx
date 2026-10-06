import React from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTrackPlayer, useTrackProgress } from '../audio/tracks';
import { trackColors } from '../data/library';
import { color, radius, safe, type as t } from '../theme';
import { Icon } from './Icon';
import { PressScale } from './Motion';

/** The tab bar's own height and the gap the mini player keeps above it. */
const TAB_BAR_H = 64;
const GAP = 8;
export const MINI_PLAYER_H = 60;

/** What a tab's scroll content has to clear at the bottom: the tab bar, plus the mini player when it shows. */
export function useTabClearance() {
  const { current } = useTrackPlayer();
  return 118 + (current ? MINI_PLAYER_H + GAP : 0);
}

/** A hairline that fills as the track plays, along the bottom edge of the bar. */
function ProgressLine({ tint }: { tint: string }) {
  const { position, duration } = useTrackProgress();
  const f = duration > 0 ? Math.max(0, Math.min(1, position / duration)) : 0;
  return (
    <View style={{ position: 'absolute', left: 12, right: 12, bottom: 0, height: 2, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.10)' }}>
      <View style={{ width: `${f * 100}%`, height: '100%', borderRadius: 999, backgroundColor: tint }} />
    </View>
  );
}

/**
 * The library track that is playing, docked above the tab bar on every tab.
 * Tapping the bar opens the full player; the button only plays and pauses.
 */
export function MiniPlayer() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tp = useTrackPlayer();
  const track = tp.current;
  if (!track) return null;

  const colors = trackColors(track.id);

  return (
    <View
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: Math.max(insets.bottom, safe.bottom) + TAB_BAR_H + GAP,
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
            onPress={() => router.push('/track')}
            accessibilityRole="button"
            accessibilityLabel={`Now playing: ${track.title}. Open player`}
            style={{ flex: 1, alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 11, paddingLeft: 9, paddingRight: 4 }}
          >
            <View style={{ width: 42, height: 42, borderRadius: radius.xs - 2, overflow: 'hidden' }}>
              <LinearGradient colors={colors} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
              {track.cover_art_url ? (
                <Image source={{ uri: track.cover_art_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              ) : (
                <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
                  <Icon name="waves" size={18} color="rgba(255,255,255,0.8)" />
                </View>
              )}
            </View>
  
            <View style={{ flex: 1, gap: 1 }}>
              <Text style={[t.card, { color: color.ink, fontSize: 14 }]} numberOfLines={1}>
                {track.title}
              </Text>
              <Text style={[t.meta, { color: color.ink62 }]} numberOfLines={1}>
                {tp.sleepRemaining != null || tp.sleep === 'track' ? (
                  <Text style={{ color: color.accent }}>{'☾ '}</Text>
                ) : null}
                {track.artist || 'AudioRelief'}
              </Text>
            </View>
          </Pressable>

          <PressScale
            onPress={tp.toggle}
            accessibilityRole="button"
            accessibilityLabel={tp.playing ? 'Pause' : 'Play'}
            hitSlop={6}
            scaleTo={0.88}
            style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            {tp.buffering ? (
              <ActivityIndicator color={color.ink} size="small" />
            ) : (
              <Icon name={tp.playing ? 'pause' : 'play'} size={22} color={color.ink} />
            )}
          </PressScale>
          <PressScale
            onPress={tp.next}
            accessibilityRole="button"
            accessibilityLabel="Next track"
            hitSlop={6}
            scaleTo={0.88}
            style={{ width: 40, height: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="skipForward" size={20} color={color.ink82} />
          </PressScale>
        </View>

        <ProgressLine tint={color.ink} />
      </View>
    </View>
  );
}
