import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Note } from '../types';
import { ICONS } from '../constants';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  onOpenChat: () => void;
  onExport: () => void;
  onArchiveNote: () => void;
  onShowShortcuts: () => void;
  onOpenSync: () => void;
}

interface ActionItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  shortcut?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  notes,
  onSelectNote,
  onCreateNote,
  onOpenChat,
  onExport,
  onArchiveNote,
  onShowShortcuts,
  onOpenSync,
}) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const actions: ActionItem[] = useMemo(() => [
    { id: 'new-note', label: 'New Note', icon: <ICONS.Plus />, action: () => { onCreateNote(); onClose(); }, shortcut: '⌘N' },
    { id: 'open-chat', label: 'Open AI Chat', icon: <ICONS.Chat />, action: () => { onOpenChat(); onClose(); } },
    { id: 'export-note', label: 'Export Note', icon: <ICONS.Download />, action: () => { onExport(); onClose(); }, shortcut: '⌘⇧E' },
    { id: 'archive-note', label: 'Archive Note', icon: <ICONS.Archive />, action: () => { onArchiveNote(); onClose(); } },
    { id: 'show-shortcuts', label: 'Show Shortcuts', icon: <ICONS.Keyboard />, action: () => { onShowShortcuts(); onClose(); }, shortcut: '⌘/' },
    { id: 'sync', label: 'Sync', icon: <ICONS.Cloud />, action: () => { onOpenSync(); onClose(); } },
  ], [onCreateNote, onOpenChat, onExport, onArchiveNote, onShowShortcuts, onOpenSync, onClose]);

  const filteredActions = useMemo(() => {
    if (!query) return actions;
    const q = query.toLowerCase();
    return actions.filter(a => a.label.toLowerCase().includes(q));
  }, [actions, query]);

  const filteredNotes = useMemo(() => {
    const available = notes.filter(n => !n.archived && !n.trashedAt);
    if (!query) return available;
    const q = query.toLowerCase();
    return available.filter(n => n.title.toLowerCase().includes(q));
  }, [notes, query]);

  const totalItems = filteredActions.length + filteredNotes.length;

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    const activeEl = listRef.current?.querySelector('[data-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  const executeItem = (index: number) => {
    if (index < filteredActions.length) {
      filteredActions[index].action();
    } else {
      const noteIndex = index - filteredActions.length;
      if (filteredNotes[noteIndex]) {
        onSelectNote(filteredNotes[noteIndex].id);
        onClose();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => (prev + 1) % totalItems || 0);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => (prev - 1 + totalItems) % totalItems || 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (totalItems > 0) {
          executeItem(activeIndex);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  if (!isOpen) return null;

  let itemIndex = 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/90 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="bg-[#0a0a0a] border border-[#00ff9d] w-full max-w-xl  shadow-[0_0_50px_rgba(0,255,157,0.1)] overflow-hidden flex flex-col max-h-[60vh]"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-3 p-4 border-b border-[#333]">
          <ICONS.Search className="text-[#00ff9d] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a command or search notes..."
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-500 font-mono"
          />
          <kbd className="px-2 py-0.5 bg-[#222] border border-[#333]  text-[10px] font-bold text-gray-500 font-mono shrink-0">ESC</kbd>
        </div>

        <div ref={listRef} className="overflow-y-auto flex-1">
          {filteredActions.length > 0 && (
            <div>
              <div className="px-4 pt-3 pb-1">
                <span className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Actions</span>
              </div>
              {filteredActions.map(action => {
                const currentIndex = itemIndex++;
                const isActive = currentIndex === activeIndex;
                return (
                  <button
                    key={action.id}
                    data-active={isActive}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${isActive ? 'bg-[#111] text-[#00ff9d]' : 'text-gray-300 hover:bg-[#111]'}`}
                    onClick={() => action.action()}
                    onMouseEnter={() => setActiveIndex(currentIndex)}
                  >
                    <span className={isActive ? 'text-[#00ff9d]' : 'text-gray-500'}>{action.icon}</span>
                    <span className="flex-1 text-sm font-mono">{action.label}</span>
                    {action.shortcut && (
                      <kbd className="px-2 py-0.5 bg-[#222] border border-[#333]  text-[10px] text-gray-500 font-mono">{action.shortcut}</kbd>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {filteredNotes.length > 0 && (
            <div>
              <div className="px-4 pt-3 pb-1">
                <span className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">Notes</span>
              </div>
              {filteredNotes.map(note => {
                const currentIndex = itemIndex++;
                const isActive = currentIndex === activeIndex;
                return (
                  <button
                    key={note.id}
                    data-active={isActive}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${isActive ? 'bg-[#111] text-[#00ff9d]' : 'text-gray-300 hover:bg-[#111]'}`}
                    onClick={() => { onSelectNote(note.id); onClose(); }}
                    onMouseEnter={() => setActiveIndex(currentIndex)}
                  >
                    <span className={isActive ? 'text-[#00ff9d]' : 'text-gray-500'}><ICONS.FileText /></span>
                    <span className="flex-1 text-sm font-mono truncate">{note.title || 'Untitled'}</span>
                    <span className="text-[10px] text-gray-600 font-mono shrink-0">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {totalItems === 0 && (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-sm font-mono">No results found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
