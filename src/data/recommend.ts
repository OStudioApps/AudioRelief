import { CharacterId } from './tinnitus';

/**
 * Turning the onboarding answers into what the home screen actually offers.
 *
 * The reasoning is kept here, in one place, rather than scattered through the
 * UI — so it can be read, argued with and corrected without touching layout.
 *
 * The honest limits of what this can claim, stated once:
 *
 *  - This is sound enrichment, not the notched-music therapy in the research.
 *    The app plays broadband noise; it does not yet cut a notch around a
 *    person's matched frequency. Nothing here should imply otherwise.
 *  - Matching a noise to a pitch is a comfort and overlap argument, not a
 *    treatment claim: brown noise carries its energy low, white carries it
 *    high, so one will sit closer to a given tinnitus pitch than another.
 *  - Nothing in here predicts an outcome for an individual.
 */

export type NoiseId = 'white' | 'pink' | 'brown' | 'green';

export type SoundPick = {
  id: NoiseId;
  /** Why this one, in the user's language. One sentence, no hedging words. */
  reason: string;
};

/**
 * Which noise sits closest to a matched pitch.
 *
 * Pitch is the stronger signal, so it decides when we have it. The spectra:
 * brown falls 6 dB per octave (energy low), pink 3 dB (broad, weighted low
 * but reaching up), white is flat (most energy in the high end, and the
 * harshest to listen to for hours).
 *
 * Most tinnitus is high-pitched, and for those we still lead with pink
 * rather than white: white has more energy at the pitch, but it is tiring
 * over a night, and a sound nobody can tolerate helps nobody.
 */
export function pickByPitch(hz: number | null, character: CharacterId | null): SoundPick {
  if (hz !== null) {
    if (hz <= 1000) {
      return { id: 'brown', reason: 'Its energy sits low, in the same range as your tone.' };
    }
    if (hz <= 3000) {
      return { id: 'pink', reason: 'Broad and weighted low, overlapping your mid-range tone.' };
    }
    return { id: 'pink', reason: 'Broad and easy to listen to for hours, and it reaches up into your range.' };
  }

  // No matched pitch — fall back to the character they recognised.
  switch (character) {
    case 'roaring':
    case 'buzzing':
      return { id: 'brown', reason: 'Deep and wide, like the low sound you described.' };
    case 'hissing':
      return { id: 'pink', reason: 'Closest to the steady, airy sound you described.' };
    case 'ringing':
      return { id: 'pink', reason: 'A balanced starting point for a clear, high tone.' };
    default:
      return { id: 'pink', reason: 'A balanced starting point until you can match a pitch.' };
  }
}

/** A second option worth trying, so the screen offers a choice rather than a verdict. */
export function alternativeTo(pick: SoundPick, hz: number | null): SoundPick {
  if (pick.id === 'brown') {
    return { id: 'pink', reason: 'Brighter than brown, if brown feels too heavy.' };
  }
  if (hz !== null && hz > 3000) {
    return { id: 'white', reason: 'More energy up at your pitch, but brighter — try it briefly first.' };
  }
  return { id: 'brown', reason: 'Deeper than pink, if pink feels too present.' };
}

/**
 * When the app should be ready for them, from the "when is it hardest" answer.
 * This is the one onboarding answer that changes behaviour rather than content.
 */
export function timingFor(pattern: string | null): string | null {
  switch (pattern) {
    case 'night':
      return 'Start it as you get into bed. The all-night timer keeps it going so you are not thinking about it.';
    case 'quiet':
      return 'Leave it on quietly in the background whenever a room goes silent — that is when it has the most to do.';
    case 'stress':
      return 'Use it as a short reset. Fifteen or forty-five minutes when things get tight beats one long session.';
    case 'always':
      return 'Short, regular sessions tend to work better than one long one. Little and often.';
    default:
      return null;
  }
}

/**
 * How loud to set it.
 *
 * The classic TRT rationale is to keep the sound at or just below the point
 * where it begins to blend with the tinnitus, on the argument that the brain
 * cannot habituate to a signal it can no longer detect. That reasoning is
 * standard; the evidence is not settled — at least one trial found mixing
 * point and total masking equally effective, and the recommendation has
 * softened over the years. So this is worded as the common approach, not a
 * rule, and it leans on the part that is not in dispute: quieter is safer.
 */
export const LEVEL_GUIDANCE =
  'Set it just quiet enough that you can still hear your tinnitus underneath. The aim is to sit alongside it, not bury it — and turning sound up for hours risks your hearing, which makes tinnitus worse.';

/**
 * Days between impact check-ins. Onboarding promises "every few weeks", and
 * thirty reads as a round, recognisable stretch on a dotted progress row.
 */
export const CHECKIN_DAYS = 30;

export function checkinDue(daysSinceImpact: number | null): boolean {
  return daysSinceImpact !== null && daysSinceImpact >= CHECKIN_DAYS;
}

/** A short, plain summary of the profile, for the top of the section. */
export function profileSummary(
  character: CharacterId | null,
  hz: number | null,
  toneUnknown: boolean,
): string {
  const c = character ? character.charAt(0).toUpperCase() + character.slice(1) : 'Your sound';
  if (hz !== null) {
    const pitch = hz >= 1000 ? `${hz / 1000} kHz` : `${hz} Hz`;
    return `${c} · around ${pitch}`;
  }
  if (toneUnknown) return `${c} · pitch not matched`;
  return c;
}
