import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, error, ...props }, ref) => {
    return (
      <div className="relative flex items-center">
        {icon && (
          <span className="absolute left-3 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            `w-full h-8 px-3 py-2
            bg-white text-[var(--text-primary)]
            border rounded-[var(--radius-md)]
            text-[var(--font-size-base)]
            placeholder:text-[var(--text-tertiary)]
            transition-all duration-[var(--duration-fast)] ease-[var(--ease-out)]
            focus:outline-none focus:border-[var(--color-primary-500)] focus:shadow-[var(--shadow-focus)]
            disabled:bg-[var(--color-gray-100)] disabled:text-[var(--text-disabled)] disabled:cursor-not-allowed`,
            error
              ? 'border-[var(--color-error-500)]'
              : 'border-[var(--color-gray-300)] hover:border-[var(--color-gray-400)]',
            icon && 'pl-9',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';
