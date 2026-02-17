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

  const escapeHtml = (str: string): string => {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };

  const markdownToHtml = (md: string): string => {
    let html = escapeHtml(md);

    const codeBlockRegex = /```(.*?)\n([\s\S]*?)```/g;
    html = html.replace(codeBlockRegex, '<pre><code>$2</code></pre>');

    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*?)$/gm, '<h1 style="margin-top: 0;">$1</h1>');

    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    const lines = html.split('\n');
    let inList = false;
    const processed: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.match(/^- /)) {
        if (!inList) {
          processed.push('<ul>');
          inList = true;
        }
        processed.push('<li>' + line.replace(/^- /, '') + '</li>');
      } else if (inList && line.trim() === '') {
        processed.push('</ul>');
        inList = false;
        processed.push('');
      } else if (inList && !line.match(/^- /)) {
        processed.push('</ul>');
        inList = false;
        processed.push(line);
      } else {
        processed.push(line);
      }
    }

    if (inList) {
      processed.push('</ul>');
    }

    html = processed.join('\n');

    html = html.split('\n').map(line => {
      if (line.trim() && !line.match(/^<[^>]+>/) && !line.match(/^<\/[^>]+>$/)) {
        return `<p>${line}</p>`;
      }
      return line;
    }).join('\n');

    return html;
  };

  const handlePrint = () => {
    const printContent = markdownToHtml(note.content);
    const tagsStr = note.tags.map(t => `#${escapeHtml(t)}`).join(' ');
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${escapeHtml(note.title)}</title>
  <style>
    @media print {
      body { margin: 0; padding: 20px; }
    }
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      line-height: 1.8;
      color: #222;
      max-width: 700px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    h1 { font-size: 28px; margin-bottom: 8px; border-bottom: 2px solid #333; padding-bottom: 8px; }
    h2 { font-size: 22px; margin-top: 24px; }
    h3 { font-size: 18px; }
    p { margin: 12px 0; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: monospace; font-size: 14px; }
    pre { background: #f4f4f4; padding: 16px; border-radius: 6px; overflow-x: auto; }
    pre code { background: none; padding: 0; }
    blockquote { border-left: 3px solid #ccc; margin: 16px 0; padding: 8px 16px; color: #555; }
    ul, ol { padding-left: 24px; }
    li { margin: 4px 0; }
    img { max-width: 100%; }
    .meta { color: #888; font-size: 13px; margin-bottom: 20px; }
    .tags { color: #666; font-size: 12px; margin-bottom: 16px; }
    .tags span { background: #eee; padding: 2px 8px; border-radius: 10px; margin-right: 6px; }
    hr { border: none; border-top: 1px solid #ddd; margin: 24px 0; }
    @media print {
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(note.title)}</h1>
  <div class="meta">
    Created: ${new Date(note.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} · 
    Updated: ${new Date(note.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
  </div>
  ${tagsStr ? `<div class="tags">${note.tags.map(t => `<span>#${escapeHtml(t)}</span>`).join(' ')}</div>` : ''}
  <hr>
  ${printContent}
  <script>
    window.onload = function() { window.print(); };
  <\/script>
</body>
</html>`);
    printWindow.document.close();
  };

  const handleDownloadHTML = () => {
    const contentHtml = markdownToHtml(note.content);
    const tagsHtml = note.tags.length > 0 ? `<p><strong>Tags:</strong> ${note.tags.map(t => `<span style="background: #00ff9d; color: #050505; padding: 2px 6px; border-radius: 3px; margin: 0 4px; font-size: 12px; font-weight: bold;">#${escapeHtml(t)}</span>`).join(' ')}</p>` : '';
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(note.title)}</title>
  <style>
    body {
      background-color: #050505;
      color: #e0e0e0;
      font-family: 'JetBrains Mono', 'Monaco', 'Courier New', monospace;
      line-height: 1.6;
      margin: 0;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    h1, h2, h3 {
      color: #00ff9d;
      margin-top: 24px;
      margin-bottom: 12px;
    }
    h1 {
      border-bottom: 2px solid #00ff9d;
      padding-bottom: 8px;
    }
    code {
      background-color: #111;
      padding: 2px 6px;
      border-radius: 3px;
      color: #00ff9d;
    }
    pre {
      background-color: #111;
      border-left: 3px solid #00ff9d;
      padding: 12px;
      border-radius: 3px;
      overflow-x: auto;
    }
    pre code {
      background-color: transparent;
      padding: 0;
      color: #e0e0e0;
    }
    ul {
      padding-left: 20px;
    }
    li {
      margin: 4px 0;
    }
    strong {
      color: #00ff9d;
    }
    hr {
      border: none;
      border-top: 1px solid #333;
      margin: 24px 0;
    }
    .metadata {
      margin-top: 48px;
      padding-top: 20px;
      border-top: 1px solid #333;
      font-size: 12px;
      color: #888;
    }
  </style>
</head>
<body>
  <h1>${note.title}</h1>
  ${contentHtml}
  <hr>
  <div class="metadata">
    <p><strong>Created:</strong> ${formatTime(note.createdAt)}</p>
    ${tagsHtml}
    ${note.attachments.length > 0 ? `<p><strong>Attachments:</strong> ${note.attachments.length} files</p>` : ''}
  </div>
</body>
</html>`;

    downloadFile(`${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'note'}.html`, html, 'text/html');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-[#0a0a0a] border border-[#00ff9d] w-full max-w-md  shadow-[0_0_50px_rgba(0,255,157,0.1)] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-[#333] bg-[#050505]">
          <h2 className="text-[#00ff9d] font-bold text-lg flex items-center gap-2">
            <ICONS.Download /> EXPORT DATA
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><ICONS.Close /></button>
        </div>
        
        <div className="p-6 grid grid-cols-2 gap-4">
            <button 
                onClick={handleCopy}
                className="flex flex-col items-center justify-center p-4 bg-[#111] border border-[#333]  hover:border-[#00ff9d] hover:bg-[#002b1f] hover:text-[#00ff9d] transition-all gap-2 group"
            >
                <ICONS.Copy className="w-6 h-6 text-gray-400 group-hover:text-[#00ff9d]" />
                <span className="text-sm font-bold">Clipboard</span>
            </button>

            <button 
                onClick={handleDownloadMD}
                className="flex flex-col items-center justify-center p-4 bg-[#111] border border-[#333]  hover:border-[#00ff9d] hover:bg-[#002b1f] hover:text-[#00ff9d] transition-all gap-2 group"
            >
                <ICONS.FileText className="w-6 h-6 text-gray-400 group-hover:text-[#00ff9d]" />
                <span className="text-sm font-bold">Markdown (.md)</span>
            </button>

            <button 
                onClick={handleDownloadTXT}
                className="flex flex-col items-center justify-center p-4 bg-[#111] border border-[#333]  hover:border-[#00ff9d] hover:bg-[#002b1f] hover:text-[#00ff9d] transition-all gap-2 group"
            >
                <ICONS.FileText className="w-6 h-6 text-gray-400 group-hover:text-[#00ff9d]" />
                <span className="text-sm font-bold">Plain Text (.txt)</span>
            </button>

            <button 
                onClick={handleDownloadJSON}
                className="flex flex-col items-center justify-center p-4 bg-[#111] border border-[#333]  hover:border-[#00ff9d] hover:bg-[#002b1f] hover:text-[#00ff9d] transition-all gap-2 group"
            >
                <ICONS.FileCode className="w-6 h-6 text-gray-400 group-hover:text-[#00ff9d]" />
                <span className="text-sm font-bold">JSON Object</span>
            </button>

            <button 
                onClick={handleDownloadHTML}
                className="flex flex-col items-center justify-center p-4 bg-[#111] border border-[#333]  hover:border-[#00ff9d] hover:bg-[#002b1f] hover:text-[#00ff9d] transition-all gap-2 group"
            >
                <ICONS.FileCode className="w-6 h-6 text-gray-400 group-hover:text-[#00ff9d]" />
                <span className="text-sm font-bold">HTML File</span>
            </button>

            <button 
                onClick={handlePrint}
                className="flex flex-col items-center justify-center p-4 bg-[#111] border border-[#333]  hover:border-[#00ff9d] hover:bg-[#002b1f] hover:text-[#00ff9d] transition-all gap-2 group"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-gray-400 group-hover:text-[#00ff9d]"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                <span className="text-sm font-bold">Print</span>
            </button>
        </div>
        
        <div className="p-4 border-t border-[#333] bg-[#050505] text-center text-xs text-gray-500 font-mono">
           SELECT FORMAT TO EXPORT
        </div>
      </div>
    </div>
  );
};