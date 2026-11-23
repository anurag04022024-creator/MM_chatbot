import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Sparkles, Zap, Check } from 'lucide-react';
import { AVAILABLE_MODELS } from '../../types/chat';
import { useChatStore } from '../../store/useChatStore';

export const ModelSelector: React.FC = () => {
  const { selectedModel, setSelectedModel } = useChatStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const current = AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-brand-muted hover:text-brand-text dark:text-brand-darkMuted dark:hover:text-brand-darkText rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select AI Model"
      >
        <span>{current.name}</span>
        <ChevronDown size={14} className="text-stone-400" />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute right-0 bottom-full mb-2 w-72 bg-brand-surface dark:bg-brand-darkSurface border border-brand-border dark:border-brand-darkBorder rounded-2xl shadow-claude-lg p-1.5 z-40 animate-slide-up"
        >
          <div className="px-2.5 py-1.5 text-[11px] font-semibold text-brand-muted uppercase tracking-wider">
            Available Models
          </div>
          {AVAILABLE_MODELS.map((model) => {
            const isSelected = model.id === current.id;
            return (
              <button
                key={model.id}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  setSelectedModel(model.id);
                  setIsOpen(false);
                }}
                className="w-full flex items-start gap-2.5 px-3 py-2 text-left rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                <div className="mt-0.5 text-brand-accent">
                  {model.badge === 'Fast' ? <Zap size={16} /> : <Sparkles size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-brand-text dark:text-brand-darkText">
                      {model.name}
                    </span>
                    {isSelected && <Check size={14} className="text-brand-accent shrink-0 ml-1" />}
                  </div>
                  <p className="text-[11px] text-brand-muted dark:text-brand-darkMuted line-clamp-2 mt-0.5">
                    {model.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
