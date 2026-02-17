import React, { useState } from 'react';
import { VoidLogo } from './VoidLogo';

interface OnboardingProps {
  onComplete: () => void;
}

const STEPS = [
  {
    title: 'Welcome to VOID',
    description: 'A cyberpunk-inspired note-taking app with AI superpowers. Let\'s take a quick tour.',
    icon: '⚡',
  },
  {
    title: 'Create Notes',
    description: 'Click the + button in the sidebar to create notes. Use templates for quick starts — meeting notes, journals, project plans, and more.',
    icon: '📝',
  },
  {
    title: 'Slash Commands',
    description: 'Type / at the start of a line to insert headings, lists, code blocks, tables, and more with a quick menu.',
    icon: '⌨️',
  },
  {
    title: 'Link Your Notes',
    description: 'Type [[ to link notes together wiki-style. Build your personal knowledge graph.',
    icon: '🔗',
  },
  {
    title: 'AI Assistant',
    description: 'Click the AI Assistant button or use the toolbar to get AI-powered help — summarize, enhance, brainstorm, and more.',
    icon: '🤖',
  },
  {
    title: 'Quick Capture',
    description: 'Hit the lightning bolt button in the bottom-right corner to capture quick thoughts without leaving what you\'re doing.',
    icon: '💡',
  },
  {
    title: 'Command Palette',
    description: 'Press Cmd+K (or Ctrl+K) anytime to quickly search notes, run commands, and navigate.',
    icon: '🎯',
  },
  {
    title: 'You\'re Ready!',
    description: 'Start writing. Press MD? in the status bar for markdown help. Explore the toolbar for more features.',
    icon: '🚀',
  },
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 animate-scale-in">
        <div className="bg-[#111] border border-[#333]  p-8 shadow-[0_0_60px_rgba(0,255,157,0.1)]">
          <div className="flex justify-center mb-6">
            {step === 0 ? <VoidLogo size={56} animated /> : <span className="text-4xl">{current.icon}</span>}
          </div>
          <h2 className="text-xl font-bold text-white text-center mb-3 tracking-wide">{current.title}</h2>
          <p className="text-gray-400 text-center text-sm leading-relaxed mb-8">{current.description}</p>
          
          <div className="flex justify-center gap-1.5 mb-6">
            {STEPS.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === step ? 'bg-[#00ff9d] w-6' : i < step ? 'bg-[#00ff9d]/50' : 'bg-[#333]'}`} />
            ))}
          </div>

          <div className="flex justify-between items-center">
            <button onClick={handleSkip} className="text-gray-600 hover:text-gray-400 text-sm transition-colors">
              Skip tour
            </button>
            <button onClick={handleNext} className="bg-[#00ff9d] text-black font-bold px-6 py-2.5  hover:bg-[#00e68a] transition-colors text-sm">
              {step === STEPS.length - 1 ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
