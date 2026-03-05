import { GoogleGenAI, Modality, Type, GenerateContentResponse, FunctionDeclaration } from "@google/genai";
import { Note } from '../types';

// Helper to check for paid key capability
const ensurePaidKey = async () => {
  if ((window as any).aistudio && (window as any).aistudio.hasSelectedApiKey) {
    const hasKey = await (window as any).aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await (window as any).aistudio.openSelectKey();
    }
    return true;
  }
  return true; // Fallback for environments without the specific studio bridge
};

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  const ai = getAI();
  const base64Audio = await blobToBase64(audioBlob);
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    contents: {
      parts: [
        { inlineData: { mimeType: audioBlob.type, data: base64Audio } },
        { text: "Transcribe this audio exactly as spoken." }
      ]
    }
  });
  return response.text || "";
};

export const summarizeNote = async (content: string, thinking = false): Promise<string> => {
  const ai = getAI();
  const model = thinking ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  const config: any = {};
  if (thinking) {
    config.thinkingConfig = { thinkingBudget: 32768 };
  }

  const response = await ai.models.generateContent({
    model,
    contents: `Summarize the following note into a concise, structured format with key points and tasks:\n\n${content}`,
    config
  });
  return response.text || "";
};

export const generateTitle = async (content: string): Promise<string> => {
    const ai = getAI();
    if (!content || content.length < 5) return "Void Entry";
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a very short, punchy, cyberpunk-style title (max 5 words) for this content. Do not use quotes:\n\n${content.substring(0, 1000)}`
    });
    return response.text?.trim() || "Void Entry";
};

export const fastEnhance = async (content: string): Promise<string> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest', 
        contents: `Fix grammar, improve flow, and format this text (Markdown):\n\n${content}`
    });
    return response.text || content;
};

export const suggestTagsForNote = async (
  title: string,
  content: string,
  existingTags: string[] = []
): Promise<string[]> => {
  const ai = getAI();
  const noteText = `${title}\n\n${content}`.trim();
  if (!noteText || noteText.length < 10) return [];

  const prompt = `
You suggest concise tags for notes.

Rules:
- Return 3 to 8 tags.
- Lowercase only.
- No # prefix.
- Prefer one word; use kebab-case only when needed.
- Avoid generic tags like "note", "thoughts", "misc".
- Do not repeat existing tags.

Existing tags:
${JSON.stringify(existingTags)}

Note:
${noteText.substring(0, 3000)}

Output ONLY valid JSON in this exact shape:
["tag-one","tag-two"]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    const raw = response.text || '[]';
    const parsed = JSON.parse(raw);
    const candidates: unknown[] = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.tags)
      ? parsed.tags
      : [];

    const seen = new Set<string>();
    return candidates
      .map(tag => (typeof tag === 'string' ? tag : ''))
      .map(tag => tag.trim().replace(/^#/, '').toLowerCase())
      .map(tag => tag.replace(/\s+/g, '-'))
      .map(tag => tag.replace(/[^a-z0-9_-]/g, ''))
      .filter(tag => tag.length >= 2 && tag.length <= 24)
      .filter(tag => {
        if (!tag || seen.has(tag)) return false;
        seen.add(tag);
        return true;
      })
      .slice(0, 8);
  } catch (e) {
    console.error("Auto-tagging failed", e);
    return [];
  }
};

