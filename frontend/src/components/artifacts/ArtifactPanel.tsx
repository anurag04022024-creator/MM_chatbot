import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Copy,
  Check,
  Download,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Code2,
  Sparkles,
} from 'lucide-react';
import mermaid from 'mermaid';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as ChartTooltip, BarChart, Bar, CartesianGrid } from 'recharts';
import { ArtifactItem } from '../../lib/db';
import { runCode, ExecutionResult } from '../../lib/execution/runner';
import { useChatStore } from '../../store/useChatStore';

interface ArtifactPanelProps {
  artifact: ArtifactItem | null;
  onClose: () => void;
}

export const ArtifactPanel: React.FC<ArtifactPanelProps> = ({ artifact, onClose }) => {
  const { addToast } = useChatStore();
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [execResult, setExecResult] = useState<ExecutionResult | null>(null);

  const mermaidRef = useRef<HTMLDivElement>(null);

  // Initialize mermaid on diagram artifacts
  useEffect(() => {
    if (artifact?.type === 'diagram' && mermaidRef.current) {
      mermaid.initialize({ startOnLoad: true, theme: 'neutral' });
      mermaid.render(`mermaid-${artifact.id}`, artifact.content).then(({ svg }) => {
        if (mermaidRef.current) mermaidRef.current.innerHTML = svg;
      }).catch((err) => {
        if (mermaidRef.current) mermaidRef.current.innerHTML = `<pre class="text-rose-500">${err.message}</pre>`;
      });
    }
  }, [artifact]);

  if (!artifact) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    addToast('Artifact copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = artifact.type === 'diagram' ? 'svg' : artifact.language === 'python' ? 'py' : artifact.type === 'html' ? 'html' : 'txt';
    const blob = new Blob([artifact.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifact.title.replace(/\s+/g, '_').toLowerCase()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Downloaded artifact file', 'success');
  };

  const handleRun = async () => {
    setIsExecuting(true);
    try {
      const res = await runCode(artifact.language || 'javascript', artifact.content);
      setExecResult(res);
      if (res.success) {
        addToast(`Code executed in ${res.executionTimeMs}ms`, 'success');
      } else {
        addToast('Execution failed', 'error');
      }
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div
      className={`fixed md:relative top-0 right-0 h-screen z-40 bg-brand-surface dark:bg-brand-darkSurface border-l border-brand-border dark:border-brand-darkBorder flex flex-col transition-all duration-200 shadow-claude-lg ${
        isFullscreen ? 'w-screen' : 'w-full md:w-[480px] lg:w-[580px]'
      }`}
    >
      {/* Artifact Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border dark:border-brand-darkBorder bg-brand-bg/50 dark:bg-brand-darkBg/50">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-brand-accentSoft text-brand-accent flex items-center justify-center shrink-0">
            <Sparkles size={16} />
          </div>
          <div className="min-w-0">
            <h3 className="font-serif text-sm font-semibold text-brand-text dark:text-brand-darkText truncate">
              {artifact.title}
            </h3>
            <span className="text-[11px] text-brand-muted uppercase tracking-wider">
              {artifact.type} {artifact.language ? `• ${artifact.language}` : ''}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Version history */}
          {artifact.versions?.length > 1 && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-[11px] text-brand-muted">
              <button className="p-0.5 hover:text-brand-text"><ChevronLeft size={12} /></button>
              <span>{artifact.currentVersionIndex + 1}/{artifact.versions.length}</span>
              <button className="p-0.5 hover:text-brand-text"><ChevronRight size={12} /></button>
            </div>
          )}

          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-brand-muted hover:text-brand-text hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title="Copy code"
          >
            {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg text-brand-muted hover:text-brand-text hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title="Download file"
          >
            <Download size={16} />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg text-brand-muted hover:text-brand-text hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors hidden md:block"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-brand-muted hover:text-brand-text hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title="Close artifact"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Tabs (Preview / Code) */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-brand-border/60 dark:border-brand-darkBorder/60 bg-stone-50 dark:bg-stone-900/40 text-xs font-medium">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'preview'
                ? 'bg-brand-surface dark:bg-brand-darkSurface text-brand-accent shadow-sm font-semibold'
                : 'text-brand-muted hover:text-brand-text'
            }`}
          >
            <Eye size={14} /> Preview
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'code'
                ? 'bg-brand-surface dark:bg-brand-darkSurface text-brand-accent shadow-sm font-semibold'
                : 'text-brand-muted hover:text-brand-text'
            }`}
          >
            <Code2 size={14} /> Code
          </button>
        </div>

        {/* Run code button */}
        {(artifact.type === 'code' || artifact.language === 'python' || artifact.language === 'javascript') && (
          <button
            onClick={handleRun}
            disabled={isExecuting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-accent hover:bg-brand-accentHover text-white font-medium text-xs shadow-sm transition-all"
          >
            <Play size={13} className={isExecuting ? 'animate-spin' : ''} />
            <span>{isExecuting ? 'Running...' : 'Run Code'}</span>
          </button>
        )}
      </div>

      {/* Main Artifact Viewport */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'preview' ? (
          artifact.type === 'html' ? (
            <iframe
              srcDoc={artifact.content}
              title="Artifact Live Preview"
              sandbox="allow-scripts allow-forms"
              className="w-full h-full min-h-[400px] border-0 rounded-xl bg-white"
            />
          ) : artifact.type === 'diagram' ? (
            <div ref={mermaidRef} className="flex justify-center p-4 bg-white dark:bg-stone-900 rounded-xl overflow-x-auto" />
          ) : artifact.type === 'chart' ? (
            <div className="w-full h-72 p-2 bg-brand-surface dark:bg-brand-darkSurface rounded-xl">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Mon', value: 34 },
                  { name: 'Tue', value: 48 },
                  { name: 'Wed', value: 62 },
                  { name: 'Thu', value: 55 },
                  { name: 'Fri', value: 80 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip />
                  <Bar dataKey="value" fill="#D97757" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="prose prose-stone dark:prose-invert max-w-none text-sm font-sans leading-relaxed whitespace-pre-wrap">
              {artifact.content}
            </div>
          )
        ) : (
          <pre className="p-4 bg-stone-900 text-stone-100 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
            <code>{artifact.content}</code>
          </pre>
        )}

        {/* Execution Output Panel */}
        {execResult && (
          <div className="mt-4 p-3 bg-stone-900 text-stone-100 rounded-xl border border-stone-800 text-xs font-mono">
            <div className="flex items-center justify-between pb-1 border-b border-stone-800 text-stone-400 font-semibold uppercase text-[10px]">
              <span>Console Output ({execResult.executionTimeMs}ms)</span>
              <span className={execResult.success ? 'text-emerald-400' : 'text-rose-400'}>
                {execResult.success ? 'SUCCESS' : 'ERROR'}
              </span>
            </div>
            {execResult.stdout && <pre className="mt-2 text-stone-200">{execResult.stdout}</pre>}
            {execResult.stderr && <pre className="mt-2 text-rose-400">{execResult.stderr}</pre>}
          </div>
        )}
      </div>
    </div>
  );
};
