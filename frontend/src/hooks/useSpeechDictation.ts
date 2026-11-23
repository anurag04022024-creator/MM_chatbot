import { useState, useRef, useCallback } from 'react';
import { isSpeechRecognitionSupported, createSpeechRecognition } from '../lib/speech';

interface UseSpeechDictationProps {
  onTranscript: (text: string) => void;
  onError?: (error: string) => void;
}

export function useSpeechDictation({ onTranscript, onError }: UseSpeechDictationProps) {
  const [isDictating, setIsDictating] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startDictation = useCallback(() => {
    if (!isSpeechRecognitionSupported()) {
      onError?.('Web Speech API is not supported in this browser.');
      return;
    }

    try {
      const recognition = createSpeechRecognition(
        (transcript) => {
          onTranscript(transcript);
        },
        (error) => {
          setIsDictating(false);
          onError?.(error);
        },
        () => {
          setIsDictating(false);
        }
      );

      if (recognition) {
        recognitionRef.current = recognition;
        recognition.start();
        setIsDictating(true);
      }
    } catch (err: any) {
      setIsDictating(false);
      onError?.(err.message || 'Failed to start speech dictation');
    }
  }, [onTranscript, onError]);

  const stopDictation = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsDictating(false);
  }, []);

  const toggleDictation = useCallback(() => {
    if (isDictating) {
      stopDictation();
    } else {
      startDictation();
    }
  }, [isDictating, startDictation, stopDictation]);

  return {
    isDictating,
    isSupported: isSpeechRecognitionSupported(),
    startDictation,
    stopDictation,
    toggleDictation,
  };
}
