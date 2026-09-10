import React, { useEffect, useRef } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PressScale } from '../src/components/Motion';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import { Aurora } from '../src/components/Aurora';
import { Chip, RoundButton, SecondaryButton } from '../src/components/Glass';
import { HeartIcon, Icon } from '../src/components/Icon';
import { TIMERS } from '../src/data/sounds';
import { usePlayer } from '../src/state';
import { LOUD_THRESHOLD } from '../src/audio/assets';
import { color, font, glow, motion, radius, safe, type as t } from '../src/theme';

function Visualiser({ colors, active }: { colors: readonly [string, string]; active: boolean }) {
  const rings = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  const breath = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) return;
    const loops = rings.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay((motion.breath / 3) * i),
          Animated.timing(v, { toValue: 1, duration: motion.breath, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        ]),
      ),
    );
    const b = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 1, duration: motion.breath / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(breath, { toValue: 0, duration: motion.breath / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loops.forEach((l) => l.start());
    b.start();
    return () => {
      loops.forEach((l) => l.stop());
      b.stop();
    };
  }, [active]);

  return (
    <View style={{ height: 250, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 210, height: 210, alignItems: 'center', justifyContent: 'center' }}>
        {rings.map((v, i) => (
          <Animated.View
            key={i}
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: 105,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.22)',
                opacity: active ? v.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 0.5, 0] }) : 0,
                transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1.5] }) }],
              },
            ]}
          />
        ))}
        <Animated.View
          style={{
            width: 150,
            height: 150,
            borderRadius: 75,
            overflow: 'hidden',
            boxShadow: glow(colors[0], 0.4, 56, 0),
            transform: [{ scale: breath.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.06] }) }],
          }}
        >
          <LinearGradient
            colors={colors as unknown as readonly [string, string]}
            start={{ x: 0.35, y: 0.2 }}
            end={{ x: 0.9, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
    </View>
  );
}

export default function Player() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const p = usePlayer();

  return (
    <View style={{ flex: 1, backgroundColor: color.ground }}>
      <Aurora
        blobs={[
          { size: 340, color: p.colors[0], opacity: 0.38, left: -60, top: 40, duration: motion.driftFast },
          { size: 300, color: color.accent, opacity: 0.24, right: -100, top: -40, dx: -28, dy: 30, duration: motion.driftSlow },
          { size: 300, color: color.violet, opacity: 0.24, left: 60, bottom: -160 },
        ]}
        scrim={['rgba(7,10,22,0.44)', 'rgba(7,10,22,0.28)', 'rgba(7,10,22,0.86)']}
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
          <RoundButton onPress={() => router.back()}>
            <Icon name="chevronDown" />
          </RoundButton>
          <Text style={[t.label, { color: color.ink58 }]}>Playing</Text>
          <RoundButton>
            <Icon name="mixer" size={19} />
          </RoundButton>
        </View>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
          <Visualiser colors={p.colors} active={p.playing} />

          <View style={{ alignItems: 'center', gap: 8 }}>
            <Text
              style={{
                fontFamily: font.display,
                fontSize: 30,
                color: color.ink,
                letterSpacing: -0.9,
                lineHeight: 34,
                textAlign: 'center',
              }}
            >
              {p.title}
            </Text>
            <Text style={[t.bodyMuted, { color: color.ink62, textAlign: 'center' }]}>{p.subtitle}</Text>
          </View>

          <View style={{ height: 20 }} />

          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: font.semibold, fontSize: 13, color: color.ink }}>{p.timerStop}</Text>
              <Text style={[t.meta, { color: color.ink58, fontSize: 12 }]}>{p.timerFade}</Text>
            </View>
            {/* Not an audio scrub — white noise has no position. This is the sleep timer. */}
            <View style={{ height: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.10)', overflow: 'hidden' }}>
              <LinearGradient
                colors={[color.accent, p.colors[0]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ width: `${Math.max(p.timerPct * 100, 2)}%`, height: '100%', borderRadius: 999 }}
              />
            </View>
          </View>

          <View style={{ height: 18 }} />

          <View style={{ flexDirection: 'row', gap: 8 }}>
            {TIMERS.map((x) => (
              <Chip
                key={x.id}
                label={x.label}
                selected={p.timer === x.id}
                onPress={() => p.setTimer(x.id)}
                style={{ flex: 1 }}
              />
            ))}
          </View>

          <View style={{ height: 12 }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Icon name="volume" size={18} color={color.ink58} />
            <Slider
              style={{ flex: 1, height: 34 }}
              minimumValue={0}
              maximumValue={100}
              step={1}
              value={p.volume}
              onValueChange={(v) => p.setVolume(Math.round(v))}
              minimumTrackTintColor={color.accent}
              maximumTrackTintColor="rgba(255,255,255,0.14)"
              thumbTintColor={color.ink}
            />
            <Icon name="volumeHigh" size={18} color={color.ink58} />
          </View>

          {p.volume > LOUD_THRESHOLD ? (
            <Text style={[t.meta, { color: '#F2A365', marginTop: 6 }]}>
              Loud enough to matter over a full night. Masking works better just under your
              tinnitus, not over it.
            </Text>
          ) : null}

          <View style={{ height: 12 }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <PressScale
              onPress={() => router.push('/(tabs)/mix')}
              style={{
                width: 64,
                height: 64,
                borderRadius: radius.lg,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                backgroundColor: color.glassFill,
                borderWidth: 1,
                borderColor: color.glassBorder,
              }}
            >
              <Icon name="mixer" size={20} />
              <Text style={{ fontFamily: t.body.fontFamily, fontSize: 11, color: color.ink72 }}>
                {p.activeLayers} layers
              </Text>
            </PressScale>

            <PressScale
              onPress={p.togglePlay}
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: color.accent,
                boxShadow: glow(color.accent, 0.36, 28, 8),
              }}
            >
              <Icon name={p.playing ? 'pause' : 'play'} size={24} color={color.onAccent} />
            </PressScale>

            <PressScale
              onPress={p.toggleFavourite}
              style={{
                width: 64,
                height: 64,
                borderRadius: radius.lg,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                backgroundColor: color.glassFill,
                borderWidth: 1,
                borderColor: color.glassBorder,
              }}
            >
              <HeartIcon filled={p.favourite} />
              <Text style={{ fontFamily: t.body.fontFamily, fontSize: 11, color: color.ink72 }}>Saved</Text>
            </PressScale>
          </View>

          <View style={{ height: 16 }} />

          <SecondaryButton label="Dim the screen and sleep" onPress={() => router.push('/(tabs)/sleep')} />
        </ScrollView>
      </View>
    </View>
  );
}
