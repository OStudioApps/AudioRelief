import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { usePathname } from 'expo-router';
import { useAudioPlayer } from 'expo-audio';
import { SAMPLE_VOLUME } from '../audio/samples';

/**
 * Plays one short onboarding clip at a time.
 *
 * "One at a time" is the whole point: these screens ask you to compare a sound
 * against your own tinnitus, and two clips overlapping would make that
 * impossible. Tapping a second play button stops the first.
 *
 * It also cuts off the moment the step changes — Continue, back, whatever —
 * so a clip never bleeds into the next screen. The provider is mounted once
 * at the root, so without this a tap on "Buzzing" would otherwise keep
 * playing underneath the pitch-matching step.
 */

type Ctx = {
  /** Which sample id is currently sounding, or null. */
  playing: string | null;
  play: (id: string, source: number) => void;
  stop: () => void;
};

const SampleContext = createContext<Ctx>({ playing: null, play: () => {}, stop: () => {} });

export function SampleProvider({ children }: { children: React.ReactNode }) {
  const player = useAudioPlayer(undefined);
  const [playing, setPlaying] = useState<string | null>(null);
  const clearAt = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = useCallback(() => {
    if (clearAt.current) {
      clearTimeout(clearAt.current);
      clearAt.current = null;
    }
    try {
      player.pause();
    } catch {
      // nothing loaded yet
    }
    setPlaying(null);
  }, [player]);

  const play = useCallback(
    (id: string, source: number) => {
      if (clearAt.current) clearTimeout(clearAt.current);
      try {
        // replace() resets playback position, so there is no need to seek —
        // and seeking before the new source has loaded can reject.
        player.replace(source);
        player.volume = SAMPLE_VOLUME;
        Promise.resolve(player.play()).catch(() => {});
        setPlaying(id);
        // Clips are 1.6-2.4s. Clear the indicator a little after the longest.
        clearAt.current = setTimeout(() => setPlaying(null), 2600);
      } catch {
        setPlaying(null);
      }
    },
    [player],
  );

  // Stop whatever clip is playing the instant the route changes.
  const pathname = usePathname();
  useEffect(() => {
    stop();
  }, [pathname, stop]);

  return (
    <SampleContext.Provider value={{ playing, play, stop }}>{children}</SampleContext.Provider>
  );
}

export function useSample() {
  return useContext(SampleContext);
}
