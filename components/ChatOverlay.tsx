import React, { useState, useEffect, useRef } from 'react';
import { ICONS } from '../constants';
import { Note, ChatMessage } from '../types';
import * as Gemini from '../services/gemini';

interface ChatOverlayProps {
    onClose: () => void;
    contextNote: Note | null;
    notes: Note[];
}

export const ChatOverlay: React.FC<ChatOverlayProps> = ({ onClose, contextNote, notes }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: '1', role: 'model', text: 'System ready. How can I assist?', timestamp: Date.now() }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [groundingEnabled, setGroundingEnabled] = useState<'none' | 'search' | 'maps'>('none');
    const [location, setLocation] = useState<{lat: number, lng: number} | undefined>(undefined);
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

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

        try {
            let contextText = "";
            if (contextNote) {
                contextText += `=== ACTIVE NOTE ===\nTitle: ${contextNote.title}\nContent: ${contextNote.content}\n\n`;
            }
            contextText += `=== VAULT SUMMARY (${notes.length}) ===\n`;
            contextText += notes.map(n => `- ${n.title}: ${n.content.substring(0, 50)}...`).join('\n');
            
            const history = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
            const result = await Gemini.chatWithContext(history, userMsg.text, contextText, groundingEnabled, location);
            
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: result.text, timestamp: Date.now() }]);
            if (result.groundingChunks?.length) {
                 const sources = result.groundingChunks.map(c => c.web?.uri || c.maps?.uri).filter(Boolean).join('\n');
                 if (sources) setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: `Sources:\n${sources}`, timestamp: Date.now() }]);
            }
        } catch (e) {
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Connection Error.", timestamp: Date.now() }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0a] md:absolute md:inset-auto md:right-4 md:bottom-4 md:w-96 md:h-[600px] md:border md:border-[#00ff9d] md:shadow-[0_0_20px_rgba(0,255,157,0.2)] md:rounded-lg">
            <div className="p-3 border-b border-[#333] flex justify-between items-center bg-[#050505] shrink-0">
                <span className="text-[#00ff9d] font-bold text-sm tracking-wider flex items-center gap-2">
                    <ICONS.Sparkle /> VOID LINK
                </span>
                <button onClick={onClose} className="text-gray-500 hover:text-white p-2"><ICONS.Close /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(m => (
                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded text-sm ${
                            m.role === 'user' 
                            ? 'bg-[#1a1a1a] text-white border border-[#333]' 
                            : 'bg-[#002b1f] text-[#00ff9d] border border-[#005c3d]'
                        }`}>
                            <pre className="whitespace-pre-wrap font-mono font-sans">{m.text}</pre>
                        </div>
                    </div>
                ))}
                {loading && <div className="text-[#00ff9d] text-xs animate-pulse">Computing...</div>}
                <div ref={endRef}></div>
            </div>

            <div className="p-3 border-t border-[#333] bg-[#050505] shrink-0">
                <div className="flex gap-2 mb-2">
                     <button onClick={() => setGroundingEnabled(p => p === 'search' ? 'none' : 'search')} className={`text-[10px] px-2 py-1 rounded border ${groundingEnabled === 'search' ? 'bg-blue-900 border-blue-500 text-blue-300' : 'border-[#333] text-gray-500'}`}>Web</button>
                    <button onClick={() => setGroundingEnabled(p => p === 'maps' ? 'none' : 'maps')} className={`text-[10px] px-2 py-1 rounded border ${groundingEnabled === 'maps' ? 'bg-green-900 border-green-500 text-green-300' : 'border-[#333] text-gray-500'}`}>Maps</button>
                </div>
                <div className="flex gap-2">
                    <input 
                        className="flex-1 bg-[#111] border border-[#333] rounded px-3 py-2 text-sm text-white focus:border-[#00ff9d] focus:outline-none"
                        placeholder="Ask..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button onClick={handleSend} disabled={loading} className="bg-[#00ff9d] text-black px-3 rounded hover:bg-[#00cc7d] disabled:opacity-50"><ICONS.Plus /> </button>
                </div>
            </div>
        </div>
    );
};