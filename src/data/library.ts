import { useCallback, useEffect, useState } from 'react';
import { errorMessage, isSupabaseConfigured, supabase } from '../lib/supabase';

/**
 * The Sounds library: the tracks managed on the dashboard's Music page.
 *
 * Nothing here is bundled: the dashboard uploads audio and artwork to Supabase
 * storage and writes rows to `music_tracks`.
 * RLS only returns active rows to the app; we filter on is_active as well so
 * an admin session sees exactly what everyone else sees.
 */

export type LibraryTrack = {
  id: string;
  title: string;
  artist: string | null;
  file_url: string | null;
  cover_art_url: string | null;
  duration_seconds: number;
};

export function formatLength(seconds: number): string | null {
  if (!seconds) return null;
  const m = Math.round(seconds / 60);
  return m < 1 ? `${seconds}s` : `${m} min`;
}

export function useLibrary() {
  const [tracks, setTracks] = useState<LibraryTrack[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(
    isSupabaseConfigured ? null : 'Supabase is not configured.',
  );

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    const t = await supabase
      .from('music_tracks')
      .select('id, title, artist, file_url, cover_art_url, duration_seconds')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    setError(t.error ? errorMessage(t.error) : null);
    setTracks((t.data as LibraryTrack[] | null) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { tracks, loading, error, reload: load };
}
