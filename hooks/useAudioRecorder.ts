import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useAudioRecorder as useExpoRecorder,
  RecordingPresets,
  AudioModule,
  useAudioRecorderState,
} from 'expo-audio';

const MAX_DURATION_S = 120;

// Use .mp4 instead of .m4a — Expo Go on Android creates unreadable .m4a files.
// Same AAC codec, just different container extension.
const RECORDING_OPTIONS = {
  ...RecordingPresets.HIGH_QUALITY,
  extension: '.m4a',
};

export type RecorderStatus = 'idle' | 'recording' | 'stopping' | 'done';

export function useNaatalRecorder() {
  const recorder = useExpoRecorder(RECORDING_OPTIONS);
  const state = useAudioRecorderState(recorder);
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [uri, setUri] = useState<string | null>(null);
  const [durationMs, setDurationMs] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const stoppingRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const requestPermission = useCallback(async () => {
    const res = await AudioModule.requestRecordingPermissionsAsync();
    setPermissionGranted(res.granted);
    return res.granted;
  }, []);

  const startRecording = useCallback(async () => {
    if (!permissionGranted) {
      const granted = await requestPermission();
      if (!granted) return;
    }
    stoppingRef.current = false;
    setUri(null);
    setDurationMs(0);
    await AudioModule.setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
    });
    await recorder.prepareToRecordAsync();
    recorder.record();
    startTimeRef.current = Date.now();
    setStatus('recording');

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      setDurationMs(elapsed);
    }, 200);
  }, [permissionGranted, recorder, requestPermission]);

  const stopRecording = useCallback(async () => {
    if (stoppingRef.current) return;
    stoppingRef.current = true;
    clearTimer();
    setStatus('stopping');
    const finalDuration = Date.now() - startTimeRef.current;
    setDurationMs(finalDuration);
    try {
      await recorder.stop();
    } catch {}
    await new Promise((r) => setTimeout(r, 2000));
    const finalUri = recorder.uri;
    setUri(finalUri);
    setStatus(finalUri ? 'done' : 'idle');
    stoppingRef.current = false;
  }, [recorder, clearTimer]);

  // Auto-stop at MAX_DURATION_S
  useEffect(() => {
    if (status === 'recording' && durationMs >= MAX_DURATION_S * 1000) {
      stopRecording();
    }
  }, [status, durationMs, stopRecording]);

  const reset = useCallback(() => {
    clearTimer();
    stoppingRef.current = false;
    setUri(null);
    setDurationMs(0);
    setStatus('idle');
  }, [clearTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer();
      if (state.isRecording) {
        recorder.stop().catch(() => {});
      }
    };
  }, []);

  return {
    status,
    uri,
    durationMs,
    durationS: Math.floor(durationMs / 1000),
    permissionGranted,
    isRecording: status === 'recording',
    isStopping: status === 'stopping',
    requestPermission,
    startRecording,
    stopRecording,
    reset,
    maxDurationS: MAX_DURATION_S,
  };
}
