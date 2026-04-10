import { cn } from '@/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-[var(--color-gray-100)] text-[var(--text-secondary)]',
    primary: 'bg-[var(--color-primary-100)] text-[var(--color-primary-700)]',
    success: 'bg-[var(--color-success-100)] text-[var(--color-success-700)]',
    warning: 'bg-[var(--color-warning-100)] text-[var(--color-warning-700)]',
    error: 'bg-[var(--color-error-100)] text-[var(--color-error-700)]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        'px-2 py-0.5 rounded-[var(--radius-sm)]',
        'text-[var(--font-size-xs)] font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

interface CountBadgeProps {
  count: number;
  className?: string;
}

export function CountBadge({ count, className }: CountBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        'min-w-[18px] h-[18px] px-1',
        'rounded-full',
        'text-[var(--font-size-xs)] font-medium',
        'text-white bg-[var(--color-primary-500)]',
        className
      )}
    >
      {count}
    </span>
  );
}
