import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/utils'

export interface NexusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'neutral' | 'outline'
}

export const NexusBadge = forwardRef<HTMLSpanElement, NexusBadgeProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex select-none items-center rounded-[2px] px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider',

          variant === 'default' && 'bg-zinc-800 text-zinc-300',
          variant === 'success' &&
            'border border-emerald-900/30 bg-emerald-900/20 text-emerald-500',
          variant === 'warning' &&
            'border border-yellow-900/30 bg-yellow-900/20 text-yellow-500',
          variant === 'error' &&
            'border border-red-900/30 bg-red-900/20 text-red-500',
          variant === 'neutral' &&
            'border border-zinc-800 bg-zinc-900 text-zinc-500',
          variant === 'outline' &&
            'border border-zinc-700 bg-transparent text-zinc-400',

          className
        )}
        {...props}
      >
        {children}
      </span>
    )
  }
)
NexusBadge.displayName = 'NexusBadge'
