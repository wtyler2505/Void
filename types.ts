export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  tags: string[];
  attachments: Attachment[];
}

export interface Attachment {
  id: string;
  type: 'image' | 'video' | 'audio';
  url: string; // Data URL or Blob URL
  mimeType: string;
  thumbnailUrl?: string;
  metadata?: string; // e.g., prompt used
}

export type AppView = 'editor' | 'live';

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