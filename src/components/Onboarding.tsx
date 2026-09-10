import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Aurora } from './Aurora';
import { PrimaryButton } from './Glass';
import { Icon } from './Icon';
import { PressScale } from './Motion';
import { color, HEADER_ROW, motion, radius, safe, type as t } from '../theme';

/**
 * Shared frame for one onboarding step.
 *
 * The back arrow and progress bar are NOT here — the onboarding layout draws
 * them as a fixed overlay so they stay put while steps slide underneath.
 * Everything this renders, background included, moves together as one page,
 * which is what the platform's stack animation slides.
 *
 * The background lives here rather than in the layout deliberately: the
 * screens have to be opaque for the arriving step to cover the departing one
 * mid-slide, and an opaque screen would hide a background sitting behind the
 * navigator anyway.
 *
 * One screen asks one thing. The frame enforces that — there is exactly one
 * title, one optional supporting line, and one button.
 */
export function OnboardingScreen({
  eyebrow,
  title,
  subtitle,
  children,
  cta,
  onNext,
  ctaDisabled,
  footer,
}: {
  /**
   * Which step this is. The layout derives the progress bar from the route,
   * but each screen still states its own position for readability.
   */
  step?: number;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  cta: string;
  onNext: () => void;
  ctaDisabled?: boolean;
  footer?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: color.ground }}>
      <Aurora
        blobs={[
          { size: 340, color: color.accent, opacity: 0.26, left: -90, top: -70, duration: motion.driftFast },
          { size: 320, color: color.violet, opacity: 0.26, right: -110, top: 240, dx: -26, dy: 28, duration: motion.driftSlow },
        ]}
        scrim={['rgba(7,10,22,0.22)', 'rgba(7,10,22,0.64)', 'rgba(7,10,22,0.88)']}
      />

      <View
        style={{
          flex: 1,
          // Clear the header the layout overlays on top of us.
          paddingTop: Math.max(insets.top, safe.top) + HEADER_ROW + 24,
          paddingBottom: Math.max(insets.bottom, safe.bottom),
          paddingHorizontal: safe.side,
        }}
      >
        <View style={{ gap: 8 }}>
          {eyebrow ? <Text style={[t.label, { color: color.ink58 }]}>{eyebrow}</Text> : null}
          <Text style={[t.title, { color: color.ink }]}>{title}</Text>
          {subtitle ? <Text style={[t.bodyMuted, { color: color.ink62 }]}>{subtitle}</Text> : null}
        </View>

        <View style={{ height: 20 }} />

        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
        >
          {children}
        </ScrollView>

        {footer ? <View style={{ paddingBottom: 12 }}>{footer}</View> : null}

        <PrimaryButton label={cta} onPress={onNext} disabled={ctaDisabled} />
      </View>
    </View>
  );
}

/** A single-select row. Used for every list question in the flow. */
export function ChoiceRow({
  label,
  hint,
  selected,
  onPress,
  left,
}: {
  label: string;
  hint?: string;
  selected: boolean;
  onPress: () => void;
  left?: React.ReactNode;
}) {
  return (
    <PressScale
      onPress={onPress}
      style={{
        minHeight: 62,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 13,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: radius.md,
        backgroundColor: selected ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.045)',
        borderWidth: 1.5,
        borderColor: selected ? color.accent : color.glassBorder,
      }}
    >
      {left}
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[t.card, { color: color.ink, fontSize: 14.5 }]}>{label}</Text>
        {hint ? <Text style={[t.meta, { color: color.ink58 }]}>{hint}</Text> : null}
      </View>
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: selected ? color.accent : 'transparent',
          borderWidth: 1.5,
          borderColor: selected ? color.accent : 'rgba(255,255,255,0.20)',
        }}
      >
        {selected ? <Icon name="check" size={13} color={color.onAccent} strokeWidth={3} /> : null}
      </View>
    </PressScale>
  );
}
