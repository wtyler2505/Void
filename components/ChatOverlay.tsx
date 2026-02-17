import React, { useState, useEffect, useRef } from 'react';
import { ICONS } from '../constants';
import { Note, ChatMessage, AppView } from '../types';
import * as Gemini from '../services/gemini';
import { formatTime } from '../utils';

interface ChatOverlayProps {
    onClose: () => void;
    contextNote: Note | null;
    notes: Note[];
    onUpdateNote: (id: string, updates: Partial<Note>) => void;
    onSwitchNote: (id: string) => void;
    onCreateNote: (title: string, content: string, tags?: string[]) => void;
    onBatchTagUpdate?: (action: 'rename' | 'delete', oldTag: string, newTag?: string) => void;
    onArchiveNote: (id: string) => void;
    onDeleteNote: (id: string) => void;
    onFuseNotes: (sourceId: string, targetId: string) => void;
    onChangeView: (view: AppView) => void;
}

// Client-side lightweight semantic scoring (Vault Intelligence)
const calculateRelevance = (query: string, note: Note): number => {
    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    if (terms.length === 0) return 0;
    
    let score = 0;
    const title = note.title.toLowerCase();
    const content = note.content.toLowerCase();
    const tags = note.tags.map(t => t.toLowerCase());

    terms.forEach(term => {
        if (title.includes(term)) score += 5;
        if (tags.some(t => t.includes(term))) score += 3;
        if (content.includes(term)) score += 1;
    });
    return score;
};

