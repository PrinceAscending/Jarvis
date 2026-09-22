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
    <div className="flex flex-col max-w-md mx-auto space-y-5 animate-fade-in">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-semibold text-text-bright tracking-tight">
          Permissions & autonomy
        </h2>
        <p className="text-xs text-text-muted">
          Control how much freedom Jarvis has when executing actions.
        </p>
      </div>

      {/* Permission Tiers */}
      <div className="space-y-2 pt-1">
        {[
          {
            id: 'interactive',
            name: 'Ask for risky actions (Recommended)',
            desc: 'Executes read-only operations automatically; prompts for deletions or terminal commands.',
          },
          {
            id: 'strict',
            name: 'Ask before acting',
            desc: 'Requests explicit confirmation before performing any action on your system.',
          },
          {
            id: 'autonomous',
            name: 'Act independently',
            desc: 'Runs multi-step workflows autonomously, pausing only on critical security gates.',
          },
        ].map((tier) => {
          const isSelected = permissionsLevel === tier.id;
          return (
            <div
              key={tier.id}
              onClick={() => setPermissionsLevel(tier.id)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-colors flex flex-col justify-between ${
                isSelected
                  ? 'border-signal/50 bg-surface-elevated text-text-bright'
                  : 'border-surface-border hover:border-surface-border/80 bg-surface text-text'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield
                    size={15}
                    className={isSelected ? 'text-signal' : 'text-text-muted'}
                  />
                  <span className="text-xs font-medium">
                    {tier.name}
                  </span>
                </div>
                {isSelected && <CheckCircle2 size={15} className="text-signal" />}
              </div>
              <p className="text-[11px] text-text-muted mt-1 leading-relaxed">{tier.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Proactive Automation Toggle */}
      <div className="surface-card p-3.5 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-surface-well border border-surface-border flex items-center justify-center text-signal">
            <Zap size={14} />
          </div>
          <div>
            <div className="text-xs font-medium text-text-bright">
              Proactive system alerts
            </div>
            <div className="text-[10px] text-text-muted">
              Notify when memory or CPU usage is elevated
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setProactiveEnabled(!proactiveEnabled)}
          className={`w-10 h-5 rounded-full transition-colors relative ${
            proactiveEnabled ? 'bg-signal' : 'bg-surface-elevated border border-surface-border'
          }`}
        >
          <div
            className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
              proactiveEnabled ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 px-3.5 py-2 rounded-lg border border-surface-border hover:bg-surface text-text-muted text-xs transition-colors"
        >
          <ArrowLeft size={13} />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-signal hover:bg-signal-hover text-white text-xs font-medium transition-colors"
        >
          <span>Next</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
};
