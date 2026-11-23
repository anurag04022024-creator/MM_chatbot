import React from 'react';
import { Logo } from '../icons/Logo';
import { getGreeting } from '../../lib/utils';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useChatStore } from '../../store/useChatStore';
import { Code2, Image, Search, FileText, Sparkles, GraduationCap } from 'lucide-react';

interface EmptyStateProps {
  onOpenImageGen?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onOpenImageGen }) => {
  const { settings } = useSettingsStore();
  const { sendMessage } = useChatStore();
  const greeting = getGreeting(settings.profile.name);

  const chips = [
    {
      title: 'Write code',
      desc: 'Build a Python algorithm, React UI, or backend script',
      icon: Code2,
      action: () => sendMessage('Write a Python function to demonstrate loop patterns with list comprehensions and run it.'),
    },
    {
      title: 'Generate an image',
      desc: 'Create photorealistic art or minimalist illustrations with AI',
      icon: Image,
      action: () => onOpenImageGen ? onOpenImageGen() : sendMessage('/image A peaceful Japanese stone garden with morning mist and bamboo'),
    },
    {
      title: 'Analyze a file',
      desc: 'Extract key data, tables, and summaries from documents',
      icon: FileText,
      action: () => sendMessage('What file formats can you parse and analyze? Please provide an overview of PDF, DOCX, and spreadsheet support.'),
    },
    {
      title: 'Search the web',
      desc: 'Look up real-time information with verified web citations',
      icon: Search,
      action: () => sendMessage('/search Latest advancements in multimodal AI and tool-calling models 2026'),
    },
    {
      title: 'Write and edit',
      desc: 'Draft executive summaries, professional emails, or essays',
      icon: Sparkles,
      action: () => sendMessage('Help me draft a thoughtful, articulate announcement for our new software launch.'),
    },
    {
      title: 'Learn something',
      desc: 'Explain quantum computing, mathematics, or sensory grounding',
      icon: GraduationCap,
      action: () => sendMessage('Guide me through the 5-4-3-2-1 sensory grounding technique step by step.'),
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto px-4 text-center my-auto py-8">
      {/* Neutral original starburst / nova glyph */}
      <div className="w-14 h-14 rounded-2xl bg-brand-accentSoft dark:bg-brand-darkAccentSoft text-brand-accent flex items-center justify-center mb-6 shadow-claude">
        <Logo size={28} />
      </div>

      {/* Centered Serif Greeting */}
      <h1 className="font-serif text-3xl md:text-4xl font-normal text-brand-text dark:text-brand-darkText mb-3">
        {greeting}
      </h1>

      <p className="text-sm md:text-base text-brand-muted dark:text-brand-darkMuted max-w-md mb-8">
        How can I help you today? Ask questions, generate code, inspect files, or search the web.
      </p>

      {/* Suggestion Chips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full text-left">
        {chips.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={item.action}
              className="flex items-start gap-3 p-3.5 rounded-2xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface hover:border-brand-accent/60 hover:shadow-claude transition-all duration-200 group"
            >
              <div className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-brand-muted group-hover:text-brand-accent transition-colors shrink-0 mt-0.5">
                <Icon size={16} strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-brand-text dark:text-brand-darkText mb-0.5">
                  {item.title}
                </div>
                <div className="text-[11px] text-brand-muted dark:text-brand-darkMuted line-clamp-2">
                  {item.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
