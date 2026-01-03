import { GoogleGenAI, Modality, Type, GenerateContentResponse } from "@google/genai";

// Ensure we have a valid API key from environment
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

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

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  const base64Audio = await blobToBase64(audioBlob);
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
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
    if (!content || content.length < 5) return "Void Entry";
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a very short, punchy, cyberpunk-style title (max 5 words) for this content. Do not use quotes:\n\n${content.substring(0, 1000)}`
    });
    return response.text?.trim() || "Void Entry";
};

export const fastEnhance = async (content: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest', 
        contents: `Fix grammar, improve flow, and format this text (Markdown):\n\n${content}`
    });
    return response.text || content;
};

// NEW: Generate an art prompt based on note content
export const generateImagePrompt = async (content: string): Promise<string> => {
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
  
  const aiPaid = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await aiPaid.models.generateContent({
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
        const fallbackResponse = await aiPaid.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            // 2.5 Flash Image supports aspect ratio via config as well usually
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
  const aiPaid = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

  let operation = await aiPaid.models.generateVideos(request);

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000)); 
    try {
        operation = await aiPaid.operations.getVideosOperation({ operation });
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

export const chatWithContext = async (
    history: any[], 
    message: string, 
    context: string,
    grounding: 'search' | 'maps' | 'none' = 'none',
    location?: {lat: number, lng: number}
): Promise<{text: string, groundingChunks?: any[]}> => {
    
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

    const systemInstruction = `You are a helpful assistant integrated into a note-taking app. 
    Here is the context (Current active note and/or vault summary):
    ---
    ${context}
    ---
    Answer the user's questions based on this context if applicable, or use your general knowledge.`;

    const chat = ai.chats.create({
        model,
        config: { 
            systemInstruction,
            tools: tools.length > 0 ? tools : undefined,
            toolConfig
        },
        history
    });

    const result = await chat.sendMessage({ message });
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