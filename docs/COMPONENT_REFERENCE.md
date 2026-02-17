# ◆ VOID — COMPONENT REFERENCE

> *"Every component is a neuron. Together, they dream."*

---

## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
## ██ COMPONENT 01 — Editor.tsx ██
## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

**Lines:** 1430 | **The heart of VOID** | **Dependencies:** gemini.ts, store.ts, ThemeContext, constants, types

### ◆ Props Interface

```typescript
interface EditorProps {
  note: Note;                          // Current note being edited
  allNotes: Note[];                    // All notes (for wiki-link autocomplete)
  onUpdate: (updates: Partial<Note>) => void;  // Partial update callback
  onSelectNote: (id: string) => void;  // Navigate to another note (via wiki-links)
  onExport: () => void;                // Open export modal
  onOpenChat: () => void;              // Open AI chat overlay
  onSplitNote?: (id: string) => void;  // Open note in split pane
  splitNoteId?: string | null;         // Currently split note (to show close button)
  folders?: { id: string; name: string }[];  // Available folders for assignment
}
```

### ◆ Internal State (30+ variables)

| Category | State | Type | Purpose |
|---|---|---|---|
| **AI Status** | `isThinking` | boolean | AI summarize/enhance in progress |
| | `isProcessing` | boolean | General processing state |
| | `statusMessage` | string | Status bar message |
| **Save** | `saveStatus` | `'saved' \| 'saving'` | Visual save indicator |
| **Audio** | `isRecording` | boolean | Voice recording active |
| | `audioBlob` | `Blob \| null` | Recorded audio data |
| **Preview** | `showPreview` | boolean | Markdown preview mode |
| | `showCheatSheet` | boolean | Markdown cheat sheet visible |
| **Variants** | `showVariants` | boolean | AI variant panel visible |
| | `variants` | string[] | Generated content variants |
| | `variantPrompt` | string | Custom variant prompt |
| **Zen Mode** | `isZenMode` | boolean | Distraction-free editing |
| **Haunt** | `showHauntPanel` | boolean | Related notes panel visible |
| | `isHaunting` | boolean | Haunt scan in progress |
| | `hauntResults` | RelatedNoteResult[] | Found related notes |
| **Goals** | `wordGoal` | `number \| null` | Word count target |
| | `streak` | number | Consecutive writing days |
| | `longestStreak` | number | Record streak |
| **Pomodoro** | `pomodoroActive` | boolean | Timer widget visible |
| | `pomodoroTime` | number | Seconds remaining |
| | `pomodoroRunning` | boolean | Timer ticking |
| | `pomodoroMode` | `'work' \| 'break'` | Current cycle phase |
| | `pomodoroAlert` | boolean | Timer complete flash |
| **Wiki Links** | `showLinkSuggest` | boolean | `[[` autocomplete dropdown |
| | `linkQuery` | string | Current link search query |
| | `linkSuggestions` | Note[] | Matching notes (max 5) |
| | `selectedLinkIndex` | number | Keyboard-selected suggestion |
| **Slash Menu** | `showSlashMenu` | boolean | `/` command menu visible |
| | `slashQuery` | string | Current command filter |
| | `selectedSlashIndex` | number | Keyboard-selected command |
| **Versions** | `showVersions` | boolean | Version history panel visible |
| | `versions` | NoteVersion[] | Loaded version list |
| | `selectedVersion` | `NoteVersion \| null` | Currently previewing version |
| **Reminders** | `showReminderPicker` | boolean | Date/time picker visible |
| | `reminderDate` | string | Selected date |
| | `reminderTime` | string | Selected time |
| **Display** | `currentTime` | number | For "Last saved X ago" display |

### ◆ Toolbar Buttons

The editor toolbar provides these actions (rendered as icon buttons):

