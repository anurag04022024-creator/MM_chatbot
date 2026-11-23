import Dexie, { type Table } from 'dexie';
import { Conversation, Message, Attachment } from '../types/chat';

export interface ArtifactItem {
  id: string;
  title: string;
  type: 'code' | 'html' | 'diagram' | 'document' | 'chart';
  language?: string;
  content: string;
  versions: string[];
  currentVersionIndex: number;
  createdAt: number;
  conversationId?: string;
}

export interface LibraryItem {
  id: string;
  type: 'image' | 'audio' | 'document';
  url: string;
  name: string;
  prompt?: string;
  aspectRatio?: string;
  style?: string;
  createdAt: number;
  size?: number;
}

export interface MemoryFact {
  id: string;
  fact: string;
  category: 'preference' | 'personal' | 'work' | 'technical';
  createdAt: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  knowledgeFiles: string[];
  createdAt: number;
}

export class NovaDatabase extends Dexie {
  conversations!: Table<Conversation, string>;
  artifacts!: Table<ArtifactItem, string>;
  library!: Table<LibraryItem, string>;
  memories!: Table<MemoryFact, string>;
  projects!: Table<Project, string>;

  constructor() {
    super('NovaDatabase_v2');
    this.version(1).stores({
      conversations: 'id, title, isPinned, createdAt, updatedAt',
      artifacts: 'id, title, type, createdAt, conversationId',
      library: 'id, type, createdAt',
      memories: 'id, category, createdAt',
      projects: 'id, name, createdAt',
    });
  }
}

export const db = new NovaDatabase();
