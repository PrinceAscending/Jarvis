import React from 'react';
import { Shield, Zap, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';

interface PermissionsStepProps {
  permissionsLevel: string;
  setPermissionsLevel: (level: string) => void;
  proactiveEnabled: boolean;
  setProactiveEnabled: (enabled: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}

export const PermissionsStep: React.FC<PermissionsStepProps> = ({
  permissionsLevel,
  setPermissionsLevel,
  proactiveEnabled,
  setProactiveEnabled,
  onNext,
  onBack,
}) => {
  return (
    <div className="flex flex-col max-w-xl mx-auto space-y-6 animate-fade-slide-in">
      <div className="text-center space-y-1">
        <h2 className="text-xl md:text-2xl font-display font-bold text-zinc-100 tracking-wider uppercase">
          Autonomy & System Guardrails
        </h2>
        <p className="text-xs text-zinc-400 font-mono">
          Determine how much freedom J.A.R.V.I.S. has when executing system actions.
        </p>
      </div>

      {/* Permission Tiers */}
      <div className="space-y-3">
        {[
          {
            id: 'interactive',
            name: 'Interactive Autonomy (Recommended)',
            tag: 'Balanced',
            desc: 'Executes harmless and read-only actions immediately; prompts for destructive or shell operations.',
          },
          {
            id: 'strict',
            name: 'Strict Verification Mode',
            tag: 'Maximum Caution',
            desc: 'Asks for explicit operator confirmation before executing any modification or external action.',
          },
          {
            id: 'autonomous',
            name: 'Autonomous Assistant Mode',
            tag: 'Full Freedom',
            desc: 'Executes multi-step workflows with full autonomy, only pausing on critical security actions.',
          },
        ].map((tier) => {
          const isSelected = permissionsLevel === tier.id;
          return (
            <div
              key={tier.id}
              onClick={() => setPermissionsLevel(tier.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-cyan-neon/50 bg-cyan-500/10 shadow-[0_0_15px_rgba(0,240,255,0.1)]'
                  : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield
                    size={16}
                    className={isSelected ? 'text-cyan-neon' : 'text-zinc-400'}
                  />
                  <span className="text-xs font-mono font-bold text-zinc-100">
                    {tier.name}
                  </span>
                </div>
                {isSelected && <CheckCircle2 size={16} className="text-cyan-neon" />}
              </div>
              <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">{tier.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Proactive Automation Toggle */}
      <div className="glass-panel p-4 rounded-xl border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-neon/30 flex items-center justify-center text-cyan-neon">
            <Zap size={16} />
          </div>
          <div>
            <div className="text-xs font-mono font-semibold text-zinc-200">
              Proactive Health & Telemetry Alerts
            </div>
            <div className="text-[10px] text-zinc-400">
              Suggest RAM cleanups and notify on high memory usage automatically
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setProactiveEnabled(!proactiveEnabled)}
          className={`w-11 h-6 rounded-full transition-colors relative ${
            proactiveEnabled ? 'bg-cyan-500' : 'bg-white/10'
          }`}
        >
          <div
            className={`w-4 h-4 rounded-full bg-obsidian-950 absolute top-1 transition-transform ${
              proactiveEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/20 text-zinc-400 hover:text-zinc-200 font-mono text-xs transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-obsidian-950 font-display font-bold text-xs tracking-wider uppercase transition-all shadow-neon-cyan"
        >
          <span>Review Configuration</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};
