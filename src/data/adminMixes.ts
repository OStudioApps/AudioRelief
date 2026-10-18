import { useCallback, useEffect, useState } from 'react';
import { errorMessage, isSupabaseConfigured, supabase } from '../lib/supabase';
import type { MixLayer } from '../mixes';
import { categoryIcon } from '../components/SoundIcon';

/**
 * Mixes made on the dashboard's Mixes page, for everyone using the app.
 *
 * On the dashboard they are rows in `mixer_presets` with no owner, and
 * "Visible in app" is the is_featured column. Each layer is a sound effect at
 * a volume. They arrive here already shaped like a mix the person saved
 * themselves (MixLayer, volume 0-100), so the player, the engine and the
 * editor treat both kinds the same way.
 *
 * A mix with no playable sound left — every layer removed or switched off on
 * the dashboard — is left out rather than shown as a card that plays silence.
 */

export type AdminMix = { id: string; name: string; layers: MixLayer[] };

type Row = {
  id: string;
  name: string;
  mixer_preset_layers: Array<{
    volume: number;
    sounds: {
      id: string;
      title: string;
      file_url: string | null;
      is_active: boolean;
      sound_categories: { name: string } | null;
    } | null;
  }>;
};

async function fetchMixes(): Promise<AdminMix[]> {
  const { data, error } = await supabase
    .from('mixer_presets')
    .select('id, name, mixer_preset_layers(volume, sounds(id, title, file_url, is_active, sound_categories(name)))')
    .is('user_id', null)
    .eq('is_featured', true)
    .order('created_at', { ascending: false });
  if (error) throw error;

  return ((data as unknown as Row[] | null) ?? [])
    .map((r) => ({
      id: r.id,
      name: r.name,
      layers: r.mixer_preset_layers
        .filter((l) => l.sounds?.is_active && l.sounds.file_url)
        .map((l) => ({
          id: l.sounds!.id,
          vol: Math.round(Math.max(0, Math.min(1, l.volume)) * 100),
          on: true,
          name: l.sounds!.title,
          url: l.sounds!.file_url!,
          // Same glyph as in the mixer library: the sound's category.
          icon: categoryIcon(l.sounds!.sound_categories?.name),
        })),
    }))
    .filter((m) => m.layers.length > 0);
}

let cache: AdminMix[] | null = null;
let inflight: Promise<AdminMix[]> | null = null;

function load(force = false) {
  if (!force && cache) return Promise.resolve(cache);
  if (!force && inflight) return inflight;
  inflight = fetchMixes()
    .then((list) => {
      cache = list;
      return list;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function useAdminMixes() {
  const [mixes, setMixes] = useState<AdminMix[]>(cache ?? []);
  const [loading, setLoading] = useState(isSupabaseConfigured && !cache);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (force: boolean) => {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    try {
      setMixes(await load(force));
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

  return { mixes, loading, error, reload };
}

/** "3 sounds" */
export function soundCount(n: number) {
  return `${n} ${n === 1 ? 'sound' : 'sounds'}`;
}
