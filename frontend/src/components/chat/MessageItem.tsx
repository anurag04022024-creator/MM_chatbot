import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Pencil, Check, X, ChevronDown, ChevronRight, Brain, AlertTriangle, Play, RefreshCw } from 'lucide-react';
import { Message } from '../../types/chat';
import { CodeBlock } from './CodeBlock';
import { AttachmentGrid } from './AttachmentGrid';
import { ActionButtons } from './ActionButtons';
import { useChatStore } from '../../store/useChatStore';
import { Logo } from '../icons/Logo';

interface MessageItemProps {
  message: Message;
  isStreaming?: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, isStreaming }) => {
  const {
    editUserMessage,
    currentStreamingText,
    currentReasoningText,
    streamingMessageId,
    continueGenerating,
    retryMessage,
  } = useChatStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [isReasoningOpen, setIsReasoningOpen] = useState(true);

  const isUser = message.role === 'user';
  const isCurrentlyStreaming = isStreaming && message.id === streamingMessageId;
  const displayContent = isCurrentlyStreaming ? currentStreamingText || message.content : message.content;
  const displayReasoning = isCurrentlyStreaming ? currentReasoningText || message.reasoning : message.reasoning;

  const isCutOff =
    !isCurrentlyStreaming &&
    message.finishReason &&
    ['MAX_TOKENS', 'LENGTH', 'length'].includes(message.finishReason);

  const handleSaveEdit = () => {
    if (!editedContent.trim()) return;
    setIsEditing(false);
    editUserMessage(message.id, editedContent);
  };

  if (isUser) {
    return (
      <div className="flex flex-col items-end my-4 group">
        <div className="max-w-[85%] md:max-w-[75%]">
          {/* User Attachments */}
          <AttachmentGrid attachments={message.attachments} />

          {/* User Message Bubble */}
          <div className="relative bg-stone-200/80 dark:bg-stone-800 text-brand-text dark:text-brand-darkText px-4 py-3 rounded-2xl rounded-tr-sm shadow-sm transition-all">
            {isEditing ? (
              <div className="flex flex-col gap-2 min-w-[280px]">
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full bg-brand-surface dark:bg-brand-darkSurface p-2 rounded-xl text-sm border border-brand-border dark:border-brand-darkBorder outline-none"
                  rows={3}
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setEditedContent(message.content);
                      setIsEditing(false);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    <X size={14} /> Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="flex items-center gap-1 px-3 py-1 text-xs rounded-lg bg-brand-accent text-white hover:bg-brand-accentHover"
                  >
                    <Check size={14} /> Save & Submit
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-sm md:text-[15px] leading-relaxed whitespace-pre-wrap">
                {message.content}
              </div>
            )}
          </div>

          {/* Edit icon for user message */}
          {!isEditing && (
            <div className="flex justify-end mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 text-[11px] text-brand-muted hover:text-brand-text dark:text-brand-darkMuted dark:hover:text-brand-darkText px-2 py-0.5 rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                title="Edit message"
              >
                <Pencil size={12} /> Edit
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Assistant message: Clean plain text with no bubble, like Claude
  return (
    <div className="flex items-start gap-4 my-6 group">
      {/* Assistant Logo Badge */}
      <div className="w-7 h-7 rounded-lg bg-brand-accentSoft dark:bg-brand-darkAccentSoft text-brand-accent flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
        <Logo size={16} />
      </div>

      <div className="flex-1 min-w-0">
        {/* Extended Thinking / Reasoning Block */}
        {displayReasoning && (
          <div className="mb-3 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-stone-50 dark:bg-stone-900/60 overflow-hidden">
            <button
              onClick={() => setIsReasoningOpen(!isReasoningOpen)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-brand-muted dark:text-brand-darkMuted hover:bg-stone-100 dark:hover:bg-stone-800/80 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Brain size={14} className="text-brand-accent" />
                <span>Thought Process</span>
                {isCurrentlyStreaming && (
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-ping" />
                )}
              </div>
              {isReasoningOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>

            {isReasoningOpen && (
              <div className="px-3 py-2 text-xs text-brand-muted dark:text-brand-darkMuted border-t border-brand-border/60 dark:border-brand-darkBorder/60 font-mono whitespace-pre-wrap leading-relaxed">
                {displayReasoning}
              </div>
            )}
          </div>
        )}

        {/* Assistant Content (rendered as plain text markdown, no bubble, full height, no truncation) */}
        <div className="prose prose-stone dark:prose-invert max-w-none text-brand-text dark:text-brand-darkText text-[15px] leading-relaxed break-words">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              code({ node, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                const codeString = String(children).replace(/\n$/, '');
                if (match) {
                  return <CodeBlock language={match[1]} code={codeString} />;
                }
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {displayContent}
          </ReactMarkdown>

          {/* Pulsing accent dot while streaming */}
          {isCurrentlyStreaming && (
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-brand-accent ml-1.5 animate-pulse-dot align-middle" />
          )}
        </div>

        {/* If answer was cut off due to max output tokens, provide Continue generating button */}
        {isCutOff && (
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={() => continueGenerating(message.id)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-brand-accent text-brand-accent bg-brand-accentSoft/50 hover:bg-brand-accentSoft transition-all text-xs font-medium shadow-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              <Play size={12} className="fill-brand-accent" />
              Continue generating
            </button>
            <span className="text-xs text-brand-muted dark:text-brand-darkMuted">
              Answer reached maximum token limit
            </span>
          </div>
        )}

        {/* Visible Error Banner with Retry Button */}
        {message.error && !isCurrentlyStreaming && (
          <div className="mt-3 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex items-start justify-between gap-3 text-sm text-red-700 dark:text-red-300">
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={18} className="shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <div>
                <div className="font-medium text-xs md:text-sm">Request Unsuccessful</div>
                <div className="text-xs text-red-600/90 dark:text-red-300/80 mt-0.5 font-mono">{message.error}</div>
              </div>
            </div>
            <button
              onClick={() => retryMessage(message.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm shrink-0"
            >
              <RefreshCw size={13} />
              Retry
            </button>
          </div>
        )}

        {/* Assistant Action Buttons */}
        {!isCurrentlyStreaming && displayContent && !message.error && (
          <ActionButtons
            messageId={message.id}
            content={displayContent}
            feedback={message.feedback}
          />
        )}
      </div>
    </div>
  );
};
