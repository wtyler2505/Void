# ◆ VOID — SERVICES & STATE MANAGEMENT

> *"Beneath every interface lies a service. Beneath every service lies the void."*

---

## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
## ██ SECTION 0 — SERVICE LAYER OVERVIEW ██
## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

The service layer is the engine room of VOID. Four files, zero UI, pure business logic:

```
services/
├── store.ts      (172 LOC) ─── Persistence: IndexedDB + localStorage dual-write
├── gemini.ts     (657 LOC) ─── AI: ALL Gemini API interactions, 16 tool declarations
├── drive.ts      (125 LOC) ─── Cloud: Google Drive OAuth + backup CRUD
└── shortcuts.ts  (85 LOC)  ─── Input: Global keyboard shortcut management
```

**Design Principles:**
- Services are **stateless** — no module-level mutable state (except `drive.ts` which tracks OAuth init)
- Services are **pure functions** or **async functions** — no React hooks, no side effects beyond their domain
- Services **never import components** — the dependency arrow is one-way: components → services
- Exception: `shortcuts.ts` exports a React hook (`useGlobalShortcuts`) because it manages event listener lifecycle

---

## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
## ██ SECTION 1 — store.ts: PERSISTENCE ██
## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

### ◆ Constants

```typescript
const DB_NAME = 'void_db';
const STORE_NAME = 'void_store';
const VERSION_STORE = 'void_versions';
const DB_VERSION = 2;
const IDB_KEY = 'void_notes_data';
const LS_KEY = 'void_notes_data';
const LEGACY_KEYS = ['void_data', 'void_notes'];
const MAX_VERSIONS_PER_NOTE = 50;
```

### ◆ IndexedDB Schema

```
Database: void_db (version 2)
│
├── Object Store: "void_store"
│   ├── No keyPath (out-of-line keys)
│   ├── Single key used: "void_notes_data"
│   └── Value: Note[] (full array of all notes)
│
└── Object Store: "void_versions"
    ├── No keyPath (out-of-line keys)
    ├── Keys: noteId strings (one per note)
    └── Values: NoteVersion[] (array of snapshots, max 50)
```

The `onupgradeneeded` handler creates both stores if they don't exist. This fires on DB_VERSION change (currently version 2, meaning the versions store was added in an upgrade from version 1).

### ◆ Exported Functions

#### `saveNotes(notes: Note[]): Promise<void>`

Dual-write strategy — writes to both stores on every call:

```
1. localStorage.setItem(LS_KEY, JSON.stringify(notes))
   └── try/catch: silently warn on QuotaExceededError
       (common when notes contain large base64 image attachments)

2. IndexedDB transaction('readwrite')
   └── store.put(notes, IDB_KEY)
   └── await tx.oncomplete
   └── catch: console.error("CRITICAL: Failed to save notes to IndexedDB")
```

**Called from:**
- `App.tsx` useEffect (debounced 800ms after any notes change)
- `App.tsx` beforeunload handler (force save on page close)
- `loadNotes()` self-heal path (when migrating data between stores)

#### `loadNotes(): Promise<Note[]>`

Three-tier fallback loading strategy:

```
Tier 1: IndexedDB.get(IDB_KEY)
  ├── Found + non-empty → return it
  └── Empty/failed → Tier 2

Tier 2: localStorage.getItem(LS_KEY)
  ├── Found + parseable + non-empty → return it + self-heal to IDB
  └── Not found/parse error → Tier 3

Tier 3: Legacy key migration
  ├── For each key in ['void_data', 'void_notes']:
  │   ├── Found + parseable + non-empty → return it + migrate to new system
  │   └── Not found → continue
  └── Return []
```

**Self-heal behavior**: When data is found in localStorage or legacy keys but not in IndexedDB, the function automatically calls `saveNotes()` to propagate the data to IndexedDB for future loads.

#### `saveNoteVersion(noteId: string, title: string, content: string): Promise<void>`

Saves a version history snapshot for a specific note:

```
1. Open IndexedDB, read existing versions for noteId
2. Dedup check: if latest version.content === content → return early (no save)
3. Create NoteVersion: { timestamp: Date.now(), title, content }
4. Append to array, trim to last 50: [...existing, newVersion].slice(-50)
5. store.put(versions, noteId)
```

**Called from:**
- `App.tsx` handleUpdateNote (30-second debounced timeout)
- `App.tsx` Ctrl+S handler (immediate snapshot)

#### `loadNoteVersions(noteId: string): Promise<NoteVersion[]>`

Simple IndexedDB read: `store.get(noteId)` from `void_versions` store. Returns `[]` on any error.

**Called from:** `Editor.tsx` when user opens the version history panel.

