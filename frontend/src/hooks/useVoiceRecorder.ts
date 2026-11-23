import { useState, useRef, useCallback } from 'react';
import { VoiceRecorder, VoiceRecordingResult } from '../lib/audio';

interface UseVoiceRecorderProps {
  onRecordingComplete: (result: VoiceRecordingResult) => void;
  onError?: (err: Error) => void;
}

export function useVoiceRecorder({ onRecordingComplete, onError }: UseVoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recorderRef = useRef<VoiceRecorder | null>(null);
  const timerRef = useRef<number | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const recorder = new VoiceRecorder();
      recorderRef.current = recorder;
      await recorder.start();

      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = window.setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      setIsRecording(false);
      onError?.(err);
    }
  }, [onError]);

  const confirmRecording = useCallback(async () => {
    if (!recorderRef.current) return;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      const result = await recorderRef.current.stop();
      setIsRecording(false);
      setRecordingDuration(0);
      onRecordingComplete(result);
    } catch (err: any) {
      setIsRecording(false);
      onError?.(err);
    }
  }, [onRecordingComplete, onError]);

  const cancelRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recorderRef.current) {
      recorderRef.current.cancel();
    }
    setIsRecording(false);
    setRecordingDuration(0);
  }, []);

  return {
    isRecording,
    recordingDuration,
    startRecording,
    confirmRecording,
    cancelRecording,
  };
}
