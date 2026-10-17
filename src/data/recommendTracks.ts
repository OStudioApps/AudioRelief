import type { CharacterId } from './tinnitus';
import type { FrequencyBand, LibraryTrack } from './library';

/**
 * The "Recommended" row on Home: library tracks picked for this person.
 *
 * Tracks carry a frequency band, tagged on the dashboard. For someone with
 * tinnitus the row leads with tracks in the same band as their tone — the
 * same overlap argument as src/data/recommend.ts makes for the noises, and
 * with the same limits: comfort and masking, not a treatment claim. For
 * someone without tinnitus it leads with the low and broadband tracks that
 * suit falling asleep.
 *
 * The row only says "matched" when something actually matched. Until tracks
 * are tagged it says so plainly and offers the newest ones instead, rather
 * than dressing an arbitrary list up as personal.
 */

const MAX = 8;

/** Which band a tone sits in. Same thresholds as pickByPitch. */
export function bandFor(hz: number | null, character: CharacterId | null): FrequencyBand {
  if (hz !== null) return hz <= 1000 ? 'low_frequency' : hz <= 3000 ? 'mid_frequency' : 'high_frequency';
  switch (character) {
    case 'roaring':
    case 'buzzing':
      return 'low_frequency';
    case 'ringing':
    case 'hissing':
      return 'high_frequency';
    default:
      return 'broadband';
  }
}

export type Recommendation = {
  title: string;
  /** One line under the heading saying why these. */
  reason: string;
  tracks: LibraryTrack[];
};

export function recommendTracks(
  library: LibraryTrack[],
  who: { tinnitus: boolean; hz: number | null; character: CharacterId | null },
): Recommendation {
  const playable = library.filter((t) => t.file_url);

  // Highest score first; ties keep the library's own order (newest first).
  const ranked = (score: (t: LibraryTrack) => number) =>
    playable
      .map((t, i) => ({ t, i, s: score(t) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s || a.i - b.i)
      .map((x) => x.t)
      .slice(0, MAX);

  if (who.tinnitus) {
    const band = bandFor(who.hz, who.character);
    // Their own band first, then broadband, which overlaps every band a little.
    const tracks = ranked((t) =>
      t.target_frequency_band === band ? 2 : t.target_frequency_band === 'broadband' ? 1 : 0,
    );
    if (tracks.length) {
      return {
        title: 'Recommended for your tinnitus',
        reason: band === 'broadband' ? 'Broad sound that overlaps most tones' : 'Sound in the same range as your tone',
        tracks,
      };
    }
  } else {
    const tracks = ranked((t) =>
      t.target_frequency_band === 'low_frequency' ? 2 : t.target_frequency_band === 'broadband' ? 1 : 0,
    );
    if (tracks.length) {
      return { title: 'Recommended for sleep', reason: 'Low, even sound that is easy to drift off to', tracks };
    }
  }

  return {
    title: who.tinnitus ? 'Recommended for your tinnitus' : 'Recommended for sleep',
    reason: 'A few calm places to start',
    tracks: playable.slice(0, MAX),
  };
}
