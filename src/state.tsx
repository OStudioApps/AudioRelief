import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  Channel,
  CHANNELS,
  DEFAULT_LAYER_ON,
  DEFAULT_LAYER_VOL,
  DEFAULT_MIX_LAYERS,
  MIXES,
  NOISES,
  SOUNDS,
  SLEEP_OPTIONS,
} from './data/sounds';
import { isPlayable } from './audio/assets';
import { trackColors } from './data/library';

/**
 * One playback state for the whole app, so the tabs actually agree with each
 * other: what the Tonight card says is what the Player and Mixer are showing.
 * The sound engine reads this state and renders one looping voice per layer.
 */

type Selection = { kind: 'mix' | 'noise'; id: string };

type Ctx = {
  selection: Selection;
  select: (s: Selection) => void;
  /**
   * Play a mix the person built and named. Its name and colours are passed in
   * rather than looked up: saved mixes live in their own provider, and the
   * player must not depend on it to know what it is playing.
   */
  playMix: (m: {
    id: string;
    name: string;
    layers: Array<{ id: string; vol: number; on: boolean; url?: string }>;
    /** Who made it: the person, or AudioRelief on the dashboard. Only changes how it is labelled. */
    by?: 'you' | 'app';
  }) => void;
  title: string;
  subtitle: string;
  colors: readonly [string, string];
  /**
   * Which sound's artwork represents what is playing. Same as the selection
   * for a library sound; for a saved mix it is the mix's first layer, since a
   * user-named mix has no photograph of its own.
   */
  artId: string;

  playing: boolean;
  togglePlay: () => void;

  /** Recordings available for the selected sound; empty when it has only one. */
  channels: Channel[];
  /** The chosen channel id for the selected sound, or null when it has none. */
  channel: string | null;
  setChannel: (id: string) => void;

  /**
   * The sleep timer, shared by everything the player can play — mixes,
   * noises and library tracks alike. The chosen option's id, or null for off.
   */
  sleep: string | null;
  setSleep: (id: string | null) => void;
  /** Seconds until a timed sleep stops the sound; null when off or "end of track". */
  sleepRemaining: number | null;
  /** The chosen length in seconds, for drawing how much is left. */
  sleepTotal: number | null;
  /**
   * Bumped each time a timed sleep runs out. The loop engine stops itself
   * here; the track player watches this to stop too.
   */
  sleepFired: number;
  /**
   * 1 for most of the session, easing to 0 across the timer's fade tail. Both
   * engines multiply their volume by this, so the room goes quiet gradually
   * instead of cutting out.
   */
  fadeGain: number;

  volume: number;
  setVolume: (v: number) => void;

  /* There was a `favourite` flag here, saving to a list the app never had
     anywhere to show. Bring it back with the screen that reads it. */

  /** Sound ids currently in the mix, in the order they were added. */
  mixLayers: string[];
  /** Streamed audio for layers that are not bundled with the app, by sound id. */
  layerSrc: Record<string, string>;
  layerVol: Record<string, number>;
  layerOn: Record<string, boolean>;
  setLayerVol: (id: string, v: number) => void;
  toggleLayer: (id: string) => void;
  addLayer: (id: string) => void;
  removeLayer: (id: string) => void;
  resetLayers: () => void;
  activeLayers: number;

  /* A night volume and an alarm toggle lived here for the 3 a.m. screen.
     That screen is gone, and state nothing reads is state that rots. */
};



