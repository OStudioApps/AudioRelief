import { useCallback, useEffect, useMemo, useState } from 'react';
import { errorMessage, isSupabaseConfigured, supabase } from '../lib/supabase';
import { trackColors } from './library';
import { categoryIcon } from '../components/SoundIcon';

/**
 * The mixer's sound library: the loopable sounds managed on the dashboard's
 * Sounds page, with their categories and icons.
 *
 * These are what a mix is built from. Each one is streamed from Supabase
 * storage and looped, several at once, by the loop engine. A sound turned off
 * on the dashboard (is_active) drops out of the picker; RLS already hides
 * inactive rows from the app, and the filter here keeps an admin session
 * seeing exactly what everyone else sees.
 */

export type MixerCategory = { id: string; name: string; sort_order: number };

export type MixerSound = {
  id: string;
  title: string;
  url: string;
  /** Phosphor name for the sound's category (see categoryIcon); drawn by SoundIcon. */
  icon: string;
  category: MixerCategory | null;
};

type Row = {
  id: string;
  title: string;
  file_url: string | null;
  sound_categories: MixerCategory | null;
};

async function fetchSounds(): Promise<MixerSound[]> {
  const { data, error } = await supabase
    .from('sounds')
    .select('id, title, file_url, sound_categories(id, name, sort_order)')
    .eq('is_active', true)
    .order('title', { ascending: true });
  if (error) throw error;
  return ((data as unknown as Row[] | null) ?? [])
    // A sound with no file yet cannot be mixed; it appears once uploaded.
    .filter((r) => r.file_url)
    .map((r) => ({
      id: r.id,
      title: r.title,
      url: r.file_url!,
      // The category's glyph rather than `r.icon`: every sound came in with
      // the dashboard's default wave, so the stored icon said nothing.
      icon: categoryIcon(r.sound_categories?.name),
      category: r.sound_categories,
    }));
}

let cache: MixerSound[] | null = null;
let inflight: Promise<MixerSound[]> | null = null;

function load(force = false) {
  if (!force && cache) return Promise.resolve(cache);
  if (!force && inflight) return inflight;
  inflight = fetchSounds()
    .then((list) => {
      cache = list;
      return list;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function useMixerSounds() {
  const [sounds, setSounds] = useState<MixerSound[]>(cache ?? []);
  const [loading, setLoading] = useState(isSupabaseConfigured && !cache);
  const [error, setError] = useState<string | null>(
    isSupabaseConfigured ? null : 'Supabase is not configured.',
  );

  const run = useCallback(async (force: boolean) => {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    try {
      setSounds(await load(force));
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void run(false);
  }, [run]);

  const reload = useCallback(() => run(true), [run]);

  return { sounds, loading, error, reload };
}

/** Categories in the dashboard's order, only those that have a sound in them. */
export function categoriesOf(sounds: MixerSound[]): MixerCategory[] {
  const seen = new Map<string, MixerCategory>();
  for (const s of sounds) if (s.category && !seen.has(s.category.id)) seen.set(s.category.id, s.category);
  return [...seen.values()].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
}

/**
 * Each library sound's icon by id. A saved mix copied its layers' icons when
 * they were added — older ones hold the dashboard's default wave — so cards
 * and the editor look the current one up here first.
 */
export function useLibraryIcons(): Map<string, string> {
  const { sounds } = useMixerSounds();
  return useMemo(() => new Map(sounds.map((s) => [s.id, s.icon])), [sounds]);
}

/** A stable gradient per sound, the same in the picker, the editor and on the mix card. */
export const mixerSoundColors = trackColors;
