import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Aurora } from '../../src/components/Aurora';
import { GlassCard } from '../../src/components/Glass';
import { Icon, IconName } from '../../src/components/Icon';
import { LegalModal } from '../../src/components/LegalModal';
import { PressScale } from '../../src/components/Motion';
import { CHARACTERS, TONES, WORST_WHEN } from '../../src/data/tinnitus';
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from '../../src/legal/content';
import { setFlowMode } from '../../src/onboardingFlow';
import { useAuth } from '../../src/auth';
import { errorMessage } from '../../src/lib/supabase';
import { useTinnitus } from '../../src/tinnitus';
import { color, font, glow, radius, safe, space, type as t } from '../../src/theme';

const TAB_CLEARANCE = 118;

/**
 * Account — the person's own corner of the app: who they are, what the app
 * knows about their tinnitus, what it costs, and how to get rid of it all.
 *
 * The rule this screen is built on: nothing here pretends. There is no server
 * yet, no subscription and no second language, so those rows say exactly that
 * instead of offering a control that does nothing. A settings screen full of
 * dead switches is worse than a short honest one.
 */

/** One line of the settings list: icon, label, and either a value or a chevron. */
function Row({
  icon,
  label,
  value,
  note,
  onPress,
  danger = false,
  first = false,
}: {
  icon: IconName;
  label: string;
  value?: string;
  note?: string;
  onPress?: () => void;
  danger?: boolean;
  /** Skips the divider, so the first row in a card has no line above it. */
  first?: boolean;
}) {
  const tint = danger ? color.scaleBad : color.ink;

  const body = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        minHeight: 56,
        paddingHorizontal: 16,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: 'rgba(255,255,255,0.07)',
      }}
    >
      <Icon name={icon} size={19} color={danger ? color.scaleBad : color.ink58} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontFamily: font.medium, fontSize: 14.5, color: tint }}>{label}</Text>
        {/*
          Every note is one line, without exception. Rows are scanned rather
          than read, and a list where some rows are one line tall and others
          two has no rhythm to scan down. The rule is on the component so the
          copy has to be written short rather than trimmed with an ellipsis.
        */}
        {note ? (
          <Text numberOfLines={1} style={[t.meta, { color: color.ink58 }]}>
            {note}
          </Text>
        ) : null}
      </View>
      {value ? <Text style={[t.meta, { color: color.ink62 }]}>{value}</Text> : null}
      {onPress ? <Icon name="chevronRight" size={16} color={color.ink58} /> : null}
    </View>
  );

  if (!onPress) return body;

  return (
    <PressScale
      onPress={onPress}
      scaleTo={0.99}
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
    >
      {body}
    </PressScale>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: space.sm }}>
      <Text style={[t.label, { color: color.ink58 }]}>{label}</Text>
      <GlassCard r={radius.lg} style={{ overflow: 'hidden' }}>
        {children}
      </GlassCard>
    </View>
  );
}

