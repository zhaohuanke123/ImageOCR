import { useEffect, useState } from 'react';
import { cn } from '@/utils';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastItemProps extends Toast {
  onDismiss: (id: string) => void;
}

function ToastItem({ id, type, message, onDismiss }: ToastItemProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-[var(--color-success-500)]" />,
    error: <XCircle className="w-5 h-5 text-[var(--color-error-500)]" />,
    warning: <AlertCircle className="w-5 h-5 text-[var(--color-warning-500)]" />,
    info: <AlertCircle className="w-5 h-5 text-[var(--color-primary-500)]" />,
  };

  const bgColors = {
    success: 'bg-[var(--color-success-50)] border-[var(--color-success-200)]',
    error: 'bg-[var(--color-error-50)] border-[var(--color-error-200)]',
    warning: 'bg-[var(--color-warning-50)] border-[var(--color-warning-200)]',
    info: 'bg-[var(--color-primary-50)] border-[var(--color-primary-200)]',
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] border shadow-[var(--shadow-md)]',
        'animate-[slideIn_0.2s_ease-out]',
        bgColors[type]
      )}
    >
      {icons[type]}
      <span className="flex-1 text-sm text-[var(--text-primary)]">{message}</span>
      <button
        onClick={() => onDismiss(id)}
        className="p-1 rounded-[var(--radius-sm)] hover:bg-black/5 transition-colors"
      >
        <X className="w-4 h-4 text-[var(--text-tertiary)]" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map(toast => (
        <ToastItem key={toast.id} {...toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

// Toast store for global access
let toastId = 0;
let toastCallback: ((toast: Toast) => void) | null = null;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    toastCallback = (toast: Toast) => {
      setToasts(prev => [...prev, toast]);
    };
    return () => {
      toastCallback = null;
    };
  }, []);

  const dismiss = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return { toasts, dismiss };
}

export function showToast(type: ToastType, message: string) {
  if (toastCallback) {
    toastCallback({
      id: `toast-${++toastId}`,
      type,
      message,
    });
  }
}
