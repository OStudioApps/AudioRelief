import React from 'react';
import { View, ViewStyle } from 'react-native';
import {
  Alarm,
  ArrowClockwise,
  Bed,
  BellSlash,
  Brain,
  CreditCard,
  CaretDown,
  CaretLeft,
  CaretRight,
  ChartLineUp,
  CloudRain,
  Check,
  Clock,
  Envelope,
  Eye,
  EyeSlash,
  FileText,
  Fire,
  GlobeSimple,
  Heart,
  House,
  Lock,
  MagnifyingGlass,
  Minus,
  Moon,
  Pause,
  Play,
  Plus,
  ShieldCheck,
  SignOut,
  SlidersHorizontal,
  SpeakerHigh,
  SpeakerLow,
  SpeakerNone,
  SpeakerSlash,
  Sun,
  Trash,
  Tree,
  User,
  Waves,
  X,
  type Icon as PhosphorIcon,
  type IconWeight,
} from 'phosphor-react-native';
import { color } from '../theme';

/**
 * The app's icon set, on Phosphor (phosphor-react-native).
 *
 * Two names are deliberate substitutions rather than literal matches — Phosphor
 * has no "zzz" or "alarm-off" glyph:
 *  - `zzz` (the sleep tab, the "snoring partner" onboarding option) uses Bed.
 *  - `alarmOff` uses BellSlash, paired against `alarm`'s Alarm glyph — a small
 *    family mismatch (clock-alarm vs. bell), accepted because it is the
 *    clearest "no alarm" glyph Phosphor ships.
 * Everything else is a direct name match.
 *
 * react-native-web renders <Svg> as a raw <svg>, which is `position: static`.
 * Every View it renders is `position: relative`. Inside a glass card the blur
 * and tint are absolutely positioned siblings, and positioned elements paint
 * above static ones — so a bare icon ends up *underneath* the blur and comes
 * out soft while the text beside it stays sharp. Positioning the svg puts it
 * back on top. Apply this to every Svg that can sit on glass.
 */
export const SVG_LAYER = { position: 'relative' } as const;

const ICONS: Record<string, PhosphorIcon> = {
  chart: ChartLineUp,
  rain: CloudRain,
  fire: Fire,
  tree: Tree,
  home: House,
  moon: Moon,
  waves: Waves,
  zzz: Bed,
  chevronLeft: CaretLeft,
  chevronRight: CaretRight,
  chevronDown: CaretDown,
  clock: Clock,
  alarm: Alarm,
  alarmOff: BellSlash,
  search: MagnifyingGlass,
  heart: Heart,
  plus: Plus,
  minus: Minus,
  close: X,
  check: Check,
  refresh: ArrowClockwise,
  volume: SpeakerNone,
  volumeLow: SpeakerLow,
  volumeHigh: SpeakerHigh,
  volumeOff: SpeakerSlash,
  mail: Envelope,
  lock: Lock,
  eye: Eye,
  eyeOff: EyeSlash,
  brain: Brain,
  sun: Sun,
  mixer: SlidersHorizontal,
  // Account screen.
  user: User,
  language: GlobeSimple,
  card: CreditCard,
  shield: ShieldCheck,
  document: FileText,
  signOut: SignOut,
  trash: Trash,
};

export type IconName = keyof typeof ICONS | 'play' | 'pause';

/**
 * Phosphor has no numeric stroke width, only a `weight` enum. Call sites
 * across the app were written for a hand-drawn set with numeric weights
 * (1.7 by default, up to 3 for a couple of emphasised glyphs) — rather than
 * touch every one, anything at or below the old default reads as Phosphor's
 * "regular," anything heavier as "bold." Phosphor tops out at bold; there is
 * no heavier stroke option short of switching to a filled glyph.
 */
function weightFor(strokeWidth: number): IconWeight {
  return strokeWidth > 1.75 ? 'bold' : 'regular';
}

export function Icon({
  name,
  size = 20,
  color: tint = color.ink,
  strokeWidth = 1.7,
}: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const wrap = SVG_LAYER as ViewStyle;

  if (name === 'play' || name === 'pause') {
    const Glyph = name === 'play' ? Play : Pause;
    return (
      <View style={wrap}>
        <Glyph size={size} color={tint} weight="fill" />
      </View>
    );
  }

  const Glyph = ICONS[name];
  if (!Glyph) return null;

  return (
    <View style={wrap}>
      <Glyph size={size} color={tint} weight={weightFor(strokeWidth)} />
    </View>
  );
}

/** Heart with a fill state, for save/favourite. */
export function HeartIcon({
  filled,
  size = 20,
  tint = color.accent,
}: {
  filled: boolean;
  size?: number;
  tint?: string;
}) {
  return (
    <View style={SVG_LAYER as ViewStyle}>
      <Heart size={size} color={filled ? tint : color.ink} weight={filled ? 'fill' : 'regular'} />
    </View>
  );
}
