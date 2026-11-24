import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  SlidersHorizontal,
  Globe,
  Lightbulb,
  Mic,
  ArrowUp,
  Square,
  Sparkles,
  Terminal,
  Telescope,
  BarChart3,
  Code,
  Image as ImageIcon,
  Search,
  BookOpen,
  Languages,
  Wrench,
  Trash2,
} from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';
import { AttachmentList } from './AttachmentList';
import { AttachMenu } from './AttachMenu';
import { VoiceRecordingBar } from './VoiceRecordingBar';
import { ModelSelector } from './ModelSelector';
import { Tooltip } from '../ui/Tooltip';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';
import { useSpeechDictation } from '../../hooks/useSpeechDictation';
import type { Attachment } from '../../types/chat';
import { generateId } from '../../lib/utils';

import { createAttachmentFromFile, processImageFile, readFileAsBase64 } from '../../lib/fileProcessing';

export const Composer: React.FC = () => {
  const {
    sendMessage,
    isStreaming,
    stopStreaming,
    attachments,
    addAttachment,
    removeAttachment,
    webSearchActive,
    toggleWebSearch,
    extendedThinkingActive,
    toggleExtendedThinking,
    addToast,
    newChat,
  } = useChatStore();

  const [input, setInput] = useState('');
  const [isAttachOpen, setIsAttachOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isSlashOpen, setIsSlashOpen] = useState(false);
  const [codeExecActive, setCodeExecActive] = useState(true);
  const [deepResearchActive, setDeepResearchActive] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const slashMenuRef = useRef<HTMLDivElement>(null);

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 240)}px`;
    }
  }, [input]);

  // Slash command trigger
  useEffect(() => {
    if (input.startsWith('/') && !input.includes(' ')) {
      setIsSlashOpen(true);
    } else {
      setIsSlashOpen(false);
    }
  }, [input]);

  // Voice recording hook (MediaRecorder)
  const {
    isRecording,
    recordingDuration,
    startRecording,
    confirmRecording,
    cancelRecording,
  } = useVoiceRecorder({
    onRecordingComplete: async (result) => {
      try {
        const base64 = await readFileAsBase64(result.blob);
        const audioAttachment: Attachment = {
          id: generateId(),
          name: `Voice_Note_${new Date().toLocaleTimeString().replace(/:/g, '-')}.webm`,
          type: 'audio',
          mimeType: result.blob.type || 'audio/webm',
          size: result.blob.size,
          url: result.url,
          base64,
          duration: result.duration,
          waveformData: result.waveformData,
        };

        addAttachment(audioAttachment);
        addToast('Voice recording attached. Transcribing...', 'info');

        // Transcribe via backend
        fetch('http://localhost:3001/api/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audio: base64, mimeType: audioAttachment.mimeType }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.text) {
              audioAttachment.transcript = data.text;
              addToast('Voice note transcribed successfully', 'success');
            }
          })
          .catch((err) => console.warn('[Transcribe Hook Error]:', err));
      } catch (err: any) {
        addToast(`Could not process voice note: ${err.message}`, 'error');
      }
    },
    onError: (err) => {
      addToast(`Microphone error: ${err.message}`, 'error');
    },
  });

  // Speech-to-text dictation hook
  const { isDictating, toggleDictation } = useSpeechDictation({
    onTranscript: (transcript) => {
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    },
    onError: (err) => {
      addToast(err, 'error');
    },
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (isStreaming) {
      stopStreaming();
      return;
    }

    if (!input.trim() && attachments.length === 0) return;

    // Handle /clear slash command
    if (input.trim() === '/clear') {
      setInput('');
      newChat();
      addToast('Conversation cleared', 'info');
      return;
    }

    const text = input;
    setInput('');
    setIsSlashOpen(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    sendMessage(text);
  };

  // Clipboard image paste support with base64 conversion & resizing
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          try {
            const attachment = await createAttachmentFromFile(file);
            attachment.name = `Pasted_Image_${Date.now()}.png`;
            addAttachment(attachment);
            addToast('Image pasted and processed from clipboard', 'success');
          } catch (err: any) {
            addToast(`Clipboard image error: ${err.message}`, 'error');
          }
        }
      }
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    e.target.value = '';

    for (const file of fileList) {
      if (file.size > 25 * 1024 * 1024) {
        addToast(`File ${file.name} exceeds 25 MB limit`, 'error');
        continue;
      }

      try {
        const attachment = await createAttachmentFromFile(file);
        addAttachment(attachment);
      } catch (err: any) {
        addToast(`Could not process ${file.name}: ${err.message}`, 'error');
      }
    }
  };

  const slashCommands = [
    { cmd: '/image', desc: 'Generate an image with AI', icon: ImageIcon, fill: '/image ' },
    { cmd: '/code', desc: 'Write and run executable code', icon: Code, fill: '/code ' },
    { cmd: '/search', desc: 'Search the live web with citations', icon: Search, fill: '/search ' },
    { cmd: '/summarize', desc: 'Summarize attached file or text', icon: BookOpen, fill: 'Summarize the key points: ' },
    { cmd: '/translate', desc: 'Translate text to any language', icon: Languages, fill: 'Translate the following to Spanish: ' },
    { cmd: '/explain', desc: 'Explain a complex concept simply', icon: Sparkles, fill: 'Explain step-by-step: ' },
    { cmd: '/fix', desc: 'Debug and self-correct code bugs', icon: Wrench, fill: 'Find and fix the bugs in this code: ' },
    { cmd: '/clear', desc: 'Start a clean new chat', icon: Trash2, fill: '/clear' },
  ];

  return (
    <div className="w-full relative">
      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelected} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelected} />

      {/* Slash Commands Dropdown */}
      {isSlashOpen && (
        <div
          ref={slashMenuRef}
          className="absolute bottom-full left-4 mb-2 w-72 bg-brand-surface dark:bg-brand-darkSurface border border-brand-border dark:border-brand-darkBorder rounded-2xl shadow-claude-lg p-1.5 z-50 animate-slide-up"
        >
          <div className="px-2.5 py-1 text-[11px] font-semibold text-brand-muted uppercase tracking-wider">
            Slash Commands
          </div>
          {slashCommands.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.cmd}
                onClick={() => {
                  setInput(item.fill);
                  setIsSlashOpen(false);
                  textareaRef.current?.focus();
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-left text-xs transition-colors"
              >
                <Icon size={14} className="text-brand-accent shrink-0" />
                <div className="flex-1 truncate">
                  <span className="font-semibold text-brand-text dark:text-brand-darkText">{item.cmd}</span>
                  <span className="ml-1.5 text-brand-muted">{item.desc}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {isRecording ? (
        <VoiceRecordingBar
          duration={recordingDuration}
          onCancel={cancelRecording}
          onConfirm={confirmRecording}
        />
      ) : (
        <div className="relative bg-brand-surface dark:bg-brand-darkSurface border border-brand-border dark:border-brand-darkBorder rounded-2xl shadow-claude transition-all duration-150 focus-within:border-brand-accent/70 focus-within:shadow-claude-lg">
          {/* Attachments preview strip */}
          <AttachmentList attachments={attachments} onRemove={removeAttachment} />

          {/* Textarea */}
          <div className="p-3 pb-1">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="How can I help you today? Type / for commands, paste images..."
              className="w-full bg-transparent resize-none border-0 outline-none text-brand-text dark:text-brand-darkText placeholder:text-brand-muted/70 dark:placeholder:text-brand-darkMuted/70 text-sm md:text-base leading-relaxed py-1 max-h-60"
            />
          </div>

          {/* Bottom Toolbar */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-brand-border/40 dark:border-brand-darkBorder/40">
            {/* Bottom-left icon row */}
            <div className="flex items-center gap-1 relative">
              <Tooltip content="Attach files, images, audio, or take photo">
                <button
                  type="button"
                  onClick={() => setIsAttachOpen(!isAttachOpen)}
                  className="p-1.5 text-brand-muted hover:text-brand-text dark:text-brand-darkMuted dark:hover:text-brand-darkText hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                  aria-label="Add attachment"
                >
                  <Plus size={18} strokeWidth={1.75} />
                </button>
              </Tooltip>

              <AttachMenu
                isOpen={isAttachOpen}
                onClose={() => setIsAttachOpen(false)}
                onSelectImage={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = 'image/*';
                    fileInputRef.current.click();
                  }
                }}
                onSelectAudio={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = 'audio/*';
                    fileInputRef.current.click();
                  }
                }}
                onSelectDoc={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = '.pdf,.doc,.docx,.txt,.csv,.xlsx,.json,.py,.js';
                    fileInputRef.current.click();
                  }
                }}
                onTakePhoto={() => cameraInputRef.current?.click()}
              />

              {/* Tools button & popover */}
              <div className="relative">
                <Tooltip content="Tools & capabilities">
                  <button
                    type="button"
                    onClick={() => setIsToolsOpen(!isToolsOpen)}
                    className="p-1.5 text-brand-muted hover:text-brand-text dark:text-brand-darkMuted dark:hover:text-brand-darkText hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                    aria-label="Composer tools"
                  >
                    <SlidersHorizontal size={17} strokeWidth={1.75} />
                  </button>
                </Tooltip>

                {isToolsOpen && (
                  <div className="absolute bottom-full left-0 mb-2 w-64 bg-brand-surface dark:bg-brand-darkSurface border border-brand-border dark:border-brand-darkBorder rounded-2xl shadow-claude-lg p-2 z-40 animate-slide-up">
                    <div className="px-2 py-1 text-[11px] font-semibold text-brand-muted uppercase">Tools & Capabilities</div>
                    <label className="flex items-center justify-between p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer text-xs">
                      <div className="flex items-center gap-2"><Globe size={15} className="text-brand-accent" /><span>Web Search</span></div>
                      <input type="checkbox" checked={webSearchActive} onChange={toggleWebSearch} className="accent-brand-accent" />
                    </label>
                    <label className="flex items-center justify-between p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer text-xs">
                      <div className="flex items-center gap-2"><Terminal size={15} className="text-emerald-500" /><span>Code Execution</span></div>
                      <input type="checkbox" checked={codeExecActive} onChange={() => setCodeExecActive(!codeExecActive)} className="accent-brand-accent" />
                    </label>
                    <label className="flex items-center justify-between p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer text-xs">
                      <div className="flex items-center gap-2"><Lightbulb size={15} className="text-amber-500" /><span>Extended Thinking</span></div>
                      <input type="checkbox" checked={extendedThinkingActive} onChange={toggleExtendedThinking} className="accent-brand-accent" />
                    </label>
                    <label className="flex items-center justify-between p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer text-xs">
                      <div className="flex items-center gap-2"><Telescope size={15} className="text-purple-500" /><span>Deep Research</span></div>
                      <input type="checkbox" checked={deepResearchActive} onChange={() => setDeepResearchActive(!deepResearchActive)} className="accent-brand-accent" />
                    </label>
                  </div>
                )}
              </div>

              {/* Web search toggle badge */}
              <Tooltip content="Live web search verification">
                <button
                  type="button"
                  onClick={toggleWebSearch}
                  className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg transition-all ${
                    webSearchActive
                      ? 'bg-brand-accentSoft text-brand-accent dark:bg-brand-darkAccentSoft shadow-sm'
                      : 'text-brand-muted hover:text-brand-text dark:text-brand-darkMuted dark:hover:text-brand-darkText hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                  aria-pressed={webSearchActive}
                  aria-label="Toggle web search"
                >
                  <Globe size={15} strokeWidth={1.75} />
                  <span>Search</span>
                </button>
              </Tooltip>

              {/* Extended thinking toggle */}
              <Tooltip content="Extended reasoning & step-by-step thinking">
                <button
                  type="button"
                  onClick={toggleExtendedThinking}
                  className={`p-1.5 rounded-lg transition-all ${
                    extendedThinkingActive
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      : 'text-brand-muted hover:text-brand-text dark:text-brand-darkMuted dark:hover:text-brand-darkText hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                  aria-pressed={extendedThinkingActive}
                  aria-label="Toggle extended thinking"
                >
                  <Lightbulb size={17} strokeWidth={1.75} />
                </button>
              </Tooltip>
            </div>

            {/* Bottom-right icon row */}
            <div className="flex items-center gap-1.5">
              <ModelSelector />

              {/* Microphone: Voice dictation or recording */}
              <Tooltip content={isDictating ? 'Stop dictation' : 'Hold/click to record voice note'}>
                <button
                  type="button"
                  onClick={startRecording}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    toggleDictation();
                  }}
                  className={`p-2 rounded-xl transition-all ${
                    isDictating
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'text-brand-muted hover:text-brand-text dark:text-brand-darkMuted dark:hover:text-brand-darkText hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                  aria-label="Record voice note"
                >
                  <Mic size={17} strokeWidth={1.75} />
                </button>
              </Tooltip>

              {/* Send / Stop button */}
              <Tooltip content={isStreaming ? 'Stop generation' : 'Send message'}>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!isStreaming && !input.trim() && attachments.length === 0}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                    isStreaming
                      ? 'bg-stone-900 text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900'
                      : input.trim() || attachments.length > 0
                      ? 'bg-brand-accent text-white hover:bg-brand-accentHover shadow-sm'
                      : 'bg-stone-200 dark:bg-stone-800 text-stone-400 dark:text-stone-600 cursor-not-allowed'
                  }`}
                  aria-label={isStreaming ? 'Stop response' : 'Send message'}
                >
                  {isStreaming ? <Square size={14} className="fill-current" /> : <ArrowUp size={16} strokeWidth={2.2} />}
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
