import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Mixes the person has built and named themselves.
 *
 * Stored on the device, like everything else the app knows. A mix is only its
 * recipe — which library sounds, how loud each one is, which are muted — so it
 * stays valid as the sound library grows and costs almost nothing to keep.
 *
 * Layer ids that no longer exist in the library are dropped on read rather
 * than crashing a screen: a mix saved against a sound that was later removed
 * should lose that layer, not become unopenable.
 */

const KEY = 'mixes.v1';

export type MixLayer = {
  /** A sound id from the library (`SOUNDS`). */
  id: string;
  /** 0-100. */
  vol: number;
  on: boolean;
};

export type SavedMix = {
  id: string;
  name: string;
  layers: MixLayer[];
  /** ISO date, for ordering newest first. */
  createdAt: string;
};

type Ctx = {
  mixes: SavedMix[];
  /** False until storage has been read, so the UI does not flash the empty state. */
  loaded: boolean;
  byId: (id: string) => SavedMix | undefined;
  /** Creates when `id` is undefined, overwrites when it is given. Returns the id. */
  save: (mix: { id?: string; name: string; layers: MixLayer[] }) => string;
  remove: (id: string) => void;
};

const MixesContext = createContext<Ctx | null>(null);

// Date plus a random tail: two mixes made in the same millisecond on one
// device is unlikely, but an id collision would silently overwrite one.
const newId = () => `mix_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

export function MixesProvider({ children }: { children: React.ReactNode }) {
  const [mixes, setMixes] = useState<SavedMix[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!alive || !raw) return;
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setMixes(parsed as SavedMix[]);
        } catch {
          // Corrupt entry: start with none rather than crash on launch.
        }
      })
      .catch(() => {
        // Storage unavailable — mixes just will not persist this session.
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
    AsyncStorage.setItem(KEY, JSON.stringify(mixes)).catch(() => {});
  }, [mixes, loaded]);

  const value = useMemo<Ctx>(
    () => ({
      mixes,
      loaded,
      byId: (id) => mixes.find((m) => m.id === id),
      save: ({ id, name, layers }) => {
        const trimmed = name.trim();
        if (id) {
          setMixes((prev) => prev.map((m) => (m.id === id ? { ...m, name: trimmed, layers } : m)));
          return id;
        }
        const created: SavedMix = {
          id: newId(),
          name: trimmed,
          layers,
          createdAt: new Date().toISOString(),
        };
        // Newest first: the mix just made is the one most likely to be wanted.
        setMixes((prev) => [created, ...prev]);
        return created.id;
      },
      remove: (id) => setMixes((prev) => prev.filter((m) => m.id !== id)),
    }),
    [mixes, loaded],
  );

  return <MixesContext.Provider value={value}>{children}</MixesContext.Provider>;
}

export function useMixes() {
  const ctx = useContext(MixesContext);
  if (!ctx) throw new Error('useMixes must be used inside MixesProvider');
  return ctx;
}
