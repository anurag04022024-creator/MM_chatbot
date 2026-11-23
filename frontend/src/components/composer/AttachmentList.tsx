import React, { useState } from 'react';
import { X, Play, Pause, FileText, Music } from 'lucide-react';
import { Attachment } from '../../types/chat';
import { formatFileSize, formatTime } from '../../lib/utils';
import { useChatStore } from '../../store/useChatStore';

interface AttachmentListProps {
  attachments: Attachment[];
  onRemove: (id: string) => void;
}

export const AttachmentList: React.FC<AttachmentListProps> = ({ attachments, onRemove }) => {
  const { setLightboxAttachment } = useChatStore();
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  if (attachments.length === 0) return null;

  const togglePlayAudio = (attachment: Attachment) => {
    if (playingAudioId === attachment.id) {
      audioElement?.pause();
      setPlayingAudioId(null);
    } else {
      audioElement?.pause();
      const audio = new Audio(attachment.url);
      audio.onended = () => setPlayingAudioId(null);
      audio.play().catch(() => {});
      setAudioElement(audio);
      setPlayingAudioId(attachment.id);
    }
  };

  return (
    <div className="flex flex-wrap gap-2.5 p-3 pb-1 border-b border-brand-border/60 dark:border-brand-darkBorder/60">
      {attachments.map((item) => {
        if (item.type === 'image') {
          return (
            <div
              key={item.id}
              className="group relative flex items-center gap-2 p-1.5 bg-stone-50 dark:bg-stone-900 border border-brand-border dark:border-brand-darkBorder rounded-xl max-w-[210px] overflow-hidden transition-all hover:border-brand-accent/50"
            >
              <img
                src={item.thumbnailUrl || item.url}
                alt={item.name}
                onClick={() => setLightboxAttachment(item)}
                className="w-12 h-12 rounded-lg object-cover cursor-pointer shrink-0"
              />
              <div className="flex-1 min-w-0 pr-1">
                <div className="text-xs font-medium text-brand-text dark:text-brand-darkText truncate" title={item.name}>
                  {item.name}
                </div>
                <div className="text-[11px] text-brand-muted dark:text-brand-darkMuted">
                  {formatFileSize(item.size)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="p-1 rounded-full bg-stone-200 hover:bg-rose-100 hover:text-rose-600 dark:bg-stone-800 dark:hover:bg-rose-950 dark:hover:text-rose-400 transition-colors shrink-0"
                aria-label={`Remove ${item.name}`}
              >
                <X size={12} />
              </button>
            </div>
          );
        }

        if (item.type === 'audio') {
          const isPlaying = playingAudioId === item.id;
          return (
            <div
              key={item.id}
              className="flex items-center gap-2.5 px-3 py-2 bg-stone-50 dark:bg-stone-900 border border-brand-border dark:border-brand-darkBorder rounded-xl min-w-[230px] max-w-[280px]"
            >
              <button
                type="button"
                onClick={() => togglePlayAudio(item)}
                className="w-8 h-8 rounded-full bg-brand-accent text-white flex items-center justify-center shrink-0 hover:bg-brand-accentHover transition-colors shadow-sm"
                aria-label={isPlaying ? 'Pause audio preview' : 'Play audio preview'}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-medium text-brand-text dark:text-brand-darkText truncate">
                  <Music size={12} className="text-emerald-500 shrink-0" />
                  <span className="truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-brand-muted dark:text-brand-darkMuted mt-0.5">
                  <span>{formatTime(item.duration || 0)}</span>
                  <span>•</span>
                  <span>{formatFileSize(item.size)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (playingAudioId === item.id) {
                    audioElement?.pause();
                    setPlayingAudioId(null);
                  }
                  onRemove(item.id);
                }}
                className="p-1 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-400 hover:text-rose-500 transition-colors"
                aria-label={`Remove ${item.name}`}
              >
                <X size={14} />
              </button>
            </div>
          );
        }

        // Generic document
        return (
          <div
            key={item.id}
            className="flex items-center gap-2.5 px-3 py-2 bg-stone-50 dark:bg-stone-900 border border-brand-border dark:border-brand-darkBorder rounded-xl max-w-[220px]"
          >
            <FileText size={18} className="text-blue-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-brand-text dark:text-brand-darkText truncate">
                {item.name}
              </div>
              <div className="text-[11px] text-brand-muted dark:text-brand-darkMuted">
                {formatFileSize(item.size)}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="p-1 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-400 hover:text-rose-500 transition-colors"
              aria-label={`Remove ${item.name}`}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
