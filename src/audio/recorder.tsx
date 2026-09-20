import { useEffect, useRef } from 'react';
import { useHistory } from '../history';
import { usePlayer } from '../state';

/**
 * Writes a line in the history every time a stretch of listening ends.
 *
 * Renders nothing. It sits at the root beside the sound engine and watches
 * the two things that end a session: playback stopping, and the selection
 * changing to something else while it is still going.
 *
 * Elapsed time is the difference between two clock readings rather than a
 * counter, so a night spent with the screen off and the JS thread asleep is
 * still measured correctly — which is the normal case for this app.
 *
 * Known gap: a session is written when it ends, so one that is still running
 * when the OS kills the app is lost. Writing every minute instead would
 * mean hundreds of storage writes a night to save a case that mostly does
 * not happen.
 */
export function SessionRecorder() {
  const p = usePlayer();
  const { logSession } = useHistory();

  const startedAt = useRef<number | null>(null);
  // What is playing, captured at the start — the title can change under us.
  const current = useRef<{ id: string; name: string } | null>(null);
  const volume = useRef(p.volume);
  volume.current = p.volume;

  // Kept in refs so the effects below can close over the latest values
  // without restarting the moment a title or a volume changes.
  const logRef = useRef(logSession);
  logRef.current = logSession;

  const flush = () => {
    const start = startedAt.current;
    const what = current.current;
    startedAt.current = null;
    current.current = null;
    if (start == null || !what) return;
    logRef.current({
      at: new Date(start).toISOString(),
      seconds: Math.round((Date.now() - start) / 1000),
      id: what.id,
      name: what.name,
      volume: volume.current,
    });
  };

  useEffect(() => {
    if (p.playing) {
      startedAt.current = Date.now();
      current.current = { id: p.selection.id, name: p.title || p.selection.id };
    } else {
      flush();
    }
    // Only playback starting or stopping opens and closes a session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.playing]);

  // Switching sound mid-session closes the old one and opens a new one, so
  // an evening of three different sounds reads as three sessions.
  useEffect(() => {
    if (!p.playing) return;
    if (current.current && current.current.id === p.selection.id) return;
    flush();
    startedAt.current = Date.now();
    current.current = { id: p.selection.id, name: p.title || p.selection.id };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.selection.id]);

  // A session in progress when the app tears down still counts.
  useEffect(() => flush, []);

  return null;
}
