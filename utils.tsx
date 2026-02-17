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

export const JOURNAL_PROMPTS = [
  "What are you grateful for today?",
  "What's one thing you learned today?",
  "Describe a challenge you faced and how you handled it.",
  "What made you smile today?",
  "What are your top 3 priorities for today?",
  "Reflect on a recent accomplishment.",
  "What's something you'd like to improve?",
  "Describe your ideal day.",
  "What's weighing on your mind right now?",
  "Write about a person who inspired you recently.",
  "What would you tell your past self?",
  "What's a goal you're working toward?",
  "Describe a moment of peace you experienced recently.",
  "What's something new you'd like to try?",
  "Write about your favorite memory this week.",
  "What boundaries do you need to set?",
  "What does success look like for you right now?",
  "Describe something beautiful you noticed today.",
  "What habits are serving you well?",
  "What would you do if you couldn't fail?",
  "What are you looking forward to?",
  "Write about a mistake and what it taught you.",
  "How are you feeling right now, honestly?",
  "What's one small thing you can do today to improve your life?",
  "Describe a moment where you felt truly alive.",
  "What do you need to let go of?",
  "What's something you've been putting off?",
  "Write a letter to your future self.",
  "What's your current mood in three words?",
  "What are you curious about right now?",
  "What's the best advice you've ever received?",
];

export const getDailyPrompt = (): string => {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  return JOURNAL_PROMPTS[dayOfYear % JOURNAL_PROMPTS.length];
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