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
    id: 'downloads_organizer',
    title: 'Downloads Folder Organizer',
    description: 'Automatically sort messy downloads into categorized subfolders (Documents, Media, Archives, Installers).',
    icon: FolderSync,
    tool: 'organize_folder',
    args: { folder_path: '~/Downloads', dry_run: false },
  },
  {
    id: 'system_health',
    title: 'Full System Health Audit',
    description: 'Collect processor metrics, scan RAM allocations, and inspect top memory-consuming processes.',
    icon: Layers,
    tool: 'get_system_stats',
    args: {},
  },
  {
    id: 'screen_capture',
    title: 'Capture Desktop Screenshot',
    description: 'Take an instant high-resolution screenshot of the primary Windows display and save to artifacts.',
    icon: Camera,
    tool: 'take_screenshot',
    args: { save_to_disk: true },
  },
  {
    id: 'lock_station',
    title: 'Lock Windows Workstation',
    description: 'Immediately lock your PC screen for privacy and security.',
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
    <div className="flex-1 h-full overflow-y-auto p-6 md:p-8 space-y-6 cyber-grid select-none">
      {/* Header */}
      <div>
        <h2 className="text-lg font-display font-bold tracking-wider text-zinc-100 uppercase flex items-center gap-2">
          <Zap className="text-cyan-neon" size={20} />
          Autonomous Workflows & Routines
        </h2>
        <p className="text-xs font-mono text-zinc-400 mt-0.5">
          Execute multi-step automation sequences across files, apps, and Windows system layers
        </p>
      </div>

      {/* Execution Banner */}
      {lastResult && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 ${
            lastResult.data.success
              ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
          }`}
        >
          {lastResult.data.success ? (
            <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-400" />
          ) : (
            <AlertTriangle size={18} className="shrink-0 mt-0.5 text-rose-400" />
          )}
          <div className="flex-1 overflow-hidden font-mono text-xs">
            <div className="font-semibold">
              {lastResult.data.success ? 'Workflow Completed Successfully' : 'Workflow Execution Error'}
            </div>
            <div className="text-[11px] opacity-80 mt-1">
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
              className="glass-panel p-5 rounded-2xl border-white/10 hover:border-cyan-neon/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-neon/20 flex items-center justify-center text-cyan-neon">
                    <Icon size={20} />
                  </div>
                  {wf.danger && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-mono">
                      High Security
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-display font-semibold text-zinc-100">
                  {wf.title}
                </h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  {wf.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-white/[0.05] flex items-center justify-between">
                <span className="text-[10px] font-mono text-zinc-500">
                  Target: {wf.tool}
                </span>

                <button
                  onClick={() => runWorkflow(wf)}
                  disabled={isRunning}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                    wf.danger
                      ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-obsidian-950 shadow-neon-cyan'
                  } disabled:opacity-50`}
                >
                  {isRunning ? (
                    <RotateCcw size={13} className="animate-spin" />
                  ) : (
                    <Play size={13} className="fill-current" />
                  )}
                  <span>{isRunning ? 'RUNNING...' : 'EXECUTE'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