#### `createBlobFromBase64(base64: string, mimeType: string): Blob`

Utility for converting base64-encoded media (from Gemini API responses) into Blob objects for display. Handles the decode → byte array → Blob pipeline. Returns empty Blob on decode errors.

### ◆ Error Handling Philosophy

- **localStorage failures** are non-critical (warn only) — IndexedDB is source of truth
- **IndexedDB failures** are critical (error logged) — but the app continues functioning with in-memory state
- **Migration failures** are logged per-key but don't halt the boot process
- **Version save failures** are logged but don't affect note content saving

---

## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
## ██ SECTION 2 — gemini.ts: AI ENGINE ██
## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

### ◆ Client Initialization

```typescript
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });
```

A new client is created on **every call**. This is intentional — the `@google/genai` SDK is lightweight and this avoids stale connection issues.

`process.env.API_KEY` is injected at build time by Vite's `define` config:
```typescript
define: {
    'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
}
```

### ◆ Paid Key Detection: `ensurePaidKey()`

```typescript
const ensurePaidKey = async () => {
  if ((window as any).aistudio?.hasSelectedApiKey) {
    const hasKey = await (window as any).aistudio.hasSelectedApiKey();
    if (!hasKey) await (window as any).aistudio.openSelectKey();
  }
  return true;
};
```

Called before `generateImage()` and `generateVideo()`. When running inside Google AI Studio, this ensures the user has selected a paid API key capable of image/video generation. Falls through silently in other environments.

### ◆ Complete Function Reference

#### `transcribeAudio(audioBlob: Blob): Promise<string>`
- **Model**: `gemini-2.5-flash-native-audio-preview-12-2025`
- **Input**: Raw audio Blob (from MediaRecorder)
- **Process**: Convert Blob → base64 → inline data part + "Transcribe" text prompt
- **Output**: Transcribed text string
- **Used by**: Editor.tsx voice recording feature

#### `summarizeNote(content: string, thinking = false): Promise<string>`
- **Model**: `gemini-3-flash-preview` (fast) or `gemini-3-pro-preview` (thinking)
- **Config**: If thinking, sets `thinkingConfig: { thinkingBudget: 32768 }`
- **Prompt**: "Summarize the following note into a concise, structured format with key points and tasks"
- **Output**: Structured summary text
- **Used by**: Editor.tsx summarize toolbar button

#### `generateTitle(content: string): Promise<string>`
- **Model**: `gemini-3-flash-preview`
- **Guard**: Returns "Void Entry" if content < 5 chars
- **Prompt**: "Generate a very short, punchy, cyberpunk-style title (max 5 words)"
- **Input truncation**: First 1000 chars of content
- **Output**: Title string (trimmed)
- **Used by**: Editor.tsx auto-title effect (2s debounce after content change)

#### `fastEnhance(content: string): Promise<string>`
- **Model**: `gemini-flash-lite-latest` (cheapest, fastest)
- **Prompt**: "Fix grammar, improve flow, and format this text (Markdown)"
- **Output**: Enhanced content (falls back to original on error)
- **Used by**: Editor.tsx enhance toolbar button

#### `generateImagePrompt(content: string): Promise<string>`
- **Model**: `gemini-3-flash-preview`
- **Guard**: Returns "Abstract cyberpunk concept" if no content
- **Prompt**: "Read this note and create a vivid, artistic visual description... Max 25 words"
- **Input truncation**: First 1500 chars of content
- **Output**: Art prompt string
- **Used by**: Editor.tsx "Visualize" feature (generates prompt → feeds to generateImage)

#### `generateImage(prompt: string, aspectRatio = "1:1"): Promise<string>`
- **Primary model**: `gemini-3-pro-image-preview`
- **Fallback model**: `gemini-2.5-flash-image` (if primary fails)
- **Paid key check**: Calls `ensurePaidKey()` before generation
- **Config**: `imageConfig: { aspectRatio }` (e.g., "1:1", "16:9")
- **Output**: Data URL (`data:image/png;base64,...`)
- **Error recovery**: On PERMISSION_DENIED, opens AI Studio key selector
- **Used by**: Editor.tsx image generation, ChatOverlay tool executor, App.tsx fusion

#### `editImage(imageUrl: string, instruction: string): Promise<string>`
- **Model**: `gemini-2.5-flash-image`
- **Process**: Fetch image URL → Blob → base64 → send with instruction text
- **Output**: Data URL of edited image
- **Used by**: Editor.tsx image editing feature

#### `analyzeVideo(videoUrl: string): Promise<string>`
- **Model**: `gemini-3-pro-preview`
- **Process**: Fetch video → Blob → base64 → inline data with analysis prompt
- **Prompt**: "Analyze this video. Provide a concise summary and list key timestamps/highlights"
- **Output**: Analysis text
- **Used by**: Editor.tsx video analysis feature

