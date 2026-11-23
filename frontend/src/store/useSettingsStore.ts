import { create } from 'zustand';
import { UserSettings, DEFAULT_SETTINGS, FontSize } from '../types/settings';
import { loadSettings, saveSettings } from '../lib/storage';

interface SettingsState {
  settings: UserSettings;
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  updateSettings: (partial: Partial<UserSettings>) => void;
  setFontSize: (size: FontSize) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: loadSettings(),
  isSettingsOpen: false,

  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),

  updateSettings: (partial: Partial<UserSettings>) => {
    set((state) => {
      const updated = { ...state.settings, ...partial };
      saveSettings(updated);
      return { settings: updated };
    });
  },

  setFontSize: (fontSize: FontSize) => {
    set((state) => {
      const updated = { ...state.settings, fontSize };
      saveSettings(updated);

      // Apply font-size modifier to root html
      const root = document.documentElement;
      root.classList.remove('text-sm', 'text-base', 'text-lg');
      if (fontSize === 'sm') root.classList.add('text-sm');
      else if (fontSize === 'lg') root.classList.add('text-lg');
      else root.classList.add('text-base');

      return { settings: updated };
    });
  },
}));
