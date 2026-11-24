export type ThemeMode = 'light' | 'dark' | 'system';
export type FontSize = 'sm' | 'base' | 'lg';

export interface UserProfile {
  name: string;
  avatar?: string;
  email: string;
  plan: 'Free' | 'Pro' | 'Team' | 'Enterprise';
}

export interface UserSettings {
  profile: UserProfile;
  defaultModel: string;
  theme: ThemeMode;
  fontSize: FontSize;
  maxTokens: number;
  webSearchDefault: boolean;
  extendedThinkingDefault: boolean;
  systemPrompt: string;
  soundEffects: boolean;
}

export const DEFAULT_SETTINGS: UserSettings = {
  profile: {
    name: 'Anurag',
    email: 'anurag@example.com',
    plan: 'Pro',
  },
  defaultModel: 'nova-3.5-sonnet',
  theme: 'light',
  fontSize: 'base',
  maxTokens: 8192,
  webSearchDefault: false,
  extendedThinkingDefault: false,
  systemPrompt: 'You are NOVA, a calm, intelligent, thoughtful, and highly capable AI assistant.',
  soundEffects: false,
};
