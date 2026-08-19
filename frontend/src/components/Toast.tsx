import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const duration = toast.duration ?? 3500;
    const newToast: ToastMessage = { ...toast, id, duration };

    setToasts((prev) => [...prev.slice(-3), newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container */}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';

          return (
            <div
              key={t.id}
              className={`
                pointer-events-auto p-3.5 rounded-xl border shadow-xl flex items-start space-x-3 transition-all duration-200 animate-fade-in
                ${
                  isSuccess
                    ? 'bg-[var(--bg-surface-raised)] border-[var(--color-verdigris)]/40 text-[var(--text-main)]'
                    : isError
                    ? 'bg-[var(--bg-surface-raised)] border-rose-500/40 text-[var(--text-main)]'
                    : 'bg-[var(--bg-surface-raised)] border-[var(--border-medium)] text-[var(--text-main)]'
                }
              `}
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="w-4 h-4 text-[var(--color-verdigris)]" />}
                {isError && <AlertCircle className="w-4 h-4 text-rose-500" />}
                {!isSuccess && !isError && <Info className="w-4 h-4 text-[var(--color-slate)]" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-ui text-xs font-semibold leading-tight">{t.title}</div>
                {t.description && (
                  <div className="font-body text-[11px] text-[var(--text-muted)] mt-0.5 leading-snug">
                    {t.description}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="p-1 rounded-md text-[var(--text-faint)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors shrink-0 cursor-pointer"
                aria-label="Dismiss toast"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
