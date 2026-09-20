import { soundColor, SoundKey } from '../theme';

export type Category = 'noise' | 'rain' | 'nature' | 'room';

export type Sound = {
  id: string;
  name: string;
  meta: string;
  cat: Category;
  colors: readonly [string, string];
};

const c = (k: SoundKey) => soundColor[k] as unknown as readonly [string, string];

export const SOUNDS: Sound[] = [
  { id: 'rain-roof', name: 'Rain on a tin roof', meta: 'Field · 41 min', cat: 'rain', colors: c('rain') },
  { id: 'white', name: 'White noise', meta: 'Generated · steady', cat: 'noise', colors: c('white') },
  { id: 'ocean', name: 'Ocean swell', meta: 'Field · 62 min', cat: 'nature', colors: c('ocean') },
  { id: 'fan', name: 'Box fan', meta: 'Generated · steady', cat: 'room', colors: c('fan') },
  { id: 'brown', name: 'Brown noise', meta: 'Generated · steady', cat: 'noise', colors: c('brown') },
  { id: 'forest', name: 'Forest at dusk', meta: 'Field · 55 min', cat: 'nature', colors: c('forest') },
  { id: 'pink', name: 'Pink noise', meta: 'Generated · steady', cat: 'noise', colors: c('pink') },
  { id: 'green', name: 'Green noise', meta: 'Generated · steady', cat: 'noise', colors: c('green') },
  { id: 'rain-window', name: 'Rain on a window', meta: 'Field · 38 min', cat: 'rain', colors: ['#8FA9E8', '#2E3E78'] },
  { id: 'thunder', name: 'Distant thunder', meta: 'Field · 47 min', cat: 'rain', colors: ['#7FA2C4', '#26405C'] },
  { id: 'rain-forest', name: 'Rain in a forest', meta: 'Field · 52 min', cat: 'rain', colors: ['#69C4B4', '#1F5850'] },
  { id: 'stream', name: 'Mountain stream', meta: 'Field · 44 min', cat: 'nature', colors: ['#74D0D8', '#215E67'] },
  { id: 'crickets', name: 'Crickets and wind', meta: 'Field · 60 min', cat: 'nature', colors: ['#A8CF7E', '#4A6528'] },
  { id: 'ac', name: 'Air conditioner', meta: 'Generated · steady', cat: 'room', colors: ['#A9B7D6', '#434F6E'] },
  { id: 'radiator', name: 'Old radiator', meta: 'Field · 36 min', cat: 'room', colors: ['#C9A7A0', '#5E3D38'] },
  { id: 'train', name: 'Night train', meta: 'Field · 58 min', cat: 'room', colors: c('hum') },
  { id: 'hum', name: 'Deep hum', meta: 'Generated · seamless', cat: 'noise', colors: c('hum') },
];

export const CATEGORIES: Array<{ id: Category | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'noise', label: 'Noise' },
  { id: 'rain', label: 'Rain' },
  { id: 'nature', label: 'Nature' },
  { id: 'room', label: 'Room' },
];

export type Mix = {
  id: string;
  name: string;
  sub: string;
  fade: string;
  colors: readonly [string, string];
};

/**
 * Card artwork and glyph per mix.
 *
 * Kept beside the data rather than in the screen so the two cannot drift: a
 * mix without art would otherwise render an empty card and nobody would
 * notice until it shipped. Photos are Unsplash, bundled — see
 * assets/mixes/README.md for the licence position.
 */
export const MIX_ART: Record<string, { image: number; icon: 'rain' | 'waves' | 'tree' | 'fire' }> = {
  rain: { image: require('../../assets/mixes/rain.jpg'), icon: 'rain' },
  ocean: { image: require('../../assets/mixes/ocean.jpg'), icon: 'waves' },
  forest: { image: require('../../assets/mixes/forest.jpg'), icon: 'tree' },
  fire: { image: require('../../assets/mixes/fire.jpg'), icon: 'fire' },
};

/**
 * Background photograph for every sound in the library, keyed by sound id.
 * Licence and sources: assets/sounds/README.md. Three reuse the mix art.
 */
export const SOUND_ART: Record<string, number> = {
  'rain-roof': require('../../assets/mixes/rain.jpg'),
  ocean: require('../../assets/mixes/ocean.jpg'),
  forest: require('../../assets/mixes/forest.jpg'),
  'rain-window': require('../../assets/sounds/rain-window.jpg'),
  thunder: require('../../assets/sounds/thunder.jpg'),
  'rain-forest': require('../../assets/sounds/rain-forest.jpg'),
  stream: require('../../assets/sounds/stream.jpg'),
  crickets: require('../../assets/sounds/crickets.jpg'),
  fan: require('../../assets/sounds/fan.jpg'),
  train: require('../../assets/sounds/train.jpg'),
  ac: require('../../assets/sounds/ac.jpg'),
  radiator: require('../../assets/sounds/radiator.jpg'),
  white: require('../../assets/sounds/white.jpg'),
  pink: require('../../assets/sounds/pink.jpg'),
  brown: require('../../assets/sounds/brown.jpg'),
  green: require('../../assets/sounds/green.jpg'),
  hum: require('../../assets/sounds/hum.jpg'),
};

