# 🎮 𝗨𝗦𝗘𝗥 𝗚𝗨𝗜𝗗𝗘

> *Operator's Manual for the VOID Interface — 42 systems online.*

## 1. 𝗧𝗛𝗘 𝗜𝗡𝗧𝗘𝗥𝗙𝗔𝗖𝗘

The interface is divided into four primary sectors:

### A. The Sidebar (Left)

Your command center. Drag the right edge to resize (240–600px).

*   **Search Bar**: Real-time filtering by title, content, or tag. Focus with `Ctrl + F`.
*   **Breadcrumb Navigation**: Path display showing `VOID > Notes/Archive/Trash > tag > title`. Click any segment to navigate.
*   **Folders**: Nested folder structure for hierarchical organization. Create, rename, and nest folders. Persisted in localStorage.
*   **Tag Lattice**: Horizontal scroll of all unique tags. Each tag is color-coded via hash-based color assignment. Click to filter.
*   **Action Grid** (8 buttons):
    *   `+` : New Note.
    *   `📋` : Note Templates (Meeting, Journal, Project, To-Do, Brain Dump, Bug Report).
    *   `⚛` : Toggle **Neural Fusion Mode**.
    *   `⚡` : Toggle **Live Session**.
    *   `☁` : Open **Sync Modal** (Google Drive).
    *   `📌` : View **Pinned/Favorited Notes**.
    *   `🕐` : **Recent Notes** quick access panel.
    *   `🗑` : **Trash/Recycle Bin** (restore or permanently empty).
*   **Note List**: Your data stream. Supports drag-and-drop for Fusion, arrow-key navigation, and multi-select for bulk actions (batch archive/trash).
*   **Sort Options**: Sort notes by last updated, created date, alphabetical, or size.
*   **View Density**: Toggle between compact and comfortable layouts.
*   **Storage Indicator**: Visual meter showing localStorage usage.
*   **Quick Capture**: Floating `+` button for instant note creation from anywhere.

### B. The Editor (Center/Right)

*   **Toolbar**:
    *   `REC` : Audio transcription.
    *   `BRAIN` : Summarize note via AI.
    *   `BOLT` : Fast text enhancement (grammar/flow).
    *   `EYE` : Visualize (generate multiple image variants).
    *   `VIDEO` : Generate video from note context.
    *   `SPEAKER` : Read note aloud (TTS).
    *   `COLUMNS` : Toggle **Split-Pane View** — edit two notes side by side, or show rendered Markdown preview.
    *   `GHOST` : Toggle **Haunt** (Related Notes discovery).
    *   `ZEN` : Enter **Focus/Zen Mode** — distraction-free fullscreen writing.
    *   `TIMER` : **Pomodoro Timer** — 25-minute work / 5-minute break cycles.
    *   `TABLE` : Insert markdown tables.
    *   `MD?` : **Markdown Shortcuts Cheat Sheet** — quick reference overlay.
*   **Slash Commands**: Type `/` in the editor to insert headings, lists, code blocks, tables, and more via an inline command menu.
*   **Canvas**:
    *   **Title**: Large, auto-generating header.
    *   **Attachments**: Grid of generated images/videos.
    *   **Text Area**: Infinite scroll, markdown-supported writing zone with **code syntax highlighting** (VS Code Dark+ theme via react-syntax-highlighter).
    *   **Interactive Checklists**: Clickable checkboxes with visual progress tracking bar.
    *   **Footnotes & Annotations**: Use `[^1]` references for inline footnotes.
    *   **Wiki-Style Linking**: Type `[[` to link to other notes with autocomplete suggestions.
    *   **Embeddable Link Previews**: Paste a URL to generate a preview card with favicon and domain.
*   **Footer**: Live word count, read time, word count goal progress, writing streak tracker, and "Last Saved" timestamp.
*   **Version History**: Timeline-based undo system. Browse and restore previous versions of your note.

### C. The Chat Overlay (Floating)

*   Activated by the `AI Assistant` button in the sidebar or `Chat` icon in the toolbar.
*   **Context Aware**: The AI knows which note you are currently editing.
*   **Omnipotent**: Ask it to "Make a new note about cyberpunk", "Delete the current note", "Add a tag", or "Analyze the connection between Note A and Note B" — it will execute.

