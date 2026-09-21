import React from 'react';
import { CheckCircle2, Bot, User, Cpu, Volume2, Shield, Zap, ArrowLeft, Play } from 'lucide-react';

interface ReviewStepProps {
  assistantName: string;
  userName: string;
  activeProvider: string;
  providerConfig: any;
  voiceConfig: any;
  permissionsLevel: string;
  proactiveEnabled: boolean;
  onGoToStep: (step: number) => void;
  onConfirmLaunch: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
  assistantName,
  userName,
  activeProvider,
  providerConfig,
  voiceConfig,
  permissionsLevel,
  proactiveEnabled,
  onGoToStep,
  onConfirmLaunch,
  onBack,
  isSubmitting,
}) => {
  return (
    <div className="flex flex-col max-w-xl mx-auto space-y-6 animate-fade-slide-in">
      <div className="text-center space-y-1">
        <h2 className="text-xl md:text-2xl font-display font-bold text-zinc-100 tracking-wider uppercase">
          Ready for Operational Activation
        </h2>
        <p className="text-xs text-zinc-400 font-mono">
          Review your environment parameters before initializing the neural core.
        </p>
      </div>

      {/* Summary Matrix Card */}
      <div className="glass-panel p-5 rounded-2xl border-white/10 divide-y divide-white/5 space-y-3 font-mono text-xs">
        {/* Assistant & User */}
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-3">
            <Bot size={16} className="text-cyan-neon" />
            <div>
              <div className="text-zinc-400 text-[10px] uppercase">Identity</div>
              <div className="text-zinc-100 font-bold">
                {assistantName} <span className="text-zinc-500 font-normal">serving</span> {userName}
              </div>
            </div>
          </div>
          <button
            onClick={() => onGoToStep(0)}
            className="text-[10px] text-cyan-neon hover:underline"
          >
            Edit
          </button>
        </div>

        {/* AI Provider */}
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <Cpu size={16} className="text-cyan-neon" />
            <div>
              <div className="text-zinc-400 text-[10px] uppercase">Neural Engine</div>
              <div className="text-zinc-100 font-bold">
                {activeProvider.toUpperCase()}
                <span className="text-zinc-400 font-normal ml-2">
                  ({providerConfig.model || 'default model'})
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => onGoToStep(1)}
            className="text-[10px] text-cyan-neon hover:underline"
          >
            Edit
          </button>
        </div>

        {/* Voice Persona */}
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <Volume2 size={16} className="text-cyan-neon" />
            <div>
              <div className="text-zinc-400 text-[10px] uppercase">Acoustic Output</div>
              <div className="text-zinc-100">
                {voiceConfig.tts_voice || 'en-US-ChristopherNeural'} ({voiceConfig.tts_rate || '+5%'})
              </div>
            </div>
          </div>
          <button
            onClick={() => onGoToStep(3)}
            className="text-[10px] text-cyan-neon hover:underline"
          >
            Edit
          </button>
        </div>

        {/* Permissions & Autonomy */}
        <div className="flex items-center justify-between pt-3">
          <div className="flex items-center gap-3">
            <Shield size={16} className="text-cyan-neon" />
            <div>
              <div className="text-zinc-400 text-[10px] uppercase">Guardrails & Autonomy</div>
              <div className="text-zinc-100 capitalize">
                {permissionsLevel} Mode • Proactive Alerts {proactiveEnabled ? 'Enabled' : 'Disabled'}
              </div>
            </div>
          </div>
          <button
            onClick={() => onGoToStep(4)}
            className="text-[10px] text-cyan-neon hover:underline"
          >
            Edit
          </button>
        </div>
      </div>

      {/* Activation Button */}
      <div className="pt-2 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={onConfirmLaunch}
          disabled={isSubmitting}
          className="w-full py-3.5 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-obsidian-950 font-display font-bold text-sm tracking-widest uppercase transition-all shadow-reactor-glow flex items-center justify-center gap-2"
        >
          <Play size={16} className="fill-obsidian-950" />
          <span>{isSubmitting ? 'INITIALIZING NEURAL CORE...' : 'ACTIVATE J.A.R.V.I.S.'}</span>
        </button>

        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 font-mono text-xs transition-colors"
        >
          <ArrowLeft size={12} />
          <span>Back to Permissions</span>
        </button>
      </div>
    </div>
  );
};
