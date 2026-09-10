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

export const TIMERS = [
  { id: '15m', label: '15 min', stop: 'Stops in 14:12', pct: 0.06, fade: 'Fades over the last 3 min' },
  { id: '45m', label: '45 min', stop: 'Stops in 42:18', pct: 0.06, fade: 'Fades over the last 5 min' },
  { id: '2h', label: '2 hours', stop: 'Stops in 1:56:04', pct: 0.03, fade: 'Fades over the last 10 min' },
  { id: 'all', label: 'All night', stop: 'Plays until your alarm', pct: 0.02, fade: 'No fade · stops at 6:40' },
] as const;
