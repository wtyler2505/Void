# ◆ VOID — SYSTEM ARCHITECTURE

> *"Every system is a ghost in the machine. This document maps the haunting."*

---

## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
## ██ SECTION 0 — ARCHITECTURE AT A GLANCE ██
## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

VOID is a cyberpunk-aesthetic, AI-augmented note-taking application built as a single-page React 19 app with zero backend. All data lives client-side. All AI flows through the Google Gemini API directly from the browser.

```
┌─────────────────────────────────────────────────────────────────┐
│                        VOID APPLICATION                         │
│                                                                 │
│  ┌─────────────┐   ┌──────────────────────────────────────────┐ │
│  │             │   │              MAIN CONTENT                │ │
│  │   SIDEBAR   │◄──┤                                          │ │
│  │  (824 LOC)  │   │  ┌──────────────────────────────────┐    │ │
│  │             │   │  │         EDITOR (1430 LOC)        │    │ │
│  │  • Search   │   │  │  • Title Input                   │    │ │
│  │  • Actions  │   │  │  • Toolbar (AI, Media, Format)   │    │ │
│  │  • Journal  │   │  │  • Textarea / Markdown Preview   │    │ │
│  │  • Folders  │   │  │  • Slash Commands                │    │ │
│  │  • Notes    │   │  │  • Pomodoro Timer                │    │ │
│  │  • Footer   │   │  │  • Version History Panel         │    │ │
│  │             │   │  │  • Haunt (Related Notes)          │    │ │
│  └──────┬──────┘   │  │  • Zen Mode                      │    │ │
│         │          │  └──────────────────────────────────┘    │ │
│         │          │                                          │ │
│         │ RESIZE   │  ┌──────────┐  ┌───────────┐             │ │
│         │ HANDLE   │  │ CALENDAR │  │  KANBAN   │             │ │
│         │          │  │   VIEW   │  │   BOARD   │             │ │
│         │          │  └──────────┘  └───────────┘             │ │
│         │          │                                          │ │
│         │          │  ┌──────────────────────────────────┐    │ │
│         │          │  │      LIVE SESSION (Voice AI)     │    │ │
│         │          │  └──────────────────────────────────┘    │ │
│         │          └──────────────────────────────────────────┘ │
│         │                                                       │
│  ┌──────┴──────────────────────────────────────────────────────┐│
│  │                    OVERLAY LAYER (z-index)                  ││
│  │  ChatOverlay │ ExportModal │ SyncModal │ CommandPalette     ││
│  │  KeyboardShortcutsModal │ Onboarding │ QuickCapture         ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
  ┌──────────────┐  ┌────────────────┐  ┌──────────────────┐
  │   IndexedDB  │  │  localStorage  │  │  Google Gemini   │
  │  (Primary)   │  │   (Backup &    │  │   API (Cloud)    │
  │              │  │   Preferences) │  │                  │
  └──────────────┘  └────────────────┘  └──────────────────┘
         │                                       │
         └───────────────┬───────────────────────┘
                         │
                ┌────────────────┐
                │  Google Drive  │
                │  (Cloud Sync)  │
                └────────────────┘
```

### ◆ Core Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | React 19 + TypeScript | Latest concurrent features, strict typing |
| Bundler | Vite 6 | Sub-second HMR, native ESM |
| Styling | TailwindCSS CDN | Zero build step for styles, rapid prototyping |
| State | Centralized App.tsx + Prop Drilling | Simple mental model, no external state library |
| Storage | IndexedDB + localStorage dual-write | Resilient offline-first, quota-resistant |
| AI | Google Gemini API (@google/genai) | Multimodal (text, image, audio, video), function calling |
| Fonts | IBM Plex Sans (UI) + JetBrains Mono (code) | Industrial meets hacker aesthetic |
| Backend | None | Fully client-side, zero server infrastructure |

---

## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
## ██ SECTION 1 — FILE TREE ██
## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

```
void/
├── index.html              ─── HTML shell: TailwindCSS CDN, fonts, custom CSS, Drive API scripts
├── index.tsx               ─── React entry point: ReactDOM.createRoot, StrictMode, ThemeProvider
├── App.tsx                 ─── Root component: ALL state, routing, orchestration (300+ LOC)
├── ThemeContext.tsx         ─── React Context: dark/light mode, accent color, CSS custom properties
├── types.ts                ─── TypeScript interfaces: Note, Folder, NoteVersion, Attachment, etc.
├── utils.tsx               ─── Pure utilities: createNewNote, formatTime, templates, prompts
├── constants.tsx           ─── TAG_COLORS array (10), ICONS object (25+ inline SVG components)
├── vite.config.ts          ─── Vite: port 5000, host 0.0.0.0, env mapping, path aliases
├── tsconfig.json           ─── TypeScript strict config
├── package.json            ─── Dependencies and scripts
│
├── components/             ─── All 12 React UI components
│   ├── Editor.tsx          ─── Main note editor (1430 LOC) — the heart of the app
│   ├── Sidebar.tsx         ─── Navigation panel (824 LOC) — note list, folders, actions
│   ├── ChatOverlay.tsx     ─── AI chat panel (357 LOC) — function calling, grounding
│   ├── ExportModal.tsx     ─── Export dialog (326 LOC) — clipboard, md, txt, json, html, print
│   ├── SyncModal.tsx       ─── Sync dialog (218 LOC) — Google Drive + manual JSON import/export
│   ├── CommandPalette.tsx  ─── Cmd+K palette (209 LOC) — fuzzy search, quick actions
│   ├── LiveSession.tsx     ─── Voice AI session (188 LOC) — real-time audio streaming
│   ├── VoidLogo.tsx        ─── SVG logo component (100 LOC) — diamond glow emblem
│   ├── Onboarding.tsx      ─── New user tour (96 LOC) — 8-step wizard
│   ├── CalendarView.tsx    ─── Monthly calendar (93 LOC) — notes by creation date
│   ├── KanbanBoard.tsx     ─── Kanban board (91 LOC) — todo/in_progress/done columns
│   └── KeyboardShortcutsModal.tsx ─── Shortcut help (52 LOC) — keyboard reference
│
├── services/               ─── Business logic layer (no UI)
│   ├── gemini.ts           ─── AI service (657 LOC) — ALL Gemini API interactions
│   ├── store.ts            ─── Persistence service (172 LOC) — IndexedDB + localStorage
│   ├── drive.ts            ─── Cloud sync service (125 LOC) — Google Drive OAuth + CRUD
│   └── shortcuts.ts        ─── Keyboard service (85 LOC) — useGlobalShortcuts hook
│
├── public/
│   └── favicon.png         ─── Application favicon
│
└── docs/                   ─── Developer documentation (you are here)
```

