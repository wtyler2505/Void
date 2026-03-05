import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import markup from 'react-syntax-highlighter/dist/esm/languages/prism/markup';
import { Note, Attachment, NoteVersion } from '../types';
import { ICONS } from '../constants';
import * as Gemini from '../services/gemini';
import { loadNoteVersions } from '../services/store';
import { useTheme } from '../ThemeContext';

SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('js', javascript);
SyntaxHighlighter.registerLanguage('jsx', jsx);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('ts', typescript);
SyntaxHighlighter.registerLanguage('tsx', tsx);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('sh', bash);
SyntaxHighlighter.registerLanguage('shell', bash);
SyntaxHighlighter.registerLanguage('markdown', markdown);
SyntaxHighlighter.registerLanguage('md', markdown);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('html', markup);
SyntaxHighlighter.registerLanguage('xml', markup);

interface EditorProps {
  note: Note;
  allNotes: Note[];
  onUpdate: (updates: Partial<Note>) => void;
  onSelectNote: (id: string) => void;
  onExport: () => void;
  onOpenChat: () => void;
  onSplitNote?: (id: string) => void;
  splitNoteId?: string | null;
  folders?: { id: string; name: string }[];
}

export const Editor: React.FC<EditorProps> = ({ note, allNotes, onUpdate, onSelectNote, onExport, onOpenChat, onSplitNote, splitNoteId, folders }) => {
  const { isDark } = useTheme();
  const [isThinking, setIsThinking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [showPreview, setShowPreview] = useState(false);
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  
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

  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [selectedSlashIndex, setSelectedSlashIndex] = useState(0);

  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState<NoteVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<NoteVersion | null>(null);

  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');

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

  useEffect(() => {
      if(showHauntPanel) {
          setShowHauntPanel(false);
          setHauntResults([]);
      }
      if(showVersions) {
          setShowVersions(false);
          setVersions([]);
          setSelectedVersion(null);
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

    const currentLine = textBeforeCursor.split('\n').pop() || '';
    if (currentLine.startsWith('/') && !showLinkSuggest) {
      const query = currentLine.substring(1).toLowerCase();
      setSlashQuery(query);
      setShowSlashMenu(true);
      setSelectedSlashIndex(0);
    } else {
      setShowSlashMenu(false);
    }
  };

  const handleLinkKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSlashMenu && filteredSlashCommands.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSlashIndex(prev => Math.min(prev + 1, filteredSlashCommands.length - 1));
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSlashIndex(prev => Math.max(prev - 1, 0));
        return;
      } else if (e.key === 'Enter') {
        e.preventDefault();
        insertSlashCommand(filteredSlashCommands[selectedSlashIndex]);
        return;
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowSlashMenu(false);
        return;
      }
    }

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

  const SLASH_COMMANDS = [
    { id: 'h1', label: 'Heading 1', icon: 'H1', insert: '# ' },
    { id: 'h2', label: 'Heading 2', icon: 'H2', insert: '## ' },
    { id: 'h3', label: 'Heading 3', icon: 'H3', insert: '### ' },
    { id: 'bullet', label: 'Bullet List', icon: '•', insert: '- ' },
    { id: 'numbered', label: 'Numbered List', icon: '1.', insert: '1. ' },
    { id: 'checklist', label: 'Checklist', icon: '☑', insert: '- [ ] ' },
    { id: 'code', label: 'Code Block', icon: '<>', insert: '```\n\n```' },
    { id: 'quote', label: 'Blockquote', icon: '❝', insert: '> ' },
    { id: 'divider', label: 'Divider', icon: '—', insert: '---\n' },
    { id: 'table', label: 'Table', icon: '⊞', insert: '\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n' },
    { id: 'image', label: 'Image', icon: '🖼', insert: '![Alt text](url)' },
    { id: 'link', label: 'Link', icon: '🔗', insert: '[Link text](url)' },
  ];

  const filteredSlashCommands = SLASH_COMMANDS.filter(cmd =>
    cmd.label.toLowerCase().includes(slashQuery) || cmd.id.includes(slashQuery)
  );

  const insertSlashCommand = (command: typeof SLASH_COMMANDS[0]) => {
    const textarea = textareaRef.current || zenTextareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const content = note.content;
    const textBeforeCursor = content.substring(0, cursorPos);
    const lineStart = textBeforeCursor.lastIndexOf('\n') + 1;
    const textAfterCursor = content.substring(cursorPos);

    const newContent = content.substring(0, lineStart) + command.insert + textAfterCursor;
    onUpdate({ content: newContent });
    triggerSaveVisual();
    setShowSlashMenu(false);

    setTimeout(() => {
      const ref = textareaRef.current || zenTextareaRef.current;
      if (ref) {
        const newPos = lineStart + command.insert.length;
        const codeBlockOffset = command.id === 'code' ? -4 : 0;
        ref.selectionStart = newPos + codeBlockOffset;
        ref.selectionEnd = newPos + codeBlockOffset;
        ref.focus();
      }
    }, 0);
  };

  const processNoteLinks = useCallback((content: string): string => {
    let processed = content.replace(/\[\[([^\]]+)\]\]/g, (_match, title) => {
      const linked = allNotes.find(n => n.title.toLowerCase() === title.toLowerCase().trim() && !n.archived && !n.trashedAt);
      if (linked) {
        return `[${title}](void://note/${linked.id})`;
      }
      return `~~${title}~~`;
    });
    processed = processed.replace(/\[\^(\w+)\](?!:)/g, '**^$1**');
    return processed;
  }, [allNotes]);

  const backlinks = useMemo(() => {
    const currentTitle = note.title.trim();
    if (!currentTitle) return [];

    const escapedTitle = currentTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const backlinkPattern = new RegExp(`\\[\\[\\s*${escapedTitle}\\s*\\]\\]`, 'i');

    return allNotes.filter(n => (
      n.id !== note.id &&
      !n.archived &&
      !n.trashedAt &&
      backlinkPattern.test(n.content)
    ));
  }, [allNotes, note.id, note.title]);

  const normalizeTag = (tag: string): string => {
    return tag.trim().replace(/^#/, '').toLowerCase().replace(/\s+/g, '-');
  };

  const handleAutoTag = async () => {
    if (!note.title.trim() && !note.content.trim()) return;

    setIsProcessing(true);
    setStatusMessage('Tagging...');
    try {
      const suggestions = await Gemini.suggestTagsForNote(note.title, note.content, note.tags);
      if (suggestions.length === 0) {
        alert('No new tags suggested.');
        return;
      }

      const mergedTags = [...note.tags];
      const existing = new Set(note.tags.map(normalizeTag).filter(Boolean));
      let added = 0;

      for (const suggestion of suggestions) {
        const clean = normalizeTag(suggestion);
        if (!clean || existing.has(clean)) continue;
        mergedTags.push(clean);
        existing.add(clean);
        added += 1;
      }

      if (added === 0) {
        alert('Suggested tags are already applied.');
        return;
      }

      onUpdate({ tags: mergedTags });
      triggerSaveVisual();
    } catch (e) {
      alert('Auto-tagging failed.');
    } finally {
      setIsProcessing(false);
      setStatusMessage('');
    }
  };

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
    h1: ({ children }: any) => (
      <h1 className="text-2xl font-bold text-white mt-6 mb-3 pb-2 border-b border-[#333]">{children}</h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-xl font-bold text-[#00ff9d] mt-6 mb-2 pb-1 border-b border-[#1a1a1a] flex items-center gap-2">
        <span className="text-[10px] text-[#00ff9d]/50">§</span>
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-lg font-bold text-[#00d2ff] mt-4 mb-1 flex items-center gap-2">
        <span className="text-[10px] text-[#00d2ff]/50">›</span>
        {children}
      </h3>
    ),
    code: ({ inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      if (!inline && match) {
        return (
          <SyntaxHighlighter
            style={vscDarkPlus}
            language={match[1]}
            PreTag="div"
            customStyle={{
              background: '#0a0a0a',
              border: '1px solid #1a1a1a',
              borderRadius: '0.5rem',
              padding: '1rem',
              margin: '1rem 0',
              fontSize: '0.875rem',
            }}
            codeTagProps={{
              style: { fontFamily: "'JetBrains Mono', monospace" }
            }}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        );
      }
      if (!inline) {
        return (
          <pre className="bg-[#0a0a0a] border border-[#1a1a1a]  p-4 overflow-x-auto my-4">
            <code className={`text-sm font-mono text-gray-300 ${className || ''}`} {...props}>{children}</code>
          </pre>
        );
      }
      return <code className="bg-[#1a1a1a] text-[#ff6b6b] px-1.5 py-0.5  text-sm font-mono" {...props}>{children}</code>;
    },
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-2 border-[#00ff9d]/30 pl-4 my-4 text-gray-400 italic">{children}</blockquote>
    ),
    hr: () => <hr className="border-[#1a1a1a] my-6" />,
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
      const childText = Array.isArray(children) ? children.join('') : String(children || '');
      const isBareUrl = href && (childText === href || childText === href.replace(/\/$/, ''));
      if (isBareUrl && href.match(/^https?:\/\//)) {
        try {
          const domain = new URL(href).hostname.replace('www.', '');
          const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="link-card"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                border: `1px solid ${isDark ? '#333' : '#ddd'}`,
                textDecoration: 'none',
                color: isDark ? '#00ff9d' : '#059669',
                fontSize: '0.8em',
                margin: '2px 0',
                transition: 'all 0.2s',
                maxWidth: '100%',
                overflow: 'hidden',
                borderRadius: '0',
              }}
            >
              <img src={favicon} width="14" height="14" style={{ flexShrink: 0 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{domain}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          );
        } catch {
          return <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: isDark ? '#00ff9d' : '#059669' }}>{href}</a>;
        }
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
    p: ({ children }: any) => {
      const text = typeof children === 'string' ? children : '';
      const footnoteMatch = /^\[\^(\w+)\]:\s*(.+)$/.exec(text);
      if (footnoteMatch) {
        return (
          <p className="text-xs text-gray-500 border-l-2 border-[#ffd93d]/30 pl-3 my-1 italic">
            <span className="text-[#ffd93d] font-bold mr-1">[{footnoteMatch[1]}]</span>
            {footnoteMatch[2]}
          </p>
        );
      }
      return <p className="my-2 leading-relaxed">{children}</p>;
    },
    strong: ({ children }: any) => {
      const text = typeof children === 'string' ? children : Array.isArray(children) ? children.join('') : '';
      const footnoteRef = /^\^(\w+)$/.exec(text);
      if (footnoteRef) {
        return <sup className="text-[#ffd93d] text-[10px] cursor-pointer hover:text-white transition-colors">[{footnoteRef[1]}]</sup>;
      }
      return <strong className="text-white font-bold">{children}</strong>;
    },
    table: ({ children }: any) => (
      <table className="w-full border-collapse my-4" style={{ border: `1px solid ${isDark ? '#333' : '#ddd'}` }}>{children}</table>
    ),
    thead: ({ children }: any) => (
      <thead style={{ background: isDark ? '#1a1a1a' : '#f3f4f6' }}>{children}</thead>
    ),
    tbody: ({ children }: any) => (
      <tbody>{children}</tbody>
    ),
    tr: ({ children }: any) => (
      <tr style={{ borderBottom: `1px solid ${isDark ? '#333' : '#ddd'}` }}>{children}</tr>
    ),
    th: ({ children }: any) => (
      <th style={{ border: `1px solid ${isDark ? '#333' : '#ddd'}`, padding: '8px 12px', textAlign: 'left', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: isDark ? '#00ff9d' : '#333' }}>{children}</th>
    ),
    td: ({ children }: any) => (
      <td style={{ border: `1px solid ${isDark ? '#333' : '#ddd'}`, padding: '8px 12px', textAlign: 'left', color: isDark ? '#ccc' : '#333' }}>{children}</td>
    ),
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
    <div className={`flex flex-col h-full ${isDark ? 'bg-[#050505]' : 'bg-[#f5f5f0]'} overflow-hidden relative`}>
      {/* AI Processing Indicator - Smooth Loading Bar */}
      {isProcessing && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-transparent z-50 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00ff9d] to-transparent w-[50%] animate-scan-smooth opacity-75 blur-[1px]"></div>
        </div>
      )}

      {pomodoroAlert && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-[#ff6b6b] text-white px-4 py-2  font-bold text-sm animate-bounce z-50 shadow-lg shadow-red-500/30">
          {pomodoroMode === 'break' ? '☕ Break Time!' : '🔥 Focus Time!'}
        </div>
      )}

      <div role="toolbar" aria-label="Editor toolbar" className={`flex items-center gap-2 p-3 border-b ${isDark ? 'border-[#1a1a1a] bg-[#0a0a0a]' : 'border-gray-200 bg-white'} overflow-x-auto z-20 no-scrollbar relative`}>
         <button onClick={toggleRecording} aria-label={isRecording ? 'Stop recording' : 'Start recording'} className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5  text-xs font-bold uppercase tracking-wider transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : `${isDark ? 'bg-[#1a1a1a] border-[#333]' : 'bg-gray-100 border-gray-300'} text-gray-400 hover:text-[#00ff9d] border`}`}>
          <ICONS.Mic /> {isRecording ? 'STOP' : 'REC'}
        </button>
        <div className={`w-[1px] h-6 ${isDark ? 'bg-[#333]' : 'bg-gray-300'} mx-1`}></div>
        <div className="flex gap-1">
            <button onClick={handleSummarize} disabled={isProcessing} aria-label="Summarize" className={`p-2  ${isDark ? 'hover:bg-[#1a1a1a]' : 'hover:bg-gray-100'} text-[#00ff9d] disabled:opacity-50`}><ICONS.Brain /></button>
            <button onClick={handleFastEnhance} disabled={isProcessing} aria-label="AI enhance" className={`p-2  ${isDark ? 'hover:bg-[#1a1a1a]' : 'hover:bg-gray-100'} text-[#00d2ff] disabled:opacity-50`}><ICONS.Bolt /></button>
            <button onClick={handleAutoTag} disabled={isProcessing} aria-label="Auto-tag note" className={`p-2  ${isDark ? 'hover:bg-[#1a1a1a]' : 'hover:bg-gray-100'} text-[#54a0ff] disabled:opacity-50`} title="Auto Tag"><ICONS.Sparkle /></button>
            <button onClick={handleVisualize} disabled={isProcessing} aria-label="Visualize" className={`p-2  ${isDark ? 'hover:bg-[#1a1a1a]' : 'hover:bg-gray-100'} text-yellow-400 disabled:opacity-50`}><ICONS.Eye /></button>
            <button onClick={handleGenerateVideo} disabled={isProcessing} aria-label="Generate video" className={`p-2  ${isDark ? 'hover:bg-[#1a1a1a]' : 'hover:bg-gray-100'} text-purple-400 disabled:opacity-50`}><ICONS.Video /></button>
            <button onClick={handleTTS} disabled={isProcessing} aria-label="Text to speech" className={`p-2  ${isDark ? 'hover:bg-[#1a1a1a]' : 'hover:bg-gray-100'} text-pink-400 disabled:opacity-50`}><ICONS.Speaker /></button>
            <button onClick={() => setShowPreview(!showPreview)} aria-label="Toggle preview" className={`p-2  ${isDark ? 'hover:bg-[#1a1a1a]' : 'hover:bg-gray-100'} transition-colors ${showPreview ? 'text-[#00ff9d]' : 'text-gray-400'}`} title="Toggle Preview"><ICONS.Columns /></button>
            {onSplitNote && (
              <button 
                onClick={() => {
                  const otherNotes = allNotes.filter(n => n.id !== note.id && !n.archived && !n.trashedAt);
                  if (splitNoteId) {
                    onSplitNote(splitNoteId);
                  } else if (otherNotes.length > 0) {
                    onSplitNote(otherNotes[0].id);
                  }
                }}
                aria-label="Split pane"
                className={`p-2  ${isDark ? 'hover:bg-[#1a1a1a]' : 'hover:bg-gray-100'} transition-colors ${splitNoteId ? 'text-[#00d2ff]' : 'text-gray-400 hover:text-[#00d2ff]'}`}
                title={splitNoteId ? 'Close Split View' : 'Split View'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
              </button>
            )}
            <button
              onClick={() => {
                const table = '\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n';
                const textarea = document.querySelector('textarea');
                if (textarea) {
                  const start = textarea.selectionStart;
                  const end = textarea.selectionEnd;
                  const text = note.content;
                  const newContent = text.substring(0, start) + table + text.substring(end);
                  onUpdate({ content: newContent });
                }
              }}
              aria-label="Insert table"
              className={`p-2 ${isDark ? 'hover:bg-[#1a1a1a]' : 'hover:bg-gray-100'} transition-colors text-gray-400 hover:text-[#00ff9d]`}
              title="Insert Table"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="0" ry="0"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>
            </button>
            <button onClick={toggleHaunt} disabled={isProcessing} aria-label="Find related notes" className={`p-2  ${isDark ? 'hover:bg-[#1a1a1a]' : 'hover:bg-gray-100'} transition-colors disabled:opacity-50 ${showHauntPanel ? 'text-[#ff00ff] bg-[#1a051a]' : 'text-gray-400 hover:text-[#ff00ff]'}`} title="Haunt (Find Related)"><ICONS.Ghost /></button>
            <button onClick={() => setIsZenMode(true)} aria-label="Focus mode" className={`p-2  ${isDark ? 'hover:bg-[#1a1a1a]' : 'hover:bg-gray-100'} text-gray-400 hover:text-[#00ff9d] transition-colors`} title="Focus Mode"><ICONS.Focus /></button>
            <button onClick={() => setPomodoroActive(!pomodoroActive)} aria-label="Pomodoro timer" className={`p-2  ${isDark ? 'hover:bg-[#1a1a1a]' : 'hover:bg-gray-100'} transition-colors ${pomodoroActive ? 'text-[#ff6b6b]' : 'text-gray-400 hover:text-[#ff6b6b]'}`} title="Pomodoro Timer">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </button>
            {pomodoroActive && (
              <div className={`flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 ${isDark ? 'bg-[#1a1a1a] border-[#333]' : 'bg-gray-100 border-gray-300'} border  ml-1 md:ml-2`}>
                <span className={`font-mono text-xs md:text-sm font-bold ${pomodoroMode === 'work' ? 'text-[#ff6b6b]' : 'text-[#00ff9d]'}`}>
                  {Math.floor(pomodoroTime / 60).toString().padStart(2, '0')}:{(pomodoroTime % 60).toString().padStart(2, '0')}
                </span>
                <span className="text-[9px] text-gray-500 uppercase hidden md:inline">{pomodoroMode}</span>
                <button onClick={() => setPomodoroRunning(!pomodoroRunning)} className="text-xs text-gray-400 hover:text-white px-1 min-w-[28px] min-h-[28px] md:min-w-0 md:min-h-0 flex items-center justify-center">
                  {pomodoroRunning ? '⏸' : '▶'}
                </button>
                <button onClick={() => { setPomodoroRunning(false); setPomodoroTime(pomodoroMode === 'work' ? 25 * 60 : 5 * 60); }} className="text-xs text-gray-400 hover:text-white px-1 min-w-[28px] min-h-[28px] md:min-w-0 md:min-h-0 flex items-center justify-center">↺</button>
              </div>
            )}
            <button onClick={onOpenChat} disabled={isProcessing} aria-label="Chat assistant" className={`p-2  ${isDark ? 'hover:bg-[#1a1a1a]' : 'hover:bg-gray-100'} text-green-400 hover:text-green-300 disabled:opacity-50`} title="Chat Assistant"><ICONS.Chat /></button>
            <button onClick={onExport} disabled={isProcessing} aria-label="Export" className={`p-2  ${isDark ? 'hover:bg-[#1a1a1a]' : 'hover:bg-gray-100'} text-gray-400 hover:text-white disabled:opacity-50`} title="Export"><ICONS.Download /></button>
            <button onClick={async () => {
              if (showVersions) { setShowVersions(false); return; }
              const v = await loadNoteVersions(note.id);
              setVersions(v);
              setShowVersions(true);
              setSelectedVersion(null);
            }} aria-label="Version history" className={`p-2  ${isDark ? 'hover:bg-[#1a1a1a]' : 'hover:bg-gray-100'} transition-colors ${showVersions ? 'text-[#ffd93d]' : 'text-gray-400 hover:text-[#ffd93d]'}`} title="Version History">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5"></path><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"></path><path d="M12 7v5l4 2"></path></svg>
            </button>
            <button 
              onClick={() => setShowReminderPicker(!showReminderPicker)}
              aria-label="Set reminder"
              className={`p-2  ${isDark ? 'hover:bg-[#1a1a1a]' : 'hover:bg-gray-100'} transition-colors ${note.reminder ? 'text-[#ff9f43]' : 'text-gray-400 hover:text-[#ff9f43]'}`}
              title={note.reminder ? `Reminder: ${new Date(note.reminder).toLocaleString()}` : 'Set Reminder'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path></svg>
            </button>
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

        <label className={`flex-shrink-0 flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none border ${isDark ? 'border-[#333]' : 'border-gray-300'} px-2 py-1  hover:border-[#00ff9d] transition-colors`}>
            <input type="checkbox" checked={isThinking} onChange={(e) => setIsThinking(e.target.checked)} className="accent-[#00ff9d]" />
            <span className="hidden md:inline">Thinking</span>
            <span className="md:hidden">Think</span>
        </label>

        {showReminderPicker && (
          <div className={`absolute top-[53px] right-4 z-50 ${isDark ? 'bg-[#111] border-[#333]' : 'bg-white border-gray-200'} border  shadow-xl p-4 w-64 animate-scale-in`}>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-[#ff9f43]' : 'text-orange-500'}`}>Set Reminder</h4>
            <div className="space-y-2">
              <input 
                type="date" 
                value={reminderDate} 
                onChange={(e) => setReminderDate(e.target.value)}
                className={`w-full ${isDark ? 'bg-[#1a1a1a] border-[#333] text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-800'} border  px-3 py-1.5 text-sm focus:outline-none focus:border-[#ff9f43]`}
              />
              <input 
                type="time" 
                value={reminderTime} 
                onChange={(e) => setReminderTime(e.target.value)}
                className={`w-full ${isDark ? 'bg-[#1a1a1a] border-[#333] text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-800'} border  px-3 py-1.5 text-sm focus:outline-none focus:border-[#ff9f43]`}
              />
            </div>
            <div className="flex justify-between items-center mt-3">
              {note.reminder && (
                <button 
                  onClick={() => { onUpdate({ reminder: undefined }); setShowReminderPicker(false); }}
                  className="text-red-400 hover:text-red-300 text-[10px] uppercase"
                >Clear</button>
              )}
              <div className="flex gap-2 ml-auto">
                <button onClick={() => setShowReminderPicker(false)} className="text-gray-500 hover:text-gray-300 text-xs">Cancel</button>
                <button 
                  onClick={() => {
                    if (reminderDate && reminderTime) {
                      const ts = new Date(`${reminderDate}T${reminderTime}`).getTime();
                      onUpdate({ reminder: ts });
                      setShowReminderPicker(false);
                      setReminderDate('');
                      setReminderTime('');
                    }
                  }}
                  className="bg-[#ff9f43] text-black font-bold px-3 py-1  text-xs hover:bg-[#ffb366]"
                >Set</button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-4xl mx-auto w-full z-0 relative flex">
        <div className="flex-1 min-w-0">
            {/* Breadcrumb Navigation */}
            <div className={`flex items-center gap-1 text-[10px] font-mono mb-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
              <span className="hover:text-[#00ff9d] cursor-default">VOID</span>
              <span>›</span>
              {note.archived ? (
                <span className="text-yellow-600">Archive</span>
              ) : note.trashedAt ? (
                <span className="text-red-500">Trash</span>
              ) : (
                <span>Notes</span>
              )}
              <span>›</span>
              {note.tags.length > 0 && (
                <>
                  <span className="text-[#00ff9d]/70">{note.tags[0]}</span>
                  <span>›</span>
                </>
              )}
              <span className={`truncate max-w-[200px] ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{note.title || 'Untitled'}</span>
              <span className="mx-1">|</span>
              <select
                value={note.folderId || ''}
                onChange={(e) => onUpdate({ folderId: e.target.value || undefined })}
                className={`text-[10px] px-2 py-0.5 ${isDark ? 'bg-[#111] border-[#333] text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-600'} border focus:outline-none focus:border-[#00ff9d]`}
              >
                <option value="">No Folder</option>
                {folders?.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 mb-4 md:mb-6">
                <input 
                  type="text" 
                  value={note.title} 
                  onChange={handleTitleChange}
                  placeholder="Void Entry" 
                  aria-label="Note title"
                  className={`flex-1 bg-transparent text-2xl md:text-4xl font-bold ${isDark ? 'text-white placeholder-gray-700' : 'text-gray-900 placeholder-gray-400'} focus:outline-none tracking-tight`}
                />
            </div>

            {backlinks.length > 0 && (
                <div className={`mb-5 md:mb-6 p-3 border ${isDark ? 'bg-[#0f0f0f] border-[#1f1f1f]' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                        <h4 className={`text-[10px] uppercase tracking-widest font-bold ${isDark ? 'text-[#00d2ff]' : 'text-cyan-700'}`}>
                            Backlinks ({backlinks.length})
                        </h4>
                        <span className={`text-[10px] font-mono ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Referenced By</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {backlinks.map(linkedNote => (
                            <button
                              key={linkedNote.id}
                              onClick={() => onSelectNote(linkedNote.id)}
                              className={`px-2.5 py-1 text-xs border transition-colors ${isDark ? 'border-[#234] text-[#9ad9ff] hover:border-[#00d2ff] hover:text-white' : 'border-cyan-200 text-cyan-700 hover:bg-cyan-50'}`}
                              title={linkedNote.title}
                            >
                                {linkedNote.title || 'Untitled'}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {note.attachments.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 md:mb-8">
                    {note.attachments.map(att => (
                        <div key={att.id} className={`relative group border ${isDark ? 'border-[#333] bg-[#111]' : 'border-gray-200 bg-white'}  overflow-hidden`}>
                            {att.type === 'image' && <img src={att.url} className="w-full h-48 md:h-40 object-cover" />}
                            {att.type === 'video' && <video src={att.url} controls className="w-full h-48 md:h-40 object-cover" />}
                            <div className="absolute top-1 right-1 flex gap-1">
                                {att.type === 'image' && <button onClick={() => handleEditImage(att.id, att.url)} className="bg-black/50 p-1  text-white"><ICONS.Wand /></button>}
                                {att.type === 'video' && <button onClick={() => handleAnalyzeVideo(att.id, att.url)} className="bg-black/50 p-1  text-white"><ICONS.Scan /></button>}
                                <button onClick={() => { onUpdate({ attachments: note.attachments.filter(a => a.id !== att.id) }); triggerSaveVisual(); }} className="bg-red-500/80 p-1  text-white"><ICONS.Close /></button>
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
                      aria-label="Note content"
                      className={`w-full bg-transparent text-base md:text-lg ${isDark ? 'text-gray-300' : 'text-gray-800'} resize-none focus:outline-none min-h-[50vh] leading-relaxed font-mono pb-20`}
                    />
                    {showLinkSuggest && (
                      <div className={`absolute z-50 ${isDark ? 'bg-[#111] border-[#333]' : 'bg-white border-gray-200'} border  shadow-lg max-w-xs w-64 overflow-hidden`} style={{ top: '2rem', left: '1rem' }}>
                        {linkSuggestions.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-500 italic">No matches</div>
                        ) : (
                          linkSuggestions.map((s, i) => (
                            <div
                              key={s.id}
                              onClick={() => insertLinkSuggestion(s)}
                              className={`px-3 py-2 text-sm cursor-pointer transition-colors ${i === selectedLinkIndex ? `${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'} text-[#00ff9d]` : `${isDark ? 'text-gray-300 hover:bg-[#1a1a1a]' : 'text-gray-600 hover:bg-gray-50'}`}`}
                            >
                              {s.title}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                    {showSlashMenu && filteredSlashCommands.length > 0 && (
                      <div className={`absolute z-50 ${isDark ? 'bg-[#111] border-[#333]' : 'bg-white border-gray-200'} border  shadow-lg w-64 overflow-hidden max-h-80 overflow-y-auto`} style={{ top: '2rem', left: '1rem' }}>
                        <div className={`px-3 py-1.5 text-[10px] text-gray-500 uppercase tracking-widest border-b ${isDark ? 'border-[#222]' : 'border-gray-200'}`}>Insert Block</div>
                        {filteredSlashCommands.map((cmd, i) => (
                          <div
                            key={cmd.id}
                            onClick={() => insertSlashCommand(cmd)}
                            className={`px-3 py-2 flex items-center gap-3 cursor-pointer transition-colors ${i === selectedSlashIndex ? `${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'} text-[#00ff9d]` : `${isDark ? 'text-gray-300 hover:bg-[#1a1a1a]' : 'text-gray-600 hover:bg-gray-50'}`}`}
                          >
                            <span className="w-6 text-center text-sm font-mono">{cmd.icon}</span>
                            <span className="text-sm">{cmd.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
                {showPreview && (
                    <div className={`w-full md:w-1/2 min-h-[50vh] border-t md:border-t-0 md:border-l ${isDark ? 'border-[#333]' : 'border-gray-300'} pt-4 md:pt-0 md:pl-6 markdown-preview animate-fade-in`}>
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
      
      {showCheatSheet && (
        <div className={`absolute bottom-10 left-4 z-40 ${isDark ? 'bg-[#111] border-[#333]' : 'bg-white border-gray-200'} border  shadow-xl p-4 w-72 animate-fade-in`}>
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-xs font-bold text-[#00ff9d] uppercase tracking-wider">Markdown Shortcuts</h4>
            <button onClick={() => setShowCheatSheet(false)} className="text-gray-500 hover:text-white"><ICONS.Close /></button>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] font-mono">
            <span className="text-gray-500">**bold**</span><span className="text-gray-300 font-bold">bold</span>
            <span className="text-gray-500">*italic*</span><span className="text-gray-300 italic">italic</span>
            <span className="text-gray-500">~~strike~~</span><span className="text-gray-300 line-through">strike</span>
            <span className="text-gray-500"># Heading 1</span><span className="text-gray-300">H1</span>
            <span className="text-gray-500">## Heading 2</span><span className="text-gray-300">H2</span>
            <span className="text-gray-500">### Heading 3</span><span className="text-gray-300">H3</span>
            <span className="text-gray-500">- list item</span><span className="text-gray-300">bullet</span>
            <span className="text-gray-500">1. item</span><span className="text-gray-300">numbered</span>
            <span className="text-gray-500">- [ ] task</span><span className="text-gray-300">checklist</span>
            <span className="text-gray-500">`code`</span><span className="text-gray-300 bg-[#1a1a1a] px-1 ">code</span>
            <span className="text-gray-500">```lang</span><span className="text-gray-300">code block</span>
            <span className="text-gray-500">&gt; quote</span><span className="text-gray-300">blockquote</span>
            <span className="text-gray-500">---</span><span className="text-gray-300">divider</span>
            <span className="text-gray-500">[[note]]</span><span className="text-gray-300">note link</span>
            <span className="text-gray-500">[text](url)</span><span className="text-gray-300">link</span>
            <span className="text-gray-500">![alt](url)</span><span className="text-gray-300">image</span>
          </div>
          <div className="mt-3 pt-2 border-t border-[#222] text-[10px] text-gray-600">
            Type <span className="text-[#00ff9d]">/</span> at line start for slash commands
          </div>
        </div>
      )}

      <div role="status" aria-live="polite" className={`shrink-0 w-full ${isDark ? 'bg-[#0a0a0a] border-[#1a1a1a]' : 'bg-white border-gray-200'} border-t p-2 flex justify-between items-center text-[10px] text-gray-500 font-mono select-none opacity-50 hover:opacity-100 transition-opacity`}>
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
                    className={`w-12 ${isDark ? 'bg-[#1a1a1a] border-[#333] text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-700'} border  px-1 py-0.5 text-[10px] font-mono focus:outline-none focus:border-[#00ff9d]`}
                  />
                  <button onClick={handleSetGoal} className="text-[#00ff9d] hover:text-white">✓</button>
                  {wordGoal && <button onClick={handleClearGoal} className="text-red-500 hover:text-red-400">✕</button>}
                </span>
              ) : (
                <span className="cursor-pointer hover:text-[#00ff9d] transition-colors" role="button" aria-label="Set word goal" onClick={() => { setGoalInputValue(wordGoal ? String(wordGoal) : ''); setShowGoalInput(true); }}>
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
              <span className="w-[1px] h-3 bg-[#333]"></span>
              <button 
                onClick={() => setShowCheatSheet(!showCheatSheet)}
                className={`hover:text-[#00ff9d] transition-colors ${showCheatSheet ? 'text-[#00ff9d]' : ''}`}
                title="Markdown Cheat Sheet"
                aria-label="Markdown cheat sheet"
              >
                MD?
              </button>
          </div>
          <div className="text-right text-[#00ff9d]" title={new Date(note.updatedAt).toLocaleString()}>
              {getSaveStatusText()}
          </div>
      </div>

      {/* Haunt Panel */}
      {showHauntPanel && (
          <div className="absolute top-[53px] right-0 bottom-0 w-80 bg-[#0a050a] border-l border-[#330033] shadow-[-10px_0_30px_rgba(255,0,255,0.1)] transform transition-transform duration-300 overflow-y-auto z-40 animate-slide-in-right">
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
                                className="group p-3  bg-[#1a051a] border border-[#330033] hover:border-[#ff00ff] cursor-pointer transition-all hover:bg-[#2a0a2a]"
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

      {showVersions && (
          <div className="absolute top-[53px] right-0 bottom-0 w-80 bg-[#0a0a0f] border-l border-[#1a1a2a] shadow-[-10px_0_30px_rgba(255,217,61,0.05)] overflow-y-auto z-40 animate-slide-in-right">
              <div className="p-4 border-b border-[#1a1a2a] bg-[#0f0f1a] flex justify-between items-center sticky top-0">
                  <h3 className="text-[#ffd93d] font-bold text-sm tracking-wider flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5"></path><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"></path><path d="M12 7v5l4 2"></path></svg>
                      TIMELINE
                  </h3>
                  <button onClick={() => setShowVersions(false)} className="text-gray-500 hover:text-[#ffd93d] p-1"><ICONS.Close /></button>
              </div>
              <div className="p-4 space-y-2">
                  {versions.length === 0 ? (
                      <div className="text-center text-gray-600 text-xs py-10">
                          <p className="italic">No history yet.</p>
                          <p className="mt-2 text-[10px]">Versions are saved as you edit.</p>
                      </div>
                  ) : (
                      versions.slice().reverse().map((v, i) => (
                          <div
                              key={v.timestamp}
                              onClick={() => setSelectedVersion(selectedVersion?.timestamp === v.timestamp ? null : v)}
                              className={`p-3  border cursor-pointer transition-all ${selectedVersion?.timestamp === v.timestamp ? 'border-[#ffd93d] bg-[#1a1a0a]' : 'border-[#1a1a2a] hover:border-[#333] bg-[#0a0a0f]'}`}
                          >
                              <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-400">{v.title || 'Untitled'}</span>
                                  <span className="text-[10px] text-gray-600 font-mono">{new Date(v.timestamp).toLocaleString()}</span>
                              </div>
                              <p className="text-[10px] text-gray-500 mt-1 truncate">{v.content.substring(0, 80)}...</p>
                              {selectedVersion?.timestamp === v.timestamp && (
                                  <div className="mt-2 flex gap-2">
                                      <button
                                          onClick={(e) => { e.stopPropagation(); onUpdate({ title: v.title, content: v.content }); setShowVersions(false); }}
                                          className="px-3 py-1 text-[10px] bg-[#ffd93d] text-black  font-bold hover:bg-[#ffe066] transition-colors"
                                      >
                                          Restore
                                      </button>
                                      <button
                                          onClick={(e) => { e.stopPropagation(); setSelectedVersion(null); }}
                                          className="px-3 py-1 text-[10px] text-gray-400 hover:text-white transition-colors"
                                      >
                                          Cancel
                                      </button>
                                  </div>
                              )}
                          </div>
                      ))
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
                            <img src={v} className=" border border-[#333] w-full" />
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
                className="fixed top-4 right-4 z-[101] px-3 py-1.5  text-[10px] font-mono uppercase tracking-widest text-gray-600 hover:text-[#00ff9d] border border-[#1a1a1a] hover:border-[#00ff9d] bg-[#0a0a0a] transition-all"
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
                        className="w-full bg-transparent text-2xl md:text-4xl font-bold text-white focus:outline-none placeholder-gray-700 tracking-tight mb-6"
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
                          <div className="absolute z-50 bg-[#111] border border-[#333]  shadow-lg max-w-xs w-64 overflow-hidden" style={{ top: '2rem', left: '1rem' }}>
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
                        {showSlashMenu && filteredSlashCommands.length > 0 && (
                          <div className="absolute z-50 bg-[#111] border border-[#333]  shadow-lg w-64 overflow-hidden max-h-80 overflow-y-auto" style={{ top: '2rem', left: '1rem' }}>
                            <div className="px-3 py-1.5 text-[10px] text-gray-500 uppercase tracking-widest border-b border-[#222]">Insert Block</div>
                            {filteredSlashCommands.map((cmd, i) => (
                              <div
                                key={cmd.id}
                                onClick={() => insertSlashCommand(cmd)}
                                className={`px-3 py-2 flex items-center gap-3 cursor-pointer transition-colors ${i === selectedSlashIndex ? 'bg-[#1a1a1a] text-[#00ff9d]' : 'text-gray-300 hover:bg-[#1a1a1a]'}`}
                              >
                                <span className="w-6 text-center text-sm font-mono">{cmd.icon}</span>
                                <span className="text-sm">{cmd.label}</span>
                              </div>
                            ))}
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
        @keyframes zenFadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-zen-fade-in { animation: zenFadeIn 0.5s ease-out; }
      `}</style>
    </div>
  );
};
