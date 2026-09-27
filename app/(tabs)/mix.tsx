import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Aurora } from '../../src/components/Aurora';
import { GlassCard, PrimaryButton, RoundButton } from '../../src/components/Glass';
import { Icon } from '../../src/components/Icon';
import { PressScale } from '../../src/components/Motion';
import { artFor, soundById } from '../../src/data/sounds';
import { SavedMix, useMixes } from '../../src/mixes';
import { usePlayer } from '../../src/state';
import { color, font, glow, motion, radius, safe, space, type as t } from '../../src/theme';

const TAB_CLEARANCE = 118;

/**
 * The person's own mixes.
 *
 * This tab used to be the mixer itself — one anonymous mix that was whatever
 * you last fiddled with, and a Save button that saved nowhere. It is now the
 * shelf those mixes sit on: empty until you make one, then a card for each,
 * named by whoever made it. Building and editing happen on /mix-edit.
 */

/** A saved mix as a card — the same shape as a sound card, so the app reads as one app. */
function MixCard({ mix, onPlay, onEdit, playing }: {
  mix: SavedMix;
  onPlay: () => void;
  onEdit: () => void;
  playing: boolean;
}) {
  /*
    A mix has no photograph of its own, so it wears the ones it is made of:
    up to three panels side by side, in the order the sounds were added.
    Borrowing only the first layer's photo said "forest" for a mix of
    forest, stream and pink noise — the picture named one ingredient and
    hid the rest. A strip of them says "these, together", which is the
    thing a mix actually is.
  */
  const panels = mix.layers
    .slice(0, 3)
    .map((l) => ({ key: l.id, art: artFor(l.id), sound: soundById(l.id) }))
    .filter((p) => p.art);

  const lead = soundById(mix.layers[0]?.id ?? '');
  const colors = (lead?.colors ?? [color.violet, color.night]) as readonly [string, string];
  const count = mix.layers.length;

  return (
    /*
      The card is a plain container with three siblings inside it — the body,
      and the two corner controls — rather than buttons nested inside a
      button. Nesting them produced invalid markup on web and made the corner
      taps depend on stopPropagation to not also trigger the card.
    */
    <View
      style={{
        width: '47.5%',
        flexGrow: 1,
        height: 138,
        borderRadius: radius.lg,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: playing ? color.accent : 'rgba(255,255,255,0.10)',
      }}
    >
      <PressScale
        onPress={onPlay}
        accessibilityRole="button"
        accessibilityLabel={`Play ${mix.name}`}
        style={StyleSheet.absoluteFill}
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={[StyleSheet.absoluteFill, { opacity: panels.length ? 0.35 : 1 }]}
        />

        {/* The panels. A hairline of the ground colour between them, so the
            seams read as a deliberate join rather than as one broken photo. */}
        {panels.length ? (
          <View style={[StyleSheet.absoluteFill, { flexDirection: 'row' }]}>
            {panels.map((p, i) => (
              <View
                key={p.key}
                style={{
                  flex: 1,
                  overflow: 'hidden',
                  borderLeftWidth: i === 0 ? 0 : 1,
                  borderLeftColor: 'rgba(7,10,22,0.55)',
                }}
              >
                <Image
                  source={p.art as number}
                  // Held back further than a single-photo card: three
                  // pictures at once is three times the brightness, and the
                  // name has to stay readable over whatever lands here.
                  style={[StyleSheet.absoluteFill, { width: '100%', height: '100%', opacity: 0.42 }]}
                  resizeMode="cover"
                />
              </View>
            ))}
          </View>
        ) : null}
        <LinearGradient
          colors={['rgba(7,10,22,0.22)', 'rgba(7,10,22,0.58)', 'rgba(7,10,22,0.94)'] as const}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={{ position: 'absolute', left: 14, right: 14, bottom: 13, gap: 3 }}>
          <Text style={[t.card, { color: color.ink, fontSize: 14.5, lineHeight: 18 }]} numberOfLines={2}>
            {mix.name}
          </Text>
          <Text style={[t.meta, { color: color.ink62 }]}>
            {count} {count === 1 ? 'sound' : 'sounds'}
          </Text>
        </View>
      </PressScale>

      {/*
        Editing is a visible button, not a long press: a gesture nobody can
        see is the same as no way to rename a mix at all.
      */}
      <PressScale
        onPress={onEdit}
        hitSlop={6}
        scaleTo={0.88}
        accessibilityRole="button"
        accessibilityLabel={`Edit ${mix.name}`}
        style={{
          position: 'absolute',
          left: 11,
          top: 11,
          width: 34,
          height: 34,
          borderRadius: 17,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(7,10,22,0.38)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.24)',
        }}
      >
        <Icon name="mixer" size={14} color={color.ink} />
      </PressScale>

      <PressScale
        onPress={onPlay}
        hitSlop={8}
        scaleTo={0.88}
        accessibilityRole="button"
        accessibilityLabel={playing ? `Pause ${mix.name}` : `Play ${mix.name}`}
        style={{
          position: 'absolute',
          right: 11,
          top: 11,
          width: 38,
          height: 38,
          borderRadius: 19,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: playing ? color.accent : 'rgba(7,10,22,0.38)',
          borderWidth: 1,
          borderColor: playing ? color.accent : 'rgba(255,255,255,0.24)',
        }}
      >
        <Icon name={playing ? 'pause' : 'play'} size={14} color={playing ? color.onAccent : color.ink} />
      </PressScale>
    </View>
  );
}

