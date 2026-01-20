# 💬 𝗢𝗠𝗡𝗜𝗣𝗢𝗧𝗘𝗡𝗧 𝗖𝗛𝗔𝗧

> *The Command Line for Reality.*

## 1. 𝗢𝗩𝗘𝗥𝗩𝗜𝗘𝗪

The Chat Overlay is not just a chatbot. It is a system administrator. By giving the Gemini model access to `FunctionDeclarations` that map to `App.tsx` state modifiers, the AI can control the application.

## 2. 𝗧𝗢𝗢𝗟 𝗗𝗘𝗙𝗜𝗡𝗜𝗧𝗜𝗢𝗡𝗦

Located in `services/gemini.ts`. The model has access to:

### Data Manipulation
*   `create_note(title, content, tags)`
*   `update_title(title)`
*   `update_content(content)`
*   `append_content(text)`
*   `archive_note(id)`
*   `delete_note(id)`

### Taxonomy
*   `manage_tags(action, tags)`
*   `batch_update_tags(action, oldTag, newTag)`

### Navigation & Retrieval
*   `search_notes(query)`
*   `read_note(id)`
*   `switch_note(id)`
*   `change_view(view)`

### Creative
*   `fuse_notes(sourceId, targetId)`
*   `generate_image_attachment(prompt)`
*   `generate_video_attachment(prompt)`
*   `speak_text(text)`

## 3. 𝗘𝗫𝗘𝗖𝗨𝗧𝗜𝗢𝗡 𝗙𝗟𝗢𝗪

1.  **User**: "Create a note about Cyberpunk and add a neon city image."
2.  **Model**: Recognizes intent. Returns `functionCall` for `create_note`.
3.  **Client (`ChatOverlay.tsx`)**: Executes `toolExecutor('create_note', ...)`.
4.  **Client**: Sends `functionResponse` back to Model.
5.  **Model**: Sees note is created. Returns `functionCall` for `generate_image_attachment`.
6.  **Client**: Calls Gemini Image API. Attaches result. Sends response.
7.  **Model**: "Note created with image attached."

## 4. 𝗚𝗥𝗢𝗨𝗡𝗗𝗜𝗡𝗚

The Chat interface supports **Google Search** and **Google Maps** grounding.
*   **Toggles**: UI buttons in `ChatOverlay`.
*   **Implementation**: Adds `{ googleSearch: {} }` to the `tools` array in the API request.
*   **Rendering**: Citations/Links are returned in `groundingMetadata` and rendered below the chat response.

---
*Omnipotence Protocols Verified.*