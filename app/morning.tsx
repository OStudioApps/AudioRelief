import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Aurora } from '../src/components/Aurora';
import { GlassCard, PrimaryButton, RoundButton, SecondaryButton } from '../src/components/Glass';
import { Icon } from '../src/components/Icon';
import { color, font, motion, radius, safe, soundColor, type as t } from '../src/theme';

/**
 * One continuous night, consistent with Night mode:
 * in bed 23:05, asleep 23:31, rain playing through to a 6:40 alarm.
 */
export default function Morning() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [reused, setReused] = useState(false);

  const Stat = ({ value, label }: { value: string; label: string }) => (
    <GlassCard style={{ flex: 1, minHeight: 84, padding: 16, justifyContent: 'center', gap: 5 }}>
      <Text style={{ fontFamily: font.display, fontSize: 21, color: color.ink, letterSpacing: -0.2 }}>
        {value}
      </Text>
      <Text style={[t.meta, { color: color.ink58 }]}>{label}</Text>
    </GlassCard>
  );

  return (
    <View style={{ flex: 1, backgroundColor: color.ground }}>
      <Aurora
        blobs={[
          { size: 380, color: '#F0A868', opacity: 0.3, left: -40, top: -110, dx: 18, dy: 22, duration: motion.driftSlow },
          { size: 300, color: '#E2769B', opacity: 0.2, right: -110, top: 40 },
          { size: 320, color: color.accent, opacity: 0.16, left: 20, bottom: -170 },
        ]}
        scrim={['rgba(7,10,22,0.22)', 'rgba(7,10,22,0.68)', 'rgba(7,10,22,0.90)']}
      />

      <View
        style={{
          flex: 1,
          paddingTop: Math.max(insets.top, safe.top),
          paddingBottom: Math.max(insets.bottom, safe.bottom),
          paddingHorizontal: safe.side,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
          <Text style={[t.label, { color: color.ink58, fontSize: 12 }]}>Thursday morning</Text>
          <RoundButton onPress={() => router.back()}>
            <Icon name="close" size={18} strokeWidth={1.8} />
          </RoundButton>
        </View>

        <View style={{ height: 22 }} />

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
          <View style={{ gap: 8 }}>
            <Text style={[t.display, { color: color.ink }]}>You slept 7h 9m</Text>
            <Text style={[t.body, { color: color.ink62 }]}>
              Rain on a tin roof played through until your alarm.
            </Text>
          </View>

          <View style={{ height: 24 }} />

          <GlassCard style={{ padding: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: font.semibold, fontSize: 13, color: color.ink }}>Your night</Text>
              <Text style={[t.meta, { color: color.ink58 }]}>In bed 23:05 to 06:40</Text>
            </View>

            <View style={{ height: 18 }} />

            <View style={{ height: 34, borderRadius: radius.xs, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.06)' }}>
              <LinearGradient
                colors={[color.accent, `${color.accent}26`] as const}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={{ position: 'absolute', left: '5.7%', top: 0, bottom: 0, width: 2, backgroundColor: 'rgba(255,255,255,0.90)' }} />
            </View>

            <View style={{ height: 10 }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {['23:00', '01:00', '03:00', '05:00'].map((h) => (
                <Text key={h} style={[t.meta, { color: color.ink58 }]}>
                  {h}
                </Text>
              ))}
            </View>

            <View style={{ height: 10 }} />

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <View style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: color.accent }} />
                <Text style={[t.meta, { color: color.ink58 }]}>Sound on</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <View style={{ width: 2, height: 11, backgroundColor: 'rgba(255,255,255,0.90)' }} />
                <Text style={[t.meta, { color: color.ink58 }]}>You stopped moving</Text>
              </View>
            </View>
          </GlassCard>

          <View style={{ height: 16 }} />

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Stat value="23:31" label="Fell asleep" />
            <Stat value="26 min" label="Took to drift off" />
          </View>

          <View style={{ height: 16 }} />

          <GlassCard style={{ minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 16, paddingVertical: 12 }}>
            <LinearGradient
              colors={soundColor.rain as unknown as readonly [string, string]}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: 44, height: 44, borderRadius: radius.sm }}
            />
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={[t.card, { color: color.ink, fontSize: 14.5 }]}>Rain on a tin roof</Text>
              <Text style={[t.meta, { color: color.ink58 }]}>3 layers · no fade, stopped at your alarm</Text>
            </View>
            <Icon name="chevronRight" size={18} color={color.ink58} strokeWidth={1.8} />
          </GlassCard>

          <View style={{ height: 24 }} />

          <View style={{ gap: 10 }}>
            <PrimaryButton
              label={reused ? 'Set for tonight' : 'Set the same for tonight'}
              onPress={() => setReused((r) => !r)}
              left={reused ? <Icon name="check" size={18} color={color.onAccent} strokeWidth={2.2} /> : undefined}
            />
            <SecondaryButton label="Adjust the mix" onPress={() => router.push('/(tabs)/mix')} />
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