const PlayerContext = createContext<Ctx | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [selection, select] = useState<Selection>({ kind: 'mix', id: 'rain' });
  // Nothing plays until asked. An app that starts making sound on launch is startling,
  // and during first-run it collided with the onboarding music.
  const [playing, setPlaying] = useState(false);
  // Remembered per sound, so returning to the forest brings back the pines.
  const [channelBy, setChannelBy] = useState<Record<string, string>>({});
  /*
    The saved mix currently playing, if any. Only what the player needs to
    name and colour itself — the mix's own record stays in the mixes store.
    Cleared whenever something else is selected.
  */
  const [custom, setCustom] = useState<{
    id: string;
    name: string;
    count: number;
    artId: string;
    by: 'you' | 'app';
  } | null>(null);
  const [volume, setVolume] = useState(62);
  const [mixLayers, setMixLayers] = useState<string[]>([...DEFAULT_MIX_LAYERS]);
  const [layerVol, setVols] = useState<Record<string, number>>({ ...DEFAULT_LAYER_VOL });
  const [layerOn, setOn] = useState<Record<string, boolean>>({ ...DEFAULT_LAYER_ON });
  const [layerSrc, setSrc] = useState<Record<string, string>>({});

  /*
    The sleep timer runs off a deadline rather than counted ticks: the phone
    throttles timers with the screen off, and this runs for hours with the
    screen off, so counted ticks would drift badly. The interval only reads
    the clock. It counts whether or not anything is playing, the way a music
    app's does — pausing for a minute does not buy the night extra time.
  */
  const [sleep, setSleepState] = useState<{ id: string; endsAt: number | null } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [sleepFired, setSleepFired] = useState(0);

  useEffect(() => {
    if (!sleep?.endsAt) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [sleep?.endsAt]);

  const sleepDef = SLEEP_OPTIONS.find((o) => o.id === sleep?.id) ?? null;
  const sleepRemaining = sleep?.endsAt ? Math.max(0, Math.ceil((sleep.endsAt - now) / 1000)) : null;

  useEffect(() => {
    if (sleepRemaining !== 0) return;
    setPlaying(false);
    setSleepState(null);
    setSleepFired((n) => n + 1);
  }, [sleepRemaining]);

  const value = useMemo<Ctx>(() => {
    // Look the selection up across everything that can be played. Previously
    // only the four mixes and the four noises were searched, so any library
    // sound picked from the Sounds tab arrived at the player with no title.
    const mix = MIXES.find((m) => m.id === selection.id);
    const sound = SOUNDS.find((x) => x.id === selection.id);
    const noise = NOISES.find((n) => n.id === selection.id);

    // Full volume until the tail, then a straight ramp down to silence.
    const fadeGain =
      sleepRemaining == null || !sleepDef?.fadeSeconds
        ? 1
        : Math.max(0, Math.min(1, sleepRemaining / sleepDef.fadeSeconds));

    // A saved mix is whatever the person called it. Its id is not in any
    // library, so it is checked before the lookups fall through to a blank.
    const own = custom && custom.id === selection.id ? custom : null;

    const title = mix?.name ?? sound?.name ?? noise?.full ?? own?.name ?? '';
    const subtitle =
      mix?.sub ??
      sound?.meta ??
      (noise ? 'Steady broadband sound · loops seamlessly' : null) ??
      (own
        ? `${own.count} ${own.count === 1 ? 'sound' : 'sounds'} · ${own.by === 'app' ? 'AudioRelief mix' : 'your mix'}`
        : '');
    // A mix takes its colour from the first sound in it.
    const ownColors = own ? (SOUNDS.find((s) => s.id === own.artId)?.colors ?? trackColors(own.artId)) : undefined;
    const colors = mix?.colors ?? sound?.colors ?? noise?.colors ?? ownColors ?? MIXES[0].colors;

    const channels = CHANNELS[selection.id] ?? [];
    const channel = channels.length ? (channelBy[selection.id] ?? channels[0].id) : null;

    const activeLayers = mixLayers.filter((id) => layerOn[id]).length;

    return {
      selection,
      select: (s: Selection) => {
        select(s);
        // Picking a sound is a request to hear it.
        setPlaying(true);
        // Anything with its own audio becomes the thing playing. Checking the
        // audio rather than `kind` matters: the Sounds tab selects white noise
        // as a library item, and gating on kind === 'noise' meant it kept
        // playing the previous mix instead of what was tapped.
        if (isPlayable(s.id)) {
          setMixLayers([s.id]);
          setVols((v) => ({ ...v, [s.id]: v[s.id] ?? 62 }));
          setOn((o) => ({ ...o, [s.id]: true }));
        }
        // Whatever was playing before, it is not the saved mix any more.
        setCustom(null);
      },
      playMix: (m) => {
        if (!m.layers.length) return;
        setCustom({ id: m.id, name: m.name, count: m.layers.length, artId: m.layers[0].id, by: m.by ?? 'you' });
        select({ kind: 'mix', id: m.id });
        setPlaying(true);
        setMixLayers(m.layers.map((l) => l.id));
        setVols((v) => ({ ...v, ...Object.fromEntries(m.layers.map((l) => [l.id, l.vol])) }));
        setOn((o) => ({ ...o, ...Object.fromEntries(m.layers.map((l) => [l.id, l.on])) }));
        setSrc((src) => ({
          ...src,
          ...Object.fromEntries(m.layers.filter((l) => l.url).map((l) => [l.id, l.url!])),
        }));
      },
      channels,
      channel,
      setChannel: (id: string) => setChannelBy((c) => ({ ...c, [selection.id]: id })),
      title,
      subtitle,
      colors: colors as readonly [string, string],
      artId: own?.artId ?? selection.id,
      playing,
      togglePlay: () => setPlaying((p) => !p),
      sleep: sleep?.id ?? null,
      // Picking a length always starts it over, including the one already
      // running — that re-tap is how the timer gets restarted.
      setSleep: (id: string | null) => {
        const opt = SLEEP_OPTIONS.find((o) => o.id === id);
        setSleepState(opt ? { id: opt.id, endsAt: opt.minutes ? Date.now() + opt.minutes * 60_000 : null } : null);
      },
      sleepRemaining,
      sleepTotal: sleepDef?.minutes ? sleepDef.minutes * 60 : null,
      sleepFired,
      fadeGain,
      volume,
      setVolume,
      mixLayers,
      layerSrc,
      layerVol,
      layerOn,
      setLayerVol: (id, v) => setVols((prev) => ({ ...prev, [id]: v })),
      toggleLayer: (id) => setOn((prev) => ({ ...prev, [id]: !prev[id] })),
      addLayer: (id) => {
        if (mixLayers.includes(id)) return;
        setVols((v) => ({ ...v, [id]: v[id] ?? 50 }));
        setOn((o) => ({ ...o, [id]: true }));
        setMixLayers((prev) => (prev.includes(id) ? prev : [...prev, id]));
      },
      removeLayer: (id) => setMixLayers((prev) => prev.filter((x) => x !== id)),
      resetLayers: () => {
        setMixLayers([...DEFAULT_MIX_LAYERS]);
        setVols({ ...DEFAULT_LAYER_VOL });
        setOn({ ...DEFAULT_LAYER_ON });
      },
      activeLayers,
    };
  }, [selection, playing, sleep, sleepDef, sleepRemaining, sleepFired, channelBy, custom, volume, mixLayers, layerSrc, layerVol, layerOn]);

  // SoundEngine is deliberately NOT rendered here. It needs usePlayer(), so
  // importing it from this file made state -> engine -> state a require
  // cycle. The root layout renders it inside this provider instead, which
  // gives it the same context with the dependency pointing one way only.
  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used inside PlayerProvider');
  return ctx;
}
