import { useCallback, useEffect, useState } from 'react';
import { errorMessage, isSupabaseConfigured, supabase } from '../lib/supabase';
import { type LibraryTrack, TRACK_COLUMNS } from './library';

/**
 * Official playlists: the ones built on the dashboard's Playlists page.
 *
 * "Official" is how the dashboard marks them — no owner (user_id is null) and
 * public. Members' own playlists share the table but are not shown here.
 *
 * Each playlist comes back with its tracks in one request, already in the
 * order set on the dashboard. A few playlists of a few dozen tracks is small,
 * and it means opening a playlist never waits on the network.
 */

export type Playlist = {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  /** Only tracks that are active and have audio, in playlist order. */
  tracks: LibraryTrack[];
  /** Sum of the tracks' lengths, in seconds. */
  seconds: number;
};

type Row = {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  playlist_tracks: Array<{ position: number; music_tracks: (LibraryTrack & { is_active: boolean }) | null }>;
};

async function fetchPlaylists(): Promise<Playlist[]> {
  const { data, error } = await supabase
    .from('playlists')
    .select(
      `id, title, description, cover_url, playlist_tracks(position, music_tracks(${TRACK_COLUMNS}, is_active))`,
    )
    .is('user_id', null)
    .eq('is_public', true)
    .order('created_at', { ascending: true });
  if (error) throw error;

  return ((data as unknown as Row[] | null) ?? [])
    .map((r) => {
      const tracks = [...r.playlist_tracks]
        .sort((a, b) => a.position - b.position)
        .map((pt) => pt.music_tracks)
        .filter((t): t is LibraryTrack & { is_active: boolean } => Boolean(t?.is_active && t.file_url))
        .map(({ is_active: _, ...t }) => t);
      return {
        id: r.id,
        title: r.title,
        description: r.description,
        cover_url: r.cover_url,
        tracks,
        seconds: tracks.reduce((n, t) => n + (t.duration_seconds || 0), 0),
      };
    })
    // An empty playlist on Home is a dead end; it appears once it has tracks.
    .filter((p) => p.tracks.length > 0);
}

/*
  Shared between Home and the playlist screen, so opening a playlist uses
  what Home already loaded instead of fetching it again.
*/
let cache: Playlist[] | null = null;
let inflight: Promise<Playlist[]> | null = null;

function load(force = false) {
  if (!force && cache) return Promise.resolve(cache);
  if (!force && inflight) return inflight;
  inflight = fetchPlaylists()
    .then((list) => {
      cache = list;
      return list;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function usePlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>(cache ?? []);
  const [loading, setLoading] = useState(isSupabaseConfigured && !cache);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (force: boolean) => {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    try {
      setPlaylists(await load(force));
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

  return { playlists, loading, error, reload };
}

/** "6 tracks · 42 min" */
export function playlistMeta(p: Playlist): string {
  const n = p.tracks.length;
  const min = Math.round(p.seconds / 60);
  return [`${n} ${n === 1 ? 'track' : 'tracks'}`, min ? `${min} min` : null].filter(Boolean).join(' · ');
}
