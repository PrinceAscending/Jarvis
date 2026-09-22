import React, { useEffect, useState } from 'react';
import { Volume2, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';

interface VoiceStepProps {
  voiceConfig: any;
  setVoiceConfig: (cfg: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export const VoiceStep: React.FC<VoiceStepProps> = ({
  voiceConfig,
  setVoiceConfig,
  onNext,
  onBack,
}) => {
  const [voices, setVoices] = useState<any[]>([]);

  useEffect(() => {
    fetch('http://127.0.0.1:8765/api/voice/voices')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setVoices(data);
        }
      })
      .catch(() => {});
  }, []);

  const PRESET_VOICES = [
    { id: 'en-US-ChristopherNeural', name: 'Christopher (Classic)', accent: 'Sophisticated / British tone', gender: 'Male' },
    { id: 'en-US-GuyNeural', name: 'Guy', accent: 'American professional', gender: 'Male' },
    { id: 'en-GB-RyanNeural', name: 'Ryan', accent: 'UK standard', gender: 'Male' },
    { id: 'en-GB-SoniaNeural', name: 'Sonia', accent: 'UK natural', gender: 'Female' },
    { id: 'en-US-JennyNeural', name: 'Jenny', accent: 'American natural', gender: 'Female' },
  ];

  const selectedVoice = voiceConfig.tts_voice || 'en-US-ChristopherNeural';
  const selectedRate = voiceConfig.tts_rate || '+5%';

  return (
    <div className="flex flex-col max-w-md mx-auto space-y-5 animate-fade-in">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-semibold text-text-bright tracking-tight">
          Voice preference
        </h2>
        <p className="text-xs text-text-muted">
          Choose a spoken voice for answers and audio transmissions.
        </p>
      </div>

      {/* Voice Selection Cards */}
      <div className="space-y-1.5 pt-1">
        {PRESET_VOICES.map((v) => {
          const isSelected = selectedVoice === v.id;
          return (
            <div
              key={v.id}
              onClick={() => setVoiceConfig({ ...voiceConfig, tts_voice: v.id })}
              className={`p-3 rounded-xl border cursor-pointer transition-colors flex items-center justify-between ${
                isSelected
                  ? 'border-signal/50 bg-surface-elevated text-text-bright'
                  : 'border-surface-border hover:border-surface-border/80 text-text bg-surface'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-signal/20 text-signal' : 'bg-surface-well text-text-muted'
                  }`}
                >
                  <Volume2 size={15} />
                </div>
                <div>
                  <div className="text-xs font-medium">{v.name}</div>
                  <div className="text-[10px] text-text-muted">{v.accent}</div>
                </div>
              </div>

              {isSelected && <CheckCircle2 size={15} className="text-signal" />}
            </div>
          );
        })}
      </div>

      {/* Speech Rate Selector */}
      <div className="surface-card p-3.5 rounded-xl space-y-2">
        <label className="block text-xs text-text-muted">Speech rate:</label>
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { id: '-10%', label: 'Slower' },
            { id: '+0%', label: 'Standard' },
            { id: '+5%', label: '+5%' },
            { id: '+15%', label: '+15%' },
          ].map((r) => {
            const isSel = selectedRate === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setVoiceConfig({ ...voiceConfig, tts_rate: r.id })}
                className={`py-1.5 rounded-lg border text-xs transition-colors ${
                  isSel
                    ? 'border-signal bg-signal/15 text-text-bright font-medium'
                    : 'border-surface-border text-text-muted hover:text-text hover:bg-surface-elevated'
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>
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