---

## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
## ██ SECTION 2 — COMPONENT HIERARCHY ██
## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

### ◆ Render Tree

```
<React.StrictMode>
  <ThemeProvider>                          ── Context: theme, isDark, accentColor
    <App>                                  ── State Hub: notes[], activeNoteId, view, modals
      │
      ├── <VoidLogo />                     ── Loading screen (isStorageReady === false)
      │
      ├── [Mobile Header]                  ── hamburger menu, centered logo
      │
      ├── <Sidebar />                      ── Left panel (fixed on mobile, relative on desktop)
      │     ├── VoidLogo                   ── Brand header
      │     ├── Search Input               ── Full-text search across titles, content, tags
      │     ├── Action Grid                ── AI Chat, Live, Kanban, Calendar, Sync, Shortcuts
      │     ├── Daily Journal Prompt       ── Rotating prompt from JOURNAL_PROMPTS[31]
      │     ├── Template Dropdown          ── 6 note templates (Meeting, Journal, Project, etc.)
      │     ├── Sort Controls              ── updated/created/alphabetical/size
      │     ├── Folder Tree                ── Create, select, delete folders
      │     ├── Tag Filter Bar             ── Click tags to filter note list
      │     ├── Note List                  ── Sorted, filtered, pinnable, draggable items
      │     ├── Archive Section            ── Collapsible archived notes list
      │     ├── Trash Section              ── Collapsible trashed notes, "Empty Trash" button
      │     ├── Theme Editor               ── Dark/light toggle, accent color picker
      │     └── Footer                     ── Note count, storage size, density toggle
      │
      ├── [Resize Handle]                  ── col-resize cursor, drag to resize sidebar (240-600px)
      │
      ├── [Main Content Area]              ── Switches based on `view` state
      │     ├── view === 'editor'
      │     │     ├── <Editor note={activeNote} />
      │     │     └── <Editor note={splitNote} />   ── Optional split pane (desktop only)
      │     ├── view === 'calendar'
      │     │     └── <CalendarView />
      │     ├── view === 'kanban'
      │     │     └── <KanbanBoard />
      │     └── view === 'live'
      │           └── <LiveSession />
      │
      ├── [Quick Capture FAB]              ── Floating action button, bottom-right corner
      │
      ├── [Fusion Effect]                  ── Full-screen overlay during Neural Fusion
      ├── [Genesis Effect]                 ── Flash animation on AI-created notes
      │
      └── [Overlay Layer]                  ── Conditional modals (z-50 to z-100)
            ├── <ChatOverlay />            ── isChatOpen
            ├── <SyncModal />              ── isSyncOpen
            ├── <ExportModal />            ── isExportOpen
            ├── <CommandPalette />         ── isCommandPaletteOpen
            ├── <KeyboardShortcutsModal /> ── isShortcutsOpen
            └── <Onboarding />            ── showOnboarding (first launch only)
```

### ◆ Component Dependency Graph

```
                           App.tsx
                         /    |    \
                        /     |     \
                       /      |      \
              Sidebar.tsx  Editor.tsx  [Overlays]
                  │            │          │
                  │            │     ChatOverlay.tsx ──► gemini.ts
                  │            │     ExportModal.tsx
                  │            │     SyncModal.tsx ────► drive.ts
                  │            │     CommandPalette.tsx
                  │            │     KeyboardShortcutsModal.tsx
                  │            │     LiveSession.tsx ──► @google/genai (direct)
                  │            │     Onboarding.tsx
                  │            │
             VoidLogo.tsx      ├──► gemini.ts
                               └──► store.ts (loadNoteVersions)

               All components consume:
               ├── ThemeContext.tsx (useTheme hook)
               ├── constants.tsx (ICONS, TAG_COLORS)
               ├── types.ts (Note, Folder, etc.)
               └── utils.tsx (formatTime, getTagColor, etc.)

               App.tsx directly consumes:
               ├── services/store.ts (saveNotes, loadNotes, saveNoteVersion)
               ├── services/shortcuts.ts (useGlobalShortcuts)
               └── services/gemini.ts (fuseConcepts, generateImage)
```

---

## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
## ██ SECTION 3 — STATE MANAGEMENT ██
## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

### ◆ Philosophy: Centralized State with Prop Drilling