/** Art for anything the player can have selected — a mix or a library sound. */
export const artFor = (id: string): number | null =>
  MIX_ART[id]?.image ?? SOUND_ART[id] ?? null;

export const MIXES: Mix[] = [
  { id: 'rain', name: 'Rain on a tin roof', sub: '3 layers · 45 min', fade: 'Fades out at 45 min', colors: c('rain') },
  { id: 'ocean', name: 'Deep ocean hum', sub: '3 layers · all night', fade: 'Plays until your alarm', colors: c('ocean') },
  { id: 'forest', name: 'Forest at dusk', sub: '2 layers · 30 min', fade: 'Fades out at 30 min', colors: c('forest') },
  { id: 'fire', name: 'Fireside and wind', sub: '3 layers · 60 min', fade: 'Fades out at 60 min', colors: c('fire') },
];

export const NOISES = [
  { id: 'white', name: 'White', full: 'White noise', colors: c('white') },
  { id: 'pink', name: 'Pink', full: 'Pink noise', colors: c('pink') },
  { id: 'brown', name: 'Brown', full: 'Brown noise', colors: c('brown') },
  { id: 'green', name: 'Green', full: 'Green noise', colors: c('green') },
] as const;

/** The mix a new user starts with — ids into SOUNDS. */
export const DEFAULT_MIX_LAYERS = ['pink', 'brown'];

export const DEFAULT_LAYER_VOL: Record<string, number> = {
  pink: 62,
  brown: 44,
};

export const DEFAULT_LAYER_ON: Record<string, boolean> = {
  pink: true,
  brown: true,
};

export const soundById = (id: string): Sound | undefined => SOUNDS.find((s) => s.id === id);

/**
 * Three lengths: a short reset, an evening, and most of a night.
 *
 * `seconds` is the real duration the player counts down, and `fadeSeconds` the
 * tail it spends easing the volume to nothing. These used to be fixed strings
 * ("Stops in 57:40") that never moved — the screen promised a timer the app did
 * not have.
 */
export const TIMERS = [
  { id: '15m', label: '15 min', seconds: 15 * 60, fadeSeconds: 3 * 60, fade: 'Fades over the last 3 min' },
  { id: '1h', label: '1 hour', seconds: 60 * 60, fadeSeconds: 5 * 60, fade: 'Fades over the last 5 min' },
  { id: '3h', label: '3 hours', seconds: 3 * 60 * 60, fadeSeconds: 10 * 60, fade: 'Fades over the last 10 min' },
] as const;

/** m:ss under an hour, h:mm:ss over it. */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

/**
 * Channels: different recordings of the same subject, so a forest can be
 * birdsong one night and wind in the pines the next without leaving the
 * sound.
 *
 * Only sounds with a real subject get them. The generated noises are one
 * mathematically defined signal each, so there is nothing to vary and they
 * get no channel row.
 *
 * None of these have audio yet — they describe the recordings to source.
 * When one lands, register it in SOUND_ASSETS as `${soundId}:${channelId}`.
 */
export type Channel = { id: string; label: string };

export const CHANNELS: Record<string, Channel[]> = {
  rain: [
    { id: 'steady', label: 'Steady' },
    { id: 'heavy', label: 'Heavy' },
    { id: 'eaves', label: 'Dripping eaves' },
  ],
  'rain-roof': [
    { id: 'steady', label: 'Steady' },
    { id: 'heavy', label: 'Heavy' },
    { id: 'eaves', label: 'Dripping eaves' },
  ],
  'rain-window': [
    { id: 'drizzle', label: 'Drizzle' },
    { id: 'downpour', label: 'Downpour' },
  ],
  thunder: [
    { id: 'far', label: 'Far off' },
    { id: 'rolling', label: 'Rolling' },
  ],
  'rain-forest': [
    { id: 'canopy', label: 'Canopy' },
    { id: 'undergrowth', label: 'Undergrowth' },
  ],
  ocean: [
    { id: 'swell', label: 'Swell' },
    { id: 'shore', label: 'Shoreline' },
    { id: 'deep', label: 'Deep water' },
  ],
  forest: [
    { id: 'birdsong', label: 'Birdsong' },
    { id: 'pines', label: 'Wind in pines' },
    { id: 'rain', label: 'Light rain' },
  ],
  stream: [
    { id: 'brook', label: 'Brook' },
    { id: 'creek', label: 'Shallow creek' },
  ],
  crickets: [
    { id: 'field', label: 'Summer field' },
    { id: 'grass', label: 'Wind and grass' },
  ],
  fire: [
    { id: 'crackle', label: 'Crackling' },
    { id: 'embers', label: 'Embers' },
  ],
  fan: [
    { id: 'low', label: 'Low speed' },
    { id: 'high', label: 'High speed' },
  ],
  ac: [
    { id: 'window', label: 'Window unit' },
    { id: 'central', label: 'Central air' },
  ],
  radiator: [
    { id: 'tick', label: 'Ticking' },
    { id: 'hiss', label: 'Hiss' },
  ],
  train: [
    { id: 'sleeper', label: 'Sleeper cabin' },
    { id: 'carriage', label: 'Carriage' },
  ],
};