| Button | Icon | Action | AI? |
|---|---|---|---|
| Summarize | `Brain` | Calls `Gemini.summarizeNote()`, replaces content | ✅ |
| Deep Think | `Brain` (variant) | Calls `Gemini.summarizeNote(content, true)` with thinking | ✅ |
| Enhance | `Wand` | Calls `Gemini.fastEnhance()`, replaces content | ✅ |
| TTS (Read Aloud) | `Speaker` | Calls `Gemini.textToSpeech()`, plays audio | ✅ |
| Voice Record | `Mic` | Records audio → `Gemini.transcribeAudio()` → appends text | ✅ |
| Generate Image | `Image` | `Gemini.generateImagePrompt()` → `Gemini.generateImage()` → attachment | ✅ |
| Generate Video | `Video` | Generates video from content-derived prompt → attachment | ✅ |
| Image Edit | — | `Gemini.editImage()` on existing image attachment | ✅ |
| Video Analyze | — | `Gemini.analyzeVideo()` on existing video attachment | ✅ |
| Preview | `Eye` | Toggle markdown preview / edit mode | ❌ |
| Zen Mode | `Focus` | Toggle distraction-free fullscreen editor | ❌ |
| Split Pane | `Columns` | Open another note side-by-side (desktop) | ❌ |
| Pomodoro | Clock | Toggle 25/5 pomodoro timer | ❌ |
| Haunt | `Ghost` | Find semantically related notes via AI | ✅ |
| Export | `Download` | Open export modal | ❌ |
| Chat | `Chat` | Open AI chat overlay | ❌ |
| Pin | `Pin` | Toggle note pinned state | ❌ |
| Set Reminder | Clock | Open date/time picker for reminder | ❌ |
| Version History | Clock | Load and display past versions | ❌ |
| Word Goal | Target | Set word count target for the note | ❌ |
| Variants | `Sparkle` | Generate AI content variations | ✅ |

### ◆ Slash Commands

Type `/` at the start of a line to open the command menu:

| ID | Label | Icon | Inserts |
|---|---|---|---|
| `h1` | Heading 1 | H1 | `# ` |
| `h2` | Heading 2 | H2 | `## ` |
| `h3` | Heading 3 | H3 | `### ` |
| `bullet` | Bullet List | • | `- ` |
| `numbered` | Numbered List | 1. | `1. ` |
| `checklist` | Checklist | ☑ | `- [ ] ` |
| `code` | Code Block | <> | `` ```\n\n``` `` |
| `quote` | Blockquote | ❝ | `> ` |
| `divider` | Divider | — | `---\n` |
| `table` | Table | ⊞ | 3×2 markdown table template |
| `image` | Image | 🖼 | `![Alt text](url)` |
| `link` | Link | 🔗 | `[Link text](url)` |

Slash commands are filtered by typing after `/`. Navigation: Arrow keys + Enter to select. Escape to dismiss.

### ◆ Wiki-Link System

Type `[[` in the editor to trigger autocomplete:
- Searches all non-archived, non-trashed notes by title (case-insensitive)
- Shows up to 5 suggestions in a dropdown
- Arrow keys to navigate, Enter to insert `[[Note Title]]`
- The closing `]]` is auto-inserted
- Clicking a `[[link]]` in preview navigates to that note via `onSelectNote`

### ◆ Markdown Preview

Toggle with the Eye icon or keyboard shortcut. Renders content using:
- `ReactMarkdown` with `remarkGfm` plugin
- `SyntaxHighlighter` (Prism, vscDarkPlus theme) for code blocks
- Interactive checkboxes that toggle `[ ]` ↔ `[x]` in raw content
- External links open in new tab
- Styled via `.markdown-preview` CSS class in index.html

### ◆ Key Features Detail

**Auto-Title**: If title is "Void Entry" and content > 30 chars, generates cyberpunk title via AI (2s debounce).

**Auto-Resize Textarea**: Uses `useLayoutEffect` — sets `height: auto` then `height: scrollHeight` on every content change.

**Pomodoro Timer**: 25 min work → alert → 5 min break → repeat. Visual countdown in toolbar. Alert flash on completion.

**Zen Mode**: Full-screen overlay with centered textarea. Dark background. No toolbar. Escape to exit.

