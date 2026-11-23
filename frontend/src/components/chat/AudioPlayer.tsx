import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, RotateCcw } from 'lucide-react';
import { formatTime } from '../../lib/utils';
import { Attachment } from '../../types/chat';

interface AudioPlayerProps {
  attachment: Attachment;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ attachment }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(attachment.duration || 0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity) {
        setDuration(audio.duration);
      }
    };
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const cyclePlaybackRate = () => {
    const rates = [1, 1.25, 1.5, 2];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const waveform = attachment.waveformData || [30, 45, 20, 60, 40, 75, 50, 65, 35, 80, 55, 70, 40, 50, 60, 30];

  return (
    <div className="flex flex-col gap-2 p-3 bg-stone-50 dark:bg-stone-900/80 border border-brand-border dark:border-brand-darkBorder rounded-2xl max-w-sm my-2 shadow-sm">
      <audio ref={audioRef} src={attachment.url} preload="metadata" />

      <div className="flex items-center justify-between gap-3">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          className="w-9 h-9 rounded-full bg-brand-accent hover:bg-brand-accentHover text-white flex items-center justify-center shrink-0 transition-colors shadow-sm"
          aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
        </button>

        {/* Mini Waveform & Title */}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-brand-text dark:text-brand-darkText truncate mb-1">
            {attachment.name}
          </div>
          {/* Waveform graphic */}
          <div className="flex items-center gap-0.5 h-5">
            {waveform.map((h, idx) => {
              const progressRatio = duration > 0 ? currentTime / duration : 0;
              const barRatio = idx / waveform.length;
              const isActive = barRatio <= progressRatio;
              return (
                <div
                  key={idx}
                  className={`w-1 rounded-full transition-colors ${
                    isActive ? 'bg-brand-accent' : 'bg-stone-300 dark:bg-stone-700'
                  }`}
                  style={{ height: `${Math.max(4, (h / 100) * 20)}px` }}
                />
              );
            })}
          </div>
        </div>

        {/* Speed toggle */}
        <button
          onClick={cyclePlaybackRate}
          className="px-2 py-1 text-xs font-semibold rounded-lg bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300 transition-colors"
          title="Playback speed"
        >
          {playbackRate}x
        </button>
      </div>

      {/* Scrubber & Duration */}
      <div className="flex items-center gap-2 pt-1 text-[11px] text-brand-muted dark:text-brand-darkMuted font-mono">
        <span>{formatTime(currentTime)}</span>
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="flex-1 h-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-brand-accent"
          aria-label="Seek audio"
        />
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
};
