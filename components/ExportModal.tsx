import React from 'react';
import { Note } from '../types';
import { ICONS } from '../constants';
import { formatTime } from '../utils';

interface ExportModalProps {
  note: Note;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ note, onClose }) => {
  
  const handleCopy = () => {
    const text = `${note.title}\n\n${note.content}`;
    navigator.clipboard.writeText(text);
    onClose();
  };

  const downloadFile = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onClose();
  };

  const handleDownloadMD = () => {
    const md = `# ${note.title}

${note.content}

---
**Created:** ${formatTime(note.createdAt)}
**Tags:** ${note.tags.map(t => `#${t}`).join(', ')}
${note.attachments.length > 0 ? `**Attachments:** ${note.attachments.length} files` : ''}
`;
    downloadFile(`${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'note'}.md`, md, 'text/markdown');
  };

  const handleDownloadTXT = () => {
    const txt = `${note.title}\n\n${note.content}`;
    downloadFile(`${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'note'}.txt`, txt, 'text/plain');
  };

  const handleDownloadJSON = () => {
    const json = JSON.stringify(note, null, 2);
    downloadFile(`${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'note'}.json`, json, 'application/json');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-[#0a0a0a] border border-[#00ff9d] w-full max-w-md rounded shadow-[0_0_50px_rgba(0,255,157,0.1)] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-[#333] bg-[#050505]">
          <h2 className="text-[#00ff9d] font-bold text-lg flex items-center gap-2">
            <ICONS.Download /> EXPORT DATA
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><ICONS.Close /></button>
        </div>
        
        <div className="p-6 grid grid-cols-2 gap-4">
            <button 
                onClick={handleCopy}
                className="flex flex-col items-center justify-center p-4 bg-[#111] border border-[#333] rounded hover:border-[#00ff9d] hover:bg-[#002b1f] hover:text-[#00ff9d] transition-all gap-2 group"
            >
                <ICONS.Copy className="w-6 h-6 text-gray-400 group-hover:text-[#00ff9d]" />
                <span className="text-sm font-bold">Clipboard</span>
            </button>

            <button 
                onClick={handleDownloadMD}
                className="flex flex-col items-center justify-center p-4 bg-[#111] border border-[#333] rounded hover:border-[#00ff9d] hover:bg-[#002b1f] hover:text-[#00ff9d] transition-all gap-2 group"
            >
                <ICONS.FileText className="w-6 h-6 text-gray-400 group-hover:text-[#00ff9d]" />
                <span className="text-sm font-bold">Markdown (.md)</span>
            </button>

            <button 
                onClick={handleDownloadTXT}
                className="flex flex-col items-center justify-center p-4 bg-[#111] border border-[#333] rounded hover:border-[#00ff9d] hover:bg-[#002b1f] hover:text-[#00ff9d] transition-all gap-2 group"
            >
                <ICONS.FileText className="w-6 h-6 text-gray-400 group-hover:text-[#00ff9d]" />
                <span className="text-sm font-bold">Plain Text (.txt)</span>
            </button>

            <button 
                onClick={handleDownloadJSON}
                className="flex flex-col items-center justify-center p-4 bg-[#111] border border-[#333] rounded hover:border-[#00ff9d] hover:bg-[#002b1f] hover:text-[#00ff9d] transition-all gap-2 group"
            >
                <ICONS.FileCode className="w-6 h-6 text-gray-400 group-hover:text-[#00ff9d]" />
                <span className="text-sm font-bold">JSON Object</span>
            </button>
        </div>
        
        <div className="p-4 border-t border-[#333] bg-[#050505] text-center text-xs text-gray-500 font-mono">
           SELECT FORMAT TO EXPORT
        </div>
      </div>
    </div>
  );
};