import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { PressScale, useToggleValue } from '../../src/components/Motion';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Aurora } from '../../src/components/Aurora';
import { AppleGlyph, GoogleGlyph } from '../../src/components/BrandIcons';
import { GlassCard, PrimaryButton, RoundButton, SecondaryButton } from '../../src/components/Glass';
import { Icon } from '../../src/components/Icon';
import { LegalModal } from '../../src/components/LegalModal';
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from '../../src/legal/content';
import { useAuth } from '../../src/auth';
import { errorMessage } from '../../src/lib/supabase';
import { color, font, motion, radius, safe, type as t } from '../../src/theme';

/** Deliberately permissive — the server is the real check. This only catches typos. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 6;

function Field({
  icon,
  placeholder,
  value,
  onChangeText,
  trailing,
  inputRef,
  ...input
}: {
  icon: 'mail' | 'lock';
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  trailing?: React.ReactNode;
  inputRef?: React.Ref<TextInput>;
} & React.ComponentProps<typeof TextInput>) {
  return (
    <GlassCard
      r={radius.md}
      style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16 }}
    >
      <Icon name={icon} size={19} color={color.ink58} />
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={color.ink58}
        accessibilityLabel={placeholder}
        style={{
          flex: 1,
          fontFamily: t.body.fontFamily,
          fontSize: 14.5,
          color: color.ink,
          // Android centres poorly without this and clips descenders.
          paddingVertical: Platform.OS === 'android' ? 10 : 0,
          // Web blur fix and focus ring removal
          position: 'relative',
          outlineStyle: 'none',
        } as never}
        {...input}
      />
      {trailing}
    </GlassCard>
  );
}

export default function Auth() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn, signUp, configured } = useAuth();

  const params = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState<'up' | 'in'>(params.mode === 'in' ? 'in' : 'up');

  const [segW, setSegW] = useState(0);
  const up = mode === 'up';
  const slide = useToggleValue(!up, 260);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Set when sign-up needs the person to click a link before they can sign in. */
  const [checkInbox, setCheckInbox] = useState(false);

  const passwordRef = useRef<TextInput>(null);

  const [legalDoc, setLegalDoc] = useState<'terms' | 'privacy' | null>(null);
  const [accepted, setAccepted] = useState<{ terms: boolean; privacy: boolean }>({
    terms: false,
    privacy: false,
  });

  function switchMode(m: 'up' | 'in') {
    setMode(m);
    // Errors belong to the attempt that caused them, not to the other tab.
    setError(null);
    setCheckInbox(false);
  }

  async function submit() {
    if (busy) return;
    setError(null);

    if (!EMAIL_RE.test(email.trim())) {
      setError('That email address does not look right.');
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setError(`Passwords need at least ${MIN_PASSWORD} characters.`);
      return;
    }
    if (!configured) {
      setError('This build has no Supabase keys, so accounts are unavailable.');
      return;
    }

    setBusy(true);
    try {
      if (up) {
        const needsConfirmation = await signUp(email, password);
        if (needsConfirmation) {
          setCheckInbox(true);
          return;
        }
      } else {
        await signIn(email, password);
      }
      router.replace('/(tabs)/tonight');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.ground }}>
      <Aurora
        blobs={[
          { size: 340, color: color.accent, opacity: 0.28, left: -90, top: -90, duration: motion.driftSlow },
          { size: 300, color: color.violet, opacity: 0.26, right: -100, bottom: -100, dx: -24, dy: 28 },
        ]}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={{
            flex: 1,
            paddingTop: Math.max(insets.top, safe.top),
            paddingBottom: Math.max(insets.bottom, safe.bottom),
            paddingHorizontal: safe.side,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <RoundButton
              label="Back"
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/tonight'))}
            >
              <Icon name="chevronLeft" />
            </RoundButton>
          </View>

          <View style={{ height: 24 }} />

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
                    onPress={() => switchMode(m)}
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

            {/* Apple and Google sign-in placeholders */}
            <View style={{ gap: 10, opacity: 0.38 }} pointerEvents="none">
              <PrimaryButton
                label="Continue with Apple"
                tint="rgba(255,255,255,0.92)"
                left={<AppleGlyph size={22} color={color.onAccent} />}
              />
              <SecondaryButton label="Continue with Google" left={<GoogleGlyph size={18} />} />
            </View>
            <View style={{ height: 8 }} />
            <Text style={[t.meta, { color: color.ink58, textAlign: 'center', fontSize: 12 }]}>
              Apple and Google sign-in are coming soon.
            </Text>

            <View style={{ height: 20 }} />

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.10)' }} />
              <Text style={[t.label, { color: color.ink58 }]}>or use email</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.10)' }} />
            </View>

            <View style={{ height: 20 }} />

            {checkInbox ? (
              <GlassCard r={radius.md} style={{ padding: 16, gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Icon name="mail" size={19} color={color.accent} />
                  <Text style={[t.card, { color: color.ink, fontSize: 14.5 }]}>Check your inbox</Text>
                </View>
                <Text style={[t.meta, { color: color.ink62, lineHeight: 18 }]}>
                  We sent a confirmation link to {email.trim()}. Open it, then come back and sign in.
                </Text>
                <View style={{ height: 4 }} />
                <PressScale onPress={() => switchMode('in')}>
                  <Text style={{ fontFamily: t.body.fontFamily, fontSize: 13, color: color.accent }}>
                    Go to sign in
                  </Text>
                </PressScale>
              </GlassCard>
            ) : (
              <>
                <Field
                  icon="mail"
                  placeholder="Email address"
                  value={email}
                  onChangeText={(s) => {
                    setEmail(s);
                    if (error) setError(null);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="next"
                  editable={!busy}
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
                <View style={{ height: 12 }} />
                <Field
                  inputRef={passwordRef}
                  icon="lock"
                  placeholder={up ? 'Choose a password' : 'Password'}
                  value={password}
                  onChangeText={(s) => {
                    setPassword(s);
                    if (error) setError(null);
                  }}
                  secureTextEntry={!reveal}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete={up ? 'new-password' : 'current-password'}
                  textContentType={up ? 'newPassword' : 'password'}
                  returnKeyType="go"
                  editable={!busy}
                  onSubmitEditing={() => void submit()}
                  trailing={
                    <PressScale
                      onPress={() => setReveal((r) => !r)}
                      hitSlop={10}
                      accessibilityRole="button"
                      accessibilityLabel={reveal ? 'Hide password' : 'Show password'}
                      style={{
                        width: 44,
                        height: 44,
                        marginRight: -12,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon
                        name={reveal ? 'eye' : 'eyeOff'}
                        size={19}
                        color={reveal ? color.accent : color.ink58}
                      />
                    </PressScale>
                  }
                />

                {error ? (
                  <>
                    <View style={{ height: 12 }} />
                    <View
                      style={{
                        padding: 12,
                        borderRadius: radius.sm,
                        backgroundColor: 'rgba(242,97,122,0.10)',
                        borderWidth: 1,
                        borderColor: 'rgba(242,97,122,0.28)',
                      }}
                    >
                      <Text style={[t.meta, { color: color.scaleBad, lineHeight: 17 }]}>{error}</Text>
                    </View>
                  </>
                ) : null}

                <View style={{ height: 20 }} />

                <PrimaryButton
                  label={busy ? '' : up ? 'Create account' : 'Sign in'}
                  disabled={busy}
                  onPress={() => void submit()}
                  left={busy ? <ActivityIndicator color={color.onAccent} /> : undefined}
                />
              </>
            )}

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
                  </Text>{' '}
                  and{' '}
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
      </KeyboardAvoidingView>

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