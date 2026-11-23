import React, { useState } from 'react';
import { Copy, Check, ThumbsUp, ThumbsDown, RefreshCw, Volume2, Share2 } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';
import { Tooltip } from '../ui/Tooltip';

interface ActionButtonsProps {
  messageId: string;
  content: string;
  feedback?: 'up' | 'down';
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  messageId,
  content,
  feedback,
}) => {
  const { regenerateMessage, setMessageFeedback, addToast } = useChatStore();
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      addToast('Copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast('Failed to copy', 'error');
    }
  };

  const handleReadAloud = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      addToast('Text-to-speech not supported in this browser', 'error');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = content.replace(/```[\s\S]*?```/g, 'Code block omitted.');
    const utterance = new SpeechSynthesisUtterance(cleanText.slice(0, 1000));
    utterance.rate = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    addToast('Reading answer aloud...', 'info');
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'NOVA AI Answer',
          text: content.slice(0, 200),
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        addToast('Link copied to clipboard', 'success');
      }
    } catch {}
  };

  return (
    <div className="flex items-center gap-1 mt-2 text-brand-muted dark:text-brand-darkMuted opacity-0 group-hover:opacity-100 transition-opacity">
      <Tooltip content="Copy message">
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-lg hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
          aria-label="Copy message"
        >
          {copied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
        </button>
      </Tooltip>

      <Tooltip content={isSpeaking ? 'Stop reading' : 'Read aloud'}>
        <button
          onClick={handleReadAloud}
          className={`p-1.5 rounded-lg hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors ${
            isSpeaking ? 'text-brand-accent animate-pulse' : ''
          }`}
          aria-label="Read aloud"
        >
          <Volume2 size={15} />
        </button>
      </Tooltip>

      <Tooltip content="Good response">
        <button
          onClick={() => setMessageFeedback(messageId, 'up')}
          className={`p-1.5 rounded-lg hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors ${
            feedback === 'up' ? 'text-brand-accent' : ''
          }`}
          aria-label="Thumbs up"
        >
          <ThumbsUp size={15} />
        </button>
      </Tooltip>

      <Tooltip content="Poor response">
        <button
          onClick={() => setMessageFeedback(messageId, 'down')}
          className={`p-1.5 rounded-lg hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors ${
            feedback === 'down' ? 'text-rose-500' : ''
          }`}
          aria-label="Thumbs down"
        >
          <ThumbsDown size={15} />
        </button>
      </Tooltip>

      <Tooltip content="Retry response">
        <button
          onClick={() => regenerateMessage(messageId)}
          className="p-1.5 rounded-lg hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
          aria-label="Retry response"
        >
          <RefreshCw size={15} />
        </button>
      </Tooltip>

      <Tooltip content="Share answer">
        <button
          onClick={handleShare}
          className="p-1.5 rounded-lg hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
          aria-label="Share"
        >
          <Share2 size={15} />
        </button>
      </Tooltip>
    </div>
  );
};
