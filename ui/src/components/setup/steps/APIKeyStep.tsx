import React, { useState } from 'react';
import { Key, Server, ExternalLink, CheckCircle2, AlertCircle, RefreshCw, ArrowRight, ArrowLeft } from 'lucide-react';

interface APIKeyStepProps {
  provider: string;
  providerConfig: any;
  setProviderConfig: (cfg: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export const APIKeyStep: React.FC<APIKeyStepProps> = ({
  provider,
  providerConfig,
  setProviderConfig,
  onNext,
  onBack,
}) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const keyLinks: Record<string, { label: string; url: string }> = {
    gemini: { label: 'Get Free Gemini Key (Google AI Studio)', url: 'https://aistudio.google.com/app/apikey' },
    groq: { label: 'Get Free Groq Key (Groq Console)', url: 'https://console.groq.com/keys' },
    openrouter: { label: 'Get OpenRouter Key (Free Models Available)', url: 'https://openrouter.ai/keys' },
    openai: { label: 'OpenAI API Keys', url: 'https://platform.openai.com/api-keys' },
    anthropic: { label: 'Anthropic Console', url: 'https://console.anthropic.com/' },
  };

  const isLocal = provider === 'ollama';

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('http://127.0.0.1:8765/api/setup/test-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          api_key: providerConfig.api_key || '',
          model: providerConfig.model || '',
          base_url: providerConfig.base_url || '',
        }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (e: any) {
      setTestResult({ success: false, message: `Failed to connect: ${e.message}` });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex flex-col max-w-xl mx-auto space-y-6 animate-fade-slide-in">
      <div className="text-center space-y-1">
        <h2 className="text-xl md:text-2xl font-display font-bold text-zinc-100 tracking-wider uppercase">
          {provider.toUpperCase()} Configuration
        </h2>
        <p className="text-xs text-zinc-400 font-mono">
          {isLocal
            ? 'Verify Ollama local endpoint and model identifier'
            : 'Enter your credentials to link the neural engine'}
        </p>
      </div>

      <div className="glass-panel p-6 rounded-2xl border-white/10 space-y-4">
        {isLocal ? (
          <div>
            <label className="block text-xs font-mono text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Server size={13} className="text-emerald-400" />
              Ollama Server URL
            </label>
            <input
              type="text"
              value={providerConfig.base_url || 'http://localhost:11434'}
              onChange={(e) =>
                setProviderConfig({ ...providerConfig, base_url: e.target.value })
              }
              placeholder="http://localhost:11434"
              className="w-full bg-white/[0.03] border border-white/10 focus:border-cyan-neon/60 rounded-xl px-4 py-2.5 text-sm text-zinc-100 font-mono outline-none"
            />
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono text-zinc-300 flex items-center gap-1.5">
                <Key size={13} className="text-cyan-neon" />
                API Key
              </label>
              {keyLinks[provider] && (
                <a
                  href={keyLinks[provider].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-cyan-neon hover:underline font-mono flex items-center gap-1"
                >
                  <span>{keyLinks[provider].label}</span>
                  <ExternalLink size={10} />
                </a>
              )}
            </div>
            <input
              type="password"
              value={providerConfig.api_key || ''}
              onChange={(e) =>
                setProviderConfig({ ...providerConfig, api_key: e.target.value })
              }
              placeholder={`Paste your ${provider.toUpperCase()} API key...`}
              className="w-full bg-white/[0.03] border border-white/10 focus:border-cyan-neon/60 rounded-xl px-4 py-2.5 text-sm text-zinc-100 font-mono outline-none"
            />
          </div>
        )}

        {/* Model ID */}
        <div>
          <label className="block text-xs font-mono text-zinc-300 mb-1.5">
            Model Identifier
          </label>
          <input
            type="text"
            value={providerConfig.model || ''}
            onChange={(e) =>
              setProviderConfig({ ...providerConfig, model: e.target.value })
            }
            placeholder={
              provider === 'gemini'
                ? 'gemini-2.5-flash'
                : provider === 'groq'
                ? 'llama-3.3-70b-versatile'
                : provider === 'ollama'
                ? 'llama3:latest'
                : 'model identifier...'
            }
            className="w-full bg-white/[0.03] border border-white/10 focus:border-cyan-neon/60 rounded-xl px-4 py-2.5 text-sm text-zinc-100 font-mono outline-none"
          />
        </div>

        {/* Live Test Connection Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing || (!isLocal && !providerConfig.api_key)}
            className="w-full py-2.5 px-4 rounded-xl border border-cyan-neon/30 hover:border-cyan-neon/60 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-neon font-mono text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-40"
          >
            {testing ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                <span>Verifying neural connection...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={13} />
                <span>Test Connection</span>
              </>
            )}
          </button>

          {testResult && (
            <div
              className={`mt-3 p-3 rounded-xl border text-xs font-mono flex items-start gap-2 ${
                testResult.success
                  ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
                  : 'border-rose-500/40 bg-rose-950/20 text-rose-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={15} className="text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">{testResult.message}</div>
            </div>
          )}
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
          <span>Voice Persona</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};
