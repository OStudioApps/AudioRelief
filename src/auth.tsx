import type { Session } from '@supabase/supabase-js';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { isSupabaseConfigured, supabase } from './lib/supabase';

/*
  Web only: when this bundle loads inside the popup an auth session opened,
  hand the result back to the opener and close. A no-op everywhere else.
*/
WebBrowser.maybeCompleteAuthSession();

/**
 * Where Google sends the person back to, by way of Supabase. Every value this
 * returns has to be on the allow list in Supabase → Authentication → URL
 * Configuration → Redirect URLs:
 *
 *  - Expo Go:      exp://<your LAN IP>:8081/--/oauth-callback  (allow `exp://**`)
 *  - Dev / store:  audiorelief://oauth-callback
 *  - Web:          http://localhost:8081/oauth-callback
 */
export const OAUTH_REDIRECT = Linking.createURL('oauth-callback');

/**
 * Reads the session out of the URL Supabase redirected to. It arrives in the
 * fragment for the implicit flow (#access_token=…&refresh_token=…) and as a
 * query `code` for PKCE, so both are handled. Errors come back as params too.
 */
async function sessionFromRedirect(url: string) {
  const parsed = new URL(url);
  const params = new URLSearchParams(parsed.hash.replace(/^#/, ''));
  parsed.searchParams.forEach((v, k) => params.set(k, v));

  const failure = params.get('error_description') ?? params.get('error');
  if (failure) throw new Error(failure.replace(/\+/g, ' '));

  const code = params.get('code');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return;
  }

  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (!access_token || !refresh_token) throw new Error('Google sign-in did not return a session.');
  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) throw error;
}

/**
 * Who is signed in, if anyone.
 *
 * An account is optional by design — the welcome screen promises you can try
 * a sound without one, and every tab works signed out. So nothing here gates
 * navigation; it only tells the UI whether there is an account to show.
 *
 * The tinnitus profile deliberately does not live here. It stays on the
 * device (see src/tinnitus.tsx) and is not synced — except the one yes/no,
 * "do you have tinnitus?", which src/accountSync.tsx keeps in the account's
 * user metadata so it follows the person to a new phone.
 */

export type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: 'user' | 'admin';
  subscription_status: 'free' | 'premium';
};

type Ctx = {
  session: Session | null;
  profile: Profile | null;
  /** True until the stored session has been read, so the UI can avoid a flash. */
  loaded: boolean;
  signedIn: boolean;
  /** False when .env has no Supabase keys; the auth screen says so instead of failing silently. */
  configured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  /** Resolves true when Supabase sent a confirmation email instead of a session. */
  signUp: (email: string, password: string) => Promise<boolean>;
  /**
   * Google through Supabase. Resolves true once signed in, false if the person
   * closed the sheet. On web the page navigates away to Google and back to
   * /oauth-callback, so the promise never settles there.
   */
  signInWithGoogle: () => Promise<boolean>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<Ctx | null>(null);

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, display_name, avatar_url, role, subscription_status')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    // Not fatal: the session is still valid, we just have no profile row to
    // show. Most likely the handle_new_user trigger is missing.
    console.warn('[auth] could not load profile', error.message);
    return null;
  }
  return data as Profile | null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(!isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let alive = true;

    void supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!alive) return;
        setSession(data.session);
        if (data.session) {
          const p = await fetchProfile(data.session.user.id);
          if (alive) setProfile(p);
        }
      })
      .catch(() => {
        // Storage unreadable or offline — carry on signed out.
      })
      .finally(() => {
        if (alive) setLoaded(true);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (!next) {
        setProfile(null);
        return;
      }
      // Deferred: calling back into supabase-js from inside this callback can
      // deadlock the auth lock.
      setTimeout(() => {
        void fetchProfile(next.user.id).then((p) => {
          if (alive) setProfile(p);
        });
      }, 0);
    });

    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
    if (error) throw error;
    // With "Confirm email" on, Supabase returns a user but no session — the
    // person is not signed in yet and has to click the link first.
    return data.session === null;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (Platform.OS === 'web') {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/oauth-callback` },
      });
      if (error) throw error;
      return false;
    }

    // Ask Supabase for Google's URL without letting it navigate anywhere —
    // native has nothing to navigate. The auth session opens it instead and
    // closes itself the moment Google redirects back to OAUTH_REDIRECT.
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: OAUTH_REDIRECT,
        skipBrowserRedirect: true,
        // Always offer the account picker, so a shared phone is not locked
        // into whoever signed in to Google last.
        queryParams: { prompt: 'select_account' },
      },
    });
    if (error) throw error;
    if (!data.url) throw new Error('Supabase did not return a Google sign-in URL.');

    const result = await WebBrowser.openAuthSessionAsync(data.url, OAUTH_REDIRECT);
    if (result.type !== 'success') return false;
    await sessionFromRedirect(result.url);
    return true;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setSession(null);
    setProfile(null);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      session,
      profile,
      loaded,
      signedIn: Boolean(session),
      configured: isSupabaseConfigured,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
    }),
    [session, profile, loaded, signIn, signUp, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