#### `generateVideo(prompt: string, imageBlob?: Blob): Promise<string>`
- **Model**: `veo-3.1-fast-generate-preview`
- **Paid key check**: Calls `ensurePaidKey()` before generation
- **Config**: `numberOfVideos: 1, resolution: '720p', aspectRatio: '9:16'`
- **Optional image input**: If provided, sends as `imageBytes` for image-to-video
- **Polling**: Checks operation status every 5 seconds until `operation.done`
- **Download**: Fetches video blob via `${uri}&key=${API_KEY}`
- **Output**: Blob URL (`URL.createObjectURL(blob)`)
- **Used by**: Editor.tsx video generation, ChatOverlay tool executor

#### `textToSpeech(text: string): Promise<ArrayBuffer>`
- **Model**: `gemini-2.5-flash-preview-tts`
- **Config**: `responseModalities: [Modality.AUDIO]`, voice: `Fenrir`
- **Output**: Raw audio ArrayBuffer (for Web Audio API playback)
- **Playback**: Caller creates AudioContext(sampleRate: 24000) → decodeAudioData → play
- **Used by**: ChatOverlay `speak_text` tool, Editor.tsx TTS feature

#### `fuseConcepts(noteA: string, noteB: string): Promise<{title, content, imagePrompt}>`
- **Model**: `gemini-3-pro-preview` with `thinkingConfig: { thinkingBudget: 2048 }`
- **Prompt**: "You are a conceptual alchemist. FUSE these two disparate notes..."
- **Output format**: Parsed from text using regex:
  - `TITLE: [Title]`
  - `CONTENT: [Content]`
  - `VISUAL: [Visual Prompt]`
- **Fallback values**: "Fusion Artifact", raw text, "Abstract digital fusion of concepts"
- **Used by**: App.tsx `handleFuseNotes` (triggered from Sidebar or ChatOverlay)

#### `findRelatedNotes(currentNoteId, currentContent, allNotes): Promise<RelatedNoteResult[]>`
- **Model**: `gemini-3-flash-preview` with `responseMimeType: 'application/json'`
- **Preparation**: Filters out current note, truncates each candidate to 500 chars
- **Input truncation**: Current content truncated to 1000 chars
- **Prompt**: Asks AI to identify up to 5 thematically related notes with scores and reasons
- **Output**: `Array<{ noteId: string, relevanceScore: number, reason: string }>`
- **Used by**: Editor.tsx "Haunt" panel (Related Notes discovery)

#### `chatWithContext(history, message, context, grounding, location?, toolExecutor?): Promise<{text, groundingChunks?}>`

The crown jewel — full conversational AI with function calling.

**Parameters:**
- `history: any[]` — Previous chat turns in Gemini format
- `message: string` — Current user message
- `context: string` — Active note + vault intelligence context
- `grounding: 'search' | 'maps' | 'none'` — External grounding mode
- `location?: {lat, lng}` — GPS coordinates for maps grounding
- `toolExecutor?: (name, args) => Promise<any>` — Callback to execute function calls

**System Instruction** (condensed):
```
You are VOID OS, the central intelligence integrated into the user's neural
note-taking environment. You have FULL CONTROL over the application state,
data, and multimedia generation.

CORE DIRECTIVES:
1. OMNIPOTENCE: Create, Read, Update, Delete, Archive, and Fuse notes
2. NAVIGATION: Switch views and active notes
3. MULTIMEDIA: Generate images and videos directly into notes
4. VOICE: Speak to the user using TTS
5. FUSION: Synthesize concepts between notes

BEHAVIOR: Concise, efficient, slightly cryptic/cyberpunk in tone.
```

**Function Calling Loop:**
```
Send message → response
│
├── Has functionCalls? (max 5 iterations)
│     ├── Execute each via toolExecutor(name, args)
│     ├── Wrap results: { functionResponse: { name, response: { result } } }
│     ├── Send responses back to chat
│     └── Get new response → repeat check
│
└── No functionCalls → return { text, groundingChunks }
```

### ◆ All 16 Function Declarations

