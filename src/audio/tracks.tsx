import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import type { LibraryTrack } from '../data/library';
import { usePlayer } from '../state';
import { OUTPUT_CEILING } from './assets';

/**
 * The library player: the streamed tracks from the Sounds tab, played as a
 * queue the way a music app does — next, previous, scrub, shuffle and repeat.
 * The sleep timer is the shared one in src/state.tsx, so it is the same timer
 * whether a track, a noise or a mix is playing.
 *
 * It lives at the root rather than in the Sounds screen so the sound keeps
 * going when you change tab, and so the mini player and the full-screen
 * player are views onto the same voice instead of each owning one.
 *
 * It never overlaps the mixer: starting a track pauses the mix, and starting
 * the mix pauses the track. Both share the one master volume.
 */

export type Repeat = 'off' | 'all' | 'one';

/** Past this far into a track, "previous" restarts it rather than going back. */
const RESTART_THRESHOLD = 3;

type Ctx = {
  current: LibraryTrack | null;
  queue: LibraryTrack[];
  playing: boolean;
  buffering: boolean;
  /** Where the queue came from — "Sounds", a playlist's name — for the player's header. */
  context: string;
  /** Start `tracks` as the queue, from the one with `id`. Tapping the current track toggles it. */
  playFrom: (tracks: LibraryTrack[], id: string, context?: string) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (seconds: number) => void;
  shuffle: boolean;
  toggleShuffle: () => void;
  setShuffle: (on: boolean) => void;
  repeat: Repeat;
  cycleRepeat: () => void;
  setRepeat: (r: Repeat) => void;
};

type Progress = { position: number; duration: number };

const TrackContext = createContext<Ctx | null>(null);
/*
  Position ticks several times a second. It has a context of its own so the
  Sounds grid, which only cares what is playing, does not re-render with it.
*/
const ProgressContext = createContext<Progress>({ position: 0, duration: 0 });

