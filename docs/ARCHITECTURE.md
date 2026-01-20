# 🏗️ 𝗦𝗬𝗦𝗧𝗘𝗠 𝗔𝗥𝗖𝗛𝗜𝗧𝗘𝗖𝗧𝗨𝗥𝗘

> *Blueprint of the Digital Lattice.*

## 1. 𝗧𝗘𝗖𝗛 𝗦𝗧𝗔𝗖𝗞

The VOID interface is constructed using a high-performance, modern web stack designed for zero latency and maximum aesthetic impact.

*   **Framework**: React 19 (Experimental/Latest) - Leveraging concurrent features for smooth UI updates.
*   **Language**: TypeScript - Strict typing for neural data integrity.
*   **Styling**: TailwindCSS - Utility-first styling for rapid cyberpunk UI development.
*   **AI SDK**: `@google/genai` - Direct interface to Gemini models via REST and WebSockets.
*   **Persistence**: IndexedDB (Primary) + LocalStorage (Fallback/Metadata) + Google Drive API (Cloud Sync).
*   **Icons**: Raw SVG components (Lucide-style) for zero-dependency weight.

## 2. 𝗙𝗜𝗟𝗘 𝗦𝗧𝗥𝗨𝗖𝗧𝗨𝗥𝗘

```
VOID/
├── components/          # React UI Components
│   ├── ChatOverlay.tsx      # Context-aware AI Assistant
│   ├── Editor.tsx           # Main writing surface + Haunt/Preview
│   ├── LiveSession.tsx      # Gemini Live (Audio/Video) interface
│   ├── Sidebar.tsx          # Navigation, Fusion Mode, Filtering
│   ├── SyncModal.tsx        # Google Drive & JSON Sync logic
│   └── ...                  # Modals (Export, Shortcuts)
├── services/            # Logic & API Layers
│   ├── drive.ts             # Google Drive API wrapper
│   ├── gemini.ts            # Google GenAI SDK wrapper
│   ├── shortcuts.ts         # Global keyboard hook
│   └── store.ts             # IndexedDB wrapper
├── types.ts             # TS Interfaces (Note, Attachment, etc.)
├── constants.tsx        # Icons & Static configs
├── utils.tsx            # Helpers (UUID, Formatting)
├── App.tsx              # Root Logic & State Container
└── index.tsx            # Entry Point
```

## 3. 𝗦𝗧𝗔𝗧𝗘 𝗠𝗔𝗡𝗔𝗚𝗘𝗠𝗘𝗡𝗧

VOID uses a **Centralized Root State** pattern in `App.tsx` pushed down via props. This minimizes complexity and ensures a "single source of truth" for the active session.

### Core State (`App.tsx`)
*   `notes`: Array of all `Note` objects.
*   `activeNoteId`: Pointer to the currently open note.
*   `view`: Current mode (`editor` vs `live`).
*   `isFusing`: Boolean flag for the Neural Fusion animation state.

### Persistence Strategy
1.  **Load**: On mount, `store.ts` attempts to load from IndexedDB. If empty, checks LocalStorage. If empty, initializes a "Void Entry".
2.  **Save**: `useEffect` hook in `App.tsx` debounces changes (800ms) and persists `notes` to IndexedDB.
3.  **Backup**: LocalStorage is used as a secondary, fast-access mirror (quota permitting).

## 4. 𝗖𝗢𝗠𝗣𝗢𝗡𝗘𝗡𝗧 𝗛𝗜𝗘𝗥𝗔𝗥𝗖𝗛𝗬

1.  **App**: Holds data, manages routing (view state), handles global shortcuts, renders Modals.
2.  **Sidebar**:
    *   Manages `search` and `tagFilter` state locally.
    *   Handles Drag-and-Drop for **Neural Fusion**.
    *   Renders list of Active and Archived notes.
3.  **Main Content Area**:
    *   **Editor**: The writing surface. Handles auto-resize, Markdown rendering, auto-titling, and local AI tools (Summarize, Enhance).
        *   **HauntPanel**: Sub-component of Editor for displaying related notes.
    *   **LiveSession**: Full-screen overlay for voice interaction.
    *   **ChatOverlay**: Floating AI assistant that can manipulate the `App` state via tool calling.

## 5. 𝗗𝗘𝗦𝗜𝗚𝗡 𝗦𝗬𝗦𝗧𝗘𝗠

*   **Colors**:
    *   Background: `#050505` (Void Black)
    *   Primary: `#00ff9d` (Cyber Green)
    *   Secondary: `#ff00ff` (Neon Magenta) - Used for Live/Haunt features.
    *   Surface: `#0a0a0a` / `#1a1a1a`
*   **Typography**: `JetBrains Mono` - Monospaced for data clarity and code aesthetics.
*   **Animations**: CSS Keyframes (`animate-pulse`, `animate-scan-smooth`, `animate-fade-in`) used heavily for system feedback.

---
*System Architecture Verified.*