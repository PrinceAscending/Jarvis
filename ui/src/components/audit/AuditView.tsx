import React, { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw, CheckCircle2, X, Brain, Trash2, AlertTriangle, Lightbulb } from 'lucide-react';

export const AuditView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tools' | 'mistakes'>('tools');
  const [logs, setLogs] = useState<any[]>([]);
  const [mistakes, setMistakes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8765/api/audit');
      const data = await res.json();
      setLogs(data || []);

      const mRes = await fetch('http://127.0.0.1:8765/api/learning/mistakes');
      if (mRes.ok) {
        const mData = await mRes.json();
        setMistakes(mData.mistakes || []);
      }
    } catch (e) {
      console.error('Failed to load audit or mistakes', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteMistake = async (sig: string) => {
    try {
      await fetch(`http://127.0.0.1:8765/api/learning/mistakes/${encodeURIComponent(sig)}`, {
        method: 'DELETE',
      });
      fetchData();
    } catch (e) {
      console.error('Failed to delete learned mistake', e);
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 md:p-8 space-y-6 select-none bg-void">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-text-bright flex items-center gap-2">
            <ShieldCheck className="text-signal" size={18} />
            Security & Learning Audit
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Real-time tool execution log, permissions audit, and self-learned recovery rules
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-elevated border border-surface-border text-xs text-text hover:text-text-bright transition-colors"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 border-b border-surface-border/60 text-xs">
        <button
          onClick={() => setActiveTab('tools')}
          className={`pb-2.5 px-1 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === 'tools'
              ? 'border-signal text-text-bright'
              : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          <ShieldCheck size={14} />
          <span>Tool Execution Trail ({logs.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('mistakes')}
          className={`pb-2.5 px-1 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === 'mistakes'
              ? 'border-signal text-text-bright'
              : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          <Brain size={14} className="text-warm" />
          <span>Learned Recovery Rules ({mistakes.length})</span>
        </button>
      </div>

      {/* Tab 1: Tool Execution Logs */}
      {activeTab === 'tools' && (
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
      )}

      {/* Tab 2: Learned Rules & Mistake Memory */}
      {activeTab === 'mistakes' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-surface-well border border-surface-border flex items-start gap-3">
            <Lightbulb size={18} className="text-warm mt-0.5" />
            <div className="text-xs">
              <span className="font-semibold text-text-bright">Self-Reflection & Anti-Regression</span>
              <p className="text-text-muted mt-0.5">
                When a tool encounters an error (e.g. missing focus, wrong argument, timeout), JARVIS categorizes the root cause and saves a corrective workaround so it never makes the same mistake again.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {mistakes.map((m) => (
              <div
                key={m.signature}
                className="surface-card p-4 rounded-xl border border-surface-border flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-text-bright">
                      {m.tool_name}
                    </span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-surface-well border border-surface-border text-warm">
                      {m.error_class}
                    </span>
                    <span className="text-[10px] text-text-muted font-mono">
                      {m.occurrences} {m.occurrences === 1 ? 'occurrence' : 'occurrences'}
                    </span>
                  </div>

                  <p className="text-xs text-text-muted">
                    <span className="text-text-bright font-medium">Root cause:</span> {m.root_cause}
                  </p>

                  <div className="text-xs text-signal font-mono bg-signal/10 px-2.5 py-1.5 rounded border border-signal/20 flex items-center gap-1.5">
                    <Lightbulb size={12} className="shrink-0" />
                    <span>Workaround: {m.workaround}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteMistake(m.signature)}
                  title="Forget this rule"
                  className="self-end md:self-center p-2 rounded-lg text-text-muted hover:text-semantic-error hover:bg-surface-elevated transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}

            {mistakes.length === 0 && (
              <div className="surface-card p-8 rounded-xl text-center text-xs text-text-muted">
                No mistake signatures recorded yet. If any tool execution encounters an error, its lesson will be preserved here.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
