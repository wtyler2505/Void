# 🏗️ 𝗦𝗬𝗦𝗧𝗘𝗠 𝗔𝗥𝗖𝗛𝗜𝗧𝗘𝗖𝗧𝗨𝗥𝗘

> *Blueprint of the Digital Lattice.*

## 1. 𝗧𝗘𝗖𝗛 𝗦𝗧𝗔𝗖𝗞

The VOID interface is constructed using a high-performance, modern web stack designed for zero latency and maximum aesthetic impact.

*   **Framework**: React 19 (Experimental/Latest) - Leveraging concurrent features for smooth UI updates.
*   **Language**: TypeScript - Strict typing for neural data integrity.
*   **Bundler**: Vite - Lightning-fast HMR and build tooling (port 5000).
*   **Styling**: TailwindCSS (CDN) - Utility-first styling for rapid cyberpunk UI development.
*   **Typography**: IBM Plex Sans (UI) + JetBrains Mono (code blocks).
*   **AI SDK**: `@google/genai` - Direct interface to Gemini models via REST and WebSockets.
*   **Persistence**: IndexedDB (Primary) + LocalStorage (Fallback/Metadata) + Google Drive API (Cloud Sync).
*   **Icons**: Raw SVG components (Lucide-style) for zero-dependency weight.

## 2. 𝗙𝗜𝗟𝗘 𝗦𝗧𝗥𝗨𝗖𝗧𝗨𝗥𝗘

```
VOID/
├── components/              # React UI Components
│   ├── CalendarView.tsx         # Calendar-based note timeline view
│   ├── ChatOverlay.tsx          # Context-aware AI Assistant
│   ├── CommandPalette.tsx       # Quick-access command launcher (Cmd+K)
│   ├── Editor.tsx               # Main writing surface + Haunt/Preview
│   ├── ExportModal.tsx          # HTML export with XSS protection
│   ├── KanbanBoard.tsx          # Kanban board view (todo/in_progress/done)
│   ├── KeyboardShortcutsModal.tsx # Keyboard shortcuts reference
│   ├── LiveSession.tsx          # Gemini Live (Audio/Video) interface
│   ├── Onboarding.tsx           # First-run walkthrough experience
│   ├── Sidebar.tsx              # Navigation, Fusion Mode, Filtering
│   ├── SyncModal.tsx            # Google Drive & JSON Sync logic
│   └── VoidLogo.tsx             # SVG diamond emblem with neon glow
├── services/                # Logic & API Layers
│   ├── drive.ts                 # Google Drive API wrapper
│   ├── gemini.ts                # Google GenAI SDK wrapper
│   ├── shortcuts.ts             # Global keyboard hook
│   └── store.ts                 # IndexedDB wrapper + version history
├── ThemeContext.tsx          # Dark/Light theme + accent color provider
├── types.ts                 # TS Interfaces (Note, Folder, Attachment, etc.)
├── constants.tsx            # Icons & Static configs
├── utils.tsx                # Helpers (UUID, Formatting)
├── App.tsx                  # Root Logic & State Container
└── index.tsx                # Entry Point
```

## 3. 𝗦𝗧𝗔𝗧𝗘 𝗠𝗔𝗡𝗔𝗚𝗘𝗠𝗘𝗡𝗧

VOID uses a **Centralized Root State** pattern in `App.tsx` pushed down via props. This minimizes complexity and ensures a "single source of truth" for the active session.

### Core State (`App.tsx`)
*   `notes`: Array of all `Note` objects.
*   `activeNoteId`: Pointer to the currently open note.
*   `view`: Current mode (`editor` | `live` | `kanban` | `calendar`).
*   `folders`: Array of `Folder` objects for nested organization.
*   `isFusing`: Boolean flag for the Neural Fusion animation state.

### ThemeContext (`ThemeContext.tsx`)
A React Context provider wrapping the application, managing:
*   `theme`: Current mode (`dark` | `light`), persisted via `localStorage` key `void_theme`.
*   `accentColor`: Customizable primary accent (default `#00ff9d`), persisted via `localStorage` key `void_accent`.
*   `isDark`: Derived boolean for conditional styling.
*   Sets `data-theme` attribute on `<html>` and `--accent` CSS variable for global access.

### Persistence Strategy
1.  **Load**: On mount, `store.ts` attempts to load from IndexedDB. If empty, checks LocalStorage. If empty, initializes a "Void Entry".
2.  **Save**: `useEffect` hook in `App.tsx` debounces changes (800ms) and persists `notes` to IndexedDB.
3.  **Backup**: LocalStorage is used as a secondary, fast-access mirror (quota permitting).
4.  **Folders**: Persisted separately via `localStorage` key `void_folders`.
5.  **Sidebar Width**: Persisted via `localStorage` key `void_sidebar_width` (240-600px range).
6.  **Version History**: `saveNoteVersion` in `store.ts` records snapshots for undo timeline.

## 4. 𝗖𝗢𝗠𝗣𝗢𝗡𝗘𝗡𝗧 𝗛𝗜𝗘𝗥𝗔𝗥𝗖𝗛𝗬

1.  **App**: Holds data, manages routing (view state), handles global shortcuts, renders Modals.
2.  **Sidebar**:
    *   Manages `search` and `tagFilter` state locally.
    *   Handles Drag-and-Drop for **Neural Fusion**.
    *   Renders list of Active and Archived notes.
    *   Folder tree with nested structure and breadcrumb navigation.
    *   Customizable width (240-600px), persisted to localStorage.
3.  **Main Content Area**:
    *   **Editor**: The writing surface. Handles auto-resize, Markdown rendering, auto-titling, split-pane editing, and local AI tools (Summarize, Enhance).
        *   **HauntPanel**: Sub-component of Editor for displaying related notes.
    *   **KanbanBoard**: Board view organizing notes by `status` field (`todo` | `in_progress` | `done`).
    *   **CalendarView**: Timeline view of notes organized by date.
    *   **LiveSession**: Full-screen overlay for voice interaction.
    *   **ChatOverlay**: Floating AI assistant that can manipulate the `App` state via tool calling.
4.  **Overlays & Modals**:
    *   **CommandPalette**: Quick-access launcher triggered by `Cmd+K`.
    *   **Onboarding**: First-run walkthrough for new users.
    *   **ExportModal**: HTML export with XSS protection.
    *   **KeyboardShortcutsModal**: Keyboard shortcuts reference panel.
    *   **SyncModal**: Google Drive sync interface.
5.  **Branding**:
    *   **VoidLogo**: SVG diamond shape with circular void center and neon glow effect.

## 5. 𝗗𝗘𝗦𝗜𝗚𝗡 𝗦𝗬𝗦𝗧𝗘𝗠

*   **Colors**:
    *   Background: `#050505` (Dark) / `#f5f5f0` (Light)
    *   Primary Accent: `#00ff9d` (Cyber Green) — customizable via theme editor (12 presets + custom).
    *   Secondary: `#ff00ff` (Neon Magenta) - Used for Live/Haunt features.
    *   Surface: `#0a0a0a` / `#1a1a1a`
*   **Typography**: `IBM Plex Sans` for UI text, `JetBrains Mono` for code blocks and monospaced elements.
*   **Corners**: Sharp corners throughout — no border-radius. Cyberpunk aesthetic.
*   **Theme Switching**: Dark/Light mode via `ThemeContext`, with `data-theme` attribute on `<html>` for CSS targeting.
*   **Animations**: CSS Keyframes (`animate-pulse`, `animate-scan-smooth`, `animate-fade-in`) used heavily for system feedback.

---
*System Architecture Verified.*
