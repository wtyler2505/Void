import React, { useState, useMemo } from 'react';
import { Note, AppView } from '../types';
import { ICONS } from '../constants';
import { formatTime } from '../utils';

interface SidebarProps {
  notes: Note[];
  activeNoteId: string | null;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  onDeleteNote: (id: string) => void;
  onOpenChat: () => void;
  onToggleLive: () => void;
  onOpenSync: () => void;
  onFuseNotes?: (sourceId: string, targetId: string) => void;
  currentView: AppView;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  notes, activeNoteId, onSelectNote, onCreateNote, onDeleteNote, onOpenChat, onToggleLive, onOpenSync, onFuseNotes, currentView, isOpen, onClose 
}) => {
  const [search, setSearch] = useState('');
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [isFusionMode, setIsFusionMode] = useState(false);
  const [fusionSourceId, setFusionSourceId] = useState<string | null>(null);

  const filteredNotes = useMemo(() => {
    if (!search) return notes;
    const lower = search.toLowerCase();
    return notes.filter(n => 
      n.title.toLowerCase().includes(lower) || 
      n.content.toLowerCase().includes(lower) ||
      n.tags.some(t => t.toLowerCase().includes(lower))
    );
  }, [notes, search]);

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
        
        <div className="relative mb-4">
          <input 
            type="text" 
            placeholder="Search..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-[#00ff9d] transition-colors"
          />
        </div>

        <div className="grid grid-cols-4 gap-2">
            <button onClick={onCreateNote} className="flex items-center justify-center gap-2 bg-[#1a1a1a] hover:bg-[#222] text-white py-2 rounded border border-[#333] transition-all hover:border-[#00ff9d] text-sm group" title="New Note"><ICONS.Plus /></button>
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
        {filteredNotes.map(note => (
          <div 
            key={note.id}
            draggable={!isFusionMode}
            onDragStart={(e) => handleDragStart(e, note.id)}
            onDragOver={(e) => handleDragOver(e, note.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, note.id)}
            onClick={() => handleNoteClick(note.id)}
            className={`group p-4 border-b border-[#111] cursor-pointer hover:bg-[#111] transition-all relative 
                ${activeNoteId === note.id && !isFusionMode ? 'bg-[#111] border-l-2 border-l-[#00ff9d]' : 'border-l-2 border-l-transparent'}
                ${dragOverId === note.id ? 'bg-[#0f0] bg-opacity-10 border-2 border-dashed border-[#00ff9d]' : ''}
                ${isFusionMode && fusionSourceId === note.id ? 'bg-[#002b1f] border-2 border-[#00ff9d]' : ''}
                ${isFusionMode && fusionSourceId !== note.id ? 'hover:border-[#00ff9d] hover:border-dashed border-2 border-transparent' : ''}
            `}
          >
            <div className="flex justify-between items-start mb-1">
              <h3 className={`font-bold truncate max-w-[80%] ${activeNoteId === note.id ? 'text-[#00ff9d]' : 'text-gray-300'} ${dragOverId === note.id ? 'animate-pulse' : ''}`}>
                {note.title || 'Untitled'}
              </h3>
              {!isFusionMode && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteNote(note.id); }}
                    className="md:opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500 transition-opacity p-1"
                  >
                    <ICONS.Trash />
                  </button>
              )}
            </div>
            {dragOverId === note.id && (
                 <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10 pointer-events-none">
                     <span className="text-[#00ff9d] font-bold text-xs uppercase tracking-widest flex items-center gap-1"><ICONS.Atom /> FUSE</span>
                 </div>
            )}
            <p className="text-xs text-gray-500 truncate mb-2">
              {note.content.substring(0, 50) || 'Empty...'}
            </p>
            <div className="flex justify-between items-center">
               <span className="text-[10px] text-gray-600 font-mono">{formatTime(note.updatedAt)}</span>
               {note.attachments.length > 0 && <span className="text-[10px] bg-[#1a1a1a] text-gray-400 px-1 rounded">Media</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-[#1a1a1a]">
        <button onClick={onOpenChat} className="w-full flex items-center justify-center gap-2 bg-[#00ff9d] text-black font-bold py-3 rounded hover:bg-[#00cc7d] transition-colors shadow-[0_0_10px_rgba(0,255,157,0.3)]">
            <ICONS.Chat /> AI Assistant
        </button>
      </div>
    </aside>
  );
};