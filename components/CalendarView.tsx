import React, { useState } from 'react';
import { Note } from '../types';
import { useTheme } from '../ThemeContext';

interface CalendarViewProps {
  notes: Note[];
  onSelectNote: (id: string) => void;
}

export default function CalendarView({ notes, onSelectNote }: CalendarViewProps) {
  const { isDark } = useTheme();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const activeNotes = notes.filter(n => !n.archived && !n.trashedAt);
  
  const getNotesForDay = (day: number) => {
    return activeNotes.filter(n => {
      const d = new Date(n.createdAt);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };
  
  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));
  const today = new Date();
  const isToday = (day: number) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  
  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  
  return (
    <div className="flex-1 h-full overflow-hidden flex flex-col">
      <div className={`px-6 py-4 border-b ${isDark ? 'border-[#1a1a1a]' : 'border-gray-200'} flex items-center justify-between`}>
        <h2 className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-[#00ff9d]' : 'text-green-600'}`}>
          Calendar
        </h2>
        <div className="flex items-center gap-4">
          <button onClick={prevMonth} className={`text-sm ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}>‹</button>
          <span className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{monthName}</span>
          <button onClick={nextMonth} className={`text-sm ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}>›</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-7 gap-px">
          {dayNames.map(d => (
            <div key={d} className={`text-center text-[9px] font-bold uppercase tracking-widest py-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{d}</div>
          ))}
          {cells.map((day, i) => {
            const dayNotes = day ? getNotesForDay(day) : [];
            return (
              <div
                key={i}
                className={`min-h-[80px] p-1 border ${isDark ? 'border-[#1a1a1a]' : 'border-gray-100'} ${
                  day && isToday(day) ? (isDark ? 'bg-[#00ff9d]/5' : 'bg-green-50') : ''
                } ${!day ? 'opacity-30' : ''}`}
              >
                {day && (
                  <>
                    <div className={`text-[10px] font-bold mb-1 ${isToday(day) ? 'text-[#00ff9d]' : isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {day}
                    </div>
                    {dayNotes.slice(0, 3).map(note => (
                      <div
                        key={note.id}
                        onClick={() => onSelectNote(note.id)}
                        className={`text-[8px] truncate px-1 py-0.5 mb-0.5 cursor-pointer transition-colors ${isDark ? 'bg-[#1a1a1a] text-gray-400 hover:text-[#00ff9d] hover:bg-[#1a1a1a]/80' : 'bg-gray-100 text-gray-600 hover:text-green-600'}`}
                      >
                        {note.title || 'Untitled'}
                      </div>
                    ))}
                    {dayNotes.length > 3 && (
                      <div className={`text-[7px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>+{dayNotes.length - 3} more</div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
