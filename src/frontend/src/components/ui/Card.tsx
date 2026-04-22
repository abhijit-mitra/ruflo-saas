import { type HTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = false, padding = 'md', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={twMerge(
          clsx(
            'rounded-lg bg-surface-card border border-border/50',
            'transition-all duration-300 ease-in-out',
            hoverable && [
              'cursor-pointer',
              'hover:scale-[1.02] hover:border-border',
              'hover:shadow-lg hover:shadow-black/20',
              'hover:bg-surface-elevated',
            ],
            paddingClasses[padding],
            className,
          ),
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';

export default Card;
