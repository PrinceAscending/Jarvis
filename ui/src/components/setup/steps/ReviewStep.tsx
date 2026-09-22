import React from 'react';
import { Bot, Cpu, Volume2, Shield, ArrowLeft, Play } from 'lucide-react';

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
    <div className="flex flex-col max-w-md mx-auto space-y-5 animate-fade-in">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-semibold text-text-bright tracking-tight">
          Review & finish setup
        </h2>
        <p className="text-xs text-text-muted">
          Confirm your settings before starting Jarvis.
        </p>
      </div>

      {/* Summary Card */}
      <div className="surface-card p-4 rounded-xl divide-y divide-surface-border/60 space-y-2.5 text-xs">
        {/* Assistant & User */}
        <div className="flex items-center justify-between pb-2.5">
          <div className="flex items-center gap-2.5">
            <Bot size={15} className="text-signal" />
            <div>
              <div className="text-text-muted text-[10px]">Assistant & user</div>
              <div className="text-text-bright font-medium">
                {assistantName} <span className="text-text-muted font-normal">for</span> {userName}
              </div>
            </div>
          </div>
          <button
            onClick={() => onGoToStep(0)}
            className="text-[11px] text-signal hover:underline"
          >
            Edit
          </button>
        </div>

        {/* AI Provider */}
        <div className="flex items-center justify-between py-2.5">
          <div className="flex items-center gap-2.5">
            <Cpu size={15} className="text-signal" />
            <div>
              <div className="text-text-muted text-[10px]">AI model</div>
              <div className="text-text-bright font-medium capitalize">
                {activeProvider}
                <span className="text-text-muted font-normal ml-1.5 font-mono text-[11px]">
                  ({providerConfig.model || 'default'})
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => onGoToStep(1)}
            className="text-[11px] text-signal hover:underline"
          >
            Edit
          </button>
        </div>

        {/* Voice Persona */}
        <div className="flex items-center justify-between py-2.5">
          <div className="flex items-center gap-2.5">
            <Volume2 size={15} className="text-signal" />
            <div>
              <div className="text-text-muted text-[10px]">Voice</div>
              <div className="text-text font-normal">
                {voiceConfig.tts_voice || 'Christopher'} ({voiceConfig.tts_rate || '+5%'})
              </div>
            </div>
          </div>
          <button
            onClick={() => onGoToStep(3)}
            className="text-[11px] text-signal hover:underline"
          >
            Edit
          </button>
        </div>

        {/* Permissions */}
        <div className="flex items-center justify-between pt-2.5">
          <div className="flex items-center gap-2.5">
            <Shield size={15} className="text-signal" />
            <div>
              <div className="text-text-muted text-[10px]">Permissions</div>
              <div className="text-text font-normal capitalize">
                {permissionsLevel} mode • Proactive alerts {proactiveEnabled ? 'on' : 'off'}
              </div>
            </div>
          </div>
          <button
            onClick={() => onGoToStep(4)}
            className="text-[11px] text-signal hover:underline"
          >
            Edit
          </button>
        </div>
      </div>

      {/* Activation Button */}
      <div className="pt-2 flex flex-col items-center gap-2.5">
        <button
          type="button"
          onClick={onConfirmLaunch}
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 rounded-lg bg-signal hover:bg-signal-hover disabled:opacity-50 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
        >
          <Play size={14} className="fill-current" />
          <span>{isSubmitting ? 'Starting Jarvis...' : 'Finish setup & launch'}</span>
        </button>

        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex items-center gap-1 text-text-muted hover:text-text text-xs transition-colors"
        >
          <ArrowLeft size={12} />
          <span>Back</span>
        </button>
      </div>
    </div>
  );
};
