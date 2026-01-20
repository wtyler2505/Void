# 👁️ 𝗠𝗨𝗟𝗧𝗜𝗠𝗘𝗗𝗜𝗔 𝗘𝗡𝗚𝗜𝗡𝗘

> *From thought to pixel.*

## 1. 𝗜𝗠𝗔𝗚𝗘 𝗚𝗘𝗡𝗘𝗥𝗔𝗧𝗜𝗢𝗡

**Function**: `gemini.ts` -> `generateImage`

### Models
1.  **Primary**: `gemini-3-pro-image-preview` (Imagen 3). Supports high-fidelity, text-in-image.
2.  **Fallback**: `gemini-2.5-flash-image` (Nano Banana). Used if the primary model hits 403 (Permission) or quota limits.

### Logic
The app requests a Base64 string directly (`responseMimeType` not needed for inline data).
*   **Prompt**: User input or AI-generated visual description.
*   **Output**: `data:image/png;base64,...`
*   **Storage**: The Base64 string is stored directly in the `Note` object. *Note: This increases DB size significantly, necessitating IndexedDB.*

## 2. 𝗩𝗜𝗗𝗘𝗢 𝗚𝗘𝗡𝗘𝗥𝗔𝗧𝗜𝗢𝗡

**Function**: `gemini.ts` -> `generateVideo`

### Model
*   **Model**: `veo-3.1-fast-generate-preview`

### Workflow (Polling)
Video generation is asynchronous and takes time.
1.  **Request**: Call `ai.models.generateVideos`. Returns an `Operation` object.
2.  **Poll**: Loop `ai.operations.getVideosOperation` every 5 seconds until `operation.done` is true.
3.  **Fetch**: The result is a URI. The app must `fetch()` this URI (appending the API Key) to get the raw MP4 bytes.
4.  **Blob**: Convert bytes to a Blob URL (`URL.createObjectURL`) for display and `Blob` for storage.

## 3. 𝗧𝗘𝗫𝗧-𝗧𝗢-𝗦𝗣𝗘𝗘𝗖𝗛 (𝗧𝗧𝗦)

**Function**: `gemini.ts` -> `textToSpeech`

### Model
*   **Model**: `gemini-2.5-flash-preview-tts`
*   **Voice**: "Fenrir" (Deep, resonant).

The system receives a Base64 audio chunk, decodes it to an `ArrayBuffer`, and uses the Web Audio API to play it.

---
*Visual Cortex Online.*