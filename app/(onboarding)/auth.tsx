import React, { useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { PressScale, useToggleValue } from '../../src/components/Motion';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Aurora } from '../../src/components/Aurora';
import { AppleGlyph, GoogleGlyph } from '../../src/components/BrandIcons';
import { GlassCard, PrimaryButton, RoundButton, SecondaryButton } from '../../src/components/Glass';
import { Icon } from '../../src/components/Icon';
import { LegalModal } from '../../src/components/LegalModal';
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from '../../src/legal/content';
import { useAccount } from '../../src/account';
import { color, font, motion, radius, safe, type as t } from '../../src/theme';

/**
 * A real input now, not a picture of one. These were Text placeholders while
 * the screen was a mockup, which meant the form could not be tried at all.
 */
function Field({
  icon,
  placeholder,
  value,
  onChangeText,
  secure,
  keyboard,
  autoComplete,
  trailing,
}: {
  icon: 'mail' | 'lock';
  placeholder: string;
  value: string;
  onChangeText: (s: string) => void;
  secure?: boolean;
  keyboard?: 'email-address' | 'default';
  autoComplete?: 'email' | 'password' | 'new-password';
  trailing?: React.ReactNode;
}) {
  return (
    <GlassCard
      r={radius.md}
      style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16 }}
    >
      <Icon name={icon} size={19} color={color.ink58} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={color.ink58}
        secureTextEntry={secure}
        keyboardType={keyboard ?? 'default'}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete={autoComplete}
        accessibilityLabel={placeholder}
        style={{
          flex: 1,
          alignSelf: 'stretch',
          fontFamily: t.body.fontFamily,
          fontSize: 14.5,
          color: color.ink,
          // A static <input> paints under the card's absolutely positioned
          // blur, which frosted the placeholder. Positioning it puts it back
          // on top — the same fix SVG_LAYER applies to icons on glass.
          position: 'relative',
          // Removes the focus ring react-native-web draws on top of the glass.
          outlineStyle: 'none',
        } as never}
      />
      {trailing}
    </GlassCard>
  );
}

export default function Auth() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // Someone arriving from Sign out already has an account, so they land on
  // Sign in rather than being asked to create one again.
  const params = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState<'up' | 'in'>(params.mode === 'in' ? 'in' : 'up');
  const [segW, setSegW] = useState(0);
  const up = mode === 'up';
  const slide = useToggleValue(!up, 260);
  const [legalDoc, setLegalDoc] = useState<'terms' | 'privacy' | null>(null);
  const [accepted, setAccepted] = useState<{ terms: boolean; privacy: boolean }>({
    terms: false,
    privacy: false,
  });

  const acct = useAccount();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [reveal, setReveal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /*
    Shape checks only. There is no server to ask whether this address exists or
    whether the password is right, so this validates what a form can validate
    on its own and nothing more — it must never look like it verified anything.
  */
  const submit = () => {
    const mail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      setError('That does not look like an email address.');
      return;
    }
    if (password.length < 6) {
      setError('Passwords need at least 6 characters.');
      return;
    }
    setError(null);
    acct.signIn(mail);
    router.replace('/(tabs)/tonight');
  };

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
          {/*
            After Sign out this screen replaced Account, so there is nothing
            behind it and router.back() would do nothing — a dead button. The
            app works fully without an account, so the way out goes home.
          */}
          <RoundButton
            label="Back"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/tonight'))}
          >
            <Icon name="chevronLeft" />
          </RoundButton>
        </View>

        <View style={{ height: 24 }} />

        {/* The password field sits low enough that the keyboard covers it. */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 16 }}
        >
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

          {/*
            Neither of these can work without a server to hand the token to, so
            they say so when tapped rather than doing nothing at all — a button
            that swallows a tap silently reads as a broken app.
          */}
          <View style={{ gap: 10 }}>
            <PrimaryButton
              label="Continue with Apple"
              tint="rgba(255,255,255,0.92)"
              left={<AppleGlyph size={22} color={color.onAccent} />}
              onPress={() => setError('Apple and Google sign-in need a server. Use email for now.')}
            />
            <SecondaryButton
              label="Continue with Google"
              left={<GoogleGlyph size={18} />}
              onPress={() => setError('Apple and Google sign-in need a server. Use email for now.')}
            />
          </View>

          <View style={{ height: 20 }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.10)' }} />
            <Text style={[t.label, { color: color.ink58 }]}>or use email</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.10)' }} />
          </View>

          <View style={{ height: 20 }} />

          <Field
            icon="mail"
            placeholder="Email address"
            value={email}
            onChangeText={(s) => {
              setEmail(s);
              if (error) setError(null);
            }}
            keyboard="email-address"
            autoComplete="email"
          />
          <View style={{ height: 12 }} />
          <Field
            icon="lock"
            placeholder={up ? 'Choose a password' : 'Password'}
            value={password}
            onChangeText={(s) => {
              setPassword(s);
              if (error) setError(null);
            }}
            secure={!reveal}
            autoComplete={up ? 'new-password' : 'password'}
            trailing={
              <PressScale
                onPress={() => setReveal((r) => !r)}
                accessibilityRole="button"
                accessibilityLabel={reveal ? 'Hide password' : 'Show password'}
                // A full 44pt target around a 19pt glyph. The negative margin
                // pulls it back to the field's edge so the bigger box does not
                // push the glyph inward.
                style={{
                  width: 44,
                  height: 44,
                  marginRight: -12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name={reveal ? 'eye' : 'eyeOff'} size={19} color={color.ink58} />
              </PressScale>
            }
          />

          {/* Beside the fields it describes, not in a banner at the top. */}
          {error ? (
            <Text style={[t.meta, { color: color.scaleBad, marginTop: 8 }]}>{error}</Text>
          ) : null}

          <View style={{ height: 20 }} />

          <PrimaryButton label={up ? 'Create account' : 'Sign in'} onPress={submit} />

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
        </KeyboardAvoidingView>
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
