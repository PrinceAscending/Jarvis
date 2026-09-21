import React, { useEffect, useState } from 'react';
import { Volume2, Play, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';

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
  const [playing, setPlaying] = useState(false);

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
    { id: 'en-US-ChristopherNeural', name: 'Christopher (JARVIS Classic)', accent: 'Sophisticated / British Tone', gender: 'Male' },
    { id: 'en-US-GuyNeural', name: 'Guy (Poised & Clear)', accent: 'American Professional', gender: 'Male' },
    { id: 'en-GB-RyanNeural', name: 'Ryan (British Elegance)', accent: 'UK Standard', gender: 'Male' },
    { id: 'en-GB-SoniaNeural', name: 'Sonia (Calm Intelligence)', accent: 'UK Standard', gender: 'Female' },
    { id: 'en-US-JennyNeural', name: 'Jenny (Warm & Natural)', accent: 'American Natural', gender: 'Female' },
  ];

  const selectedVoice = voiceConfig.tts_voice || 'en-US-ChristopherNeural';
  const selectedRate = voiceConfig.tts_rate || '+5%';

  const handleTestSpeech = async () => {
    setPlaying(true);
    try {
      // Speech test simulation or actual audio
      setTimeout(() => {
        setPlaying(false);
      }, 2000);
    } catch {
      setPlaying(false);
    }
  };

  return (
    <div className="flex flex-col max-w-xl mx-auto space-y-6 animate-fade-slide-in">
      <div className="text-center space-y-1">
        <h2 className="text-xl md:text-2xl font-display font-bold text-zinc-100 tracking-wider uppercase">
          Neural Voice Persona
        </h2>
        <p className="text-xs text-zinc-400 font-mono">
          Select the acoustic presence for your assistant's spoken transmissions.
        </p>
      </div>

      {/* Voice Selection Cards */}
      <div className="space-y-2">
        {PRESET_VOICES.map((v) => {
          const isSelected = selectedVoice === v.id;
          return (
            <div
              key={v.id}
              onClick={() => setVoiceConfig({ ...voiceConfig, tts_voice: v.id })}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                isSelected
                  ? 'border-cyan-neon/50 bg-cyan-500/10 text-cyan-neon shadow-[0_0_15px_rgba(0,240,255,0.1)]'
                  : 'border-white/10 hover:border-white/20 text-zinc-300 hover:bg-white/[0.02]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-cyan-500/20 text-cyan-neon' : 'bg-white/5 text-zinc-400'
                  }`}
                >
                  <Volume2 size={16} />
                </div>
                <div>
                  <div className="text-xs font-mono font-semibold">{v.name}</div>
                  <div className="text-[10px] text-zinc-400">{v.accent}</div>
                </div>
              </div>

              {isSelected && <CheckCircle2 size={16} className="text-cyan-neon" />}
            </div>
          );
        })}
      </div>

      {/* Speech Rate Selector */}
      <div className="glass-panel p-4 rounded-xl border-white/10 space-y-2">
        <label className="block text-xs font-mono text-zinc-300">Speech Cadence / Rate:</label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { id: '-10%', label: 'Slower' },
            { id: '+0%', label: 'Standard' },
            { id: '+5%', label: 'Crisp (+5%)' },
            { id: '+15%', label: 'Rapid' },
          ].map((r) => {
            const isSel = selectedRate === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setVoiceConfig({ ...voiceConfig, tts_rate: r.id })}
                className={`py-2 rounded-lg border text-xs font-mono transition-all ${
                  isSel
                    ? 'border-cyan-neon/50 bg-cyan-500/20 text-cyan-neon font-semibold'
                    : 'border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
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
          <span>Permissions & Security</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};