### D. The Command Palette

*   Activated with `Ctrl + K` (or `Cmd + K` on Mac).
*   Fuzzy-search across all actions, notes, and commands. Navigate your entire vault without lifting your hands from the keyboard.

---

## 2. 𝗩𝗜𝗘𝗪𝗦

VOID offers four distinct viewing modes:

### 📝 Standard Editor View
The default workspace. Full editor with toolbar, markdown preview, and all writing tools.

### 📋 Kanban Board
*   Three columns: **To Do** / **In Progress** / **Done**.
*   Each note appears as a card. Change status via a dropdown on each card.
*   Drag-and-drop between columns to update workflow state.
*   Ideal for project management and task tracking.

### 📅 Calendar View
*   Monthly grid displaying notes by their creation date.
*   Click any date cell to see notes created that day.
*   Navigate between months with arrow controls.
*   Perfect for journaling and tracking writing cadence.

### ⚡ Live Session View
*   Voice-first interface powered by AI (Voice: Zephyr).
*   Speak naturally — the AI responds in real-time.
*   Context-aware: it knows the note you were viewing before entering the session.

---

## 3. 𝗧𝗘𝗠𝗣𝗟𝗔𝗧𝗘𝗦

Six pre-built note templates to accelerate your workflow:

| Template | Purpose |
|----------|---------|
| **Meeting** | Agenda, attendees, action items structure |
| **Journal** | Daily reflection with prompts |
| **Project** | Goals, milestones, tasks breakdown |
| **To-Do** | Checklist-based task list |
| **Brain Dump** | Freeform idea capture |
| **Bug Report** | Steps to reproduce, expected/actual behavior |

Access templates via the `📋` button in the sidebar action grid.

**Daily Journal Prompt**: VOID can surface a daily writing prompt to kickstart your journal entries.

---

## 4. 𝗢𝗥𝗚𝗔𝗡𝗜𝗭𝗔𝗧𝗜𝗢𝗡

### Folders
Create nested folder hierarchies to structure your vault. Drag notes into folders, create subfolders, and rename freely. Folder structure persists in localStorage.

### Tags
Every tag is automatically assigned a unique color via hash-based color generation. Click any tag in the Tag Lattice to filter your note list.

### Pinned Notes
Pin important notes to keep them at the top of your list regardless of sort order.

### Archive
Move notes to the archive to declutter your active workspace without deleting them. Access archived notes from the breadcrumb navigation.

### Trash / Recycle Bin
Deleted notes go to the trash first. Restore them or permanently empty the trash. Access via the `🗑` button.

### Bulk Actions
Hold `Ctrl`/`Shift` to multi-select notes in the sidebar. Batch archive or trash multiple notes at once.

### Sort Options
Sort your note list by:
*   **Last Updated** — most recently edited first.
*   **Created Date** — newest or oldest first.
*   **Alphabetical** — A–Z by title.
*   **Size** — largest notes first.

---

## 5. 𝗔𝗜 𝗪𝗢𝗥𝗞𝗙𝗟𝗢𝗪𝗦

### ⚛ Neural Fusion
*   **Concept**: Combine two ideas to create a third, evolved idea.
*   **Method 1 (Drag & Drop)**:
    1.  Open the Sidebar.
    2.  Drag one note onto another.
    3.  Confirm Fusion.
*   **Method 2 (Toolbar)**:
    1.  Click the Atom `⚛` icon in the Sidebar.
    2.  Select the "Source" note.
    3.  Select the "Target" note.
*   **Result**: A new note is created containing the synthesized insight and a generated "Fusion Artifact" image.

### 👻 The Haunt (Discovery)
1.  Open a note.
2.  Click the Ghost `👻` icon in the Editor toolbar.
3.  A panel opens on the right.
4.  The AI analyzes your vault and lists "Haunted By" notes—entries that are semantically related.
5.  Clicking a ghost navigates to that note.