```typescript
const noteTools: FunctionDeclaration[] = [
  // === CONTENT MANIPULATION (Contextual — require active note) ===
  {
    name: 'update_title',
    parameters: {
      properties: { title: { type: STRING } },
      required: ['title']
    }
  },
  {
    name: 'update_content',
    parameters: {
      properties: { content: { type: STRING } },
      required: ['content']
    }
  },
  {
    name: 'append_content',
    parameters: {
      properties: { text: { type: STRING } },
      required: ['text']
    }
  },
  {
    name: 'manage_tags',
    parameters: {
      properties: {
        action: { type: STRING, enum: ['add', 'remove'] },
        tags: { type: ARRAY, items: { type: STRING } }
      },
      required: ['action', 'tags']
    }
  },
  {
    name: 'generate_image_attachment',
    parameters: {
      properties: { prompt: { type: STRING } },
      required: ['prompt']
    }
  },
  {
    name: 'generate_video_attachment',
    parameters: {
      properties: { prompt: { type: STRING } },
      required: ['prompt']
    }
  },

  // === VAULT NAVIGATION (Global — no active note needed) ===
  {
    name: 'search_notes',
    parameters: {
      properties: { query: { type: STRING } },
      required: ['query']
    }
  },
  {
    name: 'read_note',
    parameters: {
      properties: { noteId: { type: STRING } },
      required: ['noteId']
    }
  },
  {
    name: 'switch_note',
    parameters: {
      properties: { noteId: { type: STRING } },
      required: ['noteId']
    }
  },
  {
    name: 'create_note',
    parameters: {
      properties: {
        title: { type: STRING },
        content: { type: STRING },
        tags: { type: ARRAY, items: { type: STRING } }
      },
      required: ['title']
    }
  },

  // === VAULT MANAGEMENT (Global) ===
  {
    name: 'batch_update_tags',
    parameters: {
      properties: {
        action: { type: STRING, enum: ['rename', 'delete'] },
        oldTag: { type: STRING },
        newTag: { type: STRING }
      },
      required: ['action', 'oldTag']
    }
  },
  {
    name: 'archive_note',
    parameters: {
      properties: { noteId: { type: STRING } },
      required: ['noteId']
    }
  },
  {
    name: 'delete_note',
    parameters: {
      properties: { noteId: { type: STRING } },
      required: ['noteId']
    }
  },
  {
    name: 'fuse_notes',
    parameters: {
      properties: {
        sourceId: { type: STRING },
        targetId: { type: STRING }
      },
      required: ['sourceId', 'targetId']
    }
  },

  // === INTERFACE CONTROL (Global) ===
  {
    name: 'speak_text',
    parameters: {
      properties: { text: { type: STRING } },
      required: ['text']
    }
  },
  {
    name: 'change_view',
    parameters: {
      properties: {
        view: { type: STRING, enum: ['editor', 'live'] }
      },
      required: ['view']
    }
  }
];
```

### ◆ Helper: `blobToBase64(blob: Blob): Promise<string>`

Internal utility using FileReader to convert Blob to base64 string (without the `data:` prefix). Used by all functions that need to send binary data to the Gemini API.

---

## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
## ██ SECTION 3 — drive.ts: CLOUD SYNC ██
## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

### ◆ Constants

```typescript
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
const BACKUP_FILENAME = 'void_notes_backup.json';
```

### ◆ Module-Level State

```typescript
let tokenClient: any;       // Google OAuth token client instance
let gapiInited = false;      // Whether GAPI client library is initialized
let gisInited = false;       // Whether Google Identity Services is initialized
```

This is the only service with module-level mutable state, necessary because Google's GAPI/GIS libraries require initialization once per page load.

### ◆ External Dependencies

Two scripts loaded in `index.html` (async defer):
```html
<script src="https://accounts.google.com/gsi/client"></script>
<script src="https://apis.google.com/js/api.js"></script>
```

These provide `window.google` (GIS) and `window.gapi` (GAPI Client Library).

### ◆ Exported Functions

#### `initDriveApi(clientId: string): Promise<boolean>`

Initializes both GAPI and GIS:

```
1. gapi.load('client', callback)
2. await gapi.client.init({ clientId, discoveryDocs })
3. google.accounts.oauth2.initTokenClient({ client_id, scope, callback: '' })
4. Set gapiInited = true, gisInited = true
5. Resolve with true
```

**Errors**: Rejects if `window.gapi` or `window.google` are not loaded.

#### `authenticate(): Promise<void>`

Requests an OAuth access token from Google:

```
1. Check tokenClient exists (else reject)
2. Set tokenClient.callback to resolve/reject promise
3. Call tokenClient.requestAccessToken({ prompt: '' })
   └── Empty prompt = silent auth if token exists, consent screen if first time
```

#### `checkForBackup(): Promise<{ id: string, modifiedTime: string } | null>`

Queries Google Drive for existing backup file:

```
gapi.client.drive.files.list({
    q: "name = 'void_notes_backup.json' and trashed = false",
    fields: 'files(id, modifiedTime)',
    spaces: 'drive'
})
```

Returns file metadata if found, `null` if no backup exists.

#### `downloadBackup(fileId: string): Promise<Note[]>`

Downloads and parses the backup file:

