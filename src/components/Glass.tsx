import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { color, glow, radius, type as t } from '../theme';
import { PressScale } from './Motion';

/** One glass recipe for the whole app: 5.5% fill, 9% border, a real blur behind it. */
export function GlassCard({
  style,
  children,
  intensity = 18,
  r = radius.lg,
  active = false,
}: {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  intensity?: number;
  r?: number;
  active?: boolean;
}) {
  return (
    <View
      style={[
        {
          borderRadius: r,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: color.glassBorder,
        },
        style,
      ]}
    >
      <BlurView
        intensity={intensity}
        tint="dark"
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: active ? color.glassFillActive : color.glassFill },
        ]}
      />
      {children}
    </View>
  );
}

/** A 44x44 round control — the smallest thing anyone is asked to hit. */
export function RoundButton({
  onPress,
  children,
  style,
}: {
  onPress?: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <PressScale
      onPress={onPress}
      hitSlop={6}
      scaleTo={0.9}
      style={[
        {
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: color.glassFill,
          borderWidth: 1,
          borderColor: color.glassBorder,
        },
        style,
      ]}
    >
      {children}
    </PressScale>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  tint = color.accent,
  style,
  left,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  tint?: string;
  style?: StyleProp<ViewStyle>;
  left?: React.ReactNode;
}) {
  return (
    <PressScale
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={[
        {
          minHeight: 52,
          borderRadius: radius.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 9,
          paddingHorizontal: 18,
          backgroundColor: disabled ? color.glassFill : tint,
          borderWidth: disabled ? 1 : 0,
          borderColor: color.glassBorder,
          boxShadow: disabled ? undefined : glow(tint),
        },
        style,
      ]}
    >
      {left}
      <Text
        style={{
          fontFamily: t.card.fontFamily,
          fontSize: 14.5,
          color: disabled ? 'rgba(238,241,255,0.46)' : color.onAccent,
        }}
      >
        {label}
      </Text>
    </PressScale>
  );
}

export function SecondaryButton({
  label,
  onPress,
  style,
  left,
}: {
  label: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  left?: React.ReactNode;
}) {
  return (
    <PressScale
      onPress={onPress}
      style={[
        {
          minHeight: 52,
          borderRadius: radius.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 9,
          backgroundColor: color.glassFill,
          borderWidth: 1,
          borderColor: color.glassBorder,
        },
        style,
      ]}
    >
      {left}
      <Text style={{ fontFamily: t.card.fontFamily, fontSize: 14, color: color.ink82 }}>
        {label}
      </Text>
    </PressScale>
  );
}

/** Selectable pill — timer lengths, categories, fade lengths. */
export function Chip({
  label,
  selected,
  onPress,
  style,
}: {
  label: string;
  selected: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <PressScale
      onPress={onPress}
      scaleTo={0.94}
      style={[
        {
          minHeight: 46,
          paddingHorizontal: 12,
          borderRadius: radius.sm,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: selected ? color.glassFillActive : 'rgba(255,255,255,0.04)',
          borderWidth: 1.5,
          borderColor: selected ? color.accent : color.glassBorder,
        },
        style,
      ]}
    >
      <Text
        style={{
          fontFamily: t.card.fontFamily,
          fontSize: 13,
          color: selected ? color.accent : color.ink62,
        }}
      >
        {label}
      </Text>
    </PressScale>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={[t.card, { color: color.ink, fontSize: 15 }]}>{children}</Text>;
}
