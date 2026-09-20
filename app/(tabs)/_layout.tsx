import React from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconName } from '../../src/components/Icon';
import { useToggleValue } from '../../src/components/Motion';
import { color, radius, safe, type as t } from '../../src/theme';

const ITEMS: Array<{ name: string; label: string; icon: IconName }> = [
  // "Home" rather than "Tonight": tinnitus is not only a night problem, and
  // this tab is where the personalised profile lives, not just a bedtime list.
  { name: 'tonight', label: 'Home', icon: 'home' },
  { name: 'sounds', label: 'Sounds', icon: 'waves' },
  { name: 'mix', label: 'Mix', icon: 'mixer' },
  // Night mode used to sit here. It is one screen you open for one night,
  // not a place you navigate to — it lives at /sleep now, opened from
  // Account. The fourth tab is the one thing every app needs a home for:
  // the person's own profile, plan and settings.
  { name: 'account', label: 'Account', icon: 'user' },
];

type TabBarProps = {
  state: { index: number; routes: Array<{ key: string; name: string }> };
  navigation: {
    emit: (e: { type: 'tabPress'; target: string; canPreventDefault: boolean }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
};

/** The selected pill grows into place and the icon lifts a little. */
function TabItem({
  item,
  focused,
  onPress,
}: {
  item: { name: string; label: string; icon: IconName };
  focused: boolean;
  onPress: () => void;
}) {
  const v = useToggleValue(focused, 260);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel={item.label}
      // Which tab you are on is carried by colour alone otherwise.
      accessibilityState={{ selected: focused }}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        borderRadius: radius.sm,
      }}
    >
      <Animated.View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          borderRadius: radius.sm,
          backgroundColor: 'rgba(255,255,255,0.07)',
          opacity: v,
          transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] }) }],
        }}
      />
      <Animated.View
        style={{
          transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [2, 0] }) }],
        }}
      >
        <Icon name={item.icon} size={20} color={focused ? color.accent : color.ink58} />
      </Animated.View>
      <Text style={[t.tab, { color: focused ? color.accent : color.ink58 }]}>{item.label}</Text>
    </Pressable>
  );
}

/** Floating glass tab bar — 64px, 34px off the bottom, matching the design. */
function GlassTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <>
      {/*
        A scrim across the whole width behind the bar, not just a shadow
        around it. Content scrolls underneath here, and a shadow only darkens
        the inch immediately around the bar — anything bright arriving beside
        it still competed. This fades the bottom of the screen out so the bar
        always has something quiet to sit on, whatever is passing behind.
      */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(2,4,10,0)', 'rgba(2,4,10,0.5)', 'rgba(2,4,10,0.82)']}
        locations={[0, 0.45, 1]}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: Math.max(insets.bottom, safe.bottom) + 64 + 76,
        }}
      />

      {/*
        Two layers on purpose. The outer one carries a wide, dark shadow and
        cannot clip it; the inner one clips the blur and fill to the rounded
        shape. The shadow seats the bar against the scrim, and the darker
        fill keeps the labels readable over bright artwork.
      */}
      <View
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: Math.max(insets.bottom, safe.bottom),
          height: 64,
          borderRadius: radius.md,
          boxShadow: '0px 10px 34px rgba(2,4,10,0.72)',
        }}
      >
      <View
        style={{
          flex: 1,
          borderRadius: radius.md,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.13)',
        }}
      >
      <BlurView
        intensity={55}
        tint="dark"
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(10,13,28,0.88)' }]} />
      <View style={{ flex: 1, flexDirection: 'row', padding: 6, gap: 4 }}>
        {ITEMS.map((item, i) => (
          <TabItem
            key={item.name}
            item={item}
            focused={state.index === i}
            onPress={() => {
              const route = state.routes[i];
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (state.index !== i && !event.defaultPrevented) navigation.navigate(route.name);
            }}
          />
        ))}
      </View>
      </View>
      </View>
    </>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...(props as unknown as TabBarProps)} />}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        sceneStyle: { backgroundColor: color.ground },
      }}
    >
      <Tabs.Screen name="tonight" />
      <Tabs.Screen name="sounds" />
      <Tabs.Screen name="mix" />
      <Tabs.Screen name="account" />
    </Tabs>
  );
}
