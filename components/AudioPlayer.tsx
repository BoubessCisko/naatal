import { useEffect, useRef, useMemo } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { colors } from '../constants/colors';
import { formatTime } from '../lib/formatTime';

type Props = {
  uri: string;
  durationMs?: number;
};

const BAR_COUNT = 28;

export default function AudioPlayer({ uri, durationMs }: Props) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);

  const duration = status.duration > 0 ? status.duration : (durationMs ?? 0) / 1000;
  const progress = duration > 0 ? status.currentTime / duration : 0;

  // Deterministic pseudo-random bar heights based on URI
  const barHeights = useMemo(() => {
    let seed = 0;
    for (let i = 0; i < uri.length; i++) seed = (seed * 31 + uri.charCodeAt(i)) | 0;
    return Array.from({ length: BAR_COUNT }, (_, i) => {
      seed = (seed * 16807 + i) % 2147483647;
      return 0.25 + (Math.abs(seed) % 75) / 100;
    });
  }, [uri]);

  // Animated bars
  const barAnims = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.3))
  ).current;

  useEffect(() => {
    barAnims.forEach((anim, i) => {
      const filledIndex = Math.floor(progress * BAR_COUNT);
      Animated.timing(anim, {
        toValue: i <= filledIndex ? barHeights[i] : 0.3,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  }, [progress]);

  const togglePlay = () => {
    if (status.playing) {
      player.pause();
    } else {
      if (status.currentTime >= duration - 0.5) {
        player.seekTo(0);
      }
      player.play();
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={togglePlay}
        style={({ pressed }) => [
          styles.playButton,
          { opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <Text style={styles.playIcon}>{status.playing ? '⏸' : '▶️'}</Text>
      </Pressable>

      {/* Waveform bars */}
      <View style={styles.waveContainer}>
        {barAnims.map((anim, i) => {
          const filledIndex = Math.floor(progress * BAR_COUNT);
          return (
            <Animated.View
              key={i}
              style={[
                styles.bar,
                {
                  backgroundColor: i <= filledIndex ? colors.green : colors.surface2,
                  transform: [{ scaleY: anim }],
                },
              ]}
            />
          );
        })}
      </View>

      {/* Time */}
      <Text style={styles.time}>
        {formatTime(status.playing ? status.currentTime : duration)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 14,
  },
  waveContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    gap: 2,
  },
  bar: {
    flex: 1,
    height: '100%',
    borderRadius: 2,
  },
  time: {
    color: colors.muted,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    minWidth: 36,
    textAlign: 'right',
  },
});
