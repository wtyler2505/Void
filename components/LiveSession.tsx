import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { ICONS } from '../constants';

interface LiveSessionProps {
  onClose: () => void;
  context?: string;
}

export const LiveSession: React.FC<LiveSessionProps> = ({ onClose, context }) => {
    const [status, setStatus] = useState<'connecting' | 'connected' | 'error' | 'closed'>('connecting');
    const [transcripts, setTranscripts] = useState<{role: 'user'|'model', text: string}[]>([]);
    
    // Audio Contexts
    const inputContextRef = useRef<AudioContext | null>(null);
    const outputContextRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    useEffect(() => {
        let mounted = true;
        let sessionPromise: Promise<any> | null = null;
        
        const init = async () => {
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
                const inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                const outputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                
                inputContextRef.current = inputContext;
                outputContextRef.current = outputContext;
                
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const inputNode = inputContext.createMediaStreamSource(stream);
                
                // Processor for handling input buffer
                const processor = inputContext.createScriptProcessor(4096, 1, 1);
                
                // Build System Instruction with Context
                const instruction = `You are VOID, the digital abyss that stares back. The user is screaming into you. Be calm, infinite, and slightly cryptic but helpful.
                
                CONTEXT OF CURRENT SESSION:
                ${context || "The user is drifting in the void with no specific active note."}
                
                Use this context to answer questions or generate ideas if asked.`;

                // Connect Session
                sessionPromise = ai.live.connect({
                    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                    callbacks: {
                        onopen: () => {
                            if(mounted) setStatus('connected');
                            
                            processor.onaudioprocess = (e) => {
                                const inputData = e.inputBuffer.getChannelData(0);
                                const pcm16 = floatTo16BitPCM(inputData);
                                const base64 = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
                                
                                sessionPromise?.then(session => {
                                    session.sendRealtimeInput({
                                        media: {
                                            mimeType: 'audio/pcm;rate=16000',
                                            data: base64
                                        }
                                    });
                                });
                            };
                            
                            inputNode.connect(processor);
                            processor.connect(inputContext.destination);
                        },
                        onmessage: async (msg: LiveServerMessage) => {
                            if (!mounted) return;
                            
                            // Audio Playback
                            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                            if (audioData) {
                                const buffer = await decodeAudio(audioData, outputContext);
                                playAudio(buffer, outputContext);
                            }

                            // Transcriptions (Visual Feedback)
                            if (msg.serverContent?.modelTurn?.parts?.[0]?.text) {
                                // Sometimes text comes separately? Though usually Modality.AUDIO implies audio only unless transcribed
                            }
                        },
                        onclose: () => { if(mounted) setStatus('closed'); },
                        onerror: (e) => { console.error(e); if(mounted) setStatus('error'); }
                    },
                    config: {
                        responseModalities: [Modality.AUDIO],
                        speechConfig: {
                            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
                        },
                        systemInstruction: instruction
                    }
                });

            } catch (e) {
                console.error("Live Init Error", e);
                setStatus('error');
            }
        };

        init();

        return () => {
            mounted = false;
            // Cleanup contexts
            inputContextRef.current?.close();
            outputContextRef.current?.close();
            sourcesRef.current.forEach(s => s.stop());
        };
    }, []);

    // Helper: Float32 to Int16 PCM
    const floatTo16BitPCM = (float32Arr: Float32Array) => {
        const int16Arr = new Int16Array(float32Arr.length);
        for (let i = 0; i < float32Arr.length; i++) {
            const s = Math.max(-1, Math.min(1, float32Arr[i]));
            int16Arr[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        return int16Arr;
    };

    // Helper: Decode Audio
    const decodeAudio = async (base64: string, ctx: AudioContext) => {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for(let i=0; i<binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        
        // Manual decoding for raw PCM if needed, but the API returns specific format?
        // Actually, Live API output is PCM 24kHz usually.
        // We need to construct an AudioBuffer manually if it's raw PCM.
        
        const pcm16 = new Int16Array(bytes.buffer);
        const float32 = new Float32Array(pcm16.length);
        for(let i=0; i<pcm16.length; i++) float32[i] = pcm16[i] / 32768.0;
        
        const buffer = ctx.createBuffer(1, float32.length, 24000);
        buffer.copyToChannel(float32, 0);
        return buffer;
    };

    const playAudio = (buffer: AudioBuffer, ctx: AudioContext) => {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        
        const now = ctx.currentTime;
        // Schedule next start
        const start = Math.max(now, nextStartTimeRef.current);
        source.start(start);
        nextStartTimeRef.current = start + buffer.duration;
        
        sourcesRef.current.add(source);
        source.onended = () => sourcesRef.current.delete(source);
    };

    return (
        <div className="flex flex-col items-center justify-center h-full bg-[#1a051a] relative overflow-hidden">
            {/* Background Animation */}
            <div className="absolute inset-0 z-0 opacity-20">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#ff00ff] rounded-full blur-[100px] animate-pulse"></div>
            </div>

            <div className="z-10 text-center">
                <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center mb-8 transition-all duration-500 ${status === 'connected' ? 'border-[#ff00ff] shadow-[0_0_50px_#ff00ff]' : 'border-gray-700'}`}>
                    {status === 'connected' ? (
                        <div className="w-full flex items-center justify-center gap-1 h-10">
                            <div className="w-1 h-8 bg-[#ff00ff] animate-[bounce_1s_infinite]"></div>
                            <div className="w-1 h-12 bg-[#ff00ff] animate-[bounce_1.2s_infinite]"></div>
                            <div className="w-1 h-6 bg-[#ff00ff] animate-[bounce_0.8s_infinite]"></div>
                        </div>
                    ) : (
                        <span className="text-gray-500">...</span>
                    )}
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">VOID LIVE</h2>
                <p className="text-[#ff00ff] font-mono mb-8 uppercase tracking-widest">{status}</p>

                <button onClick={onClose} className="px-8 py-2 rounded-full border border-gray-600 hover:border-white text-gray-300 hover:text-white transition-all">
                    End Session
                </button>
            </div>
        </div>
    );
};