export default function Mixes() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const p = usePlayer();
  const { mixes, loaded } = useMixes();

  return (
    <View style={{ flex: 1, backgroundColor: color.ground }}>
      <Aurora
        blobs={[
          { size: 280, color: color.accent, opacity: 0.26, left: -80, top: -70, duration: motion.driftSlow },
          { size: 300, color: color.violet, opacity: 0.24, right: -110, top: 300, dx: -26, dy: 24 },
        ]}
      />

      <View style={{ flex: 1, paddingTop: Math.max(insets.top, safe.top) }}>
        <View
          style={{
            paddingHorizontal: safe.side,
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            minHeight: 44,
          }}
        >
          <Text style={{ fontFamily: font.display, fontSize: 28, color: color.ink, letterSpacing: -0.7 }}>
            My mixes
          </Text>
          {/* Hidden until there is a list to add to — the empty state has its
              own, larger invitation, and two buttons for one action is one
              button too many. */}
          {mixes.length ? (
            <RoundButton label="New mix" onPress={() => router.push('/mix-edit')}>
              <Icon name="plus" size={19} strokeWidth={1.9} />
            </RoundButton>
          ) : null}
        </View>

        <View style={{ height: space.lg }} />

        {!loaded ? (
          // Nothing, briefly. Better than flashing "no mixes yet" at someone
          // who has ten.
          <View style={{ flex: 1 }} />
        ) : mixes.length === 0 ? (
          <View style={{ flex: 1, paddingHorizontal: safe.side, justifyContent: 'center', paddingBottom: TAB_CLEARANCE }}>
            <GlassCard r={radius.lg} style={{ padding: 22, gap: space.md, alignItems: 'center' }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  borderWidth: 1,
                  borderColor: color.glassBorder,
                }}
              >
                <Icon name="mixer" size={24} color={color.ink72} />
              </View>
              <Text style={[t.card, { color: color.ink, fontSize: 17, textAlign: 'center' }]}>
                Build your own sound
              </Text>
              <Text style={[t.body, { color: color.ink62, textAlign: 'center', lineHeight: 21 }]}>
                Layer rain over a fan, or a stream under crickets. Set how loud each one sits, give
                it a name, and it waits here for you.
              </Text>
              <PrimaryButton
                label="Create a mix"
                onPress={() => router.push('/mix-edit')}
                style={{ alignSelf: 'stretch', marginTop: space.xs }}
              />
            </GlassCard>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: safe.side, paddingBottom: TAB_CLEARANCE }}
          >
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {mixes.map((m) => (
                <MixCard
                  key={m.id}
                  mix={m}
                  playing={p.selection.id === m.id && p.playing}
                  onPlay={() => {
                    if (p.selection.id === m.id) p.togglePlay();
                    else p.playMix(m);
                    if (p.selection.id !== m.id) router.push('/player');
                  }}
                  onEdit={() => router.push({ pathname: '/mix-edit', params: { id: m.id } })}
                />
              ))}
            </View>

            <View style={{ height: space.lg }} />

            {/*
              The same action as the header button, kept at the end of the
              list so it is where the thumb already is after scrolling.
            */}
            <PressScale
              onPress={() => router.push('/mix-edit')}
              accessibilityRole="button"
              accessibilityLabel="Create a mix"
              style={{
                minHeight: 56,
                borderRadius: radius.lg,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 9,
                borderWidth: 1.5,
                borderStyle: 'dashed',
                borderColor: 'rgba(255,255,255,0.16)',
              }}
            >
              <Icon name="plus" size={18} color={color.ink72} strokeWidth={1.8} />
              <Text style={{ fontFamily: font.semibold, fontSize: 14, color: color.ink72 }}>
                Create a mix
              </Text>
            </PressScale>
          </ScrollView>
        )}
      </View>
    </View>
  );
}
