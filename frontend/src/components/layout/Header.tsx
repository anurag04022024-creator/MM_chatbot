import React from 'react';
import { PanelLeft, SquarePen, Sun, Moon, Laptop } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';
import { useThemeStore } from '../../store/useThemeStore';
import { Tooltip } from '../ui/Tooltip';
import { Logo } from '../icons/Logo';

export const Header: React.FC = () => {
  const {
    isSidebarOpen,
    toggleSidebar,
    setMobileDrawerOpen,
    newChat,
    conversations,
    activeConversationId,
  } = useChatStore();

  const { theme, setTheme } = useThemeStore();

  const activeConv = conversations.find((c) => c.id === activeConversationId);

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <header className="h-14 border-b border-brand-border/60 dark:border-brand-darkBorder/60 px-4 flex items-center justify-between shrink-0 bg-brand-bg/80 dark:bg-brand-darkBg/80 backdrop-blur-sm z-20">
      <div className="flex items-center gap-2">
        {/* Mobile menu button */}
        <button
          onClick={() => setMobileDrawerOpen(true)}
          className="md:hidden p-2 rounded-xl text-brand-muted hover:text-brand-text dark:text-brand-darkMuted dark:hover:text-brand-darkText hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors"
          aria-label="Open navigation drawer"
        >
          <PanelLeft size={18} />
        </button>

        {/* Desktop sidebar toggle when sidebar is collapsed */}
        {!isSidebarOpen && (
          <Tooltip content="Open sidebar">
            <button
              onClick={toggleSidebar}
              className="hidden md:flex p-2 rounded-xl text-brand-muted hover:text-brand-text dark:text-brand-darkMuted dark:hover:text-brand-darkText hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors"
              aria-label="Open sidebar"
            >
              <PanelLeft size={18} />
            </button>
          </Tooltip>
        )}

        <div className="flex items-center gap-2 ml-1">
          <div className="md:hidden flex items-center gap-1.5 text-brand-accent">
            <Logo size={18} />
            <span className="font-serif font-semibold text-brand-text dark:text-brand-darkText text-base">
              NOVA
            </span>
          </div>

          {activeConv && (
            <span className="hidden sm:inline-block text-xs md:text-sm font-medium text-brand-text dark:text-brand-darkText truncate max-w-xs md:max-w-md">
              {activeConv.title}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {/* New chat button in header */}
        <Tooltip content="New chat (Ctrl+Shift+O)">
          <button
            onClick={() => newChat()}
            className="p-2 rounded-xl text-brand-muted hover:text-brand-text dark:text-brand-darkMuted dark:hover:text-brand-darkText hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors"
            aria-label="Start new chat"
          >
            <SquarePen size={18} />
          </button>
        </Tooltip>

        {/* Theme toggle */}
        <Tooltip content={`Theme: ${theme}`}>
          <button
            onClick={cycleTheme}
            className="p-2 rounded-xl text-brand-muted hover:text-brand-text dark:text-brand-darkMuted dark:hover:text-brand-darkText hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' && <Sun size={18} className="text-amber-500" />}
            {theme === 'dark' && <Moon size={18} className="text-brand-accent" />}
            {theme === 'system' && <Laptop size={18} />}
          </button>
        </Tooltip>
      </div>
    </header>
  );
};
