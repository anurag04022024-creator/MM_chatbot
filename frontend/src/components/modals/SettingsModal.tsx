import React, { useState } from 'react';
import { X, User, Palette, Cpu, Type, Check } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useChatStore } from '../../store/useChatStore';
import { ThemeMode, FontSize } from '../../types/settings';
import { AVAILABLE_MODELS } from '../../types/chat';

export const SettingsModal: React.FC = () => {
  const { isSettingsOpen, closeSettings, settings, updateSettings, setFontSize } = useSettingsStore();
  const { theme, setTheme } = useThemeStore();
  const { addToast } = useChatStore();

  const [name, setName] = useState(settings.profile.name);
  const [email, setEmail] = useState(settings.profile.email);

  if (!isSettingsOpen) return null;

  const handleSave = () => {
    updateSettings({
      profile: {
        ...settings.profile,
        name: name.trim() || 'User',
        email: email.trim(),
      },
    });
    addToast('Settings updated', 'success');
    closeSettings();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-brand-surface dark:bg-brand-darkSurface border border-brand-border dark:border-brand-darkBorder rounded-3xl shadow-claude-lg overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border dark:border-brand-darkBorder">
          <h2 className="font-serif text-xl font-normal text-brand-text dark:text-brand-darkText">
            Settings
          </h2>
          <button
            onClick={closeSettings}
            className="p-1.5 rounded-lg text-brand-muted hover:text-brand-text dark:text-brand-darkMuted hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Profile Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-muted uppercase tracking-wider">
              <User size={14} /> Profile
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-brand-text dark:text-brand-darkText mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-900 border border-brand-border dark:border-brand-darkBorder rounded-xl text-sm outline-none focus:border-brand-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-text dark:text-brand-darkText mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-900 border border-brand-border dark:border-brand-darkBorder rounded-xl text-sm outline-none focus:border-brand-accent"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-brand-border/60 dark:bg-brand-darkBorder/60" />

          {/* Theme Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-muted uppercase tracking-wider">
              <Palette size={14} /> Appearance & Theme
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setTheme(mode)}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-medium capitalize transition-all ${
                    theme === mode
                      ? 'border-brand-accent bg-brand-accentSoft dark:bg-brand-darkAccentSoft text-brand-accent'
                      : 'border-brand-border dark:border-brand-darkBorder hover:bg-stone-100 dark:hover:bg-stone-800 text-brand-muted'
                  }`}
                >
                  {theme === mode && <Check size={14} />}
                  <span>{mode}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-brand-border/60 dark:bg-brand-darkBorder/60" />

          {/* Font Size */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-muted uppercase tracking-wider">
              <Type size={14} /> Font Size
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['sm', 'base', 'lg'] as FontSize[]).map((size) => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-medium uppercase transition-all ${
                    settings.fontSize === size
                      ? 'border-brand-accent bg-brand-accentSoft dark:bg-brand-darkAccentSoft text-brand-accent'
                      : 'border-brand-border dark:border-brand-darkBorder hover:bg-stone-100 dark:hover:bg-stone-800 text-brand-muted'
                  }`}
                >
                  {settings.fontSize === size && <Check size={14} />}
                  <span>{size}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-brand-border/60 dark:bg-brand-darkBorder/60" />

          {/* Default Model */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-muted uppercase tracking-wider">
              <Cpu size={14} /> Default AI Model
            </div>
            <select
              value={settings.defaultModel}
              onChange={(e) => updateSettings({ defaultModel: e.target.value })}
              className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-900 border border-brand-border dark:border-brand-darkBorder rounded-xl text-sm outline-none focus:border-brand-accent text-brand-text dark:text-brand-darkText"
            >
              {AVAILABLE_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.badge})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-brand-border dark:border-brand-darkBorder bg-stone-50 dark:bg-stone-900/60">
          <button
            onClick={closeSettings}
            className="px-4 py-2 rounded-xl text-xs font-medium text-brand-muted hover:text-brand-text hover:bg-black/5 dark:hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-brand-accent text-white hover:bg-brand-accentHover transition-colors shadow-sm"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
