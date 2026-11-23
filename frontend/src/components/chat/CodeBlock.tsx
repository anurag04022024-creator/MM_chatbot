import React, { useState, useEffect } from 'react';
import { Copy, Check, Play, Sparkles, Terminal } from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-markdown';
import { runCode, ExecutionResult } from '../../lib/execution/runner';
import { useChatStore } from '../../store/useChatStore';

interface CodeBlockProps {
  language: string;
  code: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const { addToast } = useChatStore();
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<ExecutionResult | null>(null);

  useEffect(() => {
    Prism.highlightAll();
  }, [code, language]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleRun = async () => {
    setIsRunning(true);
    try {
      const res = await runCode(language, code);
      setOutput(res);
      if (res.success) {
        addToast(`Executed in ${res.executionTimeMs}ms`, 'success');
      } else {
        addToast('Execution returned error', 'error');
      }
    } finally {
      setIsRunning(false);
    }
  };

  const cleanLang = (language || 'text').toLowerCase();
  const isRunnable = ['python', 'py', 'javascript', 'js', 'html'].includes(cleanLang);

  return (
    <div className="relative rounded-2xl overflow-hidden my-3 border border-stone-800 bg-[#1F1E1D] shadow-claude">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#282725] border-b border-stone-800 text-xs font-mono text-stone-400">
        <span className="uppercase tracking-wider font-semibold text-[11px] text-stone-300">
          {cleanLang}
        </span>
        <div className="flex items-center gap-1.5">
          {isRunnable && (
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-brand-accent/20 hover:bg-brand-accent text-brand-accent hover:text-white transition-colors"
              aria-label="Run code"
            >
              <Play size={13} className={isRunning ? 'animate-spin' : ''} />
              <span className="text-xs">{isRunning ? 'Running...' : 'Run'}</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-stone-700/60 text-stone-300 hover:text-white transition-colors"
            aria-label="Copy code to clipboard"
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald-400" />
                <span className="text-emerald-400 text-xs">Copied</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span className="text-xs">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code body */}
      <div className="p-4 overflow-x-auto text-sm font-mono leading-relaxed text-[#ECEBE6]">
        <pre className="!bg-transparent !p-0 !m-0 !border-0">
          <code className={`language-${cleanLang}`}>{code}</code>
        </pre>
      </div>

      {/* Inline Execution Output */}
      {output && (
        <div className="border-t border-stone-800 p-3 bg-stone-950 text-xs font-mono">
          <div className="flex items-center justify-between text-[11px] text-stone-400 pb-1 border-b border-stone-800 mb-2">
            <span className="flex items-center gap-1.5">
              <Terminal size={12} /> Execution Output ({output.executionTimeMs}ms)
            </span>
            <span className={output.success ? 'text-emerald-400' : 'text-rose-400'}>
              {output.success ? 'SUCCESS' : 'ERROR'}
            </span>
          </div>
          {output.stdout && <pre className="text-stone-300 whitespace-pre-wrap">{output.stdout}</pre>}
          {output.stderr && <pre className="text-rose-400 whitespace-pre-wrap">{output.stderr}</pre>}
        </div>
      )}
    </div>
  );
};
