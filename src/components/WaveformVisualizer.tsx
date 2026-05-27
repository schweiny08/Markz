import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

const BAR_COUNT = 20;

interface Props {
  active: boolean;
}

export default function WaveformVisualizer({ active }: Props) {
  const anims = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.15)),
  ).current;

  useEffect(() => {
    if (!active) {
      anims.forEach(a => Animated.timing(a, { toValue: 0.15, duration: 300, useNativeDriver: true }).start());
      return;
    }

    const loops = anims.map((anim, i) => {
      const delay = (i * 60) % 400;
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 0.2 + Math.random() * 0.8,
            duration: 180 + Math.floor(Math.random() * 220),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.1 + Math.random() * 0.4,
            duration: 180 + Math.floor(Math.random() * 220),
            useNativeDriver: true,
          }),
        ]),
      );
    });

    loops.forEach(l => l.start());
    return () => loops.forEach(l => l.stop());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <View style={styles.container}>
      {anims.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              backgroundColor: active ? Colors.waveform : Colors.waveformInactive,
              transform: [{ scaleY: anim }],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    gap: 3,
  },
  bar: {
    width: 4,
    height: 50,
    borderRadius: 2,
  },
});
