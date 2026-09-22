import React, { useEffect, useState } from 'react';
import { Trash2, X, RefreshCw, AlertTriangle, ArrowRight } from 'lucide-react';
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
      toast.error('Verification required', 'Type UNINSTALL in capital letters to confirm.');
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
        toast.success('Uninstallation complete', 'All Jarvis files removed. Application closing.');
      } else {
        toast.error('Uninstall error', data.detail || 'Failed to complete cleanup.');
      }
    } catch (e: any) {
      toast.error('Cleanup error', e.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="max-w-md w-full surface-card p-6 rounded-xl border-surface-border shadow-elevated bg-void space-y-4 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h3 className="font-semibold text-sm text-text-bright">
            Uninstall Jarvis
          </h3>
          {step !== 3 && (
            <button onClick={onClose} className="text-text-muted hover:text-text-bright p-1 transition-colors">
              <X size={15} />
            </button>
          )}
        </div>

        {/* Step 1: Manifest Preview */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-semantic-error/10 border border-semantic-error/20 text-xs text-text leading-relaxed flex items-start gap-2.5">
              <AlertTriangle size={15} className="shrink-0 mt-0.5 text-semantic-error" />
              <div>
                This action will permanently delete all Jarvis data, memories, database files, and desktop shortcuts.
              </div>
            </div>

            {loadingManifest ? (
              <div className="py-6 flex items-center justify-center text-xs text-text-muted gap-2">
                <RefreshCw size={12} className="animate-spin text-signal" />
                <span>Scanning data footprint...</span>
              </div>
            ) : manifest ? (
              <div className="space-y-2 text-xs">
                <div className="text-[11px] text-text-muted">
                  Items to remove:
                </div>
                <div className="bg-surface p-3 rounded-lg border border-surface-border space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Application data:</span>
                    <span className="text-text font-mono">{manifest.total_size_mb} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Database & memories:</span>
                    <span className="text-text font-mono">SQLite + vector store</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Stored API keys:</span>
                    <span className="text-text font-mono">{manifest.stored_credentials?.length || 0} provider(s)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Desktop shortcuts:</span>
                    <span className="text-text font-mono">{manifest.shortcuts?.length || 0} location(s)</span>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg border border-surface-border hover:bg-surface text-text-muted hover:text-text text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-semantic-error hover:bg-semantic-error/90 text-white text-xs font-medium transition-colors"
              >
                <span>Continue</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Verification Confirmation */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-xs text-text leading-relaxed">
              To prevent accidental deletion, type <span className="text-semantic-error font-medium">UNINSTALL</span> below:
            </p>

            <input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder="Type UNINSTALL..."
              className="w-full bg-surface border border-surface-border focus:border-semantic-error rounded-lg px-3 py-2 text-sm text-text-bright font-mono outline-none text-center"
              autoFocus
            />

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={removeInstallDir}
                onChange={(e) => setRemoveInstallDir(e.target.checked)}
                className="rounded border-surface-border text-semantic-error focus:ring-0"
              />
              <span className="text-xs text-text-muted">
                Also run silent Windows uninstaller for program binaries
              </span>
            </label>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-3.5 py-1.5 rounded-lg border border-surface-border hover:bg-surface text-text-muted text-xs transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleExecute}
                disabled={confirmInput !== 'UNINSTALL'}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-semantic-error hover:bg-semantic-error/90 disabled:opacity-30 text-white text-xs font-medium transition-colors"
              >
                <Trash2 size={13} />
                <span>Confirm & remove</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Deletion in Progress */}
        {step === 3 && (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
            <RefreshCw size={24} className="text-semantic-error animate-spin" />
            <div className="space-y-1">
              <div className="font-medium text-sm text-text-bright">
                Removing Jarvis...
              </div>
              <p className="text-xs text-text-muted">
                Cleaning database records, API keys, shortcuts, and files.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
