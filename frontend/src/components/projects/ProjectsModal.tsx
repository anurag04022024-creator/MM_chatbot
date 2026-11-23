import React, { useState, useEffect } from 'react';
import { FolderKanban, Plus, X, Trash2, Check, FileText } from 'lucide-react';
import { db, Project } from '../../lib/db';
import { useChatStore } from '../../store/useChatStore';

interface ProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectsModal: React.FC<ProjectsModalProps> = ({ isOpen, onClose }) => {
  const { addToast, newChat } = useChatStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');

  useEffect(() => {
    if (isOpen) loadProjects();
  }, [isOpen]);

  const loadProjects = async () => {
    const list = await db.projects.toArray();
    setProjects(list);
  };

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!name.trim()) return;
    const project: Project = {
      id: `proj-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      systemPrompt: systemPrompt.trim(),
      knowledgeFiles: [],
      createdAt: Date.now(),
    };
    await db.projects.add(project);
    setName('');
    setDescription('');
    setSystemPrompt('');
    setIsCreating(false);
    loadProjects();
    addToast(`Project "${project.name}" created`, 'success');
  };

  const handleDelete = async (id: string) => {
    await db.projects.delete(id);
    loadProjects();
    addToast('Project deleted', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-brand-surface dark:bg-brand-darkSurface border border-brand-border dark:border-brand-darkBorder rounded-3xl shadow-claude-lg overflow-hidden animate-slide-up flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border dark:border-brand-darkBorder">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-accentSoft text-brand-accent flex items-center justify-center">
              <FolderKanban size={16} />
            </div>
            <h2 className="font-serif text-lg font-medium text-brand-text dark:text-brand-darkText">
              Projects & Workspaces
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-brand-muted hover:text-brand-text">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-brand-border dark:border-brand-darkBorder hover:border-brand-accent rounded-2xl text-xs font-semibold text-brand-muted hover:text-brand-accent transition-all"
            >
              <Plus size={16} /> Create New Project
            </button>
          )}

          {isCreating && (
            <div className="p-4 bg-stone-50 dark:bg-stone-900 rounded-2xl border border-brand-border dark:border-brand-darkBorder space-y-3">
              <div className="font-serif text-sm font-semibold">New Project Workspace</div>
              <input
                type="text"
                placeholder="Project Name (e.g. Mobile App Redesign)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 bg-brand-surface dark:bg-brand-darkSurface border border-brand-border rounded-xl text-xs outline-none"
              />
              <textarea
                rows={2}
                placeholder="Description or goals..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2.5 bg-brand-surface dark:bg-brand-darkSurface border border-brand-border rounded-xl text-xs outline-none resize-none"
              />
              <textarea
                rows={3}
                placeholder="Custom project system prompt (rules, style, context)..."
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full p-2.5 bg-brand-surface dark:bg-brand-darkSurface border border-brand-border rounded-xl text-xs outline-none resize-none font-mono"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 text-xs text-brand-muted hover:text-brand-text"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className="px-4 py-1.5 bg-brand-accent hover:bg-brand-accentHover text-white rounded-xl text-xs font-medium"
                >
                  Save Project
                </button>
              </div>
            </div>
          )}

          {/* List */}
          <div className="space-y-2">
            {projects.length === 0 ? (
              <div className="text-center py-8 text-xs text-brand-muted">
                No custom projects created yet.
              </div>
            ) : (
              projects.map((proj) => (
                <div
                  key={proj.id}
                  className="flex items-center justify-between p-3.5 bg-stone-50 dark:bg-stone-900 border border-brand-border dark:border-brand-darkBorder rounded-2xl hover:border-brand-accent/50 transition-all cursor-pointer"
                  onClick={() => {
                    newChat();
                    onClose();
                    addToast(`Switched to project: ${proj.name}`, 'success');
                  }}
                >
                  <div className="min-w-0 flex-1 mr-4">
                    <div className="font-semibold text-xs text-brand-text dark:text-brand-darkText truncate">
                      {proj.name}
                    </div>
                    {proj.description && (
                      <div className="text-[11px] text-brand-muted line-clamp-1 mt-0.5">
                        {proj.description}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(proj.id);
                    }}
                    className="p-1.5 text-stone-400 hover:text-rose-500 rounded-lg hover:bg-black/5"
                  >
                    <Trash2 size={14} />
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
