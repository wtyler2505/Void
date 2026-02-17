# VOID

Cyberpunk-aesthetic note-taking app. Browser-only (no backend). 42 of 100 features implemented.

## Tech Stack

- React 19 + TypeScript, Vite (port 5000, host 0.0.0.0)
- Tailwind CSS via CDN (`<script>` in index.html) — NOT an npm dependency
- Google Gemini API (`@google/genai`) for all AI features
- Fonts: IBM Plex Sans (UI), JetBrains Mono (code)
- Storage: IndexedDB (primary) → localStorage (fallback) → Google Drive (cloud sync)

## Commands

```bash
npm run dev      # Dev server on port 5000
npm run build    # Production build to dist/
```

## Project Structure

```
App.tsx              # Root component — ALL state lives here, props drilled down
ThemeContext.tsx      # Theme provider (isDark, accentColor, toggleTheme)
types.ts             # Note, Folder, NoteVersion, Attachment, AppView, ChatMessage
utils.tsx            # createNewNote, NOTE_TEMPLATES (6), JOURNAL_PROMPTS (31), getTagColor
constants.tsx        # TAG_COLORS (10), ICONS (25+ SVG components)
index.html           # Entry point — custom CSS (neon-border, neon-text, markdown-preview)

components/
  Editor.tsx         # 1430 LOC — editor, toolbar, preview, slash commands, pomodoro, zen mode
  Sidebar.tsx        # 824 LOC — note list, folders, tags, search, bulk actions, storage indicator
  ChatOverlay.tsx    # 357 LOC — AI chat with function calling (16 tools) and grounding
  ExportModal.tsx    # 326 LOC — export to clipboard/md/txt/json/html/print
  SyncModal.tsx      # 218 LOC — Google Drive push/pull
  CommandPalette.tsx # 209 LOC — Cmd+K quick actions
  LiveSession.tsx    # 188 LOC — voice-interactive AI session
  VoidLogo.tsx       # 100 LOC — SVG diamond emblem with glow filter
  Onboarding.tsx     # 96 LOC — 8-step welcome tour
  CalendarView.tsx   # 93 LOC — monthly grid of notes
  KanbanBoard.tsx    # 91 LOC — To Do / In Progress / Done columns
  KeyboardShortcutsModal.tsx # 52 LOC

services/
  gemini.ts          # 657 LOC — ALL AI: summarize, enhance, TTS, image/video gen, chat with 16 function declarations
  store.ts           # 172 LOC — IndexedDB with dual-write to localStorage, version history (max 50/note)
  drive.ts           # 125 LOC — Google Drive OAuth, backup upload/download
  shortcuts.ts       # 85 LOC — useGlobalShortcuts hook

docs/                # Comprehensive documentation (read these for deep context)
```

## Architecture

- **State**: Centralized in `App.tsx`. ~20 useState hooks, ~5 useRef. All handlers are useCallback. Props are drilled to children — no Redux/Zustand/context for app state.
- **Persistence**: Notes auto-save with 800ms debounce. Version history saves every 30s (up to 50 per note). Dual-write to IndexedDB + localStorage. Legacy key migration on load.
- **Theme**: `ThemeContext` provides `isDark`, `accentColor`, `toggleTheme`, `setAccentColor`. All components consume via `useTheme()`. Persisted in localStorage.
- **Views**: `AppView` type = `'editor' | 'kanban' | 'calendar' | 'live'`. Switched in App.tsx render.
- **AI**: All AI goes through `services/gemini.ts`. Models vary by task (see file). Chat uses function calling loop with 16 tool declarations. Env var: `GEMINI_API_KEY` → mapped to `process.env.API_KEY` in vite.config.ts.

## Design Conventions — CRITICAL

- **NO rounded corners anywhere.** No `rounded-*` Tailwind classes, no `border-radius`. Everything is sharp/angular — cyberpunk aesthetic.
- **Accent color**: Default `#00ff9d`, but always read from `useTheme().accentColor` — never hardcode.
- **Dark mode**: bg `#050505`, text `#e0e0e0`. Light mode: bg `#f5f5f0`, text `#1a1a1a`.
- **Neon effects**: Use CSS classes `neon-border` and `neon-text` (defined in index.html).
- **Font**: IBM Plex Sans for all UI text. JetBrains Mono for code blocks only. Do NOT use Space Grotesk.
- **Tailwind**: Applied via CDN classes. Custom/component-specific CSS goes in index.html `<style>` block, NOT in separate CSS files.

## Adding Features

### New Component
1. Create in `components/`. Import `useTheme` from `ThemeContext.tsx`.
2. Accept needed state/handlers as props from App.tsx — no local data fetching.
3. Use Tailwind classes. Zero border-radius. Use `style={{ color: accentColor }}` for accent-colored elements.
4. Add to App.tsx render tree with appropriate props.

### New AI Tool (in ChatOverlay function calling)
1. Add function declaration to `tools` array in `services/gemini.ts` `chatWithVoid()`.
2. Add executor case in `ChatOverlay.tsx` `executeFunctionCall()`.
3. Return result string back to the model for the function calling loop.

### New View
1. Add variant to `AppView` union type in `types.ts`.
2. Add case in App.tsx main render switch.
3. Add sidebar button in `Sidebar.tsx` action grid.

### New Note Template
Add to `NOTE_TEMPLATES` array in `utils.tsx` with `{ name, icon, content }`.

## Common Pitfalls

- Tailwind is CDN-loaded — don't `npm install tailwindcss` or create `tailwind.config.js`
- Custom CSS classes (`neon-border`, `neon-text`, `markdown-preview`, `void-logo-pulse`) are in index.html, not in any CSS file
- The `Note` type has 15 fields including `status` (for Kanban), `tags` (string[]), `folderId` (string|undefined), `reminder` (number|null)
- `store.ts` uses IndexedDB database `'void_db'`, stores `'void_store'` (notes) and `'void_versions'` (history) — don't change these names
- Google Drive sync is optional — app works fully offline without it

## Documentation (Progressive Disclosure)

For deep context on specific areas, read these files:

- `docs/ARCHITECTURE.md` — system diagrams, data flow, storage tiers, event system
- `docs/DEVELOPER_GUIDE.md` — setup, conventions, design tokens, step-by-step guides
- `docs/COMPONENT_REFERENCE.md` — full props/state/features for all 12 components
- `docs/SERVICES_AND_STATE.md` — service APIs, AI model matrix, all 16 function declarations, localStorage keys
- `docs/IMPROVEMENT_CHECKLIST.md` — 100-item feature checklist with implementation status
- `docs/USER_GUIDE.md` — end-user documentation and feature walkthroughs

## LocalStorage Keys

`void_notes_data` (fallback store), `void_active_note`, `void_sidebar_width`, `void_folders`, `void_onboarding_done`, `void_theme`, `void_accent`, `void_density`, `void_google_client_id`, `void_writing_streak`, `void_goal_{noteId}`
