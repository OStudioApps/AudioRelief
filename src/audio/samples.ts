import { CharacterId, ToneId } from '../data/tinnitus';

/**
 * Short, synthesised clips used only during onboarding — the tinnitus
 * character samples and the pitch-matching tones. Generated, so no licence.
 *
 * Kept separate from SOUND_ASSETS: those loop for hours as therapy, these
 * play for a second or two as part of a question, and they are normalised
 * much quieter than the noise loops.
 */

export const CHARACTER_SAMPLES: Record<CharacterId, number> = {
  ringing: require('../../assets/audio/character/ringing.wav'),
  buzzing: require('../../assets/audio/character/buzzing.wav'),
  hissing: require('../../assets/audio/character/hissing.wav'),
  roaring: require('../../assets/audio/character/roaring.wav'),
  pulsing: require('../../assets/audio/character/pulsing.wav'),
};

export const TONE_SAMPLES: Record<ToneId, number> = {
  '500': require('../../assets/audio/tones/500.wav'),
  '1k': require('../../assets/audio/tones/1k.wav'),
  '2k': require('../../assets/audio/tones/2k.wav'),
  '3k': require('../../assets/audio/tones/3k.wav'),
  '4k': require('../../assets/audio/tones/4k.wav'),
  '6k': require('../../assets/audio/tones/6k.wav'),
  '8k': require('../../assets/audio/tones/8k.wav'),
  '10k': require('../../assets/audio/tones/10k.wav'),
  '12k': require('../../assets/audio/tones/12k.wav'),
};

/**
 * Onboarding clips play at a fixed, low level rather than through the mixer's
 * master volume — someone is holding the phone to their ear to compare a tone
 * against their own tinnitus, and that is the wrong moment to inherit whatever
 * the master happened to be set to.
 */
export const SAMPLE_VOLUME = 0.45;
