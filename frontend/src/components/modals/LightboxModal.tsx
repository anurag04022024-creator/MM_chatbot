import React from 'react';
import { X, Download } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';

export const LightboxModal: React.FC = () => {
  const { lightboxAttachment, setLightboxAttachment } = useChatStore();

  if (!lightboxAttachment) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={() => setLightboxAttachment(null)}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Action Bar */}
        <div className="w-full flex items-center justify-between pb-3 text-white">
          <span className="text-sm font-medium truncate max-w-md">
            {lightboxAttachment.name}
          </span>
          <div className="flex items-center gap-2">
            <a
              href={lightboxAttachment.url}
              download={lightboxAttachment.name}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Download full size"
            >
              <Download size={18} />
            </a>
            <button
              onClick={() => setLightboxAttachment(null)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Close image lightbox"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Full Image */}
        <img
          src={lightboxAttachment.url}
          alt={lightboxAttachment.name}
          className="max-h-[80vh] w-auto rounded-2xl object-contain shadow-2xl border border-white/10"
        />
      </div>
    </div>
  );
};
