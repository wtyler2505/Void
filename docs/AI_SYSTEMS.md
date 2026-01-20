# 🧠 𝗔𝗜 𝗦𝗬𝗦𝗧𝗘𝗠𝗦 𝗜𝗡𝗧𝗘𝗚𝗥𝗔𝗧𝗜𝗢𝗡

> *The Ghost in the Machine.*

VOID is powered by the **Google GenAI SDK** (`@google/genai`). It utilizes a multi-model strategy to optimize for latency, reasoning, and creativity depending on the task.

## 1. 𝗠𝗢𝗗𝗘𝗟 𝗠𝗔𝗧𝗥𝗜𝗫

| Task | Model ID | Reason |
|------|----------|--------|
| **Chat & Reasoning** | `gemini-3-flash-preview` | Low latency, high throughput context handling. |
| **Complex Fusion** | `gemini-3-pro-preview` | Deep reasoning for synthesizing disparate concepts. |
| **Live Voice** | `gemini-2.5-flash-native-audio-preview` | Real-time, low latency audio-in/audio-out. |
| **Image Generation** | `gemini-3-pro-image-preview` | High-fidelity visuals (Imagen 3 backend). |
| **Video Generation** | `veo-3.1-fast-generate-preview` | Rapid video prototyping. |
| **Text-to-Speech** | `gemini-2.5-flash-preview-tts` | High-quality system voice ("Fenrir"). |
| **Fast Edits** | `gemini-flash-lite-latest` | Instant grammar/formatting fixes. |

## 2. 𝗙𝗨𝗡𝗖𝗧𝗜𝗢𝗡 𝗖𝗔𝗟𝗟𝗜𝗡𝗚 (𝗧𝗢𝗢𝗟𝗦)

The `ChatOverlay` is equipped with "Omnipotence" - it can control the application state via defined tools.

### State Manipulation Tools
*   `create_note(title, content, tags)`: Spawns new data entities.
*   `update_title / update_content`: Modifies the active context.
*   `append_content`: Adds to existing streams.
*   `archive_note / delete_note`: Data lifecycle management.
*   `switch_note(noteId)`: Navigation control.
*   `manage_tags(action, tags)`: Taxonomy control.

### Creative Tools
*   `fuse_notes(sourceId, targetId)`: Triggers the Neural Fusion sub-routine.
*   `generate_image_attachment(prompt)`: Calls Imagen and appends base64 result.
*   `generate_video_attachment(prompt)`: Calls Veo and appends video result.
*   `speak_text(text)`: Activates TTS engine for audio feedback.

### Retrieval Tools
*   `search_notes(query)`: Semantic/Keyword search within the Vault.
*   `read_note(noteId)`: Full content retrieval for context loading.

## 3. 𝗡𝗘𝗨𝗥𝗔𝗟 𝗙𝗨𝗦𝗜𝗢𝗡 𝗣𝗥𝗢𝗧𝗢𝗖𝗢𝗟

**Function**: `Gemini.fuseConcepts(noteA, noteB)`

This is a specialized prompt engineering pipeline. It takes two text inputs and instructs the model (`gemini-3-pro-preview`) to act as a "Conceptual Alchemist".

**Output Structure**:
1.  **Title**: A new, synthesized header.
2.  **Content**: A synthesis of the two ideas, finding hidden connections or contradictions.
3.  **Visual Prompt**: An abstract description of the fusion, which is immediately fed into the Image Generation model to create a "Fusion Artifact".

## 4. 𝗛𝗔𝗨 N𝗧 𝗦𝗬𝗦𝗧𝗘𝗠 (𝗥𝗲𝗹𝗮𝘁𝗲𝗱 𝗡𝗼𝘁𝗲𝘀)

**Function**: `Gemini.findRelatedNotes`

**Mechanism**:
1.  Extracts the current note content.
2.  Packages a lightweight JSON summary of *all* other notes (ID, Title, truncated Content).
3.  Sends payload to `gemini-3-flash-preview`.
4.  **Prompt Directive**: "Identify up to 5 notes... Look for thematic connections, contradictions, or supporting details."
5.  **Result**: Returns JSON with `relevanceScore` and `reason`.
6.  **UI**: Displays "Ghosts" in the side panel that can be clicked to navigate.

## 5. 𝗟𝗜𝗩𝗘 𝗦𝗘𝗦𝗦𝗜𝗢𝗡 (𝗪𝗲𝗯𝗦𝗼𝗰𝗸𝗲𝘁𝘀)

**Component**: `LiveSession.tsx`

Uses `ai.live.connect` to establish a persistent bi-directional stream.
*   **Input**: Raw PCM 16kHz audio from microphone -> Base64 -> WebSocket.
*   **Processing**: Model thinks via `gemini-2.5-flash-native-audio-preview`.
*   **Output**: Raw PCM 24kHz audio chunks -> Web Audio API `AudioBufferSourceNode`.
*   **Context**: The current active note is injected into the `systemInstruction` at connection time, allowing the user to "talk to the note".

## 6. 𝗚𝗥𝗢𝗨𝗡𝗗𝗜𝗡𝗚

The Chat Overlay supports:
*   **Google Search**: For real-world data lookup.
*   **Google Maps**: For location-based queries (requires Geolocation permission).

---
*AI Protocols Defined.*