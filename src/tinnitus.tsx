import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CharacterId, TONES, ToneId } from './data/tinnitus';

/**
 * What the person told us about their tinnitus.
 *
 * Health-adjacent information, so it is deliberately minimal: only what the
 * app actually uses. Character and pitch drive the sound; impact is the
 * baseline a trend is measured against; pattern decides when the app is
 * useful. Nothing else is collected.
 *
 * It is stored on the device only, in AsyncStorage — never sent anywhere.
 * It has to persist: the home screen is built around this profile, and a
 * profile that forgot itself on every relaunch would leave every returning
 * user staring at an empty screen and re-answering the same questions.
 */

const KEY = 'tinnitus.profile.v1';

type Profile = {
  character: CharacterId | null;
  tone: ToneId | null;
  /** True when they could not match a tone; the app falls back to broadband. */
  toneUnknown: boolean;
  impact: number | null;
  pattern: string | null;
  /** When the impact answer was last given, as an ISO date. Drives the re-check. */
  impactAt: string | null;
};

const EMPTY: Profile = {
  character: null,
  tone: null,
  toneUnknown: false,
  impact: null,
  pattern: null,
  impactAt: null,
};

type Ctx = Profile & {
  setCharacter: (c: CharacterId) => void;
  setTone: (t: ToneId | null, unknown?: boolean) => void;
  setImpact: (n: number) => void;
  setPattern: (p: string) => void;
  /** Matched frequency in Hz, or null when unmatched. */
  hz: number | null;
  /** True once enough has been answered to personalise anything. */
  hasProfile: boolean;
  /** False until the stored profile has been read, so the UI can avoid flashing an empty state. */
  loaded: boolean;
  /** Days since the impact answer, or null if never answered. */
  daysSinceImpact: number | null;
  clear: () => void;
};

const TinnitusContext = createContext<Ctx | null>(null);

export function TinnitusProvider({ children }: { children: React.ReactNode }) {
  const [p, setP] = useState<Profile>(EMPTY);
  const [loaded, setLoaded] = useState(false);

  // Read once on launch.
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!alive) return;
        if (raw) {
          try {
            setP({ ...EMPTY, ...(JSON.parse(raw) as Partial<Profile>) });
          } catch {
            // Corrupt entry: start clean rather than crash on launch.
          }
        }
      })
      .catch(() => {
        // Storage unavailable — the app still works, just without memory.
      })
      .finally(() => {
        if (alive) setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Write on every change, once the initial read is done so we cannot
  // overwrite a stored profile with the empty one before it loads.
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(KEY, JSON.stringify(p)).catch(() => {});
  }, [p, loaded]);

  const value = useMemo<Ctx>(() => {
    const hz = p.tone ? (TONES.find((x) => x.id === p.tone)?.hz ?? null) : null;
    const daysSinceImpact = p.impactAt
      ? Math.floor((Date.now() - new Date(p.impactAt).getTime()) / 86400000)
      : null;

    return {
      ...p,
      hz,
      hasProfile: p.character !== null || p.tone !== null || p.toneUnknown,
      loaded,
      daysSinceImpact,
      setCharacter: (c) => setP((s) => ({ ...s, character: c })),
      setTone: (t, unknown = false) => setP((s) => ({ ...s, tone: t, toneUnknown: unknown })),
      setImpact: (n) => setP((s) => ({ ...s, impact: n, impactAt: new Date().toISOString() })),
      setPattern: (x) => setP((s) => ({ ...s, pattern: x })),
      clear: () => setP(EMPTY),
    };
  }, [p, loaded]);

  return <TinnitusContext.Provider value={value}>{children}</TinnitusContext.Provider>;
}

export function useTinnitus() {
  const ctx = useContext(TinnitusContext);
  if (!ctx) throw new Error('useTinnitus must be used inside TinnitusProvider');
  return ctx;
}
