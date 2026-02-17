import { Note } from './types';
import { v4 as uuidv4 } from 'uuid';
import { TAG_COLORS } from './constants';

export interface NoteTemplate {
  id: string;
  name: string;
  icon: string;
  content: string;
}

export const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    icon: '📋',
    content: `## Date\n\n\n## Attendees\n\n- \n\n## Agenda\n\n1. \n\n## Discussion\n\n\n## Action Items\n\n- [ ] \n`
  },
  {
    id: 'journal-entry',
    name: 'Journal Entry',
    icon: '📔',
    content: `## Date\n\n\n## Mood\n\n\n## Highlights\n\n- \n\n## Reflections\n\n\n## Gratitude\n\n- \n`
  },
  {
    id: 'project-plan',
    name: 'Project Plan',
    icon: '🚀',
    content: `## Overview\n\n\n## Goals\n\n- \n\n## Timeline\n\n| Phase | Start | End |\n|-------|-------|-----|\n|       |       |     |\n\n## Tasks\n\n- [ ] \n\n## Resources\n\n- \n\n## Risks\n\n- \n`
  },
  {
    id: 'todo-list',
    name: 'To-Do List',
    icon: '✅',
    content: `## High Priority\n\n- [ ] \n\n## Medium Priority\n\n- [ ] \n\n## Low Priority\n\n- [ ] \n`
  },
  {
    id: 'brain-dump',
    name: 'Brain Dump',
    icon: '🧠',
    content: `Stream of consciousness...\n\n`
  },
  {
    id: 'bug-report',
    name: 'Bug Report',
    icon: '🐛',
    content: `## Summary\n\n\n## Steps to Reproduce\n\n1. \n2. \n3. \n\n## Expected Behavior\n\n\n## Actual Behavior\n\n\n## Environment\n\n- OS: \n- Browser: \n- Version: \n`
  }
];

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export const createNewNote = (): Note => ({
  id: uuid(),
  title: 'Void Entry',
  content: '',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  tags: [],
  attachments: [],
  pinned: false,
  archived: false
});

export const formatTime = (ms: number) => {
  return new Date(ms).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

export const getTagColor = (tag: string): string => {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    const char = tag.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const index = Math.abs(hash) % TAG_COLORS.length;
  return TAG_COLORS[index];
};