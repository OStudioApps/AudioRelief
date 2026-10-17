import React from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Aurora } from '../../src/components/Aurora';
import { RoundButton } from '../../src/components/Glass';
import { Icon } from '../../src/components/Icon';
import { MINI_PLAYER_H, MiniPlayer } from '../../src/components/MiniPlayer';
import { PressScale } from '../../src/components/Motion';
import { PlaylistCover } from '../../src/components/PlaylistCover';
import { useNowPlaying } from '../../src/audio/nowPlaying';
import { useTrackPlayer } from '../../src/audio/tracks';
import { formatLength, trackColors } from '../../src/data/library';
import { playlistMeta, usePlaylists } from '../../src/data/playlists';
import { color, font, glow, motion, radius, safe, space, type as t } from '../../src/theme';

/** One official playlist: its cover, Play and Shuffle, and the tracks in order. */
export default function PlaylistScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { playlists, loading, error } = usePlaylists();
  const np = useNowPlaying();
  const tp = useTrackPlayer();

  const playlist = playlists.find((p) => p.id === id);
  const colors = trackColors(id ?? '');

  // This playlist is what the player is on — Play then pauses rather than restarting it.
  const isThis = np.kind === 'track' && np.context === playlist?.title;
  const currentId = np.kind === 'track' ? tp.current?.id : null;

  /*
    A playlist is meant to be heard through. The player's default is to hold
    one track — right for a single sound picked from the library, wrong here,
    where it would loop the first track forever and never reach the rest.
  */
  const start = (trackId: string) => {
    if (!playlist) return;
    if (tp.repeat === 'one') tp.setRepeat('all');
    np.playTracks(playlist.tracks, trackId, playlist.title);
  };

  const play = () => {
    if (!playlist) return;
    if (isThis) {
      np.toggle();
      return;
    }
    tp.setShuffle(false);
    start(playlist.tracks[0].id);
  };

  const shuffle = () => {
    if (!playlist) return;
    tp.setShuffle(true);
    start(playlist.tracks[Math.floor(Math.random() * playlist.tracks.length)].id);
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.ground, overflow: 'hidden' }}>
      <Aurora
        blobs={[
          { size: 340, color: colors[0], opacity: 0.36, left: -80, top: -40, duration: motion.driftFast },
          { size: 300, color: colors[1], opacity: 0.4, right: -110, top: 120, dx: -24, dy: 26, duration: motion.driftSlow },
        ]}
        scrim={['rgba(7,10,22,0.20)', 'rgba(7,10,22,0.70)', 'rgba(7,10,22,0.92)']}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, safe.top),
          paddingHorizontal: safe.side,
          paddingBottom: Math.max(insets.bottom, safe.bottom) + MINI_PLAYER_H + space.lg,
        }}
      >
        <View style={{ flexDirection: 'row', minHeight: 44 }}>
          <RoundButton label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/tonight'))}>
            <Icon name="chevronLeft" />
          </RoundButton>
        </View>

        {!playlist ? (
          <View style={{ alignItems: 'center', paddingTop: 80, gap: space.md }}>
            {loading ? (
              <ActivityIndicator color={color.ink58} />
            ) : (
              <Text style={[t.body, { color: color.ink62, textAlign: 'center' }]}>
                {error ? `Couldn't load this playlist. ${error}` : 'This playlist is not available.'}
              </Text>
            )}
          </View>
        ) : (
          <>
            <View style={{ alignItems: 'center', paddingTop: space.md }}>
              <View style={{ borderRadius: radius.xl, boxShadow: glow(colors[0], 0.35, 50, 16) }}>
                <PlaylistCover playlist={playlist} size={220} radius={radius.xl} />
              </View>
            </View>

            <View style={{ gap: 6, marginTop: space.xl }}>
              <Text style={[t.title, { color: color.ink }]}>{playlist.title}</Text>
              {playlist.description ? (
                <Text style={[t.bodyMuted, { color: color.ink62 }]}>{playlist.description}</Text>
              ) : null}
              <Text style={[t.meta, { color: color.ink58 }]}>Official · {playlistMeta(playlist)}</Text>
            </View>

            <View style={{ flexDirection: 'row', gap: space.md, marginTop: space.lg }}>
              <PressScale
                onPress={play}
                accessibilityRole="button"
                accessibilityLabel={isThis && np.playing ? 'Pause' : 'Play'}
                style={{
                  flex: 1,
                  minHeight: 50,
                  borderRadius: 999,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  backgroundColor: color.accent,
                  boxShadow: glow(color.accent, 0.32, 22, 6),
                }}
              >
                <Icon name={isThis && np.playing ? 'pause' : 'play'} size={18} color={color.onAccent} />
                <Text style={{ fontFamily: font.display, fontSize: 15, color: color.onAccent }}>
                  {isThis && np.playing ? 'Pause' : 'Play'}
                </Text>
              </PressScale>
              <PressScale
                onPress={shuffle}
                accessibilityRole="button"
                accessibilityLabel="Shuffle play"
                style={{
                  flex: 1,
                  minHeight: 50,
                  borderRadius: 999,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  backgroundColor: color.glassFill,
                  borderWidth: 1,
                  borderColor: color.glassBorder,
                }}
              >
                <Icon name="shuffle" size={18} color={color.ink} />
                <Text style={{ fontFamily: font.display, fontSize: 15, color: color.ink }}>Shuffle</Text>
              </PressScale>
            </View>

            <View style={{ marginTop: space.xl, gap: 4 }}>
              {playlist.tracks.map((track, i) => {
                const on = track.id === currentId;
                const meta = [track.artist, formatLength(track.duration_seconds)].filter(Boolean).join(' · ');
                return (
                  <PressScale
                    key={track.id}
                    onPress={() => start(track.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`${on && np.playing ? 'Pause' : 'Play'} ${track.title}`}
                    scaleTo={0.98}
                    style={{
                      minHeight: 60,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      paddingVertical: 6,
                      paddingHorizontal: 8,
                      marginHorizontal: -8,
                      borderRadius: radius.sm,
                      backgroundColor: on ? 'rgba(255,255,255,0.06)' : 'transparent',
                    }}
                  >
                    <Text
                      style={[
                        t.meta,
                        { width: 18, textAlign: 'center', color: on ? color.accent : color.ink58, fontVariant: ['tabular-nums'] },
                      ]}
                    >
                      {i + 1}
                    </Text>
                    <View style={{ width: 46, height: 46, borderRadius: radius.xs - 2, overflow: 'hidden' }}>
                      <LinearGradient
                        colors={trackColors(track.id)}
                        start={{ x: 0.1, y: 0 }}
                        end={{ x: 0.9, y: 1 }}
                        style={StyleSheet.absoluteFill}
                      />
                      {track.cover_art_url ? (
                        <Image source={{ uri: track.cover_art_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                      ) : null}
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[t.card, { color: on ? color.accent : color.ink, fontSize: 14.5 }]} numberOfLines={1}>
                        {track.title}
                      </Text>
                      <Text style={[t.meta, { color: color.ink58 }]} numberOfLines={1}>
                        {meta || 'AudioRelief'}
                      </Text>
                    </View>
                    {on ? <Icon name={np.playing ? 'pause' : 'play'} size={16} color={color.accent} /> : null}
                  </PressScale>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      <MiniPlayer aboveTabBar={false} />
    </View>
  );
}
