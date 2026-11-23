import React, { useState } from 'react';
import {
  PanelLeft,
  SquarePen,
  Search,
  MessageSquare,
  FolderKanban,
  Sparkles,
  Pin,
  Trash2,
  Edit2,
  MoreHorizontal,
  Settings,
  Library as LibraryIcon,
  Mic,
  Download,
} from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { Logo } from '../icons/Logo';
import { Tooltip } from '../ui/Tooltip';

interface SidebarProps {
  onOpenProjects: () => void;
  onOpenLibrary: () => void;
  onOpenVoice: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenProjects,
  onOpenLibrary,
  onOpenVoice,
}) => {
  const {
    conversations,
    activeConversationId,
    selectConversation,
    deleteConversation,
    renameConversation,
    togglePinConversation,
    newChat,
    isSidebarOpen,
    toggleSidebar,
    setIsSearchOpen,
    addToast,
  } = useChatStore();

  const { settings, openSettings } = useSettingsStore();
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');

  if (!isSidebarOpen) return null;

  // Group conversations by Today, Yesterday, Previous 7 Days, Older
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  const pinnedConvs = conversations.filter((c) => c.isPinned);
  const unpinned = conversations.filter((c) => !c.isPinned);

  const todayConvs = unpinned.filter((c) => now - c.updatedAt < oneDay);
  const yesterdayConvs = unpinned.filter((c) => now - c.updatedAt >= oneDay && now - c.updatedAt < 2 * oneDay);
  const prev7DaysConvs = unpinned.filter((c) => now - c.updatedAt >= 2 * oneDay && now - c.updatedAt < 7 * oneDay);
  const olderConvs = unpinned.filter((c) => now - c.updatedAt >= 7 * oneDay);

  const startRename = (id: string, currentTitle: string) => {
    setRenamingId(id);
    setRenameText(currentTitle);
    setActiveMenuId(null);
  };

  const submitRename = (id: string) => {
    if (renameText.trim()) {
      renameConversation(id, renameText.trim());
    }
    setRenamingId(null);
  };

  const exportConversation = (conv: any) => {
    const md = `# ${conv.title}\n\n` + conv.messages.map((m: any) => `### ${m.role === 'user' ? 'User' : 'NOVA'}\n${m.content}\n`).join('\n---\n\n');
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conv.title.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Conversation exported as Markdown', 'success');
  };

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen bg-brand-sidebar dark:bg-brand-darkSidebar border-r border-brand-border dark:border-brand-darkBorder select-none shrink-0 transition-all duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between p-3.5 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-accentSoft dark:bg-brand-darkAccentSoft text-brand-accent flex items-center justify-center shadow-sm">
            <Logo size={16} />
          </div>
          <span className="font-serif font-semibold text-lg text-brand-text dark:text-brand-darkText">
            NOVA
          </span>
        </div>
        <Tooltip content="Collapse sidebar">
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-brand-muted hover:text-brand-text dark:text-brand-darkMuted dark:hover:text-brand-darkText hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors"
            aria-label="Collapse sidebar"
          >
            <PanelLeft size={18} />
          </button>
        </Tooltip>
      </div>

      {/* New Chat Button */}
      <div className="px-3 py-2">
        <button
          onClick={() => newChat()}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface hover:border-brand-accent/50 text-brand-text dark:text-brand-darkText text-sm font-medium shadow-sm transition-all"
        >
          <span className="font-serif">New chat</span>
          <SquarePen size={16} className="text-brand-muted" />
        </button>
      </div>

      {/* Main Nav Items */}
      <div className="px-3 py-1 space-y-0.5">
        <button
          onClick={() => setIsSearchOpen(true)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-brand-muted hover:text-brand-text dark:text-brand-darkMuted dark:hover:text-brand-darkText hover:bg-stone-200/40 dark:hover:bg-stone-800/40 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Search size={15} />
            <span>Search</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] rounded bg-stone-200/60 dark:bg-stone-800 text-stone-500 font-mono">
            ⌘K
          </kbd>
        </button>

        <button
          onClick={onOpenProjects}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-brand-muted hover:text-brand-text dark:text-brand-darkMuted dark:hover:text-brand-darkText hover:bg-stone-200/40 dark:hover:bg-stone-800/40 transition-colors"
        >
          <FolderKanban size={15} />
          <span>Projects</span>
        </button>

        <button
          onClick={onOpenLibrary}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-brand-muted hover:text-brand-text dark:text-brand-darkMuted dark:hover:text-brand-darkText hover:bg-stone-200/40 dark:hover:bg-stone-800/40 transition-colors"
        >
          <LibraryIcon size={15} />
          <span>Library & Files</span>
        </button>

        <button
          onClick={onOpenVoice}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-brand-muted hover:text-brand-text dark:text-brand-darkMuted dark:hover:text-brand-darkText hover:bg-stone-200/40 dark:hover:bg-stone-800/40 transition-colors"
        >
          <Mic size={15} className="text-brand-accent" />
          <span>Voice Mode</span>
        </button>
      </div>

      <div className="h-px bg-brand-border/60 dark:bg-brand-darkBorder/60 my-2 mx-3" />

      {/* Recents Grouped by Today / Yesterday / Previous 7 Days */}
      <div className="flex-1 overflow-y-auto px-3 space-y-4">
        {pinnedConvs.length > 0 && (
          <div>
            <div className="px-2 py-1 text-[11px] font-semibold text-brand-muted uppercase tracking-wider">
              Pinned
            </div>
            <div className="space-y-0.5 mt-1">
              {pinnedConvs.map((conv) => renderConversationItem(conv))}
            </div>
          </div>
        )}

        {todayConvs.length > 0 && (
          <div>
            <div className="px-2 py-1 text-[11px] font-semibold text-brand-muted uppercase tracking-wider">
              Today
            </div>
            <div className="space-y-0.5 mt-1">
              {todayConvs.map((conv) => renderConversationItem(conv))}
            </div>
          </div>
        )}

        {yesterdayConvs.length > 0 && (
          <div>
            <div className="px-2 py-1 text-[11px] font-semibold text-brand-muted uppercase tracking-wider">
              Yesterday
            </div>
            <div className="space-y-0.5 mt-1">
              {yesterdayConvs.map((conv) => renderConversationItem(conv))}
            </div>
          </div>
        )}

        {prev7DaysConvs.length > 0 && (
          <div>
            <div className="px-2 py-1 text-[11px] font-semibold text-brand-muted uppercase tracking-wider">
              Previous 7 Days
            </div>
            <div className="space-y-0.5 mt-1">
              {prev7DaysConvs.map((conv) => renderConversationItem(conv))}
            </div>
          </div>
        )}

        {olderConvs.length > 0 && (
          <div>
            <div className="px-2 py-1 text-[11px] font-semibold text-brand-muted uppercase tracking-wider">
              Older
            </div>
            <div className="space-y-0.5 mt-1">
              {olderConvs.map((conv) => renderConversationItem(conv))}
            </div>
          </div>
        )}

        {conversations.length === 0 && (
          <div className="px-3 py-6 text-xs text-brand-muted/70 text-center">
            No conversations yet
          </div>
        )}
      </div>

      <div className="h-px bg-brand-border/60 dark:bg-brand-darkBorder/60 my-1 mx-3" />

      {/* Bottom Profile & Settings */}
      <div className="p-3">
        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-brand-accent text-white flex items-center justify-center font-semibold text-xs shrink-0 shadow-sm">
              {settings.profile.name[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-brand-text dark:text-brand-darkText truncate">
                {settings.profile.name}
              </div>
              <div className="text-[10px] text-brand-accent font-medium uppercase tracking-wider">
                {settings.profile.plan} Plan
              </div>
            </div>
          </div>

          <Tooltip content="Settings">
            <button
              onClick={openSettings}
              className="p-1.5 rounded-lg text-brand-muted hover:text-brand-text dark:text-brand-darkMuted dark:hover:text-brand-darkText hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              aria-label="Open settings"
            >
              <Settings size={16} />
            </button>
          </Tooltip>
        </div>
      </div>
    </aside>
  );

  function renderConversationItem(conv: any) {
    const isActive = conv.id === activeConversationId;
    const isMenuOpen = activeMenuId === conv.id;
    const isRenaming = renamingId === conv.id;

    return (
      <div
        key={conv.id}
        className={`group relative flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
          isActive
            ? 'bg-stone-200/70 dark:bg-stone-800 text-brand-text dark:text-brand-darkText font-medium'
            : 'text-brand-muted hover:text-brand-text dark:text-brand-darkMuted dark:hover:text-brand-darkText hover:bg-stone-200/40 dark:hover:bg-stone-800/40'
        }`}
        onClick={() => {
          if (!isRenaming) selectConversation(conv.id);
        }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
          <MessageSquare size={14} className="shrink-0 text-brand-muted" />
          {isRenaming ? (
            <input
              type="text"
              value={renameText}
              onChange={(e) => setRenameText(e.target.value)}
              onBlur={() => submitRename(conv.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitRename(conv.id);
                if (e.key === 'Escape') setRenamingId(null);
              }}
              autoFocus
              className="w-full bg-brand-surface dark:bg-brand-darkSurface px-1.5 py-0.5 rounded border border-brand-accent text-xs outline-none"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="truncate">{conv.title}</span>
          )}
        </div>

        {!isRenaming && (
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenuId(isMenuOpen ? null : conv.id);
              }}
              className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-all text-stone-500"
              aria-label="Conversation options"
            >
              <MoreHorizontal size={14} />
            </button>

            {isMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-1 w-36 bg-brand-surface dark:bg-brand-darkSurface border border-brand-border dark:border-brand-darkBorder rounded-xl shadow-claude-lg p-1 z-50 animate-slide-up"
              >
                <button
                  onClick={() => togglePinConversation(conv.id)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs hover:bg-stone-100 dark:hover:bg-stone-800 text-brand-text dark:text-brand-darkText"
                >
                  <Pin size={13} />
                  <span>{conv.isPinned ? 'Unpin' : 'Star / Pin'}</span>
                </button>
                <button
                  onClick={() => startRename(conv.id, conv.title)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs hover:bg-stone-100 dark:hover:bg-stone-800 text-brand-text dark:text-brand-darkText"
                >
                  <Edit2 size={13} />
                  <span>Rename</span>
                </button>
                <button
                  onClick={() => exportConversation(conv)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs hover:bg-stone-100 dark:hover:bg-stone-800 text-brand-text dark:text-brand-darkText"
                >
                  <Download size={13} />
                  <span>Export MD</span>
                </button>
                <button
                  onClick={() => deleteConversation(conv.id)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600 dark:text-rose-400"
                >
                  <Trash2 size={13} />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
};
