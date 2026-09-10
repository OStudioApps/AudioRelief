/**
 * Aurora Glass — the design system the screens are built from.
 * Values match the approved design canvas; change them here, not per screen.
 */

export const color = {
  night: '#02040A',
  ground: '#070A16',
  raised: '#0E1224',

  glassFill: 'rgba(255,255,255,0.055)',
  glassBorder: 'rgba(255,255,255,0.09)',
  glassFillActive: 'rgba(255,255,255,0.10)',

  ink: '#EEF1FF',
  ink82: 'rgba(238,241,255,0.82)',
  ink72: 'rgba(238,241,255,0.72)',
  ink62: 'rgba(238,241,255,0.62)',
  /** Contrast floor outside night mode — roughly 5.6:1 on glass. */
  ink58: 'rgba(238,241,255,0.58)',

  accent: '#5FE0D2',
  accentAlt: '#B292F7',
  violet: '#6C4BD8',
  onAccent: '#06101A',

  /** Low/mid/high bands for the impact scale — good to worse, green to red. */
  scaleGood: '#7FD98C',
  scaleMid: '#F2A365',
  scaleBad: '#F2617A',
} as const;

/** One gradient per sound — it follows that sound everywhere in the app. */
export const soundColor = {
  rain: ['#6FB3F5', '#2F5C9E'],
  ocean: ['#5FC7E0', '#2C6E8C'],
  forest: ['#6FD79A', '#2F7D5C'],
  fire: ['#F2A365', '#A9532F'],
  hum: ['#B292F7', '#5B3EA8'],
  fan: ['#9FB0C9', '#4C5A76'],
  white: ['#E6ECFF', '#5C6789'],
  pink: ['#F58FB8', '#7C2F52'],
  brown: ['#D19A6B', '#6B3F22'],
  green: ['#7FD98C', '#2C6B3B'],
} as const;

export type SoundKey = keyof typeof soundColor;

export const font = {
  display: 'Sora_600SemiBold',
  displayRegular: 'Sora_400Regular',
  body: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
} as const;

/** Type scale. 11.5 is the floor for anything you read; 10.5 is tab labels only. */
export const type = {
  display: { fontFamily: font.display, fontSize: 34, letterSpacing: -1, lineHeight: 38 },
  title: { fontFamily: font.display, fontSize: 28, letterSpacing: -0.8, lineHeight: 32 },
  screen: { fontFamily: font.display, fontSize: 26, letterSpacing: -0.6, lineHeight: 29 },
  card: { fontFamily: font.display, fontSize: 15, letterSpacing: -0.2 },
  body: { fontFamily: font.body, fontSize: 14, lineHeight: 21 },
  bodyMuted: { fontFamily: font.body, fontSize: 13, lineHeight: 20 },
  meta: { fontFamily: font.body, fontSize: 11.5, lineHeight: 16 },
  label: { fontFamily: font.semibold, fontSize: 11, letterSpacing: 1.7, textTransform: 'uppercase' as const },
  tab: { fontFamily: font.medium, fontSize: 10.5 },
} as const;

/** 12 / 15 / 18 / 22 / 26 — plus true circles for round controls. */
export const radius = { xs: 12, sm: 15, md: 18, lg: 22, xl: 26 } as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 20, xl: 26 } as const;

/** Every control is at least 44x44, spaced 8 or more. */
export const HIT = 44;

/**
 * Height of the onboarding header row, excluding the status-bar inset.
 * Lives here so the layout that draws it and the screens that must clear it
 * agree on one number without importing from each other.
 */
export const HEADER_ROW = 44;

/** Safe-area fallbacks; screens add the real insets on top. */
export const safe = { top: 52, bottom: 34, side: 20 } as const;

export const glass = {
  backgroundColor: color.glassFill,
  borderWidth: 1,
  borderColor: color.glassBorder,
} as const;

/** Aurora drifts over 34-48s; the orb breathes on a 7s cycle. Nothing else moves. */
export const motion = { breath: 7000, driftSlow: 46000, driftFast: 34000 } as const;

/** Convert a hex colour to rgba(). Non-hex values pass through untouched. */
export function rgba(c: string, a: number): string {
  if (!c.startsWith('#')) return c;
  const h = c.slice(1);
  const n = h.length === 3 ? h.split('').map((x) => x + x).join('') : h.slice(0, 6);
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**
 * A glow, as a `boxShadow` string.
 *
 * The old `shadowColor`/`shadowRadius` props render as a hard, offset drop
 * shadow on web and as a flat grey elevation on Android — which read as a
 * smudge under the button rather than light coming off it. A wide, low-opacity,
 * barely-offset boxShadow is the shape light actually makes.
 * Returns undefined for non-hex tints (a white button should not glow).
 */
export function glow(c: string, a = 0.3, blur = 24, y = 6): string | undefined {
  if (!c.startsWith('#')) return undefined;
  return `0px ${y}px ${blur}px ${rgba(c, a)}`;
}