**Version History**: Loads from IndexedDB on demand. Displays timeline of snapshots. Click to preview. "Restore" button replaces current content.

**Haunt (Related Notes)**: Sends current note + all other notes to `Gemini.findRelatedNotes()`. Displays relevance scores and reasons. Click to navigate.

**Reminder System**: Date/time picker sets `note.reminder` timestamp. App.tsx polls every 30s and fires browser notification.

**Writing Streak**: Tracks consecutive days in localStorage. Displays "🔥 5-day streak" in status bar.

**Word Goal**: Per-note target stored in `localStorage('void_goal_{noteId}')`. Progress bar in status bar.

**Attachments**: Displays image/video/audio attachments below content. Images show with edit/delete options. Videos show with analyze/delete options.

---

## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
## ██ COMPONENT 02 — Sidebar.tsx ██
## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

**Lines:** 824 | **Navigation & Organization** | **Dependencies:** ThemeContext, constants, utils, types, VoidLogo

### ◆ Props Interface

```typescript
interface SidebarProps {
  notes: Note[];
  activeNoteId: string | null;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  onCreateNoteFromTemplate: (title: string, content: string) => void;
  onDeleteNote: (id: string) => void;
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
  onArchiveNote: (id: string) => void;
  onRestoreNote: (id: string) => void;
  onTrashNote: (id: string) => void;
  onRestoreFromTrash: (id: string) => void;
  onEmptyTrash: () => void;
  onOpenChat: () => void;
  onToggleLive: () => void;
  onToggleKanban: () => void;
  onToggleCalendar: () => void;
  onOpenSync: () => void;
  onFuseNotes?: (sourceId: string, targetId: string) => void;
  onShowShortcuts?: () => void;
  currentView: AppView;
  isOpen?: boolean;
  onClose?: () => void;
  folders?: Folder[];
  activeFolderId?: string | null;
  onSelectFolder?: (id: string | null) => void;
  onCreateFolder?: (name: string, parentId?: string) => void;
  onDeleteFolder?: (id: string) => void;
}
```

### ◆ Internal State

| State | Type | Purpose |
|---|---|---|
| `search` | string | Search query text |
| `tagFilter` | `string \| null` | Active tag filter |
| `dragOverId` | `string \| null` | Note being dragged over (for fusion) |
| `isFusionMode` | boolean | Fusion mode active |
| `fusionSourceId` | `string \| null` | First note selected for fusion |
| `tagInput` | string | Input for adding tags to notes |
| `isArchiveOpen` | boolean | Archive section expanded |
| `isTrashOpen` | boolean | Trash section expanded |
| `isTemplateOpen` | boolean | Template dropdown open |
| `sortBy` | `'updated' \| 'created' \| 'alphabetical' \| 'size'` | Current sort mode |
| `isSortOpen` | boolean | Sort dropdown open |
| `showThemeEditor` | boolean | Theme customization panel visible |
| `isMultiSelectMode` | boolean | Bulk selection active |
| `selectedNoteIds` | `Set<string>` | Selected notes for bulk actions |
| `viewDensity` | `'compact' \| 'comfortable'` | Note list density |
| `focusedIndex` | number | Keyboard-focused note index |

### ◆ Sections (top to bottom)

1. **Header**: VoidLogo with text + Close button (mobile)
2. **Search Input**: Full-text search across titles, content, and tags
3. **Action Grid**: 6 buttons in a 3×2 grid:
   - AI Chat (opens ChatOverlay)
   - Live Session (toggles LiveSession view)
   - Kanban (toggles KanbanBoard view)
   - Calendar (toggles CalendarView)
   - Sync (opens SyncModal)
   - Shortcuts (opens KeyboardShortcutsModal)
