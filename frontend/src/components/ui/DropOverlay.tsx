import React from 'react';
import { UploadCloud } from 'lucide-react';

interface DropOverlayProps {
  isDragging: boolean;
}

export const DropOverlay: React.FC<DropOverlayProps> = ({ isDragging }) => {
  if (!isDragging) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-bg/85 dark:bg-brand-darkBg/85 backdrop-blur-sm pointer-events-none transition-all">
      <div className="flex flex-col items-center justify-center p-8 bg-brand-surface dark:bg-brand-darkSurface border-2 border-dashed border-brand-accent rounded-3xl shadow-claude-lg max-w-md text-center animate-slide-up">
        <div className="w-16 h-16 rounded-2xl bg-brand-accentSoft dark:bg-brand-darkAccentSoft flex items-center justify-center text-brand-accent mb-4">
          <UploadCloud size={32} strokeWidth={1.75} />
        </div>
        <h3 className="font-serif text-2xl font-normal text-brand-text dark:text-brand-darkText mb-1">
          Drop files to attach
        </h3>
        <p className="text-sm text-brand-muted dark:text-brand-darkMuted">
          Images (PNG, JPG, WEBP, GIF), audio notes (MP3, WAV, M4A), and documents up to 25 MB
        </p>
      </div>
    </div>
  );
};
