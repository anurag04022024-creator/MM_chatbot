import React from 'react';
import { X, Check } from 'lucide-react';
import { formatTime } from '../../lib/utils';

interface VoiceRecordingBarProps {
  duration: number;
  onCancel: () => void;
  onConfirm: () => void;
}

export const VoiceRecordingBar: React.FC<VoiceRecordingBarProps> = ({
  duration,
  onCancel,
  onConfirm,
}) => {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 bg-brand-surface dark:bg-brand-darkSurface rounded-2xl border border-brand-accent/50 animate-slide-up shadow-claude">
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
        <span className="text-xs font-semibold text-rose-500 uppercase tracking-wider">
          Recording Audio
        </span>
        <span className="text-sm font-mono font-medium text-brand-text dark:text-brand-darkText">
          {formatTime(duration)}
        </span>
      </div>

      {/* Live Waveform Visualizer */}
      <div className="flex items-center gap-1 h-6">
        {[18, 24, 14, 30, 20, 28, 12, 22, 16, 26, 32, 14, 20, 16].map((h, i) => (
          <div
            key={i}
            className="w-1 bg-brand-accent rounded-full wave-bar"
            style={{
              height: `${h}px`,
              animationDelay: `${i * 0.08}s`,
            }}
          />
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors"
          title="Cancel recording"
          aria-label="Cancel recording"
        >
          <X size={16} />
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="p-2 rounded-xl bg-brand-accent hover:bg-brand-accentHover text-white shadow-sm transition-colors"
          title="Attach recording"
          aria-label="Attach recording"
        >
          <Check size={16} />
        </button>
      </div>
    </div>
  );
};
