import React, { useState, useEffect } from 'react';
import {
  Cpu,
  HardDrive,
  Activity,
  Layers,
  RefreshCw,
  XCircle,
  Zap,
} from 'lucide-react';

export const TelemetryView: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [processes, setProcesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
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
        body: JSON.stringify({ name: 'list_processes', arguments: { limit: 12, sort_by: 'memory' } }),
      });
      const procData = await procRes.json();
      if (procData.success) {
        setProcesses(procData.data.top_processes || []);
      }
    } catch (e) {
      console.error('Failed to fetch telemetry', e);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
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

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 md:p-8 space-y-6 cyber-grid select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-display font-bold tracking-wider text-zinc-100 uppercase flex items-center gap-2">
            <Activity className="text-cyan-neon" size={20} />
            System Telemetry & Hardware Diagnostics
          </h2>
          <p className="text-xs font-mono text-zinc-400 mt-0.5">
            {stats?.os || 'Windows 11 Diagnostics Engine'}
          </p>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-mono text-cyan-neon transition-colors"
        >
          <RefreshCw size={13} />
          <span>REFRESH</span>
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CPU */}
        <div className="glass-panel p-5 rounded-2xl border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono tracking-widest text-zinc-400 uppercase">
              Processor Load
            </span>
            <Cpu size={18} className="text-cyan-neon" />
          </div>
          <div className="text-3xl font-display font-bold text-zinc-100">
            {stats?.cpu?.usage_percent ?? '--'}%
          </div>
          <div className="text-[11px] font-mono text-zinc-400 mt-1">
            Cores: {stats?.cpu?.logical_cores ?? '--'} Logical Cores
          </div>
          <div className="w-full bg-white/5 h-2 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-cyan-neon h-full transition-all duration-500 shadow-neon-cyan"
              style={{ width: `${stats?.cpu?.usage_percent || 0}%` }}
            />
          </div>
        </div>

        {/* Memory */}
        <div className="glass-panel p-5 rounded-2xl border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono tracking-widest text-zinc-400 uppercase">
              System RAM
            </span>
            <Layers size={18} className="text-violet-neon" />
          </div>
          <div className="text-3xl font-display font-bold text-zinc-100">
            {stats?.memory?.percent ?? '--'}%
          </div>
          <div className="text-[11px] font-mono text-zinc-400 mt-1">
            {stats?.memory?.used_gb ?? '--'} GB / {stats?.memory?.total_gb ?? '--'} GB Used
          </div>
          <div className="w-full bg-white/5 h-2 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-violet-neon h-full transition-all duration-500 shadow-neon-violet"
              style={{ width: `${stats?.memory?.percent || 0}%` }}
            />
          </div>
        </div>

        {/* Disk */}
        <div className="glass-panel p-5 rounded-2xl border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono tracking-widest text-zinc-400 uppercase">
              System Drive (C:)
            </span>
            <HardDrive size={18} className="text-amber-neon" />
          </div>
          <div className="text-3xl font-display font-bold text-zinc-100">
            {stats?.disk?.percent ?? '--'}%
          </div>
          <div className="text-[11px] font-mono text-zinc-400 mt-1">
            {stats?.disk?.free_gb ?? '--'} GB Free of {stats?.disk?.total_gb ?? '--'} GB
          </div>
          <div className="w-full bg-white/5 h-2 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-amber-neon h-full transition-all duration-500"
              style={{ width: `${stats?.disk?.percent || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Top Processes Table */}
      <div className="glass-panel rounded-2xl border-white/10 p-5">
        <h3 className="text-sm font-mono tracking-wider text-zinc-300 uppercase mb-4 flex items-center gap-2">
          <Zap size={15} className="text-cyan-neon" />
          Top Running Windows Processes
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/10 text-zinc-500 text-[10px] tracking-wider uppercase">
                <th className="pb-2">PID</th>
                <th className="pb-2">Process Name</th>
                <th className="pb-2">CPU</th>
                <th className="pb-2">RAM</th>
                <th className="pb-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {processes.map((p) => (
                <tr key={p.pid} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-2.5 text-zinc-400">{p.pid}</td>
                  <td className="py-2.5 text-zinc-200 font-medium">{p.name}</td>
                  <td className="py-2.5 text-cyan-neon">{p.cpu_percent}%</td>
                  <td className="py-2.5 text-violet-glow">{p.memory_mb} MB</td>
                  <td className="py-2.5 text-right">
                    <button
                      onClick={() => handleKill(p.pid)}
                      title="Terminate Process"
                      className="p-1 rounded hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 transition-colors"
                    >
                      <XCircle size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
