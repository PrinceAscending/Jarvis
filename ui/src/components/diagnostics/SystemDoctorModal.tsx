import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Wrench,
  RefreshCw,
  X,
  ShieldCheck,
  Cpu,
  Database,
  Wifi,
  Sparkles,
  Monitor,
} from 'lucide-react';

interface DiagnosticCheck {
  id: string;
  name: string;
  category: 'runtime' | 'hardware' | 'storage' | 'network' | 'ai' | 'windows';
  status: 'pass' | 'warn' | 'fail';
  details: string;
  can_repair: boolean;
}

interface DiagnosticReport {
  overall_status: 'healthy' | 'warning' | 'critical';
  timestamp: number;
  summary: {
    total: number;
    passed: number;
    warnings: number;
    failures: number;
  };
  checks: DiagnosticCheck[];
}

interface SystemDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemDoctorModal: React.FC<SystemDoctorModalProps> = ({ isOpen, onClose }) => {
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [repairingId, setRepairingId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [repairMsg, setRepairMsg] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    setRepairMsg(null);
    try {
      const res = await fetch('http://127.0.0.1:8765/api/diagnostics/run');
      const data = await res.json();
      setReport(data);
    } catch (err) {
      console.error('Failed to run diagnostics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runDiagnostics();
    }
  }, [isOpen]);

  const handleRepair = async (checkId: string) => {
    setRepairingId(checkId);
    setRepairMsg(null);
    try {
      const res = await fetch('http://127.0.0.1:8765/api/diagnostics/repair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ check_id: checkId }),
      });
      const data = await res.json();
      if (data.success) {
        setRepairMsg(data.message || 'Auto-repair succeeded.');
        // Re-run diagnostics to reflect fixes
        runDiagnostics();
      } else {
        setRepairMsg(`Repair failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      setRepairMsg(`Repair request error: ${err.message}`);
    } finally {
      setRepairingId(null);
    }
  };

  if (!isOpen) return null;

  const categoryIcons: Record<string, React.ReactNode> = {
    runtime: <Cpu size={14} className="text-signal" />,
    hardware: <Monitor size={14} className="text-warm" />,
    storage: <Database size={14} className="text-text-muted" />,
    network: <Wifi size={14} className="text-blue-400" />,
    ai: <Sparkles size={14} className="text-amber-400" />,
    windows: <Activity size={14} className="text-signal" />,
  };

  const filteredChecks = report?.checks.filter(
    (c) => filterCategory === 'all' || c.category === filterCategory
  ) || [];

  const repairableCount = report?.checks.filter((c) => c.can_repair && c.status !== 'pass').length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl bg-surface border border-surface-border rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-surface-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-surface-well border border-surface-border">
              <ShieldCheck className="text-signal" size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-bright tracking-tight">
                System Doctor & Auto-Repair
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Hardware, AI subsystem, database integrity, and Windows APIs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={runDiagnostics}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-well hover:bg-surface-elevated border border-surface-border text-xs text-text hover:text-text-bright transition-colors"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Diagnosing...' : 'Re-scan'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-bright hover:bg-surface-elevated transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Overall Status Banner */}
        {report && (
          <div className="px-6 py-4 bg-surface-well/50 border-b border-surface-border flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                  report.overall_status === 'healthy'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : report.overall_status === 'warning'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                }`}
              >
                {report.overall_status === 'healthy' && <CheckCircle2 size={13} />}
                {report.overall_status === 'warning' && <AlertTriangle size={13} />}
                {report.overall_status === 'critical' && <XCircle size={13} />}
                {report.overall_status === 'healthy'
                  ? 'System nominal'
                  : report.overall_status === 'warning'
                  ? 'Attention recommended'
                  : 'Critical failures detected'}
              </span>

              <span className="text-xs text-text-muted">
                {report.summary.passed} passed · {report.summary.warnings} warnings · {report.summary.failures} errors
              </span>
            </div>

            {repairMsg && (
              <span className="text-xs font-mono text-signal bg-signal/10 px-2.5 py-1 rounded border border-signal/20">
                {repairMsg}
              </span>
            )}
          </div>
        )}

        {/* Category Filters */}
        <div className="px-6 pt-3 flex gap-2 overflow-x-auto border-b border-surface-border/50 text-xs">
          {['all', 'ai', 'storage', 'windows', 'network', 'hardware', 'runtime'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 border-b-2 capitalize transition-colors ${
                filterCategory === cat
                  ? 'border-signal text-text-bright font-medium'
                  : 'border-transparent text-text-muted hover:text-text'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Diagnostic Items List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading && !report ? (
            <div className="flex flex-col items-center justify-center py-12 text-text-muted space-y-3">
              <RefreshCw className="animate-spin text-signal" size={24} />
              <span className="text-xs">Running system diagnostics probes...</span>
            </div>
          ) : (
            filteredChecks.map((check) => (
              <div
                key={check.id}
                className="p-3.5 rounded-lg bg-surface-well border border-surface-border flex items-start justify-between gap-4 hover:border-surface-border/80 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {check.status === 'pass' && (
                      <CheckCircle2 size={16} className="text-emerald-400" />
                    )}
                    {check.status === 'warn' && (
                      <AlertTriangle size={16} className="text-amber-400" />
                    )}
                    {check.status === 'fail' && (
                      <XCircle size={16} className="text-rose-400" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-text-bright">
                        {check.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-surface-border text-text-muted flex items-center gap-1">
                        {categoryIcons[check.category]}
                        {check.category}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted mt-1 font-mono">
                      {check.details}
                    </p>
                  </div>
                </div>

                {check.can_repair && check.status !== 'pass' && (
                  <button
                    onClick={() => handleRepair(check.id)}
                    disabled={repairingId === check.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-signal/15 hover:bg-signal/25 border border-signal/30 text-xs text-signal transition-colors font-medium"
                  >
                    <Wrench size={12} className={repairingId === check.id ? 'animate-spin' : ''} />
                    <span>{repairingId === check.id ? 'Repairing...' : 'Auto-repair'}</span>
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-surface-well border-t border-surface-border flex items-center justify-between text-xs text-text-muted">
          <span>Non-destructive repair: database operations create atomic `.bak` snapshots.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-surface hover:bg-surface-elevated border border-surface-border text-text-bright transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
