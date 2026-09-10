import React, { createContext, useContext, useMemo, useState } from 'react';
import {
  DEFAULT_LAYER_ON,
  DEFAULT_LAYER_VOL,
  DEFAULT_MIX_LAYERS,
  MIXES,
  NOISES,
  TIMERS,
} from './data/sounds';

/**
 * One playback state for the whole app, so the tabs actually agree with each
 * other: what the Tonight card says is what the Player and Mixer are showing.
 * The sound engine reads this state and renders one looping voice per layer.
 */

type Selection = { kind: 'mix' | 'noise'; id: string };

type Ctx = {
  selection: Selection;
  select: (s: Selection) => void;
  title: string;
  subtitle: string;
  fade: string;
  colors: readonly [string, string];

  playing: boolean;
  togglePlay: () => void;

  timer: string;
  setTimer: (id: string) => void;
  timerStop: string;
  timerPct: number;
  timerFade: string;

  volume: number;
  setVolume: (v: number) => void;

  favourite: boolean;
  toggleFavourite: () => void;

  /** Sound ids currently in the mix, in the order they were added. */
  mixLayers: string[];
  layerVol: Record<string, number>;
  layerOn: Record<string, boolean>;
  setLayerVol: (id: string, v: number) => void;
  toggleLayer: (id: string) => void;
  addLayer: (id: string) => void;
  removeLayer: (id: string) => void;
  resetLayers: () => void;
  activeLayers: number;

  nightVolume: number;
  stepNightVolume: () => void;
  alarmOn: boolean;
  toggleAlarm: () => void;
};



const PlayerContext = createContext<Ctx | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [selection, select] = useState<Selection>({ kind: 'mix', id: 'rain' });
  // Nothing plays until asked. An app that starts making sound on launch is startling,
  // and during first-run it collided with the onboarding music.
  const [playing, setPlaying] = useState(false);
  const [timer, setTimer] = useState('45m');
  const [volume, setVolume] = useState(62);
  const [favourite, setFavourite] = useState(true);
  const [mixLayers, setMixLayers] = useState<string[]>([...DEFAULT_MIX_LAYERS]);
  const [layerVol, setVols] = useState<Record<string, number>>({ ...DEFAULT_LAYER_VOL });
  const [layerOn, setOn] = useState<Record<string, boolean>>({ ...DEFAULT_LAYER_ON });
  const [nightVolume, setNightVolume] = useState(34);
  const [alarmOn, setAlarmOn] = useState(true);

  const value = useMemo<Ctx>(() => {
    const mix = MIXES.find((m) => m.id === selection.id);
    const noise = NOISES.find((n) => n.id === selection.id);
    const isNoise = selection.kind === 'noise';

    const title = isNoise ? noise?.full ?? '' : mix?.name ?? '';
    const subtitle = isNoise ? 'Steady broadband sound · loops seamlessly' : mix?.sub ?? '';
    const fade = isNoise ? 'Fades out at 45 min' : mix?.fade ?? '';
    const colors = (isNoise ? noise?.colors : mix?.colors) ?? MIXES[0].colors;

    const t = TIMERS.find((x) => x.id === timer) ?? TIMERS[1];
    const activeLayers = mixLayers.filter((id) => layerOn[id]).length;

    return {
      selection,
      select: (s: Selection) => {
        select(s);
        // Picking a sound is a request to hear it.
        setPlaying(true);
        if (s.kind === 'noise') {
          setMixLayers([s.id]);
          setVols((v) => ({ ...v, [s.id]: v[s.id] ?? 62 }));
          setOn((o) => ({ ...o, [s.id]: true }));
        }
      },
      title,
      subtitle,
      fade,
      colors: colors as readonly [string, string],
      playing,
      togglePlay: () => setPlaying((p) => !p),
      timer,
      setTimer,
      timerStop: t.stop,
      timerPct: t.pct,
      timerFade: t.fade,
      volume,
      setVolume,
      favourite,
      toggleFavourite: () => setFavourite((f) => !f),
      mixLayers,
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
      nightVolume,
      stepNightVolume: () =>
        setNightVolume((v) => {
          const steps = [34, 22, 12, 0];
          const i = steps.indexOf(v);
          return steps[(i < 0 ? 0 : i + 1) % steps.length];
        }),
      alarmOn,
      toggleAlarm: () => setAlarmOn((a) => !a),
    };
  }, [selection, playing, timer, volume, favourite, mixLayers, layerVol, layerOn, nightVolume, alarmOn]);

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