```
gapi.client.drive.files.get({
    fileId: fileId,
    alt: 'media'     // Returns file content, not metadata
})
```

Returns parsed `Note[]` directly from `response.result`.

#### `uploadBackup(notes: Note[], fileId?: string): Promise<void>`

Creates or updates the backup file using multipart upload:

```
1. Serialize notes to JSON string
2. Create Blob with application/json MIME type
3. Build FormData with metadata blob + file blob
4. Determine URL:
   ├── fileId exists → PATCH to /files/{fileId} (update)
   └── No fileId    → POST to /files (create new)
5. Fetch with Authorization: Bearer {access_token}
6. Throw on non-OK response
```

### ◆ OAuth Flow (User Perspective)

```
User enters Google Cloud Client ID in SyncModal
        │
        ▼
  Click "Connect & Sync"
        │
        ├── initDriveApi(clientId) — Initialize GAPI + GIS
        │
        ├── authenticate() — OAuth consent screen
        │     └── User grants drive.file permission
        │
        ├── checkForBackup() — Look for existing void_notes_backup.json
        │     ├── Found → Show last modified time, enable Pull button
        │     └── Not found → Show "No backup found"
        │
        └── User clicks:
              ├── "PUSH Local to Cloud" → uploadBackup(notes, fileId?)
              └── "PULL Cloud to Local" → downloadBackup(fileId)
                    └── confirm("OVERWRITE local notes?")
                          └── onImport(cloudNotes) → replaces notes state
```

---

## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
## ██ SECTION 4 — shortcuts.ts: KEYBOARD ██
## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

### ◆ Interface

```typescript
interface ShortcutHandlers {
  onNewNote: () => void;
  onSave: () => void;
  onFocusSearch: () => void;
  onArchiveNote: () => void;
  onDeleteForever: () => void;
  onSwitchNote: (index: number) => void;
  onEscape: () => void;
  onShowShortcuts: () => void;
  onExport: () => void;
  onCommandPalette: () => void;
}
```

### ◆ Hook: `useGlobalShortcuts(handlers: ShortcutHandlers)`

Single `useEffect` that attaches/detaches a `keydown` listener on `window`.

**Event Filtering Logic:**

```typescript
const handleKeyDown = (e: KeyboardEvent) => {
    // TIER 1: Escape always fires (for closing modals)
    if (e.key === 'Escape') {
        handlers.onEscape();
        return;
    }

    // TIER 2: Check if user is typing in an input field
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
    const isCtrlOrMeta = e.ctrlKey || e.metaKey;

    // If typing in input WITHOUT Ctrl/Meta → don't intercept (let them type)
    if (isInput && !isCtrlOrMeta) return;

    // TIER 3: Ctrl/Meta combos (work even in input fields)
    if (isCtrlOrMeta) {
        switch (e.key.toLowerCase()) {
            case 'n': → onNewNote
            case 's': → onSave
            case 'k': → onCommandPalette
            case 'f': → onFocusSearch
            case 'e': → if (e.shiftKey) onExport  // Ctrl+Shift+E
            case 'delete'/'backspace':
                → if (e.shiftKey) onDeleteForever  // Ctrl+Shift+Del
                → else onArchiveNote               // Ctrl+Del
            case '/': → onShowShortcuts
            default:
                → if (parseInt(key) in 1-9) onSwitchNote(num - 1)
        }
    }
};
```