VOID uses **no external state management library** (no Redux, Zustand, Jotai, etc.). All application state lives in `App.tsx` and is passed down via props. The only exception is `ThemeContext`, which uses React Context to avoid threading theme props through every component.

**Why this works for VOID:**
- The component tree is shallow (max depth = 3)
- Most state is consumed by only 1-2 components
- `useCallback` prevents unnecessary re-renders
- The app has ~12 components total — prop drilling is manageable
- No cross-cutting concerns that would warrant a state library

### ◆ State Registry (App.tsx)

| State Variable | Type | Initial Value | Persisted? | Storage Key |
|---|---|---|---|---|
| `notes` | `Note[]` | `[]` (loaded from IDB) | ✅ IndexedDB + LS | `void_notes_data` |
| `activeNoteId` | `string \| null` | From localStorage | ✅ localStorage | `void_active_note` |
| `view` | `AppView` | `'editor'` | ❌ | — |
| `folders` | `Folder[]` | From localStorage | ✅ localStorage | `void_folders` |
| `sidebarWidth` | `number` | `320` or localStorage | ✅ localStorage | `void_sidebar_width` |
| `splitNoteId` | `string \| null` | `null` | ❌ | — |
| `isChatOpen` | `boolean` | `false` | ❌ | — |
| `isSyncOpen` | `boolean` | `false` | ❌ | — |
| `isShortcutsOpen` | `boolean` | `false` | ❌ | — |
| `isExportOpen` | `boolean` | `false` | ❌ | — |
| `isFusing` | `boolean` | `false` | ❌ | — |
| `isGenesis` | `boolean` | `false` | ❌ | — |
| `isSidebarOpen` | `boolean` | `false` | ❌ | — |
| `isCommandPaletteOpen` | `boolean` | `false` | ❌ | — |
| `isQuickCaptureOpen` | `boolean` | `false` | ❌ | — |
| `quickCaptureTitle` | `string` | `'Quick Note'` | ❌ | — |
| `quickCaptureContent` | `string` | `''` | ❌ | — |
| `activeFolderId` | `string \| null` | `null` | ❌ | — |
| `showOnboarding` | `boolean` | `!localStorage('void_onboarding_done')` | ✅ localStorage | `void_onboarding_done` |
| `isStorageReady` | `boolean` | `false` | ❌ | — |

### ◆ Ref Registry (App.tsx)

| Ref | Type | Purpose |
|---|---|---|
| `notesRef` | `useRef(notes)` | Always-current notes for async callbacks (beforeunload, reminder intervals) |
| `isResizingRef` | `useRef(false)` | Sidebar resize drag state (avoids re-renders) |
| `startXRef` | `useRef(0)` | Resize drag start X coordinate |
| `startWidthRef` | `useRef(0)` | Resize drag start width |
| `versionSaveRef` | `useRef(timeout)` | Debounce timer for version history saves (30s) |

### ◆ State Flow: Note Creation

```
User clicks "+" in Sidebar
        │
        ▼
  handleCreateNote()          ◄── useCallback in App.tsx
        │
        ├── createNewNote()   ◄── utils.tsx: generates UUID, timestamp, empty fields
        │     Returns: { id: uuid(), title: 'Void Entry', content: '', tags: [], ... }
        │
        ├── setNotes(prev => [newNote, ...prev])    ◄── Prepend to array
        │
        ├── setActiveNoteId(newNote.id)              ◄── Switch to new note
        │
        └── setIsSidebarOpen(false)                  ◄── Close mobile sidebar
                │
                ▼
        useEffect([notes])    ◄── Persistence effect triggers
                │
                ├── setTimeout(800ms)   ◄── Debounce to prevent rapid saves
                │
                └── saveNotes(notes)    ◄── services/store.ts
                        │
                        ├── localStorage.setItem('void_notes_data', JSON.stringify(notes))
                        │       └── catch: warn if quota exceeded (images too large)
                        │
                        └── IndexedDB.transaction('readwrite')
                              └── store.put(notes, 'void_notes_data')
```

### ◆ State Flow: Note Update

```
User types in Editor textarea
        │
        ▼
  handleContentChange(e)       ◄── Editor.tsx internal handler
        │
        ├── triggerSaveVisual()     ◄── Shows "SAVING..." indicator, resets after 1s
        │
        ├── onUpdate({ content: value })   ◄── Props callback → App.tsx
        │       │
        │       ▼
        │   handleUpdateNote(id, updates)   ◄── useCallback in App.tsx
        │       │
        │       ├── setNotes(prev => prev.map(n =>
        │       │     n.id === id ? {...n, ...updates, updatedAt: Date.now()} : n
        │       │   ))
        │       │
        │       ├── clearTimeout(versionSaveRef.current)
        │       │
        │       └── versionSaveRef.current = setTimeout(30000ms)
        │               └── saveNoteVersion(id, title, content)
        │                     ◄── IndexedDB void_versions store
        │                     ◄── Dedup: skip if content === latest version
        │                     ◄── Trim: keep last 50 versions per note
        │
        ├── [Wiki Link Detection]   ◄── Scans for [[ pattern, shows link autocomplete
        │
        └── [Slash Command Detection]   ◄── Scans for / at line start, shows command menu
```

### ◆ State Flow: Note Deletion Lifecycle