4. **Daily Journal Prompt**: Rotating prompt from `getDailyPrompt()`. Click to create a journal note with that prompt.
5. **New Note + Templates**: "+" button and template dropdown (6 templates)
6. **Sort Controls**: Dropdown with 4 sort modes + multi-select toggle + density toggle
7. **Folder Tree**: Create folders, filter by folder, delete folders
8. **Tag Filter Bar**: Horizontal scrollable list of all unique tags. Click to filter notes by tag.
9. **Note List**: Sorted, filtered notes. Each item shows:
   - Pin indicator
   - Title (truncated)
   - Content preview (truncated)
   - Tags (colored pills, max 3)
   - Timestamp
   - Context menu (right-click or button): Pin, Archive, Trash, Delete, Move to Folder
10. **Archive Section**: Collapsible. Shows archived notes with Restore and Delete buttons.
11. **Trash Section**: Collapsible. Shows trashed notes with Restore and Delete buttons. "Empty Trash" button.
12. **Theme Editor**: Collapsible. Dark/light toggle. Accent color picker (10 preset colors + custom hex input).
13. **Footer**: Note count, storage size (computed via `Blob.size`), view density toggle.

### ◆ Sorting Modes

| Mode | Sort Logic |
|---|---|
| `updated` | `b.updatedAt - a.updatedAt` (newest first) |
| `created` | `b.createdAt - a.createdAt` (newest first) |
| `alphabetical` | `a.title.localeCompare(b.title)` |
| `size` | `b.content.length - a.content.length` (largest first) |

Pinned notes always sort to the top regardless of sort mode.

### ◆ Neural Fusion Mode

When fusion mode is activated:
1. User clicks "Fusion" button → `isFusionMode = true`
2. Click first note → `fusionSourceId = note.id`
3. Click second note → `onFuseNotes(sourceId, targetId)` called
4. App.tsx handles the fusion via `Gemini.fuseConcepts()`

Alternatively, notes support drag-and-drop: dragging one note onto another triggers fusion.

### ◆ Multi-Select Bulk Actions

When `isMultiSelectMode = true`:
- Checkboxes appear on each note
- Selected notes tracked in `selectedNoteIds` Set
- Bulk actions available: Archive All, Trash All, Tag All

### ◆ Computed Values (useMemo)

```typescript
const storageSize = useMemo(() => {
    const bytes = new Blob([JSON.stringify(notes)]).size;
    // Returns formatted string: "X B" / "X.X KB" / "X.X MB"
}, [notes]);

const allTags = useMemo(() => {
    // Collects unique tags from all non-archived, non-trashed notes
}, [notes]);
```

---

## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
## ██ COMPONENT 03 — ChatOverlay.tsx ██
## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

**Lines:** 357 | **AI Command Center** | **Dependencies:** gemini.ts, constants, types, utils

### ◆ Props Interface

```typescript
interface ChatOverlayProps {
  onClose: () => void;
  contextNote: Note | null;
  notes: Note[];
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
  onSwitchNote: (id: string) => void;
  onCreateNote: (title: string, content: string, tags?: string[]) => void;
  onBatchTagUpdate?: (action: 'rename' | 'delete', oldTag: string, newTag?: string) => void;
  onArchiveNote: (id: string) => void;
  onDeleteNote: (id: string) => void;
  onFuseNotes: (sourceId: string, targetId: string) => void;
  onChangeView: (view: AppView) => void;
}
```

### ◆ Internal State

| State | Type | Purpose |
|---|---|---|
| `messages` | ChatMessage[] | Chat history (starts with system greeting) |
| `input` | string | Current input text |
| `loading` | boolean | AI is processing |
| `actionLog` | `string \| null` | "Executing: tool_name..." display |
| `groundingEnabled` | `'none' \| 'search' \| 'maps'` | Active grounding mode |
| `location` | `{lat, lng} \| undefined` | GPS for maps grounding |

### ◆ Message Flow

```
1. User types message → clicks Send
2. Add user message to messages[]
3. Build context string:
   ├── Active note (ID, title, content, tags)
   ├── Vault Intelligence (top 5 relevant notes via calculateRelevance)
   └── All tags, total note count
4. Convert messages[] to Gemini history format
5. Call Gemini.chatWithContext(history, message, context, grounding, location, toolExecutor)
6. Function calling loop executes (0-5 turns)
   └── Each tool execution shows in actionLog
7. Add model response to messages[]
8. Display grounding chunks if present (web/maps links)
```

