import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Volume2, Sparkles } from 'lucide-react';
import { isSpeechRecognitionSupported, createSpeechRecognition } from '../../lib/speech';
import { useChatStore } from '../../store/useChatStore';

interface VoiceModeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceModeModal: React.FC<VoiceModeModalProps> = ({ isOpen, onClose }) => {
  const { sendMessage, isStreaming, currentStreamingText } = useChatStore();
  const [state, setState] = useState<'listening' | 'thinking' | 'speaking'>('listening');
  const [liveTranscript, setLiveTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      startListening();
    } else {
      stopListening();
      window.speechSynthesis?.cancel();
    }
    return () => {
      stopListening();
      window.speechSynthesis?.cancel();
    };
  }, [isOpen]);

  // Synchronize state with streaming
  useEffect(() => {
    if (isStreaming) {
      setState('thinking');
    }
  }, [isStreaming]);

  const startListening = () => {
    if (!isSpeechRecognitionSupported()) return;
    setState('listening');
    setLiveTranscript('');

    try {
      const recognition = createSpeechRecognition(
        (transcript) => {
          setLiveTranscript(transcript);
        },
        () => {},
        () => {
          // If we have text when user paused speaking, automatically send
          if (liveTranscript.trim()) {
            handleUserSpoke(liveTranscript.trim());
          }
        }
      );
      if (recognition) {
        recognitionRef.current = recognition;
        recognition.start();
      }
    } catch {}
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };

  const handleUserSpoke = async (text: string) => {
    stopListening();
    setState('thinking');
    await sendMessage(text);

    // Speak response
    const reply = currentStreamingText || 'I have completed your request.';
    speakText(reply);
  };

  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setState('listening');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 300));
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onstart = () => setState('speaking');
    utterance.onend = () => {
      setState('listening');
      startListening();
    };
    utterance.onerror = () => {
      setState('listening');
      startListening();
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleInterrupt = () => {
    window.speechSynthesis?.cancel();
    startListening();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-8 bg-[#181816] text-[#ECEBE6] animate-fade-in select-none">
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-brand-accent" />
          <span className="font-serif font-medium text-lg">NOVA Voice Mode</span>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label="Exit voice mode"
        >
          <X size={20} />
        </button>
      </div>

      {/* Center Animated Pulsating Orb */}
      <div className="flex flex-col items-center justify-center my-auto relative">
        <div
          className={`w-48 h-48 rounded-full flex items-center justify-center transition-all duration-700 relative ${
            state === 'listening'
              ? 'bg-gradient-to-tr from-brand-accent via-amber-600 to-rose-500 shadow-[0_0_80px_rgba(217,119,87,0.4)] animate-pulse'
              : state === 'thinking'
              ? 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 shadow-[0_0_80px_rgba(139,92,246,0.4)] animate-spin'
              : 'bg-gradient-to-tr from-emerald-500 via-teal-500 to-brand-accent shadow-[0_0_90px_rgba(16,185,129,0.5)] scale-110'
          }`}
        >
          <div className="w-40 h-40 rounded-full bg-[#181816]/70 backdrop-blur-md flex items-center justify-center">
            {state === 'listening' && <Mic size={36} className="text-brand-accent animate-bounce" />}
            {state === 'thinking' && <Sparkles size={36} className="text-purple-400" />}
            {state === 'speaking' && <Volume2 size={36} className="text-emerald-400" />}
          </div>
        </div>

        {/* State Label */}
        <div className="mt-8 text-center">
          <div className="text-sm font-semibold uppercase tracking-widest text-stone-400">
            {state === 'listening' ? 'Listening...' : state === 'thinking' ? 'Thinking...' : 'NOVA is Speaking'}
          </div>
          {liveTranscript && (
            <p className="mt-3 text-base font-serif text-stone-200 max-w-md italic">
              "{liveTranscript}"
            </p>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center gap-4">
        {state === 'speaking' ? (
          <button
            onClick={handleInterrupt}
            className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm shadow-claude transition-all"
          >
            Interrupt & Speak
          </button>
        ) : (
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-all"
          >
            End Conversation
          </button>
        )}
      </div>
    </div>
  );
};
