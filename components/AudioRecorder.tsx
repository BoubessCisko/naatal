import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { colors } from '../constants/colors';
import { useNaatalRecorder } from '../hooks/useAudioRecorder';
import { formatTime } from '../lib/formatTime';

type Props = {
  onRecordingComplete: (uri: string, durationMs: number) => void;
  onReset?: () => void;
};

export default function AudioRecorder({ onRecordingComplete, onReset }: Props) {
  const {
    status,
    uri,
    durationMs,
    durationS,
    isRecording,
    isStopping,
    startRecording,
    stopRecording,
    reset,
    maxDurationS,
  } = useNaatalRecorder();

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  useEffect(() => {
    if (status === 'done' && uri) {
      onRecordingComplete(uri, durationMs);
    }
  }, [status, uri]);

  const handleReset = () => {
    reset();
    onReset?.();
  };

  const remaining = maxDurationS - durationS;

  // Stopping state — show loading spinner
  if (isStopping) {
    return (
      <View style={styles.container}>
        <Text style={styles.timer}>
          {formatTime(Math.floor(durationMs / 1000))}
        </Text>
        <View style={styles.button}>
          <ActivityIndicator size="large" color="white" />
        </View>
        <Text style={styles.hint}>Finalisation de l'enregistrement…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Timer */}
      <Text style={styles.timer}>
        {isRecording
          ? formatTime(durationS)
          : status === 'done'
            ? formatTime(Math.floor(durationMs / 1000))
            : formatTime(0)}
      </Text>

      {isRecording && remaining <= 15 && (
        <Text style={styles.remaining}>{remaining}s restantes</Text>
      )}

      {/* Record / Stop button */}
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <Pressable
          onPress={
            isRecording
              ? stopRecording
              : status === 'done'
                ? handleReset
                : startRecording
          }
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: isRecording ? colors.red : colors.green,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          {isRecording ? (
            <View style={styles.stopIcon} />
          ) : (
            <Text style={styles.micIcon}>🎤</Text>
          )}
        </Pressable>
      </Animated.View>

      {/* Hint text */}
      <Text style={styles.hint}>
        {status === 'idle' && 'Appuyez pour enregistrer'}
        {isRecording && 'Appuyez pour arrêter'}
        {status === 'done' && 'Appuyez pour re-enregistrer'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  timer: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  remaining: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: '600',
  },
  button: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  stopIcon: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  micIcon: {
    fontSize: 28,
  },
  hint: {
    color: colors.muted,
    fontSize: 13,
  },
});