### ◆ Grounding Modes

| Mode | Toggle | Effect |
|---|---|---|
| None | Default | Standard chat with note tools only |
| Web Search | 🌐 button | Adds `{ googleSearch: {} }` — AI can search the web |
| Maps | 📍 button | Adds `{ googleMaps: {} }` — AI can search places. Requests geolocation. |

When grounding is active, responses may include `groundingChunks` with links:
- **Web chunks**: Rendered as clickable link cards with title and URI
- **Maps chunks**: Rendered as place cards with title and Google Maps link

### ◆ Tool Executor Pattern

The tool executor is a closure defined inside `handleSend()`. It captures the component's props and current state. See SERVICES_AND_STATE.md Section 7 for the complete execution matrix.

Key design: The executor is passed to `chatWithContext()` which calls it when the AI invokes a function. The executor returns a string result that's sent back to the AI as the function response.

### ◆ Vault Intelligence (Client-Side)

Before sending, ChatOverlay identifies the 5 most relevant notes to include as context:

```typescript
const calculateRelevance = (query: string, note: Note): number => {
    const terms = query.split(/\s+/).filter(t => t.length > 2);
    let score = 0;
    terms.forEach(term => {
        if (title.includes(term)) score += 5;   // Title match: highest
        if (tags.includes(term)) score += 3;     // Tag match: medium
        if (content.includes(term)) score += 1;  // Content match: lowest
    });
    return score;
};
```

### ◆ Initial Message

The chat starts with a pre-set system message:
```
"VOID OS Online. Full system control authorized. Direct me."
```

---

## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
## ██ COMPONENT 04 — ExportModal.tsx ██
## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

**Lines:** 326 | **Data Export** | **Dependencies:** constants, types, utils

### ◆ Props Interface

```typescript
interface ExportModalProps {
  note: Note;
  onClose: () => void;
}
```

### ◆ Export Formats

| Format | Method | Output |
|---|---|---|
| **Clipboard** | `navigator.clipboard.writeText()` | `${title}\n\n${content}` |
| **Markdown (.md)** | File download | Title as H1, content, metadata footer (created date, tags, attachment count) |
| **Plain Text (.txt)** | File download | `${title}\n\n${content}` |
| **JSON (.json)** | File download | Full Note object, pretty-printed (`JSON.stringify(note, null, 2)`) |
| **HTML (.html)** | File download | Styled HTML document with inline CSS (cyberpunk dark theme, IBM Plex Sans) |
| **Print** | `window.print()` | Browser print dialog with styled content |

### ◆ Internal Functions

- `downloadFile(filename, content, mimeType)` — Creates Blob → Object URL → hidden `<a>` click → cleanup
- `escapeHtml(str)` — Escapes `& < > "` for safe HTML embedding
- `markdownToHtml(md)` — Lightweight markdown-to-HTML converter (handles headings, bold, italic, code, lists, links, blockquotes, horizontal rules). Not as comprehensive as ReactMarkdown but sufficient for export.

### ◆ HTML Export Styling

