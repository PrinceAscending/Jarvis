import React, { useState, useEffect } from 'react';
import {
  Settings,
  Cpu,
  Key,
  Volume2,
  Shield,
  Save,
  Server,
  Download,
  Trash2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { toast } from '@/hooks/useToast';
import { UninstallDialog } from './UninstallDialog';

export const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState<any>(null);
  const [activeProv, setActiveProv] = useState('gemini');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [voices, setVoices] = useState<any[]>([]);

  // Auto-Update state
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [downloadingUpdate, setDownloadingUpdate] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [updateReady, setUpdateReady] = useState(false);

  // Uninstaller dialog state
  const [isUninstallOpen, setIsUninstallOpen] = useState(false);

  useEffect(() => {
    fetch('http://127.0.0.1:8765/api/settings')
      .then((res) => res.json())
      .then((data) => {
        setSettings(data);
        if (data.ai?.active_provider) {
          setActiveProv(data.ai.active_provider);
        }
      })
      .catch(() => {
        toast.error('Settings error', 'Unable to load configuration from backend.');
      });

    fetch('http://127.0.0.1:8765/api/voice/voices')
      .then((res) => res.json())
      .then((data) => setVoices(data || []))
      .catch(console.error);
  }, []);

  const handleProviderChange = (prov: string) => {
    setActiveProv(prov);
    setSettings((prev: any) => ({
      ...prev,
      ai: { ...prev.ai, active_provider: prov },
    }));
  };

  const updateProviderConfig = (prov: string, field: string, value: any) => {
    setSettings((prev: any) => ({
      ...prev,
      ai: {
        ...prev.ai,
        providers: {
          ...prev.ai.providers,
          [prov]: {
            ...prev.ai.providers[prov],
            [field]: value,
          },
        },
      },
    }));
  };

  const handleSave = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8765/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaveStatus('saved');
        toast.success('Changes saved', 'Settings have been applied.');
        setTimeout(() => setSaveStatus('idle'), 2500);
      } else {
        setSaveStatus('error');
        toast.error('Save failed', 'Server rejected configuration changes.');
      }
    } catch (e: any) {
      setSaveStatus('error');
      toast.error('Connection error', e.message);
    }
  };

  const handleCheckUpdates = async () => {
    setCheckingUpdate(true);
    try {
      const res = await fetch('http://127.0.0.1:8765/api/updates/check');
      const data = await res.json();
      setUpdateInfo(data);
      if (data.update_available) {
        toast.info('Update available', `Version ${data.latest_version} is ready to download.`);
      } else {
        toast.success('Up to date', `You are running the latest version (${data.current_version || '4.2.0'}).`);
      }
    } catch (e: any) {
      toast.error('Update check failed', e.message);
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleDownloadUpdate = async () => {
    if (!updateInfo?.download_url) return;
    setDownloadingUpdate(true);
    setDownloadProgress(10);
    try {
      await fetch('http://127.0.0.1:8765/api/updates/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ download_url: updateInfo.download_url }),
      });

      const poll = setInterval(async () => {
        try {
          const sRes = await fetch('http://127.0.0.1:8765/api/updates/status');
          const status = await sRes.json();
          if (status.status === 'downloading') {
            setDownloadProgress(status.progress_percent || 30);
          } else if (status.status === 'ready') {
            clearInterval(poll);
            setDownloadingUpdate(false);
            setUpdateReady(true);
            setDownloadProgress(100);
            toast.success('Download complete', 'Update installer is ready.');
          } else if (status.status === 'error') {
            clearInterval(poll);
            setDownloadingUpdate(false);
            toast.error('Download failed', status.error_message);
          }
        } catch {
          clearInterval(poll);
          setDownloadingUpdate(false);
        }
      }, 1000);
    } catch (e: any) {
      setDownloadingUpdate(false);
      toast.error('Download error', e.message);
    }
  };

  const handleApplyUpdate = async () => {
    try {
      await fetch('http://127.0.0.1:8765/api/updates/apply', { method: 'POST' });
      toast.info('Installing update', 'Jarvis will restart to finish.');
    } catch (e: any) {
      toast.error('Apply failed', e.message);
    }
  };

  if (!settings) {
    return (
      <div className="flex-1 h-full p-8 space-y-6 overflow-y-auto bg-void">
        <SkeletonCard height="h-28" />
        <SkeletonCard height="h-44" />
        <SkeletonCard height="h-44" />
      </div>
    );
  }

  const currentProviderConfig = settings.ai?.providers?.[activeProv] || {};

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 md:p-8 space-y-6 select-none bg-void">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-text-bright flex items-center gap-2">
            <Settings className="text-signal" size={18} />
            Settings
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Configure AI models, voice preferences, permissions, and updates
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-signal hover:bg-signal-hover text-white font-medium text-xs transition-colors"
        >
          <Save size={13} />
          <span>{saveStatus === 'saved' ? 'Saved' : 'Save changes'}</span>
        </button>
      </div>

      {/* AI Provider Section */}
      <div className="surface-card p-5 rounded-xl space-y-4">
        <div>
          <h3 className="text-sm font-medium text-text-bright">
            AI provider
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Choose between local offline inference or cloud models
          </p>
        </div>

        {/* Provider Tabs */}
        <div className="flex flex-wrap gap-1.5 border-b border-surface-border pb-3">
          {[
            { id: 'ollama', label: 'Ollama', isLocal: true },
            { id: 'gemini', label: 'Gemini' },
            { id: 'groq', label: 'Groq' },
            { id: 'openrouter', label: 'OpenRouter' },
            { id: 'openai', label: 'OpenAI' },
            { id: 'anthropic', label: 'Anthropic' },
          ].map((p) => {
            const isSelected = activeProv === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleProviderChange(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-surface-elevated text-text-bright border border-surface-border font-medium'
                    : 'text-text-muted hover:text-text hover:bg-surface-elevated/40 border border-transparent'
                }`}
              >
                {p.isLocal ? <Server size={12} className="text-semantic-online" /> : <Cpu size={12} />}
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>

        {/* Provider Fields */}
        <div className="space-y-3 pt-1">
          {activeProv === 'ollama' ? (
            <div>
              <label className="block text-xs text-text-muted mb-1">
                Ollama server URL
              </label>
              <input
                type="text"
                value={currentProviderConfig.base_url || 'http://localhost:11434'}
                onChange={(e) => updateProviderConfig('ollama', 'base_url', e.target.value)}
                className="w-full bg-surface-well border border-surface-border rounded-lg px-3.5 py-2 text-sm text-text-bright font-mono outline-none focus:border-signal/50"
                placeholder="http://localhost:11434"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs text-text-muted mb-1 flex items-center gap-1.5">
                <Key size={12} className="text-signal" />
                API key
              </label>
              <input
                type="password"
                value={currentProviderConfig.api_key || ''}
                onChange={(e) => updateProviderConfig(activeProv, 'api_key', e.target.value)}
                placeholder={`Enter your ${activeProv} API key...`}
                className="w-full bg-surface-well border border-surface-border rounded-lg px-3.5 py-2 text-sm text-text-bright font-mono outline-none focus:border-signal/50"
              />
            </div>
          )}

          <div>
            <label className="block text-xs text-text-muted mb-1">
              Model identifier
            </label>
            <input
              type="text"
              value={currentProviderConfig.model || ''}
              onChange={(e) => updateProviderConfig(activeProv, 'model', e.target.value)}
              className="w-full bg-surface-well border border-surface-border rounded-lg px-3.5 py-2 text-sm text-text-bright font-mono outline-none focus:border-signal/50"
              placeholder="e.g. gemini-2.5-flash, llama-3.3-70b-versatile, llama3:latest"
            />
          </div>
        </div>
      </div>

      {/* Voice Configuration */}
      <div className="surface-card p-5 rounded-xl space-y-4">
        <div>
          <h3 className="text-sm font-medium text-text-bright flex items-center gap-2">
            <Volume2 size={16} className="text-signal" />
            Voice
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Select speech voice and playback rate
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-text-muted mb-1">
              Voice persona
            </label>
            <select
              value={settings.voice?.tts_voice || 'en-US-ChristopherNeural'}
              onChange={(e) =>
                setSettings((prev: any) => ({
                  ...prev,
                  voice: { ...prev.voice, tts_voice: e.target.value },
                }))
              }
              className="w-full bg-surface-well border border-surface-border rounded-lg px-3.5 py-2 text-xs text-text outline-none"
            >
              {voices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.friendly_name || v.name} ({v.gender})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-text-muted mb-1">
              Speech rate
            </label>
            <select
              value={settings.voice?.tts_rate || '+5%'}
              onChange={(e) =>
                setSettings((prev: any) => ({
                  ...prev,
                  voice: { ...prev.voice, tts_rate: e.target.value },
                }))
              }
              className="w-full bg-surface-well border border-surface-border rounded-lg px-3.5 py-2 text-xs text-text outline-none"
            >
              <option value="-10%">Slower (-10%)</option>
              <option value="+0%">Normal (0%)</option>
              <option value="+5%">Slightly faster (+5%)</option>
              <option value="+15%">Fast (+15%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Security & Permissions Level */}
      <div className="surface-card p-5 rounded-xl space-y-4">
        <div>
          <h3 className="text-sm font-medium text-text-bright flex items-center gap-2">
            <Shield size={16} className="text-signal" />
            Permissions
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Control autonomy and tool execution boundaries
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              id: 'strict',
              name: 'Ask before acting',
              desc: 'Confirm every action before executing any modification.',
            },
            {
              id: 'interactive',
              name: 'Ask for risky actions',
              desc: 'Safe and read-only operations run automatically; prompt for destructive ones.',
            },
            {
              id: 'autonomous',
              name: 'Act independently',
              desc: 'Execute workflows autonomously, pausing only for critical security gates.',
            },
          ].map((mode) => {
            const isSelected = (settings.permissions?.level || 'interactive') === mode.id;
            return (
              <div
                key={mode.id}
                onClick={() =>
                  setSettings((prev: any) => ({
                    ...prev,
                    permissions: { ...prev.permissions, level: mode.id },
                  }))
                }
                className={`p-3.5 rounded-xl border cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-surface-elevated border-signal/50'
                    : 'bg-surface-well border-surface-border hover:border-surface-border/80'
                }`}
              >
                <div className="text-xs font-medium text-text-bright">{mode.name}</div>
                <div className="text-[11px] text-text-muted mt-1 leading-relaxed">{mode.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Updates Section */}
      <div className="surface-card p-5 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-text-bright">
              Updates
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Current build: v4.2.0
            </p>
          </div>

          <button
            type="button"
            onClick={handleCheckUpdates}
            disabled={checkingUpdate}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-elevated border border-surface-border text-text hover:text-text-bright text-xs transition-colors disabled:opacity-40"
          >
            <RefreshCw size={12} className={checkingUpdate ? 'animate-spin' : ''} />
            <span>{checkingUpdate ? 'Checking...' : 'Check for updates'}</span>
          </button>
        </div>

        {/* Update Notification Box */}
        {updateInfo && updateInfo.update_available && (
          <div className="p-4 rounded-xl border border-signal/30 bg-surface-elevated space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-text-bright">
                <Sparkles size={14} className="text-signal" />
                <span>Version {updateInfo.latest_version} available</span>
              </div>
              <span className="text-[10px] text-text-muted">
                {updateInfo.published_at ? new Date(updateInfo.published_at).toLocaleDateString() : ''}
              </span>
            </div>

            {updateInfo.release_notes && (
              <div className="text-xs text-text-muted bg-surface-well p-3 rounded-lg border border-surface-border max-h-24 overflow-y-auto">
                {updateInfo.release_notes}
              </div>
            )}

            <div className="flex items-center justify-end pt-1">
              {updateReady ? (
                <button
                  type="button"
                  onClick={handleApplyUpdate}
                  className="px-4 py-1.5 rounded-lg bg-semantic-online hover:bg-semantic-online/90 text-void text-xs font-medium transition-colors"
                >
                  Restart & apply update
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDownloadUpdate}
                  disabled={downloadingUpdate}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-signal hover:bg-signal-hover text-white text-xs font-medium transition-colors"
                >
                  <Download size={13} />
                  <span>{downloadingUpdate ? `Downloading (${downloadProgress}%)...` : 'Download update'}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Uninstall Section */}
      <div className="surface-card p-5 rounded-xl space-y-4 border-semantic-error/20">
        <div>
          <h3 className="text-sm font-medium text-text-bright">
            Uninstall Jarvis
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Remove all local memory logs, credentials, database records, and application files.
          </p>
        </div>

        <div className="flex items-center justify-end pt-1">
          <button
            type="button"
            onClick={() => setIsUninstallOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-semantic-error/30 hover:bg-semantic-error/10 text-semantic-error text-xs transition-colors"
          >
            <Trash2 size={13} />
            <span>Uninstall...</span>
          </button>
        </div>
      </div>

      {/* Uninstall Modal Dialog */}
      <UninstallDialog
        isOpen={isUninstallOpen}
        onClose={() => setIsUninstallOpen(false)}
      />
    </div>
  );
};
