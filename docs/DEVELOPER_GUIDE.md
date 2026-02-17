# 👨‍💻 𝗗𝗘𝗩𝗘𝗟𝗢𝗣𝗘𝗥 𝗚𝗨𝗜𝗗𝗘

> *Technical Specifications for System Architects.*

## 1. 𝗧𝗘𝗖𝗛 𝗦𝗧𝗔𝗖𝗞

The VOID interface is constructed using a high-performance, modern web stack designed for zero latency.

*   **Core**: React 19 (Experimental) - Utilizing concurrent rendering.
*   **Language**: TypeScript - Strict typing enforced.
*   **AI SDK**: `@google/genai` (v1.34.0+) - Unified interface for Gemini models.
*   **Styling**: TailwindCSS (CDN) - Utility-first.
*   **Bundler**: Vite - Fast HMR dev server on port 5000, optimized production builds.
*   **Typography**: IBM Plex Sans (UI) + JetBrains Mono (code blocks).
*   **Icons**: Raw SVG components (`constants.tsx`) to avoid heavy icon library dependencies.

## 2. 𝗣𝗥𝗢𝗝𝗘𝗖𝗧 𝗦𝗧𝗥𝗨𝗖𝗧𝗨𝗥𝗘

```
VOID/
├── components/              # UI COMPONENTS
│   ├── CalendarView.tsx         # Calendar-based note timeline view.
│   ├── ChatOverlay.tsx          # Floating chat window with tool execution logic.
│   ├── CommandPalette.tsx       # Quick-access command launcher (Cmd+K).
│   ├── Editor.tsx               # The primary workspace. Text, attachments, split-pane, sub-panels.
│   ├── ExportModal.tsx          # HTML export with XSS protection.
│   ├── KanbanBoard.tsx          # Kanban board view (todo/in_progress/done columns).
│   ├── KeyboardShortcutsModal.tsx # Keyboard shortcuts cheat sheet modal.
│   ├── LiveSession.tsx          # Full-screen WebSocket audio interface.
│   ├── Onboarding.tsx           # First-run onboarding walkthrough.
│   ├── Sidebar.tsx              # Navigation, Filtering, Folders, and Drag-and-Drop targets.
│   ├── SyncModal.tsx            # Cloud synchronization logic.
│   └── VoidLogo.tsx             # SVG diamond emblem with neon glow effect.
├── services/                # BUSINESS LOGIC
│   ├── drive.ts                 # Google Drive REST API wrapper.
│   ├── gemini.ts                # ALL AI interactions (Text, Image, Video, Audio).
│   ├── shortcuts.ts             # Global keyboard event listener hook.
│   └── store.ts                 # Persistence layer (IndexedDB + LocalStorage + version history).
├── docs/                    # DOCUMENTATION
│   └── features/                # Granular feature documentation.
├── ThemeContext.tsx          # React Context for dark/light theme + accent color.
├── types.ts                 # TypeScript Interfaces (Source of Truth for Data Models).
├── constants.tsx            # Icon definitions and static configs.
├── utils.tsx                # Stateless helper functions (UUID, Time formatting).
├── App.tsx                  # ROOT CONTROLLER. Manages global state.
└── index.tsx                # Entry Point.
```

## 3. 𝗦𝗧𝗔𝗧𝗘 𝗠𝗔𝗡𝗔𝗚𝗘𝗠𝗘𝗡𝗧

VOID uses a **Unidirectional Data Flow** originating from `App.tsx`.

1.  **Root State**: `App.tsx` holds the master `notes` array, `activeNoteId`, `folders`, and `view` (editor | live | kanban | calendar).
2.  **Prop Drilling**: State is passed down to `Sidebar`, `Editor`, `KanbanBoard`, `CalendarView`, and modal components.
3.  **Updates**: Components emit events (`onUpdate`, `onCreate`) which bubble up to `App.tsx`.
4.  **Persistence**: `App.tsx` uses a `useEffect` hook to watch the `notes` array. On change, it debounces the save operation to `store.ts`.
5.  **ThemeContext**: Wraps the entire app via `ThemeProvider`. Components access `isDark`, `accentColor`, `toggleTheme`, and `setAccentColor` via the `useTheme()` hook. Theme and accent are persisted to `localStorage` (`void_theme`, `void_accent`).

## 4. 𝗞𝗘𝗬 𝗗𝗘𝗩𝗘𝗟𝗢𝗣𝗠𝗘𝗡𝗧 𝗣𝗔𝗧𝗧𝗘𝗥𝗡𝗦

### The "Omnipotent" Tool Pattern
In `ChatOverlay.tsx`, the AI is given tools to manipulate `App.tsx` state. Since the Chat component is a child of App, we pass down state-mutating functions (`onCreateNote`, `onUpdateNote`) as props, which are then wrapped in `toolExecutor` functions invoked by the LLM.

### ThemeContext Pattern
`ThemeContext.tsx` provides a React Context for theme state. The `ThemeProvider` wraps the app in `index.tsx`. Components consume it via `useTheme()`. It persists `theme` and `accentColor` to `localStorage` and sets `data-theme` on `<html>` plus `--accent` as a CSS custom property.

### VoidLogo Component
`VoidLogo.tsx` renders the brand emblem — an SVG diamond shape with a circular void center and neon glow effect. Used in the sidebar header and onboarding.

### Folder Persistence
Folders are stored in `localStorage` under the key `void_folders`. They support nesting via the `parentId` field on the `Folder` interface. Notes reference folders via `folderId`.

### Version History
`store.ts` exposes `saveNoteVersion(noteId, version)` and `loadNoteVersions(noteId)` for recording note snapshots. These power the version history/undo timeline feature in the Editor.

### Optimistic UI Updates
When generating media (Images/Videos), the UI updates immediately with a loading state or placeholder, while the async operation continues. The `Editor` component handles the local loading states for these operations.

### Audio Context Management
`LiveSession.tsx` manually manages the `AudioContext`. Note that browsers require user interaction (click) before an AudioContext can resume. The component handles this via the "Connect" lifecycle.

## 5. 𝗖𝗢𝗗𝗘 𝗦𝗧𝗬𝗟𝗘

*   **Functional Components**: All UI elements must be React Functional Components (`React.FC`).
*   **Hooks**: Use custom hooks (`useGlobalShortcuts`) for logic that involves window event listeners. Use `useTheme()` for theme-aware styling.
*   **Async/Await**: Prefer `async/await` over raw Promises for readability.
*   **Tailwind**: Use arbitrary values `[...]` sparingly. Prefer standard utility classes or define theme extensions if needed.
*   **Void Aesthetic**: 
    *   Backgrounds: `#050505` (dark) / `#f5f5f0` (light).
    *   Primary accent: `#00ff9d` (customizable via theme editor, 12 presets + custom).
    *   Secondary/AI accent: `#ff00ff`.
    *   Sharp corners throughout — no `border-radius`. Cyberpunk aesthetic.
    *   Typography: `IBM Plex Sans` for UI, `JetBrains Mono` for code.

---
*System Specifications Verified.*
