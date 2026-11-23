import React, { useState } from 'react';
import { X, Sparkles, Download, Copy, RefreshCw, Sliders, Check } from 'lucide-react';
import { db } from '../../lib/db';
import { useChatStore } from '../../store/useChatStore';

interface ImageGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

export const ImageGeneratorModal: React.FC<ImageGeneratorModalProps> = ({
  isOpen,
  onClose,
  initialPrompt = '',
}) => {
  const { addToast } = useChatStore();
  const [prompt, setPrompt] = useState(initialPrompt);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3'>('1:1');
  const [style, setStyle] = useState('photorealistic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setGeneratedResult(null);

    try {
      const res = await fetch('http://localhost:3001/api/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          aspectRatio,
          style,
          seed: Math.floor(Math.random() * 1000000),
        }),
      });

      let data;
      if (res.ok) {
        data = await res.json();
      } else {
        // Fallback local SVG generation
        data = {
          url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><rect width="100%" height="100%" fill="%23D97757" opacity="0.85"/><text x="50" y="300" font-family="sans-serif" font-size="22" fill="white">${encodeURIComponent(prompt)}</text></svg>`,
          prompt,
          style,
          aspectRatio,
          createdAt: Date.now(),
        };
      }

      setGeneratedResult(data);

      // Save to IndexedDB library
      await db.library.add({
        id: `img-${Date.now()}`,
        type: 'image',
        url: data.url,
        name: prompt.slice(0, 30),
        prompt: prompt.trim(),
        aspectRatio,
        style,
        createdAt: Date.now(),
      });

      addToast('Image generated and saved to Library', 'success');
    } catch (err: any) {
      addToast(`Generation failed: ${err.message}`, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-brand-surface dark:bg-brand-darkSurface border border-brand-border dark:border-brand-darkBorder rounded-3xl shadow-claude-lg overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border dark:border-brand-darkBorder">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-accentSoft text-brand-accent flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <h2 className="font-serif text-lg font-medium text-brand-text dark:text-brand-darkText">
              Generate Image
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-brand-muted hover:text-brand-text">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wider mb-1.5">
              Image Prompt
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A serene landscape with terraced mountains, morning mist, and warm golden hour light..."
              className="w-full p-3 bg-stone-50 dark:bg-stone-900 border border-brand-border dark:border-brand-darkBorder rounded-2xl text-sm outline-none focus:border-brand-accent resize-none text-brand-text dark:text-brand-darkText"
            />
          </div>

          {/* Controls Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wider mb-1.5">
                Aspect Ratio
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['1:1', '16:9', '9:16', '4:3'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-medium border text-center transition-all ${
                      aspectRatio === ratio
                        ? 'border-brand-accent bg-brand-accentSoft dark:bg-brand-darkAccentSoft text-brand-accent font-semibold'
                        : 'border-brand-border dark:border-brand-darkBorder text-brand-muted hover:text-brand-text'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wider mb-1.5">
                Art Style
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-900 border border-brand-border dark:border-brand-darkBorder rounded-xl text-xs outline-none text-brand-text dark:text-brand-darkText"
              >
                <option value="photorealistic">Photorealistic</option>
                <option value="minimalist-3d">Minimalist 3D</option>
                <option value="digital-art">Digital Art</option>
                <option value="watercolor">Watercolor</option>
                <option value="cinematic">Cinematic Lighting</option>
              </select>
            </div>
          </div>

          {/* Preview / Skeleton area */}
          <div className="mt-4 flex flex-col items-center justify-center min-h-[260px] bg-stone-100 dark:bg-stone-900/60 rounded-2xl border border-dashed border-brand-border dark:border-brand-darkBorder p-4">
            {isGenerating ? (
              <div className="flex flex-col items-center gap-3 animate-pulse">
                <div className="w-12 h-12 rounded-2xl bg-brand-accentSoft flex items-center justify-center text-brand-accent">
                  <Sparkles size={24} className="animate-spin" />
                </div>
                <span className="text-xs font-medium text-brand-muted">Crafting image with AI canvas...</span>
              </div>
            ) : generatedResult ? (
              <div className="flex flex-col items-center gap-3 w-full">
                <img
                  src={generatedResult.url}
                  alt={generatedResult.prompt}
                  className="max-h-72 w-auto rounded-xl shadow-claude object-contain"
                />
                <div className="flex items-center gap-2">
                  <a
                    href={generatedResult.url}
                    download="nova-generated.png"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-surface dark:bg-brand-darkSurface border border-brand-border text-xs rounded-xl hover:bg-stone-100"
                  >
                    <Download size={14} /> Download
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedResult.url);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-surface dark:bg-brand-darkSurface border border-brand-border text-xs rounded-xl hover:bg-stone-100"
                  >
                    {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    <span>{copied ? 'Copied' : 'Copy URL'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-xs text-brand-muted">
                Describe your image and click <b>Generate Image</b> below
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-brand-border dark:border-brand-darkBorder bg-brand-bg/50 dark:bg-brand-darkBg/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-brand-muted hover:text-brand-text"
          >
            Close
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-brand-accent hover:bg-brand-accentHover text-white shadow-sm disabled:opacity-50 transition-all"
          >
            <Sparkles size={14} />
            <span>{isGenerating ? 'Generating...' : 'Generate Image'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
