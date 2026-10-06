import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import type { LibraryTrack } from '../data/library';
import { usePlayer } from '../state';
import { OUTPUT_CEILING } from './assets';

/**
 * The library player: the streamed tracks from the Sounds tab, played as a
 * queue the way a music app does — next, previous, scrub, shuffle, repeat,
 * and a sleep timer.
 *
 * It lives at the root rather than in the Sounds screen so the sound keeps
 * going when you change tab, and so the mini player and the full-screen
 * player are views onto the same voice instead of each owning one.
 *
 * It never overlaps the mixer: starting a track pauses the mix, and starting
 * the mix pauses the track. Both share the one master volume.
 */

export type Repeat = 'off' | 'all' | 'one';

export type SleepOption = { id: string; label: string; minutes?: number };

export const SLEEP_OPTIONS: SleepOption[] = [
  { id: '5', label: '5 minutes', minutes: 5 },
  { id: '10', label: '10 minutes', minutes: 10 },
  { id: '15', label: '15 minutes', minutes: 15 },
  { id: '30', label: '30 minutes', minutes: 30 },
  { id: '45', label: '45 minutes', minutes: 45 },
  { id: '60', label: '1 hour', minutes: 60 },
  { id: 'track', label: 'End of track' },
];

/** The last stretch of a timed sleep eases down instead of cutting out. */
const SLEEP_FADE_SECONDS = 30;

/** Past this far into a track, "previous" restarts it rather than going back. */
const RESTART_THRESHOLD = 3;

type Sleep = { id: string; endsAt: number | null };

type Ctx = {
  current: LibraryTrack | null;
  queue: LibraryTrack[];
  playing: boolean;
  buffering: boolean;
  /** Start `tracks` as the queue, from the one with `id`. Tapping the current track toggles it. */
  playFrom: (tracks: LibraryTrack[], id: string) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (seconds: number) => void;
  shuffle: boolean;
  toggleShuffle: () => void;
  repeat: Repeat;
  cycleRepeat: () => void;
  /** The chosen sleep option's id, or null when no timer is set. */
  sleep: string | null;
  /** Seconds until a timed sleep stops the sound; null for none or end-of-track. */
  sleepRemaining: number | null;
  setSleep: (id: string | null) => void;
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
  const [index, setIndex] = useState(-1);
  const [shuffle, setShuffle] = useState(false);
  // Sleep sounds are mostly one long texture, so the default is to hold the
  // one chosen rather than wander off into the next.
  const [repeat, setRepeat] = useState<Repeat>('one');
  const [sleep, setSleepState] = useState<Sleep | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const current = index >= 0 ? queue[index] ?? null : null;

  /*
    Remaining time runs off a deadline, not a counted tick: timers are
    throttled with the screen off, which is exactly when this one runs.
  */
  useEffect(() => {
    if (!sleep?.endsAt) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [sleep?.endsAt]);

  const sleepRemaining = sleep?.endsAt ? Math.max(0, Math.ceil((sleep.endsAt - now) / 1000)) : null;
  const fadeGain =
    sleepRemaining == null ? 1 : Math.max(0, Math.min(1, sleepRemaining / SLEEP_FADE_SECONDS));

  useEffect(() => {
    if (sleepRemaining !== 0) return;
    try {
      player.pause();
    } catch {
      // not ready yet
    }
    setSleepState(null);
  }, [sleepRemaining, player]);

  // Master volume, under the hearing ceiling, times the sleep fade.
  useEffect(() => {
    try {
      player.volume = (p.volume / 100) * OUTPUT_CEILING * fadeGain;
    } catch {
      // not ready yet
    }
  }, [player, p.volume, fadeGain]);

  // "End of track" has to see the track end, so the loop is off while it is set.
  const loop = repeat === 'one' && sleep?.id !== 'track';
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
    if (sleep?.id === 'track') {
      setSleepState(null);
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
    (tracks: LibraryTrack[], id: string) => {
      if (current?.id === id) {
        toggle();
        return;
      }
      const i = tracks.findIndex((t) => t.id === id);
      if (i < 0) return;
      setQueue(tracks);
      load(tracks, i);
    },
    [current?.id, toggle, load],
  );

  const setSleep = useCallback((id: string | null) => {
    const opt = SLEEP_OPTIONS.find((o) => o.id === id);
    if (!opt) {
      setSleepState(null);
      return;
    }
    setSleepState({ id: opt.id, endsAt: opt.minutes ? Date.now() + opt.minutes * 60_000 : null });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      current,
      queue,
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
      repeat,
      cycleRepeat: () => setRepeat((r) => (r === 'off' ? 'all' : r === 'all' ? 'one' : 'off')),
      sleep: sleep?.id ?? null,
      sleepRemaining,
      setSleep,
    }),
    [current, queue, status.playing, status.isBuffering, playFrom, toggle, next, prev, player, shuffle, repeat, sleep?.id, sleepRemaining, setSleep],
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
