# ⚡ 𝗟𝗜𝗩𝗘 𝗠𝗔𝗧𝗥𝗜𝗫

> *Real-time neural interface.*

## 1. 𝗢𝗩𝗘𝗥𝗩𝗜𝗘𝗪

The Live Matrix (`LiveSession.tsx`) enables low-latency, bidirectional voice communication with the Gemini model. It bypasses standard HTTP requests in favor of a persistent WebSocket connection via the `@google/genai` Live API.

## 2. 𝗔𝗥𝗖𝗛𝗜𝗧𝗘𝗖𝗧𝗨𝗥𝗘

### Component: `LiveSession.tsx`

### 1. Audio Contexts
Browser limitations require separate contexts for robust handling:
*   **Input Context**: `16,000Hz`. Captures microphone audio.
*   **Output Context**: `24,000Hz`. Plays back model audio.

### 2. WebSocket Protocol
*   **Connection**: `ai.live.connect({ model: 'gemini-2.5-flash-native-audio-preview...' })`
*   **Events**:
    *   `onopen`: Connection established. Start streaming audio.
    *   `onmessage`: Receive audio chunks (`serverContent.modelTurn.parts[0].inlineData`).
    *   `onclose`: Cleanup.

### 3. Audio Processing
*   **Input**: `ScriptProcessorNode` (Legacy but reliable) captures 4096-sample buffers.
*   **Conversion**: Raw Float32 from microphone is converted to **PCM Int16** before being base64 encoded and sent to the model.
*   **Output**: Received PCM chunks are converted back to Float32 and scheduled for playback using `AudioBufferSourceNode` to ensure gapless audio.

## 3. 𝗖𝗢𝗡𝗧𝗘𝗫𝗧 𝗜𝗡𝗝𝗘𝗖𝗧𝗜𝗢𝗡

When a Live Session starts, the system takes the **Active Note** content and injects it into the `systemInstruction` of the session.
*   **Effect**: The user can say "Read this to me" or "What do you think about this idea?", and the AI refers to the currently open note.

## 4. 𝗩𝗜𝗦𝗨𝗔𝗟𝗜𝗭𝗔𝗧𝗜𝗢𝗡

The UI renders a reactive CSS animation (`.animate-bounce`) synced to the connection status, providing visual feedback that the "Line is Open."

---
*Live Uplink Established.*