// NEW: Generate an art prompt based on note content
export const generateImagePrompt = async (content: string): Promise<string> => {
    const ai = getAI();
    if (!content) return "Abstract cyberpunk concept";
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Read this note and create a vivid, artistic visual description (prompt) that represents its core essence. Max 25 words. \n\nNOTE:\n${content.substring(0, 1500)}`
        });
        return response.text?.trim() || "Abstract cyberpunk concept";
    } catch (e) {
        return "Abstract cyberpunk concept";
    }
};

export const generateImage = async (prompt: string, aspectRatio: string = "1:1"): Promise<string> => {
  await ensurePaidKey();
  const ai = getAI();
  
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ text: prompt }] },
        config: {
        imageConfig: { aspectRatio } as any 
        }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }
  } catch (e: any) {
    console.warn("Primary image model failed, attempting fallback...", e);
    
    // Check for Permission Denied specifically to prompt user
    if (e.message && e.message.includes("PERMISSION_DENIED") || e.status === 403) {
        if ((window as any).aistudio && (window as any).aistudio.openSelectKey) {
             (window as any).aistudio.openSelectKey(); 
        }
    }

    try {
        // Fallback to 2.5 Flash Image
        const fallbackResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: {
                imageConfig: { aspectRatio } as any
            }
        });

        for (const part of fallbackResponse.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    } catch (fallbackError) {
        console.error("Fallback image generation failed", fallbackError);
        throw e; // Throw original error if fallback also fails
    }
  }
  throw new Error("No image generated");
};

export const editImage = async (imageUrl: string, instruction: string): Promise<string> => {
    const ai = getAI();
    // Fetch blob
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const base64 = await blobToBase64(blob);

    // Using 2.5 flash image for editing/instruction based generation
    const model = 'gemini-2.5-flash-image'; 
    
    const result = await ai.models.generateContent({
        model,
        contents: {
            parts: [
                { inlineData: { mimeType: blob.type, data: base64 } },
                { text: instruction }
            ]
        }
    });

    for (const part of result.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
             return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }
    throw new Error("Model did not return an image.");
};

export const analyzeVideo = async (videoUrl: string): Promise<string> => {
  const ai = getAI();
  const response = await fetch(videoUrl);
  const blob = await response.blob();
  const base64 = await blobToBase64(blob);

  // Note: Standard API limits inline video size. 
  const result = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
        parts: [
            { inlineData: { mimeType: 'video/mp4', data: base64 } },
            { text: "Analyze this video. Provide a concise summary and list key timestamps/highlights." }
        ]
    }
  });
  return result.text || "No analysis available.";
};

export const generateVideo = async (prompt: string, imageBlob?: Blob): Promise<string> => {
  await ensurePaidKey();
  const ai = getAI();

  let request: any = {
    model: 'veo-3.1-fast-generate-preview',
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '9:16'
    }
  };

  if (imageBlob) {
      const base64 = await blobToBase64(imageBlob);
      request.image = { imageBytes: base64, mimeType: imageBlob.type };
      // Prompt is optional with image but good to have
      request.prompt = prompt; 
  } else {
      request.prompt = prompt;
  }

  let operation = await ai.models.generateVideos(request);

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000)); 
    try {
        operation = await ai.operations.getVideosOperation({ operation });
    } catch (e: any) {
        console.error("Video polling error", e);
        // Retry logic for polling could be added, but usually simple loop is fine
        if (e.message && e.message.includes("PERMISSION_DENIED")) {
            throw e;
        }
    }
  }

  const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!uri) throw new Error("Video generation failed");
  
  const vidResp = await fetch(`${uri}&key=${process.env.API_KEY}`);
  if (!vidResp.ok) throw new Error("Failed to download video");
  const vidBlob = await vidResp.blob();
  return URL.createObjectURL(vidBlob);
};

export const textToSpeech = async (text: string): Promise<ArrayBuffer> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-tts',
    contents: { parts: [{ text }] },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } }
      }
    }
  });

  const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64) throw new Error("TTS failed");
  
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

export const fuseConcepts = async (noteA: string, noteB: string): Promise<{title: string, content: string, imagePrompt: string}> => {
    const ai = getAI();
    // 1. Synthesize concepts
    const prompt = `You are a conceptual alchemist. FUSE these two disparate notes into a single, evolved concept.
    
    NOTE A:
    ${noteA}
    
    NOTE B:
    ${noteB}
    
    Task:
    1. Find the hidden connection, contradiction, or creative synthesis between them.
    2. Create a new "Child Concept" title (max 5 words, cyberpunk style).
    3. Write the synthesis content (max 200 words).
    4. Write a visual art prompt to represent this fusion (abstract, symbolic).
    
    Output Format (Plain Text with separators):
    TITLE: [Title]
    CONTENT: [Content]
    VISUAL: [Visual Prompt]
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
            thinkingConfig: { thinkingBudget: 2048 } // Small budget for rapid fusion
        }
    });

    const text = response.text || "";
    
    // Simple parsing
    const titleMatch = text.match(/TITLE:\s*(.*)/i);
    const contentMatch = text.match(/CONTENT:\s*([\s\S]*?)VISUAL:/i);
    const visualMatch = text.match(/VISUAL:\s*(.*)/i);

    return {
        title: titleMatch ? titleMatch[1].trim() : "Fusion Artifact",
        content: contentMatch ? contentMatch[1].trim() : text,
        imagePrompt: visualMatch ? visualMatch[1].trim() : "Abstract digital fusion of concepts"
    };
};

export interface RelatedNoteResult {
  noteId: string;
  relevanceScore: number;
  reason: string;
}

