# ◆ VOID — DEVELOPER GUIDE

> *"You don't build the void. You become it."*

---

## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
## ██ SECTION 0 — GETTING STARTED ██
## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

### ◆ Prerequisites

- Node.js 18+ (or 20+ recommended)
- npm (comes with Node.js)
- A Google Gemini API key (from [Google AI Studio](https://aistudio.google.com/))

### ◆ Setup

```bash
# 1. Clone the repository
git clone <repo-url> void
cd void

# 2. Install dependencies
npm install

# 3. Set your Gemini API key
#    Create a .env file in the project root:
echo "GEMINI_API_KEY=your-api-key-here" > .env

# 4. Start the dev server
npm run dev
#    → Opens at http://localhost:5000
```

### ◆ Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Google Gemini API key. Injected at build time via Vite `define`. Mapped to `process.env.API_KEY` and `process.env.GEMINI_API_KEY` in code. |

The Vite config (`vite.config.ts`) handles the mapping:
```typescript
define: {
    'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
}
```

**Note:** This is a compile-time injection, not a runtime environment variable. The key is embedded in the built JavaScript bundle. For production, ensure your key has appropriate restrictions.

### ◆ Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server on port 5000 with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |

---

## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
## ██ SECTION 1 — PROJECT STRUCTURE ██
## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

### ◆ Every File Explained

| File | LOC | Purpose |
|---|---|---|
| **`index.html`** | 78 | HTML shell. Loads TailwindCSS CDN, Google Fonts (IBM Plex Sans, JetBrains Mono), custom CSS (neon utilities, markdown preview, scrollbar, logo animation), Google Drive API scripts (gsi/client, api.js). Entry script: `/index.tsx`. |
| **`index.tsx`** | 18 | React entry point. Creates root with `ReactDOM.createRoot`, wraps `<App>` in `<React.StrictMode>` and `<ThemeProvider>`. |
| **`App.tsx`** | ~700 | **The brain.** All application state (notes, activeNoteId, view, modals, folders, sidebar width, etc.). All callbacks (create, update, delete, archive, trash, fuse, quick capture). All persistence effects. Keyboard shortcut wiring. Main render tree with conditional view switching and overlay rendering. |
| **`ThemeContext.tsx`** | 49 | React Context provider for dark/light mode and accent color. Persists to localStorage. Sets CSS custom property `--accent` and `data-theme` attribute on `<html>`. |
| **`types.ts`** | 59 | All TypeScript interfaces: `Note` (15 fields), `Folder`, `NoteVersion`, `Attachment`, `AppView`, `ChatMessage`, `GroundingChunk`. |
| **`utils.tsx`** | 125 | Pure utilities. `createNewNote()` factory, `formatTime()` formatter, `NOTE_TEMPLATES` (6 templates), `JOURNAL_PROMPTS` (31 prompts), `getDailyPrompt()` (day-of-year rotation), `getTagColor()` (deterministic hash-based color). |
| **`constants.tsx`** | 51 | `TAG_COLORS` (10 hex colors) and `ICONS` (25+ inline SVG React components). |
| **`vite.config.ts`** | 24 | Vite configuration: port 5000, host 0.0.0.0, allowedHosts true, React plugin, env var mapping, `@/` path alias. |
| **`tsconfig.json`** | — | TypeScript compiler configuration (strict mode). |
| **`package.json`** | 28 | Dependencies and scripts. |

### ◆ Components Directory (12 files)

| Component | LOC | Role |
|---|---|---|
| **`Editor.tsx`** | 1430 | The heart. Title input, rich toolbar, textarea with auto-resize, markdown preview, slash commands, wiki-link autocomplete, pomodoro timer, zen mode, version history, haunt (related notes), reminders, writing streak, word goals, image/video/audio attachments, AI operations (summarize, enhance, transcribe, TTS, image gen). |
| **`Sidebar.tsx`** | 824 | Navigation and organization. Logo, search, 6-button action grid, daily journal prompt, note templates, sort controls, folder tree, tag filter bar, note list (pinnable, draggable for fusion), archive section, trash section, theme editor, footer stats, multi-select bulk actions, view density toggle. |
| **`ChatOverlay.tsx`** | 357 | AI chat panel. Message history, grounding mode toggle (none/search/maps), geolocation for maps, tool executor (bridges 16 AI function calls to React state), vault intelligence (client-side semantic scoring), markdown rendering for AI responses, grounding chunk display. |
| **`ExportModal.tsx`** | 326 | Export options. Copy to clipboard, download as Markdown (.md), plain text (.txt), JSON (.json), styled HTML (.html with inline CSS), and print (browser print dialog). Includes full markdown-to-HTML converter with escaping. |
| **`SyncModal.tsx`** | 218 | Data synchronization. Two tabs: Google Drive (OAuth setup, push/pull) and Manual File (export/import JSON). Stores Google Client ID in localStorage. |
| **`CommandPalette.tsx`** | 209 | Cmd+K quick actions. 6 built-in actions (New Note, Open Chat, Export, Archive, Shortcuts, Sync) + fuzzy search across all notes. Keyboard navigation (arrows, enter). |
| **`LiveSession.tsx`** | 188 | Real-time voice AI. Connects to Gemini Live API with bidirectional audio streaming. PCM16 encoding for input, AudioContext for output playback. Shows connection status and transcripts. |
| **`VoidLogo.tsx`** | 100 | SVG diamond emblem. Two nested diamond shapes with central circle, connecting lines, and glow filter (`feGaussianBlur` + `feFlood`). Optional text label. Optional pulse animation. Uses accent color from ThemeContext. |
| **`Onboarding.tsx`** | 96 | 8-step new user tour. Welcome → Create Notes → Slash Commands → Link Notes → AI Assistant → Quick Capture → Command Palette → Ready. Step dots indicator, skip option. Sets `void_onboarding_done` in localStorage. |
| **`CalendarView.tsx`** | 93 | Monthly calendar grid. Shows notes plotted by creation date. Navigate months. Today highlighting. Click note to switch to editor. Max 3 notes per cell with overflow count. |
| **`KanbanBoard.tsx`** | 91 | Three-column board: TO DO (red), IN PROGRESS (yellow), DONE (green). Cards show title, content preview, tags. Inline status dropdown to move between columns. Filters out archived/trashed notes. |
| **`KeyboardShortcutsModal.tsx`** | 52 | Keyboard reference overlay. 10 shortcuts displayed in a responsive grid. Each shows key combination and description. Styled as `<kbd>` elements. |

### ◆ Services Directory (4 files)

| Service | LOC | Role |
|---|---|---|
| **`gemini.ts`** | 657 | ALL AI operations. 14 exported functions + 16 tool declarations. Model selection per task. Function calling loop. Paid key detection. Blob↔base64 conversion. |
| **`store.ts`** | 172 | Persistence layer. IndexedDB (primary) + localStorage (backup) dual-write. Version history (max 50 per note). Legacy key migration. Base64→Blob utility. |
| **`drive.ts`** | 125 | Google Drive sync. OAuth 2.0 flow (GIS + GAPI). Backup file CRUD (void_notes_backup.json). Multipart upload/download. |
| **`shortcuts.ts`** | 85 | Keyboard shortcuts. `useGlobalShortcuts` hook. Input-aware filtering. 10 shortcut bindings. |

---

## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
## ██ SECTION 2 — HOW TO ADD A NEW COMPONENT ██
## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

### ◆ Step-by-Step

**1. Create the file in `components/`**

```typescript
// components/MyComponent.tsx
import React from 'react';
import { useTheme } from '../ThemeContext';
import { ICONS } from '../constants';

interface MyComponentProps {
  onClose: () => void;
  // ... your props
}

export const MyComponent: React.FC<MyComponentProps> = ({ onClose }) => {
  const { isDark, accentColor } = useTheme();  // ALWAYS consume theme

  return (
    <div className={`${isDark ? 'bg-[#0a0a0a] text-gray-200' : 'bg-white text-gray-800'}`}>
      {/* Your component */}
    </div>
  );
};
```

**2. Add state in App.tsx for the modal/overlay toggle**

```typescript
const [isMyComponentOpen, setIsMyComponentOpen] = useState(false);
```

**3. Render conditionally in App.tsx's overlay section**

```typescript
{isMyComponentOpen && (
  <MyComponent
    onClose={() => setIsMyComponentOpen(false)}
    // ... pass needed props
  />
)}
```

**4. Wire up a way to open it** (sidebar button, toolbar button, keyboard shortcut, or command palette action)

### ◆ Component Conventions

| Convention | Rule |
|---|---|
| Theme | Always use `useTheme()` hook. Apply dark/light styles via ternary: `isDark ? 'dark-class' : 'light-class'` |
| Icons | Import from `constants.tsx`: `import { ICONS } from '../constants'`. Use as JSX: `<ICONS.Close />` |
| Types | Import from `types.ts`. Never define Note/Folder/etc inline. |
| Utilities | Import from `utils.tsx` for `formatTime`, `getTagColor`, etc. |
| Naming | Export as named export (not default), except CalendarView and KanbanBoard which use default exports |
| Styling | Use Tailwind classes. Custom CSS goes in `index.html <style>` block. |
| Borders | **NEVER use rounded corners** (`rounded-*`). The only exception is the scrollbar thumb and specific pill elements. Sharp corners = cyberpunk aesthetic. |
| Colors | Use raw hex values for dark theme (`#050505`, `#0a0a0a`, `#111`, `#1a1a1a`, `#222`, `#333`). Use Tailwind gray scale for light theme. |
| Modals | Use `fixed inset-0 z-[50-100]` with `bg-black/80` or `bg-black/90` backdrop and `backdrop-blur-sm`. |
| Animations | Use Tailwind utilities (`animate-pulse`, `animate-bounce`) or custom keyframes in index.html. |
| Font | UI text inherits IBM Plex Sans from body. Code/mono text uses `font-mono` (JetBrains Mono). |

---

## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
## ██ SECTION 3 — HOW TO ADD A NEW AI TOOL ██
## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

Adding a new function that the AI chat can call involves 3 files:

### ◆ Step 1: Add the Function Declaration (services/gemini.ts)

Add to the `noteTools` array:

```typescript
{
    name: 'my_new_tool',
    description: 'What this tool does. Be specific — the AI reads this to decide when to use it.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            param1: { type: Type.STRING, description: 'Description for the AI.' },
            param2: { type: Type.NUMBER, description: 'Optional numeric param.' }
        },
        required: ['param1']
    }
}
```

**Tips for good declarations:**
- Use clear, action-oriented descriptions
- Make parameter descriptions specific (the AI uses these to fill in values)
- Mark truly optional parameters as NOT in `required`
- Use `enum` for constrained string values

### ◆ Step 2: Add the Executor (components/ChatOverlay.tsx)

Inside the `toolExecutor` function in `handleSend()`, add a new `if` block:

```typescript
if (name === 'my_new_tool') {
    // Execute the action
    const result = doSomething(args.param1, args.param2);
    return `Result: ${result}`;  // String returned to the AI
}
```

**Categories of execution:**
- **Global tools** (no active note needed): Place before the `if (!contextNote)` guard
- **Contextual tools** (need active note): Place after the guard

The return value is sent back to the AI as the function response, so it should be informative enough for the AI to formulate a useful reply to the user.

### ◆ Step 3: Pass the Callback from App.tsx (if needed)

If your tool needs to modify application state:

1. Add a callback prop to `ChatOverlayProps` interface
2. Create a `useCallback` handler in App.tsx
3. Pass it through the `<ChatOverlay>` JSX

### ◆ Step 4: Update the System Instruction (optional)

In `chatWithContext()`, the system instruction describes the AI's capabilities. If your tool adds a significant new capability, add a directive:

```typescript
const systemInstruction = `...
6. MY_CAPABILITY: You can now do X using \`my_new_tool\`.
...`;
```

---

## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
## ██ SECTION 4 — HOW TO ADD A KEYBOARD SHORTCUT ██
## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

### ◆ Step 1: Add handler to `ShortcutHandlers` interface (services/shortcuts.ts)

```typescript
export interface ShortcutHandlers {
  // ... existing handlers
  onMyAction: () => void;
}
```

### ◆ Step 2: Add the key binding (services/shortcuts.ts)

Inside the `switch (e.key.toLowerCase())` block:

```typescript
case 'j':  // Ctrl+J
    e.preventDefault();
    handlers.onMyAction();
    break;
```

For key combinations with Shift:
```typescript
case 'j':
    if (e.shiftKey) {  // Ctrl+Shift+J
        e.preventDefault();
        handlers.onMyAction();
    }
    break;
```

### ◆ Step 3: Wire the handler in App.tsx

```typescript
useGlobalShortcuts({
    // ... existing handlers
    onMyAction: () => {
        // Do something
    },
});
```

### ◆ Step 4: Add to keyboard shortcuts display (components/KeyboardShortcutsModal.tsx)

```typescript
const shortcuts = [
    // ... existing
    { keys: ['Ctrl', 'J'], desc: 'My Action' },
];
```

### ◆ Step 5: Add to command palette (components/CommandPalette.tsx)

```typescript
const actions: ActionItem[] = useMemo(() => [
    // ... existing
    { id: 'my-action', label: 'My Action', icon: <ICONS.Sparkle />,
      action: () => { onMyAction(); onClose(); }, shortcut: '⌘J' },
], [...deps]);
```

(Requires adding `onMyAction` to `CommandPaletteProps` and passing from App.tsx.)

---

## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
## ██ SECTION 5 — HOW TO ADD A NOTE TEMPLATE ██
## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

Templates are defined in `utils.tsx`. Just add to the `NOTE_TEMPLATES` array:

```typescript
export const NOTE_TEMPLATES: NoteTemplate[] = [
    // ... existing templates
    {
        id: 'weekly-review',
        name: 'Weekly Review',
        icon: '📊',
        content: `## Week of\n\n\n## Wins\n\n- \n\n## Challenges\n\n- \n\n## Next Week\n\n- [ ] \n`
    }
];
```

**Template interface:**
```typescript
interface NoteTemplate {
  id: string;    // Unique identifier (kebab-case)
  name: string;  // Display name in template dropdown
  icon: string;  // Emoji icon
  content: string; // Markdown content with \n for line breaks
}
```

No other changes needed — the Sidebar automatically renders all templates from this array.

---

## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
## ██ SECTION 6 — HOW TO ADD A NEW VIEW ██
## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

The app has 4 views: `editor`, `live`, `kanban`, `calendar`. To add a 5th:

### ◆ Step 1: Update the AppView type (types.ts)

```typescript
export type AppView = 'editor' | 'live' | 'kanban' | 'calendar' | 'myview';
```

### ◆ Step 2: Create the view component (components/MyView.tsx)

```typescript
import React from 'react';
import { Note } from '../types';
import { useTheme } from '../ThemeContext';

interface MyViewProps {
    notes: Note[];
    onSelectNote: (id: string) => void;
}

export default function MyView({ notes, onSelectNote }: MyViewProps) {
    const { isDark } = useTheme();
    return (
        <div className="flex-1 h-full overflow-hidden flex flex-col">
            {/* Your view content */}
        </div>
    );
}
```

### ◆ Step 3: Add the view switch in App.tsx's render

```typescript
{view === 'myview' && (
    <MyView
        notes={notes}
        onSelectNote={(id) => { handleSelectNote(id); setView('editor'); }}
    />
)}
```

### ◆ Step 4: Add a toggle callback for the Sidebar

```typescript
// In App.tsx, add to Sidebar props:
onToggleMyView={() => { setView(v => v === 'myview' ? 'editor' : 'myview'); setIsSidebarOpen(false); }}
```

### ◆ Step 5: Add the button in Sidebar.tsx

Add to the action grid section and add `onToggleMyView` to `SidebarProps`.

---

## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
## ██ SECTION 7 — CODE CONVENTIONS ██
## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

### ◆ Visual Design Rules

| Rule | Details |
|---|---|
| **No rounded corners** | Never use `rounded-*` classes. Everything has sharp, 90° corners. The only exceptions are scrollbar thumb (`border-radius: 0` is explicitly set) and occasional pill elements. This is the core cyberpunk visual identity. |
| **Neon glow effects** | Use `.neon-border` and `.neon-text` classes for accent emphasis. Apply sparingly. |
| **Accent color** | Reference via `accentColor` from `useTheme()` for inline styles, or use `text-[#00ff9d]` / `bg-[#00ff9d]` for the default. |
| **Uppercase tracking** | Headers and labels use `uppercase tracking-widest` or `tracking-wider` extensively. This is the cyberpunk typography convention. |
| **Font weights** | Use `font-bold` for headers and emphasis. The body font is `font-weight: 400` (regular). |
| **Text sizes** | Use `text-xs` (12px) for labels and meta info. `text-sm` (14px) for body. `text-[10px]` and `text-[9px]` for micro-text (tag pills, kanban labels). |
| **Hover states** | Subtle color transitions: `hover:text-[#00ff9d]` (dark) or `hover:text-green-600` (light). Never use scale transforms for hover. |

### ◆ Naming Conventions

| Context | Convention | Example |
|---|---|---|
| Components | PascalCase, named export | `export const Editor: React.FC<EditorProps>` |
| Components (default) | PascalCase, default export | `export default function KanbanBoard()` |
| Props interfaces | `ComponentNameProps` | `EditorProps`, `SidebarProps` |
| Callbacks | `on` prefix | `onUpdate`, `onSelectNote`, `onClose` |
| Handlers | `handle` prefix | `handleCreateNote`, `handleResizeStart` |
| State | Descriptive camelCase | `isRecording`, `showPreview`, `pomodoroActive` |
| Refs | camelCase + `Ref` suffix | `textareaRef`, `mediaRecorderRef`, `notesRef` |
| localStorage keys | `void_` prefix, snake_case | `void_notes_data`, `void_active_note` |
| CSS classes | Tailwind utilities + custom classes | `neon-border`, `void-logo-pulse`, `markdown-preview` |
| AI tool names | snake_case | `search_notes`, `generate_image_attachment` |

### ◆ Cyberpunk Vocabulary

The codebase uses thematic naming throughout:

| Standard Term | VOID Term |
|---|---|
| Note database | Vault |
| Related notes | Haunt |
| Note merge/combine | Neural Fusion |
| AI-created note | Genesis |
| Live voice session | Live Matrix |
| Note enhancement | Enhancement |
| Text-to-speech | Vocalize |
| Search/find | Scan |
| Theme editor | Theme Customization |
| Loading | "Recalling Memory Blocks" |
| Export | Data Export |
| Sync | Data Link |
| Keyboard shortcuts | System Controls |

### ◆ TypeScript Patterns

```typescript
// ✅ Correct: useCallback with explicit empty deps for stable references
const handleCreateNote = useCallback(() => {
    const newNote = createNewNote();
    setNotes(prev => [newNote, ...prev]);  // Functional updater
    setActiveNoteId(newNote.id);
}, []);

// ✅ Correct: useRef for values needed in async callbacks
const notesRef = useRef(notes);
useEffect(() => { notesRef.current = notes; }, [notes]);

// ✅ Correct: Derived state as inline computation (no useState)
const activeNote = notes.find(n => n.id === activeNoteId) || null;

// ✅ Correct: Conditional rendering for overlays
{isChatOpen && <ChatOverlay onClose={() => setIsChatOpen(false)} />}

// ❌ Wrong: Don't use rounded corners
<div className="rounded-lg">  // NEVER

// ❌ Wrong: Don't use external state libraries
import { create } from 'zustand';  // NEVER — all state in App.tsx
```

---

## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
## ██ SECTION 8 — DESIGN TOKENS & COLORS ██
## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

### ◆ Dark Mode Palette (Primary)

```
Background layers (darkest → lightest):
  #050505  ─── Page background, deepest void
  #0a0a0a  ─── Sidebar background, elevated panels
  #0f0f0f  ─── Scrollbar track
  #111     ─── Card backgrounds, code blocks, inputs
  #1a1a1a  ─── Surface elements, borders (default)
  #222     ─── Elevated borders, subtle dividers
  #333     ─── Strong borders, scrollbar thumb, dividers

Text layers:
  white    ─── Emphatic text, strong headings
  gray-200 ─── Primary body text (#e5e7eb)
  gray-300 ─── Secondary text
  gray-400 ─── Tertiary text, labels
  gray-500 ─── Muted text
  gray-600 ─── Disabled text, placeholders

Accent:
  #00ff9d  ─── Primary accent (neon green)
  #00e68a  ─── Accent hover state
  #00cc7d  ─── Accent active state
  rgba(0,255,157,0.2)  ─── Accent glow (box-shadow)
  rgba(0,255,157,0.3)  ─── Accent border (neon-border)
  rgba(0,255,157,0.5)  ─── Accent text-shadow (neon-text)
  rgba(0,255,157,0.05) ─── Accent background tint
```

### ◆ Light Mode Palette

```
Backgrounds:
  #f5f5f0  ─── Page background (warm off-white)
  white    ─── Sidebar, cards, panels

Text:
  gray-800 ─── Primary text
  gray-700 ─── Secondary text
  gray-600 ─── Tertiary text
  gray-500 ─── Muted text
  gray-400 ─── Disabled text

Accent:
  green-600 ─── Text accent (replacing neon green for readability)
  green-50  ─── Background accent tint

Borders:
  gray-200  ─── Default borders
  gray-300  ─── Strong borders
  gray-100  ─── Subtle borders
```

### ◆ Semantic Colors (Both Modes)

```
Kanban columns:
  #ff6b6b  ─── TO DO (coral red)
  #ffd93d  ─── IN PROGRESS (yellow)
  #00ff9d  ─── DONE (neon green)

Tag colors (deterministic hash):
  #00ff9d  #00d2ff  #ff6b6b  #ffd93d  #c084fc
  #ff6bcb  #ff9f43  #54a0ff  #5f27cd  #01a3a4

Selection:
  bg-[#00ff9d] text-black  ─── Text selection highlight (both modes)
```

---

## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
## ██ SECTION 9 — CSS ARCHITECTURE ██
## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

### ◆ Three Styling Layers

**Layer 1: TailwindCSS CDN** (runtime, from `<script src="cdn.tailwindcss.com">`)
- Provides all standard Tailwind utility classes
- JIT mode runs in the browser
- No configuration file — uses defaults
- Arbitrary values supported: `bg-[#050505]`, `text-[10px]`, `w-[320px]`

**Layer 2: Custom CSS** (in `index.html <style>` block)
```css
/* Base styles */
body { font-family: 'IBM Plex Sans', ...; background: #050505; }

/* Scrollbar customization */
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: #0f0f0f; }
::-webkit-scrollbar-thumb { background: #333; border-radius: 0; }
::-webkit-scrollbar-thumb:hover { background: #00ff9d; }

/* Neon utility classes */
.neon-border { box-shadow: ...; border: ...; }
.neon-text { text-shadow: ...; }
.neon-pink-border { ... }

/* Markdown rendering styles */
.markdown-preview h1 { color: #00ff9d; ... }
.markdown-preview code { color: #00ff9d; background: #1a1a1a; }
.markdown-preview pre { background: #111; border: 1px solid #333; }
...

/* Keyframe animations */
@keyframes void-pulse { ... }
.void-logo-pulse { animation: void-pulse 2.5s ease-in-out infinite; }
```

**Layer 3: Inline Styles** (for dynamic values)
```typescript
style={{ color: accentColor }}           // Dynamic accent color
style={{ width: `${sidebarWidth}px` }}   // Dynamic sidebar width
style={{ backgroundColor: col.color }}   // Kanban column colors
```

### ◆ CSS Custom Property

```css
:root { --accent: #00ff9d; }
```

Updated at runtime by ThemeContext:
```typescript
document.documentElement.style.setProperty('--accent', accentColor);
```

---

## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
## ██ SECTION 10 — BUILD & DEPLOYMENT ██
## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

### ◆ Development

```bash
npm run dev
# Vite dev server on http://0.0.0.0:5000
# HMR enabled via @vitejs/plugin-react
# All env vars loaded from .env file
```

### ◆ Production Build

```bash
npm run build
# Output: dist/
# index.html + bundled JS + assets
```

**Build-time considerations:**
- `GEMINI_API_KEY` is baked into the bundle via `define` — it's not a runtime secret
- TailwindCSS CDN is loaded from external CDN — no CSS in bundle
- Google Fonts loaded from external CDN — no fonts in bundle
- Google Drive API scripts loaded from external CDN

### ◆ Deployment

VOID is a fully static SPA — deploy to any static hosting:

```bash
# Replit
npm run build
# Configure: static deployment, public_dir: "dist"

# Netlify / Vercel
# Set GEMINI_API_KEY env var
# Build command: npm run build
# Publish directory: dist

# Manual
# npm run build
# Serve dist/ with any HTTP server
```

**Critical:** The API key is in the client-side JavaScript. For production deployments:
- Use API key restrictions (HTTP referrer restrictions in Google Cloud Console)
- Consider a backend proxy for the Gemini API if security is a concern
- The app works without an API key — AI features simply fail gracefully

---

## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
## ██ SECTION 11 — PERFORMANCE CONSIDERATIONS ██
## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

### ◆ Render Optimization

| Technique | Where | Why |
|---|---|---|
| `useCallback` | All App.tsx handlers | Prevents child re-renders when parent state changes |
| `useMemo` | Sidebar (tag list, storage size, filtered/sorted notes), CommandPalette (actions, filtered) | Avoids recomputing expensive derivations |
| `useRef` for non-render state | App.tsx (notesRef, resize refs, version timeout) | Avoids re-renders for values that don't affect UI |
| `useLayoutEffect` | Editor (textarea auto-resize) | Prevents visual flicker on height change |
| Functional state updaters | `setNotes(prev => ...)` | Avoids stale closure bugs, doesn't need deps |
| Debounced persistence | 800ms setTimeout on notes save | Prevents IndexedDB spam during fast typing |
| Debounced version save | 30s setTimeout per note | Only snapshots during editing pauses |
| Debounced auto-title | 2s setTimeout | Only fires when user stops typing |
| Conditional rendering | All overlays/modals | Components not mounted = zero cost |

### ◆ Memory Considerations

| Concern | Mitigation |
|---|---|
| Large notes array | Stored as single IDB key — simple but means full array read/write |
| Base64 images in notes | May exceed localStorage quota — IDB is primary for this reason |
| Version history | Capped at 50 per note, stored separately from notes |
| Blob URLs (video) | Created via `URL.createObjectURL` — should be revoked when no longer needed |
| Chat history | Kept in component state (ChatOverlay) — cleared on component unmount |
| Live audio buffers | Cleaned up on disconnect in LiveSession useEffect cleanup |

### ◆ Known Performance Caveats

1. **TailwindCSS CDN** — The CDN version generates CSS at runtime, which is slower than a build-time approach. Acceptable for this app's scale.
2. **Full notes array save** — Every save writes the entire notes array to IDB. For very large vaults (1000+ notes with attachments), this could become slow. Consider per-note storage for scale.
3. **SyntaxHighlighter bundle** — `react-syntax-highlighter` with Prism adds significant bundle size. Only loaded when markdown preview is active.
4. **Video generation polling** — Polls every 5 seconds until complete. Not resource-intensive but keeps a promise chain alive.

---

## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
## ██ SECTION 12 — TESTING ██
## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

VOID currently has no automated test suite. If adding tests:

### ◆ Recommended Stack

- **Unit tests**: Vitest (Vite-native, fastest for this project)
- **Component tests**: React Testing Library
- **E2E tests**: Playwright or Cypress

### ◆ Testing Priorities

1. **`services/store.ts`** — Mock IndexedDB (use `fake-indexeddb`), test dual-write, migration, version history
2. **`utils.tsx`** — Pure functions, easiest to test (createNewNote, formatTime, getTagColor, getDailyPrompt)
3. **`services/shortcuts.ts`** — Test key event filtering logic
4. **`App.tsx` callbacks** — Test note CRUD operations, state transitions
5. **`services/gemini.ts`** — Mock `@google/genai`, test function calling loop, error handling

### ◆ Testable Patterns in the Codebase

```typescript
// ✅ Pure function — trivially testable
export const createNewNote = (): Note => ({...});
export const getTagColor = (tag: string): string => {...};
export const getDailyPrompt = (): string => {...};

// ✅ Service with clear I/O — mockable
export const saveNotes = async (notes: Note[]) => {...};
export const loadNotes = async (): Promise<Note[]> => {...};

// ⚠️ Component with heavy internal state — needs careful integration testing
// Editor.tsx has 30+ state variables, multiple effects, and complex event handlers
```

---

## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
## ██ SECTION 13 — DEPENDENCY REFERENCE ██
## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

### ◆ Runtime Dependencies

| Package | Version | Purpose |
|---|---|---|
| `react` | ^19.2.3 | UI framework |
| `react-dom` | ^19.2.3 | DOM rendering |
| `react-markdown` | 9 | Markdown → React rendering |
| `remark-gfm` | ^4.0.1 | GitHub Flavored Markdown plugin (tables, strikethrough, task lists) |
| `react-syntax-highlighter` | ^16.1.0 | Code syntax highlighting in preview |
| `@google/genai` | ^1.34.0 | Google Gemini AI SDK (text, image, audio, video, live) |
| `uuid` | ^13.0.0 | UUID generation (imported but custom uuid() is used instead) |
| `@types/react-syntax-highlighter` | ^15.5.13 | TypeScript types for syntax highlighter |
| `puppeteer-core` | ^24.37.3 | Present in deps but not used in application code |

### ◆ Dev Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@types/node` | ^22.14.0 | Node.js type definitions (for `path` in vite config) |
| `@vitejs/plugin-react` | ^5.0.0 | Vite React plugin (JSX transform, Fast Refresh) |
| `typescript` | ~5.8.2 | TypeScript compiler |
| `vite` | ^6.2.0 | Build tool and dev server |

### ◆ CDN Dependencies (loaded in index.html)

| Resource | URL | Purpose |
|---|---|---|
| TailwindCSS | `cdn.tailwindcss.com` | Utility-first CSS framework |
| Google Fonts | `fonts.googleapis.com` | IBM Plex Sans, JetBrains Mono |
| Google Identity Services | `accounts.google.com/gsi/client` | OAuth 2.0 for Google Drive |
| Google API Client | `apis.google.com/js/api.js` | Google Drive REST API client |

---

*End of DEVELOPER_GUIDE.md — You are now part of the void.*
