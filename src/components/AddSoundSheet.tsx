import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { categoriesOf, type MixerSound, mixerSoundColors, useMixerSounds } from '../data/mixerSounds';
import { color, font, radius, safe, type as t } from '../theme';
import { Chip, RoundButton } from './Glass';
import { PressScale } from './Motion';
import { Icon } from './Icon';
import { SoundIcon } from './SoundIcon';

/**
 * The sound library, for adding a layer to the mix — the sounds managed on the
 * dashboard, in its categories. Sounds already in the mix are listed as taken
 * rather than hidden, so the catalogue does not appear to shrink as you build.
 */
export function AddSoundSheet({
  visible,
  inMix,
  onAdd,
  onClose,
}: {
  visible: boolean;
  inMix: string[];
  onAdd: (sound: MixerSound) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [cat, setCat] = useState<string>('all');

  const { sounds, loading, error, reload } = useMixerSounds();
  const categories = useMemo(() => categoriesOf(sounds), [sounds]);
  const chips = [{ id: 'all', label: 'All' }, ...categories.map((c) => ({ id: c.id, label: c.name }))];

  const list = cat === 'all' ? sounds : sounds.filter((s) => s.category?.id === cat);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(2,4,10,0.62)' }]} />
        </Pressable>

        {/*
          A fixed height, not `maxHeight`. Sized to its content, the sheet
          grew and shrank every time a category was picked — the whole panel
          jumped under the finger — and the scroll list inside it had no
          bounded height to scroll within, so the last rows were cut off
          below the edge with no way to reach them.
        */}
        <View
          style={{
            height: '86%',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            overflow: 'hidden',
            borderTopWidth: 1,
            borderColor: color.glassBorder,
          }}
        >
          <BlurView
            intensity={60}
            tint="dark"
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
          />
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(14,18,36,0.86)' }]}
          />

          {/* flex: 1 so the list below inherits a real height to scroll in. */}
          <View style={{ flex: 1, paddingTop: 12 }}>
            {/* Grabber */}
            <View style={{ alignItems: 'center', paddingBottom: 12 }}>
              <View style={{ width: 40, height: 4, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.18)' }} />
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: safe.side,
                minHeight: 44,
              }}
            >
              <View style={{ gap: 3 }}>
                <Text style={{ fontFamily: font.display, fontSize: 20, color: color.ink, letterSpacing: -0.3 }}>
                  Add a sound
                </Text>
                <Text style={[t.meta, { color: color.ink58 }]}>
                  {inMix.length} in your mix · {sounds.length} sounds in the library
                </Text>
              </View>
              <RoundButton onPress={onClose}>
                <Icon name="close" size={18} strokeWidth={1.8} />
              </RoundButton>
            </View>

            <View style={{ height: 16 }} />

            {/*
              One row that scrolls sideways, as on the Sounds tab. Wrapped,
              the five chips took a second line on narrow phones and the list
              below jumped up and down as categories changed.
            */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ flexGrow: 0 }}
              contentContainerStyle={{ gap: 6, paddingHorizontal: safe.side }}
            >
              {chips.map((c) => (
                <Chip
                  key={c.id}
                  label={c.label}
                  selected={cat === c.id}
                  onPress={() => setCat(c.id)}
                  style={{ paddingHorizontal: 18 }}
                />
              ))}
            </ScrollView>

            <View style={{ height: 14 }} />

            {/*
              The safe-area inset lives on the scrolling content, not on the
              panel: as panel padding it shrank the list and still left the
              final row half-hidden behind the home indicator.
            */}
            <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: safe.side,
                gap: 8,
                paddingBottom: Math.max(insets.bottom, safe.bottom) + 12,
              }}
            >
              {loading && !sounds.length ? (
                <ActivityIndicator color={color.ink58} style={{ marginTop: 24 }} />
              ) : error && !sounds.length ? (
                <PressScale onPress={reload} style={{ marginTop: 24, alignItems: 'center', gap: 6 }}>
                  <Text style={[t.meta, { color: color.ink58, textAlign: 'center' }]}>
                    Couldn't load the sounds. {error}
                  </Text>
                  <Text style={[t.meta, { color: color.accent }]}>Try again</Text>
                </PressScale>
              ) : null}
              {list.map((s) => {
                const taken = inMix.includes(s.id);
                return (
                  <PressScale
                    key={s.id}
                    disabled={taken}
                    accessibilityRole="button"
                    accessibilityLabel={taken ? `${s.title}, already in your mix` : `Add ${s.title}`}
                    accessibilityState={{ disabled: taken }}
                    onPress={() => {
                      onAdd(s);
                      onClose();
                    }}
                    style={{
                      minHeight: 64,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 13,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: radius.md,
                      backgroundColor: 'rgba(255,255,255,0.045)',
                      borderWidth: 1,
                      borderColor: color.glassBorder,
                      opacity: taken ? 0.4 : 1,
                    }}
                  >
                    <LinearGradient
                      colors={mixerSoundColors(s.id)}
                      start={{ x: 0.1, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ width: 38, height: 38, borderRadius: radius.xs, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <SoundIcon name={s.icon} size={18} color="rgba(255,255,255,0.85)" />
                    </LinearGradient>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[t.card, { color: color.ink, fontSize: 14.5 }]} numberOfLines={1}>
                        {s.title}
                      </Text>
                      <Text style={[t.meta, { color: color.ink58 }]}>{s.category?.name ?? 'Sound'} · loops</Text>
                    </View>
                    {taken ? (
                      <Text style={[t.meta, { color: color.ink58 }]}>In mix</Text>
                    ) : (
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: 'rgba(255,255,255,0.09)',
                        }}
                      >
                        <Icon name="plus" size={16} color={color.accent} strokeWidth={2} />
                      </View>
                    )}
                  </PressScale>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}
