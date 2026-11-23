import React, { useRef, useEffect, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import { Message } from '../../types/chat';
import { MessageItem } from './MessageItem';
import { useChatStore } from '../../store/useChatStore';

interface MessageListProps {
  messages: Message[];
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const { isStreaming } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Auto-scroll on new tokens / messages
  useEffect(() => {
    if (!showScrollBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isStreaming, showScrollBottom]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    setShowScrollBottom(!isAtBottom);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollBottom(false);
  };

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 md:px-8 py-6 relative"
    >
      <div className="max-w-3xl mx-auto flex flex-col pb-6">
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} isStreaming={isStreaming} />
        ))}
        <div ref={bottomRef} className="h-4" />
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-28 right-8 z-30 p-2.5 rounded-full bg-brand-surface dark:bg-brand-darkSurface border border-brand-border dark:border-brand-darkBorder shadow-claude-lg text-brand-text dark:text-brand-darkText hover:border-brand-accent transition-all animate-fade-in"
          aria-label="Scroll to bottom"
        >
          <ArrowDown size={16} />
        </button>
      )}
    </div>
  );
};
