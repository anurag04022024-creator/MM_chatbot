import React from 'react';
import { X, PanelLeft, SquarePen, Search, MessageSquare, Trash2, Pin } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';
import { Logo } from '../icons/Logo';

export const MobileDrawer: React.FC = () => {
  const {
    isMobileDrawerOpen,
    setMobileDrawerOpen,
    conversations,
    activeConversationId,
    selectConversation,
    deleteConversation,
    togglePinConversation,
    newChat,
    setIsSearchOpen,
  } = useChatStore();

  if (!isMobileDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={() => setMobileDrawerOpen(false)}
      />

      {/* Drawer */}
      <div className="relative w-72 max-w-[85%] h-full bg-brand-sidebar dark:bg-brand-darkSidebar border-r border-brand-border dark:border-brand-darkBorder p-4 flex flex-col z-10 animate-slide-up">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-accentSoft dark:bg-brand-darkAccentSoft text-brand-accent flex items-center justify-center">
              <Logo size={16} />
            </div>
            <span className="font-serif font-semibold text-lg text-brand-text dark:text-brand-darkText">
              NOVA
            </span>
          </div>
          <button
            onClick={() => setMobileDrawerOpen(false)}
            className="p-1.5 rounded-lg text-brand-muted hover:text-brand-text dark:text-brand-darkMuted dark:hover:text-brand-darkText"
            aria-label="Close drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* New Chat */}
        <button
          onClick={() => {
            newChat();
            setMobileDrawerOpen(false);
          }}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface text-sm font-medium my-2 shadow-sm"
        >
          <span className="font-serif">New chat</span>
          <SquarePen size={16} className="text-brand-muted" />
        </button>

        {/* Search */}
        <button
          onClick={() => {
            setMobileDrawerOpen(false);
            setIsSearchOpen(true);
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-brand-muted hover:bg-stone-200/50 mb-3"
        >
          <Search size={15} />
          <span>Search conversations</span>
        </button>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto space-y-1">
          <div className="text-[11px] font-semibold text-brand-muted uppercase tracking-wider px-2 py-1">
            Conversations
          </div>
          {conversations.map((conv) => {
            const isActive = conv.id === activeConversationId;
            return (
              <div
                key={conv.id}
                onClick={() => selectConversation(conv.id)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer ${
                  isActive
                    ? 'bg-stone-200/80 dark:bg-stone-800 text-brand-text dark:text-brand-darkText font-medium'
                    : 'text-brand-muted hover:bg-stone-200/40'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare size={14} className="shrink-0" />
                  <span className="truncate">{conv.title}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePinConversation(conv.id);
                    }}
                    className="p-1 hover:text-brand-accent"
                  >
                    <Pin size={12} className={conv.isPinned ? 'text-brand-accent' : ''} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.id);
                    }}
                    className="p-1 hover:text-rose-500"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
