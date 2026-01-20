import { useEffect } from 'react';

export interface ShortcutHandlers {
  onNewNote: () => void;
  onSave: () => void;
  onFocusSearch: () => void;
  onArchiveNote: () => void;
  onDeleteForever: () => void;
  onSwitchNote: (index: number) => void;
  onEscape: () => void;
  onShowShortcuts: () => void;
  onExport: () => void;
}

export const useGlobalShortcuts = (handlers: ShortcutHandlers) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow Escape to work everywhere (to close modals)
      if (e.key === 'Escape') {
        handlers.onEscape();
        return;
      }

      const isInput = (e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA';
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      // Don't trigger shortcuts if typing in an input, UNLESS it's a Ctrl/Meta combo
      if (isInput && !isCtrlOrMeta) {
        return;
      }

      if (isCtrlOrMeta) {
        switch (e.key.toLowerCase()) {
          case 'n':
            e.preventDefault();
            handlers.onNewNote();
            break;
          case 's':
            e.preventDefault();
            handlers.onSave();
            break;
          case 'f':
            e.preventDefault();
            handlers.onFocusSearch();
            break;
          case 'e':
             if (e.shiftKey) { // Ctrl+Shift+E
                e.preventDefault();
                handlers.onExport();
             }
             break;
          case 'delete':
          case 'backspace':
            // Ctrl+Delete for Archive, Ctrl+Shift+Delete for Permanent
            e.preventDefault();
            if (e.shiftKey) {
                handlers.onDeleteForever();
            } else {
                handlers.onArchiveNote();
            }
            break;
          case '/':
            e.preventDefault();
            handlers.onShowShortcuts();
            break;
          default:
            // Check for Ctrl+1-9
            const num = parseInt(e.key);
            if (!isNaN(num) && num >= 1 && num <= 9) {
              e.preventDefault();
              handlers.onSwitchNote(num - 1);
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
};