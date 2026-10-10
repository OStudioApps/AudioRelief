import React from 'react';
import { View, ViewStyle } from 'react-native';
import {
  Bird,
  CloudRain,
  Drop,
  Fan,
  Fire,
  Leaf,
  Lightning,
  Moon,
  Train,
  Tree,
  Waves,
  Wind,
  type Icon as PhosphorIcon,
} from 'phosphor-react-native';
import { color } from '../theme';
import { SVG_LAYER } from './Icon';

/**
 * Icons a sound can carry, chosen per sound on the dashboard.
 *
 * The dashboard stores the Phosphor name in `sounds.icon` and draws it with
 * @phosphor-icons/react, so the name means the same glyph on both sides.
 * Keep this list in step with SOUND_ICONS in the dashboard
 * (src/lib/sound-icons.tsx) and its `sounds_icon_allowed` check.
 */
export const SOUND_ICONS = {
  CloudRain,
  Waves,
  Tree,
  Fire,
  Wind,
  Moon,
  Drop,
  Lightning,
  Bird,
  Leaf,
  Fan,
  Train,
} satisfies Record<string, PhosphorIcon>;

export type SoundIconName = keyof typeof SOUND_ICONS;

export const DEFAULT_SOUND_ICON: SoundIconName = 'Waves';

/**
 * Draws a sound's icon. Unknown names — say, an icon added on the dashboard
 * after this build shipped — fall back to the default instead of rendering
 * nothing.
 */
export function SoundIcon({
  name,
  size = 20,
  color: tint = color.ink,
}: {
  name: string | null | undefined;
  size?: number;
  color?: string;
}) {
  const known = name != null && Object.hasOwn(SOUND_ICONS, name);
  const Glyph = SOUND_ICONS[known ? (name as SoundIconName) : DEFAULT_SOUND_ICON];
  return (
    <View style={SVG_LAYER as ViewStyle}>
      <Glyph size={size} color={tint} weight="regular" />
    </View>
  );
}
