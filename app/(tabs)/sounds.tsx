import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PressScale } from '../../src/components/Motion';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Aurora } from '../../src/components/Aurora';
import { Chip, GlassCard } from '../../src/components/Glass';
import { Icon } from '../../src/components/Icon';
import { CATEGORIES, SOUND_ART, SOUNDS } from '../../src/data/sounds';
import { isPlayable } from '../../src/audio/assets';
import { usePlayer } from '../../src/state';
import { color, font, motion, radius, safe, type as t } from '../../src/theme';

const TAB_CLEARANCE = 118;

export default function Sounds() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const p = usePlayer();
  const [cat, setCat] = useState<string>('all');

  const list = cat === 'all' ? SOUNDS : SOUNDS.filter((s) => s.cat === cat);

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
          <Text style={[t.meta, { color: color.ink58, fontSize: 12 }]}>{list.length} sounds</Text>
        </View>

        <View style={{ height: 18 }} />

        <View style={{ paddingHorizontal: safe.side }}>
          <GlassCard
            r={radius.md}
            style={{ minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 16 }}
          >
            <Icon name="search" size={18} color={color.ink58} strokeWidth={1.8} />
            <Text style={{ fontFamily: t.body.fontFamily, fontSize: 14, color: color.ink58 }}>
              Search rain, hum, fan…
            </Text>
          </GlassCard>
        </View>

        <View style={{ height: 18 }} />

        {/*
          One row that scrolls sideways rather than wrapping. On a phone the
          chips broke onto a second line, which read as two separate filter
          groups and pushed the library further down. The padding lives on the
          content, not the ScrollView, so the first chip lines up with the
          title while the row can still scroll edge to edge.
        */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ gap: 6, paddingHorizontal: safe.side }}
        >
          {CATEGORIES.map((c) => (
            <Chip
              key={c.id}
              label={c.label}
              selected={cat === c.id}
              onPress={() => setCat(c.id)}
              style={{ paddingHorizontal: 18 }}
            />
          ))}
        </ScrollView>

        <View style={{ height: 20 }} />

        <ScrollView style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: safe.side, paddingBottom: TAB_CLEARANCE }}
        >
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {list.map((s) => {
              const on = p.selection.id === s.id;
              const sounding = on && p.playing;
              const ready = isPlayable(s.id);
              return (
                <PressScale
                  key={s.id}
                  // The card opens the player. It only changes the selection
                  // when it is a different sound — reopening the one already
                  // playing must not restart or interrupt it.
                  onPress={() => {
                    if (!on) p.select({ kind: 'mix', id: s.id });
                    router.push('/player');
                  }}
                  style={{
                    width: '47.5%',
                    flexGrow: 1,
                    height: 138,
                    borderRadius: radius.lg,
                    overflow: 'hidden',
                    borderWidth: 1.5,
                    borderColor: on ? color.accent : 'rgba(255,255,255,0.10)',
                    opacity: ready ? 1 : 0.55,
                  }}
                >
                  {/*
                    The photograph, held back so the grid stays calm, with the
                    sound's own gradient underneath as a fallback. The scrim is
                    lighter at the top so the picture reads, and heavy at the
                    bottom where the title sits — still safe to open in a dark
                    room.
                  */}
                  <LinearGradient
                    colors={s.colors as unknown as readonly [string, string]}
                    start={{ x: 0.1, y: 0 }}
                    end={{ x: 0.9, y: 1 }}
                    style={[StyleSheet.absoluteFill, { opacity: SOUND_ART[s.id] ? 0.35 : 1 }]}
                  />
                  {SOUND_ART[s.id] ? (
                    <Image
                      source={SOUND_ART[s.id]}
                      style={[StyleSheet.absoluteFill, { width: '100%', height: '100%', opacity: 0.55 }]}
                      resizeMode="cover"
                    />
                  ) : null}
                  <LinearGradient
                    colors={['rgba(7,10,22,0.10)', 'rgba(7,10,22,0.45)', 'rgba(7,10,22,0.90)'] as const}
                    locations={[0, 0.5, 1]}
                    style={StyleSheet.absoluteFill}
                  />
                  {/*
                    Plays or pauses in place, without leaving the library.
                    stopPropagation keeps the tap from also reaching the card
                    underneath, which would open the player. It shows pause
                    only for the one sound actually sounding right now.
                  */}
                  <PressScale
                    onPress={(e) => {
                      e.stopPropagation();
                      if (on) p.togglePlay();
                      else p.select({ kind: 'mix', id: s.id });
                    }}
                    hitSlop={8}
                    scaleTo={0.88}
                    style={{
                      position: 'absolute',
                      right: 11,
                      top: 11,
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
                    <Icon
                      name={sounding ? 'pause' : 'play'}
                      size={14}
                      color={sounding ? color.onAccent : color.ink}
                    />
                  </PressScale>
                  <View style={{ position: 'absolute', left: 14, right: 14, bottom: 13, gap: 3 }}>
                    <Text style={[t.card, { color: color.ink, fontSize: 14.5, lineHeight: 18 }]}>{s.name}</Text>
                    <Text style={[t.meta, { color: color.ink62 }]}>
                      {ready ? s.meta : 'No audio yet'}
                    </Text>
                  </View>
                </PressScale>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
