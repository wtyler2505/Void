# 👨‍💻 𝗗𝗘𝗩𝗘𝗟𝗢𝗣𝗘𝗥 𝗚𝗨𝗜𝗗𝗘

> *Technical Specifications for System Architects.*

## 1. 𝗧𝗘𝗖𝗛 𝗦𝗧𝗔𝗖𝗞

The VOID interface is constructed using a high-performance, modern web stack designed for zero latency.

*   **Core**: React 19 (Experimental) - Utilizing concurrent rendering.
*   **Language**: TypeScript - Strict typing enforced.
*   **AI SDK**: `@google/genai` (v1.34.0+) - Unified interface for Gemini models.
*   **Styling**: TailwindCSS - Utility-first.
*   **Bundler**: Built via standard React scripts (Webpack/Vite equivalent).
*   **Icons**: Raw SVG components (`constants.tsx`) to avoid heavy icon library dependencies.

## 2. 𝗣𝗥𝗢𝗝𝗘𝗖𝗧 𝗦𝗧𝗥𝗨𝗖𝗧𝗨𝗥𝗘

```
VOID/
├── components/          # UI COMPONENTS
│   ├── ChatOverlay.tsx      # Floating chat window with tool execution logic.
│   ├── Editor.tsx           # The primary workspace. Contains logic for text, attachments, and sub-panels.
│   ├── LiveSession.tsx      # Full-screen WebSocket audio interface.
│   ├── Sidebar.tsx          # Navigation, Filtering, and Drag-and-Drop targets.
│   ├── SyncModal.tsx        # Cloud synchronization logic.
│   └── ...                  # Utility modals (Export, Shortcuts).
├── services/            # BUSINESS LOGIC
│   ├── drive.ts             # Google Drive REST API wrapper.
│   ├── gemini.ts            # ALL AI interactions (Text, Image, Video, Audio).
│   ├── shortcuts.ts         # Global keyboard event listener hook.
│   └── store.ts             # Persistence layer (IndexedDB + LocalStorage).
├── docs/                # DOCUMENTATION
│   └── features/            # Granular feature documentation.
├── types.ts             # TypeScript Interfaces (Source of Truth for Data Models).
├── constants.tsx        # Icon definitions and static configs.
├── utils.tsx            # Stateless helper functions (UUID, Time formatting).
└── App.tsx              # ROOT CONTROLLER. Manages global state.
```

## 3. 𝗦𝗧𝗔𝗧𝗘 𝗠𝗔𝗡𝗔𝗚𝗘𝗠𝗘𝗡𝗧

VOID uses a **Unidirectional Data Flow** originating from `App.tsx`.

1.  **Root State**: `App.tsx` holds the master `notes` array and `activeNoteId`.
2.  **Prop Drilling**: State is passed down to `Sidebar` and `Editor`.
3.  ** Updates**: Components emit events (`onUpdate`, `onCreate`) which bubble up to `App.tsx`.
4.  **Persistence**: `App.tsx` uses a `useEffect` hook to watch the `notes` array. On change, it debounces the save operation to `store.ts`.

## 4. 𝗞𝗘𝗬 𝗗𝗘𝗩𝗘𝗟𝗢𝗣𝗠𝗘𝗡𝗧 𝗣𝗔𝗧𝗧𝗘𝗥𝗡𝗦

### The "Omnipotent" Tool Pattern
In `ChatOverlay.tsx`, the AI is given tools to manipulate `App.tsx` state. Since the Chat component is a child of App, we pass down state-mutating functions (`onCreateNote`, `onUpdateNote`) as props, which are then wrapped in `toolExecutor` functions invoked by the LLM.

### Optimistic UI Updates
When generating media (Images/Videos), the UI updates immediately with a loading state or placeholder, while the async operation continues. The `Editor` component handles the local loading states for these operations.

### Audio Context Management
`LiveSession.tsx` manually manages the `AudioContext`. Note that browsers require user interaction (click) before an AudioContext can resume. The component handles this via the "Connect" lifecycle.

## 5. 𝗖𝗢𝗗𝗘 𝗦𝗧𝗬𝗟𝗘

*   **Functional Components**: All UI elements must be React Functional Components (`React.FC`).
*   **Hooks**: Use custom hooks (`useGlobalShortcuts`) for logic that involves window event listeners.
*   **Async/Await**: Prefer `async/await` over raw Promises for readability.
*   **Tailwind**: Use arbitrary values `[...]` sparingly. Prefer standard utility classes or define theme extensions if needed.
*   **Void Aesthetic**: Use `#050505` for backgrounds, `#00ff9d` for primary accents, `#ff00ff` for secondary/AI accents.

---
*System Specifications Verified.*