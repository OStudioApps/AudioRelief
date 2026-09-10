import React, { useState } from 'react';
import {
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, font, radius, safe, type as t } from '../theme';
import { LegalDoc } from '../legal/content';
import { PrimaryButton, RoundButton, SecondaryButton } from './Glass';
import { Icon } from './Icon';

/**
 * Full-document reader for the Terms of Service and Privacy Policy — reached
 * from the links on the account screen. Scrollable, with Agree and Cancel at
 * the foot so reading the document and accepting it happen in the same place.
 *
 * There is nowhere yet to persist "the user agreed" — the app has no backend —
 * so `onAgree` is a hook for whoever wires up account creation to call. This
 * component's job is only to make sure the document was actually shown.
 */
export function LegalModal({
  visible,
  doc,
  onAgree,
  onCancel,
}: {
  visible: boolean;
  doc: LegalDoc;
  onAgree: () => void;
  onCancel: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [atEnd, setAtEnd] = useState(false);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const bottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 24;
    if (bottom && !atEnd) setAtEnd(true);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: color.ground }}>
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: 'rgba(178,146,247,0.10)' },
          ]}
          pointerEvents="none"
        />

        <View
          style={{
            flex: 1,
            paddingTop: Math.max(insets.top, safe.top),
            paddingBottom: Math.max(insets.bottom, safe.bottom),
            paddingHorizontal: safe.side,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              minHeight: 44,
            }}
          >
            <View style={{ gap: 3 }}>
              <Text style={{ fontFamily: font.display, fontSize: 20, color: color.ink, letterSpacing: -0.3 }}>
                {doc.title}
              </Text>
              <Text style={[t.meta, { color: color.ink58 }]}>Last updated {doc.updated}</Text>
            </View>
            <RoundButton onPress={onCancel}>
              <Icon name="close" size={18} strokeWidth={1.8} />
            </RoundButton>
          </View>

          <View style={{ height: 18 }} />

          <View
            style={{
              flex: 1,
              borderRadius: radius.lg,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: color.glassBorder,
            }}
          >
            <BlurView
              intensity={40}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: color.glassFill }]} />

            <ScrollView
              style={{ flex: 1 }}
              onScroll={onScroll}
              scrollEventThrottle={64}
              showsVerticalScrollIndicator
              contentContainerStyle={{ padding: 20, gap: 4 }}
            >
              <Text style={[t.bodyMuted, { color: color.ink62, marginBottom: 14 }]}>{doc.intro}</Text>

              {doc.sections.map((s) => (
                <View key={s.heading} style={{ marginBottom: 20 }}>
                  <Text
                    style={{
                      fontFamily: font.semibold,
                      fontSize: 14.5,
                      color: color.ink,
                      marginBottom: 6,
                    }}
                  >
                    {s.heading}
                  </Text>
                  <Text style={[t.body, { color: color.ink62, fontSize: 13.5, lineHeight: 21 }]}>
                    {s.body}
                  </Text>
                </View>
              ))}

              <View style={{ height: 4 }} />
              <Text style={[t.meta, { color: color.ink58, fontStyle: 'italic' }]}>
                End of document.
              </Text>
            </ScrollView>
          </View>

          <View style={{ height: 14 }} />

          {!atEnd ? (
            <Text style={[t.meta, { color: color.ink58, textAlign: 'center', marginBottom: 8 }]}>
              Scroll to the end to continue
            </Text>
          ) : null}

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <SecondaryButton label="Cancel" onPress={onCancel} style={{ flex: 1 }} />
            <PrimaryButton
              label="Agree"
              onPress={onAgree}
              disabled={!atEnd}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