```
                            ┌──────────────┐
                            │    ACTIVE     │
                            │  (normal)     │
                            └──────┬───────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
            ┌──────────┐  ┌──────────────┐  ┌───────────┐
            │ ARCHIVED │  │   TRASHED    │  │  PINNED   │
            │ archived │  │ trashedAt=ts │  │ pinned=t  │
            │  =true   │  │              │  │           │
            └────┬─────┘  └──────┬───────┘  └───────────┘
                 │               │
                 │ Restore       │ Restore
                 ▼               ▼
            Back to ACTIVE  Back to ACTIVE
                                 │
                                 │ Empty Trash / Delete Forever
                                 ▼
                          ┌──────────────┐
                          │  DESTROYED   │
                          │ (removed     │
                          │  from array) │
                          └──────────────┘
```

---

## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
## ██ SECTION 4 — STORAGE ARCHITECTURE ██
## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

### ◆ Three-Tier Storage Strategy

```
┌───────────────────────────────────────────────┐
│              TIER 1: IndexedDB                │
│         (Source of Truth for Notes)           │
│                                               │
│  Database: void_db (version 2)                │
│  ├── Object Store: void_store                 │
│  │     └── Key: 'void_notes_data'             │
│  │           Value: Note[] (entire array)      │
│  │                                             │
│  └── Object Store: void_versions              │
│        └── Key: <noteId> (string)              │
│              Value: NoteVersion[] (max 50)     │
│                                               │
│  Capacity: ~unlimited (browser-dependent)     │
│  API: Async (Promise-based wrappers)          │
└───────────────────────────────────────────────┘
                    │
                    │  Dual-write on every save
                    ▼
┌───────────────────────────────────────────────┐
│            TIER 2: localStorage               │
│        (Fast Backup + Preferences)            │
│                                               │
│  Notes Backup:                                │
│  ├── void_notes_data  → JSON string of Note[] │
│  │     └── May fail silently if quota exceeded │
│  │                                             │
│  User Preferences:                            │
│  ├── void_active_note    → string (note ID)   │
│  ├── void_sidebar_width  → string (number px) │
│  ├── void_folders        → JSON string        │
│  ├── void_onboarding_done → 'true'            │
│  ├── void_theme          → 'dark' | 'light'   │
│  ├── void_accent         → hex color string   │
│  ├── void_density        → 'compact'|'comfortable' │
│  ├── void_google_client_id → OAuth client ID  │
│  ├── void_writing_streak → JSON streak data   │
│  └── void_goal_<noteId>  → word count goal    │
│                                               │
│  Legacy Keys (migration sources):             │
│  ├── void_data                                │
│  └── void_notes                               │
│                                               │
│  Capacity: ~5-10MB (browser-dependent)        │
└───────────────────────────────────────────────┘
                    │
                    │  Manual push/pull (user-initiated)
                    ▼
┌───────────────────────────────────────────────┐
│          TIER 3: Google Drive                 │
│          (Cloud Backup / Sync)                │
│                                               │
│  File: void_notes_backup.json                 │
│  Content: JSON array of Note objects          │
│  API: Google Drive v3 REST API                │
│  Auth: OAuth 2.0 (user-provided Client ID)   │
│  Scope: drive.file (app-created files only)   │
│  Operations: POST (create) / PATCH (update)   │
│                                               │
│  NOT automatic — requires user click          │
└───────────────────────────────────────────────┘
```

### ◆ Data Load Sequence (Application Boot)

```
App.tsx useEffect([], []) — initData()
        │
        ▼
  1. loadNotes()                  ◄── services/store.ts
        │
        ├── Try IndexedDB.get('void_notes_data')
        │       ├── Success + has data → Use it ✓
        │       └── Empty or failed → Continue ▼
        │
        ├── Try localStorage.getItem('void_notes_data')
        │       ├── Found + parsed → Use it, self-heal to IDB ✓
        │       └── Not found → Continue ▼
        │
        ├── Try LEGACY_KEYS ['void_data', 'void_notes']
        │       ├── Found → Parse, migrate to new storage system ✓
        │       └── Not found → Return [] ▼
        │
        └── Return empty array
                │
                ▼
  2. Validate activeNoteId
        │
        ├── If savedId exists in loaded notes (not archived/trashed) → Keep it
        ├── If savedId missing/invalid → Pick first available note
        └── If no notes at all → Create fresh 'Void Entry', set as active
                │
                ▼
  3. setIsStorageReady(true)    ◄── Triggers render, hides loading screen
```

### ◆ Dual-Write Save Strategy

Every call to `saveNotes(notes)` writes to **both** stores:

1. **localStorage** (synchronous, fast) — written first as a quick backup
   - May silently fail if quota exceeded (common with base64 image-heavy notes)
   - Console warning only: `"LocalStorage quota exceeded. Data saved to IndexedDB only."`
   
2. **IndexedDB** (asynchronous, robust) — written second as source of truth
   - Virtually unlimited storage capacity
   - Transaction-based for data integrity
   - Critical failure logged: `"CRITICAL: Failed to save notes to IndexedDB"`

### ◆ Version History System

- **Trigger**: `handleUpdateNote()` in App.tsx starts a 30-second timeout via `versionSaveRef`
- **Reset**: Each new edit resets the 30s timer (only snapshots during editing pauses)
- **Storage**: IndexedDB `void_versions` object store, keyed by `noteId`
- **Format**: `NoteVersion[]` — `{ timestamp: number, title: string, content: string }`
- **Limit**: Maximum 50 versions per note — oldest trimmed via `.slice(-MAX_VERSIONS_PER_NOTE)`
- **Dedup**: Skips save if `content === existingVersions[last].content`
- **Access**: Editor loads versions on-demand via `loadNoteVersions(noteId)` when user opens version panel

### ◆ Before-Unload Guard

