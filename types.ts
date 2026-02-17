export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  tags: string[];
  attachments: Attachment[];
  pinned?: boolean;
  archived?: boolean;
  archivedAt?: number;
  trashedAt?: number;
  reminder?: number;
  status?: 'todo' | 'in_progress' | 'done';
  folderId?: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: number;
}

export interface NoteVersion {
  timestamp: number;
  title: string;
  content: string;
}

export interface Attachment {
  id: string;
  type: 'image' | 'video' | 'audio';
  url: string; // Data URL or Blob URL
  mimeType: string;
  thumbnailUrl?: string;
  metadata?: string; // e.g., prompt used
}

export type AppView = 'editor' | 'live' | 'kanban' | 'calendar';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
    placeAnswerSources?: any[];
  };
}