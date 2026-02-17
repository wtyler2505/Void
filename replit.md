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
├── App.tsx         - Main application component
├── types.ts        - TypeScript type definitions
├── constants.tsx   - App constants/icons
├── utils.tsx       - Utility functions
├── vite.config.ts  - Vite configuration (port 5000)
├── components/     - React components
│   ├── ChatOverlay.tsx
│   ├── Editor.tsx
│   ├── ExportModal.tsx
│   ├── KeyboardShortcutsModal.tsx
│   ├── LiveSession.tsx
│   ├── Sidebar.tsx
│   └── SyncModal.tsx
├── services/       - Service layer
│   ├── drive.ts    - Google Drive integration
│   ├── gemini.ts   - Gemini AI service
│   ├── shortcuts.ts - Keyboard shortcuts
│   └── store.ts    - Data persistence (IndexedDB)
└── docs/           - Documentation
```

## Development
- **Dev server**: `npm run dev` (port 5000)
- **Build**: `npm run build` (output to `dist/`)
- **Deployment**: Static site deployment

## Environment Variables
- `GEMINI_API_KEY` - Google Gemini API key (optional, for AI features)
