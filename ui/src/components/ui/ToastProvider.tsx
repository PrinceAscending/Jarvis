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
    success: <CheckCircle2 className="text-cyan-neon shrink-0 mt-0.5" size={17} />,
    error: <AlertCircle className="text-rose-400 shrink-0 mt-0.5" size={17} />,
    warning: <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={17} />,
    info: <Info className="text-zinc-300 shrink-0 mt-0.5" size={17} />,
  };

  const borders = {
    success: 'border-cyan-neon/40 shadow-neon-cyan/20 bg-obsidian-900/95',
    error: 'border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.2)] bg-obsidian-900/95',
    warning: 'border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.2)] bg-obsidian-900/95',
    info: 'border-white/15 bg-obsidian-900/95',
  };

  return (
    <div
      className={`glass-panel p-3.5 rounded-xl border flex items-start gap-3 w-80 md:w-96 shadow-xl animate-fade-slide-in pointer-events-auto transition-all ${borders[toast.type]}`}
    >
      {icons[toast.type]}
      <div className="flex-1 overflow-hidden font-sans">
        <div className="text-xs font-display font-semibold text-zinc-100 tracking-wide">
          {toast.title}
        </div>
        {toast.message && (
          <div className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed break-words">
            {toast.message}
          </div>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-zinc-500 hover:text-zinc-200 p-0.5 transition-colors"
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
