import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    const baseStyles = `
      inline-flex items-center justify-center gap-2
      font-medium rounded-[var(--radius-md)]
      transition-all duration-[var(--duration-fast)] ease-[var(--ease-out)]
      focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]
      disabled:cursor-not-allowed disabled:opacity-60
    `;

    const variants = {
      primary: `
        bg-[var(--color-primary-500)] text-white
        shadow-[var(--shadow-sm)]
        hover:not-disabled:bg-[var(--color-primary-600)] hover:not-disabled:shadow-[var(--shadow-md)]
        active:not-disabled:bg-[var(--color-primary-700)]
      `,
      secondary: `
        bg-[var(--color-gray-100)] text-[var(--color-gray-700)]
        border border-[var(--color-gray-200)]
        hover:not-disabled:bg-[var(--color-gray-200)] hover:not-disabled:border-[var(--color-gray-300)]
        active:not-disabled:bg-[var(--color-gray-300)]
      `,
      ghost: `
        bg-transparent text-[var(--text-secondary)]
        hover:not-disabled:bg-[var(--color-gray-100)]
        active:not-disabled:bg-[var(--color-gray-200)]
      `,
      icon: `
        bg-transparent text-[var(--text-tertiary)]
        hover:not-disabled:bg-[var(--color-gray-100)] hover:not-disabled:text-[var(--text-secondary)]
        active:not-disabled:bg-[var(--color-gray-200)] active:not-disabled:text-[var(--text-primary)]
        disabled:text-[var(--color-gray-300)]
      `,
    };

    const sizes = {
      sm: 'h-7 px-3 text-[var(--font-size-sm)]',
      md: 'h-8 px-4 text-[var(--font-size-base)]',
      lg: 'h-10 px-5 text-[var(--font-size-md)]',
    };

    const iconSizes = {
      sm: 'w-7 h-7 p-1.5',
      md: 'w-8 h-8 p-2',
      lg: 'w-10 h-10 p-2.5',
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          variant === 'icon' ? iconSizes[size] : sizes[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin w-4 h-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
