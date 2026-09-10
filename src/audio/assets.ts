/**
 * Playable audio, by sound id.
 *
 * These four are generated rather than recorded — coloured noise is defined by
 * maths, so there is no licence, no attribution, and no rights holder. For
 * tinnitus work they are also the material with the most history behind them,
 * which is why they are the first sounds to get real audio.
 *
 * Field recordings (rain, ocean, fan) are still silent placeholders. Anything
 * absent from this map shows in the library but cannot play yet.
 */
export const SOUND_ASSETS: Record<string, number> = {
  white: require('../../assets/audio/noise/white.wav'),
  pink: require('../../assets/audio/noise/pink.wav'),
  brown: require('../../assets/audio/noise/brown.wav'),
  green: require('../../assets/audio/noise/green.wav'),
};

export const isPlayable = (id: string) => SOUND_ASSETS[id] != null;

/**
 * Hearing-safety ceiling.
 *
 * This audience runs masking sound for eight hours a night, and loud masking
 * risks noise-induced hearing loss — which makes tinnitus worse. Every gain in
 * the app is multiplied by this, so the slider cannot reach full scale.
 */
export const OUTPUT_CEILING = 0.8;

/** Above this on the 0-100 slider the app warns rather than silently complying. */
export const LOUD_THRESHOLD = 80;

/**
 * Master + layer volume as a single gain, held under the ceiling.
 * `master` and `layer` are both 0-100.
 */
export function gainFor(master: number, layer: number): number {
  const g = (master / 100) * (layer / 100) * OUTPUT_CEILING;
  return Math.max(0, Math.min(OUTPUT_CEILING, g));
}
