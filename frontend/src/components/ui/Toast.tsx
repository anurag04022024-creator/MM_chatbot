import React from 'react';
import { useChatStore } from '../../store/useChatStore';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useChatStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl shadow-claude-lg border text-sm animate-fade-in transition-all',
            toast.type === 'error' && 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950 dark:border-rose-900 dark:text-rose-200',
            toast.type === 'success' && 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950 dark:border-emerald-900 dark:text-emerald-200',
            toast.type === 'info' && 'bg-brand-surface dark:bg-brand-darkSurface border-brand-border dark:border-brand-darkBorder text-brand-text dark:text-brand-darkText'
          )}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === 'error' && <AlertCircle size={18} className="text-rose-500 shrink-0" />}
            {toast.type === 'success' && <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />}
            {toast.type === 'info' && <Info size={18} className="text-brand-accent shrink-0" />}
            <span>{toast.message}</span>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors"
            aria-label="Dismiss notification"
          >
            <X size={14} className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200" />
          </button>
        </div>
      ))}
    </div>
  );
};
