import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SLEEP_OPTIONS } from '../audio/tracks';
import { formatClock } from '../data/library';
import { color, font, radius, safe, type as t } from '../theme';
import { RoundButton } from './Glass';
import { Icon } from './Icon';
import { PressScale } from './Motion';

/**
 * Pick when the library player stops itself. Choosing a length always
 * restarts it, including the one already running.
 */
export function SleepTimerSheet({
  visible,
  selected,
  remaining,
  onPick,
  onClose,
}: {
  visible: boolean;
  selected: string | null;
  remaining: number | null;
  onPick: (id: string | null) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const pick = (id: string | null) => {
    onPick(id);
    onClose();
  };

  const status =
    selected == null
      ? 'Off · the sound plays until you stop it'
      : selected === 'track'
        ? 'Stops when this track ends'
        : `Stops in ${formatClock(remaining ?? 0)} · fades over the last 30 s`;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close">
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(2,4,10,0.62)' }]} />
        </Pressable>

        <View
          style={{
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            overflow: 'hidden',
            borderTopWidth: 1,
            borderColor: color.glassBorder,
          }}
        >
          <BlurView intensity={60} tint="dark" pointerEvents="none" style={StyleSheet.absoluteFill} />
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(14,18,36,0.9)' }]} />

          <View style={{ paddingTop: 12, paddingBottom: Math.max(insets.bottom, safe.bottom) + 8 }}>
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
              <View style={{ gap: 3, flex: 1 }}>
                <Text style={{ fontFamily: font.display, fontSize: 20, color: color.ink, letterSpacing: -0.3 }}>
                  Sleep timer
                </Text>
                <Text style={[t.meta, { color: selected ? color.accent : color.ink58, fontVariant: ['tabular-nums'] }]}>
                  {status}
                </Text>
              </View>
              <RoundButton onPress={onClose} label="Close">
                <Icon name="close" size={18} strokeWidth={1.8} />
              </RoundButton>
            </View>

            <View style={{ height: 12 }} />

            <View style={{ paddingHorizontal: safe.side - 6 }}>
              {SLEEP_OPTIONS.map((o) => {
                const on = selected === o.id;
                return (
                  <PressScale
                    key={o.id}
                    onPress={() => pick(o.id)}
                    accessibilityRole="button"
                    accessibilityLabel={o.label}
                    accessibilityState={{ selected: on }}
                    scaleTo={0.98}
                    style={{
                      minHeight: 48,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingHorizontal: 12,
                      borderRadius: radius.sm,
                      backgroundColor: on ? color.glassFillActive : 'transparent',
                    }}
                  >
                    <Text style={[t.body, { color: on ? color.accent : color.ink82 }]}>{o.label}</Text>
                    {on ? <Icon name="check" size={18} color={color.accent} strokeWidth={2} /> : null}
                  </PressScale>
                );
              })}

              {selected ? (
                <PressScale
                  onPress={() => pick(null)}
                  accessibilityRole="button"
                  accessibilityLabel="Turn off timer"
                  scaleTo={0.98}
                  style={{
                    minHeight: 48,
                    marginTop: 6,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    paddingHorizontal: 12,
                    borderRadius: radius.sm,
                    borderWidth: 1,
                    borderColor: color.glassBorder,
                  }}
                >
                  <Icon name="close" size={16} color={color.scaleBad} strokeWidth={2} />
                  <Text style={[t.body, { color: color.scaleBad }]}>Turn off timer</Text>
                </PressScale>
              ) : null}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
