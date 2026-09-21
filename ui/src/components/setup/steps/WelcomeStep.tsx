import React from 'react';
import { Sparkles, ArrowRight, User, Bot } from 'lucide-react';
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
    <div className="flex flex-col items-center justify-center max-w-xl mx-auto text-center space-y-6 animate-fade-slide-in">
      {/* Reactor Visualizer */}
      <div className="relative">
        <AudioVisualizerOrb status="idle" size={180} />
      </div>

      {/* Title & Tagline */}
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-neon/30 text-cyan-neon font-mono text-[10px] tracking-widest uppercase mb-1">
          <Sparkles size={11} />
          First-Run Initialization
        </div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-zinc-100 tracking-wider uppercase">
          Welcome to <span className="text-cyan-neon">J.A.R.V.I.S.</span>
        </h1>
        <p className="text-xs text-zinc-400 font-mono max-w-md">
          Personal Intelligence System for Windows 11. Let's calibrate your environment.
        </p>
      </div>

      {/* Identity Form */}
      <form onSubmit={handleSubmit} className="w-full space-y-4 text-left">
        <div>
          <label className="block text-xs font-mono text-zinc-300 mb-1.5 flex items-center gap-1.5">
            <Bot size={13} className="text-cyan-neon" />
            Assistant Designation / Name
          </label>
          <input
            type="text"
            value={assistantName}
            onChange={(e) => setAssistantName(e.target.value)}
            placeholder="e.g. JARVIS"
            className="w-full bg-white/[0.03] border border-white/10 focus:border-cyan-neon/60 rounded-xl px-4 py-2.5 text-sm text-zinc-100 font-mono outline-none transition-all shadow-inner"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-zinc-300 mb-1.5 flex items-center gap-1.5">
            <User size={13} className="text-cyan-neon" />
            Operator Preferred Name / Title
          </label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="e.g. Sir, Tony, Commander..."
            className="w-full bg-white/[0.03] border border-white/10 focus:border-cyan-neon/60 rounded-xl px-4 py-2.5 text-sm text-zinc-100 font-mono outline-none transition-all shadow-inner"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-obsidian-950 font-display font-bold text-sm tracking-wider uppercase transition-all shadow-neon-cyan"
        >
          <span>Initialize Intelligence Core</span>
          <ArrowRight size={16} />
        </button>
      </form>
    </div>
  );
};
