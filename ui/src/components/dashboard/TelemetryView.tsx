import React, { useState, useEffect } from 'react';
import {
  Cpu,
  HardDrive,
  Activity,
  Layers,
  RefreshCw,
  X,
  ShieldCheck,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { SystemDoctorModal } from '../diagnostics/SystemDoctorModal';

interface HardwareAudit {
  gpus: Array<{ name: string; vram_gb: number; is_dedicated: boolean; driver: string }>;
  best_vram_gb: number;
  ram: { total_gb: number; available_gb: number; used_percent: number };
  recommended_model: string;
  evaluations: Array<{
    model: string;
    grade: 'excellent' | 'good' | 'usable' | 'tight' | 'insufficient';
    label: string;
    color: string;
    reason: string;
    speed_estimate: string;
    vram_required_gb: number;
  }>;
}

export const TelemetryView: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [processes, setProcesses] = useState<any[]>([]);
  const [hardwareAudit, setHardwareAudit] = useState<HardwareAudit | null>(null);
  const [loading, setLoading] = useState(false);
  const [doctorOpen, setDoctorOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8765/api/tools/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'get_system_stats', arguments: {} }),
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }

      const procRes = await fetch('http://127.0.0.1:8765/api/tools/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'list_processes', arguments: { limit: 10, sort_by: 'memory' } }),
      });
      const procData = await procRes.json();
      if (procData.success) {
        setProcesses(procData.data.top_processes || []);
      }

      // Fetch Hardware Audit
      const hwRes = await fetch('http://127.0.0.1:8765/api/hardware/audit');
      if (hwRes.ok) {
        const hwData = await hwRes.json();
        setHardwareAudit(hwData);
      }
    } catch (e) {
      console.error('Failed to fetch telemetry', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleKill = async (pid: number) => {
    try {
      await fetch('http://127.0.0.1:8765/api/tools/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'kill_process', arguments: { pid } }),
      });
      fetchData();
    } catch (e) {
      console.error('Failed to terminate process', e);
    }
  };

  const dedicatedGpu = hardwareAudit?.gpus.find((g) => g.is_dedicated) || hardwareAudit?.gpus[0];

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 md:p-8 space-y-6 select-none bg-void">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-text-bright flex items-center gap-2">
            <Activity className="text-signal" size={18} />
            System & Hardware
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Real-time telemetry, GPU VRAM fit grading, and self-repair diagnostics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setDoctorOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface-elevated/80 border border-signal/40 text-xs text-text-bright transition-colors shadow-sm"
          >
            <ShieldCheck size={14} className="text-signal" />
            <span>System Doctor</span>
          </button>

          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-elevated border border-surface-border text-xs text-text hover:text-text-bright transition-colors"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CPU */}
        <div className="surface-card p-5 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-muted">Processor</span>
            <Cpu size={16} className="text-text-muted" />
          </div>
          <div className="text-2xl font-semibold text-warm">
            {stats?.cpu?.usage_percent ?? '--'}%
          </div>
          <div className="text-[11px] text-text-muted mt-1">
            {stats?.cpu?.logical_cores ? `${stats.cpu.logical_cores} logical cores` : 'Windows host'}
          </div>
          <div className="w-full bg-surface-well h-1.5 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-signal h-full transition-all duration-500"
              style={{ width: `${stats?.cpu?.usage_percent || 0}%` }}
            />
          </div>
        </div>

        {/* Memory */}
        <div className="surface-card p-5 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-muted">System RAM</span>
            <Layers size={16} className="text-text-muted" />
          </div>
          <div className="text-2xl font-semibold text-warm">
            {stats?.memory?.percent ?? '--'}%
          </div>
          <div className="text-[11px] text-text-muted mt-1">
            {stats?.memory?.used_gb ?? '--'} GB of {stats?.memory?.total_gb ?? '--'} GB used
          </div>
          <div className="w-full bg-surface-well h-1.5 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-signal h-full transition-all duration-500"
              style={{ width: `${stats?.memory?.percent || 0}%` }}
            />
          </div>
        </div>

        {/* Disk */}
        <div className="surface-card p-5 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-muted">Storage (C:)</span>
            <HardDrive size={16} className="text-text-muted" />
          </div>
          <div className="text-2xl font-semibold text-warm">
            {stats?.disk?.percent ?? '--'}%
          </div>
          <div className="text-[11px] text-text-muted mt-1">
            {stats?.disk?.free_gb ?? '--'} GB free of {stats?.disk?.total_gb ?? '--'} GB
          </div>
          <div className="w-full bg-surface-well h-1.5 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-signal h-full transition-all duration-500"
              style={{ width: `${stats?.disk?.percent || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Local AI Hardware Fit Audit */}
      {hardwareAudit && (
        <div className="surface-card rounded-xl p-5 border border-surface-border">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="text-signal" size={17} />
              <div>
                <h3 className="text-sm font-semibold text-text-bright">
                  Local AI Hardware Fit & VRAM Audit
                </h3>
                <p className="text-[11px] text-text-muted">
                  Dedicated GPU: <span className="text-text-bright font-medium">{dedicatedGpu?.name || 'Integrated'}</span> · Dedicated VRAM: <span className="text-warm font-mono font-medium">{hardwareAudit.best_vram_gb} GB</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-text-muted bg-surface-well px-2.5 py-1 rounded border border-surface-border">
              <span>Recommended model:</span>
              <span className="text-signal font-mono font-semibold">{hardwareAudit.recommended_model}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {hardwareAudit.evaluations.slice(0, 6).map((item) => (
              <div
                key={item.model}
                className="p-3.5 rounded-lg bg-surface-well border border-surface-border/80 flex flex-col justify-between hover:border-surface-border transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-mono font-semibold text-text-bright">{item.model}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                        item.grade === 'excellent'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : item.grade === 'good'
                          ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                          : item.grade === 'usable'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted line-clamp-2">
                    {item.reason}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-surface-border/50 flex items-center justify-between text-[10px] text-text-muted font-mono">
                  <span>VRAM: {item.vram_required_gb} GB</span>
                  <span className="text-warm flex items-center gap-1">
                    <Zap size={10} />
                    {item.speed_estimate}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Processes Table */}
      <div className="surface-card rounded-xl p-5">
        <h3 className="text-sm font-medium text-text-bright mb-4">
          Active Windows Processes
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-surface-border text-text-muted text-[11px]">
                <th className="pb-2.5 font-normal">PID</th>
                <th className="pb-2.5 font-normal">Process name</th>
                <th className="pb-2.5 font-normal">CPU</th>
                <th className="pb-2.5 font-normal">Memory</th>
                <th className="pb-2.5 text-right font-normal">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/60">
              {processes.map((p) => (
                <tr key={p.pid} className="hover:bg-surface-elevated/40 transition-colors">
                  <td className="py-2.5 text-text-muted font-mono text-[11px]">{p.pid}</td>
                  <td className="py-2.5 text-text-bright font-normal">{p.name}</td>
                  <td className="py-2.5 text-warm font-mono">{p.cpu_percent}%</td>
                  <td className="py-2.5 text-text-muted font-mono">{p.memory_mb} MB</td>
                  <td className="py-2.5 text-right">
                    <button
                      onClick={() => handleKill(p.pid)}
                      title="End process"
                      className="p-1 rounded hover:bg-semantic-error/15 text-text-muted hover:text-semantic-error transition-colors"
                    >
                      <X size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Doctor Modal */}
      <SystemDoctorModal isOpen={doctorOpen} onClose={() => setDoctorOpen(false)} />
    </div>
  );
};
