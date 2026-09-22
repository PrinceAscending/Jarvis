import React, { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw, CheckCircle2, X } from 'lucide-react';

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
    <div className="flex-1 h-full overflow-y-auto p-6 md:p-8 space-y-6 select-none bg-void">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-text-bright flex items-center gap-2">
            <ShieldCheck className="text-signal" size={18} />
            Audit log
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Log of tool executions, arguments, and status
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-elevated border border-surface-border text-xs text-text hover:text-text-bright transition-colors"
        >
          <RefreshCw size={12} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Logs Table */}
      <div className="surface-card rounded-xl p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-surface-border text-text-muted text-[11px]">
                <th className="pb-2.5 font-normal">Timestamp</th>
                <th className="pb-2.5 font-normal">Tool</th>
                <th className="pb-2.5 font-normal">Arguments</th>
                <th className="pb-2.5 font-normal">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/60">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-surface-elevated/40 transition-colors">
                  <td className="py-2.5 text-text-muted text-[11px] font-mono whitespace-nowrap">{log.timestamp}</td>
                  <td className="py-2.5 text-text-bright font-mono text-[11px] font-medium">{log.tool_name}</td>
                  <td className="py-2.5 text-text-muted font-mono text-[11px] max-w-xs truncate">{log.arguments}</td>
                  <td className="py-2.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] ${
                        log.status === 'success'
                          ? 'bg-semantic-online/15 text-semantic-online'
                          : 'bg-semantic-error/15 text-semantic-error'
                      }`}
                    >
                      {log.status === 'success' ? (
                        <CheckCircle2 size={10} />
                      ) : (
                        <X size={10} />
                      )}
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-text-muted text-xs">
                    No actions logged yet. Executed tools will appear here automatically.
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
