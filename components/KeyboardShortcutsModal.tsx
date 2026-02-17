import React from 'react';
import { ICONS } from '../constants';

interface KeyboardShortcutsModalProps {
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ onClose }) => {
  const shortcuts = [
    { keys: ['Ctrl', 'N'], desc: 'New Note' },
    { keys: ['Ctrl', 'S'], desc: 'Force Save' },
    { keys: ['Ctrl', 'K'], desc: 'Command Palette' },
    { keys: ['Ctrl', 'F'], desc: 'Search' },
    { keys: ['Ctrl', 'Shift', 'E'], desc: 'Export Note' },
    { keys: ['Ctrl', 'Del'], desc: 'Archive Note' },
    { keys: ['Ctrl', 'Shift', 'Del'], desc: 'Delete Forever' },
    { keys: ['Ctrl', '1-9'], desc: 'Switch Note' },
    { keys: ['Ctrl', '/'], desc: 'Show Help' },
    { keys: ['Esc'], desc: 'Close Modals' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-[#0a0a0a] border border-[#00ff9d] w-full max-w-lg rounded shadow-[0_0_50px_rgba(0,255,157,0.1)] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-[#333] bg-[#050505]">
          <h2 className="text-[#00ff9d] font-bold text-lg flex items-center gap-2">
            <ICONS.Keyboard /> SYSTEM CONTROLS
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><ICONS.Close /></button>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between bg-[#111] p-3 rounded border border-[#222]">
              <span className="text-gray-300 text-sm font-mono">{s.desc}</span>
              <div className="flex gap-1">
                {s.keys.map(k => (
                  <kbd key={k} className="px-2 py-1 bg-[#222] border border-[#333] rounded text-xs font-bold text-[#00ff9d] min-w-[24px] text-center font-mono">
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t border-[#333] bg-[#050505] text-center text-xs text-gray-500 font-mono">
           PRESS <kbd className="text-[#00ff9d]">ESC</kbd> TO CLOSE
        </div>
      </div>
    </div>
  );
};