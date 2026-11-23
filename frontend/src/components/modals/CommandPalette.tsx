import React, { useState, useEffect, useRef } from 'react';
import { Search, MessageSquare, ArrowRight, X } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';

export const CommandPalette: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen, conversations, selectConversation } = useChatStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isSearchOpen]);

  if (!isSearchOpen) return null;

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.messages.some((m) => m.content.toLowerCase().includes(query.toLowerCase()))
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      selectConversation(filtered[selectedIndex].id);
      setIsSearchOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-brand-surface dark:bg-brand-darkSurface border border-brand-border dark:border-brand-darkBorder rounded-2xl shadow-claude-lg overflow-hidden animate-slide-up">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-brand-border dark:border-brand-darkBorder">
          <Search size={18} className="text-brand-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search conversations & messages..."
            className="w-full bg-transparent border-0 outline-none text-sm text-brand-text dark:text-brand-darkText placeholder:text-brand-muted"
          />
          <button
            onClick={() => setIsSearchOpen(false)}
            className="p-1 rounded-lg text-brand-muted hover:text-brand-text"
          >
            <X size={16} />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-brand-muted">
              No matching conversations found
            </div>
          ) : (
            filtered.map((conv, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    selectConversation(conv.id);
                    setIsSearchOpen(false);
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer text-xs transition-colors ${
                    isSelected
                      ? 'bg-brand-accentSoft text-brand-accent dark:bg-brand-darkAccentSoft font-medium'
                      : 'text-brand-text dark:text-brand-darkText hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <MessageSquare size={14} className="shrink-0" />
                    <span className="truncate">{conv.title}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-brand-muted shrink-0">
                    <span>{conv.messages.length} msg(s)</span>
                    <ArrowRight size={12} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-brand-border/60 dark:border-brand-darkBorder/60 bg-stone-50 dark:bg-stone-900/60 flex items-center justify-between text-[11px] text-brand-muted">
          <span>Navigate with ↑ and ↓</span>
          <span>Press Enter to select, Esc to close</span>
        </div>
      </div>
    </div>
  );
};
