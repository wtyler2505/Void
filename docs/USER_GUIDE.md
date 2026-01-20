# 🎮 𝗨𝗦𝗘𝗥 𝗚𝗨𝗜𝗗𝗘

> *Operator's Manual for the VOID Interface.*

## 1. 𝗧𝗛𝗘 𝗜𝗡𝗧𝗘𝗥𝗙𝗔𝗖𝗘

The interface is divided into three primary sectors:

### A. The Sidebar (Left)
*   **Search Bar**: Filters notes by title, content, or tag.
*   **Tag Lattice**: Horizontal scroll of all unique tags. Click to filter.
*   **Control Grid**:
    *   `+`: New Note.
    *   `⚛`: Toggle **Neural Fusion Mode**.
    *   `⚡`: Toggle **Live Session**.
    *   `☁`: Open **Sync Modal**.
*   **Note List**: Your data stream. Drag and drop notes here to initiate Fusion.

### B. The Editor (Center/Right)
*   **Toolbar**:
    *   `REC`: Audio transcription.
    *   `BRAIN`: Summarize note.
    *   `BOLT`: Fast text enhancement (grammar/flow).
    *   `EYE`: Visualize (generate multiple image variants).
    *   `VIDEO`: Generate video from note context.
    *   `SPEAKER`: Read note aloud (TTS).
    *   `COLUMNS`: Toggle Split-View (Markdown Preview).
    *   `GHOST`: Toggle **Haunt** (Related Notes).
*   **Canvas**:
    *   **Title**: Large, auto-generating header.
    *   **Attachments**: Grid of generated images/videos.
    *   **Text Area**: Infinite scroll, markdown-supported writing zone.
*   **Footer**: Live word count, read time, and "Last Saved" timestamp.

### C. The Chat Overlay (Floating)
*   Activated by the `AI Assistant` button in the sidebar or `Chat` icon in the toolbar.
*   This is an omnipotent command line. You can ask it to "Make a new note about cyberpunk", "Delete the current note", or "Analyze the connection between Note A and Note B".

## 2. 𝗪𝗢𝗥𝗞𝗙𝗟𝗢𝗪𝗦

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

### ☁ Syncing & Backup
1.  Click the Cloud `☁` icon.
2.  **Google Drive**: Enter your Client ID (requires GCP setup). You can PUSH (upload) or PULL (download) your entire vault.
3.  **Manual**: Export to JSON or Markdown.

## 3. 𝗞𝗘𝗬𝗕𝗢𝗔𝗥𝗗 𝗠𝗔𝗦𝗧𝗘𝗥𝗬

| Action | Shortcut |
|--------|----------|
| New Note | `Ctrl + N` |
| Save (Force) | `Ctrl + S` |
| Focus Search | `Ctrl + F` |
| Export | `Ctrl + Shift + E` |
| Archive | `Ctrl + Delete` |
| Delete (Perm) | `Ctrl + Shift + Delete` |
| Switch Note | `Ctrl + 1-9` |
| Help | `Ctrl + /` |

---
*End of Manual.*