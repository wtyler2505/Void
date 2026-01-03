import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { LiveSession } from './components/LiveSession';
import { Note, AppView, Attachment } from './types';
import { saveNotes, loadNotes } from './services/store';
import { createNewNote } from './utils';
import { ChatOverlay } from './components/ChatOverlay';
import { SyncModal } from './components/SyncModal';
import * as Gemini from './services/gemini';
import { ICONS } from './constants';

const App: React.FC = () => {
  // 1. Robust Lazy Initialization
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = loadNotes();
    if (saved && saved.length > 0) {
      return saved;
    }
    return [createNewNote()]; 
  });

  // 2. Persist Active Note Selection
  const [activeNoteId, setActiveNoteId] = useState<string | null>(() => {
    const savedId = localStorage.getItem('void_active_note');
    const currentNotes = loadNotes(); 
    if (savedId && currentNotes.some(n => n.id === savedId)) return savedId;
    if (currentNotes.length > 0) return currentNotes[0].id;
    return null;
  });

  const [view, setView] = useState<AppView>('editor');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [isFusing, setIsFusing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar state

  const notesRef = useRef(notes);
  useEffect(() => { notesRef.current = notes; }, [notes]);

  // 3. Persistence Effects
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveNotes(notes);
    }, 800);
    return () => clearTimeout(timeoutId);
  }, [notes]);

  useEffect(() => {
    if (activeNoteId) {
      localStorage.setItem('void_active_note', activeNoteId);
    }
  }, [activeNoteId]);

  useEffect(() => {
    const handleBeforeUnload = () => {
        saveNotes(notesRef.current);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  useEffect(() => {
    if (!activeNoteId && notes.length > 0) {
      setActiveNoteId(notes[0].id);
    }
  }, [activeNoteId, notes]);

  const activeNote = notes.find(n => n.id === activeNoteId) || null;

  const handleCreateNote = useCallback(() => {
    const newNote = createNewNote();
    setNotes(prev => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    setIsSidebarOpen(false); // Close mobile sidebar on create
  }, []);

  const handleDeleteNote = useCallback((id: string) => {
    const remaining = notes.filter(n => n.id !== id);
    
    let nextNotes = remaining;
    let nextId = activeNoteId;

    if (remaining.length === 0) {
        const fresh = createNewNote();
        nextNotes = [fresh];
        nextId = fresh.id;
    } else if (id === activeNoteId) {
        nextId = remaining[0].id;
    }

    setNotes(nextNotes);
    if (nextId !== activeNoteId) {
        setActiveNoteId(nextId);
    }
  }, [notes, activeNoteId]);

  const handleUpdateNote = useCallback((id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n));
  }, []);

  const handleSelectNote = (id: string) => {
      setActiveNoteId(id);
      setIsSidebarOpen(false); // Close sidebar on selection (mobile)
  };

  // --- Neural Alchemy: Note Fusion ---
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

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#050505] text-gray-200 selection:bg-[#00ff9d] selection:text-black flex-col md:flex-row">
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#0a0a0a] border-b border-[#1a1a1a] z-30 shrink-0">
          <button onClick={() => setIsSidebarOpen(true)} className="text-[#00ff9d]">
              <ICONS.Menu />
          </button>
          <h1 className="text-xl font-bold tracking-tighter text-[#00ff9d] neon-text">VOID</h1>
          <div className="w-5"></div> {/* Spacer for center alignment */}
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
            onDeleteNote={handleDeleteNote}
            onOpenChat={() => { setIsChatOpen(true); setIsSidebarOpen(false); }}
            onToggleLive={() => { setView(v => v === 'live' ? 'editor' : 'live'); setIsSidebarOpen(false); }}
            onOpenSync={() => { setIsSyncOpen(true); setIsSidebarOpen(false); }}
            onFuseNotes={handleFuseNotes}
            currentView={view}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
      </div>

      {/* Mobile Backdrop */}
      {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/80 z-30 md:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
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

        {view === 'editor' && activeNote ? (
          <Editor 
            note={activeNote} 
            onUpdate={(updates) => handleUpdateNote(activeNote.id, updates)} 
          />
        ) : view === 'editor' && !activeNote ? (
          <div className="flex-1 flex items-center justify-center text-gray-600">
            <p>Initializing Void...</p>
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
      `}</style>
    </div>
  );
};

export default App;