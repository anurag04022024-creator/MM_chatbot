import { create } from 'zustand';
import { Conversation, Message, Attachment } from '../types/chat';
import {
  loadConversations,
  saveConversations,
  loadActiveConversationId,
  saveActiveConversationId,
} from '../lib/storage';
import { generateId } from '../lib/utils';
import { sendChatMessage } from '../lib/api';
import { useSettingsStore } from './useSettingsStore';

export interface ToastItem {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  selectedModel: string;
  isStreaming: boolean;
  streamingMessageId: string | null;
  currentStreamingText: string;
  currentReasoningText: string;
  abortController: AbortController | null;

  // Composer attachments & toggles
  attachments: Attachment[];
  webSearchActive: boolean;
  extendedThinkingActive: boolean;

  // Modals & UI states
  isSidebarOpen: boolean;
  isMobileDrawerOpen: boolean;
  isSearchOpen: boolean;
  lightboxAttachment: Attachment | null;
  toasts: ToastItem[];

  // Actions
  newChat: (model?: string) => void;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, newTitle: string) => void;
  togglePinConversation: (id: string) => void;
  setSelectedModel: (model: string) => void;

  toggleWebSearch: () => void;
  toggleExtendedThinking: () => void;
  addAttachment: (attachment: Attachment) => void;
  removeAttachment: (id: string) => void;
  clearAttachments: () => void;

  sendMessage: (text: string, customAttachments?: Attachment[]) => Promise<void>;
  stopStreaming: () => void;
  continueGenerating: (assistantMessageId: string) => Promise<void>;
  retryMessage: (assistantMessageId: string) => Promise<void>;
  regenerateMessage: (assistantMessageId: string) => Promise<void>;
  editUserMessage: (userMessageId: string, newContent: string) => Promise<void>;
  setMessageFeedback: (messageId: string, feedback: 'up' | 'down') => void;

  toggleSidebar: () => void;
  setMobileDrawerOpen: (open: boolean) => void;
  setIsSearchOpen: (open: boolean) => void;
  setLightboxAttachment: (attachment: Attachment | null) => void;

  addToast: (message: string, type?: 'info' | 'success' | 'error') => void;
  removeToast: (id: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => {
  const initialConversations = loadConversations();
  const initialActiveId = loadActiveConversationId();

  return {
    conversations: initialConversations,
    activeConversationId: initialActiveId && initialConversations.some((c) => c.id === initialActiveId)
      ? initialActiveId
      : initialConversations[0]?.id || null,
    selectedModel: 'nova-3.5-sonnet',
    isStreaming: false,
    streamingMessageId: null,
    currentStreamingText: '',
    currentReasoningText: '',
    abortController: null,

    attachments: [],
    webSearchActive: false,
    extendedThinkingActive: false,

    isSidebarOpen: true,
    isMobileDrawerOpen: false,
    isSearchOpen: false,
    lightboxAttachment: null,
    toasts: [],

    newChat: (model) => {
      const { isStreaming, abortController } = get();
      if (isStreaming && abortController) {
        abortController.abort();
      }
      set({
        activeConversationId: null,
        attachments: [],
        isStreaming: false,
        streamingMessageId: null,
        currentStreamingText: '',
        currentReasoningText: '',
        selectedModel: model || get().selectedModel,
      });
      saveActiveConversationId(null);
    },

    selectConversation: (id: string) => {
      const { isStreaming, abortController } = get();
      if (isStreaming && abortController) {
        abortController.abort();
      }
      set({
        activeConversationId: id,
        attachments: [],
        isStreaming: false,
        streamingMessageId: null,
        currentStreamingText: '',
        currentReasoningText: '',
        isMobileDrawerOpen: false,
      });
      saveActiveConversationId(id);
    },

    deleteConversation: (id: string) => {
      set((state) => {
        const filtered = state.conversations.filter((c) => c.id !== id);
        saveConversations(filtered);
        const nextActive = state.activeConversationId === id
          ? filtered[0]?.id || null
          : state.activeConversationId;
        saveActiveConversationId(nextActive);
        return {
          conversations: filtered,
          activeConversationId: nextActive,
        };
      });
      get().addToast('Conversation deleted', 'info');
    },

    renameConversation: (id: string, newTitle: string) => {
      if (!newTitle.trim()) return;
      set((state) => {
        const updated = state.conversations.map((c) =>
          c.id === id ? { ...c, title: newTitle.trim(), updatedAt: Date.now() } : c
        );
        saveConversations(updated);
        return { conversations: updated };
      });
      get().addToast('Conversation renamed', 'success');
    },

    togglePinConversation: (id: string) => {
      set((state) => {
        const updated = state.conversations.map((c) =>
          c.id === id ? { ...c, isPinned: !c.isPinned, updatedAt: Date.now() } : c
        );
        saveConversations(updated);
        return { conversations: updated };
      });
    },

    setSelectedModel: (selectedModel: string) => set({ selectedModel }),

    toggleWebSearch: () => set((s) => ({ webSearchActive: !s.webSearchActive })),
    toggleExtendedThinking: () => set((s) => ({ extendedThinkingActive: !s.extendedThinkingActive })),

    addAttachment: (attachment: Attachment) => {
      set((s) => {
        // Enforce max 10 images limit
        if (attachment.type === 'image') {
          const imageCount = s.attachments.filter((a) => a.type === 'image').length;
          if (imageCount >= 10) {
            get().addToast('Maximum 10 images allowed per message', 'error');
            return s;
          }
        }
        return { attachments: [...s.attachments, attachment] };
      });
    },

    removeAttachment: (id: string) => {
      set((s) => ({ attachments: s.attachments.filter((a) => a.id !== id) }));
    },

    clearAttachments: () => set({ attachments: [] }),

    toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
    setMobileDrawerOpen: (isMobileDrawerOpen: boolean) => set({ isMobileDrawerOpen }),
    setIsSearchOpen: (isSearchOpen: boolean) => set({ isSearchOpen }),
    setLightboxAttachment: (lightboxAttachment: Attachment | null) => set({ lightboxAttachment }),

    addToast: (message: string, type: 'info' | 'success' | 'error' = 'info') => {
      const id = generateId();
      set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
      setTimeout(() => {
        get().removeToast(id);
      }, 3500);
    },

    removeToast: (id: string) => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    },

    setMessageFeedback: (messageId: string, feedback: 'up' | 'down') => {
      set((state) => {
        const activeId = state.activeConversationId;
        if (!activeId) return state;

        const updatedConvs = state.conversations.map((conv) => {
          if (conv.id !== activeId) return conv;
          const updatedMessages = conv.messages.map((m) =>
            m.id === messageId ? { ...m, feedback: m.feedback === feedback ? undefined : feedback } : m
          );
          return { ...conv, messages: updatedMessages };
        });

        saveConversations(updatedConvs);
        return { conversations: updatedConvs };
      });
    },

    stopStreaming: () => {
      const { abortController } = get();
      if (abortController) {
        abortController.abort();
      }
      set({ isStreaming: false, abortController: null });
      get().addToast('Generation stopped', 'info');
    },

    sendMessage: async (text: string, customAttachments?: Attachment[]) => {
      const cleanText = text.trim();
      const attachmentsToSend = customAttachments || get().attachments;

      if (!cleanText && attachmentsToSend.length === 0) return;

      const {
        activeConversationId,
        conversations,
        selectedModel,
        webSearchActive,
        extendedThinkingActive,
      } = get();

      let targetConvId = activeConversationId;
      let currentConvs = [...conversations];

      // If no active conversation, create a new one
      if (!targetConvId) {
        const newTitle = cleanText ? (cleanText.length > 32 ? `${cleanText.slice(0, 32)}...` : cleanText) : 'New conversation';
        const newConv: Conversation = {
          id: generateId(),
          title: newTitle,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          model: selectedModel,
        };
        currentConvs = [newConv, ...currentConvs];
        targetConvId = newConv.id;
        saveActiveConversationId(targetConvId);
      }

      // Create user message
      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content: cleanText,
        timestamp: Date.now(),
        attachments: [...attachmentsToSend],
        webSearchUsed: webSearchActive,
      };

      // Create initial placeholder assistant message
      const assistantMessageId = generateId();
      const initialAssistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        modelUsed: selectedModel,
        isStreaming: true,
      };

      // Update conversation with user & placeholder assistant messages
      currentConvs = currentConvs.map((conv) => {
        if (conv.id === targetConvId) {
          return {
            ...conv,
            messages: [...conv.messages, userMessage, initialAssistantMessage],
            updatedAt: Date.now(),
          };
        }
        return conv;
      });

      saveConversations(currentConvs);

      const controller = new AbortController();

      set({
        conversations: currentConvs,
        activeConversationId: targetConvId,
        attachments: [], // reset composer attachments
        isStreaming: true,
        streamingMessageId: assistantMessageId,
        currentStreamingText: '',
        currentReasoningText: '',
        abortController: controller,
      });

      const activeConv = currentConvs.find((c) => c.id === targetConvId);
      const history = activeConv?.messages.slice(0, -1) || [];
      const userMaxTokens = useSettingsStore.getState().settings.maxTokens || 8192;

      try {
        const result = await sendChatMessage({
          prompt: cleanText,
          history,
          attachments: attachmentsToSend,
          model: selectedModel,
          maxTokens: userMaxTokens,
          extendedThinking: extendedThinkingActive,
          webSearch: webSearchActive,
          signal: controller.signal,
          onChunk: (chunk: string) => {
            set({ currentStreamingText: chunk });
          },
          onReasoning: (reasoning: string) => {
            set({ currentReasoningText: reasoning });
          },
        });

        // Finalize message on success
        set((state) => {
          const updatedConvs = state.conversations.map((conv) => {
            if (conv.id === targetConvId) {
              const updatedMessages = conv.messages.map((m) =>
                m.id === assistantMessageId
                  ? {
                      ...m,
                      content: result.content,
                      reasoning: result.reasoning,
                      finishReason: result.finishReason,
                      isStreaming: false,
                    }
                  : m
              );
              return { ...conv, messages: updatedMessages, updatedAt: Date.now() };
            }
            return conv;
          });

          saveConversations(updatedConvs);
          return {
            conversations: updatedConvs,
            isStreaming: false,
            streamingMessageId: null,
            currentStreamingText: '',
            currentReasoningText: '',
            abortController: null,
          };
        });
      } catch (err: any) {
        if (err.name === 'AbortError' || err.message?.includes('stopped')) {
          // Finalize what we have so far
          const partialText = get().currentStreamingText;
          const partialReasoning = get().currentReasoningText;
          set((state) => {
            const updatedConvs = state.conversations.map((conv) => {
              if (conv.id === targetConvId) {
                const updatedMessages = conv.messages.map((m) =>
                  m.id === assistantMessageId
                    ? {
                        ...m,
                        content: partialText || '*(Generation paused)*',
                        reasoning: partialReasoning || undefined,
                        isStreaming: false,
                      }
                    : m
                );
                return { ...conv, messages: updatedMessages, updatedAt: Date.now() };
              }
              return conv;
            });
            saveConversations(updatedConvs);
            return {
              conversations: updatedConvs,
              isStreaming: false,
              streamingMessageId: null,
              currentStreamingText: '',
              currentReasoningText: '',
              abortController: null,
            };
          });
        } else {
          // Set error message with retryable flag
          const partialText = get().currentStreamingText;
          set((state) => {
            const updatedConvs = state.conversations.map((conv) => {
              if (conv.id === targetConvId) {
                const updatedMessages = conv.messages.map((m) =>
                  m.id === assistantMessageId
                    ? {
                        ...m,
                        content: partialText || '',
                        error: err.message || 'Generation failed',
                        isStreaming: false,
                      }
                    : m
                );
                return { ...conv, messages: updatedMessages, updatedAt: Date.now() };
              }
              return conv;
            });
            saveConversations(updatedConvs);
            return {
              conversations: updatedConvs,
              isStreaming: false,
              streamingMessageId: null,
              currentStreamingText: '',
              currentReasoningText: '',
              abortController: null,
            };
          });
          get().addToast(`Error: ${err.message}`, 'error');
        }
      }
    },

    continueGenerating: async (assistantMessageId: string) => {
      const { conversations, activeConversationId, selectedModel, isStreaming } = get();
      if (isStreaming || !activeConversationId) return;

      const conv = conversations.find((c) => c.id === activeConversationId);
      if (!conv) return;

      const msgIdx = conv.messages.findIndex((m) => m.id === assistantMessageId);
      if (msgIdx === -1) return;

      const targetMsg = conv.messages[msgIdx];
      const previousContent = targetMsg.content;
      const history = conv.messages.slice(0, msgIdx);
      const controller = new AbortController();
      const userMaxTokens = useSettingsStore.getState().settings.maxTokens || 8192;

      set({
        isStreaming: true,
        streamingMessageId: assistantMessageId,
        currentStreamingText: previousContent,
        abortController: controller,
      });

      try {
        const result = await sendChatMessage({
          prompt: 'Continue generating exactly from where you left off. Do not repeat what was already written.',
          history: [
            ...history,
            { role: 'assistant', content: previousContent } as Message,
          ],
          model: selectedModel,
          maxTokens: userMaxTokens,
          signal: controller.signal,
          onChunk: (chunk: string) => {
            set({ currentStreamingText: previousContent + chunk });
          },
        });

        const fullContent = previousContent + (result.content || '');
        set((state) => {
          const updatedConvs = state.conversations.map((c) => {
            if (c.id === activeConversationId) {
              const updatedMessages = c.messages.map((m) =>
                m.id === assistantMessageId
                  ? {
                      ...m,
                      content: fullContent,
                      finishReason: result.finishReason,
                      isStreaming: false,
                    }
                  : m
              );
              return { ...c, messages: updatedMessages, updatedAt: Date.now() };
            }
            return c;
          });
          saveConversations(updatedConvs);
          return {
            conversations: updatedConvs,
            isStreaming: false,
            streamingMessageId: null,
            currentStreamingText: '',
            abortController: null,
          };
        });
      } catch (err: any) {
        set({
          isStreaming: false,
          streamingMessageId: null,
          currentStreamingText: '',
          abortController: null,
        });
        get().addToast(`Could not continue: ${err.message}`, 'error');
      }
    },

    retryMessage: async (assistantMessageId: string) => {
      return get().regenerateMessage(assistantMessageId);
    },

    regenerateMessage: async (assistantMessageId: string) => {
      const { activeConversationId, conversations } = get();
      if (!activeConversationId) return;

      const activeConv = conversations.find((c) => c.id === activeConversationId);
      if (!activeConv) return;

      const msgIndex = activeConv.messages.findIndex((m) => m.id === assistantMessageId);
      if (msgIndex <= 0) return;

      const userMsg = activeConv.messages[msgIndex - 1];
      if (userMsg.role !== 'user') return;

      // Remove assistant message and re-send
      const prunedMessages = activeConv.messages.slice(0, msgIndex);
      const updatedConvs = conversations.map((c) =>
        c.id === activeConversationId ? { ...c, messages: prunedMessages } : c
      );
      saveConversations(updatedConvs);
      set({ conversations: updatedConvs });

      await get().sendMessage(userMsg.content, userMsg.attachments);
    },

    editUserMessage: async (userMessageId: string, newContent: string) => {
      const { activeConversationId, conversations } = get();
      if (!activeConversationId) return;

      const activeConv = conversations.find((c) => c.id === activeConversationId);
      if (!activeConv) return;

      const msgIndex = activeConv.messages.findIndex((m) => m.id === userMessageId);
      if (msgIndex < 0) return;

      const originalUserMsg = activeConv.messages[msgIndex];

      // Truncate thread to before this message
      const prunedMessages = activeConv.messages.slice(0, msgIndex);
      const updatedConvs = conversations.map((c) =>
        c.id === activeConversationId ? { ...c, messages: prunedMessages } : c
      );
      saveConversations(updatedConvs);
      set({ conversations: updatedConvs });

      // Re-send with new text and original attachments
      await get().sendMessage(newContent, originalUserMsg.attachments);
    },
  };
});
