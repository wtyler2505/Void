import { Note } from '../types';

const DB_NAME = 'void_db';
const STORE_NAME = 'void_store';
const DB_VERSION = 1;
const IDB_KEY = 'void_notes_data';
const LS_KEY = 'void_notes_data';
const LEGACY_KEYS = ['void_data', 'void_notes']; // Keys from potential previous versions

// Helper to open DB
const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });
};

export const saveNotes = async (notes: Note[]) => {
    // 1. Try LocalStorage (Fast backup, might fail if full)
    try {
        localStorage.setItem(LS_KEY, JSON.stringify(notes));
    } catch (e) {
        // Quota exceeded is common for image-heavy notes. We ignore this 
        // because IndexedDB is the source of truth for large data.
        console.warn("LocalStorage quota exceeded. Data saved to IndexedDB only.");
    }

    // 2. Save to IndexedDB (Robust, unlimited storage)
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        
        store.put(notes, IDB_KEY);
        
        return new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (e) {
        console.error("CRITICAL: Failed to save notes to IndexedDB", e);
    }
};

export const loadNotes = async (): Promise<Note[]> => {
    let notes: Note[] | null = null;

    // 1. Try IndexedDB first (Source of Truth)
    try {
        const db = await openDB();
        notes = await new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.get(IDB_KEY);

            request.onsuccess = () => {
                const result = request.result as Note[];
                resolve(result || null);
            };
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.warn("IndexedDB load failed, attempting fallbacks", e);
    }

    // 2. Fallback: LocalStorage (If IDB was empty or failed)
    if (!notes || notes.length === 0) {
        const local = localStorage.getItem(LS_KEY);
        if (local) {
            try {
                notes = JSON.parse(local);
                // Self-Heal: Propagate from LS to IDB for next time
                if (notes && notes.length > 0) {
                    saveNotes(notes);
                }
            } catch (err) {
                console.error("LocalStorage parse error", err);
            }
        }
    }

    // 3. Migration: Check Legacy Keys
    if (!notes || notes.length === 0) {
        for (const key of LEGACY_KEYS) {
            const legacy = localStorage.getItem(key);
            if (legacy) {
                try {
                    notes = JSON.parse(legacy);
                    if (notes && notes.length > 0) {
                        saveNotes(notes); // Migrate to new system
                        break; // Found data, stop looking
                    }
                } catch (err) {
                    console.error(`Migration failed for key ${key}`, err);
                }
            }
        }
    }

    return notes || [];
};

export const createBlobFromBase64 = (base64: string, mimeType: string) => {
  try {
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      return new Blob([byteArray], { type: mimeType });
  } catch (e) {
      console.error("Blob creation failed", e);
      return new Blob([], { type: mimeType });
  }
};