import React from 'react';
import { Animated, View } from 'react-native';
import { color } from '../theme';
import { useToggleValue } from './Motion';

/** One segment, filling from the left as it becomes complete. */
function Segment({ done }: { done: boolean }) {
  const v = useToggleValue(done, 360);

  return (
    <View
      style={{
        flex: 1,
        height: 4,
        borderRadius: 999,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.12)',
      }}
    >
      <Animated.View
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 999,
          backgroundColor: color.accent,
          opacity: v,
          transform: [
            // Grows out of the left edge rather than fading in place.
            { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] }) },
          ],
        }}
      />
    </View>
  );
}

/** Three-step onboarding progress. Thin, quiet, no numbers. */
export function Progress({ step, total = 3 }: { step: number; total?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, height: 4 }}>
      {Array.from({ length: total }).map((_, i) => (
        <Segment key={i} done={i < step} />
      ))}
    </View>
  );
}
