import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Music, FileText, Download, Trash2, Search, X } from 'lucide-react';
import { db, LibraryItem } from '../../lib/db';
import { useChatStore } from '../../store/useChatStore';

interface LibraryViewProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({ isOpen, onClose }) => {
  const { setLightboxAttachment, addToast } = useChatStore();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'image' | 'audio' | 'document'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadItems();
    }
  }, [isOpen]);

  const loadItems = async () => {
    const all = await db.library.toArray();
    setItems(all.reverse());
  };

  if (!isOpen) return null;

  const filtered = items.filter((item) => {
    if (filter !== 'all' && item.type !== filter) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase()) && !item.prompt?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleDelete = async (id: string) => {
    await db.library.delete(id);
    loadItems();
    addToast('Item removed from Library', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-4xl bg-brand-surface dark:bg-brand-darkSurface border border-brand-border dark:border-brand-darkBorder rounded-3xl shadow-claude-lg overflow-hidden animate-slide-up flex flex-col h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border dark:border-brand-darkBorder">
          <div>
            <h2 className="font-serif text-xl font-normal text-brand-text dark:text-brand-darkText">
              Media & Artifact Library
            </h2>
            <p className="text-xs text-brand-muted">All generated images, voice notes, and uploaded files</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-brand-muted hover:text-brand-text">
            <X size={18} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-brand-border/60 dark:border-brand-darkBorder/60 bg-stone-50 dark:bg-stone-900/50">
          <div className="flex items-center gap-1.5">
            {(['all', 'image', 'audio', 'document'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-colors ${
                  filter === type
                    ? 'bg-brand-accentSoft text-brand-accent font-semibold'
                    : 'text-brand-muted hover:text-brand-text'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-surface dark:bg-brand-darkSurface border border-brand-border dark:border-brand-darkBorder rounded-xl max-w-xs w-full text-xs">
            <Search size={14} className="text-brand-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter library..."
              className="bg-transparent border-0 outline-none w-full"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-brand-muted text-xs">
              No files saved in your Library yet
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="group relative flex flex-col rounded-2xl border border-brand-border dark:border-brand-darkBorder bg-stone-50 dark:bg-stone-900 overflow-hidden shadow-sm"
                >
                  {item.type === 'image' ? (
                    <div
                      className="aspect-square cursor-pointer overflow-hidden bg-stone-200 dark:bg-stone-800"
                      onClick={() => setLightboxAttachment({
                        id: item.id,
                        name: item.name,
                        type: 'image',
                        mimeType: 'image/png',
                        size: 0,
                        url: item.url,
                      })}
                    >
                      <img
                        src={item.url}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                  ) : item.type === 'audio' ? (
                    <div className="aspect-square flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500">
                      <Music size={36} />
                    </div>
                  ) : (
                    <div className="aspect-square flex items-center justify-center bg-blue-50 dark:bg-blue-950/40 text-blue-500">
                      <FileText size={36} />
                    </div>
                  )}

                  <div className="p-2.5 flex items-center justify-between text-xs">
                    <span className="truncate font-medium text-brand-text dark:text-brand-darkText">{item.name}</span>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1 rounded text-stone-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
