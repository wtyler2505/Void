# ⚛ 𝗡𝗘𝗨𝗥𝗔𝗟 𝗙𝗨𝗦𝗜𝗢𝗡

> *Algorithmic synthesis of disparate thought vectors.*

## 1. 𝗢𝗩𝗘𝗥𝗩𝗜𝗘𝗪

Neural Fusion is the signature feature of VOID. It allows the user to take two separate notes and use Gemini 3.0 Pro to synthesize them into a new, evolved concept. This is not simple concatenation; it is reasoning-based synthesis.

## 2. 𝗧𝗘𝗖𝗛𝗡𝗜𝗖𝗔𝗟 𝗜𝗠𝗣𝗟𝗘𝗠𝗘𝗡𝗧𝗔𝗧𝗜𝗢𝗡

### The Function
Located in `services/gemini.ts`: `fuseConcepts(noteA: string, noteB: string)`

### The Prompt Strategy
We use a **Role-Playing Prompt**:
> "You are a conceptual alchemist. FUSE these two disparate notes into a single, evolved concept."

The model is instructed to:
1.  Find hidden connections or contradictions.
2.  Generate a **Child Concept Title** (Cyberpunk style).
3.  Write the **Synthesis Content**.
4.  Generate a **Visual Prompt** describing the abstract feeling of the fusion.

### The Model
*   **Model ID**: `gemini-3-pro-preview`
*   **Config**: `thinkingConfig` is enabled with a budget of 2048 tokens to allow for "reasoning" before outputting the synthesis.

## 3. 𝗨𝗜 𝗜𝗡𝗧𝗘𝗥𝗔𝗖𝗧𝗜𝗢𝗡

### Method A: Drag and Drop
1.  **Component**: `Sidebar.tsx`
2.  **Events**: standard HTML5 DnD API (`onDragStart`, `onDragOver`, `onDrop`).
3.  **Logic**: When Note ID `A` is dropped on Note ID `B`, the `onFuseNotes` callback is fired in `App.tsx`.

### Method B: Selection Mode
1.  User clicks the Atom icon in Sidebar.
2.  `isFusionMode` state becomes `true`.
3.  User clicks first note (`fusionSourceId` set).
4.  User clicks second note.
5.  Fusion triggers.

## 4. 𝗔𝗥𝗧𝗜𝗙𝗔𝗖𝗧 𝗚𝗘𝗡𝗘𝗥𝗔𝗧𝗜𝗢𝗡

Once the text synthesis is complete, the system extracts the `VISUAL:` prompt and immediately calls `generateImage`. The resulting Base64 image is attached to the new note as a "Fusion Artifact".

---
*Fusion Protocols Defined.*