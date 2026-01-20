# 🛠️ 𝗦𝗘𝗥𝗩𝗜𝗖𝗘𝗦 & 𝗦𝗧𝗔𝗧𝗘

> *The Engine Room.*

## 1. 𝗦𝗧𝗢𝗥𝗘 (`store.ts`)

VOID uses a robust, tiered storage architecture to ensure data safety.

### IndexedDB (Level 1 - Primary)
*   **Database**: `void_db`
*   **Store**: `void_store`
*   **Key**: `void_notes_data`
*   **Behavior**: Asynchronous read/write. Capable of storing large Blobs (images/videos) which LocalStorage cannot handle. This is the **Source of Truth**.

### LocalStorage (Level 2 - Fallback/Cache)
*   **Key**: `void_notes_data`
*   **Behavior**: Synchronous. Used for fast initial load. However, due to the 5MB limit, it may fail if many images are generated. The system catches quota errors and defaults to IndexedDB transparently.

### Migration Logic
The `loadNotes()` function checks for legacy keys (`void_data`, `void_notes`) from previous versions of the app and automatically migrates them to the new structure upon boot.

## 2. 𝗚𝗘𝗠𝗜𝗡𝗜 𝗦𝗘𝗥𝗩𝗜𝗖𝗘 (`gemini.ts`)

This is the API abstraction layer. It initializes the `GoogleGenAI` client using `process.env.API_KEY`.

### Key Functions

*   `ensurePaidKey()`: Checks for `window.aistudio` bridge to handle API key selection in specific deployment environments (like Google AI Studio).
*   `generateImage(prompt)`: Implements a fallback strategy.
    1.  Attempts `gemini-3-pro-image-preview` (Higher quality).
    2.  If 403/Permission Denied, falls back to `gemini-2.5-flash-image`.
*   `generateVideo(prompt)`: Polling implementation. Calls `generateVideos`, then loops `getVideosOperation` until `done` is true.
*   `chatWithContext(...)`: The brain of the Chat Overlay.
    *   Constructs a massive system prompt containing the "Omnipotence" directives.
    *   Injects the `noteTools` definitions (`FunctionDeclaration`).
    *   Handles multi-turn recursion: If the model calls a tool, the client executes it, feeds the result back, and waits for the model's text response.

## 3. 𝗗𝗥𝗜𝗩𝗘 𝗦𝗘𝗥𝗩𝗜𝗖𝗘 (`drive.ts`)

Manages Google Drive API interactions for cloud sync.

*   **Auth**: Uses Google Identity Services (GIS) `google.accounts.oauth2`.
*   **Scope**: `https://www.googleapis.com/auth/drive.file` (Only access files created by the app).
*   **Backup File**: `void_notes_backup.json`.
*   **Logic**:
    *   `checkForBackup`: Searches for the specific filename.
    *   `uploadBackup`: Uses Multipart upload to send JSON metadata + content. Updates existing ID if found, creates new if not.

---
*Service Layer Analysis Complete.*