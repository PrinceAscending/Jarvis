import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { useToastStore, ToastItem } from '@/hooks/useToast';

const ToastMessage: React.FC<{ toast: ToastItem; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.durationMs || 4000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const icons = {
    success: <CheckCircle2 className="text-semantic-online shrink-0 mt-0.5" size={16} />,
    error: <AlertCircle className="text-semantic-error shrink-0 mt-0.5" size={16} />,
    warning: <AlertTriangle className="text-semantic-warning shrink-0 mt-0.5" size={16} />,
    info: <Info className="text-signal shrink-0 mt-0.5" size={16} />,
  };

  const borders = {
    success: 'border-semantic-online/30 bg-surface-elevated',
    error: 'border-semantic-error/30 bg-surface-elevated',
    warning: 'border-semantic-warning/30 bg-surface-elevated',
    info: 'border-surface-border bg-surface-elevated',
  };

  return (
    <div
      className={`p-3.5 rounded-xl border flex items-start gap-3 w-80 md:w-96 shadow-elevated animate-fade-in pointer-events-auto transition-all ${borders[toast.type]}`}
    >
      {icons[toast.type]}
      <div className="flex-1 overflow-hidden font-sans">
        <div className="text-xs font-medium text-text-bright">
          {toast.title}
        </div>
        {toast.message && (
          <div className="text-[11px] text-text-muted mt-0.5 leading-relaxed break-words">
            {toast.message}
          </div>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-text-muted hover:text-text-bright p-0.5 transition-colors"
      >
        <X size={13} />
      </button>
    </div>
  );
};

export const ToastProvider: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 pointer-events-none">
      {toasts.map((t) => (
        <ToastMessage key={t.id} toast={t} onDismiss={removeToast} />
      ))}
    </div>
  );
};
