import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Note, AppView } from '../types';
import { ICONS } from '../constants';
import { formatTime, NOTE_TEMPLATES, getTagColor } from '../utils';

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
  notes, activeNoteId, onSelectNote, onCreateNote, onCreateNoteFromTemplate, onDeleteNote, onUpdateNote, onArchiveNote, onRestoreNote, onOpenChat, onToggleLive, onOpenSync, onFuseNotes, onShowShortcuts, currentView, isOpen, onClose 
}) => {
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [isFusionMode, setIsFusionMode] = useState(false);
  const [fusionSourceId, setFusionSourceId] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'alphabetical' | 'size'>('updated');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const templateRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

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
    notes.filter(n => !n.archived).forEach(n => n.tags.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [notes]);

  const { activeNotes, archivedNotes } = useMemo(() => {
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

    // Split into active and archived
    const active = res.filter(n => !n.archived);
    const archived = res.filter(n => n.archived);

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

    return { activeNotes: active, archivedNotes: archived };
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

  const handleNoteClick = (id: string) => {
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

  return (
    <aside className="w-full h-full flex flex-col bg-[#0a0a0a] z-10">
      {/* Header */}
      <div className="p-4 border-b border-[#1a1a1a]">
        <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold tracking-tighter text-[#00ff9d] neon-text hidden md:block">VOID</h1>
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
            className="flex-1 bg-[#111] border border-[#333] rounded px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-[#00ff9d] transition-colors"
          />
          <div className="relative" ref={sortRef}>
            <button
              onClick={() => setIsSortOpen(!isSortOpen)}
              className={`px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded hover:border-[#00ff9d] transition-all flex items-center justify-center ${isSortOpen ? 'border-[#00ff9d]' : ''}`}
              title="Sort"
            >
              <ICONS.Sort className="w-4 h-4" />
            </button>
            {isSortOpen && (
              <div className="absolute top-full right-0 mt-1 w-48 bg-[#111] border border-[#333] rounded shadow-lg shadow-black/50 z-50 py-1">
                <button
                  onClick={() => { setSortBy('updated'); setIsSortOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${sortBy === 'updated' ? 'text-[#00ff9d] bg-[#1a1a1a]' : 'text-gray-400 hover:text-gray-300 hover:bg-[#0a0a0a]'}`}
                >
                  <span>Last Updated</span>
                  {sortBy === 'updated' && <span className="text-[#00ff9d]">•</span>}
                </button>
                <button
                  onClick={() => { setSortBy('created'); setIsSortOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${sortBy === 'created' ? 'text-[#00ff9d] bg-[#1a1a1a]' : 'text-gray-400 hover:text-gray-300 hover:bg-[#0a0a0a]'}`}
                >
                  <span>Recently Created</span>
                  {sortBy === 'created' && <span className="text-[#00ff9d]">•</span>}
                </button>
                <button
                  onClick={() => { setSortBy('alphabetical'); setIsSortOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${sortBy === 'alphabetical' ? 'text-[#00ff9d] bg-[#1a1a1a]' : 'text-gray-400 hover:text-gray-300 hover:bg-[#0a0a0a]'}`}
                >
                  <span>Alphabetical (A-Z)</span>
                  {sortBy === 'alphabetical' && <span className="text-[#00ff9d]">•</span>}
                </button>
                <button
                  onClick={() => { setSortBy('size'); setIsSortOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${sortBy === 'size' ? 'text-[#00ff9d] bg-[#1a1a1a]' : 'text-gray-400 hover:text-gray-300 hover:bg-[#0a0a0a]'}`}
                >
                  <span>Content Length</span>
                  {sortBy === 'size' && <span className="text-[#00ff9d]">•</span>}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tag Filter Bar */}
        {allTags.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
                <button 
                    onClick={() => setTagFilter(null)}
                    className={`shrink-0 px-2 py-1 rounded text-[10px] uppercase font-bold border transition-colors ${!tagFilter ? 'bg-[#00ff9d] text-black border-[#00ff9d]' : 'bg-[#111] text-gray-500 border-[#333]'}`}
                >
                    All
                </button>
                {allTags.map(tag => {
                  const tagColor = getTagColor(tag);
                  return (
                    <button 
                        key={tag}
                        onClick={() => setTagFilter(tag === tagFilter ? null : tag)}
                        className={`shrink-0 px-2 py-1 rounded text-[10px] border transition-colors ${tagFilter === tag ? 'text-white border-2' : 'bg-[#111] text-gray-400 border-[#333] hover:border-gray-500'}`}
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
                <button onClick={onCreateNote} className="flex-1 flex items-center justify-center bg-[#1a1a1a] hover:bg-[#222] text-white py-2 rounded-l border border-r-0 border-[#333] transition-all hover:border-[#00ff9d] text-sm group" title="New Note (Ctrl+N)"><ICONS.Plus /></button>
                <button onClick={() => setIsTemplateOpen(!isTemplateOpen)} className={`flex items-center justify-center px-1 bg-[#1a1a1a] hover:bg-[#222] text-gray-500 py-2 rounded-r border border-[#333] transition-all hover:border-[#00ff9d] hover:text-[#00ff9d] text-[10px] ${isTemplateOpen ? 'border-[#00ff9d] text-[#00ff9d]' : ''}`} title="New from Template">▼</button>
                {isTemplateOpen && (
                    <div className="absolute top-full left-0 mt-1 w-56 bg-[#111] border border-[#333] rounded shadow-lg shadow-black/50 z-50 py-1">
                        <div className="px-3 py-2 text-[10px] text-gray-500 uppercase tracking-widest border-b border-[#222]">Templates</div>
                        {NOTE_TEMPLATES.map(template => (
                            <button
                                key={template.id}
                                onClick={() => {
                                    onCreateNoteFromTemplate(template.name, template.content);
                                    setIsTemplateOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:bg-[#1a1a1a] hover:border-l-2 hover:border-l-[#00ff9d] hover:text-[#00ff9d] transition-all border-l-2 border-l-transparent"
                            >
                                <span className="text-base">{template.icon}</span>
                                <span>{template.name}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <button onClick={() => { setIsFusionMode(!isFusionMode); setFusionSourceId(null); }} className={`flex items-center justify-center gap-2 py-2 rounded border transition-all text-sm ${isFusionMode ? 'bg-[#002b1f] border-[#00ff9d] text-[#00ff9d] animate-pulse' : 'bg-[#1a1a1a] hover:bg-[#222] border-[#333] text-gray-300 hover:text-[#00ff9d]'}`} title="Neural Fusion"><ICONS.Atom /></button>
             <button onClick={onToggleLive} className={`flex items-center justify-center gap-2 py-2 rounded border transition-all text-sm ${currentView === 'live' ? 'bg-[#2a002a] border-[#ff00ff] text-[#ff00ff]' : 'bg-[#1a1a1a] hover:bg-[#222] border-[#333] text-gray-300 hover:text-[#ff00ff]'}`} title="Live"><ICONS.Live /></button>
            <button onClick={onOpenSync} className="flex items-center justify-center gap-2 bg-[#1a1a1a] hover:bg-[#222] text-white py-2 rounded border border-[#333] transition-all hover:border-blue-400 text-sm hover:text-blue-400" title="Sync"><ICONS.Cloud /></button>
        </div>
        
        {isFusionMode && (
            <div className="mt-2 text-[10px] text-[#00ff9d] text-center uppercase tracking-widest bg-[#002b1f] py-1 rounded">
                {fusionSourceId ? "Select Target" : "Select Source"}
            </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
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
                draggable={!isFusionMode}
                onDragStart={(e) => handleDragStart(e, note.id)}
                onDragOver={(e) => handleDragOver(e, note.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, note.id)}
                onClick={() => handleNoteClick(note.id)}
                className={`group p-4 border-b border-[#111] cursor-pointer hover:bg-[#111] transition-all relative flex flex-col gap-2
                    ${activeNoteId === note.id && !isFusionMode ? 'bg-[#111] border-l-2 border-l-[#00ff9d]' : 'border-l-2 border-l-transparent'}
                    ${dragOverId === note.id ? 'bg-[#0f0] bg-opacity-10 border-2 border-dashed border-[#00ff9d]' : ''}
                    ${isFusionMode && fusionSourceId === note.id ? 'bg-[#002b1f] border-2 border-[#00ff9d]' : ''}
                    ${isFusionMode && fusionSourceId !== note.id ? 'hover:border-[#00ff9d] hover:border-dashed border-2 border-transparent' : ''}
                `}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2 max-w-[70%]">
                     {idx < 9 && <span className="text-[9px] font-mono text-gray-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">^{idx + 1}</span>}
                     <h3 className={`font-bold truncate ${activeNoteId === note.id ? 'text-[#00ff9d]' : 'text-gray-300'} ${dragOverId === note.id ? 'animate-pulse' : ''}`}>
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
                
                <p className="text-xs text-gray-500 truncate">
                  {note.content.substring(0, 50) || 'Empty...'}
                </p>

                {/* Tag List */}
                {(note.tags.length > 0 || activeNoteId === note.id) && (
                     <div className="flex flex-wrap gap-1 items-center mt-1">
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
                
                <div className="flex justify-between items-center mt-1">
                   <span className="text-[10px] text-gray-600 font-mono">{formatTime(note.updatedAt)}</span>
                   {note.attachments.length > 0 && <span className="text-[10px] bg-[#1a1a1a] text-gray-400 px-1 rounded">Media</span>}
                </div>
              </div>
              
              {showSeparator && (
                  <div className="flex items-center gap-4 px-4 py-2 opacity-50">
                       <div className="h-[1px] bg-[#333] flex-1"></div>
                       <ICONS.Pin className="w-3 h-3 text-[#333]" />
                       <div className="h-[1px] bg-[#333] flex-1"></div>
                  </div>
              )}
            </React.Fragment>
          );
        })}

        {/* Archived Section */}
        {archivedNotes.length > 0 && (
            <div className="mt-4 border-t border-[#1a1a1a]">
                <button 
                    onClick={() => setIsArchiveOpen(!isArchiveOpen)}
                    className="w-full flex items-center justify-between p-3 text-xs text-gray-500 hover:text-gray-300 hover:bg-[#111] transition-colors uppercase tracking-wider"
                >
                    <span>Archived ({archivedNotes.length})</span>
                    <span className={`transform transition-transform ${isArchiveOpen ? 'rotate-180' : ''}`}>▼</span>
                </button>
                
                {isArchiveOpen && archivedNotes.map(note => (
                    <div 
                        key={note.id}
                        className="group p-3 border-b border-[#111] bg-[#0c0c0c] hover:bg-[#111] relative flex flex-col gap-1 opacity-60 hover:opacity-100 transition-all cursor-default"
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
                                    onClick={(e) => { e.stopPropagation(); onDeleteNote(note.id); }}
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
            </div>
        )}
      </div>

      <div className="p-4 border-t border-[#1a1a1a] flex gap-2">
        <button onClick={onOpenChat} className="flex-1 flex items-center justify-center gap-2 bg-[#00ff9d] text-black font-bold py-3 rounded hover:bg-[#00cc7d] transition-colors shadow-[0_0_10px_rgba(0,255,157,0.3)]">
            <ICONS.Chat /> AI Assistant
        </button>
        {onShowShortcuts && (
            <button onClick={onShowShortcuts} className="w-12 flex items-center justify-center bg-[#1a1a1a] border border-[#333] rounded hover:border-[#00ff9d] hover:text-[#00ff9d] transition-colors" title="Shortcuts (Ctrl+/)">
                <ICONS.Keyboard />
            </button>
        )}
      </div>
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </aside>
  );
};