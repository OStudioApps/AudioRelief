import type { Session } from '@supabase/supabase-js';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { isSupabaseConfigured, supabase } from './lib/supabase';

/**
 * Who is signed in, if anyone.
 *
 * An account is optional by design — the welcome screen promises you can try
 * a sound without one, and every tab works signed out. So nothing here gates
 * navigation; it only tells the UI whether there is an account to show.
 *
 * The tinnitus profile deliberately does not live here. It stays on the
 * device (see src/tinnitus.tsx) and is not synced.
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
      signOut,
    }),
    [session, profile, loaded, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
