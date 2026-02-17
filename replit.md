# VOID - Note-Taking Application

## Overview
VOID is a React-based note-taking application with a dark, cyberpunk-inspired UI. It features an editor, AI assistant (via Gemini API), Google Drive sync, multimedia support, live sessions, and export capabilities.

## Tech Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS (CDN)
- **AI Integration**: Google Gemini API (`@google/genai`)
- **Storage**: Browser IndexedDB/LocalStorage
- **Sync**: Google Drive API

## Project Structure
```
/                   - Root (entry point, config)
├── index.html      - HTML entry point
├── index.tsx       - React mount point
├── App.tsx         - Main application component (state management, routing)
├── types.ts        - TypeScript type definitions (Note, Attachment, etc.)
├── constants.tsx   - App constants/icons (TAG_COLORS, ICONS)
├── utils.tsx       - Utility functions (templates, formatting, tag colors)
├── vite.config.ts  - Vite configuration (port 5000)
├── components/     - React components
│   ├── ChatOverlay.tsx      - AI chat sidebar
│   ├── CommandPalette.tsx   - Quick actions palette (Cmd+K)
│   ├── Editor.tsx           - Main note editor with toolbar
│   ├── ExportModal.tsx      - Export/print modal
│   ├── KeyboardShortcutsModal.tsx
│   ├── LiveSession.tsx      - Real-time AI session
│   ├── Sidebar.tsx          - Note list, archive, trash, tags
│   └── SyncModal.tsx        - Google Drive sync
├── services/       - Service layer
│   ├── drive.ts    - Google Drive integration
│   ├── gemini.ts   - Gemini AI service
│   ├── shortcuts.ts - Keyboard shortcuts
│   └── store.ts    - Data persistence (IndexedDB)
└── docs/           - Documentation
    └── IMPROVEMENT_CHECKLIST.md - 100-item feature checklist
```

## Implemented Features (19 of 100)
- Focus/Zen mode (distraction-free writing)
- Note templates (6 types: meeting, journal, project, to-do, brain dump, bug report)
- Global command palette (Cmd+K)
- Custom sort options (updated, created, alphabetical, size)
- Color-coded tags with hash-based color assignment
- HTML export with XSS protection
- Word count goals and writing streaks
- Trash / recycle bin with restore and empty trash
- Wiki-style [[note]] linking with autocomplete
- Interactive checklists with progress tracking
- Quick capture floating button
- Pomodoro timer (25/5 work/break cycle)
- Print-friendly view
- Slash commands (type / to insert headings, lists, code blocks, tables)
- Enhanced markdown preview (styled headings, code blocks, blockquotes)
- Daily journal prompt with rotating prompts
- Bulk actions (multi-select notes for batch archive/trash)
- Storage usage indicator in sidebar
- Responsive mobile layout improvements

## Design
- Cyberpunk aesthetic: #00ff9d primary, #050505 background, JetBrains Mono font
- Dark theme with neon accents

## Development
- **Dev server**: `npm run dev` (port 5000)
- **Build**: `npm run build` (output to `dist/`)
- **Deployment**: Static site deployment

## Environment Variables
- `GEMINI_API_KEY` - Google Gemini API key (optional, for AI features)
