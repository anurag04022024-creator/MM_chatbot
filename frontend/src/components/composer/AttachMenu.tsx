import React, { useRef, useEffect } from 'react';
import { Image, AudioLines, Paperclip, Camera, HardDrive } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';

interface AttachMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: () => void;
  onSelectAudio: () => void;
  onSelectDoc: () => void;
  onTakePhoto: () => void;
}

export const AttachMenu: React.FC<AttachMenuProps> = ({
  isOpen,
  onClose,
  onSelectImage,
  onSelectAudio,
  onSelectDoc,
  onTakePhoto,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const { addToast } = useChatStore();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute bottom-full left-0 mb-2 w-64 bg-brand-surface dark:bg-brand-darkSurface border border-brand-border dark:border-brand-darkBorder rounded-2xl shadow-claude-lg p-1.5 z-40 animate-slide-up"
    >
      <button
        onClick={() => {
          onSelectImage();
          onClose();
        }}
        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-brand-text dark:text-brand-darkText hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors"
      >
        <Image size={18} strokeWidth={1.75} className="text-brand-accent" />
        <div className="text-left">
          <div className="font-medium">Upload image or photo</div>
          <div className="text-xs text-brand-muted dark:text-brand-darkMuted">PNG, JPG, WEBP, GIF (up to 10)</div>
        </div>
      </button>

      <button
        onClick={() => {
          onSelectAudio();
          onClose();
        }}
        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-brand-text dark:text-brand-darkText hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors"
      >
        <AudioLines size={18} strokeWidth={1.75} className="text-emerald-500" />
        <div className="text-left">
          <div className="font-medium">Upload audio file</div>
          <div className="text-xs text-brand-muted dark:text-brand-darkMuted">MP3, WAV, M4A, OGG</div>
        </div>
      </button>

      <button
        onClick={() => {
          onSelectDoc();
          onClose();
        }}
        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-brand-text dark:text-brand-darkText hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors"
      >
        <Paperclip size={18} strokeWidth={1.75} className="text-blue-500" />
        <div className="text-left">
          <div className="font-medium">Upload document</div>
          <div className="text-xs text-brand-muted dark:text-brand-darkMuted">PDF, TXT, DOCX</div>
        </div>
      </button>

      <button
        onClick={() => {
          onTakePhoto();
          onClose();
        }}
        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-brand-text dark:text-brand-darkText hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors"
      >
        <Camera size={18} strokeWidth={1.75} className="text-amber-500" />
        <div className="text-left">
          <div className="font-medium">Take a photo</div>
          <div className="text-xs text-brand-muted dark:text-brand-darkMuted">Use device camera</div>
        </div>
      </button>

      <div className="h-px bg-brand-border dark:bg-brand-darkBorder my-1" />

      <button
        onClick={() => {
          addToast('Google Drive integration coming soon', 'info');
          onClose();
        }}
        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-brand-muted dark:text-brand-darkMuted hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors"
      >
        <HardDrive size={18} strokeWidth={1.75} />
        <div className="text-left">
          <div className="font-medium">Add from Google Drive</div>
          <div className="text-xs text-stone-400">Cloud documents & sheets</div>
        </div>
      </button>
    </div>
  );
};