export const ChatOverlay: React.FC<ChatOverlayProps> = ({ 
    onClose, contextNote, notes, onUpdateNote, onSwitchNote, onCreateNote, 
    onBatchTagUpdate, onArchiveNote, onDeleteNote, onFuseNotes, onChangeView 
}) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: '1', role: 'model', text: 'VOID OS Online. Full system control authorized. Direct me.', timestamp: Date.now() }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [actionLog, setActionLog] = useState<string | null>(null);
    const [groundingEnabled, setGroundingEnabled] = useState<'none' | 'search' | 'maps'>('none');
    const [location, setLocation] = useState<{lat: number, lng: number} | undefined>(undefined);
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, actionLog]);

    useEffect(() => {
        if (groundingEnabled === 'maps' && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => console.error(err)
            );
        }
    }, [groundingEnabled]);

    const handleSend = async () => {
        if (!input.trim()) return;
        const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input, timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        // Tool Executor for Note Management
        const toolExecutor = async (name: string, args: any) => {
            setActionLog(`Executing: ${name}...`);
            
            // --- GLOBAL TOOLS (Don't need active note) ---
            if (name === 'search_notes') {
                const query = args.query.toLowerCase();
                const results = notes.filter(n => 
                    n.title.toLowerCase().includes(query) || 
                    n.content.toLowerCase().includes(query) ||
                    n.tags.some(t => t.toLowerCase().includes(query))
                ).map(n => ({ 
                    id: n.id, 
                    title: n.title, 
                    tags: n.tags,
                    lastModified: formatTime(n.updatedAt),
                    preview: n.content.substring(0, 150) + "..."
                }));
                return JSON.stringify(results);
            }

            if (name === 'read_note') {
                const target = notes.find(n => n.id === args.noteId);
                if (target) {
                    return JSON.stringify({
                        id: target.id,
                        title: target.title,
                        fullContent: target.content,
                        tags: target.tags,
                        lastModified: formatTime(target.updatedAt)
                    });
                }
                return "Note ID not found.";
            }

            if (name === 'switch_note') {
                const target = notes.find(n => n.id === args.noteId);
                if (target) {
                    onSwitchNote(target.id);
                    return `Switched view to note: ${target.title}`;
                }
                return "Note ID not found.";
            }

            if (name === 'create_note') {
                // Sanitize tags
                const tags = (args.tags || []).map((t: string) => t.replace(/^#/, ''));
                onCreateNote(args.title, args.content || '', tags);
                return `Created new note: ${args.title}`;
            }

            if (name === 'batch_update_tags') {
                if (onBatchTagUpdate) {
                    const oldTag = args.oldTag.replace(/^#/, '');
                    const newTag = args.newTag ? args.newTag.replace(/^#/, '') : undefined;
                    onBatchTagUpdate(args.action, oldTag, newTag);
                    return `Batch operation '${args.action}' completed for tag #${oldTag}.`;
                }
                return "Batch updates not supported.";
            }

            if (name === 'archive_note') {
                const target = notes.find(n => n.id === args.noteId);
                if (target) {
                    onArchiveNote(target.id);
                    return `Archived note: ${target.title}`;
                }
                return "Note ID not found.";
            }

            if (name === 'delete_note') {
                const target = notes.find(n => n.id === args.noteId);
                if (target) {
                    onDeleteNote(target.id);
                    return `Permanently deleted note: ${target.title}`;
                }
                return "Note ID not found.";
            }

            if (name === 'fuse_notes') {
                onFuseNotes(args.sourceId, args.targetId);
                return "Fusion process initiated.";
            }

            if (name === 'speak_text') {
                try {
                    const buffer = await Gemini.textToSpeech(args.text);
                    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                    const audioBuffer = await ctx.decodeAudioData(buffer);
                    const source = ctx.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(ctx.destination);
                    source.start();
                    return "Audio output active.";
                } catch(e: any) {
                    return `TTS Failed: ${e.message}`;
                }
            }

            if (name === 'change_view') {
                onChangeView(args.view);
                return `View switched to ${args.view}.`;
            }

            // --- CONTEXTUAL TOOLS (Need active note) ---
            if (!contextNote) return "Error: No active note selected for this operation.";

            if (name === 'update_title') {
                onUpdateNote(contextNote.id, { title: args.title });
                return "Title updated successfully.";
            }
            if (name === 'update_content') {
                onUpdateNote(contextNote.id, { content: args.content });
                return "Content updated successfully.";
            }
            if (name === 'append_content') {
                onUpdateNote(contextNote.id, { content: (contextNote.content || '') + '\n' + args.text });
                return "Content appended successfully.";
            }
            if (name === 'manage_tags') {
                const currentTags = new Set(contextNote.tags);
                // Sanitize input tags
                const tagsToProcess = args.tags.map((t: string) => t.replace(/^#/, ''));

                if (args.action === 'add') {
                    tagsToProcess.forEach((t: string) => currentTags.add(t));
                } else {
                    tagsToProcess.forEach((t: string) => currentTags.delete(t));
                }
                onUpdateNote(contextNote.id, { tags: Array.from(currentTags) });
                return `Tags updated. Current tags: ${Array.from(currentTags).join(', ')}`;
            }
            if (name === 'generate_image_attachment') {
                 // Async generation in background, but we need to return something to the model
                 try {
                     const imageUrl = await Gemini.generateImage(args.prompt, "16:9");
                     const attachment = { 
                         id: Date.now().toString(), 
                         type: 'image' as const, 
                         url: imageUrl, 
                         mimeType: 'image/png', 
                         metadata: args.prompt 
                     };
                     // We need to fetch the latest state of the note to append safely
                     const latestNote = notes.find(n => n.id === contextNote.id);
                     if(latestNote) {
                        onUpdateNote(contextNote.id, { attachments: [...latestNote.attachments, attachment] });
                        return "Image generated and attached successfully.";
                     }
                     return "Failed to attach image: Note not found.";
                 } catch (e: any) {
                     return `Image generation failed: ${e.message}`;
                 }
            }
            if (name === 'generate_video_attachment') {
                 // We run this asynchronously so we don't block the chat for 15s+
                 (async () => {
                     try {
                        const videoUrl = await Gemini.generateVideo(args.prompt);
                        const attachment = {
                            id: Date.now().toString(),
                            type: 'video' as const,
                            url: videoUrl,
                            mimeType: 'video/mp4',
                            metadata: args.prompt
                        };
                         const latestNote = notes.find(n => n.id === contextNote.id);
                         if(latestNote) {
                            onUpdateNote(contextNote.id, { attachments: [...latestNote.attachments, attachment] });
                         }
                     } catch (e) {
                         console.error("Async video gen failed", e);
                     }
                 })();
                 return "Video generation process initiated in background. It will appear in attachments shortly.";
            }

            return "Unknown tool.";
        };

        try {
            // 1. Construct Active Context
            let contextText = "";
            if (contextNote) {
                contextText += `=== ACTIVE NOTE (Use for Visual Synthesis) ===\nID: ${contextNote.id}\nTitle: ${contextNote.title}\nLast Modified: ${formatTime(contextNote.updatedAt)}\nTags: ${contextNote.tags.join(', ')}\nContent:\n${contextNote.content}\n\n`;
            } else {
                contextText += "=== NO ACTIVE NOTE SELECTED ===\n";
            }

            // 2. Vault Intelligence: Find relevant notes dynamically
            // Exclude active note from search
            const candidates = notes.filter(n => n.id !== contextNote?.id);
            const relevantNotes = candidates
                .map(n => ({ note: n, score: calculateRelevance(userMsg.text, n) }))
                .filter(item => item.score > 0)
                .sort((a, b) => b.score - a.score)
                .slice(0, 3); // Top 3 matches

            if (relevantNotes.length > 0) {
                contextText += `=== VAULT INSIGHTS (Relevant Notes for Query) ===\n`;
                relevantNotes.forEach(item => {
                    contextText += `- [${item.note.title}] (ID: ${item.note.id}): ${item.note.content.substring(0, 200)}...\n`;
                });
                contextText += `\n`;
            }
            
            // 3. Full Vault Index (Lightweight)
            contextText += `=== VAULT INDEX (All Notes) ===\n`;
            contextText += notes.map(n => `- [ID:${n.id}] ${n.title} (Tags: ${n.tags.join(',')}) | Modified: ${formatTime(n.updatedAt)}`).join('\n');
            
            const history = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
            const result = await Gemini.chatWithContext(history, userMsg.text, contextText, groundingEnabled, location, toolExecutor);
            
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: result.text, timestamp: Date.now() }]);
            if (result.groundingChunks?.length) {
                 const sources = result.groundingChunks.map(c => c.web?.uri || c.maps?.uri).filter(Boolean).join('\n');
                 if (sources) setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: `Sources:\n${sources}`, timestamp: Date.now() }]);
            }
        } catch (e) {
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Connection Error.", timestamp: Date.now() }]);
        } finally {
            setLoading(false);
            setActionLog(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0a]/95 backdrop-blur-md md:absolute md:inset-auto md:right-4 md:bottom-4 md:w-[450px] md:h-[650px] md:border md:border-[#00ff9d] md:shadow-[0_0_20px_rgba(0,255,157,0.2)] md: animate-fade-in font-mono">
            <div className="p-3 border-b border-[#333] flex justify-between items-center bg-[#050505] shrink-0">
                <span className="text-[#00ff9d] font-bold text-sm tracking-wider flex items-center gap-2">
                    <ICONS.Sparkle /> VOID OS
                </span>
                <button onClick={onClose} className="text-gray-500 hover:text-white p-2"><ICONS.Close /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(m => (
                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3  text-sm relative group ${
                            m.role === 'user' 
                            ? 'bg-[#1a1a1a] text-white border border-[#333]' 
                            : 'bg-[#002b1f]/50 text-[#00ff9d] border border-[#005c3d]'
                        }`}>
                            <pre className="whitespace-pre-wrap font-sans">{m.text}</pre>
                            {m.role === 'model' && <div className="absolute top-0 right-0 w-2 h-2 bg-[#00ff9d] rounded-full opacity-0 group-hover:opacity-50 animate-pulse"></div>}
                        </div>
                    </div>
                ))}
                
                {actionLog && (
                    <div className="flex justify-center">
                        <div className="bg-[#111] border border-[#00ff9d] text-[#00ff9d] text-xs px-3 py-1 rounded-full animate-pulse uppercase tracking-widest flex items-center gap-2">
                             <div className="w-1.5 h-1.5 bg-[#00ff9d] rounded-full"></div>
                             {actionLog}
                        </div>
                    </div>
                )}
                
                {loading && !actionLog && <div className="text-[#00ff9d] text-xs animate-pulse opacity-50 ml-2">COMPUTING...</div>}
                <div ref={endRef}></div>
            </div>

            <div className="p-3 border-t border-[#333] bg-[#050505] shrink-0">
                <div className="flex gap-2 mb-2">
                     <button onClick={() => setGroundingEnabled(p => p === 'search' ? 'none' : 'search')} className={`text-[10px] px-2 py-1  border transition-colors ${groundingEnabled === 'search' ? 'bg-blue-900/50 border-blue-500 text-blue-300' : 'border-[#333] text-gray-500'}`}>WEB</button>
                    <button onClick={() => setGroundingEnabled(p => p === 'maps' ? 'none' : 'maps')} className={`text-[10px] px-2 py-1  border transition-colors ${groundingEnabled === 'maps' ? 'bg-green-900/50 border-green-500 text-green-300' : 'border-[#333] text-gray-500'}`}>MAPS</button>
                </div>
                <div className="flex gap-2">
                    <input 
                        className="flex-1 bg-[#111] border border-[#333]  px-3 py-2 text-sm text-white focus:border-[#00ff9d] focus:outline-none transition-all focus:bg-[#000]"
                        placeholder="Command or Query..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        autoFocus
                    />
                    <button onClick={handleSend} disabled={loading} className="bg-[#00ff9d] text-black px-4  hover:bg-[#00cc7d] disabled:opacity-50 font-bold transition-colors"><ICONS.Plus /> </button>
                </div>
            </div>
            <style>{`
                .animate-fade-in { animation: fadeIn 0.2s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};