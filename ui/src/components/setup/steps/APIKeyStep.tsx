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
    gemini: { label: 'Get free Gemini key', url: 'https://aistudio.google.com/app/apikey' },
    groq: { label: 'Get free Groq key', url: 'https://console.groq.com/keys' },
    openrouter: { label: 'Get OpenRouter key', url: 'https://openrouter.ai/keys' },
    openai: { label: 'OpenAI API keys', url: 'https://platform.openai.com/api-keys' },
    anthropic: { label: 'Anthropic console', url: 'https://console.anthropic.com/' },
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
    <div className="flex flex-col max-w-md mx-auto space-y-5 animate-fade-in">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-semibold text-text-bright tracking-tight capitalize">
          {provider} configuration
        </h2>
        <p className="text-xs text-text-muted">
          {isLocal
            ? 'Verify Ollama local endpoint and model identifier'
            : 'Enter your API key to connect the model'}
        </p>
      </div>

      <div className="surface-card p-5 rounded-xl space-y-3.5">
        {isLocal ? (
          <div>
            <label className="block text-xs text-text-muted mb-1 flex items-center gap-1.5">
              <Server size={13} className="text-semantic-online" />
              Ollama server URL
            </label>
            <input
              type="text"
              value={providerConfig.base_url || 'http://localhost:11434'}
              onChange={(e) =>
                setProviderConfig({ ...providerConfig, base_url: e.target.value })
              }
              placeholder="http://localhost:11434"
              className="w-full bg-surface-well border border-surface-border focus:border-signal/60 rounded-lg px-3.5 py-2 text-sm text-text-bright font-mono outline-none"
            />
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-text-muted flex items-center gap-1.5">
                <Key size={13} className="text-signal" />
                API key
              </label>
              {keyLinks[provider] && (
                <a
                  href={keyLinks[provider].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-signal hover:underline flex items-center gap-1"
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
              placeholder="Paste API key..."
              className="w-full bg-surface-well border border-surface-border focus:border-signal/60 rounded-lg px-3.5 py-2 text-sm text-text-bright font-mono outline-none"
            />
          </div>
        )}

        {/* Model Identifier */}
        <div>
          <label className="block text-xs text-text-muted mb-1">
            Model identifier
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
            className="w-full bg-surface-well border border-surface-border focus:border-signal/60 rounded-lg px-3.5 py-2 text-sm text-text-bright font-mono outline-none"
          />
        </div>

        {/* Test Connection Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing || (!isLocal && !providerConfig.api_key)}
            className="w-full py-2 px-3 rounded-lg border border-surface-border hover:bg-surface-elevated text-text text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
          >
            {testing ? (
              <>
                <RefreshCw size={12} className="animate-spin text-signal" />
                <span>Verifying connection...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={12} />
                <span>Test connection</span>
              </>
            )}
          </button>

          {testResult && (
            <div
              className={`mt-2.5 p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                testResult.success
                  ? 'border-semantic-online/30 bg-semantic-online/10 text-semantic-online'
                  : 'border-semantic-error/30 bg-semantic-error/10 text-semantic-error'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
              )}
              <div className="flex-1 text-[11px]">{testResult.message}</div>
            </div>
          )}
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
