import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const variants = {
  primary:
    'bg-primary hover:bg-primary-hover text-white focus:ring-primary/50',
  secondary:
    'bg-gray-700 hover:bg-gray-600 text-white focus:ring-gray-500/50',
  outline:
    'border border-border hover:bg-surface-hover text-text-primary focus:ring-border/50',
  ghost:
    'hover:bg-surface-hover text-text-secondary hover:text-text-primary focus:ring-border/50',
} as const;

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
} as const;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  isLoading?: boolean;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={twMerge(
          clsx(
            'inline-flex items-center justify-center rounded-md font-medium',
            'transition-all duration-200 ease-in-out',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            variants[variant],
            sizes[size],
            fullWidth && 'w-full',
            className,
          ),
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
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
  },
);

Button.displayName = 'Button';

export default Button;
