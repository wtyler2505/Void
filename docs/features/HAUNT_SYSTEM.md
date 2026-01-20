# 👻 𝗛𝗔𝗨𝗡𝗧 𝗦𝗬𝗦𝗧𝗘𝗠

> *Echoes from the database.*

## 1. 𝗢𝗩𝗘𝗥𝗩𝗜𝗘𝗪

The Haunt System is a "Self-RAG" (Retrieval Augmented Generation) implementation. Instead of using vector embeddings (which require a heavy client-side vector DB or server), VOID uses the massive context window of Gemini 3.0 Flash to analyze the *entire* vault metadata in real-time.

## 2. 𝗧𝗘𝗖𝗛𝗡𝗜𝗖𝗔𝗟 𝗜𝗠𝗣𝗟𝗘𝗠𝗘𝗡𝗧𝗔𝗧𝗜𝗢𝗡

### The Function
Located in `services/gemini.ts`: `findRelatedNotes(currentNoteId, currentContent, allNotes)`

### The Mechanism
1.  **Payload Construction**: The system creates a lightweight JSON representation of the user's vault. It strips heavy content, keeping only Titles and the first 500 characters of Content.
2.  **Context Injection**: This JSON is passed to `gemini-3-flash-preview` along with the current active note.
3.  **Analysis**: The model is asked to find "Thematic connections, contradictions, or supporting details".
4.  **Structured Output**: The model returns a JSON array containing:
    *   `noteId`: The ID of the related note.
    *   `relevanceScore`: 0-100 confidence score.
    *   `reason`: A short explanation of *why* it is related.

## 3. 𝗖𝗢𝗠𝗣𝗢𝗡𝗘𝗡𝗧

**File**: `components/Editor.tsx` -> `HauntPanel` (Internal logic)

*   **Trigger**: The Ghost icon in the toolbar.
*   **State**: `hauntResults` stores the AI response.
*   **Navigation**: Clicking a result triggers `onSelectNote`, instantly switching the view to the related entry.

## 4. 𝗣𝗘𝗥𝗙𝗢𝗥𝗠𝗔𝗡𝗖𝗘

Because we send text summaries rather than vectors, this method is viable for vaults up to ~500-1000 notes (depending on average note size) within the 1M token context window of Gemini Flash. For larger vaults, a Vector DB layer would be required (future roadmap).

---
*Haunt Logic Verified.*