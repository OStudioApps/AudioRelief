import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * What the app has actually seen: listening sessions, and the answers to the
 * "how much does it get in the way" question over time.
 *
 * This exists because the dashboard has to be true. Everything on that screen
 * is computed from these two lists, so a number can only appear once the app
 * has genuinely observed it — no seeded averages, no example weeks.
 *
 * It stays on the device with everything else. A listening history is a
 * record of somebody's nights, which is not ours to upload.
 */

const KEY = 'history.v1';

export type Session = {
  /** ISO timestamp of when listening started. */
  at: string;
  seconds: number;
  /** Sound or mix id, for grouping. */
  id: string;
  /** What it was called at the time — saved mixes can be renamed or deleted. */
  name: string;
  /** Master volume during the session, 0-100. */
  volume: number;
};

export type ImpactEntry = { at: string; value: number };

type Stored = { sessions: Session[]; impacts: ImpactEntry[] };

/**
 * Enough for well over a year of nightly use, and small: a few hundred short
 * records. Older sessions fall off the end rather than growing without limit.
 */
const MAX_SESSIONS = 500;

/**
 * Anything shorter is a tap, not a session — opening a sound to hear what it
 * is should not turn into "you listened 14 times today".
 */
export const MIN_SESSION_SECONDS = 60;

type Ctx = Stored & {
  loaded: boolean;
  logSession: (s: Session) => void;
  logImpact: (value: number) => void;
};

const HistoryContext = createContext<Ctx | null>(null);

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Stored>({ sessions: [], impacts: [] });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!alive || !raw) return;
        try {
          const parsed = JSON.parse(raw) as Partial<Stored>;
          setData({
            sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
            impacts: Array.isArray(parsed.impacts) ? parsed.impacts : [],
          });
        } catch {
          // Corrupt entry: start empty rather than crash on launch.
        }
      })
      .catch(() => {
        // Storage unavailable — the app works, it just will not remember.
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
    AsyncStorage.setItem(KEY, JSON.stringify(data)).catch(() => {});
  }, [data, loaded]);

  const value = useMemo<Ctx>(
    () => ({
      ...data,
      loaded,
      logSession: (s) => {
        if (s.seconds < MIN_SESSION_SECONDS) return;
        setData((d) => ({ ...d, sessions: [...d.sessions, s].slice(-MAX_SESSIONS) }));
      },
      logImpact: (value) =>
        setData((d) => ({
          ...d,
          impacts: [...d.impacts, { at: new Date().toISOString(), value }],
        })),
    }),
    [data, loaded],
  );

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}

export function useHistory() {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error('useHistory must be used inside HistoryProvider');
  return ctx;
}
