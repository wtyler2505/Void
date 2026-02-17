import React from 'react';
import { Note } from '../types';
import { useTheme } from '../ThemeContext';

interface KanbanBoardProps {
  notes: Note[];
  onSelectNote: (id: string) => void;
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
}

export default function KanbanBoard({ notes, onSelectNote, onUpdateNote }: KanbanBoardProps) {
  const { isDark } = useTheme();

  const columns: { key: Note['status']; label: string; color: string }[] = [
    { key: 'todo', label: 'TO DO', color: '#ff6b6b' },
    { key: 'in_progress', label: 'IN PROGRESS', color: '#ffd93d' },
    { key: 'done', label: 'DONE', color: '#00ff9d' },
  ];

  const activeNotes = notes.filter(n => !n.archived && !n.trashedAt);

  const getNotesForColumn = (status: Note['status']) => {
    return activeNotes.filter(n => (n.status || 'todo') === status);
  };

  return (
    <div className="flex-1 h-full overflow-hidden flex flex-col">
      <div className={`px-6 py-4 border-b ${isDark ? 'border-[#1a1a1a]' : 'border-gray-200'}`}>
        <h2 className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-[#00ff9d]' : 'text-green-600'}`}>
          Kanban Board
        </h2>
      </div>
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 h-full min-w-[768px]">
          {columns.map(col => (
            <div key={col.key} className={`flex-1 flex flex-col ${isDark ? 'bg-[#0a0a0a] border-[#1a1a1a]' : 'bg-gray-50 border-gray-200'} border overflow-hidden`}>
              <div className={`px-4 py-3 border-b ${isDark ? 'border-[#1a1a1a]' : 'border-gray-200'} flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }}></div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{col.label}</span>
                </div>
                <span className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{getNotesForColumn(col.key).length}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {getNotesForColumn(col.key).map(note => (
                  <div
                    key={note.id}
                    onClick={() => onSelectNote(note.id)}
                    className={`p-3 border cursor-pointer transition-all hover:translate-x-1 ${isDark ? 'bg-[#111] border-[#222] hover:border-[#00ff9d]/50' : 'bg-white border-gray-200 hover:border-green-400'}`}
                  >
                    <h4 className={`text-sm font-bold truncate mb-1 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                      {note.title || 'Untitled'}
                    </h4>
                    <p className={`text-[10px] line-clamp-2 mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {note.content.substring(0, 100) || 'Empty note'}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1 flex-wrap">
                        {note.tags.slice(0, 2).map(tag => (
                          <span key={tag} className={`text-[8px] px-1.5 py-0.5 ${isDark ? 'bg-[#1a1a1a] text-gray-500' : 'bg-gray-100 text-gray-500'}`}>{tag}</span>
                        ))}
                      </div>
                      <select
                        value={note.status || 'todo'}
                        onChange={(e) => {
                          e.stopPropagation();
                          onUpdateNote(note.id, { status: e.target.value as Note['status'] });
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className={`text-[9px] px-1 py-0.5 ${isDark ? 'bg-[#1a1a1a] border-[#333] text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-600'} border cursor-pointer focus:outline-none`}
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                  </div>
                ))}
                {getNotesForColumn(col.key).length === 0 && (
                  <div className={`text-center py-8 text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'} uppercase tracking-wider`}>
                    No notes
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
