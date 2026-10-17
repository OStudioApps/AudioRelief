import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { artFor } from '../data/sounds';
import { type LibraryTrack, trackColors } from '../data/library';
import { usePlayer } from '../state';
import { useTrackPlayer } from './tracks';

/**
 * What is playing, whichever engine is making the sound.
 *
 * There are two engines underneath and they stay separate, because the audio
 * really is different: the loop engine (src/audio/engine.tsx) layers bundled
 * sounds for mixes and steady noise, and the track player streams one library
 * file at a time. But there is one player screen, one mini player and one
 * sleep timer, and they read everything from here — so the person never has
 * to know there are two.
 *
 * Only one engine sounds at a time: each one pauses the other when it starts.
 */

/** Something the loop engine can play — a noise or a mix — as a queue entry. */
export type LoopEntry = { id: string; play: () => void };

type Source = 'track' | 'loop';

type Ctx = {
  /** Which engine was used last; null until anything has been played this session. */
  source: Source | null;
  kind: 'track' | 'noise' | 'mix';
  title: string;
  subtitle: string;
  colors: readonly [string, string];
  art: ImageSourcePropType | null;
  /** Where it was played from — "Sounds", "Steady noise", a playlist's name. */
  context: string;
  playing: boolean;
  buffering: boolean;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  /** False when there is nothing else in the queue to skip to. */
  canSkip: boolean;
  /** Play a noise or mix, with the row it came from as the queue for next/previous. */
  playLoop: (entry: LoopEntry, queue: LoopEntry[], context: string) => void;
  /** Play library tracks as a queue, from the one with `id`. */
  playTracks: (tracks: LibraryTrack[], id: string, context: string) => void;
};

const NowPlayingContext = createContext<Ctx | null>(null);

export function NowPlayingProvider({ children }: { children: React.ReactNode }) {
  const p = usePlayer();
  const tp = useTrackPlayer();
  const [source, setSource] = useState<Source | null>(null);
  const [loopQueue, setLoopQueue] = useState<LoopEntry[]>([]);
  const [loopContext, setLoopContext] = useState('Mixes');

  // Whichever engine starts sounding becomes the one shown, however it was
  // started — the Home card, the lock screen, a mix tile.
  useEffect(() => {
    if (p.playing) setSource('loop');
  }, [p.playing]);
  useEffect(() => {
    if (tp.playing) setSource('track');
  }, [tp.playing]);

  // "End of track" means nothing to a loop, which never ends — drop it rather
  // than leave a timer showing that will never fire.
  useEffect(() => {
    if (source === 'loop' && p.sleep === 'track') p.setSleep(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, p.sleep]);

  const playLoop = useCallback(
    (entry: LoopEntry, queue: LoopEntry[], context: string) => {
      setLoopQueue(queue);
      setLoopContext(context);
      setSource('loop');
      if (p.selection.id === entry.id) p.togglePlay();
      else entry.play();
    },
    [p],
  );

  const playTracks = useCallback(
    (tracks: LibraryTrack[], id: string, context: string) => {
      setSource('track');
      tp.playFrom(tracks, id, context);
    },
    [tp],
  );

  // Held stable per cover: the Home card cross-fades whenever its image
  // source changes identity, and a fresh { uri } every render would make it
  // fade forever.
  const coverUrl = tp.current?.cover_art_url ?? null;
  const trackArt = useMemo(() => (coverUrl ? { uri: coverUrl } : null), [coverUrl]);

  const stepLoop = useCallback(
    (dir: 1 | -1) => {
      const n = loopQueue.length;
      if (n < 2) return;
      const at = loopQueue.findIndex((e) => e.id === p.selection.id);
      loopQueue[(at + dir + n) % n].play();
    },
    [loopQueue, p.selection.id],
  );

  const value = useMemo<Ctx>(() => {
    // Nothing played yet this session: show the loop engine's selection, which
    // is what the Home card has always offered to pick up.
    const track = source === 'track' ? tp.current : null;
    if (track) {
      return {
        source,
        kind: 'track',
        title: track.title,
        subtitle: track.artist || 'AudioRelief',
        colors: trackColors(track.id),
        art: trackArt,
        context: tp.context,
        playing: tp.playing,
        buffering: tp.buffering,
        toggle: tp.toggle,
        next: tp.next,
        prev: tp.prev,
        canSkip: tp.queue.length > 1,
        playLoop,
        playTracks,
      };
    }
    return {
      source,
      kind: p.selection.kind,
      title: p.title,
      subtitle: p.subtitle,
      colors: p.colors,
      art: artFor(p.artId),
      context: loopContext,
      playing: p.playing,
      buffering: false,
      toggle: p.togglePlay,
      next: () => stepLoop(1),
      prev: () => stepLoop(-1),
      canSkip: loopQueue.length > 1,
      playLoop,
      playTracks,
    };
  }, [source, tp, p, trackArt, loopContext, loopQueue.length, stepLoop, playLoop, playTracks]);

  return <NowPlayingContext.Provider value={value}>{children}</NowPlayingContext.Provider>;
}

export function useNowPlaying() {
  const ctx = useContext(NowPlayingContext);
  if (!ctx) throw new Error('useNowPlaying must be used inside NowPlayingProvider');
  return ctx;
}