export default function Account() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tin = useTinnitus();
  /*
    The real session, not the device-local placeholder this screen was built
    against — that existed only because there was no server yet, and there
    is one now. Sign-out lives here alone: it used to sit at the bottom of
    the "For your tinnitus" card on Home, which is no place for it.
  */
  const { signedIn, profile, session, configured, signOut } = useAuth();
  const email = profile?.email ?? session?.user.email ?? null;
  const [signingOut, setSigningOut] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [legalDoc, setLegalDoc] = useState<'terms' | 'privacy' | null>(null);
  // Two taps to wipe the profile, rather than a native Alert — Alert does
  // nothing on web, and this has to be equally undoable everywhere.
  const [confirmWipe, setConfirmWipe] = useState(false);

  const version = Constants.expoConfig?.version ?? '1.0.0';

  const character = CHARACTERS.find((c) => c.id === tin.character)?.label ?? null;
  const tone = tin.toneUnknown ? 'Not matched' : TONES.find((x) => x.id === tin.tone)?.label ?? null;
  const worst = WORST_WHEN.find((w) => w.id === tin.pattern)?.label ?? null;

  const editProfile = () => {
    setFlowMode('edit');
    router.push('/(onboarding)/sound');
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.ground }}>
      <Aurora
        blobs={[
          { size: 300, color: color.violet, opacity: 0.26, right: -100, top: -70 },
          { size: 280, color: color.accent, opacity: 0.2, left: -90, bottom: -40, dx: 22, dy: -24 },
        ]}
        scrim={['rgba(7,10,22,0.30)', 'rgba(7,10,22,0.72)', 'rgba(7,10,22,0.92)']}
      />

      <View style={{ flex: 1, paddingTop: Math.max(insets.top, safe.top) }}>
        <View style={{ paddingHorizontal: safe.side, minHeight: 44, justifyContent: 'flex-end' }}>
          <Text style={{ fontFamily: font.display, fontSize: 28, color: color.ink, letterSpacing: -0.7 }}>
            Account
          </Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: safe.side,
            paddingTop: space.lg,
            paddingBottom: TAB_CLEARANCE,
            gap: space.xl,
          }}
        >
          {/*
            Who is using this. There is no backend yet, so rather than an empty
            name and a sign-out that signs nothing out, this says where the
            data actually lives — which is the honest answer and also the one
            that reassures someone handing over health-adjacent information.
          */}
          <GlassCard r={radius.lg} style={{ padding: 18, gap: space.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  borderWidth: 1,
                  borderColor: color.glassBorder,
                }}
              >
                <Icon name="user" size={24} color={color.ink72} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={[t.card, { color: color.ink, fontSize: 16 }]} numberOfLines={1}>
                  {signedIn ? (email ?? 'Signed in') : 'Not signed in'}
                </Text>
                <Text style={[t.meta, { color: color.ink62, lineHeight: 17 }]}>
                  Your tinnitus profile stays on this phone.
                </Text>
              </View>
            </View>

            {signedIn ? null : (
              <PressScale
                onPress={() => router.push('/(onboarding)/auth')}
                accessibilityRole="button"
                accessibilityLabel="Sign in or create an account"
                style={{
                  minHeight: 46,
                  borderRadius: radius.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: color.accent,
                  boxShadow: glow(color.accent, 0.3, 20, 5),
                }}
              >
                <Text style={{ fontFamily: t.card.fontFamily, fontSize: 14, color: color.onAccent }}>
                  Sign in or create an account
                </Text>
              </PressScale>
            )}

            <Text style={[t.meta, { color: color.ink58, lineHeight: 17 }]}>
              {!configured
                ? 'This build has no Supabase keys, so accounts are unavailable. The app works without one.'
                : signedIn
                  ? 'An account carries your account to a new phone. Your tinnitus profile and your mixes are kept on this device and are not uploaded.'
                  : 'You do not need one. Every sound, mix and timer works signed out — an account is for keeping your place if you change phone.'}
            </Text>
          </GlassCard>

          <Section label="My tinnitus">
            {tin.hasProfile ? (
              <>
                <Row icon="brain" label="Sounds like" value={character ?? 'Not answered'} first />
                <Row icon="waves" label="Closest pitch" value={tone ?? 'Not answered'} />
                <Row
                  icon="chart"
                  label="Gets in the way"
                  value={tin.impact != null ? `${tin.impact} of 10` : 'Not answered'}
                />
                <Row icon="clock" label="Hardest" value={worst ?? 'Not answered'} />
                <Row
                  icon="refresh"
                  label="Edit my answers"
                  note={
                    tin.daysSinceImpact != null
                      ? `Last check-in ${tin.daysSinceImpact === 0 ? 'today' : `${tin.daysSinceImpact} days ago`}`
                      : undefined
                  }
                  onPress={editProfile}
                />
              </>
            ) : (
              <Row
                icon="brain"
                label="Set up my profile"
                // Kept to one line's worth of words rather than truncated.
                note="Two minutes — it shapes your sound picks"
                onPress={editProfile}
                first
              />
            )}
          </Section>

          <Section label="App">
            <Row icon="language" label="Language" value="English" note="The only one so far" first />
            <Row
              icon="card"
              label="Plan"
              value="Free"
              note="No card stored"
            />
          </Section>

          <Section label="Legal">
            <Row
              icon="document"
              label="Terms of Service"
              onPress={() => setLegalDoc('terms')}
              first
            />
            <Row icon="shield" label="Privacy Policy" onPress={() => setLegalDoc('privacy')} />
          </Section>

          {/*
            Signing out and deleting the profile are different sizes of
            destructive, so they are different rows: one ends the session, the
            other destroys data. Neither is near anything routine.
          */}
          {signedIn ? (
            <Section label="Session">
              <Row
                icon="signOut"
                label={signingOut ? 'Signing out…' : 'Sign out'}
                note={authError ?? 'Your tinnitus profile stays on this phone'}
                first
                onPress={() => {
                  if (signingOut) return;
                  setSigningOut(true);
                  setAuthError(null);
                  // Leave the signed-in screen rather than redraw it signed
                  // out under the person's finger — signing out should look
                  // like it went somewhere. `replace`, so Back cannot return
                  // to an account screen that no longer belongs to anyone.
                  void signOut()
                    .then(() => router.replace({ pathname: '/(onboarding)/auth', params: { mode: 'in' } }))
                    .catch((e) => setAuthError(errorMessage(e)))
                    .finally(() => setSigningOut(false));
                }}
              />
            </Section>
          ) : null}

          {tin.hasProfile ? (
            <Section label="My data">
              <Row
                icon="trash"
                label={confirmWipe ? 'Tap again to delete' : 'Delete my tinnitus profile'}
                note={confirmWipe ? 'This cannot be undone' : 'Removes your answers from this phone'}
                danger
                first
                onPress={() => {
                  if (!confirmWipe) {
                    setConfirmWipe(true);
                    return;
                  }
                  tin.clear();
                  setConfirmWipe(false);
                }}
              />
            </Section>
          ) : null}

          <View style={{ alignItems: 'center', gap: 4 }}>
            <Text style={[t.meta, { color: color.ink58 }]}>AudioRelief {version}</Text>
            <Text style={[t.meta, { color: color.ink58, textAlign: 'center' }]}>
              A sound tool, not a medical device.
            </Text>
          </View>
        </ScrollView>
      </View>

      <LegalModal
        visible={legalDoc === 'terms'}
        doc={TERMS_OF_SERVICE}
        onAgree={() => setLegalDoc(null)}
        onCancel={() => setLegalDoc(null)}
      />
      <LegalModal
        visible={legalDoc === 'privacy'}
        doc={PRIVACY_POLICY}
        onAgree={() => setLegalDoc(null)}
        onCancel={() => setLegalDoc(null)}
      />
    </View>
  );
}
