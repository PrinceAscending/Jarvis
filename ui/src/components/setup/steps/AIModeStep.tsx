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
    <div className="flex flex-col max-w-xl mx-auto space-y-5 animate-fade-in">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-semibold text-text-bright tracking-tight">
          Select AI operational mode
        </h2>
        <p className="text-xs text-text-muted">
          Run models locally on your PC or connect to free cloud providers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
        {/* Local Mode Card */}
        <div
          onClick={() => handleSelectMode('local')}
          className={`surface-card p-4 rounded-xl cursor-pointer transition-colors flex flex-col justify-between relative ${
            mode === 'local'
              ? 'border-semantic-online/50 bg-surface-elevated'
              : 'hover:border-surface-border/90'
          }`}
        >
          {mode === 'local' && (
            <div className="absolute top-3 right-3 text-semantic-online">
              <CheckCircle2 size={16} />
            </div>
          )}
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-semantic-online/15 text-semantic-online flex items-center justify-center">
              <Server size={17} />
            </div>
            <div>
              <div className="text-sm font-medium text-text-bright flex items-center gap-1.5">
                Local (Ollama)
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-semantic-online/15 text-semantic-online">
                  Offline
                </span>
              </div>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Runs locally on your CPU/GPU with total privacy. Zero internet needed.
              </p>
            </div>
          </div>

          {/* Ollama Probe Status */}
          <div className="mt-4 pt-2.5 border-t border-surface-border/50 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Ollama:</span>
              <div className="flex items-center gap-1">
                {checking ? (
                  <span className="text-text-muted flex items-center gap-1">
                    <RefreshCw size={10} className="animate-spin" /> Checking...
                  </span>
                ) : ollamaDetected ? (
                  <span className="text-semantic-online flex items-center gap-1">
                    <CheckCircle2 size={11} /> Ready ({ollamaModels.length} models)
                  </span>
                ) : (
                  <span className="text-warm flex items-center gap-1">
                    <AlertCircle size={11} /> Not running
                  </span>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    checkOllama();
                  }}
                  className="p-1 text-text-muted hover:text-text-bright"
                  title="Refresh Ollama status"
                >
                  <RefreshCw size={10} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Online Cloud Mode Card */}
        <div
          onClick={() => handleSelectMode('online')}
          className={`surface-card p-4 rounded-xl cursor-pointer transition-colors flex flex-col justify-between relative ${
            mode === 'online'
              ? 'border-signal/50 bg-surface-elevated'
              : 'hover:border-surface-border/90'
          }`}
        >
          {mode === 'online' && (
            <div className="absolute top-3 right-3 text-signal">
              <CheckCircle2 size={16} />
            </div>
          )}
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-signal/15 text-signal flex items-center justify-center">
              <Cloud size={17} />
            </div>
            <div>
              <div className="text-sm font-medium text-text-bright flex items-center gap-1.5">
                Cloud providers
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-signal/15 text-signal">
                  Free tiers
                </span>
              </div>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Google Gemini, Groq, or OpenRouter for fast inference and complex reasoning.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-2.5 border-t border-surface-border/50 text-[11px] text-text-muted flex items-center justify-between">
            <span>Supported:</span>
            <span className="text-text">Gemini, Groq, OpenRouter</span>
          </div>
        </div>
      </div>

      {/* Online Provider Selection */}
      {mode === 'online' && (
        <div className="space-y-2 pt-1">
          <label className="block text-xs text-text-muted">
            Select cloud provider:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'gemini', name: 'Gemini', tag: 'Recommended free' },
              { id: 'groq', name: 'Groq', tag: 'Fast free' },
              { id: 'openrouter', name: 'OpenRouter', tag: 'Free hub' },
            ].map((p) => {
              const active = selectedProvider === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedProvider(p.id)}
                  className={`p-2.5 rounded-lg border text-left transition-colors ${
                    active
                      ? 'border-signal bg-signal/10 text-text-bright'
                      : 'border-surface-border text-text-muted hover:text-text hover:bg-surface-elevated/40'
                  }`}
                >
                  <div className="text-xs font-medium">{p.name}</div>
                  <div className="text-[10px] text-text-muted mt-0.5">{p.tag}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-3">
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
