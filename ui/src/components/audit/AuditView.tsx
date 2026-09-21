import React, { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

export const AuditView: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);

  const fetchLogs = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8765/api/audit');
      const data = await res.json();
      setLogs(data || []);
    } catch (e) {
      console.error('Failed to load audit logs', e);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 md:p-8 space-y-6 cyber-grid select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-display font-bold tracking-wider text-zinc-100 uppercase flex items-center gap-2">
            <ShieldAlert className="text-cyan-neon" size={20} />
            Security & Tool Execution Audit Trail
          </h2>
          <p className="text-xs font-mono text-zinc-400 mt-0.5">
            Immutable log of all tools, system parameters, commands, and security operations
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-mono text-cyan-neon transition-colors"
        >
          <RefreshCw size={13} />
          <span>REFRESH LOGS</span>
        </button>
      </div>

      {/* Logs Table */}
      <div className="glass-panel rounded-2xl border-white/10 p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/10 text-zinc-500 text-[10px] tracking-wider uppercase">
                <th className="pb-2">Timestamp</th>
                <th className="pb-2">Tool Name</th>
                <th className="pb-2">Arguments</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 text-zinc-400 whitespace-nowrap">{log.timestamp}</td>
                  <td className="py-3 text-cyan-neon font-semibold">{log.tool_name}</td>
                  <td className="py-3 text-zinc-300 max-w-xs truncate">{log.arguments}</td>
                  <td className="py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ${
                        log.status === 'success'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {log.status === 'success' ? (
                        <CheckCircle2 size={11} />
                      ) : (
                        <XCircle size={11} />
                      )}
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-zinc-500 font-mono text-xs">
                    No audit records logged yet. Commands will appear here automatically.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
