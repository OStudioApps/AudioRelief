import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { PressScale } from '../../src/components/Motion';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Aurora } from '../../src/components/Aurora';
import { Icon } from '../../src/components/Icon';
import { OUTPUT_CEILING } from '../../src/audio/assets';
import { formatLength, useLibrary } from '../../src/data/library';
import { usePlayer } from '../../src/state';
import { color, font, motion, radius, safe, type as t } from '../../src/theme';

const TAB_CLEARANCE = 118;

/** Card gradients, used behind artwork and in its place when there is none. */
const PALETTE: ReadonlyArray<readonly [string, string]> = [
  ['#8FA9E8', '#2E3E78'],
  ['#69C4B4', '#1F5850'],
  ['#A8CF7E', '#4A6528'],
  ['#C9A7A0', '#5E3D38'],
  ['#74D0D8', '#215E67'],
  ['#A9B7D6', '#434F6E'],
];

function gradientFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

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

export default function Sounds() {
  const insets = useSafeAreaInsets();
  const p = usePlayer();
  const lib = useLibrary();

  /*
    One streaming voice for everything on this screen, sounds and music alike,
    so two never overlap. It also never overlaps the mixer: starting a sound
    here pauses the mix, and starting the mix pauses this.
  */
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const isSounding = (id: string) => currentId === id && status.playing;

  useEffect(() => {
    if (p.playing && status.playing) player.pause();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.playing]);

  useEffect(() => {
    try {
      player.volume = (p.volume / 100) * OUTPUT_CEILING;
    } catch {
      // not ready yet
    }
  }, [player, p.volume]);

  const toggle = (id: string, url: string, loop: boolean) => {
    try {
      if (currentId === id) {
        if (status.playing) player.pause();
        else player.play();
        return;
      }
      if (p.playing) p.togglePlay();
      player.replace({ uri: url });
      player.loop = loop;
      player.volume = (p.volume / 100) * OUTPUT_CEILING;
      player.play();
      setCurrentId(id);
    } catch {
      setCurrentId(null);
    }
  };


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
            {lib.tracks.length} sounds
          </Text>
        </View>

        <View style={{ height: 18 }} />


        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: safe.side, paddingBottom: TAB_CLEARANCE }}
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
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {lib.tracks.map((s) => {
                const url = s.file_url;
                const meta = [s.artist, formatLength(s.duration_seconds)].filter(Boolean).join(' · ');
                return (
                  <PressScale
                    key={s.id}
                    onPress={() => url && toggle(s.id, url, true)}
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
                      colors={gradientFor(s.id)}
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