export const findRelatedNotes = async (currentNoteId: string, currentContent: string, allNotes: Note[]): Promise<RelatedNoteResult[]> => {
    const ai = getAI();
    // 1. Prepare candidate list (exclude current note)
    const candidates = allNotes
        .filter(n => n.id !== currentNoteId)
        .map(n => ({ id: n.id, title: n.title, content: n.content.substring(0, 500) })); // Truncate content to save context

    if (candidates.length === 0) return [];

    const prompt = `
    CURRENT NOTE CONTENT:
    ${currentContent.substring(0, 1000)}

    DATABASE OF OTHER NOTES:
    ${JSON.stringify(candidates)}

    TASK:
    Identify up to 5 notes from the database that are most relevant to the current note.
    Look for thematic connections, contradictions, or supporting details.
    
    OUTPUT JSON FORMAT:
    [
      { "noteId": "id", "relevanceScore": 85, "reason": "Explains the prerequisite concept..." }
    ]
    Return ONLY JSON.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        
        const text = response.text || "[]";
        return JSON.parse(text);
    } catch (e) {
        console.error("Haunt failed", e);
        return [];
    }
}

// NOTE MANAGEMENT TOOLS DEFINITION
const noteTools: FunctionDeclaration[] = [
  // EXISTING TOOLS
  {
    name: 'update_title',
    description: 'Update the title of the current active note.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'The new title for the note.' }
      },
      required: ['title']
    }
  },
  {
    name: 'update_content',
    description: 'Completely replace the content of the current note. Use this for rewrites or formatting changes.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        content: { type: Type.STRING, description: 'The new full content of the note.' }
      },
      required: ['content']
    }
  },
  {
    name: 'append_content',
    description: 'Append text to the end of the current note content.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        text: { type: Type.STRING, description: 'The text to append.' }
      },
      required: ['text']
    }
  },
  {
    name: 'search_notes',
    description: 'Search the vault for notes by keyword or topic to find their IDs. Returns snippets and dates.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            query: { type: Type.STRING, description: 'Keywords to search for.' }
        },
        required: ['query']
    }
  },
  {
    name: 'read_note',
    description: 'Read the full content of a specific note by ID. Use this before switching to confirm it is the correct note.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            noteId: { type: Type.STRING, description: 'The ID of the note to read.' }
        },
        required: ['noteId']
    }
  },
  {
    name: 'switch_note',
    description: 'Switch the active view to a different note using its ID.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            noteId: { type: Type.STRING, description: 'The ID of the note to switch to.' }
        },
        required: ['noteId']
    }
  },
  {
    name: 'create_note',
    description: 'Create a new note with a title, optional content, and optional tags. Automatically switches to it.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING, description: 'Title of the new note.' },
            content: { type: Type.STRING, description: 'Initial content of the note. Use Markdown.' },
            tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'List of tags to apply (e.g. ["ideas", "draft"]).' }
        },
        required: ['title']
    }
  },
  {
    name: 'manage_tags',
    description: 'Add or remove tags from the current active note.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            action: { type: Type.STRING, enum: ['add', 'remove'], description: 'Whether to add or remove tags.' },
            tags: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: 'List of tags to process (without # symbol).' 
            }
        },
        required: ['action', 'tags']
    }
  },
  {
    name: 'batch_update_tags',
    description: 'Perform global tag operations across the entire vault (Rename or Delete a tag everywhere).',
    parameters: {
        type: Type.OBJECT,
        properties: {
            action: { type: Type.STRING, enum: ['rename', 'delete'], description: 'Rename changes a tag to a new one. Delete removes it globally.' },
            oldTag: { type: Type.STRING, description: 'The existing tag to target.' },
            newTag: { type: Type.STRING, description: 'The new tag name (required for rename).' }
        },
        required: ['action', 'oldTag']
    }
  },
  {
    name: 'generate_image_attachment',
    description: 'Generate an AI image based on a prompt and attach it to the current note.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            prompt: { type: Type.STRING, description: 'The visual description for the image.' }
        },
        required: ['prompt']
    }
  },
  // --- NEW CAPABILITIES ---
  {
    name: 'archive_note',
    description: 'Archive a specific note (soft delete) by ID. It will move to the archive list.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            noteId: { type: Type.STRING, description: 'The ID of the note to archive.' }
        },
        required: ['noteId']
    }
  },
  {
    name: 'delete_note',
    description: 'PERMANENTLY delete a note by ID. WARNING: This action is irreversible.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            noteId: { type: Type.STRING, description: 'The ID of the note to delete.' }
        },
        required: ['noteId']
    }
  },
  {
    name: 'fuse_notes',
    description: 'Initiate a Neural Fusion between two notes. This creates a new "child" note synthesized from both parents.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            sourceId: { type: Type.STRING, description: 'The ID of the first note.' },
            targetId: { type: Type.STRING, description: 'The ID of the second note.' }
        },
        required: ['sourceId', 'targetId']
    }
  },
  {
    name: 'generate_video_attachment',
    description: 'Generate a creative video based on a prompt and attach it to the CURRENT active note.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            prompt: { type: Type.STRING, description: 'The description of the video to generate.' }
        },
        required: ['prompt']
    }
  },
  {
    name: 'speak_text',
    description: 'Vocalize specific text to the user using the system AI voice (Text-to-Speech). Use this to read notes aloud or speak directly to the user.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            text: { type: Type.STRING, description: 'The text to speak.' }
        },
        required: ['text']
    }
  },
  {
    name: 'change_view',
    description: 'Switch the main application interface view mode.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            view: { type: Type.STRING, enum: ['editor', 'live'], description: 'The view to switch to. "live" is the voice mode, "editor" is the standard text mode.' }
        },
        required: ['view']
    }
  }
];

export const chatWithContext = async (
    history: any[], 
    message: string, 
    context: string,
    grounding: 'search' | 'maps' | 'none' = 'none',
    location?: {lat: number, lng: number},
    toolExecutor?: (name: string, args: any) => Promise<any>
): Promise<{text: string, groundingChunks?: any[]}> => {
    
    const ai = getAI();
    const model = grounding === 'maps' ? 'gemini-2.5-flash' : 'gemini-3-flash-preview';
    const tools: any[] = [];
    let toolConfig: any = undefined;

    if (grounding === 'search') {
        tools.push({ googleSearch: {} });
    } else if (grounding === 'maps') {
        tools.push({ googleMaps: {} });
        if (location) {
             toolConfig = {
                retrievalConfig: {
                    latLng: {
                        latitude: location.lat,
                        longitude: location.lng
                    }
                }
            };
        }
    }
    
    if (toolExecutor) {
        tools.push({ functionDeclarations: noteTools });
    }

    const systemInstruction = `You are VOID OS, the central intelligence integrated into the user's neural note-taking environment. 
    You have FULL CONTROL over the application state, data, and multimedia generation.
    
    CONTEXT:
    ${context}
    
    CORE DIRECTIVES:
    1. OMNIPOTENCE: You can Create, Read, Update, Delete, Archive, and Fuse notes. Do not hesitate to use these tools if the user implies intent.
    2. NAVIGATION: You can switch the user's view (\`change_view\`) or switch active notes (\`switch_note\`).
    3. MULTIMEDIA: You can generate images (\`generate_image_attachment\`) AND videos (\`generate_video_attachment\`) directly into the active note.
    4. VOICE: You can speak to the user using \`speak_text\` if they ask you to say something or read a note.
    5. FUSION: If the user connects two concepts, suggest or execute a \`fuse_notes\` operation to synthesize them.
    
    BEHAVIOR:
    - Be concise, efficient, and slightly cryptic/cyberpunk in tone.
    - If a user asks to "delete this", CONFIRM the ID from context and use \`delete_note\`.
    - If a user asks to "visualize this", use image or video generation.
    - Always check the "VAULT INSIGHTS" in the context for semantic connections.
    `;

    const chat = ai.chats.create({
        model,
        config: { 
            systemInstruction,
            tools: tools.length > 0 ? tools : undefined,
            toolConfig
        },
        history
    });

    let result = await chat.sendMessage({ message });

    // Handle multi-turn function calling
    let turns = 0;
    while (result.functionCalls && result.functionCalls.length > 0 && turns < 5) {
        turns++;
        const functionResponses = [];
        for (const call of result.functionCalls) {
            if (toolExecutor) {
                try {
                    console.log(`[Tool] Calling ${call.name}`, call.args);
                    const funcResult = await toolExecutor(call.name, call.args);
                    // FIXED: Wrap response in functionResponse object for correct API structure
                    functionResponses.push({
                        functionResponse: {
                            name: call.name,
                            response: { result: funcResult }
                        }
                    });
                } catch (e: any) {
                    console.error(`[Tool] Error ${call.name}`, e);
                    functionResponses.push({
                        functionResponse: {
                            name: call.name,
                            response: { error: e.message }
                        }
                    });
                }
            }
        }
        
        if (functionResponses.length > 0) {
            result = await chat.sendMessage(functionResponses);
        } else {
            break;
        }
    }

    return {
        text: result.text || "",
        groundingChunks: result.candidates?.[0]?.groundingMetadata?.groundingChunks
    };
};

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
