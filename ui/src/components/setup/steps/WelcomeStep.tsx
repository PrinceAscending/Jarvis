import React from 'react';
import { User, Bot } from 'lucide-react';
import { AudioVisualizerOrb } from '@/components/audio/AudioVisualizerOrb';

interface WelcomeStepProps {
  assistantName: string;
  setAssistantName: (name: string) => void;
  userName: string;
  setUserName: (name: string) => void;
  onNext: () => void;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({
  assistantName,
  setAssistantName,
  userName,
  setUserName,
  onNext,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (assistantName.trim() && userName.trim()) {
      onNext();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-5 animate-fade-in">
      {/* Reactor Visualizer with warm ambient presence */}
      <div className="relative">
        <AudioVisualizerOrb status="idle" size={160} />
      </div>

      {/* Title & Tagline */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-text-bright tracking-tight">
          Welcome to Jarvis
        </h1>
        <p className="text-xs text-text-muted max-w-sm">
          A personal assistant built directly into Windows 11.
        </p>
      </div>

      {/* Identity Form */}
      <form onSubmit={handleSubmit} className="w-full space-y-3.5 text-left pt-2">
        <div>
          <label className="block text-xs text-text-muted mb-1 flex items-center gap-1.5">
            <Bot size={13} className="text-signal" />
            Assistant name
          </label>
          <input
            type="text"
            value={assistantName}
            onChange={(e) => setAssistantName(e.target.value)}
            placeholder="Jarvis"
            className="w-full bg-surface border border-surface-border focus:border-signal/60 rounded-lg px-3.5 py-2 text-sm text-text-bright outline-none transition-colors"
            required
          />
        </div>

        <div>
          <label className="block text-xs text-text-muted mb-1 flex items-center gap-1.5">
            <User size={13} className="text-signal" />
            How Jarvis should address you
          </label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Sir, Alex, etc."
            className="w-full bg-surface border border-surface-border focus:border-signal/60 rounded-lg px-3.5 py-2 text-sm text-text-bright outline-none transition-colors"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full mt-3 py-2.5 px-4 rounded-lg bg-signal hover:bg-signal-hover text-white font-medium text-sm transition-colors"
        >
          Continue
        </button>
      </form>
    </div>
  );
};
