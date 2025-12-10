import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface NexusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'neutral' | 'outline';
}

export const NexusBadge = forwardRef<HTMLSpanElement, NexusBadgeProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center px-2 py-0.5 rounded-[2px] text-[10px] font-mono font-medium tracking-wider uppercase select-none',

          variant === 'default' && 'bg-zinc-800 text-zinc-300',
          variant === 'success' &&
            'bg-emerald-900/20 text-emerald-500 border border-emerald-900/30',
          variant === 'warning' && 'bg-yellow-900/20 text-yellow-500 border border-yellow-900/30',
          variant === 'error' && 'bg-red-900/20 text-red-500 border border-red-900/30',
          variant === 'neutral' && 'bg-zinc-900 text-zinc-500 border border-zinc-800',
          variant === 'outline' && 'bg-transparent border border-zinc-700 text-zinc-400',

          className,
        )}
        {...props}
      >
        {children}
      </span>
    );
  },
);
NexusBadge.displayName = 'NexusBadge';
