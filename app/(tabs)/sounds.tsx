import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { PressScale } from '../../src/components/Motion';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Aurora } from '../../src/components/Aurora';
import { GlassCard } from '../../src/components/Glass';
import { Icon } from '../../src/components/Icon';
import { useTabClearance } from '../../src/components/MiniPlayer';
import { useTrackPlayer } from '../../src/audio/tracks';
import { formatLength, matchesQuery, trackColors, useLibrary } from '../../src/data/library';
import { color, font, motion, radius, safe, type as t } from '../../src/theme';

function PlayBadge({ sounding }: { sounding: boolean }) {
  return (
    <View
      style={{
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: sounding ? color.accent : 'rgba(7,10,22,0.38)',
        borderWidth: 1,
        borderColor: sounding ? color.accent : 'rgba(255,255,255,0.24)',
      }}
    >
      <Icon name={sounding ? 'pause' : 'play'} size={14} color={sounding ? color.onAccent : color.ink} />
    </View>
  );
}

/** Filters the library by title and artist as you type. Same glass as the sign-in fields. */
function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const input = useRef<TextInput>(null);
  return (
    <GlassCard
      r={radius.md}
      style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 15, paddingRight: 6 }}
    >
      <Icon name="search" size={18} color={value ? color.ink : color.ink58} />
      <TextInput
        ref={input}
        value={value}
        onChangeText={onChange}
        placeholder="Search sounds or artists"
        placeholderTextColor={color.ink58}
        accessibilityLabel="Search sounds"
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="never"
        style={{
          flex: 1,
          fontFamily: t.body.fontFamily,
          fontSize: 14.5,
          color: color.ink,
          // Android centres poorly without this and clips descenders.
          paddingVertical: Platform.OS === 'android' ? 10 : 0,
          // Web: sit above the glass layers, no focus ring.
          position: 'relative',
          outlineStyle: 'none',
        } as never}
      />
      {value ? (
        <PressScale
          onPress={() => {
            onChange('');
            input.current?.focus();
          }}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={6}
          scaleTo={0.88}
          style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
        >
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.14)',
            }}
          >
            <Icon name="close" size={12} color={color.ink} strokeWidth={2} />
          </View>
        </PressScale>
      ) : null}
    </GlassCard>
  );
}

export default function Sounds() {
  const insets = useSafeAreaInsets();
  const lib = useLibrary();
  const tp = useTrackPlayer();
  const clearance = useTabClearance();
  const [query, setQuery] = useState('');

  const results = useMemo(
    () => lib.tracks.filter((s) => matchesQuery(s, query)),
    [lib.tracks, query],
  );
  const searching = query.trim().length > 0;

  const currentId = tp.current?.id ?? null;
  const isSounding = (id: string) => currentId === id && tp.playing;

  const empty = (message: string) => (
    <Text style={[t.meta, { color: color.ink58, textAlign: 'center', marginTop: 32 }]}>{message}</Text>
  );

  return (
    <View style={{ flex: 1, backgroundColor: color.ground }}>
      <Aurora
        blobs={[
          { size: 300, color: color.accent, opacity: 0.24, right: -100, top: -80, duration: motion.driftSlow },
          { size: 280, color: color.violet, opacity: 0.22, left: -90, bottom: -60, dx: 20, dy: -26 },
        ]}
        scrim={['rgba(7,10,22,0.26)', 'rgba(7,10,22,0.70)', 'rgba(7,10,22,0.90)']}
      />

      <View style={{ flex: 1, paddingTop: Math.max(insets.top, safe.top) }}>
        <View
          style={{
            paddingHorizontal: safe.side,
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            minHeight: 44,
          }}
        >
          <Text style={{ fontFamily: font.display, fontSize: 28, color: color.ink, letterSpacing: -0.7 }}>
            Sounds
          </Text>
          <Text style={[t.meta, { color: color.ink58, fontSize: 12 }]}>
            {searching ? `${results.length} of ${lib.tracks.length}` : `${lib.tracks.length} sounds`}
          </Text>
        </View>

        <View style={{ height: 14 }} />

        <View style={{ paddingHorizontal: safe.side }}>
          <SearchBar value={query} onChange={setQuery} />
        </View>

        <View style={{ height: 16 }} />

        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ paddingHorizontal: safe.side, paddingBottom: clearance }}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={lib.reload} tintColor={color.ink58} />
          }
        >
          {lib.loading ? (
            <ActivityIndicator color={color.ink58} style={{ marginTop: 32 }} />
          ) : lib.error ? (
            empty(`Couldn't load the library. ${lib.error}`)
          ) : lib.tracks.length === 0 ? (
            empty('No sounds yet.')
          ) : results.length === 0 ? (
            empty(`No sounds match \u201C${query.trim()}\u201D.`)
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {results.map((s) => {
                const url = s.file_url;
                const meta = [s.artist, formatLength(s.duration_seconds)].filter(Boolean).join(' · ');
                return (
                  <PressScale
                    key={s.id}
                    onPress={() => url && tp.playFrom(results, s.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`${isSounding(s.id) ? 'Pause' : 'Play'} ${s.title}`}
                    style={{
                      width: '47.5%',
                      flexGrow: 1,
                      height: 138,
                      borderRadius: radius.lg,
                      overflow: 'hidden',
                      borderWidth: 1.5,
                      borderColor: currentId === s.id ? color.accent : 'rgba(255,255,255,0.10)',
                      opacity: url ? 1 : 0.55,
                    }}
                  >
                    <LinearGradient
                      colors={trackColors(s.id)}
                      start={{ x: 0.1, y: 0 }}
                      end={{ x: 0.9, y: 1 }}
                      style={[StyleSheet.absoluteFill, { opacity: s.cover_art_url ? 0.35 : 1 }]}
                    />
                    {s.cover_art_url ? (
                      <Image
                        source={{ uri: s.cover_art_url }}
                        style={[StyleSheet.absoluteFill, { width: '100%', height: '100%', opacity: 0.55 }]}
                        resizeMode="cover"
                      />
                    ) : null}
                    <LinearGradient
                      colors={['rgba(7,10,22,0.10)', 'rgba(7,10,22,0.45)', 'rgba(7,10,22,0.90)'] as const}
                      locations={[0, 0.5, 1]}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={{ position: 'absolute', right: 11, top: 11 }}>
                      <PlayBadge sounding={isSounding(s.id)} />
                    </View>
                    <View style={{ position: 'absolute', left: 14, right: 14, bottom: 13, gap: 3 }}>
                      <Text style={[t.card, { color: color.ink, fontSize: 14.5, lineHeight: 18 }]}>
                        {s.title}
                      </Text>
                      <Text style={[t.meta, { color: color.ink62 }]} numberOfLines={1}>
                        {url ? meta || 'Sound' : 'No audio yet'}
                      </Text>
                    </View>
                  </PressScale>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}