### 🎙️ Live Session
1.  Click the Live `⚡` icon in the Sidebar.
2.  The screen shifts to the **VOID LIVE** interface.
3.  Speak naturally. The AI (Voice: Zephyr) will respond instantly.
4.  The AI is aware of the note you were looking at before you started the session.

### 🤖 Toolbar AI Tools
*   **Summarize** (`BRAIN`): Condense your note into key points.
*   **Enhance** (`BOLT`): Improve grammar, flow, and clarity.
*   **Visualize** (`EYE`): Generate image variants from your note content.
*   **Video** (`VIDEO`): Generate a video from note context.
*   **TTS** (`SPEAKER`): Read the note aloud with text-to-speech.

---

## 6. 𝗦𝗬𝗡𝗖 & 𝗘𝗫𝗣𝗢𝗥𝗧

### ☁ Google Drive Sync
1.  Click the Cloud `☁` icon.
2.  Enter your Google Client ID (requires GCP setup).
3.  **PUSH**: Upload your entire vault to Google Drive.
4.  **PULL**: Download and restore your vault from Google Drive.

### Export Options
*   **HTML Export**: Rendered output with XSS protection.
*   **Print-Friendly View**: Clean, printable layout stripped of UI chrome.
*   **Manual Export**: JSON or Markdown file download via `Ctrl + Shift + E`.

---

## 7. 𝗧𝗛𝗘𝗠𝗘 & 𝗖𝗨𝗦𝗧𝗢𝗠𝗜𝗭𝗔𝗧𝗜𝗢𝗡

### Light / Dark Theme
Toggle between dark mode (`#050505` background) and light mode (`#f5f5f0` background) with a single click.

### Custom Theme Editor
*   Choose from **12 preset accent colors** or use the **custom color picker** to set any accent.
*   Default accent: `#00ff9d`.
*   All UI elements update in real-time.

### View Density
Switch between **compact** (tighter spacing, more notes visible) and **comfortable** (spacious, relaxed layout).

### Sidebar Width
Drag the sidebar edge to resize between 240px and 600px. Your preference is remembered.

### Design Language
*   **Fonts**: IBM Plex Sans (UI), JetBrains Mono (code blocks).
*   **Aesthetic**: Sharp angular corners throughout — cyberpunk geometry, no rounded edges.
*   **VoidLogo**: SVG diamond emblem with circular void center and animated glow.
*   **Animations**: Smooth transitions and micro-interactions across all UI elements.

---

## 8. 𝗡𝗢𝗧𝗜𝗙𝗜𝗖𝗔𝗧𝗜𝗢𝗡𝗦 & 𝗥𝗘𝗠𝗜𝗡𝗗𝗘𝗥𝗦

*   Set browser-based reminders on any note.
*   Notifications fire even when VOID is in the background (requires browser notification permissions).
*   Pair with the **Pomodoro Timer** for structured work sessions.

---

## 9. 𝗔𝗖𝗖𝗘𝗦𝗦𝗜𝗕𝗜𝗟𝗜𝗧𝗬 & 𝗠𝗢𝗕𝗜𝗟𝗘

*   **ARIA labels and roles** throughout for screen reader compatibility.
*   **Keyboard-first navigation**: Arrow keys to traverse notes, `Ctrl + K` for the command palette, full shortcut coverage.
*   **Responsive mobile layout**: Sidebar collapses, editor adapts to small screens.
*   **Onboarding Walkthrough**: 8-step guided tour for new users. Highlights key interface elements and workflows.

---

## 10. 𝗞𝗘𝗬𝗕𝗢𝗔𝗥𝗗 𝗠𝗔𝗦𝗧𝗘𝗥𝗬

| Action | Shortcut |
|--------|----------|
| New Note | `Ctrl + N` |
| Save (Force) | `Ctrl + S` |
| Focus Search | `Ctrl + F` |
| Command Palette | `Ctrl + K` |
| Export | `Ctrl + Shift + E` |
| Archive | `Ctrl + Delete` |
| Delete (Perm) | `Ctrl + Shift + Delete` |
| Switch Note | `Ctrl + 1-9` |
| Help / Shortcuts | `Ctrl + /` |
| Navigate Notes | `Arrow Keys` |

---
*End of Manual. Welcome to the VOID.*