```typescript
window.addEventListener('beforeunload', () => {
    if (notesRef.current.length > 0) {
        saveNotes(notesRef.current);  // Force-save on page close
    }
});
```

Uses `notesRef` (not `notes` state) to capture the absolute latest values regardless of React's batching or stale closures.

---

## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
## ██ SECTION 5 — THEME SYSTEM ██
## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

### ◆ Architecture

```
index.tsx
  └── <ThemeProvider>                ◄── ThemeContext.tsx
        │
        ├── State:
        │   ├── theme: 'dark' | 'light'       ◄── localStorage('void_theme') || 'dark'
        │   └── accentColor: string            ◄── localStorage('void_accent') || '#00ff9d'
        │
        ├── Provides via Context:
        │   ├── theme        → raw theme string
        │   ├── isDark       → boolean (theme === 'dark')
        │   ├── toggleTheme  → () => toggle dark/light
        │   ├── accentColor  → current hex color string
        │   └── setAccentColor → (color: string) => void
        │
        ├── DOM Side Effects (useEffect):
        │   ├── document.documentElement.setAttribute('data-theme', theme)
        │   └── document.documentElement.style.setProperty('--accent', accentColor)
        │
        └── Consumed by: ALL components via useTheme() hook
```

### ◆ Color System

| Token | Dark Mode | Light Mode |
|---|---|---|
| Background (primary) | `#050505` | `#f5f5f0` |
| Background (sidebar) | `#0a0a0a` | `white` |
| Background (elevated) | `#111` | `white` |
| Background (surface) | `#1a1a1a` | `gray-100` |
| Text (primary) | `gray-200` | `gray-800` |
| Text (secondary) | `gray-400` / `gray-500` | `gray-500` / `gray-600` |
| Text (muted) | `gray-600` | `gray-400` |
| Border (default) | `#1a1a1a` | `gray-200` |
| Border (strong) | `#333` | `gray-300` |
| Accent (default) | `#00ff9d` | `#00ff9d` (same in both modes) |
| Selection highlight | `bg-[#00ff9d] text-black` | Same |
| Scrollbar track | `#0f0f0f` | (browser default) |
| Scrollbar thumb | `#333` → `#00ff9d` on hover | (browser default) |

### ◆ Custom CSS Utilities (defined in index.html `<style>` block)

| Class | Effect |
|---|---|
| `.neon-border` | `box-shadow: 0 0 5px rgba(0,255,157,0.2); border: 1px solid rgba(0,255,157,0.3)` |
| `.neon-text` | `text-shadow: 0 0 5px rgba(0,255,157,0.5)` |
| `.neon-pink-border` | Same glow/border as neon-border but with `rgba(255,0,255,...)` magenta |
| `.void-logo-pulse` | Keyframe animation: `drop-shadow` glow oscillates between 4px and 12px spread |
| `.markdown-preview *` | Full markdown rendering styles: h1(accent), h2(white), code(green), pre(dark bg), etc. |
| `.link-card:hover` | Green border highlight for grounding result cards |

### ◆ CSS Custom Property

```css
:root { --accent: #00ff9d; }
```

Updated at runtime via `document.documentElement.style.setProperty('--accent', accentColor)` whenever the user changes accent color through the Sidebar theme editor. The VoidLogo and some inline styles reference this dynamically.

---

## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
## ██ SECTION 6 — AI INTEGRATION ARCHITECTURE ██
## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

### ◆ Design Principle

All AI capabilities are centralized in `services/gemini.ts`. No AI logic exists in components — they call service functions and handle the results. The service instantiates a fresh `GoogleGenAI` client on every call via `getAI()`, using the build-time injected `process.env.API_KEY`.

### ◆ Model Matrix

| Function | Model | Modality | Why This Model |
|---|---|---|---|
| `transcribeAudio` | `gemini-2.5-flash-native-audio-preview-12-2025` | Audio→Text | Native audio understanding |
| `summarizeNote` (fast) | `gemini-3-flash-preview` | Text→Text | Speed for quick summarization |
| `summarizeNote` (thinking) | `gemini-3-pro-preview` | Text→Text | Deep analysis with thinking budget (32768) |
| `generateTitle` | `gemini-3-flash-preview` | Text→Text | Quick, creative cyberpunk title generation |
| `fastEnhance` | `gemini-flash-lite-latest` | Text→Text | Fastest/cheapest model for grammar fixes |
| `generateImagePrompt` | `gemini-3-flash-preview` | Text→Text | Creative art prompt engineering (max 25 words) |
| `generateImage` (primary) | `gemini-3-pro-image-preview` | Text→Image | Highest quality image generation |
| `generateImage` (fallback) | `gemini-2.5-flash-image` | Text→Image | Fallback if primary model fails/PERMISSION_DENIED |
| `editImage` | `gemini-2.5-flash-image` | Image+Text→Image | Instruction-based image editing/modification |
| `analyzeVideo` | `gemini-3-pro-preview` | Video→Text | Multimodal video understanding + timestamps |
| `generateVideo` | `veo-3.1-fast-generate-preview` | Text→Video | Video generation (720p, 9:16, polling-based) |
| `textToSpeech` | `gemini-2.5-flash-preview-tts` | Text→Audio | Voice output using Fenrir voice preset |
| `fuseConcepts` | `gemini-3-pro-preview` | Text→Text | Conceptual synthesis with thinking budget (2048) |
| `findRelatedNotes` (Haunt) | `gemini-3-flash-preview` | Text→JSON | Semantic note search with JSON response mode |
| `chatWithContext` (default) | `gemini-3-flash-preview` | Text→Text+Tools | Conversational chat with function calling |
| `chatWithContext` (maps) | `gemini-2.5-flash` | Text→Text+Maps | Maps grounding requires this specific model |
| Live Session | `gemini-2.5-flash-native-audio-preview-09-2025` | Audio↔Audio | Real-time bidirectional audio streaming |

