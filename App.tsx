import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { LiveSession } from './components/LiveSession';
import { Note, AppView, Attachment } from './types';
import { saveNotes, loadNotes } from './services/store';
import { createNewNote } from './utils';
import { ChatOverlay } from './components/ChatOverlay';
import { SyncModal } from './components/SyncModal';
import { ExportModal } from './components/ExportModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { CommandPalette } from './components/CommandPalette';
import { useGlobalShortcuts } from './services/shortcuts';
import * as Gemini from './services/gemini';
import { ICONS } from './constants';

const App: React.FC = () => {
  const [isStorageReady, setIsStorageReady] = useState(false);
  
  // 1. Initialize with empty, wait for DB
  const [notes, setNotes] = useState<Note[]>([]);

  // 2. Persist Active Note Selection (Keep in LocalStorage as it is small)
  const [activeNoteId, setActiveNoteId] = useState<string | null>(() => {
    return localStorage.getItem('void_active_note');
  });

  const [view, setView] = useState<AppView>('editor');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isFusing, setIsFusing] = useState(false);
  const [isGenesis, setIsGenesis] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [quickCaptureTitle, setQuickCaptureTitle] = useState('Quick Note');
  const [quickCaptureContent, setQuickCaptureContent] = useState('');

  const notesRef = useRef(notes);
  useEffect(() => { notesRef.current = notes; }, [notes]);

  // 3. Load from IndexedDB on Mount
  useEffect(() => {
    const initData = async () => {
        const loaded = await loadNotes();
        if (loaded && loaded.length > 0) {
            setNotes(loaded);
            // Ensure valid active ID
            const savedId = localStorage.getItem('void_active_note');
            if (!savedId || !loaded.find(n => n.id === savedId && !n.archived && !n.trashedAt)) {
                const available = loaded.filter(n => !n.archived && !n.trashedAt);
                if (available.length > 0) {
                    setActiveNoteId(available[0].id);
                } else {
                    const fresh = createNewNote();
                    setNotes([fresh, ...loaded]);
                    setActiveNoteId(fresh.id);
                }
            }
        } else {
            // First time user or empty DB
            const fresh = createNewNote();
            setNotes([fresh]);
            setActiveNoteId(fresh.id);
        }
        setIsStorageReady(true);
    };
    initData();
  }, []);

  // 4. Persistence Effects
  useEffect(() => {
    if (!isStorageReady) return; // Don't save empty state while loading
    
    const timeoutId = setTimeout(() => {
      saveNotes(notes);
    }, 800);
    return () => clearTimeout(timeoutId);
  }, [notes, isStorageReady]);

  useEffect(() => {
    if (activeNoteId) {
      localStorage.setItem('void_active_note', activeNoteId);
    }
  }, [activeNoteId]);

  useEffect(() => {
    const handleBeforeUnload = () => {
        if (notesRef.current.length > 0) {
            saveNotes(notesRef.current);
        }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const activeNote = notes.find(n => n.id === activeNoteId) || null;

  const handleCreateNote = useCallback(() => {
    const newNote = createNewNote();
    setNotes(prev => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    setIsSidebarOpen(false);
  }, []);

  // Specialized creator for Chat to allow params and trigger Genesis effect
  const handleCreateNoteWithContent = useCallback((title: string, content: string, tags: string[] = []) => {
      const newNote = createNewNote();
      newNote.title = title;
      newNote.content = content;
      newNote.tags = tags;
      setNotes(prev => [newNote, ...prev]);
      setActiveNoteId(newNote.id);
      
      // Trigger Genesis Effect
      setIsGenesis(true);
      setTimeout(() => setIsGenesis(false), 2000);
  }, []);

  const handleUpdateNote = useCallback((id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n));
  }, []);

  // Global Batch Tag Update for Taxonomy Control
  const handleBatchTagUpdate = useCallback((action: 'rename' | 'delete', oldTag: string, newTag?: string) => {
    setNotes(prev => prev.map(note => {
        if (!note.tags.includes(oldTag)) return note;
        
        // Remove old tag
        const tagsWithoutOld = note.tags.filter(t => t !== oldTag);
        
        let newTags = tagsWithoutOld;
        // If rename, add new tag if not already present
        if (action === 'rename' && newTag) {
            if (!newTags.includes(newTag)) {
                newTags = [...newTags, newTag];
            }
        }
        
        return { ...note, tags: newTags, updatedAt: Date.now() };
    }));
  }, []);

  const handleDeleteForever = useCallback((id: string) => {
    const remaining = notes.filter(n => n.id !== id);
    let nextNotes = remaining;
    
    // Only switch selection if we deleted the active note or if no notes left
    if (id === activeNoteId || remaining.length === 0) {
        // Filter out archived for selection logic
        const available = remaining.filter(n => !n.archived && !n.trashedAt);
        if (available.length > 0) {
            setActiveNoteId(available[0].id);
        } else {
             const fresh = createNewNote();
             nextNotes = [fresh, ...remaining];
             setActiveNoteId(fresh.id);
        }
    }

    setNotes(nextNotes);
  }, [notes, activeNoteId]);

  const handleArchiveNote = useCallback((id: string) => {
      handleUpdateNote(id, { archived: true, archivedAt: Date.now() });
      
      // If we archived the active note, switch to another
      if (id === activeNoteId) {
          const available = notes.filter(n => n.id !== id && !n.archived && !n.trashedAt);
          if (available.length > 0) {
              setActiveNoteId(available[0].id);
          } else {
              const fresh = createNewNote();
              setNotes(prev => [fresh, ...prev]);
              setActiveNoteId(fresh.id);
          }
      }
  }, [notes, activeNoteId, handleUpdateNote]);

  const handleRestoreNote = useCallback((id: string) => {
      handleUpdateNote(id, { archived: false, archivedAt: undefined });
  }, [handleUpdateNote]);

  const handleTrashNote = useCallback((id: string) => {
      handleUpdateNote(id, { trashedAt: Date.now(), archived: false });
      
      if (id === activeNoteId) {
          const available = notes.filter(n => n.id !== id && !n.archived && !n.trashedAt);
          if (available.length > 0) {
              setActiveNoteId(available[0].id);
          } else {
              const fresh = createNewNote();
              setNotes(prev => [fresh, ...prev]);
              setActiveNoteId(fresh.id);
          }
      }
  }, [notes, activeNoteId, handleUpdateNote]);

  const handleRestoreFromTrash = useCallback((id: string) => {
      handleUpdateNote(id, { trashedAt: undefined });
  }, [handleUpdateNote]);

  const handleEmptyTrash = useCallback(() => {
      const trashedIds = notes.filter(n => n.trashedAt).map(n => n.id);
      if (trashedIds.length === 0) return;
      
      let nextNotes = notes.filter(n => !n.trashedAt);
      
      if (activeNoteId && trashedIds.includes(activeNoteId)) {
          const available = nextNotes.filter(n => !n.archived);
          if (available.length > 0) {
              setActiveNoteId(available[0].id);
          } else {
              const fresh = createNewNote();
              nextNotes = [fresh, ...nextNotes];
              setActiveNoteId(fresh.id);
          }
      }
      
      setNotes(nextNotes);
  }, [notes, activeNoteId]);

  const handleQuickCapture = useCallback(() => {
    if (!quickCaptureContent.trim()) return;
    const newNote = createNewNote();
    newNote.title = quickCaptureTitle.trim() || 'Quick Note';
    newNote.content = quickCaptureContent;
    setNotes(prev => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    setIsQuickCaptureOpen(false);
    setQuickCaptureTitle('Quick Note');
    setQuickCaptureContent('');
  }, [quickCaptureTitle, quickCaptureContent]);

  const handleSelectNote = (id: string) => {
      setActiveNoteId(id);
      setIsSidebarOpen(false); 
  };

  const handleFuseNotes = useCallback(async (sourceId: string, targetId: string) => {
      const sourceNote = notes.find(n => n.id === sourceId);
      const targetNote = notes.find(n => n.id === targetId);
      
      if (!sourceNote || !targetNote) return;

      setIsFusing(true);
      try {
          const fusion = await Gemini.fuseConcepts(sourceNote.content, targetNote.content);
          
          let attachment: Attachment | undefined;
          try {
             const imageUrl = await Gemini.generateImage(fusion.imagePrompt, "16:9");
             attachment = {
                 id: Date.now().toString(),
                 type: 'image',
                 url: imageUrl,
                 mimeType: 'image/png',
                 metadata: `Fusion Artifact: ${fusion.imagePrompt}`
             };
          } catch (e) {
              console.error("Fusion image gen failed", e);
          }

          const childNote = createNewNote();
          childNote.title = fusion.title;
          childNote.content = fusion.content + `\n\n> [System]: Fused from "${sourceNote.title}" and "${targetNote.title}".`;
          if (attachment) childNote.attachments.push(attachment);
          
          setNotes(prev => [childNote, ...prev]);
          setActiveNoteId(childNote.id);
          setIsSidebarOpen(false);

      } catch (e) {
          console.error("Fusion Failed", e);
          alert("Neural Fusion Failed. The concepts were too volatile.");
      } finally {
          setIsFusing(false);
      }
  }, [notes]);

  // Keyboard Shortcuts Integration
  useGlobalShortcuts({
    onNewNote: handleCreateNote,
    onSave: () => {
        saveNotes(notesRef.current); // Force immediate save
    },
    onFocusSearch: () => {
        const el = document.getElementById('sidebar-search');
        if (el) el.focus();
        if (!isSidebarOpen) setIsSidebarOpen(true);
    },
    onArchiveNote: () => {
        if (activeNoteId) {
            handleArchiveNote(activeNoteId);
        }
    },
    onDeleteForever: () => {
        if (activeNoteId) {
            if (window.confirm("Permanently delete active note? This cannot be undone.")) {
                handleDeleteForever(activeNoteId);
            }
        }
    },
    onSwitchNote: (index: number) => {
        const available = notes.filter(n => !n.archived && !n.trashedAt);
        if (available[index]) {
            setActiveNoteId(available[index].id);
        }
    },
    onShowShortcuts: () => setIsShortcutsOpen(true),
    onCommandPalette: () => setIsCommandPaletteOpen(prev => !prev),
    onEscape: () => {
        setIsCommandPaletteOpen(false);
        setIsShortcutsOpen(false);
        setIsSyncOpen(false);
        setIsChatOpen(false);
        setIsSidebarOpen(false);
        setIsExportOpen(false);
    },
    onExport: () => {
        if (activeNoteId) setIsExportOpen(true);
    }
  });

  if (!isStorageReady) {
      return (
          <div className="h-screen w-full bg-[#050505] flex flex-col items-center justify-center text-[#00ff9d]">
              <ICONS.Atom />
              <p className="mt-4 font-mono text-sm tracking-widest animate-pulse">RECALLING MEMORY BLOCKS...</p>
          </div>
      );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#050505] text-gray-200 selection:bg-[#00ff9d] selection:text-black flex-col md:flex-row">
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#0a0a0a] border-b border-[#1a1a1a] z-30 shrink-0">
          <button onClick={() => setIsSidebarOpen(true)} className="text-[#00ff9d]">
              <ICONS.Menu />
          </button>
          <h1 className="text-xl font-bold tracking-tighter text-[#00ff9d] neon-text">VOID</h1>
          <div className="w-5"></div>
      </div>

      {/* Sidebar - Mobile Drawer / Desktop Sidebar */}
      <div className={`
            fixed inset-y-0 left-0 z-40 w-80 bg-[#0a0a0a] transform transition-transform duration-300 ease-in-out border-r border-[#1a1a1a]
            md:relative md:translate-x-0
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
          <Sidebar 
            notes={notes} 
            activeNoteId={activeNoteId} 
            onSelectNote={handleSelectNote} 
            onCreateNote={handleCreateNote}
            onCreateNoteFromTemplate={handleCreateNoteWithContent}
            onDeleteNote={handleDeleteForever}
            onUpdateNote={handleUpdateNote}
            onArchiveNote={handleArchiveNote}
            onRestoreNote={handleRestoreNote}
            onTrashNote={handleTrashNote}
            onRestoreFromTrash={handleRestoreFromTrash}
            onEmptyTrash={handleEmptyTrash}
            onOpenChat={() => { setIsChatOpen(true); setIsSidebarOpen(false); }}
            onToggleLive={() => { setView(v => v === 'live' ? 'editor' : 'live'); setIsSidebarOpen(false); }}
            onOpenSync={() => { setIsSyncOpen(true); setIsSidebarOpen(false); }}
            onShowShortcuts={() => { setIsShortcutsOpen(true); setIsSidebarOpen(false); }}
            onFuseNotes={handleFuseNotes}
            currentView={view}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
      </div>

      {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/80 z-30 md:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Fusion Effect */}
        {isFusing && (
            <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center backdrop-blur-md">
                <div className="relative">
                    <div className="absolute inset-0 bg-[#00ff9d] blur-[50px] opacity-20 animate-pulse"></div>
                    <ICONS.Atom />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white mt-8 tracking-[0.5em] animate-pulse">NEURAL FUSION</h2>
                <div className="w-48 md:w-64 h-1 bg-[#333] mt-8 rounded overflow-hidden">
                    <div className="h-full bg-[#00ff9d] animate-indeterminate-progress"></div>
                </div>
            </div>
        )}

        {/* Genesis Effect */}
        {isGenesis && (
            <div className="absolute inset-0 z-50 pointer-events-none flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
                 <div className="flex flex-col items-center gap-4 animate-bounce-in">
                    <div className="text-[#00ff9d] drop-shadow-[0_0_15px_rgba(0,255,157,0.8)]">
                        <ICONS.Sparkle width="48" height="48" />
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-[0.5em] uppercase neon-text">Genesis Complete</h2>
                 </div>
            </div>
        )}

        {view === 'editor' && activeNote ? (
          <Editor 
            note={activeNote} 
            allNotes={notes}
            onUpdate={(updates) => handleUpdateNote(activeNote.id, updates)} 
            onSelectNote={handleSelectNote}
            onExport={() => setIsExportOpen(true)}
            onOpenChat={() => setIsChatOpen(true)}
          />
        ) : view === 'editor' && !activeNote ? (
          <div className="flex-1 flex items-center justify-center text-gray-600">
            <p>Select a note to begin.</p>
          </div>
        ) : (
          <LiveSession 
             onClose={() => setView('editor')} 
             context={activeNote ? `Active Note Title: ${activeNote.title}\nContent:\n${activeNote.content}` : "User is viewing the note list, no active note selected."}
          />
        )}

        {isChatOpen && (
          <ChatOverlay 
            onClose={() => setIsChatOpen(false)} 
            contextNote={activeNote}
            notes={notes}
            onUpdateNote={handleUpdateNote}
            onSwitchNote={handleSelectNote}
            onCreateNote={handleCreateNoteWithContent}
            onBatchTagUpdate={handleBatchTagUpdate}
            onArchiveNote={handleArchiveNote}
            onDeleteNote={handleDeleteForever}
            onFuseNotes={handleFuseNotes}
            onChangeView={setView}
          />
        )}

        {isSyncOpen && (
          <SyncModal
            notes={notes}
            onClose={() => setIsSyncOpen(false)}
            onImport={(importedNotes) => {
              setNotes(importedNotes);
              if (importedNotes.length > 0) setActiveNoteId(importedNotes[0].id);
            }}
          />
        )}

        {isExportOpen && activeNote && (
            <ExportModal 
                note={activeNote} 
                onClose={() => setIsExportOpen(false)} 
            />
        )}

        {isShortcutsOpen && (
            <KeyboardShortcutsModal onClose={() => setIsShortcutsOpen(false)} />
        )}

        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          notes={notes}
          onSelectNote={handleSelectNote}
          onCreateNote={handleCreateNote}
          onOpenChat={() => setIsChatOpen(true)}
          onExport={() => { if (activeNoteId) setIsExportOpen(true); }}
          onArchiveNote={() => { if (activeNoteId) handleArchiveNote(activeNoteId); }}
          onShowShortcuts={() => setIsShortcutsOpen(true)}
          onOpenSync={() => setIsSyncOpen(true)}
        />

        {view === 'editor' && !isFusing && !isGenesis && (
          <div className="fixed bottom-6 right-6 z-30">
            {isQuickCaptureOpen && (
              <div className="absolute bottom-16 right-0 w-80 bg-[#111] border border-[#333] rounded-lg shadow-2xl shadow-black/80 p-4" onKeyDown={(e) => { if (e.key === 'Escape') setIsQuickCaptureOpen(false); }}>
                <input
                  type="text"
                  value={quickCaptureTitle}
                  onChange={(e) => setQuickCaptureTitle(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#333] text-white text-sm rounded px-3 py-1.5 mb-3 focus:outline-none focus:border-[#00ff9d]"
                  placeholder="Title"
                />
                <textarea
                  value={quickCaptureContent}
                  onChange={(e) => setQuickCaptureContent(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#333] text-gray-300 text-sm rounded px-3 py-2 mb-3 focus:outline-none focus:border-[#00ff9d] resize-none"
                  rows={4}
                  autoFocus
                  placeholder="Capture your thought..."
                  onKeyDown={(e) => { if (e.key === 'Escape') setIsQuickCaptureOpen(false); }}
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setIsQuickCaptureOpen(false)} className="text-gray-400 hover:text-white text-sm px-3 py-2 rounded transition-colors">Cancel</button>
                  <button onClick={handleQuickCapture} className="bg-[#00ff9d] text-black font-bold rounded px-4 py-2 text-sm hover:bg-[#00e68a] transition-colors">Save</button>
                </div>
              </div>
            )}
            <button
              onClick={() => setIsQuickCaptureOpen(!isQuickCaptureOpen)}
              className="w-12 h-12 rounded-full bg-[#00ff9d] text-black shadow-[0_0_20px_rgba(0,255,157,0.4)] hover:shadow-[0_0_30px_rgba(0,255,157,0.6)] flex items-center justify-center transition-all hover:scale-110"
              title="Quick Capture"
            >
              <ICONS.Bolt />
            </button>
          </div>
        )}

        {isQuickCaptureOpen && view === 'editor' && (
          <div className="fixed inset-0 z-20" onClick={() => setIsQuickCaptureOpen(false)}></div>
        )}
      </main>
      
      <style>{`
        @keyframes indeterminate-progress {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(20%); }
            100% { transform: translateX(100%); }
        }
        .animate-indeterminate-progress {
            animation: indeterminate-progress 1.5s infinite linear;
        }
        @keyframes bounce-in {
            0% { transform: scale(0.8); opacity: 0; }
            60% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in {
            animation: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>
    </div>
  );
};

export default App;