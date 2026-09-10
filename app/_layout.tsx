import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Sora_400Regular, Sora_600SemiBold } from '@expo-google-fonts/sora';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import { PlayerProvider } from '../src/state';
import { SoundEngine } from '../src/audio/engine';
import { TinnitusProvider } from '../src/tinnitus';
import { SampleProvider } from '../src/components/SamplePlayer';
import { color } from '../src/theme';

export default function RootLayout() {
  const [loaded] = useFonts({
    Sora_400Regular,
    Sora_600SemiBold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  if (!loaded) {
    return <View style={{ flex: 1, backgroundColor: color.ground }} />;
  }

  return (
    <SafeAreaProvider>
      <PlayerProvider>
        {/* Inside the provider so it can read player state, but rendered
            from here rather than from state.tsx — that import was what made
            state and the engine a require cycle. */}
        <SoundEngine />
        <TinnitusProvider>
        <SampleProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: color.ground },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="index" />
          {/* No fade into onboarding — the flow has its own transition, and
              fading the whole first step in on top of that read as a second,
              competing animation. */}
          <Stack.Screen name="(onboarding)" options={{ animation: 'none' }} />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="player" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="morning" options={{ animation: 'slide_from_bottom' }} />
        </Stack>
        </SampleProvider>
        </TinnitusProvider>
      </PlayerProvider>
    </SafeAreaProvider>
  );
}