### ◆ Function Calling Architecture

The AI chat system supports **16 function declarations** that give the AI full control over the application:

```
User sends message in ChatOverlay
        │
        ▼
  Build context string:
    ├── Active note (ID, title, tags, full content)
    ├── Vault Intelligence (top 5 semantically relevant notes)
    ├── All tags in vault
    └── Total note count
        │
        ▼
  chatWithContext(history, message, context, grounding, location, toolExecutor)
        │
        ├── Configure tools array:
        │     ├── grounding === 'search' → add { googleSearch: {} }
        │     ├── grounding === 'maps'   → add { googleMaps: {} } + latLng config
        │     └── toolExecutor provided  → add { functionDeclarations: noteTools }
        │
        ├── Create chat session with system instruction + tools
        │
        ├── Send message → Get initial response
        │
        └── Function Calling Loop (max 5 turns):
              │
              ├── response.functionCalls exists?
              │     │
              │     YES → For each function call:
              │     │       ├── toolExecutor(name, args)
              │     │       │     ├── Returns result string
              │     │       │     └── Catches errors → returns error message
              │     │       │
              │     │       └── Wrap: { functionResponse: { name, response: { result } } }
              │     │
              │     └── Send all functionResponses back → Get new response → Loop
              │
              NO → Return { text, groundingChunks }
```

### ◆ 16 Function Declarations (noteTools)

| # | Tool Name | Parameters | Category | Description |
|---|---|---|---|---|
| 1 | `update_title` | `title: string` | Contextual | Update active note's title |
| 2 | `update_content` | `content: string` | Contextual | Replace active note's content entirely |
| 3 | `append_content` | `text: string` | Contextual | Append text to active note |
| 4 | `search_notes` | `query: string` | Global | Search vault by keyword, returns snippets |
| 5 | `read_note` | `noteId: string` | Global | Read full content of any note |
| 6 | `switch_note` | `noteId: string` | Global | Switch active view to another note |
| 7 | `create_note` | `title, content?, tags?` | Global | Create new note, auto-switch to it |
| 8 | `manage_tags` | `action: 'add'\|'remove', tags: string[]` | Contextual | Add/remove tags on active note |
| 9 | `batch_update_tags` | `action: 'rename'\|'delete', oldTag, newTag?` | Global | Rename/delete tag across ALL notes |
| 10 | `generate_image_attachment` | `prompt: string` | Contextual | AI image gen → attach to active note |
| 11 | `archive_note` | `noteId: string` | Global | Archive (soft-delete) a note |
| 12 | `delete_note` | `noteId: string` | Global | **Permanently** delete a note |
| 13 | `fuse_notes` | `sourceId, targetId` | Global | Neural Fusion between two notes |
| 14 | `generate_video_attachment` | `prompt: string` | Contextual | AI video gen → attach (async background) |
| 15 | `speak_text` | `text: string` | Global | Text-to-speech via AudioContext |
| 16 | `change_view` | `view: 'editor'\|'live'` | Global | Switch app view mode |

### ◆ Grounding Modes

| Mode | Tool Config | Model Override | Extra Config |
|---|---|---|---|
| `none` | `functionDeclarations` only | Default (`gemini-3-flash-preview`) | — |
| `search` | `{ googleSearch: {} }` + `functionDeclarations` | Default | — |
| `maps` | `{ googleMaps: {} }` + `functionDeclarations` | `gemini-2.5-flash` | `retrievalConfig.latLng` from geolocation |

### ◆ Paid Key Detection

The `ensurePaidKey()` function checks for the AI Studio bridge (`window.aistudio`). If running inside AI Studio and no key is selected, it prompts the user to select one. Called before `generateImage()` and `generateVideo()` — models that require paid API access. On `PERMISSION_DENIED` errors during image generation, the system automatically opens the key selection dialog as a recovery mechanism.

---

## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
## ██ SECTION 7 — RENDERING PIPELINE ██
## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

### ◆ Build & Dev Flow

```
  Source Files (.tsx, .ts)
         │
         ▼
  Vite 6 (vite.config.ts)
    ├── @vitejs/plugin-react     ─── JSX transform, React Fast Refresh
    ├── define:
    │     ├── process.env.API_KEY ← env.GEMINI_API_KEY (compile-time injection)
    │     └── process.env.GEMINI_API_KEY ← same
    ├── resolve.alias: @/ → project root
    └── server: port 5000, host 0.0.0.0, allowedHosts: true
         │
         ▼
  Browser receives:
    ├── index.html               ─── Static shell
    │     ├── TailwindCSS CDN    ─── <script src="cdn.tailwindcss.com">
    │     ├── Google Fonts       ─── IBM Plex Sans (300-700), JetBrains Mono (400,700)
    │     ├── Custom <style>     ─── Neon utilities, markdown preview, scrollbar, logo animation
    │     ├── Google Drive APIs  ─── gsi/client + api.js (async defer)
    │     └── <script type="module" src="/index.tsx">
    │
    └── index.tsx                ─── Hydrates #root with React tree
          └── <React.StrictMode><ThemeProvider><App /></ThemeProvider></React.StrictMode>
```

### ◆ TailwindCSS CDN Architecture

