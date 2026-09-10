import React, { useRef, useState } from 'react';
import { Animated, ScrollView, Text, View } from 'react-native';
import { PressScale, useToggleValue } from '../../src/components/Motion';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Aurora } from '../../src/components/Aurora';
import { AppleGlyph, GoogleGlyph } from '../../src/components/BrandIcons';
import { GlassCard, PrimaryButton, RoundButton, SecondaryButton } from '../../src/components/Glass';
import { Icon } from '../../src/components/Icon';
import { LegalModal } from '../../src/components/LegalModal';
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from '../../src/legal/content';
import { color, font, motion, radius, safe, type as t } from '../../src/theme';

function Field({ icon, placeholder, trailing }: { icon: 'mail' | 'lock'; placeholder: string; trailing?: React.ReactNode }) {
  return (
    <GlassCard
      r={radius.md}
      style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16 }}
    >
      <Icon name={icon} size={19} color={color.ink58} />
      <Text style={{ fontFamily: t.body.fontFamily, fontSize: 14.5, color: color.ink58, flex: 1 }}>
        {placeholder}
      </Text>
      {trailing}
    </GlassCard>
  );
}

export default function Auth() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'up' | 'in'>('up');
  const [segW, setSegW] = useState(0);
  const up = mode === 'up';
  const slide = useToggleValue(!up, 260);
  const [legalDoc, setLegalDoc] = useState<'terms' | 'privacy' | null>(null);
  const [accepted, setAccepted] = useState<{ terms: boolean; privacy: boolean }>({
    terms: false,
    privacy: false,
  });

  return (
    <View style={{ flex: 1, backgroundColor: color.ground }}>
      <Aurora
        blobs={[
          { size: 340, color: color.accent, opacity: 0.28, left: -90, top: -90, duration: motion.driftSlow },
          { size: 300, color: color.violet, opacity: 0.26, right: -100, bottom: -100, dx: -24, dy: 28 },
        ]}
      />

      <View
        style={{
          flex: 1,
          paddingTop: Math.max(insets.top, safe.top),
          paddingBottom: Math.max(insets.bottom, safe.bottom),
          paddingHorizontal: safe.side,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <RoundButton onPress={() => router.back()}>
            <Icon name="chevronLeft" />
          </RoundButton>
        </View>

        <View style={{ height: 24 }} />

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
          <View style={{ gap: 10 }}>
            <Text style={[t.title, { color: color.ink }]}>
              {up ? 'Create your account' : 'Welcome back'}
            </Text>
            <Text style={[t.bodyMuted, { color: color.ink62 }]}>
              {up
                ? 'So your mixes and your sleep history follow you to any device.'
                : 'Your mixes and your sleep history are waiting where you left them.'}
            </Text>
          </View>

          <View style={{ height: 24 }} />

          {/* Segmented control — one indicator slides rather than two backgrounds blinking */}
          <View
            onLayout={(e) => setSegW(e.nativeEvent.layout.width)}
            style={{
              flexDirection: 'row',
              gap: 4,
              padding: 4,
              minHeight: 48,
              borderRadius: radius.md,
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderWidth: 1,
              borderColor: color.glassBorder,
            }}
          >
            <Animated.View
              style={{
                position: 'absolute',
                left: 4,
                top: 4,
                bottom: 4,
                width: Math.max((segW - 12) / 2, 0),
                borderRadius: radius.sm,
                backgroundColor: 'rgba(255,255,255,0.10)',
                transform: [
                  {
                    translateX: slide.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, Math.max((segW - 12) / 2 + 4, 0)],
                    }),
                  },
                ],
              }}
            />
            {(['up', 'in'] as const).map((m) => {
              const on = mode === m;
              return (
                <PressScale
                  key={m}
                  onPress={() => setMode(m)}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: radius.sm,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: t.card.fontFamily,
                      fontSize: 13.5,
                      color: on ? color.accent : color.ink58,
                    }}
                  >
                    {m === 'up' ? 'Create account' : 'Sign in'}
                  </Text>
                </PressScale>
              );
            })}
          </View>

          <View style={{ height: 20 }} />

          <View style={{ gap: 10 }}>
            <PrimaryButton
              label="Continue with Apple"
              tint="rgba(255,255,255,0.92)"
              left={<AppleGlyph size={22} color={color.onAccent} />}
            />
            <SecondaryButton label="Continue with Google" left={<GoogleGlyph size={18} />} />
          </View>

          <View style={{ height: 20 }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.10)' }} />
            <Text style={[t.label, { color: color.ink58 }]}>or use email</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.10)' }} />
          </View>

          <View style={{ height: 20 }} />

          <Field icon="mail" placeholder="Email address" />
          <View style={{ height: 12 }} />
          <Field
            icon="lock"
            placeholder={up ? 'Choose a password' : 'Password'}
            trailing={<Icon name="eye" size={19} color={color.ink58} />}
          />

          <View style={{ height: 20 }} />

          <PrimaryButton
            label={up ? 'Create account' : 'Sign in'}
            onPress={() => router.replace('/(tabs)/tonight')}
          />

          <View style={{ height: 20 }} />

          <View style={{ alignItems: 'center', minHeight: 36, justifyContent: 'center' }}>
            {up ? (
              <Text style={[t.meta, { color: color.ink58, fontSize: 12, textAlign: 'center', lineHeight: 18 }]}>
                By continuing you agree to the{' '}
                <Text
                  onPress={() => setLegalDoc('terms')}
                  style={{ color: accepted.terms ? color.accent : color.ink72, fontFamily: font.semibold }}
                >
                  Terms of Service
                </Text>
                {' '}and{' '}
                <Text
                  onPress={() => setLegalDoc('privacy')}
                  style={{ color: accepted.privacy ? color.accent : color.ink72, fontFamily: font.semibold }}
                >
                  Privacy Policy
                </Text>
                .
              </Text>
            ) : (
              <Text style={{ fontFamily: t.card.fontFamily, fontSize: 13.5, color: color.accent }}>
                Forgot your password?
              </Text>
            )}
          </View>
        </ScrollView>
      </View>

      <LegalModal
        visible={legalDoc === 'terms'}
        doc={TERMS_OF_SERVICE}
        onCancel={() => setLegalDoc(null)}
        onAgree={() => {
          setAccepted((a) => ({ ...a, terms: true }));
          setLegalDoc(null);
        }}
      />
      <LegalModal
        visible={legalDoc === 'privacy'}
        doc={PRIVACY_POLICY}
        onCancel={() => setLegalDoc(null)}
        onAgree={() => {
          setAccepted((a) => ({ ...a, privacy: true }));
          setLegalDoc(null);
        }}
      />
    </View>
  );
}
