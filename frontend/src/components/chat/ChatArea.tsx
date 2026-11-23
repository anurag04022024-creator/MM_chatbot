import React from 'react';
import { useChatStore } from '../../store/useChatStore';
import { EmptyState } from './EmptyState';
import { MessageList } from './MessageList';
import { Composer } from '../composer/Composer';
import { Header } from '../layout/Header';

interface ChatAreaProps {
  onOpenImageGen?: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ onOpenImageGen }) => {
  const { conversations, activeConversationId } = useChatStore();

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const messages = activeConversation?.messages || [];
  const hasMessages = messages.length > 0;

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-brand-bg dark:bg-brand-darkBg">
      {/* Top Header */}
      <Header />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {hasMessages ? (
          <>
            <MessageList messages={messages} />
            <div className="w-full max-w-3xl mx-auto px-4 pb-5 pt-2">
              <Composer />
              <div className="text-center text-[11px] text-brand-muted/70 dark:text-brand-darkMuted/70 mt-2">
                NOVA can make mistakes. Please verify important information.
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col justify-between overflow-y-auto">
            <EmptyState onOpenImageGen={onOpenImageGen} />
            <div className="w-full max-w-2xl mx-auto px-4 pb-8">
              <Composer />
              <div className="text-center text-[11px] text-brand-muted/70 dark:text-brand-darkMuted/70 mt-2">
                NOVA can make mistakes. Please verify important information.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
