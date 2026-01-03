import { Note } from '../types';

const STORAGE_KEY = 'void_data';

export const saveNotes = (notes: Note[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (e) {
    console.error("Failed to save notes", e);
  }
};

export const loadNotes = (): Note[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load notes", e);
    return [];
  }
};

export const createBlobFromBase64 = (base64: string, mimeType: string) => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};