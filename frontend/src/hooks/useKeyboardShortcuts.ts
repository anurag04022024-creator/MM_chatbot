import { useEffect } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useSettingsStore } from '../store/useSettingsStore';

export function useKeyboardShortcuts() {
  const { newChat, setIsSearchOpen, isSearchOpen, setLightboxAttachment } = useChatStore();
  const { isSettingsOpen, closeSettings } = useSettingsStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K: Toggle Command Palette / Search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(!isSearchOpen);
        return;
      }

      // Ctrl/Cmd + Shift + O: New Chat
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        newChat();
        return;
      }

      // Esc: Close any active modal or lightbox
      if (e.key === 'Escape') {
        if (isSearchOpen) setIsSearchOpen(false);
        if (isSettingsOpen) closeSettings();
        setLightboxAttachment(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [newChat, setIsSearchOpen, isSearchOpen, isSettingsOpen, closeSettings, setLightboxAttachment]);
}
