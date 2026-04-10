import { useEffect, type ReactNode } from 'react';
import { cn } from '@/utils';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] min-w-[400px] max-w-[640px] mx-4 animate-[fadeIn_0.15s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-gray-200)]">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-[var(--radius-sm)] hover:bg-[var(--color-gray-100)] transition-colors"
          >
            <X className="w-4 h-4 text-[var(--text-tertiary)]" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[var(--color-gray-200)] bg-[var(--color-gray-50)] rounded-b-[var(--radius-lg)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export interface ModalButtonProps {
  variant?: 'primary' | 'secondary';
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
}

export function ModalButton({ variant = 'secondary', onClick, children, disabled }: ModalButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'px-4 py-2 rounded-[var(--radius-md)] font-medium text-sm transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'primary'
          ? 'bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)]'
          : 'bg-[var(--color-gray-100)] text-[var(--text-secondary)] hover:bg-[var(--color-gray-200)] border border-[var(--color-gray-200)]'
      )}
    >
      {children}
    </button>
  );
}
