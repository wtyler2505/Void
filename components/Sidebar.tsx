import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Note, AppView } from '../types';
import { ICONS } from '../constants';
import { formatTime, NOTE_TEMPLATES, getTagColor, getDailyPrompt } from '../utils';
import { useTheme } from '../ThemeContext';

interface SidebarProps {
  notes: Note[];
  activeNoteId: string | null;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  onCreateNoteFromTemplate: (title: string, content: string) => void;
  onDeleteNote: (id: string) => void;
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
  onArchiveNote: (id: string) => void;
  onRestoreNote: (id: string) => void;
  onTrashNote: (id: string) => void;
  onRestoreFromTrash: (id: string) => void;
  onEmptyTrash: () => void;
  onOpenChat: () => void;
  onToggleLive: () => void;
  onOpenSync: () => void;
  onFuseNotes?: (sourceId: string, targetId: string) => void;
  onShowShortcuts?: () => void;
  currentView: AppView;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  notes, activeNoteId, onSelectNote, onCreateNote, onCreateNoteFromTemplate, onDeleteNote, onUpdateNote, onArchiveNote, onRestoreNote, onTrashNote, onRestoreFromTrash, onEmptyTrash, onOpenChat, onToggleLive, onOpenSync, onFuseNotes, onShowShortcuts, currentView, isOpen, onClose 
}) => {
  const { isDark, toggleTheme, accentColor, setAccentColor } = useTheme();
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [isFusionMode, setIsFusionMode] = useState(false);
  const [fusionSourceId, setFusionSourceId] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'alphabetical' | 'size'>('updated');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [showThemeEditor, setShowThemeEditor] = useState(false);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set());
  const [viewDensity, setViewDensity] = useState<'compact' | 'comfortable'>(() => {
    return (localStorage.getItem('void_density') as 'compact' | 'comfortable') || 'comfortable';
  });
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const templateRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  const storageSize = useMemo(() => {
    const jsonStr = JSON.stringify(notes);
    const bytes = new Blob([jsonStr]).size;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }, [notes]);

  const noteCount = notes.filter(n => !n.archived && !n.trashedAt).length;
  const archivedCount = notes.filter(n => n.archived && !n.trashedAt).length;
  const trashedCount = notes.filter(n => !!n.trashedAt).length;

  useEffect(() => {
    localStorage.setItem('void_density', viewDensity);
  }, [viewDensity]);

  useEffect(() => {
    setFocusedIndex(-1);
  }, [search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (templateRef.current && !templateRef.current.contains(e.target as Node)) {
        setIsTemplateOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
    };
    if (isTemplateOpen || isSortOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isTemplateOpen, isSortOpen]);

  // Collect all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    notes.filter(n => !n.archived && !n.trashedAt).forEach(n => n.tags.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [notes]);

  const { activeNotes, archivedNotes, trashedNotes } = useMemo(() => {
    let res = [...notes];
    
    // 1. Tag Filter
    if (tagFilter) {
      res = res.filter(n => n.tags.includes(tagFilter));
    }

    // 2. Search
    if (search) {
      const lower = search.toLowerCase();
      res = res.filter(n => 
        n.title.toLowerCase().includes(lower) || 
        n.content.toLowerCase().includes(lower) ||
        n.tags.some(t => t.toLowerCase().includes(lower))
      );
    }

    // Split into active, archived, and trashed
    const active = res.filter(n => !n.archived && !n.trashedAt);
    const archived = res.filter(n => n.archived && !n.trashedAt);
    const trashed = res.filter(n => !!n.trashedAt);

    // Sort Active: Pinned first, then by selected sort
    active.sort((a, b) => {
        const aPinned = !!a.pinned;
        const bPinned = !!b.pinned;
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        
        switch (sortBy) {
          case 'updated':
            return b.updatedAt - a.updatedAt;
          case 'created':
            return b.createdAt - a.createdAt;
          case 'alphabetical':
            return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
          case 'size':
            return b.content.length - a.content.length;
          default:
            return b.updatedAt - a.updatedAt;
        }
    });

    // Sort Archived: Most recently archived/updated first
    archived.sort((a, b) => (b.archivedAt || b.updatedAt) - (a.archivedAt || a.updatedAt));

    // Sort Trashed: Most recently trashed first
    trashed.sort((a, b) => (b.trashedAt || b.updatedAt) - (a.trashedAt || a.updatedAt));

    return { activeNotes: active, archivedNotes: archived, trashedNotes: trashed };
  }, [notes, search, tagFilter, sortBy]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
      e.dataTransfer.setData('text/plain', id);
      e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
      e.preventDefault();
      if (id !== dragOverId) setDragOverId(id);
  };

  const handleDragLeave = (e: React.DragEvent) => {
      // e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      setDragOverId(null);
      const sourceId = e.dataTransfer.getData('text/plain');
      if (sourceId && sourceId !== targetId && onFuseNotes) {
          onFuseNotes(sourceId, targetId);
      }
  };

  const toggleNoteSelection = (id: string) => {
    setSelectedNoteIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleNoteClick = (id: string) => {
      if (isMultiSelectMode) {
        toggleNoteSelection(id);
        return;
      }
      if (isFusionMode) {
          if (!fusionSourceId) {
              setFusionSourceId(id);
          } else {
              if (id !== fusionSourceId && onFuseNotes) {
                  onFuseNotes(fusionSourceId, id);
                  setIsFusionMode(false);
                  setFusionSourceId(null);
              } else {
                  setFusionSourceId(null);
              }
          }
      } else {
          onSelectNote(id);
      }
  };

  const handleAddTag = (noteId: string, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && tagInput.trim()) {
          const note = notes.find(n => n.id === noteId);
          if (note) {
              const newTag = tagInput.trim().replace(/^#/, ''); // Remove # if user typed it
              if (!note.tags.includes(newTag)) {
                  onUpdateNote(noteId, { tags: [...note.tags, newTag] });
              }
              setTagInput('');
          }
      }
  };

  const handleRemoveTag = (noteId: string, tag: string) => {
      const note = notes.find(n => n.id === noteId);
      if (note) {
          onUpdateNote(noteId, { tags: note.tags.filter(t => t !== tag) });
      }
  };

  const handleKeyNavigation = (e: React.KeyboardEvent) => {
    const noteList = activeNotes;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => Math.min(prev + 1, noteList.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && focusedIndex >= 0 && focusedIndex < noteList.length) {
      e.preventDefault();
      onSelectNote(noteList[focusedIndex].id);
    }
  };

  return (
    <aside role="navigation" aria-label="Note sidebar" className={`w-full h-full flex flex-col ${isDark ? 'bg-[#0a0a0a]' : 'bg-white'} z-10`}>
      {/* Header */}
      <div className={`p-4 border-b ${isDark ? 'border-[#1a1a1a]' : 'border-gray-200'}`}>
        <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold tracking-tighter neon-text hidden md:block" style={{ color: accentColor }}>VOID</h1>
            {/* Mobile Close Button */}
            <div className="md:hidden flex items-center gap-2 text-[#00ff9d] font-bold">
                 <ICONS.Sparkle /> MENU
            </div>
            {onClose && (
                <button onClick={onClose} className="md:hidden text-gray-500 p-2">
                    <ICONS.Close />
                </button>
            )}
        </div>
        
        <div className="flex gap-2 mb-4">
          <input 
            id="sidebar-search"
            type="text" 
            placeholder="Search... (Ctrl+F)" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search notes"
            className={`flex-1 ${isDark ? 'bg-[#111] border-[#333] text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-700'} border rounded px-3 py-2 text-sm focus:outline-none focus:border-[#00ff9d] transition-colors`}
          />
          <div className="relative" ref={sortRef}>
            <button
              onClick={() => setIsSortOpen(!isSortOpen)}
              className={`px-3 py-2 ${isDark ? 'bg-[#1a1a1a] border-[#333]' : 'bg-gray-100 border-gray-300'} border rounded hover:border-[#00ff9d] transition-all flex items-center justify-center ${isSortOpen ? 'border-[#00ff9d]' : ''}`}
              title="Sort"
              aria-label="Sort notes"
              aria-expanded={isSortOpen}
            >
              <ICONS.Sort className="w-4 h-4" />
            </button>
            {isSortOpen && (
              <div className={`absolute top-full right-0 mt-1 w-48 ${isDark ? 'bg-[#111] border-[#333] shadow-black/50' : 'bg-white border-gray-200 shadow-gray-300/50'} border rounded shadow-lg z-50 py-1`}>
                <button
                  onClick={() => { setSortBy('updated'); setIsSortOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${sortBy === 'updated' ? `text-[#00ff9d] ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'}` : `${isDark ? 'text-gray-400 hover:text-gray-300 hover:bg-[#0a0a0a]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}`}
                >
                  <span>Last Updated</span>
                  {sortBy === 'updated' && <span className="text-[#00ff9d]">•</span>}
                </button>
                <button
                  onClick={() => { setSortBy('created'); setIsSortOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${sortBy === 'created' ? `text-[#00ff9d] ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'}` : `${isDark ? 'text-gray-400 hover:text-gray-300 hover:bg-[#0a0a0a]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}`}
                >
                  <span>Recently Created</span>
                  {sortBy === 'created' && <span className="text-[#00ff9d]">•</span>}
                </button>
                <button
                  onClick={() => { setSortBy('alphabetical'); setIsSortOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${sortBy === 'alphabetical' ? `text-[#00ff9d] ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'}` : `${isDark ? 'text-gray-400 hover:text-gray-300 hover:bg-[#0a0a0a]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}`}
                >
                  <span>Alphabetical (A-Z)</span>
                  {sortBy === 'alphabetical' && <span className="text-[#00ff9d]">•</span>}
                </button>
                <button
                  onClick={() => { setSortBy('size'); setIsSortOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${sortBy === 'size' ? `text-[#00ff9d] ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'}` : `${isDark ? 'text-gray-400 hover:text-gray-300 hover:bg-[#0a0a0a]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}`}
                >
                  <span>Content Length</span>
                  {sortBy === 'size' && <span className="text-[#00ff9d]">•</span>}
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => setViewDensity(d => d === 'compact' ? 'comfortable' : 'compact')}
            className={`px-3 py-2 ${isDark ? 'bg-[#1a1a1a] border-[#333]' : 'bg-gray-100 border-gray-300'} border rounded hover:border-[#00ff9d] transition-all flex items-center justify-center text-gray-400 hover:text-[#00ff9d]`}
            title={viewDensity === 'compact' ? 'Comfortable view' : 'Compact view'}
            aria-label={viewDensity === 'compact' ? 'Comfortable view' : 'Compact view'}
          >
            {viewDensity === 'compact' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
            )}
          </button>
          <button
            onClick={() => { setIsMultiSelectMode(!isMultiSelectMode); setSelectedNoteIds(new Set()); }}
            className={`px-3 py-2 border rounded transition-all flex items-center justify-center ${isMultiSelectMode ? 'bg-[#002b1f] border-[#00ff9d] text-[#00ff9d]' : `${isDark ? 'bg-[#1a1a1a] border-[#333]' : 'bg-gray-100 border-gray-300'} hover:border-[#00ff9d] text-gray-400 hover:text-[#00ff9d]`}`}
            title="Multi-select"
            aria-label="Multi-select"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
          </button>
        </div>

        {/* Tag Filter Bar */}
        {allTags.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
                <button 
                    onClick={() => setTagFilter(null)}
                    className={`shrink-0 px-2 py-1 rounded text-[10px] uppercase font-bold border transition-colors ${!tagFilter ? 'bg-[#00ff9d] text-black border-[#00ff9d]' : `${isDark ? 'bg-[#111] border-[#333]' : 'bg-gray-100 border-gray-300'} text-gray-500`}`}
                >
                    All
                </button>
                {allTags.map(tag => {
                  const tagColor = getTagColor(tag);
                  return (
                    <button 
                        key={tag}
                        onClick={() => setTagFilter(tag === tagFilter ? null : tag)}
                        className={`shrink-0 px-2 py-1 rounded text-[10px] border transition-colors ${tagFilter === tag ? 'text-white border-2' : `${isDark ? 'bg-[#111] border-[#333]' : 'bg-gray-100 border-gray-300'} text-gray-400 hover:border-gray-500`}`}
                        style={{
                          borderColor: tagFilter === tag ? tagColor : undefined,
                          backgroundColor: tagFilter === tag ? `${tagColor}20` : undefined,
                          color: tagFilter === tag ? tagColor : undefined,
                        }}
                    >
                        #{tag}
                    </button>
                  );
                })}
            </div>
        )}

        <div className="grid grid-cols-4 gap-2">
            <div className="relative flex" ref={templateRef}>
                <button onClick={onCreateNote} aria-label="Create new note" className={`flex-1 flex items-center justify-center ${isDark ? 'bg-[#1a1a1a] hover:bg-[#222] border-[#333] text-white' : 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-800'} py-2 rounded-l border border-r-0 transition-all hover:border-[#00ff9d] text-sm group`} title="New Note (Ctrl+N)"><ICONS.Plus /></button>
                <button onClick={() => setIsTemplateOpen(!isTemplateOpen)} aria-label="New from template" aria-expanded={isTemplateOpen} className={`flex items-center justify-center px-1 ${isDark ? 'bg-[#1a1a1a] hover:bg-[#222] border-[#333]' : 'bg-gray-100 hover:bg-gray-200 border-gray-300'} text-gray-500 py-2 rounded-r border transition-all hover:border-[#00ff9d] hover:text-[#00ff9d] text-[10px] ${isTemplateOpen ? 'border-[#00ff9d] text-[#00ff9d]' : ''}`} title="New from Template">▼</button>
                {isTemplateOpen && (
                    <div className={`absolute top-full left-0 mt-1 w-56 ${isDark ? 'bg-[#111] border-[#333] shadow-black/50' : 'bg-white border-gray-200 shadow-gray-300/50'} border rounded shadow-lg z-50 py-1`}>
                        <div className={`px-3 py-2 text-[10px] text-gray-500 uppercase tracking-widest border-b ${isDark ? 'border-[#222]' : 'border-gray-200'}`}>Templates</div>
                        {NOTE_TEMPLATES.map(template => (
                            <button
                                key={template.id}
                                onClick={() => {
                                    onCreateNoteFromTemplate(template.name, template.content);
                                    setIsTemplateOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm ${isDark ? 'text-gray-300 hover:bg-[#1a1a1a]' : 'text-gray-600 hover:bg-gray-50'} hover:border-l-2 hover:border-l-[#00ff9d] hover:text-[#00ff9d] transition-all border-l-2 border-l-transparent`}
                            >
                                <span className="text-base">{template.icon}</span>
                                <span>{template.name}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <button onClick={() => { setIsFusionMode(!isFusionMode); setFusionSourceId(null); }} aria-label="Neural Fusion" className={`flex items-center justify-center gap-2 py-2 rounded border transition-all text-sm ${isFusionMode ? 'bg-[#002b1f] border-[#00ff9d] text-[#00ff9d] animate-pulse' : `${isDark ? 'bg-[#1a1a1a] hover:bg-[#222] border-[#333]' : 'bg-gray-100 hover:bg-gray-200 border-gray-300'} text-gray-300 hover:text-[#00ff9d]`}`} title="Neural Fusion"><ICONS.Atom /></button>
             <button onClick={onToggleLive} aria-label="Live session" className={`flex items-center justify-center gap-2 py-2 rounded border transition-all text-sm ${currentView === 'live' ? 'bg-[#2a002a] border-[#ff00ff] text-[#ff00ff]' : `${isDark ? 'bg-[#1a1a1a] hover:bg-[#222] border-[#333]' : 'bg-gray-100 hover:bg-gray-200 border-gray-300'} text-gray-300 hover:text-[#ff00ff]`}`} title="Live"><ICONS.Live /></button>
            <button onClick={onOpenSync} aria-label="Sync" className={`flex items-center justify-center gap-2 ${isDark ? 'bg-[#1a1a1a] hover:bg-[#222] border-[#333] text-white' : 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-800'} py-2 rounded border transition-all hover:border-blue-400 text-sm hover:text-blue-400`} title="Sync"><ICONS.Cloud /></button>
        </div>
        
        {isFusionMode && (
            <div className="mt-2 text-[10px] text-[#00ff9d] text-center uppercase tracking-widest bg-[#002b1f] py-1 rounded">
                {fusionSourceId ? "Select Target" : "Select Source"}
            </div>
        )}

        <button 
          onClick={() => {
            const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
            const prompt = getDailyPrompt();
            onCreateNoteFromTemplate(
              `Journal — ${today}`,
              `## ${today}\n\n**Prompt:** *${prompt}*\n\n`
            );
          }}
          className={`w-full flex items-center gap-2 px-3 py-2 mt-2 mb-2 text-sm text-gray-400 hover:text-[#ffd93d] ${isDark ? 'bg-[#1a1a1a] border-[#333]' : 'bg-gray-100 border-gray-300'} border rounded hover:border-[#ffd93d] transition-all`}
        >
          <span>📔</span>
          <span className="flex-1 text-left">Daily Journal</span>
          <span className="text-[10px] text-gray-600 truncate max-w-[120px]">{getDailyPrompt().substring(0, 25)}...</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" role="listbox" aria-label="Notes list" onKeyDown={handleKeyNavigation} tabIndex={0}>
        {activeNotes.length > 3 && (
          <div className={`px-4 py-2 border-b ${isDark ? 'border-[#111]' : 'border-gray-100'}`}>
            <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-1.5">Recent</div>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {[...activeNotes].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5).map(n => (
                <button
                  key={n.id}
                  onClick={() => onSelectNote(n.id)}
                  className={`shrink-0 px-2.5 py-1 rounded text-[10px] border transition-all truncate max-w-[120px] ${
                    activeNoteId === n.id 
                      ? 'bg-[#00ff9d]/10 border-[#00ff9d]/50 text-[#00ff9d]' 
                      : `${isDark ? 'bg-[#111] border-[#222]' : 'bg-gray-100 border-gray-200'} text-gray-400 hover:border-[#333] hover:text-gray-300`
                  }`}
                >
                  {n.title || 'Untitled'}
                </button>
              ))}
            </div>
          </div>
        )}

        {isMultiSelectMode && selectedNoteIds.size > 0 && (
          <div className={`flex items-center gap-2 p-2 ${isDark ? 'bg-[#0a0a0a] border-[#1a1a1a]' : 'bg-white border-gray-200'} border-b`}>
            <span className="text-[10px] text-[#00ff9d] font-mono">{selectedNoteIds.size} selected</span>
            <button
              onClick={() => {
                const allSelected = activeNotes.every(n => selectedNoteIds.has(n.id));
                if (allSelected) {
                  setSelectedNoteIds(new Set());
                } else {
                  setSelectedNoteIds(new Set(activeNotes.map(n => n.id)));
                }
              }}
              className="px-2 py-1 text-[10px] text-gray-400 hover:text-[#00ff9d] transition-colors"
            >
              {activeNotes.every(n => selectedNoteIds.has(n.id)) ? 'Deselect All' : 'Select All'}
            </button>
            <div className="flex-1"></div>
            <button 
              onClick={() => { selectedNoteIds.forEach(id => onArchiveNote(id)); setSelectedNoteIds(new Set()); setIsMultiSelectMode(false); }}
              className="px-2 py-1 text-[10px] text-gray-400 hover:text-white border border-[#333] rounded hover:border-gray-400 transition-colors"
              title="Archive selected"
            >
              <ICONS.Archive />
            </button>
            <button 
              onClick={() => { selectedNoteIds.forEach(id => onTrashNote(id)); setSelectedNoteIds(new Set()); setIsMultiSelectMode(false); }}
              className="px-2 py-1 text-[10px] text-red-500/70 hover:text-red-400 border border-[#333] rounded hover:border-red-500/50 transition-colors"
              title="Trash selected"
            >
              <ICONS.Trash />
            </button>
            <button 
              onClick={() => { setSelectedNoteIds(new Set()); }}
              className="px-2 py-1 text-[10px] text-gray-500 hover:text-white transition-colors"
            >
              Clear
            </button>
          </div>
        )}

        {/* Active Notes List */}
        {activeNotes.length === 0 && !search && (
            <div className="p-8 text-center text-gray-600 text-xs uppercase tracking-widest">No active signals</div>
        )}
        {activeNotes.map((note, idx) => {
          const isPinned = !!note.pinned;
          const showSeparator = isPinned && activeNotes[idx + 1] && !activeNotes[idx + 1].pinned;

          return (
            <React.Fragment key={note.id}>
              <div 
                role="option"
                aria-selected={activeNoteId === note.id}
                draggable={!isFusionMode}
                onDragStart={(e) => handleDragStart(e, note.id)}
                onDragOver={(e) => handleDragOver(e, note.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, note.id)}
                onClick={() => handleNoteClick(note.id)}
                className={`group ${viewDensity === 'compact' ? 'p-2' : 'p-4'} border-b ${isDark ? 'border-[#111]' : 'border-gray-100'} cursor-pointer ${isDark ? 'hover:bg-[#111]' : 'hover:bg-gray-50'} transition-all relative flex flex-col ${viewDensity === 'compact' ? 'gap-1' : 'gap-2'} animate-fade-in
                    ${activeNoteId === note.id && !isFusionMode ? `${isDark ? 'bg-[#111]' : 'bg-gray-50'} border-l-2 border-l-[#00ff9d]` : 'border-l-2 border-l-transparent'}
                    ${dragOverId === note.id ? 'bg-[#0f0] bg-opacity-10 border-2 border-dashed border-[#00ff9d]' : ''}
                    ${isFusionMode && fusionSourceId === note.id ? 'bg-[#002b1f] border-2 border-[#00ff9d]' : ''}
                    ${isFusionMode && fusionSourceId !== note.id ? 'hover:border-[#00ff9d] hover:border-dashed border-2 border-transparent' : ''}
                    ${focusedIndex === idx ? 'ring-1 ring-[#00ff9d]/50' : ''}
                `}
                style={{ animationDelay: `${idx * 0.02}s` }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2 max-w-[70%]">
                     {isMultiSelectMode && (
                       <input 
                         type="checkbox" 
                         checked={selectedNoteIds.has(note.id)}
                         onChange={() => toggleNoteSelection(note.id)}
                         onClick={(e) => e.stopPropagation()}
                         className="accent-[#00ff9d] w-4 h-4 shrink-0"
                       />
                     )}
                     {idx < 9 && !isMultiSelectMode && <span className="text-[9px] font-mono text-gray-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">^{idx + 1}</span>}
                     <h3 className={`font-bold truncate ${activeNoteId === note.id ? 'text-[#00ff9d]' : 'text-gray-300'} ${dragOverId === note.id ? 'animate-pulse' : ''} ${isMultiSelectMode && selectedNoteIds.has(note.id) ? 'text-[#00ff9d]' : ''}`}>
                        {note.title || 'Untitled'}
                     </h3>
                  </div>
                  {!isFusionMode && (
                      <div className="flex items-center gap-1">
                          <button 
                              onClick={(e) => { e.stopPropagation(); onUpdateNote(note.id, { pinned: !note.pinned }); }}
                              className={`p-1 hover:text-[#00ff9d] transition-colors ${isPinned ? 'text-[#00ff9d]' : 'text-gray-600 opacity-0 group-hover:opacity-100'}`}
                              title={isPinned ? "Unpin" : "Pin"}
                          >
                              <ICONS.Pin className={isPinned ? "fill-[#00ff9d]/20" : ""} />
                          </button>
                          {note.reminder && (
                            <span className="text-[#ff9f43]" title={`Reminder: ${new Date(note.reminder).toLocaleString()}`}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path></svg>
                            </span>
                          )}
                          <button 
                            onClick={(e) => { e.stopPropagation(); onArchiveNote(note.id); }}
                            className="md:opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white transition-opacity p-1"
                            title="Archive"
                          >
                            <ICONS.Archive />
                          </button>
                      </div>
                  )}
                </div>
                
                {viewDensity === 'comfortable' && (
                  <p className="text-xs text-gray-500 truncate">
                    {note.content.substring(0, 50) || 'Empty...'}
                  </p>
                )}

                {(note.tags.length > 0 || activeNoteId === note.id) && (
                     <div className={`flex flex-wrap gap-1 items-center ${viewDensity === 'compact' ? '' : 'mt-1'}`}>
                         {note.tags.map(tag => {
                           const tagColor = getTagColor(tag);
                           return (
                             <span 
                               key={tag} 
                               className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] border transition-colors"
                               style={{
                                 borderColor: tagColor,
                                 backgroundColor: `${tagColor}15`,
                                 color: tagColor,
                               }}
                             >
                                 #{tag}
                                 {activeNoteId === note.id && (
                                     <button onClick={(e) => { e.stopPropagation(); handleRemoveTag(note.id, tag); }} className="hover:opacity-70 transition-opacity">×</button>
                                 )}
                             </span>
                           );
                         })}
                         {activeNoteId === note.id && !isFusionMode && (
                             <input 
                                type="text"
                                placeholder="+Tag"
                                className="bg-transparent border-b border-[#333] text-[9px] text-[#00ff9d] w-12 focus:w-20 focus:outline-none focus:border-[#00ff9d] transition-all"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => handleAddTag(note.id, e)}
                                onClick={(e) => e.stopPropagation()}
                             />
                         )}
                     </div>
                )}

                {dragOverId === note.id && (
                     <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10 pointer-events-none">
                         <span className="text-[#00ff9d] font-bold text-xs uppercase tracking-widest flex items-center gap-1"><ICONS.Atom /> FUSE</span>
                     </div>
                )}
                
                <div className={`flex justify-between items-center ${viewDensity === 'compact' ? '' : 'mt-1'}`}>
                   <span className={`${viewDensity === 'compact' ? 'text-[8px]' : 'text-[10px]'} text-gray-600 font-mono`}>{formatTime(note.updatedAt)}</span>
                   {note.attachments.length > 0 && <span className={`text-[10px] ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'} text-gray-400 px-1 rounded`}>Media</span>}
                </div>
              </div>
              
              {showSeparator && (
                  <div className="flex items-center gap-4 px-4 py-2 opacity-50">
                       <div className={`h-[1px] ${isDark ? 'bg-[#333]' : 'bg-gray-300'} flex-1`}></div>
                       <ICONS.Pin className={`w-3 h-3 ${isDark ? 'text-[#333]' : 'text-gray-300'}`} />
                       <div className={`h-[1px] ${isDark ? 'bg-[#333]' : 'bg-gray-300'} flex-1`}></div>
                  </div>
              )}
            </React.Fragment>
          );
        })}

        {/* Archived Section */}
        {archivedNotes.length > 0 && (
            <div className={`mt-4 border-t ${isDark ? 'border-[#1a1a1a]' : 'border-gray-200'}`}>
                <button 
                    onClick={() => setIsArchiveOpen(!isArchiveOpen)}
                    className={`w-full flex items-center justify-between p-3 text-xs text-gray-500 hover:text-gray-300 ${isDark ? 'hover:bg-[#111]' : 'hover:bg-gray-50'} transition-colors uppercase tracking-wider`}
                >
                    <span>Archived ({archivedNotes.length})</span>
                    <span className={`transform transition-transform ${isArchiveOpen ? 'rotate-180' : ''}`}>▼</span>
                </button>
                
                {isArchiveOpen && archivedNotes.map(note => (
                    <div 
                        key={note.id}
                        className={`group p-3 border-b ${isDark ? 'border-[#111] bg-[#0c0c0c] hover:bg-[#111]' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'} relative flex flex-col gap-1 opacity-60 hover:opacity-100 transition-all cursor-default`}
                    >
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-gray-400 truncate text-sm">{note.title || 'Untitled'}</h3>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onRestoreNote(note.id); }}
                                    className="p-1 text-gray-500 hover:text-[#00ff9d]"
                                    title="Restore"
                                >
                                    <ICONS.Restore />
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onTrashNote(note.id); }}
                                    className="p-1 text-gray-500 hover:text-red-500"
                                    title="Move to Trash"
                                >
                                    <ICONS.Trash />
                                </button>
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-600 truncate">{note.content.substring(0, 40) || 'Empty...'}</p>
                    </div>
                ))}
            </div>
        )}

        {trashedNotes.length > 0 && (
            <div className={`mt-4 border-t ${isDark ? 'border-[#1a1a1a]' : 'border-gray-200'}`}>
                <button 
                    onClick={() => setIsTrashOpen(!isTrashOpen)}
                    className={`w-full flex items-center justify-between p-3 text-xs text-red-500/70 hover:text-red-400 ${isDark ? 'hover:bg-[#111]' : 'hover:bg-gray-50'} transition-colors uppercase tracking-wider`}
                >
                    <span className="flex items-center gap-2"><ICONS.Trash className="w-3.5 h-3.5" /> Trash ({trashedNotes.length})</span>
                    <span className={`transform transition-transform ${isTrashOpen ? 'rotate-180' : ''}`}>▼</span>
                </button>
                
                {isTrashOpen && (
                    <>
                        <button
                            onClick={() => {
                                if (window.confirm('Permanently delete all trashed notes? This cannot be undone.')) {
                                    onEmptyTrash();
                                }
                            }}
                            className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-[10px] text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors uppercase tracking-widest border-b ${isDark ? 'border-[#1a1a1a]' : 'border-gray-200'}`}
                        >
                            <ICONS.Trash className="w-3 h-3" /> Empty Trash
                        </button>
                        {trashedNotes.map(note => (
                            <div 
                                key={note.id}
                                className={`group p-3 border-b ${isDark ? 'border-[#111] bg-[#0c0c0c] hover:bg-[#111]' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'} relative flex flex-col gap-1 opacity-60 hover:opacity-100 transition-all cursor-default`}
                            >
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-gray-400 truncate text-sm">{note.title || 'Untitled'}</h3>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onRestoreFromTrash(note.id); }}
                                            className="p-1 text-gray-500 hover:text-[#00ff9d]"
                                            title="Restore"
                                        >
                                            <ICONS.Restore />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); if (window.confirm('Permanently delete this note? This cannot be undone.')) { onDeleteNote(note.id); } }}
                                            className="p-1 text-gray-500 hover:text-red-500"
                                            title="Delete Permanently"
                                        >
                                            <ICONS.Trash />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-600 truncate">{note.content.substring(0, 40) || 'Empty...'}</p>
                            </div>
                        ))}
                    </>
                )}
            </div>
        )}
      </div>

      <div className={`p-4 border-t ${isDark ? 'border-[#1a1a1a]' : 'border-gray-200'} relative`}>
        <div className="flex justify-between items-center text-[10px] text-gray-600 font-mono mb-3 px-1">
          <span>{noteCount} notes{archivedCount > 0 ? ` · ${archivedCount} archived` : ''}{trashedCount > 0 ? ` · ${trashedCount} trashed` : ''}</span>
          <span>{storageSize}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={onOpenChat} aria-label="Open AI Assistant" className="flex-1 flex items-center justify-center gap-2 text-black font-bold py-3 rounded transition-colors" style={{ backgroundColor: accentColor, boxShadow: `0 0 10px ${accentColor}40` }}>
              <ICONS.Chat /> AI Assistant
          </button>
          <button 
            onClick={toggleTheme} 
            className={`p-3 rounded-lg border transition-colors ${isDark ? 'border-[#333] text-gray-400 hover:text-[#ffd93d]' : 'border-gray-300 text-gray-500 hover:text-[#ffd93d]'}`}
            title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {isDark ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            )}
          </button>
          <button 
            onClick={() => setShowThemeEditor(!showThemeEditor)}
            className={`p-3 rounded-lg border transition-colors ${isDark ? 'border-[#333] text-gray-400 hover:text-white' : 'border-gray-300 text-gray-500 hover:text-gray-800'}`}
            title="Theme Editor"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5"></circle><circle cx="17.5" cy="10.5" r=".5"></circle><circle cx="8.5" cy="7.5" r=".5"></circle><circle cx="6.5" cy="12.5" r=".5"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path></svg>
          </button>
          {onShowShortcuts && (
              <button onClick={onShowShortcuts} aria-label="Keyboard shortcuts" className={`w-12 flex items-center justify-center ${isDark ? 'bg-[#1a1a1a] border-[#333]' : 'bg-gray-100 border-gray-300'} border rounded hover:border-[#00ff9d] hover:text-[#00ff9d] transition-colors`} title="Shortcuts (Ctrl+/)">
                  <ICONS.Keyboard />
              </button>
          )}
        </div>
        {showThemeEditor && (
          <div className={`absolute bottom-16 left-4 right-4 z-50 ${isDark ? 'bg-[#111] border-[#333]' : 'bg-white border-gray-200'} border rounded-lg shadow-xl p-4 animate-scale-in`}>
            <div className="flex justify-between items-center mb-3">
              <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-800'}`}>Accent Color</h4>
              <button onClick={() => setShowThemeEditor(false)} className="text-gray-500 hover:text-white"><ICONS.Close /></button>
            </div>
            <div className="grid grid-cols-6 gap-2 mb-3">
              {['#00ff9d', '#00d2ff', '#ff6b6b', '#ffd93d', '#c084fc', '#ff6bcb', '#ff9f43', '#54a0ff', '#01a3a4', '#f368e0', '#10ac84', '#ee5a24'].map(color => (
                <button
                  key={color}
                  onClick={() => setAccentColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${accentColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent'}`}
                  style={{ backgroundColor: color, boxShadow: accentColor === color ? `0 0 12px ${color}` : 'none' }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <label className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'} uppercase`}>Custom:</label>
              <input 
                type="color" 
                value={accentColor} 
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
              />
              <span className={`text-[10px] font-mono ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{accentColor}</span>
            </div>
          </div>
        )}
      </div>
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </aside>
  );
};