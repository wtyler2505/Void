import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Note, Attachment } from '../types';
import { ICONS } from '../constants';
import * as Gemini from '../services/gemini';

interface EditorProps {
  note: Note;
  allNotes: Note[];
  onUpdate: (updates: Partial<Note>) => void;
  onSelectNote: (id: string) => void;
  onExport: () => void;
  onOpenChat: () => void;
}

export const Editor: React.FC<EditorProps> = ({ note, allNotes, onUpdate, onSelectNote, onExport, onOpenChat }) => {
  const [isThinking, setIsThinking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [showPreview, setShowPreview] = useState(false);
  
  const [showVariants, setShowVariants] = useState(false);
  const [variants, setVariants] = useState<string[]>([]);
  const [variantPrompt, setVariantPrompt] = useState('');

  const [isZenMode, setIsZenMode] = useState(false);
  const zenTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Haunt State
  const [showHauntPanel, setShowHauntPanel] = useState(false);
  const [isHaunting, setIsHaunting] = useState(false);
  const [hauntResults, setHauntResults] = useState<Gemini.RelatedNoteResult[]>([]);

  const [wordGoal, setWordGoal] = useState<number | null>(null);
  const [showGoalInput, setShowGoalInput] = useState(false);
  const [goalInputValue, setGoalInputValue] = useState('');
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState<'work' | 'break'>('work');
  const [pomodoroAlert, setPomodoroAlert] = useState(false);

  const [showLinkSuggest, setShowLinkSuggest] = useState(false);
  const [linkQuery, setLinkQuery] = useState('');
  const [linkSuggestions, setLinkSuggestions] = useState<Note[]>([]);
  const [selectedLinkIndex, setSelectedLinkIndex] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streakTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkboxCounterRef = useRef(0);

  // Auto-resize textarea
  useLayoutEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
    if (zenTextareaRef.current) {
      zenTextareaRef.current.style.height = 'auto';
      zenTextareaRef.current.style.height = `${zenTextareaRef.current.scrollHeight}px`;
    }
  }, [note.content, showPreview, isZenMode]);

  // Update current time every minute for "Last saved" display
  useEffect(() => {
      const interval = setInterval(() => setCurrentTime(Date.now()), 60000);
      return () => clearInterval(interval);
  }, []);

  // Update current time when note updates
  useEffect(() => {
      setCurrentTime(Date.now());
  }, [note.updatedAt]);

  useEffect(() => {
    if (!pomodoroRunning) return;
    const interval = setInterval(() => {
      setPomodoroTime(prev => {
        if (prev <= 1) {
          setPomodoroRunning(false);
          setPomodoroAlert(true);
          setTimeout(() => setPomodoroAlert(false), 3000);
          if (pomodoroMode === 'work') {
            setPomodoroMode('break');
            return 5 * 60;
          } else {
            setPomodoroMode('work');
            return 25 * 60;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [pomodoroRunning, pomodoroMode]);

  // Close Haunt panel when switching notes to avoid confusion
  useEffect(() => {
      if(showHauntPanel) {
          setShowHauntPanel(false);
          setHauntResults([]);
      }
  }, [note.id]);

  // Auto-Title Logic
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

  useEffect(() => {
    const stored = localStorage.getItem(`void_goal_${note.id}`);
    if (stored) {
      setWordGoal(parseInt(stored, 10));
    } else {
      setWordGoal(null);
    }
    setShowGoalInput(false);
  }, [note.id]);

  const getToday = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const loadStreak = () => {
    try {
      const raw = localStorage.getItem('void_writing_streak');
      if (raw) {
        const data = JSON.parse(raw);
        const today = getToday();
        const last = data.lastWriteDate;
        if (last === today) {
          setStreak(data.streak);
          setLongestStreak(data.longestStreak);
        } else {
          const lastDate = new Date(last + 'T00:00:00');
          const todayDate = new Date(today + 'T00:00:00');
          const diff = Math.floor((todayDate.getTime() - lastDate.getTime()) / 86400000);
          if (diff === 1) {
            setStreak(data.streak);
            setLongestStreak(data.longestStreak);
          } else {
            setStreak(0);
            setLongestStreak(data.longestStreak);
          }
        }
      }
    } catch (e) {}
  };

  const updateStreak = () => {
    const today = getToday();
    try {
      const raw = localStorage.getItem('void_writing_streak');
      let data = { lastWriteDate: '', streak: 0, longestStreak: 0 };
      if (raw) data = JSON.parse(raw);
      if (data.lastWriteDate === today) {
        setStreak(data.streak);
        setLongestStreak(data.longestStreak);
        return;
      }
      const lastDate = new Date(data.lastWriteDate + 'T00:00:00');
      const todayDate = new Date(today + 'T00:00:00');
      const diff = data.lastWriteDate ? Math.floor((todayDate.getTime() - lastDate.getTime()) / 86400000) : 0;
      let newStreak = 1;
      if (diff === 1) {
        newStreak = data.streak + 1;
      }
      const newLongest = Math.max(data.longestStreak, newStreak);
      const updated = { lastWriteDate: today, streak: newStreak, longestStreak: newLongest };
      localStorage.setItem('void_writing_streak', JSON.stringify(updated));
      setStreak(newStreak);
      setLongestStreak(newLongest);
    } catch (e) {}
  };

  useEffect(() => {
    loadStreak();
  }, []);

  useEffect(() => {
    if (streakTimeoutRef.current) clearTimeout(streakTimeoutRef.current);
    streakTimeoutRef.current = setTimeout(() => {
      if (note.content.trim().length > 0) {
        updateStreak();
      }
    }, 1000);
    return () => {
      if (streakTimeoutRef.current) clearTimeout(streakTimeoutRef.current);
    };
  }, [note.content]);

  const handleSetGoal = () => {
    const val = parseInt(goalInputValue, 10);
    if (val > 0) {
      setWordGoal(val);
      localStorage.setItem(`void_goal_${note.id}`, String(val));
    } else {
      setWordGoal(null);
      localStorage.removeItem(`void_goal_${note.id}`);
    }
    setShowGoalInput(false);
    setGoalInputValue('');
  };

  const handleClearGoal = () => {
    setWordGoal(null);
    localStorage.removeItem(`void_goal_${note.id}`);
    setShowGoalInput(false);
  };

  const triggerSaveVisual = () => {
    setSaveStatus('saving');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
        setSaveStatus('saved');
    }, 1000); // Syncs roughly with App.tsx debounce
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    triggerSaveVisual();
    onUpdate({ title: e.target.value });
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    triggerSaveVisual();
    const value = e.target.value;
    onUpdate({ content: value });

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastOpen = textBeforeCursor.lastIndexOf('[[');
    const lastClose = textBeforeCursor.lastIndexOf(']]');

    if (lastOpen !== -1 && lastOpen > lastClose) {
      const query = textBeforeCursor.substring(lastOpen + 2);
      setLinkQuery(query);
      const filtered = allNotes
        .filter(n => !n.archived && !n.trashedAt && n.id !== note.id)
        .filter(n => n.title.toLowerCase().includes(query.toLowerCase().trim()))
        .slice(0, 5);
      setLinkSuggestions(filtered);
      setSelectedLinkIndex(0);
      setShowLinkSuggest(true);
    } else {
      setShowLinkSuggest(false);
    }
  };

  const handleLinkKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showLinkSuggest) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedLinkIndex(prev => Math.min(prev + 1, linkSuggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedLinkIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && linkSuggestions.length > 0) {
      e.preventDefault();
      insertLinkSuggestion(linkSuggestions[selectedLinkIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowLinkSuggest(false);
    }
  };

  const insertLinkSuggestion = (selectedNote: Note) => {
    const textarea = textareaRef.current || zenTextareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const content = note.content;
    const textBeforeCursor = content.substring(0, cursorPos);
    const lastOpen = textBeforeCursor.lastIndexOf('[[');

    if (lastOpen === -1) return;

    const before = content.substring(0, lastOpen);
    const after = content.substring(cursorPos);
    const newContent = `${before}[[${selectedNote.title}]]${after}`;

    onUpdate({ content: newContent });
    triggerSaveVisual();
    setShowLinkSuggest(false);

    setTimeout(() => {
      const newPos = lastOpen + selectedNote.title.length + 4;
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const processNoteLinks = useCallback((content: string): string => {
    return content.replace(/\[\[([^\]]+)\]\]/g, (_match, title) => {
      const linked = allNotes.find(n => n.title.toLowerCase() === title.toLowerCase().trim() && !n.archived && !n.trashedAt);
      if (linked) {
        return `[${title}](void://note/${linked.id})`;
      }
      return `~~${title}~~`;
    });
  }, [allNotes]);

  const handleSummarize = async () => {
    setIsProcessing(true);
    setStatusMessage('Summarizing...');
    try {
      const summary = await Gemini.summarizeNote(note.content, isThinking);
      onUpdate({ content: `${note.content}\n\n### AI Summary\n${summary}` });
      triggerSaveVisual();
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
        triggerSaveVisual();
    } catch (e) {} finally {
        setIsProcessing(false);
        setStatusMessage('');
    }
  };

  const handleGenerateImage = async () => {
    let defaultPrompt = note.title;
    if (note.content.length > 10) {
        setIsProcessing(true);
        setStatusMessage("Imagining...");
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
      triggerSaveVisual();
    } catch (e) { alert('Image generation failed.'); } finally { setIsProcessing(false); setStatusMessage(''); }
  };

  const handleVisualize = async () => {
    let defaultPrompt = note.title;
    if (note.content.length > 10) {
        setIsProcessing(true);
        setStatusMessage("Imagining...");
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
      triggerSaveVisual();
      setShowVariants(false);
  };

  const handleGenerateVideo = async () => {
    let defaultPrompt = `Video about ${note.title}`;
    if (note.content.length > 10) {
        setIsProcessing(true);
        setStatusMessage("Writing Script...");
        try { const c = await Gemini.generateImagePrompt(note.content); defaultPrompt = `Video: ${c}`; } catch(e) {}
        setIsProcessing(false);
    }
    const prompt = window.prompt("Video Prompt:", defaultPrompt);
    if (!prompt) return;
    
    const refImage = note.attachments.find(a => a.type === 'image');
    let refBlob: Blob | undefined;
    if (refImage) { try { const res = await fetch(refImage.url); refBlob = await res.blob(); } catch(e) {} }

    setIsProcessing(true);
    setStatusMessage('Rendering Video...');
    try {
      const url = await Gemini.generateVideo(prompt, refBlob);
      onUpdate({ attachments: [...note.attachments, { id: Date.now().toString(), type: 'video', url: url, mimeType: 'video/mp4', metadata: prompt }] });
      triggerSaveVisual();
    } catch (e) { alert('Video failed.'); } finally { setIsProcessing(false); setStatusMessage(''); }
  };

  const handleAnalyzeVideo = async (attachmentId: string, url: string) => {
      setIsProcessing(true); setStatusMessage('Analyzing...');
      try {
          const analysis = await Gemini.analyzeVideo(url);
          const updated = note.attachments.map(a => a.id === attachmentId ? { ...a, metadata: (a.metadata || '') + '\n\n' + analysis } : a);
          onUpdate({ attachments: updated });
          triggerSaveVisual();
      } catch (e) { alert("Analysis failed."); } finally { setIsProcessing(false); setStatusMessage(''); }
  };

  const handleEditImage = async (attachmentId: string, url: string) => {
      const prompt = window.prompt("Edit Instruction:", "Make it look like a sketch");
      if (!prompt) return;
      setIsProcessing(true); setStatusMessage('Editing...');
      try {
          const newUrl = await Gemini.editImage(url, prompt);
          onUpdate({ attachments: [...note.attachments, { id: Date.now().toString(), type: 'image', url: newUrl, mimeType: 'image/png', metadata: `Edit: ${prompt}` }] });
          triggerSaveVisual();
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

  const refreshHaunt = async () => {
      setIsHaunting(true);
      setHauntResults([]);
      try {
          const results = await Gemini.findRelatedNotes(note.id, note.content, allNotes);
          setHauntResults(results);
      } catch(e) {
          console.error(e);
      } finally {
          setIsHaunting(false);
      }
  };

  const toggleHaunt = () => {
      if (showHauntPanel) {
          setShowHauntPanel(false);
      } else {
          setShowHauntPanel(true);
          if (hauntResults.length === 0) {
              refreshHaunt();
          }
      }
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
              triggerSaveVisual();
          } catch (e) {} finally { setIsProcessing(false); setStatusMessage(''); }
        };
        recorder.start();
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
      } catch (e) { console.error("Mic error", e); }
    }
  };

  // Stats Calculations
  const wordCount = note.content.trim().split(/\s+/).filter(Boolean).length;
  const charCount = note.content.length;
  const readTime = Math.ceil(wordCount / 200);

  const checkboxMatches = note.content.match(/^\s*[-*]\s\[([ x])\]/gim) || [];
  const totalChecks = checkboxMatches.length;
  const checkedCount = checkboxMatches.filter(m => /\[x\]/i.test(m)).length;

  const toggleCheckbox = (checkboxIndex: number) => {
    const lines = note.content.split('\n');
    let count = 0;
    const newLines = lines.map(line => {
      const unchecked = /^(\s*[-*]\s)\[ \](.*)$/.exec(line);
      const checked = /^(\s*[-*]\s)\[x\](.*)$/i.exec(line);
      if (unchecked) {
        if (count === checkboxIndex) {
          count++;
          return `${unchecked[1]}[x]${unchecked[2]}`;
        }
        count++;
      } else if (checked) {
        if (count === checkboxIndex) {
          count++;
          return `${checked[1]}[ ]${checked[2]}`;
        }
        count++;
      }
      return line;
    });
    onUpdate({ content: newLines.join('\n') });
    triggerSaveVisual();
  };

  const markdownComponents = {
    a: ({ href, children }: any) => {
      if (href?.startsWith('void://note/')) {
        const noteId = href.replace('void://note/', '');
        return (
          <button
            onClick={(e: React.MouseEvent) => { e.preventDefault(); onSelectNote(noteId); }}
            className="text-[#00ff9d] hover:text-white underline decoration-[#00ff9d]/50 hover:decoration-white cursor-pointer transition-colors font-bold"
          >
            {children}
          </button>
        );
      }
      return <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#00d2ff] hover:text-white underline">{children}</a>;
    },
    input: ({ type, checked, ...props }: any) => {
      if (type === 'checkbox') {
        const idx = checkboxCounterRef.current++;
        return (
          <input
            type="checkbox"
            checked={!!checked}
            onChange={() => toggleCheckbox(idx)}
            className="accent-[#00ff9d] mr-2 cursor-pointer w-4 h-4"
          />
        );
      }
      return <input type={type} {...props} />;
    },
    li: ({ children, className, ...props }: any) => {
      const isTask = className?.includes('task-list-item');
      return (
        <li className={`${isTask ? 'list-none flex items-start gap-1' : ''} ${className || ''}`} {...props}>
          {children}
        </li>
      );
    },
  };
  
  const getSaveStatusText = () => {
      if (saveStatus === 'saving') return 'Saving...';
      const diff = currentTime - note.updatedAt;
      if (diff < 3000) return 'Saved';
      if (diff < 60000) return 'Saved just now';
      const mins = Math.floor(diff / 60000);
      return `Saved ${mins}m ago`;
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] overflow-hidden relative">
      {/* AI Processing Indicator - Smooth Loading Bar */}
      {isProcessing && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-transparent z-50 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00ff9d] to-transparent w-[50%] animate-scan-smooth opacity-75 blur-[1px]"></div>
        </div>
      )}

      {pomodoroAlert && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-[#ff6b6b] text-white px-4 py-2 rounded font-bold text-sm animate-bounce z-50 shadow-lg shadow-red-500/30">
          {pomodoroMode === 'break' ? '☕ Break Time!' : '🔥 Focus Time!'}
        </div>
      )}

      <div className="flex items-center gap-2 p-3 border-b border-[#1a1a1a] bg-[#0a0a0a] overflow-x-auto z-20 no-scrollbar relative">
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
            <button onClick={() => setShowPreview(!showPreview)} className={`p-2 rounded hover:bg-[#1a1a1a] transition-colors ${showPreview ? 'text-[#00ff9d]' : 'text-gray-400'}`} title="Toggle Preview"><ICONS.Columns /></button>
            <button onClick={toggleHaunt} disabled={isProcessing} className={`p-2 rounded hover:bg-[#1a1a1a] transition-colors disabled:opacity-50 ${showHauntPanel ? 'text-[#ff00ff] bg-[#1a051a]' : 'text-gray-400 hover:text-[#ff00ff]'}`} title="Haunt (Find Related)"><ICONS.Ghost /></button>
            <button onClick={() => setIsZenMode(true)} className="p-2 rounded hover:bg-[#1a1a1a] text-gray-400 hover:text-[#00ff9d] transition-colors" title="Focus Mode"><ICONS.Focus /></button>
            <button onClick={() => setPomodoroActive(!pomodoroActive)} className={`p-2 rounded hover:bg-[#1a1a1a] transition-colors ${pomodoroActive ? 'text-[#ff6b6b]' : 'text-gray-400 hover:text-[#ff6b6b]'}`} title="Pomodoro Timer">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </button>
            {pomodoroActive && (
              <div className="flex items-center gap-2 px-3 py-1 bg-[#1a1a1a] border border-[#333] rounded ml-2">
                <span className={`font-mono text-sm font-bold ${pomodoroMode === 'work' ? 'text-[#ff6b6b]' : 'text-[#00ff9d]'}`}>
                  {Math.floor(pomodoroTime / 60).toString().padStart(2, '0')}:{(pomodoroTime % 60).toString().padStart(2, '0')}
                </span>
                <span className="text-[9px] text-gray-500 uppercase">{pomodoroMode}</span>
                <button onClick={() => setPomodoroRunning(!pomodoroRunning)} className="text-xs text-gray-400 hover:text-white px-1">
                  {pomodoroRunning ? '⏸' : '▶'}
                </button>
                <button onClick={() => { setPomodoroRunning(false); setPomodoroTime(pomodoroMode === 'work' ? 25 * 60 : 5 * 60); }} className="text-xs text-gray-400 hover:text-white px-1">↺</button>
              </div>
            )}
            <button onClick={onOpenChat} disabled={isProcessing} className="p-2 rounded hover:bg-[#1a1a1a] text-green-400 hover:text-green-300 disabled:opacity-50" title="Chat Assistant"><ICONS.Chat /></button>
            <button onClick={onExport} disabled={isProcessing} className="p-2 rounded hover:bg-[#1a1a1a] text-gray-400 hover:text-white disabled:opacity-50" title="Export"><ICONS.Download /></button>
        </div>
        
        <div className="flex-1"></div>

        {/* Status Indicator (Top) */}
        <div className="flex items-center gap-2 mr-4 min-w-[80px] justify-end">
            {isProcessing ? (
                <div className="flex items-center gap-2 text-[#00ff9d] text-xs font-mono">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00ff9d] animate-pulse"></div>
                    <span className="hidden md:inline animate-pulse tracking-wide">{statusMessage || 'Processing...'}</span>
                </div>
            ) : saveStatus === 'saving' ? (
                <div className="flex items-center gap-2 text-gray-500 text-xs font-mono transition-opacity duration-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00ff9d] animate-ping"></div>
                    <span className="hidden sm:inline">Saving</span>
                </div>
            ) : (
                <div className="text-[#333] text-[10px] font-mono transition-opacity duration-500 uppercase tracking-widest">
                    Synced
                </div>
            )}
        </div>

        <label className="flex-shrink-0 flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none border border-[#333] px-2 py-1 rounded hover:border-[#00ff9d] transition-colors">
            <input type="checkbox" checked={isThinking} onChange={(e) => setIsThinking(e.target.checked)} className="accent-[#00ff9d]" />
            <span className="hidden md:inline">Thinking</span>
            <span className="md:hidden">Think</span>
        </label>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-4xl mx-auto w-full z-0 relative flex">
        <div className="flex-1 min-w-0">
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
                                <button onClick={() => { onUpdate({ attachments: note.attachments.filter(a => a.id !== att.id) }); triggerSaveVisual(); }} className="bg-red-500/80 p-1 rounded text-white"><ICONS.Close /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className={`flex flex-col md:flex-row gap-6 ${showPreview ? '' : ''}`}>
                <div className={`transition-all duration-300 relative ${showPreview ? 'w-full md:w-1/2' : 'w-full'}`}>
                    <textarea 
                      ref={textareaRef}
                      value={note.content}
                      onChange={handleContentChange}
                      onKeyDown={handleLinkKeyDown}
                      placeholder="Scream into the void..."
                      className="w-full bg-transparent text-base md:text-lg text-gray-300 resize-none focus:outline-none min-h-[50vh] leading-relaxed font-mono pb-20"
                    />
                    {showLinkSuggest && (
                      <div className="absolute z-50 bg-[#111] border border-[#333] rounded shadow-lg max-w-xs w-64 overflow-hidden" style={{ top: '2rem', left: '1rem' }}>
                        {linkSuggestions.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-500 italic">No matches</div>
                        ) : (
                          linkSuggestions.map((s, i) => (
                            <div
                              key={s.id}
                              onClick={() => insertLinkSuggestion(s)}
                              className={`px-3 py-2 text-sm cursor-pointer transition-colors ${i === selectedLinkIndex ? 'bg-[#1a1a1a] text-[#00ff9d]' : 'text-gray-300 hover:bg-[#1a1a1a]'}`}
                            >
                              {s.title}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                </div>
                {showPreview && (
                    <div className="w-full md:w-1/2 min-h-[50vh] border-t md:border-t-0 md:border-l border-[#333] pt-4 md:pt-0 md:pl-6 markdown-preview animate-fade-in">
                        {(() => { checkboxCounterRef.current = 0; return null; })()}
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={markdownComponents}
                        >{processNoteLinks(note.content)}</ReactMarkdown>
                    </div>
                )}
            </div>
        </div>
      </div>
      
      <div className="shrink-0 w-full bg-[#0a0a0a] border-t border-[#1a1a1a] p-2 flex justify-between items-center text-[10px] text-gray-500 font-mono select-none opacity-50 hover:opacity-100 transition-opacity">
          <div className="flex gap-4 items-center">
              <span>{wordCount} words</span>
              <span>{charCount} chars</span>
              <span>{readTime} min read</span>
              <span className="w-[1px] h-3 bg-[#333]"></span>
              {showGoalInput ? (
                <span className="flex items-center gap-1">
                  <input
                    type="number"
                    value={goalInputValue}
                    onChange={(e) => setGoalInputValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSetGoal(); if (e.key === 'Escape') setShowGoalInput(false); }}
                    placeholder="500"
                    autoFocus
                    className="w-12 bg-[#1a1a1a] border border-[#333] rounded px-1 py-0.5 text-[10px] text-gray-300 font-mono focus:outline-none focus:border-[#00ff9d]"
                  />
                  <button onClick={handleSetGoal} className="text-[#00ff9d] hover:text-white">✓</button>
                  {wordGoal && <button onClick={handleClearGoal} className="text-red-500 hover:text-red-400">✕</button>}
                </span>
              ) : (
                <span className="cursor-pointer hover:text-[#00ff9d] transition-colors" onClick={() => { setGoalInputValue(wordGoal ? String(wordGoal) : ''); setShowGoalInput(true); }}>
                  {wordGoal ? `goal: ${wordGoal}` : 'set goal'}
                </span>
              )}
              {wordGoal && !showGoalInput && (
                <>
                  {wordCount >= wordGoal ? (
                    <span className="text-[#00ff9d]">Goal reached!</span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <span className="w-16 h-1 bg-[#333] rounded-full overflow-hidden">
                        <span className="block h-full bg-[#00ff9d] rounded-full transition-all duration-300" style={{ width: `${Math.min(100, (wordCount / wordGoal) * 100)}%` }}></span>
                      </span>
                      <span>{Math.round((wordCount / wordGoal) * 100)}%</span>
                    </span>
                  )}
                </>
              )}
              {totalChecks > 0 && (
                <>
                  <span className="w-[1px] h-3 bg-[#333]"></span>
                  <span className="flex items-center gap-1.5">
                    <span className={checkedCount === totalChecks ? 'text-[#00ff9d]' : ''}>
                      {checkedCount}/{totalChecks} tasks
                    </span>
                    <span className="w-12 h-1 bg-[#333] rounded-full overflow-hidden">
                      <span className="block h-full bg-[#00ff9d] rounded-full transition-all duration-300" style={{ width: `${(checkedCount / totalChecks) * 100}%` }}></span>
                    </span>
                  </span>
                </>
              )}
              {streak > 0 && (
                <>
                  <span className="w-[1px] h-3 bg-[#333]"></span>
                  <span title={`Longest streak: ${longestStreak} days`}>🔥 {streak}</span>
                </>
              )}
          </div>
          <div className="text-right text-[#00ff9d]" title={new Date(note.updatedAt).toLocaleString()}>
              {getSaveStatusText()}
          </div>
      </div>

      {/* Haunt Panel */}
      {showHauntPanel && (
          <div className="absolute top-[53px] right-0 bottom-0 w-80 bg-[#0a050a] border-l border-[#330033] shadow-[-10px_0_30px_rgba(255,0,255,0.1)] transform transition-transform duration-300 overflow-y-auto z-40 animate-fade-in">
              <div className="p-4 border-b border-[#330033] bg-[#1a051a] flex justify-between items-center sticky top-0">
                  <h3 className="text-[#ff00ff] font-bold text-sm tracking-wider flex items-center gap-2"><ICONS.Ghost /> HAUNTED BY</h3>
                  <div className="flex items-center gap-1">
                      <button onClick={refreshHaunt} className="text-gray-500 hover:text-[#ff00ff] p-1" title="Resummon"><ICONS.Scan /></button>
                      <button onClick={() => setShowHauntPanel(false)} className="text-gray-500 hover:text-[#ff00ff] p-1"><ICONS.Close /></button>
                  </div>
              </div>
              <div className="p-4 space-y-4">
                  {isHaunting ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-3 text-[#ff00ff]">
                           <ICONS.Ghost className="animate-bounce" />
                           <span className="text-xs font-mono animate-pulse">Summoning echoes...</span>
                      </div>
                  ) : hauntResults.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-600">
                          <span className="text-2xl opacity-20"><ICONS.Ghost /></span>
                          <span className="text-xs italic">The void is silent.</span>
                          <button onClick={refreshHaunt} className="mt-2 text-[10px] text-[#ff00ff] hover:underline">Try summoning again</button>
                      </div>
                  ) : (
                      hauntResults.map(res => {
                          const targetNote = allNotes.find(n => n.id === res.noteId);
                          if (!targetNote) return null;
                          return (
                              <div 
                                key={res.noteId} 
                                onClick={() => onSelectNote(res.noteId)}
                                className="group p-3 rounded bg-[#1a051a] border border-[#330033] hover:border-[#ff00ff] cursor-pointer transition-all hover:bg-[#2a0a2a]"
                              >
                                  <div className="flex justify-between items-start mb-1">
                                      <h4 className="font-bold text-gray-300 group-hover:text-[#ff00ff] text-sm truncate">{targetNote.title || 'Untitled'}</h4>
                                      <span className="text-[10px] text-[#ff00ff] opacity-60 font-mono">{res.relevanceScore}%</span>
                                  </div>
                                  <p className="text-gray-500 text-xs line-clamp-2 mb-2 italic">"{targetNote.content.substring(0, 100)}..."</p>
                                  <div className="text-[10px] text-[#ff00ff] border-t border-[#330033] pt-2 mt-2 leading-tight">
                                      <span className="opacity-50 uppercase mr-1">Link:</span>
                                      {res.reason}
                                  </div>
                              </div>
                          );
                      })
                  )}
              </div>
          </div>
      )}

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
      {isZenMode && (
          <div className="fixed inset-0 z-[100] bg-[#030303] flex flex-col animate-zen-fade-in">
              <button
                onClick={() => setIsZenMode(false)}
                className="fixed top-4 right-4 z-[101] px-3 py-1.5 rounded text-[10px] font-mono uppercase tracking-widest text-gray-600 hover:text-[#00ff9d] border border-[#1a1a1a] hover:border-[#00ff9d] bg-[#0a0a0a] transition-all"
              >
                Exit Focus
              </button>
              <div className="flex-1 overflow-y-auto p-4 md:p-8">
                  <div className="max-w-[700px] mx-auto w-full">
                      <input
                        type="text"
                        value={note.title}
                        onChange={handleTitleChange}
                        placeholder="Void Entry"
                        className="w-full bg-transparent text-2xl md:text-4xl font-bold text-white focus:outline-none placeholder-gray-700 font-mono mb-6"
                      />
                      <div className="relative">
                        <textarea
                          ref={zenTextareaRef}
                          value={note.content}
                          onChange={handleContentChange}
                          onKeyDown={handleLinkKeyDown}
                          placeholder="Scream into the void..."
                          className="w-full bg-transparent text-base md:text-lg text-gray-300 resize-none focus:outline-none min-h-[70vh] leading-relaxed font-mono pb-20"
                        />
                        {showLinkSuggest && (
                          <div className="absolute z-50 bg-[#111] border border-[#333] rounded shadow-lg max-w-xs w-64 overflow-hidden" style={{ top: '2rem', left: '1rem' }}>
                            {linkSuggestions.length === 0 ? (
                              <div className="px-3 py-2 text-sm text-gray-500 italic">No matches</div>
                            ) : (
                              linkSuggestions.map((s, i) => (
                                <div
                                  key={s.id}
                                  onClick={() => insertLinkSuggestion(s)}
                                  className={`px-3 py-2 text-sm cursor-pointer transition-colors ${i === selectedLinkIndex ? 'bg-[#1a1a1a] text-[#00ff9d]' : 'text-gray-300 hover:bg-[#1a1a1a]'}`}
                                >
                                  {s.title}
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                  </div>
              </div>
              <div className="shrink-0 w-full p-3 flex justify-center">
                  <span className="text-[10px] text-gray-600 font-mono">{wordCount} words</span>
              </div>
          </div>
      )}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; } 
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes scan-smooth {
            0% { left: -50%; }
            100% { left: 100%; }
        }
        .animate-scan-smooth {
            animation: scan-smooth 1.5s infinite linear;
        }
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes zenFadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-zen-fade-in { animation: zenFadeIn 0.5s ease-out; }
      `}</style>
    </div>
  );
};