import React from 'react';
import { Minus, X, Pin, Activity, Sparkles, AlertCircle } from 'lucide-react';
import { pyBridge } from '@/lib/pywebview';
import { useAppStore } from '@/store/useAppStore';

export const WindowHeader: React.FC = () => {
  const {
    status,
    connected,
    alwaysOnTop,
    setAlwaysOnTop,
    updateAvailable,
    updateInfo,
    setActiveTab,
    activeProvider,
  } = useAppStore();

  const togglePin = async () => {
    const next = !alwaysOnTop;
    setAlwaysOnTop(next);
    await pyBridge.setAlwaysOnTop(next);
  };

  const statusLabel = {
    idle: 'SYSTEM READY',
    listening: 'AUDIO INGEST',
    thinking: 'NEURAL PROCESSING',
    tool_executing: 'EXECUTING WORKFLOW',
    speaking: 'TRANSMITTING',
  }[status];

  return (
    <header className="h-10 w-full flex items-center justify-between px-4 border-b border-white/[0.06] bg-obsidian-950/80 backdrop-blur-md window-drag select-none z-50">
      {/* Brand & Connection status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                connected ? 'bg-cyan-neon' : 'bg-rose-500'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                connected ? 'bg-cyan-neon' : 'bg-rose-500'
              }`}
            />
          </span>
          <span className="font-display font-bold text-xs tracking-widest text-zinc-100 uppercase">
            J.A.R.V.I.S.
          </span>
          <span className="text-[10px] text-zinc-500 font-mono tracking-tighter">v4.2.0</span>
        </div>

        <div className="h-3 w-px bg-white/10" />

        {/* Live Status Badge */}
        {connected ? (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
            <Activity size={10} className="text-cyan-neon animate-pulse" />
            <span className="font-mono text-[9px] tracking-wider text-cyan-neon font-medium">
              {statusLabel}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <AlertCircle size={10} className="animate-spin" />
            <span className="font-mono text-[9px] tracking-wider font-medium">
              CONNECTING...
            </span>
          </div>
        )}

        {/* Update Available Badge */}
        {updateAvailable && (
          <button
            onClick={() => setActiveTab('settings')}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-neon/40 text-cyan-neon font-mono text-[9px] animate-pulse hover:bg-cyan-500/30 transition-colors window-no-drag"
          >
            <Sparkles size={10} />
            <span>UPDATE {updateInfo?.latest_version || 'READY'}</span>
          </button>
        )}
      </div>

      {/* Windows Controls (No drag) */}
      <div className="flex items-center gap-1 window-no-drag">
        <button
          onClick={togglePin}
          title={alwaysOnTop ? 'Disable Always on Top' : 'Pin Always on Top'}
          className={`p-1.5 rounded transition-all ${
            alwaysOnTop
              ? 'text-cyan-neon bg-cyan-dim'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
          }`}
        >
          <Pin size={13} className={alwaysOnTop ? 'rotate-45' : ''} />
        </button>

        <button
          onClick={() => pyBridge.minimize()}
          title="Minimize Window"
          className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-white/5 rounded transition-colors"
        >
          <Minus size={13} />
        </button>

        <button
          onClick={() => pyBridge.close()}
          title="Close Window"
          className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
        >
          <X size={13} />
        </button>
      </div>
    </header>
  );
};
