import React, { useEffect, useState } from 'react';
import { AlertTriangle, Trash2, X, CheckCircle2, RefreshCw, ShieldAlert, ArrowRight } from 'lucide-react';
import { toast } from '@/hooks/useToast';

interface UninstallDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UninstallDialog: React.FC<UninstallDialogProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [manifest, setManifest] = useState<any>(null);
  const [loadingManifest, setLoadingManifest] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [removeInstallDir, setRemoveInstallDir] = useState(true);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setConfirmInput('');
      setLoadingManifest(true);
      fetch('http://127.0.0.1:8765/api/uninstall/manifest')
        .then((r) => r.json())
        .then((data) => setManifest(data))
        .catch(() => {})
        .finally(() => setLoadingManifest(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExecute = async () => {
    if (confirmInput !== 'UNINSTALL') {
      toast.error('Verification Failed', 'You must type UNINSTALL exactly to confirm.');
      return;
    }

    setExecuting(true);
    setStep(3);

    try {
      const res = await fetch('http://127.0.0.1:8765/api/uninstall/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirm_code: 'UNINSTALL',
          remove_install_dir: removeInstallDir,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Uninstallation Complete', 'All JARVIS data cleared. Application closing.');
      } else {
        toast.error('Uninstall Error', data.detail || 'Failed to complete cleanup.');
      }
    } catch (e: any) {
      toast.error('Cleanup Error', e.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fade-slide-in">
      <div className="max-w-lg w-full glass-panel p-6 rounded-2xl border-rose-500/40 shadow-[0_0_40px_rgba(244,63,94,0.2)] bg-obsidian-950 space-y-5 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
          <div className="flex items-center gap-2.5 text-rose-400">
            <ShieldAlert size={20} />
            <h3 className="font-display font-bold text-sm tracking-wider uppercase">
              Permanent Uninstallation
            </h3>
          </div>
          {step !== 3 && (
            <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 p-1">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Step 1: Manifest Preview */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 leading-relaxed flex items-start gap-2.5">
              <AlertTriangle size={16} className="shrink-0 mt-0.5 text-rose-400" />
              <div>
                This procedure permanently removes JARVIS, all memories, conversations, configurations, API credentials, and application shortcuts without leaving residual files.
              </div>
            </div>

            {loadingManifest ? (
              <div className="py-6 flex items-center justify-center font-mono text-xs text-zinc-400 gap-2">
                <RefreshCw size={13} className="animate-spin text-rose-400" />
                <span>Analyzing application footprint...</span>
              </div>
            ) : manifest ? (
              <div className="space-y-2 font-mono text-xs">
                <div className="text-[11px] text-zinc-400 uppercase tracking-wider">
                  Items Scheduled for Deletion:
                </div>
                <div className="bg-white/[0.02] p-3 rounded-xl border border-white/5 space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Local App Data Directory:</span>
                    <span className="text-zinc-200 truncate max-w-[200px]">{manifest.total_size_mb} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Database & Memories:</span>
                    <span className="text-emerald-400">SQLite + Embeddings</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Stored Credentials:</span>
                    <span className="text-amber-400">{manifest.stored_credentials?.length || 0} providers</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Shortcuts:</span>
                    <span className="text-zinc-300">{manifest.shortcuts?.length || 0} locations</span>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-white/10 hover:border-white/20 text-zinc-400 hover:text-zinc-200 font-mono text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-mono text-xs font-bold transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)]"
              >
                <span>Continue to Verification</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Verification Confirmation */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-xs font-mono text-zinc-300 leading-relaxed">
              To prevent accidental deletion, type <span className="text-rose-400 font-bold">UNINSTALL</span> in capital letters below to confirm.
            </p>

            <input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder="Type UNINSTALL here..."
              className="w-full bg-white/[0.03] border border-rose-500/40 focus:border-rose-400 rounded-xl px-4 py-2.5 text-sm text-rose-300 font-mono outline-none uppercase tracking-widest text-center"
              autoFocus
            />

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={removeInstallDir}
                onChange={(e) => setRemoveInstallDir(e.target.checked)}
                className="rounded border-white/20 text-rose-500 focus:ring-0"
              />
              <span className="text-xs font-mono text-zinc-400">
                Trigger Inno Setup silent uninstaller for program files
              </span>
            </label>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl border border-white/10 hover:border-white/20 text-zinc-400 font-mono text-xs"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleExecute}
                disabled={confirmInput !== 'UNINSTALL'}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-30 text-white font-mono text-xs font-bold transition-all shadow-[0_0_20px_rgba(244,63,94,0.4)]"
              >
                <Trash2 size={13} />
                <span>Confirm & Erase All</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Deletion in Progress */}
        {step === 3 && (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
            <RefreshCw size={28} className="text-rose-400 animate-spin" />
            <div className="space-y-1">
              <div className="font-display font-bold text-sm text-zinc-100 uppercase tracking-wider">
                Purging JARVIS Subsystems...
              </div>
              <p className="text-xs font-mono text-zinc-400">
                Clearing database, credentials, shortcuts, and application footprint.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
