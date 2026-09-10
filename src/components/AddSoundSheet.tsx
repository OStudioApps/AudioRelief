import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CATEGORIES, SOUNDS } from '../data/sounds';
import { color, font, radius, safe, type as t } from '../theme';
import { Chip, RoundButton } from './Glass';
import { PressScale } from './Motion';
import { Icon } from './Icon';

/**
 * The app's own sound gallery, for adding a layer to the mix.
 * Sounds already in the mix are listed as taken rather than hidden, so the
 * catalogue does not appear to shrink as you build a mix.
 */
export function AddSoundSheet({
  visible,
  inMix,
  onAdd,
  onClose,
}: {
  visible: boolean;
  inMix: string[];
  onAdd: (id: string) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [cat, setCat] = useState<string>('all');

  const list = cat === 'all' ? SOUNDS : SOUNDS.filter((s) => s.cat === cat);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(2,4,10,0.62)' }]} />
        </Pressable>

        <View
          style={{
            maxHeight: '86%',
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
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(14,18,36,0.86)' }]} />

          <View style={{ paddingTop: 12, paddingBottom: Math.max(insets.bottom, safe.bottom) }}>
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
                  {inMix.length} in your mix · from the AudioRelief library
                </Text>
              </View>
              <RoundButton onPress={onClose}>
                <Icon name="close" size={18} strokeWidth={1.8} />
              </RoundButton>
            </View>

            <View style={{ height: 16 }} />

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: safe.side }}>
              {CATEGORIES.map((c) => (
                <Chip key={c.id} label={c.label} selected={cat === c.id} onPress={() => setCat(c.id)} />
              ))}
            </View>

            <View style={{ height: 14 }} />

            <ScrollView style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: safe.side, gap: 8, paddingBottom: 8 }}
            >
              {list.map((s) => {
                const taken = inMix.includes(s.id);
                return (
                  <PressScale
                    key={s.id}
                    disabled={taken}
                    onPress={() => {
                      onAdd(s.id);
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
                      colors={s.colors as unknown as readonly [string, string]}
                      start={{ x: 0.1, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ width: 38, height: 38, borderRadius: radius.xs }}
                    />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[t.card, { color: color.ink, fontSize: 14.5 }]}>{s.name}</Text>
                      <Text style={[t.meta, { color: color.ink58 }]}>{s.meta}</Text>
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
