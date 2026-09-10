import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { PressScale } from '../../src/components/Motion';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Aurora } from '../../src/components/Aurora';
import { Chip, GlassCard } from '../../src/components/Glass';
import { Icon } from '../../src/components/Icon';
import { CATEGORIES, SOUNDS } from '../../src/data/sounds';
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

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: safe.side }}>
          {CATEGORIES.map((c) => (
            <Chip key={c.id} label={c.label} selected={cat === c.id} onPress={() => setCat(c.id)} />
          ))}
        </View>

        <View style={{ height: 20 }} />

        <ScrollView style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: safe.side, paddingBottom: TAB_CLEARANCE }}
        >
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {list.map((s) => {
              const on = p.selection.id === s.id;
              const ready = isPlayable(s.id);
              return (
                <PressScale
                  key={s.id}
                  onPress={() => {
                    p.select({ kind: 'mix', id: s.id });
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
                  <LinearGradient
                    colors={s.colors as unknown as readonly [string, string]}
                    start={{ x: 0.1, y: 0 }}
                    end={{ x: 0.9, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  {/* Heavy scrim so the library is safe to open in a dark room. */}
                  <LinearGradient
                    colors={['rgba(7,10,22,0.28)', 'rgba(7,10,22,0.64)', 'rgba(7,10,22,0.90)'] as const}
                    style={StyleSheet.absoluteFill}
                  />
                  <View
                    style={{
                      position: 'absolute',
                      right: 11,
                      top: 11,
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(7,10,22,0.38)',
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.24)',
                    }}
                  >
                    <Icon name="play" size={14} color={color.ink} />
                  </View>
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
