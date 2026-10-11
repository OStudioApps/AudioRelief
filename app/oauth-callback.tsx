import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Text, View } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { Aurora } from '../src/components/Aurora';
import { PrimaryButton } from '../src/components/Glass';
import { useAuth } from '../src/auth';
import { color, motion, safe, type as t } from '../src/theme';

/**
 * Where Google, by way of Supabase, sends the person back after signing in.
 *
 * On web, supabase-js reads the session out of this page's URL by itself
 * (detectSessionInUrl), so all this screen does is wait for it and move on.
 * On native the auth session in src/auth.tsx normally catches the redirect
 * before the router sees it; if Android hands the link to the router
 * instead, this screen waits the same way rather than showing a 404.
 */
export default function OAuthCallback() {
  const router = useRouter();
  const auth = useAuth();
  const query = useLocalSearchParams<{ error?: string; error_description?: string }>();
  const [slow, setSlow] = useState(false);

  // Google and Supabase report failures in the query or, for the implicit
  // flow, in the fragment, which the router does not parse.
  const hash =
    Platform.OS === 'web' && typeof window !== 'undefined'
      ? new URLSearchParams(window.location.hash.replace(/^#/, ''))
      : null;
  const failure =
    query.error_description ?? query.error ?? hash?.get('error_description') ?? hash?.get('error') ?? null;

  useEffect(() => {
    const id = setTimeout(() => setSlow(true), 10_000);
    return () => clearTimeout(id);
  }, []);

  if (auth.loaded && auth.signedIn) return <Redirect href="/(tabs)/tonight" />;

  const message = failure
    ? failure.replace(/\+/g, ' ')
    : slow
      ? 'Signing in is taking longer than it should.'
      : null;

  return (
    <View style={{ flex: 1, backgroundColor: color.ground }}>
      <Aurora
        blobs={[
          { size: 320, color: color.accent, opacity: 0.24, left: -90, top: -80, duration: motion.driftSlow },
          { size: 280, color: color.violet, opacity: 0.22, right: -90, bottom: -80 },
        ]}
      />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, paddingHorizontal: safe.side }}>
        {message ? (
          <>
            <Text style={[t.screen, { color: color.ink, textAlign: 'center' }]}>Google sign-in failed</Text>
            <Text style={[t.bodyMuted, { color: color.ink62, textAlign: 'center' }]}>{message}</Text>
            <PrimaryButton
              label="Back to sign in"
              onPress={() => router.replace({ pathname: '/(onboarding)/auth', params: { mode: 'in' } })}
              style={{ alignSelf: 'stretch' }}
            />
          </>
        ) : (
          <>
            <ActivityIndicator color={color.accent} />
            <Text style={[t.bodyMuted, { color: color.ink62 }]}>Signing you in…</Text>
          </>
        )}
      </View>
    </View>
  );
}
