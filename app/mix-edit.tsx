import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import { Aurora } from '../src/components/Aurora';
import { AddSoundSheet } from '../src/components/AddSoundSheet';
import { GlassCard, PrimaryButton, RoundButton } from '../src/components/Glass';
import { Icon } from '../src/components/Icon';
import { SoundIcon } from '../src/components/SoundIcon';
import { PressScale } from '../src/components/Motion';
import { soundById } from '../src/data/sounds';
import { mixerSoundColors, useLibraryIcons } from '../src/data/mixerSounds';
import { useAdminMixes } from '../src/data/adminMixes';
import { gainFor, SOUND_ASSETS } from '../src/audio/assets';
import { LoopVoice } from '../src/audio/engine';
import { useTrackPlayer } from '../src/audio/tracks';
import { usePlayer } from '../src/state';
import { setAudioModeAsync } from 'expo-audio';
import { MixLayer, useMixes } from '../src/mixes';
import { color, font, motion, radius, safe, space, type as t } from '../src/theme';

/**
 * Building one mix: name it, add sounds from the library, set how loud each
 * one sits, save it.
 *
 * You hear it as you build it. Each sound starts the moment it is added and
 * they all loop together, so the balance is set by ear: a slider or a mute
 * changes what you hear straight away.
 *
 * That preview belongs to this screen alone. It is not the player — it does
 * not show in the mini player or count as listening — and it stops when the
 * screen closes, whether by Save or Cancel. The recipe itself stays local
 * until Save, so cancelling still changes nothing.
 */

const DEFAULT_LAYER_VOLUME = 60;

/** What a layer plays: its streamed sound, or a noise bundled with the app (older mixes). */
const sourceOf = (l: MixLayer) => (l.url ? { uri: l.url } : (SOUND_ASSETS[l.id] ?? null));

/** How a layer is shown. Saved layers carry their own name; older ones fall back to the built-in list. */
function describe(l: MixLayer, iconById: Map<string, string>) {
  const legacy = soundById(l.id);
  return {
    name: l.name ?? legacy?.name ?? 'Sound',
    icon: iconById.get(l.id) ?? l.icon ?? legacy?.icon ?? 'Waves',
    colors: (legacy?.colors as unknown as readonly [string, string] | undefined) ?? mixerSoundColors(l.id),
  };
}

/** Every added sound, looping together, at the volumes on screen. Renders no UI. */
function MixPreview({ layers, playing }: { layers: MixLayer[]; playing: boolean }) {
  const p = usePlayer();
  return (
    <>
      {layers.map((l) => {
        const source = sourceOf(l);
        if (!source) return null;
        return (
          <LoopVoice
            key={l.id}
            source={source}
            // Same master volume and hearing ceiling as the player, so the
            // mix sounds here the way it will sound once saved.
            gain={l.on ? gainFor(p.volume, l.vol) : 0}
            playing={playing}
          />
        );
      })}
    </>
  );
}

