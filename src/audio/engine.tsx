import React, { useEffect } from 'react';
import { usePathname } from 'expo-router';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { usePlayer } from '../state';
import { gainFor, SOUND_ASSETS } from './assets';

/**
 * The sound engine: one looping voice per active mix layer.
 *
 * Audio-mode choices here are the opposite of the onboarding music, on purpose:
 *
 *  - `playsInSilentMode: true` — someone running masking sound overnight has
 *    almost certainly silenced their ringer. Respecting the switch here would
 *    make the product fail exactly when it is needed.
 *  - `shouldPlayInBackground: true` — the screen must be allowed to turn off.
 *    An eight-hour session with the display lit is a battery and screen-burn
 *    problem, so the sound has to survive the lock.
 *
 * The provider that mounts this sits at the app root, so the engine is alive on
 * every route. It must therefore stay silent through the first-run flow, which
 * has its own music — otherwise both play at once.
 */

/** Welcome and onboarding. The engine never sounds here. */
const FIRST_RUN = [
  '/',
  '/sound',
  '/pitch',
  '/profile',
  '/impact',
  '/pattern',
  '/why',
  '/safety',
  '/auth',
];

/**
 * One looping layer. A component per voice, since hooks cannot run in a loop.
 * The source is either a bundled file or a sound streamed from Supabase.
 * Exported for the mix editor, which previews a mix with the same voices.
 */
export function LoopVoice({
  source,
  gain,
  playing,
}: {
  source: number | { uri: string };
  gain: number;
  playing: boolean;
}) {
  const player = useAudioPlayer(source);

  useEffect(() => {
    try {
      player.loop = true;
    } catch {
      // player still loading; loop is set again by the gain effect below
    }
  }, [player]);

  useEffect(() => {
    try {
      player.loop = true;
      player.volume = gain;
    } catch {
      // not ready yet
    }
  }, [player, gain]);

  useEffect(() => {
    try {
      if (playing) {
        Promise.resolve(player.play()).catch(() => {});
      } else {
        player.pause();
      }
    } catch {
      // not ready yet
    }
  }, [player, playing]);

  // Stop cleanly when the layer is removed rather than leaving it running.
  useEffect(() => {
    return () => {
      try {
        player.pause();
      } catch {
        // already released by the hook
      }
    };
  }, [player]);

  return null;
}

export function SoundEngine() {
  const p = usePlayer();
  const pathname = usePathname();
  const allowed = !FIRST_RUN.includes(pathname);
  const sourceOf = (id: string) => SOUND_ASSETS[id] ?? (p.layerSrc[id] ? { uri: p.layerSrc[id] } : null);
  const voices = allowed ? p.mixLayers.filter((id) => sourceOf(id) != null) : [];
  const anyPlaying = allowed && p.playing && voices.length > 0;

  useEffect(() => {
    if (!anyPlaying) return;
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    }).catch(() => {
      // Audio mode is best-effort; never let it take the screen down.
    });
  }, [anyPlaying]);

  return (
    <>
      {voices.map((id) => (
        <LoopVoice
          key={id}
          source={sourceOf(id)!}
          // The sleep timer's tail rides on top of the master volume, so the
          // last minutes ease away without the slider appearing to move.
          gain={p.layerOn[id] === false ? 0 : gainFor(p.volume * p.fadeGain, p.layerVol[id] ?? 50)}
          playing={allowed && p.playing}
        />
      ))}
    </>
  );
}
