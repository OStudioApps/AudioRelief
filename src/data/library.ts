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

/** Card gradients, used behind artwork and in its place when there is none. */
const PALETTE: ReadonlyArray<readonly [string, string]> = [
  ['#8FA9E8', '#2E3E78'],
  ['#69C4B4', '#1F5850'],
  ['#A8CF7E', '#4A6528'],
  ['#C9A7A0', '#5E3D38'],
  ['#74D0D8', '#215E67'],
  ['#A9B7D6', '#434F6E'],
];

/** A stable gradient per track, so it is the same colour on the card and in the player. */
export function trackColors(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

/** Lower-case, accent-free, so "Café" is found by "cafe". */
function fold(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Every word of the query has to appear in the title or the artist. */
export function matchesQuery(track: LibraryTrack, query: string): boolean {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const hay = fold(`${track.title} ${track.artist ?? ''}`);
  return words.every((w) => hay.includes(w));
}

/** m:ss, or h:mm:ss past an hour — the clock under a scrub bar. */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}