export function TrackPlayerProvider({ children }: { children: React.ReactNode }) {
  const p = usePlayer();
  const player = useAudioPlayer(null, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);

  const [queue, setQueue] = useState<LibraryTrack[]>([]);
  const [context, setContext] = useState('Sounds');
  const [index, setIndex] = useState(-1);
  const [shuffle, setShuffle] = useState(false);
  // Sleep sounds are mostly one long texture, so the default is to hold the
  // one chosen rather than wander off into the next.
  const [repeat, setRepeat] = useState<Repeat>('one');

  const current = index >= 0 ? queue[index] ?? null : null;
  const endOfTrack = p.sleep === 'track';
  const fadeGain = p.fadeGain;

  // A timed sleep running out stops the track as well as the loops.
  useEffect(() => {
    if (!p.sleepFired) return;
    try {
      player.pause();
    } catch {
      // not ready yet
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.sleepFired]);

  // Master volume, under the hearing ceiling, times the sleep fade.
  useEffect(() => {
    try {
      player.volume = (p.volume / 100) * OUTPUT_CEILING * fadeGain;
    } catch {
      // not ready yet
    }
  }, [player, p.volume, fadeGain]);

  // "End of track" has to see the track end, so the loop is off while it is set.
  const loop = repeat === 'one' && !endOfTrack;
  useEffect(() => {
    try {
      player.loop = loop;
    } catch {
      // not ready yet
    }
  }, [player, loop, current?.id]);

  // The mix starting takes the speaker.
  useEffect(() => {
    if (!p.playing) return;
    try {
      player.pause();
    } catch {
      // not ready yet
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.playing]);

  useEffect(() => {
    if (!status.playing) return;
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    }).catch(() => {
      // Best-effort; never let it take the screen down.
    });
  }, [status.playing]);

  const load = useCallback(
    (list: LibraryTrack[], i: number, autoplay = true) => {
      const track = list[i];
      if (!track?.file_url) return;
      try {
        if (autoplay && p.playing) p.togglePlay();
        player.replace({ uri: track.file_url });
        player.loop = loop;
        player.volume = (p.volume / 100) * OUTPUT_CEILING * fadeGain;
        if (autoplay) player.play();
        setIndex(i);
        try {
          player.setActiveForLockScreen(
            true,
            {
              title: track.title,
              artist: track.artist ?? 'AudioRelief',
              albumTitle: 'Sounds',
              artworkUrl: track.cover_art_url ?? undefined,
            },
            { showSeekBackward: true, showSeekForward: true },
          );
        } catch {
          // Lock-screen controls are a nicety; playback does not depend on them.
        }
      } catch {
        setIndex(-1);
      }
    },
    [player, p, loop, fadeGain],
  );

  /** The next playable index after `from`, or -1 when the queue has run out. */
  const step = useCallback(
    (from: number, dir: 1 | -1, wrap: boolean) => {
      const playable = queue.map((t, i) => (t.file_url ? i : -1)).filter((i) => i >= 0);
      if (!playable.length) return -1;
      if (shuffle && playable.length > 1) {
        const others = playable.filter((i) => i !== from);
        return others[Math.floor(Math.random() * others.length)];
      }
      const at = playable.indexOf(from);
      const nextAt = at + dir;
      if (nextAt >= 0 && nextAt < playable.length) return playable[nextAt];
      if (!wrap) return -1;
      return playable[(nextAt + playable.length) % playable.length];
    },
    [queue, shuffle],
  );

  const next = useCallback(() => {
    const i = step(index, 1, true);
    if (i >= 0) load(queue, i);
  }, [step, index, load, queue]);

  const prev = useCallback(() => {
    if (status.currentTime > RESTART_THRESHOLD || queue.length < 2) {
      player.seekTo(0).catch(() => {});
      return;
    }
    const i = step(index, -1, true);
    if (i >= 0) load(queue, i);
  }, [status.currentTime, queue, player, step, index, load]);

  // A track reaching its end without looping.
  useEffect(() => {
    if (!status.didJustFinish) return;
    if (endOfTrack) {
      p.setSleep(null);
      player.pause();
      player.seekTo(0).catch(() => {});
      return;
    }
    if (repeat === 'one') {
      player.seekTo(0).then(() => player.play()).catch(() => {});
      return;
    }
    const i = step(index, 1, repeat === 'all');
    if (i >= 0) load(queue, i);
    else {
      player.pause();
      player.seekTo(0).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.didJustFinish]);

  const toggle = useCallback(() => {
    if (!current) return;
    try {
      if (status.playing) {
        player.pause();
      } else {
        if (p.playing) p.togglePlay();
        player.play();
      }
    } catch {
      // not ready yet
    }
  }, [current, status.playing, player, p]);

  const playFrom = useCallback(
    (tracks: LibraryTrack[], id: string, from = 'Sounds') => {
      if (current?.id === id) {
        toggle();
        return;
      }
      const i = tracks.findIndex((t) => t.id === id);
      if (i < 0) return;
      setQueue(tracks);
      setContext(from);
      load(tracks, i);
    },
    [current?.id, toggle, load],
  );

  const value = useMemo<Ctx>(
    () => ({
      current,
      queue,
      context,
      playing: status.playing,
      buffering: status.isBuffering && !status.playing,
      playFrom,
      toggle,
      next,
      prev,
      seek: (s: number) => {
        player.seekTo(Math.max(0, s)).catch(() => {});
      },
      shuffle,
      toggleShuffle: () => setShuffle((s) => !s),
      setShuffle,
      repeat,
      cycleRepeat: () => setRepeat((r) => (r === 'off' ? 'all' : r === 'all' ? 'one' : 'off')),
      setRepeat,
    }),
    [current, queue, context, status.playing, status.isBuffering, playFrom, toggle, next, prev, player, shuffle, repeat],
  );

  const progress = useMemo<Progress>(
    () => ({
      position: status.currentTime || 0,
      // Streams report 0 until the header arrives; the library row knows.
      duration: status.duration || current?.duration_seconds || 0,
    }),
    [status.currentTime, status.duration, current?.duration_seconds],
  );

  return (
    <TrackContext.Provider value={value}>
      <ProgressContext.Provider value={progress}>{children}</ProgressContext.Provider>
    </TrackContext.Provider>
  );
}

export function useTrackPlayer() {
  const ctx = useContext(TrackContext);
  if (!ctx) throw new Error('useTrackPlayer must be used inside TrackPlayerProvider');
  return ctx;
}

export function useTrackProgress() {
  return useContext(ProgressContext);
}
