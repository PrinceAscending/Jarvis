import React, { useState } from 'react';
import {
  Zap,
  FolderSync,
  ShieldAlert,
  Camera,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
} from 'lucide-react';

interface WorkflowCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  tool: string;
  args: any;
  danger?: boolean;
}

const WORKFLOWS: WorkflowCard[] = [
  {
    id: 'system_doctor',
    title: 'System Doctor & Auto-Repair',
    description: 'Run deep diagnostic checks across hardware, SQLite, audio, and Ollama with automated safe repairs.',
    icon: Layers,
    tool: 'run_diagnostics',
    args: { auto_repair: true },
  },
  {
    id: 'screen_ocr',
    title: 'Windows 11 Screen OCR & Vision',
    description: 'Direct3D hardware-accelerated screen reading to extract visible text, buttons, and alert messages.',
    icon: Camera,
    tool: 'inspect_screen',
    args: { focus_area: 'fullscreen' },
  },
  {
    id: 'list_windows',
    title: 'List Active Windows',
    description: 'Audit all visible application windows on the desktop with process IDs and coordinates.',
    icon: Layers,
    tool: 'list_windows',
    args: { include_minimized: false },
  },
  {
    id: 'downloads_organizer',
    title: 'Organize Downloads folder',
    description: 'Automatically sort downloads into clean subfolders for Documents, Media, Archives, and Installers.',
    icon: FolderSync,
    tool: 'organize_folder',
    args: { folder_path: '~/Downloads', dry_run: false },
  },
  {
    id: 'lock_station',
    title: 'Lock computer',
    description: 'Immediately lock your Windows desktop session.',
    icon: ShieldAlert,
    tool: 'lock_workstation',
    args: {},
    danger: true,
  },
];

export const AutomationsView: React.FC = () => {
  const [runningId, setRunningId] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<any>(null);

  const runWorkflow = async (wf: WorkflowCard) => {
    setRunningId(wf.id);
    setLastResult(null);

    try {
      const res = await fetch('http://127.0.0.1:8765/api/tools/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: wf.tool, arguments: wf.args }),
      });
      const data = await res.json();
      setLastResult({ id: wf.id, data });
    } catch (e: any) {
      setLastResult({ id: wf.id, data: { success: false, error: e.toString() } });
    } finally {
      setRunningId(null);
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 md:p-8 space-y-6 select-none bg-void">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-text-bright flex items-center gap-2">
          <Zap className="text-signal" size={18} />
          Workflows
        </h2>
        <p className="text-xs text-text-muted mt-0.5">
          Trigger multi-step tasks across Windows apps, files, and system tools
        </p>
      </div>

      {/* Execution Result Banner */}
      {lastResult && (
        <div
          className={`p-3.5 rounded-xl border flex items-start gap-3 animate-fade-in ${
            lastResult.data.success
              ? 'bg-semantic-online/10 border-semantic-online/25 text-semantic-online'
              : 'bg-semantic-error/10 border-semantic-error/25 text-semantic-error'
          }`}
        >
          {lastResult.data.success ? (
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          )}
          <div className="flex-1 overflow-hidden text-xs">
            <div className="font-medium">
              {lastResult.data.success ? 'Workflow completed' : 'Execution failed'}
            </div>
            <div className="text-[11px] opacity-80 mt-0.5">
              {lastResult.data.message || lastResult.data.error || JSON.stringify(lastResult.data.data)}
            </div>
          </div>
        </div>
      )}

      {/* Grid of Workflows */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {WORKFLOWS.map((wf) => {
          const Icon = wf.icon;
          const isRunning = runningId === wf.id;

          return (
            <div
              key={wf.id}
              className="surface-card p-5 rounded-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-surface-elevated border border-surface-border flex items-center justify-center text-signal">
                    <Icon size={18} />
                  </div>
                  {wf.danger && (
                    <span className="px-2 py-0.5 rounded-md bg-semantic-error/10 border border-semantic-error/20 text-semantic-error text-[10px]">
                      Security action
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-medium text-text-bright">
                  {wf.title}
                </h3>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">
                  {wf.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-surface-border/50 flex items-center justify-end">
                <button
                  onClick={() => runWorkflow(wf)}
                  disabled={isRunning}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    wf.danger
                      ? 'bg-semantic-error hover:bg-semantic-error/90 text-white'
                      : 'bg-signal hover:bg-signal-hover text-white'
                  } disabled:opacity-50`}
                >
                  {isRunning ? (
                    <RotateCcw size={12} className="animate-spin" />
                  ) : (
                    <Play size={12} className="fill-current" />
                  )}
                  <span>{isRunning ? 'Running...' : 'Run'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
