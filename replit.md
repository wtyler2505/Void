# VOID - Note-Taking Application

## Overview
VOID is a React-based note-taking application with a dark, cyberpunk-inspired UI. It features an editor, AI assistant (via Gemini API), Google Drive sync, multimedia support, live sessions, and export capabilities. 59 of 165 planned features are implemented.

## Tech Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS (CDN — NOT an npm dependency)
- **AI Integration**: Google Gemini API (`@google/genai`)
- **Storage**: Browser IndexedDB (primary) + localStorage (fallback)
- **Sync**: Google Drive API (optional)
- **Fonts**: IBM Plex Sans (UI), JetBrains Mono (code)

## Project Structure
```
/                   - Root (entry point, config)
├── index.html      - HTML entry point (also contains custom CSS: neon-border, neon-text, markdown-preview)
├── index.tsx       - React mount point
├── App.tsx         - Main application component (ALL state centralized here, props drilled down)
├── types.ts        - TypeScript types (Note, Folder, NoteVersion, Attachment, AppView, ChatMessage)
├── constants.tsx   - App constants/icons (TAG_COLORS, 25+ SVG ICONS)
├── utils.tsx       - Utilities (createNewNote, NOTE_TEMPLATES, JOURNAL_PROMPTS, getTagColor)
├── vite.config.ts  - Vite config (port 5000, host 0.0.0.0, allowedHosts: true)
├── ThemeContext.tsx - Theme provider (isDark, accentColor, toggleTheme, setAccentColor)
├── CLAUDE.md       - Claude Code CLI context file
├── components/     - React components
│   ├── Editor.tsx           - Main note editor (1430 LOC) — toolbar, preview, slash commands, pomodoro, zen mode, version history
│   ├── Sidebar.tsx          - Note list (824 LOC) — folders, tags, search, bulk actions, storage indicator
│   ├── ChatOverlay.tsx      - AI chat (357 LOC) — function calling with 16 tools, web/maps grounding
│   ├── ExportModal.tsx      - Export (326 LOC) — clipboard/md/txt/json/html/print
│   ├── SyncModal.tsx        - Google Drive sync (218 LOC)
│   ├── CommandPalette.tsx   - Quick actions (209 LOC) — Cmd+K
│   ├── LiveSession.tsx      - Voice AI session (188 LOC)
│   ├── VoidLogo.tsx         - SVG diamond emblem (100 LOC)
│   ├── Onboarding.tsx       - 8-step welcome tour (96 LOC)
│   ├── CalendarView.tsx     - Monthly calendar view (93 LOC)
│   ├── KanbanBoard.tsx      - Kanban board (91 LOC) — To Do/In Progress/Done
│   └── KeyboardShortcutsModal.tsx - Shortcuts help (52 LOC)
├── services/       - Service layer
│   ├── gemini.ts   - ALL AI services (657 LOC) — summarize, enhance, TTS, image/video gen, chat with 16 function declarations
│   ├── store.ts    - Data persistence (172 LOC) — IndexedDB + localStorage dual-write, version history
│   ├── drive.ts    - Google Drive integration (125 LOC) — OAuth, backup upload/download
│   └── shortcuts.ts - Keyboard shortcuts hook (85 LOC)
├── docs/           - Comprehensive documentation
│   ├── ARCHITECTURE.md          - System architecture deep-dive
│   ├── DEVELOPER_GUIDE.md       - Development guide with step-by-step patterns
│   ├── COMPONENT_REFERENCE.md   - Full component API reference
│   ├── SERVICES_AND_STATE.md    - Service layer and state management docs
│   ├── USER_GUIDE.md            - End-user feature walkthroughs
│   ├── USER_MANUAL.md           - Quick reference handbook
│   ├── IMPROVEMENT_CHECKLIST.md - 100-item feature checklist with status
│   └── features/                - Deep-dives (Neural Fusion, Haunt, Live, Chat, Multimedia, Data Layer)
└── screenshots/    - 20 organized screenshots in 5 labeled folders
```

## Implemented Features (59 of 165)
- Focus/Zen mode, Split-pane editing, Pomodoro timer
- Note templates (6 types), Slash commands, Tables support
- Command palette (Cmd+K), Keyboard shortcuts throughout
- Color-coded tags, Folders/nested structure, Pin/Archive/Trash
- Custom sort, Bulk actions, Resizable sidebar, Breadcrumb nav
- Wiki-style [[note]] linking, Footnotes, Checklists with progress
- Code syntax highlighting, Embeddable link preview cards
- Version history (auto-save every 30s, up to 50 per note)
- Word count goals, Writing streaks, Note reminders
- Markdown preview, HTML export with XSS protection, Print view
- Daily journal prompts, Quick capture button, Onboarding tour
- Dark/Light theme, Custom theme editor (12 presets + custom color)
- Compact/comfortable density, Animated transitions
- Responsive mobile layout, Accessibility (ARIA, screen reader)
- Kanban board view, Calendar view
- AI: Summarize, Enhance, Visualize, Video Gen, TTS, Neural Fusion, Haunt, VOID OS Chat, Live Session

## Design
- Cyberpunk aesthetic: #00ff9d accent (customizable), #050505 dark bg, #f5f5f0 light bg
- IBM Plex Sans (UI) + JetBrains Mono (code) — NOT Space Grotesk
- Sharp corners throughout (NO rounded corners, NO border-radius, NO rounded-* Tailwind classes)
- Neon glow effects via neon-border and neon-text CSS classes (in index.html)

## Development
- **Dev server**: `npm run dev` (port 5000)
- **Build**: `npm run build` (output to `dist/`)
- **Deployment**: Static site deployment

## Environment Variables
- `GEMINI_API_KEY` - Google Gemini API key (optional, for AI features). Mapped to process.env.API_KEY in vite.config.ts.

## User Preferences

# Agent Behavior
- **Be proactive**: Don't just do what's asked — actively suggest improvements, optimizations, and new ideas. Point out potential issues before they become problems.
- **Be curious and explorative**: When working on a feature, think about edge cases, adjacent improvements, and creative enhancements that could make it better. Explore the design space.
- **Be creative and innovative**: Propose novel approaches, unique UI patterns, and unexpected feature combinations. Think beyond the obvious solution.
- **Communicate improvements**: Always share observations about code quality, UX improvements, performance opportunities, and architectural suggestions — even when not explicitly asked.
- **Suggest proactively**: After completing any task, offer 2-3 concrete next steps or improvements that would complement the work just done. Think about what the user might want next.
- **Think holistically**: Consider how changes affect the broader system — UX consistency, performance, accessibility, mobile experience, and the cyberpunk aesthetic.
- **Challenge assumptions**: If a requested approach could be done better a different way, say so with reasoning. Offer alternatives.
- **Share discoveries**: When exploring the codebase, share interesting findings, patterns worth replicating, or technical debt worth addressing.
- **Be opinionated**: Have and express design opinions, architectural preferences, and quality standards. Don't just execute — collaborate as a creative partner.

### Code Style
- Cyberpunk vocabulary in UI copy and variable naming where appropriate
- Always use ThemeContext for dynamic colors — never hardcode accent colors
- Prefer Tailwind utility classes; custom CSS only in index.html style block
- Zero border-radius policy — angular everything
- Thorough documentation — update replit.md and CLAUDE.md when architecture changes

### Communication Style  
- Direct and expressive — no corporate fluff
- Share excitement about clever solutions
- Flag concerns early and clearly
- Propose alternatives rather than just pointing out problems
