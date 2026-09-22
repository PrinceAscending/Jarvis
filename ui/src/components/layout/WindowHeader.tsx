import React from 'react';
import { Minus, X, Pin, Sparkles, AlertCircle } from 'lucide-react';
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
  } = useAppStore();

  const togglePin = async () => {
    const next = !alwaysOnTop;
    setAlwaysOnTop(next);
    await pyBridge.setAlwaysOnTop(next);
  };

  const statusLabel = {
    idle: 'System ready',
    listening: 'Listening',
    thinking: 'Processing',
    tool_executing: 'Running workflow',
    speaking: 'Speaking',
  }[status];

  return (
    <header className="h-9 w-full flex items-center justify-between px-3.5 border-b border-surface-border bg-void/95 window-drag select-none z-50">
      {/* Brand & Connection status */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full transition-colors ${
              connected ? 'bg-semantic-online' : 'bg-semantic-error'
            }`}
          />
          <span className="font-sans font-semibold text-xs tracking-tight text-text-bright">
            Jarvis
          </span>
        </div>

        <div className="h-3 w-px bg-white/[0.08]" />

        {/* Status indicator */}
        {connected ? (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-surface border border-surface-border">
            <span className="text-[11px] font-normal text-text-muted">
              {statusLabel}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-semantic-error/10 border border-semantic-error/20 text-semantic-error">
            <AlertCircle size={11} className="animate-spin" />
            <span className="text-[11px] font-normal">
              Connecting...
            </span>
          </div>
        )}

        {/* Update notification pill */}
        {updateAvailable && (
          <button
            onClick={() => setActiveTab('settings')}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-signal/15 border border-signal/30 text-signal hover:bg-signal/25 text-[11px] font-medium transition-colors window-no-drag"
          >
            <Sparkles size={11} />
            <span>Update {updateInfo?.latest_version ? `v${updateInfo.latest_version}` : 'ready'}</span>
          </button>
        )}
      </div>

      {/* Window Controls */}
      <div className="flex items-center gap-0.5 window-no-drag">
        <button
          onClick={togglePin}
          title={alwaysOnTop ? 'Unpin window' : 'Keep on top'}
          className={`p-1.5 rounded-md transition-colors ${
            alwaysOnTop
              ? 'text-signal bg-signal/15'
              : 'text-text-muted hover:text-text-bright hover:bg-surface'
          }`}
        >
          <Pin size={13} className={alwaysOnTop ? 'rotate-45' : ''} />
        </button>

        <button
          onClick={() => pyBridge.minimize()}
          title="Minimize"
          className="p-1.5 text-text-muted hover:text-text-bright hover:bg-surface rounded-md transition-colors"
        >
          <Minus size={13} />
        </button>

        <button
          onClick={() => pyBridge.close()}
          title="Close"
          className="p-1.5 text-text-muted hover:text-semantic-error hover:bg-semantic-error/10 rounded-md transition-colors"
        >
          <X size={13} />
        </button>
      </div>
    </header>
  );
};
