import React, { useState, useEffect } from 'react';
import { Brain, Plus, Trash2, X, Check } from 'lucide-react';
import { db, MemoryFact } from '../../lib/db';
import { useChatStore } from '../../store/useChatStore';

interface MemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MemoryModal: React.FC<MemoryModalProps> = ({ isOpen, onClose }) => {
  const { addToast } = useChatStore();
  const [memories, setMemories] = useState<MemoryFact[]>([]);
  const [newFact, setNewFact] = useState('');
  const [category, setCategory] = useState<'preference' | 'personal' | 'work' | 'technical'>('preference');

  useEffect(() => {
    if (isOpen) loadMemories();
  }, [isOpen]);

  const loadMemories = async () => {
    const list = await db.memories.toArray();
    setMemories(list.reverse());
  };

  if (!isOpen) return null;

  const handleAdd = async () => {
    if (!newFact.trim()) return;
    await db.memories.add({
      id: `mem-${Date.now()}`,
      fact: newFact.trim(),
      category,
      createdAt: Date.now(),
    });
    setNewFact('');
    loadMemories();
    addToast('Memory fact saved', 'success');
  };

  const handleDelete = async (id: string) => {
    await db.memories.delete(id);
    loadMemories();
    addToast('Memory deleted', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-brand-surface dark:bg-brand-darkSurface border border-brand-border dark:border-brand-darkBorder rounded-3xl shadow-claude-lg overflow-hidden animate-slide-up flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border dark:border-brand-darkBorder">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-accentSoft text-brand-accent flex items-center justify-center">
              <Brain size={16} />
            </div>
            <div>
              <h2 className="font-serif text-lg font-medium text-brand-text dark:text-brand-darkText">
                AI Memory & Personal Facts
              </h2>
              <p className="text-xs text-brand-muted">Facts NOVA remembers across your conversations</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-brand-muted hover:text-brand-text">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Add Fact */}
          <div className="p-3 bg-stone-50 dark:bg-stone-900 border border-brand-border dark:border-brand-darkBorder rounded-2xl space-y-2">
            <input
              type="text"
              placeholder="e.g. Prefers Python over JavaScript, likes concise answers..."
              value={newFact}
              onChange={(e) => setNewFact(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
              }}
              className="w-full p-2 bg-brand-surface dark:bg-brand-darkSurface border border-brand-border rounded-xl text-xs outline-none"
            />
            <div className="flex items-center justify-between">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="px-2 py-1 text-xs bg-brand-surface dark:bg-brand-darkSurface border border-brand-border rounded-lg outline-none"
              >
                <option value="preference">Preference</option>
                <option value="technical">Technical</option>
                <option value="work">Work</option>
                <option value="personal">Personal</option>
              </select>

              <button
                onClick={handleAdd}
                className="flex items-center gap-1 px-3 py-1 bg-brand-accent hover:bg-brand-accentHover text-white rounded-xl text-xs font-medium"
              >
                <Plus size={14} /> Add Fact
              </button>
            </div>
          </div>

          {/* List */}
          <div className="space-y-2">
            {memories.length === 0 ? (
              <div className="text-center py-8 text-xs text-brand-muted">
                No memories recorded yet. Add one above!
              </div>
            ) : (
              memories.map((mem) => (
                <div
                  key={mem.id}
                  className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-900 border border-brand-border dark:border-brand-darkBorder rounded-xl text-xs"
                >
                  <div className="flex-1 mr-3">
                    <span className="text-brand-text dark:text-brand-darkText">{mem.fact}</span>
                    <span className="ml-2 px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-800 text-[10px] uppercase font-semibold text-brand-muted">
                      {mem.category}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(mem.id)}
                    className="p-1 text-stone-400 hover:text-rose-500 rounded"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
