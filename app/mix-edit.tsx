import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import { Aurora } from '../src/components/Aurora';
import { AddSoundSheet } from '../src/components/AddSoundSheet';
import { GlassCard, PrimaryButton, RoundButton } from '../src/components/Glass';
import { Icon } from '../src/components/Icon';
import { PressScale } from '../src/components/Motion';
import { soundById } from '../src/data/sounds';
import { MixLayer, useMixes } from '../src/mixes';
import { color, font, motion, radius, safe, space, type as t } from '../src/theme';

/**
 * Building one mix: name it, add sounds from the library, set how loud each
 * one sits, save it.
 *
 * Everything here is local to the screen until Save. The old mixer edited the
 * live player as you went, which meant backing out left the sound changed
 * anyway and there was no such thing as cancelling.
 */

const DEFAULT_LAYER_VOLUME = 60;

export default function MixEdit() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { byId, save, remove } = useMixes();

  const existing = id ? byId(id) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [layers, setLayers] = useState<MixLayer[]>(existing?.layers ?? []);
  const [picking, setPicking] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const canSave = name.trim().length > 0 && layers.length > 0;

  const setVol = (sid: string, vol: number) =>
    setLayers((ls) => ls.map((l) => (l.id === sid ? { ...l, vol } : l)));
  const toggle = (sid: string) =>
    setLayers((ls) => ls.map((l) => (l.id === sid ? { ...l, on: !l.on } : l)));
  const drop = (sid: string) => setLayers((ls) => ls.filter((l) => l.id !== sid));

  return (
    <View style={{ flex: 1, backgroundColor: color.ground }}>
      <Aurora
        blobs={[
          { size: 300, color: color.accent, opacity: 0.24, left: -90, top: -60, duration: motion.driftSlow },
          { size: 280, color: color.violet, opacity: 0.24, right: -100, bottom: -60, dx: -24, dy: 26 },
        ]}
      />

      <View
        style={{
          flex: 1,
          paddingTop: Math.max(insets.top, safe.top),
          paddingHorizontal: safe.side,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
          <RoundButton label="Cancel" onPress={() => router.back()}>
            <Icon name="close" size={18} strokeWidth={1.8} />
          </RoundButton>
          <Text style={[t.label, { color: color.ink58 }]}>{existing ? 'Edit mix' : 'New mix'}</Text>
          <View style={{ width: 44 }} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingTop: space.lg, paddingBottom: 24, gap: space.xl }}
          >
            <View style={{ gap: space.sm }}>
              <Text style={[t.label, { color: color.ink58 }]}>Name</Text>
              <GlassCard
                r={radius.md}
                style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}
              >
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Rain and a fan"
                  placeholderTextColor={color.ink58}
                  maxLength={40}
                  accessibilityLabel="Mix name"
                  style={{
                    flex: 1,
                    alignSelf: 'stretch',
                    fontFamily: t.body.fontFamily,
                    fontSize: 14.5,
                    color: color.ink,
                    // Static inputs paint under the card's blur, which frosts
                    // the text and eats the taps. Positioning lifts it above.
                    position: 'relative',
                    outlineStyle: 'none',
                  } as never}
                />
              </GlassCard>
            </View>

            <View style={{ gap: space.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <Text style={[t.label, { color: color.ink58 }]}>Sounds</Text>
                <Text style={[t.meta, { color: color.ink58 }]}>
                  {layers.length ? `${layers.length} added` : 'None yet'}
                </Text>
              </View>

              {layers.map((l) => {
                const s = soundById(l.id);
                if (!s) return null;
                return (
                  <GlassCard key={l.id} style={{ padding: 14, opacity: l.on ? 1 : 0.52 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 }}>
                      <LinearGradient
                        colors={s.colors as unknown as readonly [string, string]}
                        start={{ x: 0.1, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ width: 34, height: 34, borderRadius: radius.xs }}
                      />
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[t.card, { color: color.ink }]} numberOfLines={1}>{s.name}</Text>
                        <Text style={[t.meta, { color: color.ink58 }]} numberOfLines={1}>{s.meta}</Text>
                      </View>
                      <PressScale
                        onPress={() => toggle(l.id)}
                        accessibilityRole="button"
                        accessibilityLabel={l.on ? `Mute ${s.name}` : `Unmute ${s.name}`}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: radius.sm,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: l.on ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.035)',
                        }}
                      >
                        <Icon
                          name={l.on ? 'volumeLow' : 'volumeOff'}
                          size={19}
                          color={l.on ? s.colors[0] : color.ink58}
                        />
                      </PressScale>
                      <PressScale
                        onPress={() => drop(l.id)}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${s.name}`}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: radius.sm,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon name="close" size={16} color={color.ink58} strokeWidth={1.8} />
                      </PressScale>
                    </View>
                    <Slider
                      style={{ width: '100%', height: 34 }}
                      accessibilityLabel={`${s.name} volume`}
                      minimumValue={0}
                      maximumValue={100}
                      step={1}
                      value={l.vol}
                      onValueChange={(v) => setVol(l.id, Math.round(v))}
                      minimumTrackTintColor={s.colors[0]}
                      maximumTrackTintColor="rgba(255,255,255,0.14)"
                      thumbTintColor={color.ink}
                    />
                  </GlassCard>
                );
              })}

              <PressScale
                onPress={() => setPicking(true)}
                accessibilityRole="button"
                accessibilityLabel="Add a sound"
                style={{
                  minHeight: 56,
                  borderRadius: radius.lg,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 9,
                  borderWidth: 1.5,
                  borderStyle: 'dashed',
                  borderColor: 'rgba(255,255,255,0.16)',
                }}
              >
                <Icon name="plus" size={18} color={color.ink72} strokeWidth={1.8} />
                <Text style={{ fontFamily: font.semibold, fontSize: 14, color: color.ink72 }}>
                  Add a sound
                </Text>
              </PressScale>
            </View>

            <View style={{ gap: space.sm }}>
              <PrimaryButton
                label={existing ? 'Save changes' : 'Save mix'}
                disabled={!canSave}
                onPress={() => {
                  save({ id: existing?.id, name, layers });
                  router.back();
                }}
              />
              {/* Says which of the two things is missing, rather than leaving
                  a dead grey button to be puzzled over. */}
              {!canSave ? (
                <Text style={[t.meta, { color: color.ink58, textAlign: 'center' }]}>
                  {layers.length === 0 ? 'Add at least one sound' : 'Give your mix a name'}
                </Text>
              ) : null}
            </View>

            {existing ? (
              <PressScale
                onPress={() => {
                  if (!confirmDelete) {
                    setConfirmDelete(true);
                    return;
                  }
                  remove(existing.id);
                  router.back();
                }}
                accessibilityRole="button"
                accessibilityLabel={confirmDelete ? 'Tap again to delete this mix' : 'Delete this mix'}
                style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ fontFamily: t.body.fontFamily, fontSize: 13.5, color: color.scaleBad }}>
                  {confirmDelete ? 'Tap again to delete' : 'Delete this mix'}
                </Text>
              </PressScale>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      <AddSoundSheet
        visible={picking}
        inMix={layers.map((l) => l.id)}
        onAdd={(sid) =>
          setLayers((ls) =>
            ls.some((l) => l.id === sid) ? ls : [...ls, { id: sid, vol: DEFAULT_LAYER_VOLUME, on: true }],
          )
        }
        onClose={() => setPicking(false)}
      />
    </View>
  );
}
