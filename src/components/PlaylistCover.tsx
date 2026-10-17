import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { trackColors } from '../data/library';
import type { Playlist } from '../data/playlists';
import { Icon } from './Icon';

/**
 * A playlist's artwork. The dashboard's cover when it has one; otherwise a
 * 2×2 of its first tracks' covers, which says what is inside better than a
 * generic tile; otherwise its own gradient.
 */
export function PlaylistCover({ playlist, size, radius }: { playlist: Playlist; size: number; radius: number }) {
  const covers = playlist.tracks.map((t) => t.cover_art_url).filter((u): u is string => Boolean(u));
  const colors = trackColors(playlist.id);
  const half = size / 2;

  return (
    <View style={{ width: size, height: size, borderRadius: radius, overflow: 'hidden' }}>
      <LinearGradient colors={colors} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
      {playlist.cover_url ? (
        <Image source={{ uri: playlist.cover_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : covers.length >= 4 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {covers.slice(0, 4).map((uri, i) => (
            <Image key={i} source={{ uri }} style={{ width: half, height: half }} resizeMode="cover" />
          ))}
        </View>
      ) : covers.length ? (
        <Image source={{ uri: covers[0] }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
          <Icon name="waves" size={size * 0.3} color="rgba(255,255,255,0.75)" />
        </View>
      )}
    </View>
  );
}
