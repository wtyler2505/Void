import React, { useState, useRef, useEffect } from 'react';
import { Note, Attachment } from '../types';
import { ICONS } from '../constants';
import * as Gemini from '../services/gemini';

interface EditorProps {
  note: Note;
  onUpdate: (updates: Partial<Note>) => void;
}

export const Editor: React.FC<EditorProps> = ({ note, onUpdate }) => {
  const [isThinking, setIsThinking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  const [showVariants, setShowVariants] = useState(false);
  const [variants, setVariants] = useState<string[]>([]);
  const [variantPrompt, setVariantPrompt] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [note.content]);

  useEffect(() => {
    const timer = setTimeout(async () => {
        const isUntitled = note.title === 'Void Entry' || !note.title.trim();
        const hasContent = note.content.length > 30;

        if (isUntitled && hasContent && !isProcessing) {
             try {
                const newTitle = await Gemini.generateTitle(note.content);
                if (newTitle && newTitle !== "Void Entry") {
                    onUpdate({ title: newTitle });
                }
            } catch (e) { console.error("Auto-title failed", e); }
        }
    }, 2000); 
    return () => clearTimeout(timer);
  }, [note.content, note.title, isProcessing, onUpdate]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ title: e.target.value });
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({ content: e.target.value });
  };

  const handleSummarize = async () => {
    setIsProcessing(true);
    setStatusMessage('Summarizing...');
    try {
      const summary = await Gemini.summarizeNote(note.content, isThinking);
      onUpdate({ content: `${note.content}\n\n### AI Summary\n${summary}` });
    } catch (e) {
      alert('Failed to summarize');
    } finally {
      setIsProcessing(false);
      setStatusMessage('');
    }
  };

  const handleFastEnhance = async () => {
    setIsProcessing(true);
    setStatusMessage('Enhancing...');
    try {
        const enhanced = await Gemini.fastEnhance(note.content);
        onUpdate({ content: enhanced });
    } catch (e) {} finally {
        setIsProcessing(false);
        setStatusMessage('');
    }
  };

  const handleGenerateImage = async () => {
    let defaultPrompt = note.title;
    if (note.content.length > 10) {
        setIsProcessing(true);
        setStatusMessage("Hallucinating...");
        try { defaultPrompt = await Gemini.generateImagePrompt(note.content); } catch(e) {}
        setIsProcessing(false);
    }

    const prompt = window.prompt("Image Prompt:", defaultPrompt);
    if (!prompt) return;
    
    setIsProcessing(true);
    setStatusMessage('Generating Image...');
    try {
      const b64 = await Gemini.generateImage(prompt, "16:9");
      const newAttachment: Attachment = { id: Date.now().toString(), type: 'image', url: b64, mimeType: 'image/png', metadata: prompt };
      onUpdate({ attachments: [...note.attachments, newAttachment] });
    } catch (e) { alert('Image generation failed.'); } finally { setIsProcessing(false); setStatusMessage(''); }
  };

  const handleVisualize = async () => {
    let defaultPrompt = note.title;
    if (note.content.length > 10) {
        setIsProcessing(true);
        setStatusMessage("Hallucinating...");
        try { defaultPrompt = await Gemini.generateImagePrompt(note.content); } catch(e) {}
        setIsProcessing(false);
    }

    const prompt = window.prompt("Visualize Scene:", defaultPrompt);
    if (!prompt) return;
    setVariantPrompt(prompt);
    
    setIsProcessing(true);
    setStatusMessage('Dreaming...');
    setVariants([]); setShowVariants(true);

    try {
        const results = await Promise.all([
            Gemini.generateImage(`${prompt}, photorealistic`, "1:1"),
            Gemini.generateImage(`${prompt}, cyberpunk`, "16:9"),
            Gemini.generateImage(`${prompt}, minimal`, "9:16")
        ]);
        setVariants(results);
    } catch (e) { setShowVariants(false); } finally { setIsProcessing(false); setStatusMessage(''); }
  };

  const handleSelectVariant = (url: string) => {
      const newAttachment: Attachment = { id: Date.now().toString(), type: 'image', url: url, mimeType: 'image/png', metadata: `Visualized: ${variantPrompt}` };
      onUpdate({ attachments: [...note.attachments, newAttachment] });
      setShowVariants(false);
  };

  const handleGenerateVideo = async () => {
    let defaultPrompt = `Video about ${note.title}`;
    if (note.content.length > 10) {
        setIsProcessing(true);
        setStatusMessage("Hallucinating...");
        try { const c = await Gemini.generateImagePrompt(note.content); defaultPrompt = `Video: ${c}`; } catch(e) {}
        setIsProcessing(false);
    }
    const prompt = window.prompt("Video Prompt:", defaultPrompt);
    if (!prompt) return;
    
    const refImage = note.attachments.find(a => a.type === 'image');
    let refBlob: Blob | undefined;
    if (refImage) { try { const res = await fetch(refImage.url); refBlob = await res.blob(); } catch(e) {} }

    setIsProcessing(true);
    setStatusMessage('Generating Video...');
    try {
      const url = await Gemini.generateVideo(prompt, refBlob);
      onUpdate({ attachments: [...note.attachments, { id: Date.now().toString(), type: 'video', url: url, mimeType: 'video/mp4', metadata: prompt }] });
    } catch (e) { alert('Video failed.'); } finally { setIsProcessing(false); setStatusMessage(''); }
  };

  const handleAnalyzeVideo = async (attachmentId: string, url: string) => {
      setIsProcessing(true); setStatusMessage('Analyzing...');
      try {
          const analysis = await Gemini.analyzeVideo(url);
          const updated = note.attachments.map(a => a.id === attachmentId ? { ...a, metadata: (a.metadata || '') + '\n\n' + analysis } : a);
          onUpdate({ attachments: updated });
      } catch (e) { alert("Analysis failed."); } finally { setIsProcessing(false); setStatusMessage(''); }
  };

  const handleEditImage = async (attachmentId: string, url: string) => {
      const prompt = window.prompt("Edit Instruction:", "Make it look like a sketch");
      if (!prompt) return;
      setIsProcessing(true); setStatusMessage('Editing...');
      try {
          const newUrl = await Gemini.editImage(url, prompt);
          onUpdate({ attachments: [...note.attachments, { id: Date.now().toString(), type: 'image', url: newUrl, mimeType: 'image/png', metadata: `Edit: ${prompt}` }] });
      } catch (e) { alert("Edit failed."); } finally { setIsProcessing(false); setStatusMessage(''); }
  };

  const handleTTS = async () => {
    if (!note.content) return;
    setIsProcessing(true); setStatusMessage('Speaking...');
    try {
      const buffer = await Gemini.textToSpeech(note.content.substring(0, 500));
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const audioBuffer = await ctx.decodeAudioData(buffer);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();
    } catch (e) { console.error(e); alert('TTS Failed'); } finally { setIsProcessing(false); setStatusMessage(''); }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const chunks: BlobPart[] = [];
        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = async () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          setAudioBlob(blob);
          setIsProcessing(true); setStatusMessage('Transcribing...');
          try {
              const text = await Gemini.transcribeAudio(blob);
              onUpdate({ content: (note.content ? note.content + '\n\n' : '') + text });
          } catch (e) {} finally { setIsProcessing(false); setStatusMessage(''); }
        };
        recorder.start();
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
      } catch (e) { console.error("Mic error", e); }
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] overflow-hidden relative">
      <div className="flex items-center gap-2 p-3 border-b border-[#1a1a1a] bg-[#0a0a0a] overflow-x-auto z-20 no-scrollbar">
         <button onClick={toggleRecording} className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-[#1a1a1a] text-gray-400 hover:text-[#00ff9d] border border-[#333]'}`}>
          <ICONS.Mic /> {isRecording ? 'STOP' : 'REC'}
        </button>
        <div className="w-[1px] h-6 bg-[#333] mx-1"></div>
        <div className="flex gap-1">
            <button onClick={handleSummarize} disabled={isProcessing} className="p-2 rounded hover:bg-[#1a1a1a] text-[#00ff9d] disabled:opacity-50"><ICONS.Brain /></button>
            <button onClick={handleFastEnhance} disabled={isProcessing} className="p-2 rounded hover:bg-[#1a1a1a] text-[#00d2ff] disabled:opacity-50"><ICONS.Bolt /></button>
            <button onClick={handleVisualize} disabled={isProcessing} className="p-2 rounded hover:bg-[#1a1a1a] text-yellow-400 disabled:opacity-50"><ICONS.Eye /></button>
            <button onClick={handleGenerateVideo} disabled={isProcessing} className="p-2 rounded hover:bg-[#1a1a1a] text-purple-400 disabled:opacity-50"><ICONS.Video /></button>
            <button onClick={handleTTS} disabled={isProcessing} className="p-2 rounded hover:bg-[#1a1a1a] text-pink-400 disabled:opacity-50"><ICONS.Speaker /></button>
        </div>
        <div className="flex-1"></div>
        <label className="flex-shrink-0 flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none border border-[#333] px-2 py-1 rounded">
            <input type="checkbox" checked={isThinking} onChange={(e) => setIsThinking(e.target.checked)} className="accent-[#00ff9d]" />
            <span className="hidden md:inline">Thinking</span>
            <span className="md:hidden">Think</span>
        </label>
      </div>
      
      {isProcessing && (
        <div className="absolute top-0 left-0 w-full z-50 pointer-events-none">
           <div className="h-[2px] w-full bg-[#1a1a1a] overflow-hidden">
             <div className="h-full bg-[#00ff9d] animate-indeterminate-progress origin-left shadow-[0_0_8px_#00ff9d]"></div>
           </div>
           <div className="absolute top-4 right-4 md:right-6 flex items-center gap-3 bg-[#0a0a0a]/90 border border-[#00ff9d]/30 px-4 py-2 rounded-full backdrop-blur-md shadow-lg animate-fade-in-down">
             <div className="flex gap-1 h-2 items-center">
                <div className="w-1.5 h-1.5 bg-[#00ff9d] rounded-full animate-[bounce_1s_infinite_-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-[#00ff9d] rounded-full animate-[bounce_1s_infinite_-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-[#00ff9d] rounded-full animate-[bounce_1s_infinite]"></div>
             </div>
             <span className="text-[#00ff9d] text-xs font-mono font-bold">{statusMessage || 'Processing'}</span>
           </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-4xl mx-auto w-full z-0 relative">
        <div className="flex items-center gap-2 mb-4 md:mb-6">
            <input 
              type="text" 
              value={note.title} 
              onChange={handleTitleChange}
              placeholder="Void Entry" 
              className="flex-1 bg-transparent text-2xl md:text-4xl font-bold text-white focus:outline-none placeholder-gray-700 font-mono"
            />
        </div>

        {note.attachments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 md:mb-8">
                {note.attachments.map(att => (
                    <div key={att.id} className="relative group border border-[#333] rounded overflow-hidden bg-[#111]">
                        {att.type === 'image' && <img src={att.url} className="w-full h-48 md:h-40 object-cover" />}
                        {att.type === 'video' && <video src={att.url} controls className="w-full h-48 md:h-40 object-cover" />}
                        <div className="absolute top-1 right-1 flex gap-1">
                            {att.type === 'image' && <button onClick={() => handleEditImage(att.id, att.url)} className="bg-black/50 p-1 rounded text-white"><ICONS.Wand /></button>}
                            {att.type === 'video' && <button onClick={() => handleAnalyzeVideo(att.id, att.url)} className="bg-black/50 p-1 rounded text-white"><ICONS.Scan /></button>}
                            <button onClick={() => onUpdate({ attachments: note.attachments.filter(a => a.id !== att.id) })} className="bg-red-500/80 p-1 rounded text-white"><ICONS.Close /></button>
                        </div>
                    </div>
                ))}
            </div>
        )}

        <textarea 
          ref={textareaRef}
          value={note.content}
          onChange={handleContentChange}
          placeholder="Scream into the void..."
          className="w-full bg-transparent text-base md:text-lg text-gray-300 resize-none focus:outline-none min-h-[50vh] leading-relaxed font-mono pb-20"
        />
      </div>

      {showVariants && (
          <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
              <h3 className="text-[#00ff9d] text-xl font-bold mb-4 flex items-center gap-2"><ICONS.Eye /> Select Variant</h3>
              <div className="flex gap-4 w-full overflow-x-auto pb-4 px-2 snap-x">
                {variants.length === 0 ? (
                    <div className="w-full text-center text-gray-500 py-10 animate-pulse">Generating Lattice...</div>
                ) : (
                    variants.map((v, i) => (
                        <div key={i} className="snap-center shrink-0 flex flex-col gap-2 cursor-pointer w-[70vw] md:w-[200px]" onClick={() => handleSelectVariant(v)}>
                            <img src={v} className="rounded border border-[#333] w-full" />
                        </div>
                    ))
                )}
              </div>
              <button onClick={() => setShowVariants(false)} className="mt-4 text-gray-400">Cancel</button>
          </div>
      )}
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
};