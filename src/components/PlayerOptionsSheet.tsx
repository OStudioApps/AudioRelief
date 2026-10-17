import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { LOUD_THRESHOLD } from '../audio/assets';
import { usePlayer } from '../state';
import { color, font, safe, space, type as t } from '../theme';
import { Chip, RoundButton } from './Glass';
import { Icon } from './Icon';

/**
 * The player's "…" menu: the settings that are not transport controls.
 *
 * Volume lives here rather than on the player face, as in a music app — the
 * phone's own buttons cover the everyday case. It is still one tap away
 * because it is the app's own gain, kept under the hearing ceiling, and the
 * warning above LOUD_THRESHOLD has to be somewhere it will be seen.
 */
export function PlayerOptionsSheet({
  visible,
  showChannels,
  onClose,
}: {
  visible: boolean;
  /** Alternate recordings belong to the loop engine's sounds; tracks have none. */
  showChannels: boolean;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const p = usePlayer();
  const channels = showChannels && p.channels.length > 1 ? p.channels : [];

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

          <View
            style={{
              paddingTop: 12,
              paddingHorizontal: safe.side,
              paddingBottom: Math.max(insets.bottom, safe.bottom) + 8,
              gap: space.lg,
            }}
          >
            <View style={{ alignItems: 'center' }}>
              <View style={{ width: 40, height: 4, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.18)' }} />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
              <Text style={{ fontFamily: font.display, fontSize: 20, color: color.ink, letterSpacing: -0.3 }}>
                Sound
              </Text>
              <RoundButton onPress={onClose} label="Close">
                <Icon name="close" size={18} strokeWidth={1.8} />
              </RoundButton>
            </View>

            <View style={{ gap: space.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <Text style={[t.label, { color: color.ink58 }]}>Volume</Text>
                {/* The number is here so last night's setting can be found again. */}
                <Text style={[t.meta, { color: color.ink58 }]}>{p.volume}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                <Icon name="volume" size={18} color={color.ink58} />
                <Slider
                  style={{ flex: 1, height: 40 }}
                  accessibilityLabel="Volume"
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
                <Text style={[t.meta, { color: color.scaleMid }]}>
                  Loud enough to matter over a full night. Masking works better just under your tinnitus,
                  not over it.
                </Text>
              ) : null}
            </View>

            {/* Other recordings of the same subject; hidden for the generated noises. */}
            {channels.length ? (
              <View style={{ gap: space.sm }}>
                <Text style={[t.label, { color: color.ink58 }]}>Channels</Text>
                <View style={{ flexDirection: 'row', gap: space.sm }}>
                  {channels.map((c, i) => (
                    <Chip
                      key={c.id}
                      label={`Channel ${i + 1}`}
                      selected={p.channel === c.id}
                      onPress={() => p.setChannel(c.id)}
                      style={{ flex: 1, paddingHorizontal: 6 }}
                    />
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}