The HTML export includes a full inline `<style>` block with:
- Dark background (#0a0a0a)
- IBM Plex Sans and JetBrains Mono fonts (Google Fonts links)
- Cyberpunk-styled headings, code blocks, links
- Neon green accent color
- Responsive max-width container

---

## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
## ██ COMPONENT 05 — SyncModal.tsx ██
## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

**Lines:** 218 | **Data Synchronization** | **Dependencies:** drive.ts, constants, types

### ◆ Props Interface

```typescript
interface SyncModalProps {
  notes: Note[];
  onClose: () => void;
  onImport: (notes: Note[]) => void;
}
```

### ◆ Internal State

| State | Type | Purpose |
|---|---|---|
| `clientId` | string | Google Cloud OAuth Client ID (persisted in localStorage) |
| `status` | string | Status message text |
| `isDriveReady` | boolean | OAuth authenticated |
| `backupFile` | `{id, modifiedTime} \| null` | Existing backup metadata |
| `activeTab` | `'drive' \| 'manual'` | Active tab |

### ◆ Two Tabs

**Google Drive Tab:**
1. Client ID input (saved to `localStorage('void_google_client_id')`)
2. "Connect & Sync" button → `initDriveApi()` → `authenticate()` → `checkForBackup()`
3. Push button: Upload local notes to Drive
4. Pull button: Download Drive backup and overwrite local (with confirmation)

**Manual File Tab:**
1. Export JSON: Downloads `void_backup_YYYY-MM-DD.json`
2. Import JSON: File picker, parses, confirms, calls `onImport(parsed)`

---

## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
## ██ COMPONENT 06 — CommandPalette.tsx ██
## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

**Lines:** 209 | **Quick Actions** | **Dependencies:** constants, types

### ◆ Props Interface

```typescript
interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  onOpenChat: () => void;
  onExport: () => void;
  onArchiveNote: () => void;
  onShowShortcuts: () => void;
  onOpenSync: () => void;
}
```

### ◆ Internal State

| State | Type | Purpose |
|---|---|---|
| `query` | string | Search/filter text |
| `activeIndex` | number | Keyboard-selected item index |

### ◆ Built-in Actions

| Action | Icon | Shortcut |
|---|---|---|
| New Note | Plus | ⌘N |
| Open AI Chat | Chat | — |
| Export Note | Download | ⌘⇧E |
| Archive Note | Archive | — |
| Show Shortcuts | Keyboard | ⌘/ |
| Sync | Cloud | — |

### ◆ Note Search

When `query` is non-empty, filters notes by title match (case-insensitive). Shows both matching actions and matching notes in a combined list. Notes show title + content preview.

### ◆ Keyboard Navigation

- `ArrowDown` / `ArrowUp`: Move selection
- `Enter`: Execute selected action or navigate to selected note
- `Escape`: Close palette
- Auto-focus on input when opened
- Auto-scroll selected item into view

---

## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
## ██ COMPONENT 07 — LiveSession.tsx ██
## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

**Lines:** 188 | **Real-Time Voice AI** | **Dependencies:** @google/genai (direct), constants

### ◆ Props Interface

```typescript
interface LiveSessionProps {
  onClose: () => void;
  context?: string;    // Active note content for AI context
}
```

### ◆ Internal State

| State | Type | Purpose |
|---|---|---|
| `status` | `'connecting' \| 'connected' \| 'error' \| 'closed'` | Connection state |
| `transcripts` | `{role, text}[]` | Conversation log |

### ◆ Audio Architecture

```
                    ┌──────────────────┐
                    │   User's Mic     │
                    └────────┬─────────┘
                             │
                    getUserMedia({ audio: true })
                             │
                    ┌────────▼─────────┐
                    │  AudioContext     │
                    │  (16kHz input)    │
                    └────────┬─────────┘
                             │
                    ScriptProcessor(4096, 1, 1)
                             │
                    float32 → PCM16 → base64
                             │
                    ┌────────▼─────────┐
                    │  Gemini Live API │
                    │  (WebSocket)     │
                    │                  │
                    │  Model: gemini-  │
                    │  2.5-flash-      │
                    │  native-audio    │
                    └────────┬─────────┘
                             │
                    Server audio chunks (base64 PCM)
                             │
                    base64 → Int16 → Float32
                             │
                    ┌────────▼─────────┐
                    │  AudioContext     │
                    │  (24kHz output)   │
                    └────────┬─────────┘
                             │
                    AudioBufferSource → destination
                             │
                    ┌────────▼─────────┐
                    │   User's Speaker │
                    └──────────────────┘
```

### ◆ System Instruction

```
You are VOID, the digital abyss that stares back.
The user is screaming into you.
Be calm, infinite, and slightly cryptic but helpful.

CONTEXT OF CURRENT SESSION:
${context || "The user is drifting in the void with no specific active note."}
```

### ◆ Cleanup

The `useEffect` cleanup function:
1. Sets `mounted = false` to prevent state updates after unmount
2. Closes the Gemini Live session
3. Closes audio contexts (input + output)
4. Stops all AudioBufferSource nodes

---

## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
## ██ COMPONENT 08 — VoidLogo.tsx ██
## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

**Lines:** 100 | **Brand Emblem** | **Dependencies:** ThemeContext

### ◆ Props Interface

```typescript
interface VoidLogoProps {
  size?: number;          // SVG width/height in px (default: 28)
  showText?: boolean;     // Show "VOID" text label (default: false)
  textSize?: string;      // Tailwind text size class (default: 'text-2xl')
  animated?: boolean;     // Enable pulse animation (default: false)
  className?: string;     // Additional CSS classes
}
```

### ◆ SVG Structure

```
viewBox="0 0 100 100"

1. Outer diamond: path "M50 8 L92 50 L50 92 L8 50 Z"
   └── stroke: accentColor, strokeWidth: 3

2. Inner diamond: path "M50 22 L78 50 L50 78 L22 50 Z"
   └── stroke: accentColor, strokeWidth: 1.5, opacity: 0.5

3. Center ring: circle cx=50 cy=50 r=12
   └── fill: #050505, stroke: accentColor

4. Core dot: circle cx=50 cy=50 r=4
   └── fill: accentColor, opacity: 0.3

5. Connector lines: 4 lines from outer to inner diamond vertices
   └── stroke: accentColor, opacity: 0.3

6. Glow filter: feGaussianBlur(3) + feFlood(accentColor, 0.6)
   └── Applied to entire group
```

### ◆ Usage Examples

```tsx
<VoidLogo size={80} animated />           // Loading screen
<VoidLogo size={22} showText textSize="text-lg" />  // Mobile header
<VoidLogo size={56} animated />           // Onboarding welcome
```

---

## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
## ██ COMPONENT 09 — Onboarding.tsx ██
## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

**Lines:** 96 | **New User Tour** | **Dependencies:** VoidLogo

### ◆ Props Interface

```typescript
interface OnboardingProps {
  onComplete: () => void;  // Called when tour finishes or is skipped
}
```

### ◆ 8 Steps

| # | Title | Icon | Content |
|---|---|---|---|
| 0 | Welcome to VOID | ⚡ (VoidLogo) | Introduction and quick tour prompt |
| 1 | Create Notes | 📝 | + button, templates explanation |
| 2 | Slash Commands | ⌨️ | Type / for quick formatting |
| 3 | Link Your Notes | 🔗 | [[ for wiki-style linking |
| 4 | AI Assistant | 🤖 | Toolbar AI features overview |
| 5 | Quick Capture | 💡 | Bottom-right lightning bolt button |
| 6 | Command Palette | 🎯 | Cmd+K for quick navigation |
| 7 | You're Ready! | 🚀 | MD? in status bar, explore toolbar |

### ◆ Navigation

- "Next" button advances step
- "Skip tour" button calls `onComplete()` immediately
- Step 7 "Get Started" button calls `onComplete()`
- Dot indicators show progress (active dot extends width with accent color)

### ◆ Persistence

`onComplete` in App.tsx sets `localStorage('void_onboarding_done', 'true')`. The tour never shows again.

---

## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
## ██ COMPONENT 10 — CalendarView.tsx ██
## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

**Lines:** 93 | **Monthly Note Calendar** | **Dependencies:** ThemeContext, types

### ◆ Props Interface

```typescript
interface CalendarViewProps {
  notes: Note[];
  onSelectNote: (id: string) => void;
}
```

### ◆ Internal State

| State | Type | Purpose |
|---|---|---|
| `currentMonth` | Date | Currently displayed month |

### ◆ Features

- **Monthly grid**: 7-column grid (Sun-Sat) with proper first-day-of-month offset
- **Note mapping**: Notes plotted by `createdAt` date (year + month + day match)
- **Today highlight**: Current date cell has accent background tint
- **Note display**: Up to 3 notes per cell (truncated titles), "+N more" overflow indicator
- **Navigation**: Previous/next month buttons. Month name + year display.
- **Filtering**: Only shows active notes (not archived, not trashed)
- **Click action**: `onSelectNote(id)` — in App.tsx, this also switches view back to 'editor'

### ◆ Calendar Cell Sizing

- Min height: 80px per cell
- Text sizes: Day number = 10px, note titles = 8px, overflow count = 7px
- Compact design optimized for information density

---

## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
## ██ COMPONENT 11 — KanbanBoard.tsx ██
## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

**Lines:** 91 | **Task Board** | **Dependencies:** ThemeContext, types

### ◆ Props Interface

```typescript
interface KanbanBoardProps {
  notes: Note[];
  onSelectNote: (id: string) => void;
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
}
```

### ◆ Columns

| Column | Status Value | Color | Label |
|---|---|---|---|
| Left | `'todo'` | `#ff6b6b` (red) | TO DO |
| Center | `'in_progress'` | `#ffd93d` (yellow) | IN PROGRESS |
| Right | `'done'` | `#00ff9d` (green) | DONE |

### ◆ Card Features

- Title (truncated, bold)
- Content preview (2-line clamp, 100 chars)
- Tags (max 2 displayed, 8px pills)
- Inline status `<select>` dropdown to move between columns
- Click card → `onSelectNote(id)` (navigates to editor)
- Hover effect: `translate-x-1` slide animation

### ◆ Notes

- Default status: `'todo'` (for notes without `status` field)
- Filters: Excludes archived and trashed notes
- Min width: 768px (horizontally scrollable on mobile)
- Empty column: Shows "No notes" centered message

---

## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
## ██ COMPONENT 12 — KeyboardShortcutsModal.tsx ██
## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

**Lines:** 52 | **Keyboard Reference** | **Dependencies:** constants

### ◆ Props Interface

```typescript
interface KeyboardShortcutsModalProps {
  onClose: () => void;
}
```

### ◆ Displayed Shortcuts

| Keys | Description |
|---|---|
| Ctrl + N | New Note |
| Ctrl + S | Force Save |
| Ctrl + K | Command Palette |
| Ctrl + F | Search |
| Ctrl + Shift + E | Export Note |
| Ctrl + Del | Archive Note |
| Ctrl + Shift + Del | Delete Forever |
| Ctrl + 1-9 | Switch Note |
| Ctrl + / | Show Help |
| Esc | Close Modals |

### ◆ Layout

- Title: "SYSTEM CONTROLS" with Keyboard icon
- Responsive grid: 1 column on mobile, 2 columns on desktop
- Each shortcut in a card with description (left) and `<kbd>` key pills (right)
- Footer: "PRESS ESC TO CLOSE"
- Full-screen backdrop with blur
- Click backdrop or press Escape to close

---

## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
## ██ APPENDIX — COMPONENT QUICK REFERENCE ██
## ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

| Component | Export | Parent | z-index | State Count | Props Count |
|---|---|---|---|---|---|
| Editor | Named | App.tsx | — | 30+ | 9 |
| Sidebar | Named | App.tsx | 40 | 16 | 28 |
| ChatOverlay | Named | App.tsx | 50 | 6 | 11 |
| ExportModal | Named | App.tsx | 50 | 0 | 2 |
| SyncModal | Named | App.tsx | 50 | 5 | 3 |
| CommandPalette | Named | App.tsx | 50 | 2 | 10 |
| LiveSession | Named | App.tsx | — | 2 | 2 |
| VoidLogo | Named+Default | Multiple | — | 0 | 5 |
| Onboarding | Named | App.tsx | 100 | 1 | 1 |
| CalendarView | Default | App.tsx | — | 1 | 2 |
| KanbanBoard | Default | App.tsx | — | 0 | 3 |
| KeyboardShortcutsModal | Named | App.tsx | 100 | 0 | 1 |

---

*End of COMPONENT_REFERENCE.md — Every neuron documented.*