VOID uses the **CDN version** of TailwindCSS (`https://cdn.tailwindcss.com`), **not** the build-time PostCSS plugin. Implications:

- **No purging** — all Tailwind classes are available at runtime
- **No config file** — `tailwind.config.js` is not used or needed
- **JIT in browser** — the CDN script scans the DOM and generates CSS on-the-fly
- **Custom styles** live in `index.html <style>` block, not in Tailwind config extensions
- **Trade-off**: Zero build complexity for styles, but larger CSS payload (mitigated by CDN caching)

### ◆ Markdown Rendering Pipeline

```
Note content (raw Markdown string)
        │
        ▼
  Editor.tsx: showPreview === true
        │
        ▼
  <ReactMarkdown> (react-markdown v9)
    ├── Plugin: remarkGfm        ─── Tables, strikethrough, task lists, autolinks
    ├── Component overrides:
    │     ├── code({ inline, className, children })
    │     │     ├── Inline code → <code> with green styling
    │     │     └── Block code → <SyntaxHighlighter>
    │     │           ├── Style: vscDarkPlus (VS Code dark theme)
    │     │           ├── Language: extracted from className (```lang)
    │     │           └── Custom background: #111
    │     │
    │     ├── a → External link (target="_blank", rel="noopener")
    │     │
    │     └── input[type=checkbox]
    │           └── Interactive checkboxes with click handler
    │                 └── Toggles [ ] ↔ [x] in raw content
    │
    └── Wrapper: <div className="markdown-preview">
          └── CSS styles from index.html <style> block
```

---

## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
## ██ SECTION 8 — EVENT SYSTEM ██
## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

### ◆ Global Keyboard Shortcuts (services/shortcuts.ts)

The `useGlobalShortcuts` hook attaches a single `keydown` listener to `window`. Two-tier filtering:

1. **Escape** — always fires regardless of focus context (closes all modals/overlays)
2. **All other shortcuts** — only fire if:
   - User is NOT in an `<input>` or `<textarea>`, OR
   - User IS in an input AND pressing Ctrl/Meta combo

| Shortcut | Handler | Action |
|---|---|---|
| `Escape` | `onEscape` | Close all modals, chat, sidebar |
| `Ctrl/⌘+N` | `onNewNote` | Create new note |
| `Ctrl/⌘+S` | `onSave` | Force save to IndexedDB + snapshot version |
| `Ctrl/⌘+K` | `onCommandPalette` | Toggle command palette |
| `Ctrl/⌘+F` | `onFocusSearch` | Focus sidebar search input, open sidebar if closed |
| `Ctrl/⌘+Shift+E` | `onExport` | Open export modal for active note |
| `Ctrl/⌘+Delete` | `onArchiveNote` | Archive active note |
| `Ctrl/⌘+Shift+Delete` | `onDeleteForever` | Permanently delete (with confirm dialog) |
| `Ctrl/⌘+1-9` | `onSwitchNote(n-1)` | Switch to nth available (non-archived, non-trashed) note |
| `Ctrl/⌘+/` | `onShowShortcuts` | Show keyboard shortcuts modal |

### ◆ Sidebar Resize System

```
onMouseDown (resize handle div)
    ├── e.preventDefault()
    ├── isResizingRef.current = true
    ├── Record startXRef = e.clientX
    ├── Record startWidthRef = current sidebarWidth
    ├── Set document.body cursor to 'col-resize'
    ├── Set document.body userSelect to 'none'
    │
    ├── Register document.addEventListener('mousemove'):
    │     └── newWidth = Math.max(240, Math.min(600, startWidth + (e.clientX - startX)))
    │           └── setSidebarWidth(newWidth)
    │                 └── useEffect persists to localStorage('void_sidebar_width')
    │
    └── Register document.addEventListener('mouseup'):
          ├── isResizingRef.current = false
          ├── Restore cursor and userSelect
          └── Remove both listeners
```

**Constraints**: Min width = 240px, Max width = 600px. Desktop only (hidden on mobile via `hidden md:flex`).

### ◆ Reminder Polling System

```
useEffect([handleUpdateNote]) in App.tsx
    │
    ├── Request Notification.permission (if currently 'default')
    │
    ├── checkReminders() — runs immediately + every 30 seconds:
    │     │
    │     └── For each note in notesRef.current:
    │           ├── note.reminder exists?
    │           ├── note.reminder <= Date.now()?
    │           ├── note.reminder > (Date.now() - 60000)?  ◄── 60s window prevents re-firing
    │           │
    │           └── All true:
    │                 ├── new Notification('VOID Reminder', { body: note.title, icon: '/favicon.ico' })
    │                 └── handleUpdateNote(id, { reminder: undefined }) ◄── Clear the reminder
    │
    └── Cleanup: clearInterval on unmount
```

### ◆ Pomodoro Timer State Machine (Editor.tsx)

```
         ┌──────────┐
         │   IDLE   │ ◄── pomodoroActive = false
         └─────┬────┘
               │ User activates pomodoro
               ▼
         ┌──────────┐
         │   WORK   │ ◄── pomodoroMode = 'work', pomodoroTime = 25*60 (25 min)
         │ RUNNING  │     pomodoroRunning = true
         └─────┬────┘     setInterval(1s): pomodoroTime--
               │
               │ pomodoroTime reaches 0
               ▼
         ┌──────────┐
         │  ALERT!  │ ◄── pomodoroAlert = true (3s visual flash)
         └─────┬────┘     pomodoroRunning = false
               │
               │ Auto-transition
               ▼
         ┌──────────┐
         │  BREAK   │ ◄── pomodoroMode = 'break', pomodoroTime = 5*60 (5 min)
         │ (paused) │     pomodoroRunning = false (user must start manually)
         └─────┬────┘
               │ pomodoroTime reaches 0
               ▼
         ┌──────────┐
         │   WORK   │ ◄── Cycle repeats: mode toggles, time resets
         └──────────┘
