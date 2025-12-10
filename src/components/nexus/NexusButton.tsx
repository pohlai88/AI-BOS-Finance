import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, ReactNode } from 'react';

interface NexusButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const NexusButton = ({
  children,
  className,
  variant = 'primary',
  icon,
  size = 'md',
  ...props
}: NexusButtonProps) => {
  return (
    <button
      className={cn(
        // Base Architecture
        'group inline-flex items-center justify-center gap-2.5',
        'font-medium transition-all duration-300',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
        
        // Size System
        size === 'sm' && 'h-9 px-4 text-xs rounded-lg',
        size === 'md' && 'h-11 px-5 text-sm rounded-lg',
        size === 'lg' && 'h-12 px-6 text-sm rounded-lg',

        // === PRIMARY: Dark solid with emerald accent ===
        // Per Design System Section 5.1
        variant === 'primary' && [
          'bg-zinc-950 text-white',
          'border border-white/10',
          'hover:bg-zinc-900 hover:border-emerald-500/50',
          'shadow-[0_0_20px_rgba(0,0,0,0.5)]',
          'hover:shadow-[0_0_25px_rgba(16,185,129,0.15)]',
        ],

        // === SECONDARY: Transparent with emerald border ===
        variant === 'secondary' && [
          'bg-transparent text-emerald-400',
          'border border-emerald-500/30',
          'hover:border-emerald-500 hover:bg-emerald-500/10',
        ],

        // === GHOST: Minimal ===
        variant === 'ghost' && [
          'bg-transparent text-zinc-400',
          'hover:text-white hover:bg-white/5',
        ],

        // === DANGER: Red accent ===
        variant === 'danger' && [
          'bg-transparent text-red-400',
          'border border-red-500/30',
          'hover:border-red-500 hover:bg-red-500/10',
        ],

        className
      )}
      {...props}
    >
      {/* Content */}
      <span className="tracking-wide">{children}</span>
      
      {/* Icon */}
      {icon && (
        <span className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5">
          {icon}
        </span>
      )}
    </button>
  );
};
