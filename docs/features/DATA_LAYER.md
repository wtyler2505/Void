# 💾 𝗗𝗔𝗧𝗔 𝗟𝗔𝗬𝗘𝗥

> *Memory Persistence Banks.*

## 1. 𝗦𝗖𝗛𝗘𝗠𝗔

### The `Note` Object
```typescript
interface Note {
  id: string;          // UUID
  title: string;       // Text
  content: string;     // Markdown Text
  createdAt: number;   // Timestamp
  updatedAt: number;   // Timestamp
  tags: string[];      // Array of strings
  attachments: Attachment[]; // Array of media objects
  pinned?: boolean;
  archived?: boolean;
  archivedAt?: number;
}
```

### The `Attachment` Object
```typescript
interface Attachment {
  id: string;
  type: 'image' | 'video' | 'audio';
  url: string;         // Base64 string (Image) or Blob URL (Video)
  mimeType: string;    // e.g. 'image/png'
  metadata?: string;   // Generation prompt
}
```

## 2. 𝗜𝗡𝗗𝗘𝗫𝗘𝗗 𝗗𝗕 (𝗦𝗢𝗨𝗥𝗖𝗘 𝗢𝗙 𝗧𝗥𝗨𝗧𝗛)

Because AI-generated images and videos are large, `LocalStorage` (5MB limit) is insufficient. VOID uses **IndexedDB**.

*   **DB Name**: `void_db`
*   **Store**: `void_store`
*   **Key**: `void_notes_data`
*   **Format**: The entire `notes` array is serialized and stored as a single entry. While not efficient for 10,000+ notes, it is extremely simple for state management (load all, save all).

## 3. 𝗦𝗬𝗡𝗖 (𝗚𝗢𝗢𝗚𝗟𝗘 𝗗𝗥𝗜𝗩𝗘)

**File**: `services/drive.ts`

The app creates a specific file: `void_notes_backup.json` in the user's Google Drive.

### Auth Flow
1.  **GIS**: Google Identity Services (`google.accounts.oauth2`) requests `https://www.googleapis.com/auth/drive.file`.
2.  **Scope**: `drive.file` ensures the app *only* sees files it created, protecting user privacy.

### Sync Logic (Manual)
*   **Push**: Serializes current `notes` array -> JSON Blob -> Multipart Upload (PATCH if exists, POST if new).
*   **Pull**: GET file content -> JSON Parse -> Replace local state.
*   **Conflict Resolution**: Currently "Last Write Wins" based on user manual action (Push vs Pull).

---
*Persistence Systems Active.*