export default function MixEdit() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // `id`: edit one of the person's mixes. `from`: start a new one as a copy
  // of a dashboard mix ("Make it yours") — saving never touches the original.
  const { id, from } = useLocalSearchParams<{ id?: string; from?: string }>();
  const { byId, save, remove } = useMixes();
  const iconById = useLibraryIcons();
  const { mixes: appMixes } = useAdminMixes();

  const existing = id ? byId(id) : undefined;
  const source = from ? appMixes.find((m) => m.id === from) : undefined;

  const [name, setName] = useState(existing?.name ?? source?.name ?? '');
  const [layers, setLayers] = useState<MixLayer[]>(existing?.layers ?? source?.layers ?? []);

  // Opened before the dashboard mixes had loaded (a reload, a link): fill in
  // the copy once they arrive, unless the person has already started.
  useEffect(() => {
    if (!source || existing) return;
    setName((n) => n || source.name);
    setLayers((ls) => (ls.length ? ls : source.layers));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source?.id]);
  const [picking, setPicking] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const canSave = name.trim().length > 0 && layers.length > 0;

  // Back to wherever the editor was opened from — or the Mix tab when it was
  // reached directly (a reload on web, a link), where there is nothing to go back to.
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/mix'));

  /*
    The preview: on by default, so adding a sound is hearing it. The pause
    button silences everything at once without losing the sounds.
  */
  const [listening, setListening] = useState(true);
  // While a sound is being tried in the picker the mix steps back, so the
  // candidate is heard on its own; it comes back when the preview stops.
  const [auditioning, setAuditioning] = useState(false);
  const audible = listening && !auditioning && layers.some((l) => sourceOf(l) != null);
  const p = usePlayer();
  const tp = useTrackPlayer();

  // Starting the preview takes the speaker: whatever was playing pauses, so
  // only the mix being built is heard.
  useEffect(() => {
    if (!audible) return;
    if (p.playing) p.togglePlay();
    if (tp.playing) tp.toggle();
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: false, interruptionMode: 'doNotMix' }).catch(
      () => {},
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audible]);

  const setVol = (sid: string, vol: number) =>
    setLayers((ls) => ls.map((l) => (l.id === sid ? { ...l, vol } : l)));
  const toggle = (sid: string) =>
    setLayers((ls) => ls.map((l) => (l.id === sid ? { ...l, on: !l.on } : l)));
  const drop = (sid: string) => setLayers((ls) => ls.filter((l) => l.id !== sid));

  return (
    // Clipped: the aurora drifts past the edges, which made the page scroll sideways on web.
    <View style={{ flex: 1, backgroundColor: color.ground, overflow: 'hidden' }}>
      <Aurora
        blobs={[
          { size: 300, color: color.accent, opacity: 0.24, left: -90, top: -60, duration: motion.driftSlow },
          { size: 280, color: color.violet, opacity: 0.24, right: -100, bottom: -60, dx: -24, dy: 26 },
        ]}
      />

      <View
        style={{
          flex: 1,
          paddingTop: Math.max(insets.top, safe.top),
          paddingHorizontal: safe.side,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
          <RoundButton label="Cancel" onPress={() => leave()}>
            <Icon name="close" size={18} strokeWidth={1.8} />
          </RoundButton>
          <Text style={[t.label, { color: color.ink58 }]}>
            {existing ? 'Edit mix' : source ? 'Make it yours' : 'New mix'}
          </Text>
          {layers.length ? (
            <RoundButton
              label={listening ? 'Pause preview' : 'Play preview'}
              onPress={() => setListening((v) => !v)}
              style={listening ? { borderColor: color.accent } : undefined}
            >
              <Icon name={listening ? 'pause' : 'play'} size={16} color={listening ? color.accent : color.ink} />
            </RoundButton>
          ) : (
            <View style={{ width: 44 }} />
          )}
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingTop: space.lg, paddingBottom: 24, gap: space.xl }}
          >
            <View style={{ gap: space.sm }}>
              <Text style={[t.label, { color: color.ink58 }]}>Name</Text>
              <GlassCard
                r={radius.md}
                style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}
              >
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Rain and a fan"
                  placeholderTextColor={color.ink58}
                  maxLength={40}
                  accessibilityLabel="Mix name"
                  style={{
                    flex: 1,
                    alignSelf: 'stretch',
                    fontFamily: t.body.fontFamily,
                    fontSize: 14.5,
                    color: color.ink,
                    // Static inputs paint under the card's blur, which frosts
                    // the text and eats the taps. Positioning lifts it above.
                    position: 'relative',
                    outlineStyle: 'none',
                  } as never}
                />
              </GlassCard>
            </View>

            <View style={{ gap: space.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <Text style={[t.label, { color: color.ink58 }]}>Sounds</Text>
                <Text style={[t.meta, { color: color.ink58 }]}>
                  {layers.length ? `${layers.length} added` : 'None yet'}
                </Text>
              </View>

              {layers.map((l) => {
                const s = describe(l, iconById);
                const silent = sourceOf(l) == null;
                return (
                  <GlassCard key={l.id} style={{ padding: 14, opacity: l.on ? 1 : 0.52 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 }}>
                      <LinearGradient
                        colors={s.colors}
                        start={{ x: 0.1, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ width: 34, height: 34, borderRadius: radius.xs, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <SoundIcon name={s.icon} size={17} color="rgba(255,255,255,0.85)" />
                      </LinearGradient>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[t.card, { color: color.ink }]} numberOfLines={1}>{s.name}</Text>
                        <Text style={[t.meta, { color: silent ? color.scaleMid : color.ink58 }]} numberOfLines={1}>
                          {silent ? 'No audio — remove and pick another' : !l.on ? 'Muted' : audible ? 'Playing' : 'Paused'}
                        </Text>
                      </View>
                      <PressScale
                        onPress={() => toggle(l.id)}
                        accessibilityRole="button"
                        accessibilityLabel={l.on ? `Mute ${s.name}` : `Unmute ${s.name}`}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: radius.sm,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: l.on ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.035)',
                        }}
                      >
                        <Icon
                          name={l.on ? 'volumeLow' : 'volumeOff'}
                          size={19}
                          color={l.on ? s.colors[0] : color.ink58}
                        />
                      </PressScale>
                      <PressScale
                        onPress={() => drop(l.id)}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${s.name}`}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: radius.sm,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon name="close" size={16} color={color.ink58} strokeWidth={1.8} />
                      </PressScale>
                    </View>
                    <Slider
                      style={{ width: '100%', height: 34 }}
                      accessibilityLabel={`${s.name} volume`}
                      minimumValue={0}
                      maximumValue={100}
                      step={1}
                      value={l.vol}
                      onValueChange={(v) => setVol(l.id, Math.round(v))}
                      minimumTrackTintColor={s.colors[0]}
                      maximumTrackTintColor="rgba(255,255,255,0.14)"
                      thumbTintColor={color.ink}
                    />
                  </GlassCard>
                );
              })}

              <PressScale
                onPress={() => setPicking(true)}
                accessibilityRole="button"
                accessibilityLabel="Add a sound"
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
                  Add a sound
                </Text>
              </PressScale>
            </View>

            <View style={{ gap: space.sm }}>
              <PrimaryButton
                label={existing ? 'Save changes' : 'Save mix'}
                disabled={!canSave}
                onPress={() => {
                  save({ id: existing?.id, name, layers });
                  leave();
                }}
              />
              {/* Says which of the two things is missing, rather than leaving
                  a dead grey button to be puzzled over. */}
              {!canSave ? (
                <Text style={[t.meta, { color: color.ink58, textAlign: 'center' }]}>
                  {layers.length === 0 ? 'Add at least one sound' : 'Give your mix a name'}
                </Text>
              ) : null}
            </View>

            {existing ? (
              <PressScale
                onPress={() => {
                  if (!confirmDelete) {
                    setConfirmDelete(true);
                    return;
                  }
                  remove(existing.id);
                  leave();
                }}
                accessibilityRole="button"
                accessibilityLabel={confirmDelete ? 'Tap again to delete this mix' : 'Delete this mix'}
                style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ fontFamily: t.body.fontFamily, fontSize: 13.5, color: color.scaleBad }}>
                  {confirmDelete ? 'Tap again to delete' : 'Delete this mix'}
                </Text>
              </PressScale>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      <MixPreview layers={layers} playing={audible} />

      <AddSoundSheet
        visible={picking}
        inMix={layers.map((l) => l.id)}
        onAdd={(sound) => {
          // Adding is a request to hear it, even if the preview was paused.
          setListening(true);
          setLayers((ls) =>
            ls.some((l) => l.id === sound.id)
              ? ls
              : [
                  ...ls,
                  { id: sound.id, vol: DEFAULT_LAYER_VOLUME, on: true, name: sound.title, url: sound.url, icon: sound.icon },
                ],
          );
        }}
        onClose={() => setPicking(false)}
        onPreviewChange={setAuditioning}
      />
    </View>
  );
}
