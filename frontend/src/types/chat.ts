export type AttachmentType = 'image' | 'audio' | 'document';

export interface Attachment {
  id: string;
  name: string;
  type: AttachmentType;
  mimeType: string;
  size: number;
  url: string; // Object URL or data URI
  base64?: string; // Pure or data URL base64 for server delivery
  extractedText?: string; // Text extracted from documents
  transcript?: string; // Audio transcription
  duration?: number; // for audio in seconds
  thumbnailUrl?: string; // for image
  waveformData?: number[]; // simulated or extracted waveform
}

export interface MessageAction {
  type: 'copy' | 'retry' | 'feedback_up' | 'feedback_down' | 'edit';
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  reasoning?: string; // for extended thinking
  isStreaming?: boolean;
  error?: string;
  finishReason?: string; // e.g. 'MAX_TOKENS' or 'STOP'
  modelUsed?: string;
  webSearchUsed?: boolean;
  feedback?: 'up' | 'down';
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean;
  model: string;
  systemPrompt?: string;
}

export interface ModelOption {
  id: string;
  name: string;
  provider: string;
  description: string;
  badge?: string;
  contextWindow?: string;
}

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: 'nova-3.5-sonnet',
    name: 'NOVA 3.5 Sonnet',
    provider: 'Nova Intelligence',
    description: 'Most intelligent & articulate model for coding, analysis, and creative writing',
    badge: 'Recommended',
    contextWindow: '200k tokens',
  },
  {
    id: 'nova-3.5-haiku',
    name: 'NOVA 3.5 Haiku',
    provider: 'Nova Intelligence',
    description: 'Lightning-fast model for everyday tasks and quick inquiries',
    badge: 'Fast',
    contextWindow: '200k tokens',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google via Backend',
    description: 'High-speed multimodal intelligence with deep reasoning',
    badge: 'Multimodal',
    contextWindow: '1M tokens',
  },
  {
    id: 'nova-3-opus',
    name: 'NOVA 3 Opus',
    provider: 'Nova Intelligence',
    description: 'Deep nuance and synthesis for highly complex writing and research',
    badge: 'Pro',
    contextWindow: '200k tokens',
  },
];