```

### ◆ Auto-Title System (Editor.tsx)

```
useEffect([note.content, note.title, isProcessing]) — 2-second debounce:
    │
    ├── Is title === "Void Entry" or empty/whitespace?
    ├── Is content.length > 30 characters?
    ├── Is isProcessing === false?
    │
    └── All true:
          └── Gemini.generateTitle(content) → onUpdate({ title: result })
                ├── Uses gemini-3-flash-preview
                └── Prompt: "Generate a very short, punchy, cyberpunk-style title (max 5 words)"
```

### ◆ Writing Streak System (Editor.tsx)

Tracks consecutive days of writing in `localStorage('void_writing_streak')`:

```json
{
    "lastWriteDate": "2025-02-17",
    "streak": 5,
    "longestStreak": 12
}
```

On content change (1-second debounce):
- If last write was **today** → No change (already counted)
- If last write was **yesterday** → streak + 1, update longestStreak if new record
- If last write was **2+ days ago** → streak resets to 1

---

## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
## ██ SECTION 9 — DATA MODELS ██
## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

### ◆ Note Interface (types.ts)

```typescript
interface Note {
  id: string;              // UUID v4 (generated by utils.tsx uuid())
  title: string;           // User-editable, auto-generated if "Void Entry" and content > 30 chars
  content: string;         // Raw Markdown text
  createdAt: number;       // Date.now() at creation
  updatedAt: number;       // Date.now() on every mutation
  tags: string[];          // Array of tag strings (stored WITHOUT # prefix)
  attachments: Attachment[]; // AI-generated images, videos, audio clips
  pinned?: boolean;        // Sticky to top of sidebar list
  archived?: boolean;      // Soft-archived (hidden from main list)
  archivedAt?: number;     // Timestamp when archived
  trashedAt?: number;      // Soft-deleted timestamp (recoverable until "Empty Trash")
  reminder?: number;       // Future timestamp for browser notification
  status?: 'todo' | 'in_progress' | 'done';  // Kanban board column
  folderId?: string;       // Parent folder ID for organization
}
```

### ◆ Supporting Types

```typescript
interface Folder {
  id: string;              // Date.now().toString()
  name: string;            // User-provided folder name
  parentId?: string;       // For nested folder hierarchy (currently unused in UI)
  createdAt: number;       // Date.now() at creation
}

interface NoteVersion {
  timestamp: number;       // When this snapshot was taken
  title: string;           // Title at snapshot time
  content: string;         // Full content at snapshot time
}

interface Attachment {
  id: string;              // Date.now().toString()
  type: 'image' | 'video' | 'audio';
  url: string;             // Data URL (base64) for images, Blob URL for videos
  mimeType: string;        // e.g., 'image/png', 'video/mp4'
  thumbnailUrl?: string;   // Optional preview thumbnail
  metadata?: string;       // AI generation prompt used to create this attachment
}

type AppView = 'editor' | 'live' | 'kanban' | 'calendar';

interface ChatMessage {
  id: string;              // Date.now().toString() or static '1' for initial message
  role: 'user' | 'model';
  text: string;            // Message content (markdown supported)
  timestamp: number;       // Date.now()
}

interface GroundingChunk {
  web?: {
    uri: string;           // URL of the web source
    title: string;         // Title of the web page
  };
  maps?: {
    uri: string;           // Google Maps URL
    title: string;         // Place name
    placeAnswerSources?: any[];
  };
}
```

---

## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
## ██ SECTION 10 — SECURITY CONSIDERATIONS ██
## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

| Concern | Mitigation |
|---|---|
| API Key exposure | Key injected at build time via Vite `define`, not committed to source |
| XSS in markdown | ReactMarkdown sanitizes by default; custom code renderers use SyntaxHighlighter (safe) |
| HTML export XSS | `escapeHtml()` function sanitizes all user content before embedding in HTML |
| Google OAuth tokens | Managed by Google's GIS library, never stored or accessed by VOID code |
| Data at rest | All data in browser storage — inherits browser's same-origin security model |
| Destructive actions | `window.confirm()` guards on: permanent delete, trash empty, cloud import overwrite |
| Client ID storage | Google OAuth Client ID stored in localStorage — visible but non-sensitive (public identifier) |

---

## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
## ██ SECTION 11 — RESPONSIVE DESIGN ██
## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

### ◆ Breakpoint Strategy

VOID uses Tailwind's default breakpoint: `md:` (768px) as the sole responsive breakpoint.

| Element | Mobile (< 768px) | Desktop (≥ 768px) |
|---|---|---|
| Layout direction | `flex-col` | `flex-row` |
| Sidebar | Overlay drawer (fixed, z-40, translate-x) | Inline panel (relative, always visible) |
| Sidebar toggle | Hamburger menu in mobile header | Always visible, no toggle needed |
| Mobile header | Visible (hamburger + logo) | Hidden (`md:hidden`) |
| Resize handle | Hidden (`hidden md:flex`) | Visible, draggable |
| Split pane | Hidden (`hidden md:block`) | Visible when splitNoteId set |
| Sidebar backdrop | Black overlay with blur on mobile | Not rendered |

---

*End of ARCHITECTURE.md — The ghost map is complete.*
