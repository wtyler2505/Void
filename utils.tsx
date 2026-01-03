import { Note } from './types';
import { v4 as uuidv4 } from 'uuid'; // Simplified UUID generator since no ext lib

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export const createNewNote = (): Note => ({
  id: uuid(),
  title: 'Void Entry',
  content: '',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  tags: [],
  attachments: []
});

export const formatTime = (ms: number) => {
  return new Date(ms).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};