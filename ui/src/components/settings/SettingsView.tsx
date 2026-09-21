import React, { useState, useEffect } from 'react';
import {
  Settings2,
  Cpu,
  Key,
  Volume2,
  Shield,
  Save,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Server,
  Download,
  GitBranch,
  ExternalLink,
  Trash2,
  AlertTriangle,
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
      .catch((e) => {
        toast.error('Settings Error', 'Unable to load configuration from backend.');
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
        toast.success('Configuration Saved', 'All settings synced and neural engine reloaded.');
        setTimeout(() => setSaveStatus('idle'), 2500);
      } else {
        setSaveStatus('error');
        toast.error('Save Failed', 'Server rejected updated configuration.');
      }
    } catch (e: any) {
      setSaveStatus('error');
      toast.error('Connection Error', e.message);
    }
  };

  const handleCheckUpdates = async () => {
    setCheckingUpdate(true);
    try {
      const res = await fetch('http://127.0.0.1:8765/api/updates/check');
      const data = await res.json();
      setUpdateInfo(data);
      if (data.update_available) {
        toast.info('Update Available', `New version ${data.latest_version} is available on GitHub.`);
      } else {
        toast.success('Up to Date', `JARVIS v${data.current_version || '4.2.0'} is running the latest build.`);
      }
    } catch (e: any) {
      toast.error('Update Check Failed', e.message);
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

      // Poll progress
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
            toast.success('Update Downloaded', 'Installer is ready to apply.');
          } else if (status.status === 'error') {
            clearInterval(poll);
            setDownloadingUpdate(false);
            toast.error('Download Failed', status.error_message);
          }
        } catch {
          clearInterval(poll);
          setDownloadingUpdate(false);
        }
      }, 1000);
    } catch (e: any) {
      setDownloadingUpdate(false);
      toast.error('Download Error', e.message);
    }
  };

  const handleApplyUpdate = async () => {
    try {
      await fetch('http://127.0.0.1:8765/api/updates/apply', { method: 'POST' });
      toast.info('Applying Update', 'Installer launched. JARVIS will restart.');
    } catch (e: any) {
      toast.error('Apply Failed', e.message);
    }
  };

  if (!settings) {
    return (
      <div className="flex-1 h-full p-8 space-y-6 cyber-grid overflow-y-auto">
        <SkeletonCard height="h-28" />
        <SkeletonCard height="h-44" />
        <SkeletonCard height="h-44" />
      </div>
    );
  }

  const currentProviderConfig = settings.ai?.providers?.[activeProv] || {};

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 md:p-8 space-y-6 cyber-grid select-none animate-fade-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-display font-bold tracking-wider text-zinc-100 uppercase flex items-center gap-2">
            <Settings2 className="text-cyan-neon" size={20} />
            Neural Matrix & System Preferences
          </h2>
          <p className="text-xs font-mono text-zinc-400 mt-0.5">
            Manage local offline models, online cloud keys, audio personas, and updates
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-obsidian-950 font-semibold font-mono text-xs transition-all shadow-neon-cyan"
        >
          <Save size={14} />
          <span>{saveStatus === 'saved' ? 'CONFIG SAVED!' : 'SAVE SETTINGS'}</span>
        </button>
      </div>

      {/* Provider Selector Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/[0.08] pb-3">
        {[
          { id: 'ollama', label: 'Ollama (Local Offline)', isLocal: true },
          { id: 'gemini', label: 'Google Gemini (Free)', isFree: true },
          { id: 'groq', label: 'Groq (Ultra-Fast Free)', isFree: true },
          { id: 'openrouter', label: 'OpenRouter (Free Hub)', isFree: true },
          { id: 'openai', label: 'OpenAI (GPT-4o)' },
          { id: 'anthropic', label: 'Anthropic (Claude)' },
        ].map((p) => {
          const isSelected = activeProv === p.id;
          return (
            <button
              key={p.id}
              onClick={() => handleProviderChange(p.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono transition-all flex items-center gap-2 ${
                isSelected
                  ? 'bg-cyan-500/15 text-cyan-neon border border-cyan-neon/40 shadow-[0_0_15px_rgba(0,240,255,0.15)] font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              {p.isLocal ? <Server size={13} className="text-emerald-400" /> : <Cpu size={13} />}
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* Selected Provider Form */}
      <div className="glass-panel p-6 rounded-2xl border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-mono text-cyan-neon uppercase tracking-wider">
            {activeProv.toUpperCase()} SETTINGS
          </h3>
          <span className="text-[11px] font-mono text-zinc-500">
            {activeProv === 'ollama' ? 'Runs 100% locally on your hardware' : 'Cloud Neural API'}
          </span>
        </div>

        {/* Ollama Local URL or API Key */}
        {activeProv === 'ollama' ? (
          <div>
            <label className="block text-xs font-mono text-zinc-300 mb-1.5">
              Ollama Server Base URL
            </label>
            <input
              type="text"
              value={currentProviderConfig.base_url || 'http://localhost:11434'}
              onChange={(e) => updateProviderConfig('ollama', 'base_url', e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-100 font-mono outline-none focus:border-cyan-neon/50"
              placeholder="http://localhost:11434"
            />
          </div>
        ) : (
          <div>
            <label className="block text-xs font-mono text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Key size={13} className="text-cyan-neon" />
              API Key
            </label>
            <input
              type="password"
              value={currentProviderConfig.api_key || ''}
              onChange={(e) => updateProviderConfig(activeProv, 'api_key', e.target.value)}
              placeholder={`Enter your ${activeProv.toUpperCase()} API key...`}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-100 font-mono outline-none focus:border-cyan-neon/50"
            />
          </div>
        )}

        {/* Model ID */}
        <div>
          <label className="block text-xs font-mono text-zinc-300 mb-1.5">
            Model Name / Identifier
          </label>
          <input
            type="text"
            value={currentProviderConfig.model || ''}
            onChange={(e) => updateProviderConfig(activeProv, 'model', e.target.value)}
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-100 font-mono outline-none focus:border-cyan-neon/50"
            placeholder="e.g. gemini-2.5-flash, llama-3.3-70b-versatile, llama3:latest"
          />
        </div>
      </div>

      {/* Voice & Speech Configuration */}
      <div className="glass-panel p-6 rounded-2xl border-white/10 space-y-4">
        <h3 className="text-sm font-mono text-cyan-neon uppercase tracking-wider flex items-center gap-2">
          <Volume2 size={16} />
          Neural Voice Output (Edge TTS)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono text-zinc-300 mb-1.5">
              Voice Persona
            </label>
            <select
              value={settings.voice?.tts_voice || 'en-US-ChristopherNeural'}
              onChange={(e) =>
                setSettings((prev: any) => ({
                  ...prev,
                  voice: { ...prev.voice, tts_voice: e.target.value },
                }))
              }
              className="w-full bg-obsidian-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-zinc-200 font-mono outline-none"
            >
              {voices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.friendly_name || v.name} ({v.gender})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-300 mb-1.5">
              Speech Rate
            </label>
            <select
              value={settings.voice?.tts_rate || '+5%'}
              onChange={(e) =>
                setSettings((prev: any) => ({
                  ...prev,
                  voice: { ...prev.voice, tts_rate: e.target.value },
                }))
              }
              className="w-full bg-obsidian-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-zinc-200 font-mono outline-none"
            >
              <option value="-10%">Slower (-10%)</option>
              <option value="+0%">Normal (0%)</option>
              <option value="+5%">Slightly Faster (+5%)</option>
              <option value="+15%">Fast (+15%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Security & Permissions Level */}
      <div className="glass-panel p-6 rounded-2xl border-white/10 space-y-4">
        <h3 className="text-sm font-mono text-cyan-neon uppercase tracking-wider flex items-center gap-2">
          <Shield size={16} />
          Autonomy & Permission Guardrails
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              id: 'strict',
              name: 'Strict Verification',
              desc: 'Confirm every action before executing any modification.',
            },
            {
              id: 'interactive',
              name: 'Interactive (Recommended)',
              desc: 'Execute read-only and safe operations automatically; confirm destructive ones.',
            },
            {
              id: 'autonomous',
              name: 'Autonomous Assistant',
              desc: 'Execute workflows autonomously, only pausing for critical security actions.',
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
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-cyan-500/10 border-cyan-neon/40 shadow-neon-cyan'
                    : 'border-white/5 hover:border-white/15'
                }`}
              >
                <div className="text-xs font-mono font-semibold text-zinc-100">{mode.name}</div>
                <div className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{mode.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* GitHub Releases & Auto-Update Section */}
      <div className="glass-panel p-6 rounded-2xl border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-mono text-cyan-neon uppercase tracking-wider flex items-center gap-2">
            <GitBranch size={16} />
            Version & GitHub Auto-Update
          </h3>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-neon/30 text-cyan-neon">
            Current: v4.2.0
          </span>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <div>
            <div className="text-xs font-mono text-zinc-200 flex items-center gap-2">
              <span>Official Repository:</span>
              <a
                href="https://github.com/PrinceAscending/Jarvis"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-neon hover:underline flex items-center gap-1"
              >
                <span>PrinceAscending/Jarvis</span>
                <ExternalLink size={11} />
              </a>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono mt-1">
              Checks GitHub Releases for new installer binaries and patches.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCheckUpdates}
            disabled={checkingUpdate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-neon/40 text-cyan-neon font-mono text-xs transition-all disabled:opacity-40"
          >
            <RefreshCw size={13} className={checkingUpdate ? 'animate-spin' : ''} />
            <span>{checkingUpdate ? 'Querying GitHub...' : 'Check for Updates'}</span>
          </button>
        </div>

        {/* Update Notification Box */}
        {updateInfo && updateInfo.update_available && (
          <div className="p-4 rounded-xl border border-cyan-neon/40 bg-cyan-950/30 space-y-3 animate-fade-slide-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-neon">
                <Sparkles size={14} />
                <span>NEW UPDATE: {updateInfo.latest_version}</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">
                {updateInfo.published_at ? new Date(updateInfo.published_at).toLocaleDateString() : ''}
              </span>
            </div>

            {updateInfo.release_notes && (
              <div className="text-xs text-zinc-300 font-mono bg-white/[0.02] p-3 rounded-lg border border-white/5 max-h-24 overflow-y-auto">
                {updateInfo.release_notes}
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              {updateReady ? (
                <button
                  type="button"
                  onClick={handleApplyUpdate}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-obsidian-950 font-mono text-xs font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                >
                  Restart & Apply Update
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDownloadUpdate}
                  disabled={downloadingUpdate}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-obsidian-950 font-mono text-xs font-bold transition-all shadow-neon-cyan"
                >
                  <Download size={13} />
                  <span>{downloadingUpdate ? `Downloading (${downloadProgress}%)...` : 'Download & Install Update'}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Danger Zone: In-App Uninstaller */}
      <div className="glass-panel p-6 rounded-2xl border-rose-500/20 space-y-4 bg-rose-950/5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-mono text-rose-400 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle size={16} />
            Danger Zone
          </h3>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl border border-rose-500/20 bg-rose-500/5">
          <div>
            <div className="text-xs font-mono font-bold text-zinc-100">
              Complete Uninstallation
            </div>
            <p className="text-[11px] text-zinc-400 font-mono mt-1 leading-relaxed">
              Permanently delete all application files, database, memory logs, keyring credentials, and desktop shortcuts.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsUninstallOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-500/40 hover:bg-rose-500/20 text-rose-400 font-mono text-xs transition-colors shrink-0"
          >
            <Trash2 size={13} />
            <span>Uninstall JARVIS...</span>
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
