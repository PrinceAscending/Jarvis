import React, { useEffect, useState } from 'react';
import { Server, Cloud, CheckCircle2, ArrowRight, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';

interface AIModeStepProps {
  mode: 'local' | 'online';
  setMode: (mode: 'local' | 'online') => void;
  selectedProvider: string;
  setSelectedProvider: (provider: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const AIModeStep: React.FC<AIModeStepProps> = ({
  mode,
  setMode,
  selectedProvider,
  setSelectedProvider,
  onNext,
  onBack,
}) => {
  const [ollamaDetected, setOllamaDetected] = useState<boolean | null>(null);
  const [ollamaModels, setOllamaModels] = useState<any[]>([]);
  const [checking, setChecking] = useState(false);

  const checkOllama = async () => {
    setChecking(true);
    try {
      const res = await fetch('http://127.0.0.1:8765/api/setup/detect-ollama', { method: 'POST' });
      const data = await res.json();
      setOllamaDetected(data.running);
      setOllamaModels(data.models || []);
    } catch {
      setOllamaDetected(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkOllama();
  }, []);

  const handleSelectMode = (m: 'local' | 'online') => {
    setMode(m);
    if (m === 'local') {
      setSelectedProvider('ollama');
    } else if (selectedProvider === 'ollama') {
      setSelectedProvider('gemini');
    }
  };

  return (
    <div className="flex flex-col max-w-2xl mx-auto space-y-6 animate-fade-slide-in">
      <div className="text-center space-y-1">
        <h2 className="text-xl md:text-2xl font-display font-bold text-zinc-100 tracking-wider uppercase">
          Select AI Operational Mode
        </h2>
        <p className="text-xs text-zinc-400 font-mono">
          Run completely private on local hardware or leverage high-speed free cloud neural engines.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Local Mode Card */}
        <div
          onClick={() => handleSelectMode('local')}
          className={`glass-panel p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between relative group ${
            mode === 'local'
              ? 'border-emerald-400/50 bg-emerald-950/20 shadow-[0_0_25px_rgba(16,185,129,0.15)]'
              : 'border-white/10 hover:border-white/20'
          }`}
        >
          {mode === 'local' && (
            <div className="absolute top-3 right-3 text-emerald-400">
              <CheckCircle2 size={18} />
            </div>
          )}
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Server size={20} />
            </div>
            <div>
              <div className="text-sm font-display font-bold text-zinc-100 tracking-wide flex items-center gap-2">
                Local Mode (Ollama)
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  100% Offline
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                Zero internet required. Executes entirely on your local GPU/CPU with maximum privacy.
              </p>
            </div>
          </div>

          {/* Ollama Probe Status */}
          <div className="mt-4 pt-3 border-t border-white/5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-zinc-400">Ollama Status:</span>
              <div className="flex items-center gap-1.5">
                {checking ? (
                  <span className="text-zinc-400 flex items-center gap-1">
                    <RefreshCw size={11} className="animate-spin" /> Checking...
                  </span>
                ) : ollamaDetected ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Detected ({ollamaModels.length} models)
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1">
                    <AlertCircle size={12} /> Not running
                  </span>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    checkOllama();
                  }}
                  className="p-1 text-zinc-500 hover:text-zinc-200"
                  title="Re-check Ollama"
                >
                  <RefreshCw size={11} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Online Cloud Mode Card */}
        <div
          onClick={() => handleSelectMode('online')}
          className={`glass-panel p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between relative group ${
            mode === 'online'
              ? 'border-cyan-neon/50 bg-cyan-950/20 shadow-neon-cyan/20'
              : 'border-white/10 hover:border-white/20'
          }`}
        >
          {mode === 'online' && (
            <div className="absolute top-3 right-3 text-cyan-neon">
              <CheckCircle2 size={18} />
            </div>
          )}
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-neon/30 flex items-center justify-center text-cyan-neon">
              <Cloud size={20} />
            </div>
            <div>
              <div className="text-sm font-display font-bold text-zinc-100 tracking-wide flex items-center gap-2">
                Online Cloud Mode
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
                  Free Available
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                Connect to Google Gemini, Groq, or OpenRouter for lightning-fast reasoning and planning.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5">
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span>Providers:</span>
              <span className="text-cyan-neon">Gemini, Groq, OpenRouter</span>
            </div>
          </div>
        </div>
      </div>

      {/* Online Provider Selection */}
      {mode === 'online' && (
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-mono text-zinc-300">
            Choose Preferred Cloud Neural Provider:
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { id: 'gemini', name: 'Google Gemini', tag: 'Recommended Free', speed: 'High' },
              { id: 'groq', name: 'Groq Cloud', tag: 'Ultra-Fast Free', speed: '500 t/s' },
              { id: 'openrouter', name: 'OpenRouter', tag: 'Free Models Hub', speed: 'Fast' },
            ].map((p) => {
              const active = selectedProvider === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedProvider(p.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    active
                      ? 'border-cyan-neon/50 bg-cyan-500/10 text-cyan-neon font-semibold'
                      : 'border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="text-xs font-mono">{p.name}</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">{p.tag}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Buttons */}
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
          <span>Configure Provider</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};
