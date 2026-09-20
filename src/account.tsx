import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * The signed-in session — on this device, and only on this device.
 *
 * READ THIS BEFORE WIRING A REAL BACKEND. There is no server. Nothing is
 * verified, no password is checked, and no password is stored: signing in
 * records an email address on the phone so the app can address the person and
 * so the signed-in screens can be built and tested. It is a placeholder for a
 * session, not an account system, and every screen that shows it says so.
 *
 * When real auth arrives, this is the seam: keep `email`, `signedIn`,
 * `signIn` and `signOut`, and replace the bodies with calls to the API plus a
 * token in secure storage — `AsyncStorage` is not encrypted and must never
 * hold a credential.
 */

const KEY = 'account.session.v1';

type Session = { email: string | null };

type Ctx = {
  email: string | null;
  signedIn: boolean;
  /** False until storage has been read, so the UI does not flash "signed out". */
  loaded: boolean;
  signIn: (email: string) => void;
  signOut: () => void;
};

const AccountContext = createContext<Ctx | null>(null);

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session>({ email: null });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!alive || !raw) return;
        try {
          const parsed = JSON.parse(raw) as Partial<Session>;
          if (typeof parsed.email === 'string') setSession({ email: parsed.email });
        } catch {
          // Corrupt entry: start signed out rather than crash on launch.
        }
      })
      .catch(() => {
        // Storage unavailable — the app still works, just signed out.
      })
      .finally(() => {
        if (alive) setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(KEY, JSON.stringify(session)).catch(() => {});
  }, [session, loaded]);

  const value = useMemo<Ctx>(
    () => ({
      email: session.email,
      signedIn: session.email !== null,
      loaded,
      signIn: (email: string) => setSession({ email: email.trim() }),
      // Only the session goes. The tinnitus profile is the person's own data
      // and lives under its own key — signing out of a device-local account
      // must not quietly delete it. Account has a separate, explicit control
      // for that.
      signOut: () => setSession({ email: null }),
    }),
    [session, loaded],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error('useAccount must be used inside AccountProvider');
  return ctx;
}
