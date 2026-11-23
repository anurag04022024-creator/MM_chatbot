import { create } from 'zustand';
import { ThemeMode } from '../types/settings';
import { loadSettings, saveSettings } from '../lib/storage';

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  applyTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: loadSettings().theme || 'light',

  setTheme: (theme: ThemeMode) => {
    set({ theme });
    const settings = loadSettings();
    saveSettings({ ...settings, theme });
    get().applyTheme();
  },

  applyTheme: () => {
    const { theme } = get();
    const root = document.documentElement;

    let isDark = false;
    if (theme === 'dark') {
      isDark = true;
    } else if (theme === 'system') {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  },
}));