**Key Design Decisions:**
- All shortcuts use `e.preventDefault()` to stop browser defaults (e.g., Ctrl+S won't trigger browser save dialog)
- The hook re-attaches the listener whenever `handlers` changes (dependency array: `[handlers]`)
- `onSwitchNote` receives a 0-indexed value (user presses 1 → `onSwitchNote(0)`)

---

## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
## ██ SECTION 5 — APP.tsx: STATE HUB ██
## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

App.tsx is the state orchestrator — ~300 lines of state declarations, callbacks, effects, and the main render tree. No state library. Pure React.

### ◆ State Categories

**1. Core Data State**
```typescript
const [notes, setNotes] = useState<Note[]>([]);           // All notes
const [activeNoteId, setActiveNoteId] = useState<string | null>(() =>
    localStorage.getItem('void_active_note')
);
const [folders, setFolders] = useState<Folder[]>(() =>
    JSON.parse(localStorage.getItem('void_folders') || '[]')
);
const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
const [splitNoteId, setSplitNoteId] = useState<string | null>(null);
```

**2. View State**
```typescript
const [view, setView] = useState<AppView>('editor');
const [isStorageReady, setIsStorageReady] = useState(false);
```

**3. UI State (Modals/Overlays)**
```typescript
const [isChatOpen, setIsChatOpen] = useState(false);
const [isSyncOpen, setIsSyncOpen] = useState(false);
const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
const [isExportOpen, setIsExportOpen] = useState(false);
const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
const [isSidebarOpen, setIsSidebarOpen] = useState(false);
```

**4. Effect State (Animations)**
```typescript
const [isFusing, setIsFusing] = useState(false);       // Neural Fusion overlay
const [isGenesis, setIsGenesis] = useState(false);      // Genesis flash (2s timeout)
```

**5. Quick Capture State**
```typescript
const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
const [quickCaptureTitle, setQuickCaptureTitle] = useState('Quick Note');
const [quickCaptureContent, setQuickCaptureContent] = useState('');
```

**6. Sidebar State**
```typescript
const [sidebarWidth, setSidebarWidth] = useState<number>(() =>
    parseInt(localStorage.getItem('void_sidebar_width') || '320', 10)
);
const [showOnboarding, setShowOnboarding] = useState(() =>
    !localStorage.getItem('void_onboarding_done')
);
```

### ◆ Refs (Why and When)

| Ref | Why not useState? |
|---|---|
| `notesRef = useRef(notes)` | Async callbacks (beforeunload, setInterval) would capture stale state. Ref always has latest. Updated via `useEffect(() => { notesRef.current = notes }, [notes])` |
| `isResizingRef = useRef(false)` | Resize drag state changes rapidly during mouse movement. useState would cause re-renders on every pixel. Ref avoids this. |
| `startXRef / startWidthRef` | Same reason — used in mousemove handler, no render needed |
| `versionSaveRef = useRef(timeout)` | Stores timeout ID for version save debouncing. Cleared/reset in handleUpdateNote. |

### ◆ Key Callbacks (useCallback)

All major handlers are wrapped in `useCallback` to maintain referential stability and prevent unnecessary child re-renders:

#### `handleCreateNote()`
- Dependencies: `[]`
- Creates a fresh note via `createNewNote()`, prepends to array, sets as active, closes sidebar

#### `handleCreateNoteWithContent(title, content, tags)`
- Dependencies: `[]`
- Same as above but with pre-populated fields + triggers Genesis effect (2s animation)

#### `handleUpdateNote(id, updates)`
- Dependencies: `[]`
- Maps over notes array, merges updates + sets `updatedAt: Date.now()`
- Schedules version save via 30s timeout on `versionSaveRef`

#### `handleBatchTagUpdate(action, oldTag, newTag?)`
- Dependencies: `[]`
- Iterates all notes, removes `oldTag`, optionally adds `newTag` (for rename)

#### `handleDeleteForever(id)`
- Dependencies: `[notes, activeNoteId]`
- Removes note from array entirely
- If deleted note was active → switch to first available or create fresh
- **Why deps?** Needs current `notes` and `activeNoteId` for selection logic

#### `handleArchiveNote(id)` / `handleTrashNote(id)`
- Dependencies: `[notes, activeNoteId, handleUpdateNote]`
- Sets `archived: true` or `trashedAt: Date.now()`
- If affected note was active → switch to next available

#### `handleRestoreNote(id)` / `handleRestoreFromTrash(id)`
- Dependencies: `[handleUpdateNote]`
- Clears `archived` / `trashedAt` flags

#### `handleEmptyTrash()`
- Dependencies: `[notes, activeNoteId]`
- Filters out all trashed notes
- Handles active note migration if current was trashed

#### `handleFuseNotes(sourceId, targetId)`
- Dependencies: `[notes]`
- Calls `Gemini.fuseConcepts()` with both note contents
- Attempts `Gemini.generateImage()` for fusion artifact image
- Creates child note with fusion result + system attribution
- Triggers Genesis effect on success
- Shows error alert on failure

#### `handleQuickCapture()`
- Dependencies: `[quickCaptureTitle, quickCaptureContent]`
- Creates new note from quick capture fields, resets form

### ◆ Effects (useEffect)

#### Data Loading (`[]` deps — runs once)
```typescript
useEffect(() => {
    const initData = async () => {
        const loaded = await loadNotes();
        // Validate activeNoteId, create fresh note if needed
        setIsStorageReady(true);
    };
    initData();
}, []);
```

#### Note Persistence (`[notes, isStorageReady]` deps)
```typescript
useEffect(() => {
    if (!isStorageReady) return; // Don't save empty state during boot
    const timeoutId = setTimeout(() => saveNotes(notes), 800);
    return () => clearTimeout(timeoutId);
}, [notes, isStorageReady]);
```

The 800ms debounce prevents rapid saves during fast typing. Each keystroke resets the timer.

#### Active Note Persistence (`[activeNoteId]`)
```typescript
useEffect(() => {
    if (activeNoteId) localStorage.setItem('void_active_note', activeNoteId);
}, [activeNoteId]);
```

#### Sidebar Width Persistence (`[sidebarWidth]`)
```typescript
useEffect(() => {
    localStorage.setItem('void_sidebar_width', sidebarWidth.toString());
}, [sidebarWidth]);
```

#### Folder Persistence (`[folders]`)
```typescript
useEffect(() => {
    localStorage.setItem('void_folders', JSON.stringify(folders));
}, [folders]);
```

#### Before-Unload Guard (`[]` deps)
```typescript
useEffect(() => {
    const handleBeforeUnload = () => {
        if (notesRef.current.length > 0) saveNotes(notesRef.current);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, []);
```

Uses `notesRef` instead of `notes` to avoid stale closure issues.

#### Reminder Polling (`[handleUpdateNote]` deps)
- Requests notification permission
- Sets 30s interval to check note reminders
- Fires browser notification within 60s window of reminder time
- Clears fired reminders

### ◆ Complete localStorage Key Registry

| Key | Type | Written By | Read By | Default |
|---|---|---|---|---|
| `void_notes_data` | `string (JSON)` | store.ts saveNotes | store.ts loadNotes | — |
| `void_active_note` | `string` | App.tsx effect | App.tsx initializer | `null` |
| `void_sidebar_width` | `string (number)` | App.tsx effect | App.tsx initializer | `'320'` |
| `void_folders` | `string (JSON)` | App.tsx effect | App.tsx initializer | `'[]'` |
| `void_onboarding_done` | `'true'` | App.tsx callback | App.tsx initializer | absent |
| `void_theme` | `'dark' \| 'light'` | ThemeContext effect | ThemeContext initializer | `'dark'` |
| `void_accent` | `string (hex)` | ThemeContext effect | ThemeContext initializer | `'#00ff9d'` |
| `void_density` | `'compact' \| 'comfortable'` | Sidebar.tsx effect | Sidebar.tsx initializer | `'comfortable'` |
| `void_google_client_id` | `string` | SyncModal handler | SyncModal initializer | `''` |
| `void_writing_streak` | `string (JSON)` | Editor.tsx handler | Editor.tsx initializer | absent |
| `void_goal_<noteId>` | `string (number)` | Editor.tsx handler | Editor.tsx effect | absent |
| `void_data` | `string (JSON)` | LEGACY | store.ts migration | absent |
| `void_notes` | `string (JSON)` | LEGACY | store.ts migration | absent |

### ◆ Derived State

These are computed inline (no useState), recalculated on every render:

```typescript
const activeNote = notes.find(n => n.id === activeNoteId) || null;
const splitNote = splitNoteId ? notes.find(n => n.id === splitNoteId) || null : null;
```

---

## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
## ██ SECTION 6 — UTILS & CONSTANTS ██
## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

### ◆ utils.tsx

#### `createNewNote(): Note`
Factory function for fresh notes:
```typescript
{
  id: uuid(),              // Custom UUID v4 implementation
  title: 'Void Entry',     // Default title (triggers auto-title AI)
  content: '',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  tags: [],
  attachments: [],
  pinned: false,
  archived: false
}
```

Note: Uses a custom `uuid()` function (not the `uuid` package's `v4`), despite `uuid` being in dependencies.

#### `formatTime(ms: number): string`
Formats a timestamp as: `"Feb 17, 02:30 PM"` using `toLocaleString('en-US', ...)`.

#### `NOTE_TEMPLATES: NoteTemplate[]`
6 pre-built templates:

| ID | Name | Icon | Structure |
|---|---|---|---|
| `meeting-notes` | Meeting Notes | 📋 | Date, Attendees, Agenda, Discussion, Action Items |
| `journal-entry` | Journal Entry | 📔 | Date, Mood, Highlights, Reflections, Gratitude |
| `project-plan` | Project Plan | 🚀 | Overview, Goals, Timeline (table), Tasks, Resources, Risks |
| `todo-list` | To-Do List | ✅ | High/Medium/Low Priority sections with checkboxes |
| `brain-dump` | Brain Dump | 🧠 | "Stream of consciousness..." |
| `bug-report` | Bug Report | 🐛 | Summary, Steps to Reproduce, Expected/Actual Behavior, Environment |

#### `JOURNAL_PROMPTS: string[]`
31 rotating daily journal prompts. Selected by day-of-year modulo:
```typescript
const getDailyPrompt = (): string => {
    const dayOfYear = Math.floor((today - startOfYear) / 86400000);
    return JOURNAL_PROMPTS[dayOfYear % JOURNAL_PROMPTS.length];
};
```

#### `getTagColor(tag: string): string`
Deterministic hash-based color assignment:
```typescript
hash = sum of charCodes with bit manipulation
index = Math.abs(hash) % TAG_COLORS.length
return TAG_COLORS[index]
```

### ◆ constants.tsx

#### `TAG_COLORS: string[]`
10 colors used for tag pill backgrounds:
```
#00ff9d  (neon green — primary accent)
#00d2ff  (cyan)
#ff6b6b  (coral red)
#ffd93d  (yellow)
#c084fc  (purple)
#ff6bcb  (pink)
#ff9f43  (orange)
#54a0ff  (blue)
#5f27cd  (deep purple)
#01a3a4  (teal)
```

#### `ICONS: Record<string, React.FC<SVGProps>>`
25+ inline SVG icon components. Each is a function component accepting standard SVG props with sensible defaults (18-20px, stroke-based, currentColor):

```
Plus, Trash, Mic, Sparkle, Image, Video, Brain, Speaker, Chat, Bolt,
Live, Close, Eye, Wand, Scan, Atom, Cloud, Download, Menu, Keyboard,
Pin, Archive, Restore, Ghost, Copy, FileText, FileCode, Columns,
Focus, Command, Search, Sort
```

---

## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
## ██ SECTION 7 — CHATOVERLAY TOOL EXECUTOR ██
## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

The `toolExecutor` function inside ChatOverlay.tsx is the bridge between AI function calls and React state. It's defined inside `handleSend()` and closes over component props.

### ◆ Vault Intelligence (Context Building)

Before sending a message, ChatOverlay builds a context string for the AI:

```typescript
// 1. Active note context
contextText += `=== ACTIVE NOTE ===\n`
  + `ID: ${contextNote.id}\n`
  + `Title: ${contextNote.title}\n`
  + `Tags: ${contextNote.tags.join(', ')}\n`
  + `Content:\n${contextNote.content}\n`;

// 2. Semantic relevance scoring (client-side)
const relevantNotes = candidates
    .map(n => ({ note: n, score: calculateRelevance(input, n) }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

contextText += `=== VAULT INSIGHTS ===\n`
  + relevantNotes.map(r => `[${r.note.title}] (ID:${r.note.id}): ${r.note.content.substring(0,200)}`);

// 3. All unique tags
contextText += `ALL TAGS: ${allTags.join(', ')}`;
```

### ◆ Client-Side Relevance Scoring

```typescript
const calculateRelevance = (query: string, note: Note): number => {
    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    let score = 0;
    terms.forEach(term => {
        if (title.includes(term)) score += 5;       // Title match = high relevance
        if (tags.some(t => t.includes(term))) score += 3; // Tag match = medium
        if (content.includes(term)) score += 1;      // Content match = low
    });
    return score;
};
```

### ◆ Tool Executor: Execution Matrix

| Tool Name | Executor Logic | Returns |
|---|---|---|
| `search_notes` | `notes.filter()` by title/content/tags → map to previews | JSON string of results |
| `read_note` | `notes.find(n => n.id === noteId)` → full content | JSON string of note data |
| `switch_note` | `onSwitchNote(id)` callback | "Switched view to note: {title}" |
| `create_note` | `onCreateNote(title, content, tags)` callback | "Created new note: {title}" |
| `batch_update_tags` | `onBatchTagUpdate(action, oldTag, newTag)` callback | "Batch operation completed" |
| `archive_note` | `onArchiveNote(id)` callback | "Archived note: {title}" |
| `delete_note` | `onDeleteNote(id)` callback | "Permanently deleted note: {title}" |
| `fuse_notes` | `onFuseNotes(sourceId, targetId)` callback | "Fusion process initiated." |
| `speak_text` | `Gemini.textToSpeech(text)` → AudioContext playback | "Audio output active." |
| `change_view` | `onChangeView(view)` callback | "View switched to {view}." |
| `update_title` | `onUpdateNote(id, { title })` | "Title updated successfully." |
| `update_content` | `onUpdateNote(id, { content })` | "Content updated successfully." |
| `append_content` | `onUpdateNote(id, { content: existing + '\n' + text })` | "Content appended successfully." |
| `manage_tags` | Add/remove from tag Set → `onUpdateNote(id, { tags })` | "Tags updated. Current: ..." |
| `generate_image_attachment` | `Gemini.generateImage(prompt)` → append to attachments | "Image generated and attached." |
| `generate_video_attachment` | `Gemini.generateVideo(prompt)` → append (async background) | "Video generation initiated in background." |

**Note on `generate_video_attachment`:** Unlike other tools, video generation runs in an async IIFE without awaiting. This prevents the chat from blocking for 15+ seconds during video generation polling. The video appears in note attachments when ready.

---

*End of SERVICES_AND_STATE.md — The engine room tour is complete.*
