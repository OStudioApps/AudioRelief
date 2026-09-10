import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PressScale } from '../../src/components/Motion';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '../../src/components/Icon';
import { usePlayer } from '../../src/state';
import { color, font, radius, safe, type as t } from '../../src/theme';

/**
 * Night mode — the screen you actually see at 3 a.m.
 * Deliberately below the 4.5:1 contrast floor: less light beats more legibility here.
 */
export default function Sleep() {
  const insets = useSafeAreaInsets();
  const p = usePlayer();
  const [awake, setAwake] = useState(false);

  const status = !p.playing
    ? 'Paused · nothing is playing'
    : p.nightVolume === 0
      ? 'Playing until morning · muted'
      : `Playing until morning · volume ${p.nightVolume}%`;

  const Control = ({
    icon,
    label,
    onPress,
  }: {
    icon: React.ReactNode;
    label: string;
    onPress: () => void;
  }) => (
    <PressScale
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 76,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderRadius: radius.lg,
        backgroundColor: color.glassFill,
        borderWidth: 1,
        borderColor: color.glassBorder,
      }}
    >
      {icon}
      <Text style={{ fontFamily: t.body.fontFamily, fontSize: 11, color: 'rgba(238,241,255,0.60)' }}>
        {label}
      </Text>
    </PressScale>
  );

  return (
    <Pressable onPress={() => setAwake((a) => !a)} style={{ flex: 1, backgroundColor: color.night }}>
      <LinearGradient
        colors={[`${color.accent}22`, 'rgba(2,4,10,0)'] as const}
        start={{ x: 0.5, y: 0.1 }}
        end={{ x: 0.5, y: 0.75 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View
        style={{
          flex: 1,
          paddingTop: Math.max(insets.top, safe.top),
          paddingBottom: Math.max(insets.bottom, safe.bottom) + 84,
          paddingHorizontal: safe.side,
        }}
      >
        <View style={{ alignItems: 'center', minHeight: 32, justifyContent: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, opacity: awake ? 1 : 0.38 }}>
            <Icon
              name={p.alarmOn ? 'alarm' : 'alarmOff'}
              size={14}
              color="rgba(238,241,255,0.55)"
              strokeWidth={1.8}
            />
            <Text style={{ fontFamily: t.body.fontFamily, fontSize: 12, color: 'rgba(238,241,255,0.55)' }}>
              {p.alarmOn ? 'Alarm 6:40' : 'No alarm set'}
            </Text>
          </View>
        </View>

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <Text
            style={{
              fontFamily: font.displayRegular,
              fontSize: 92,
              lineHeight: 98,
              letterSpacing: -4,
              color: awake ? 'rgba(238,241,255,0.92)' : 'rgba(238,241,255,0.40)',
            }}
          >
            2:47
          </Text>
          <View style={{ alignItems: 'center', gap: 5, opacity: awake ? 1 : 0.38 }}>
            <Text style={{ fontFamily: font.semibold, fontSize: 14, color: color.ink72 }}>{p.title}</Text>
            <Text style={{ fontFamily: t.body.fontFamily, fontSize: 12.5, color: 'rgba(238,241,255,0.42)' }}>
              {status}
            </Text>
          </View>
        </View>

        {awake ? (
          <View style={{ gap: 14 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Control
                icon={<Icon name={p.playing ? 'pause' : 'play'} size={20} color="rgba(238,241,255,0.86)" />}
                label={p.playing ? 'Pause' : 'Play'}
                onPress={p.togglePlay}
              />
              <Control
                icon={<Icon name="volumeLow" size={20} color="rgba(238,241,255,0.86)" />}
                label={p.nightVolume === 0 ? 'Muted' : `${p.nightVolume}%`}
                onPress={p.stepNightVolume}
              />
              <Control
                icon={
                  <Icon
                    name={p.alarmOn ? 'alarm' : 'alarmOff'}
                    size={20}
                    color="rgba(238,241,255,0.86)"
                  />
                }
                label={p.alarmOn ? 'Alarm on' : 'Alarm off'}
                onPress={p.toggleAlarm}
              />
            </View>
            <Text
              style={{
                fontFamily: t.body.fontFamily,
                fontSize: 12,
                textAlign: 'center',
                color: 'rgba(238,241,255,0.34)',
              }}
            >
              Tap the background to dim again
            </Text>
          </View>
        ) : (
          <View style={{ alignItems: 'center', minHeight: 90, justifyContent: 'center' }}>
            <Text
              style={{
                fontFamily: t.body.fontFamily,
                fontSize: 12.5,
                letterSpacing: 0.7,
                color: 'rgba(238,241,255,0.24)',
              }}
            >
              Tap anywhere for controls
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
