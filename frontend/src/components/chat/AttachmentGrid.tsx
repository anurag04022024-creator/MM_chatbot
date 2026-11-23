import React from 'react';
import { FileText } from 'lucide-react';
import { Attachment } from '../../types/chat';
import { AudioPlayer } from './AudioPlayer';
import { useChatStore } from '../../store/useChatStore';
import { formatFileSize } from '../../lib/utils';

interface AttachmentGridProps {
  attachments?: Attachment[];
}

export const AttachmentGrid: React.FC<AttachmentGridProps> = ({ attachments }) => {
  const { setLightboxAttachment } = useChatStore();

  if (!attachments || attachments.length === 0) return null;

  const images = attachments.filter((a) => a.type === 'image');
  const audios = attachments.filter((a) => a.type === 'audio');
  const docs = attachments.filter((a) => a.type === 'document');

  return (
    <div className="flex flex-col gap-2 my-2">
      {/* Image Grid */}
      {images.length > 0 && (
        <div
          className={`grid gap-2 ${
            images.length === 1
              ? 'grid-cols-1 max-w-sm'
              : images.length === 2
              ? 'grid-cols-2 max-w-md'
              : 'grid-cols-2 md:grid-cols-3 max-w-lg'
          }`}
        >
          {images.map((img) => (
            <div
              key={img.id}
              onClick={() => setLightboxAttachment(img)}
              className="relative group rounded-2xl overflow-hidden border border-brand-border dark:border-brand-darkBorder bg-stone-100 dark:bg-stone-900 cursor-pointer shadow-sm hover:opacity-95 transition-all aspect-video max-h-48"
            >
              <img
                src={img.url}
                alt={img.name}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                <span className="text-white text-xs truncate font-medium">{img.name}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Audio Players */}
      {audios.map((audio) => (
        <AudioPlayer key={audio.id} attachment={audio} />
      ))}

      {/* Document Chips */}
      {docs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-2 px-3 py-2 bg-stone-100 dark:bg-stone-900 border border-brand-border dark:border-brand-darkBorder rounded-xl text-xs"
            >
              <FileText size={16} className="text-blue-500 shrink-0" />
              <div className="truncate max-w-[180px] font-medium text-brand-text dark:text-brand-darkText">
                {doc.name}
              </div>
              <span className="text-brand-muted dark:text-brand-darkMuted text-[11px]">
                {formatFileSize(doc.size)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
