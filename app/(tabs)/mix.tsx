import React, { useState } from 'react';
import { Animated, ScrollView, Text, View } from 'react-native';
import { PressScale, useToggleValue } from '../../src/components/Motion';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import { Aurora } from '../../src/components/Aurora';
import { AddSoundSheet } from '../../src/components/AddSoundSheet';
import { GlassCard, PrimaryButton, RoundButton } from '../../src/components/Glass';
import { Icon } from '../../src/components/Icon';
import { soundById } from '../../src/data/sounds';
import { usePlayer } from '../../src/state';
import { color, font, motion, radius, safe, type as t } from '../../src/theme';

const TAB_CLEARANCE = 118;

/** A muted layer settles down to 42% rather than snapping. */
function LayerDim({ on, children }: { on: boolean; children: React.ReactNode }) {
  const v = useToggleValue(on, 260);
  return (
    <Animated.View style={{ opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.42, 1] }) }}>
      {children}
    </Animated.View>
  );
}

export default function Mix() {
  const insets = useSafeAreaInsets();
  const p = usePlayer();
  const [saved, setSaved] = useState(false);
  const [picking, setPicking] = useState(false);

  const layers = p.mixLayers.map(soundById).filter(Boolean) as NonNullable<
    ReturnType<typeof soundById>
  >[];

  return (
    <View style={{ flex: 1, backgroundColor: color.ground }}>
      <Aurora
        blobs={[
          { size: 280, color: color.accent, opacity: 0.26, left: -80, top: -70, duration: motion.driftSlow },
          { size: 300, color: color.violet, opacity: 0.24, right: -110, top: 300, dx: -26, dy: 24 },
        ]}
      />

      <View style={{ flex: 1, paddingTop: Math.max(insets.top, safe.top), paddingHorizontal: safe.side }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
          <View style={{ width: 44 }} />
          <Text style={[t.label, { color: color.ink58 }]}>Mixer</Text>
          <RoundButton
            onPress={() => {
              p.resetLayers();
              setSaved(false);
            }}
          >
            <Icon name="refresh" size={19} />
          </RoundButton>
        </View>

        <View style={{ height: 20 }} />

        <View style={{ gap: 7 }}>
          <Text style={[t.screen, { color: color.ink }]}>{p.title}</Text>
          <Text style={[t.bodyMuted, { color: color.ink58 }]}>
            {p.activeLayers} of {layers.length} layers playing · {p.fade.toLowerCase()}
          </Text>
        </View>

        <View style={{ height: 20 }} />

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: TAB_CLEARANCE }}>
          {layers.map((l) => {
            const on = p.layerOn[l.id];
            const vol = p.layerVol[l.id] ?? 50;
            return (
              <LayerDim key={l.id} on={on}>
              <GlassCard style={{ padding: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 }}>
                  <LinearGradient
                    colors={l.colors as unknown as readonly [string, string]}
                    start={{ x: 0.1, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ width: 34, height: 34, borderRadius: radius.xs }}
                  />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[t.card, { color: color.ink }]}>{l.name}</Text>
                    <Text style={[t.meta, { color: color.ink58 }]}>{l.meta}</Text>
                  </View>
                  <PressScale
                    onPress={() => p.toggleLayer(l.id)}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: radius.sm,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: on ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.035)',
                    }}
                  >
                    <Icon
                      name={on ? 'volumeLow' : 'volumeOff'}
                      size={19}
                      color={on ? l.colors[0] : color.ink58}
                    />
                  </PressScale>
                  <PressScale
                    onPress={() => p.removeLayer(l.id)}
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
                  minimumValue={0}
                  maximumValue={100}
                  step={1}
                  value={vol}
                  onValueChange={(v) => p.setLayerVol(l.id, Math.round(v))}
                  minimumTrackTintColor={l.colors[0]}
                  maximumTrackTintColor="rgba(255,255,255,0.14)"
                  thumbTintColor={color.ink}
                />
              </GlassCard>
              </LayerDim>
            );
          })}

          <PressScale
            onPress={() => setPicking(true)}
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
            <Text style={{ fontFamily: font.semibold, fontSize: 14, color: color.ink72 }}>Add a sound</Text>
          </PressScale>

          <View style={{ height: 4 }} />

          <PrimaryButton
            label={saved ? 'Saved for tonight' : 'Save as tonight’s mix'}
            onPress={() => setSaved((s) => !s)}
            left={saved ? <Icon name="check" size={18} color={color.onAccent} strokeWidth={2.2} /> : undefined}
          />
        </ScrollView>
      </View>

      <AddSoundSheet
        visible={picking}
        inMix={p.mixLayers}
        onAdd={(id) => {
          p.addLayer(id);
          setSaved(false);
        }}
        onClose={() => setPicking(false)}
      />
    </View>
  );
}
