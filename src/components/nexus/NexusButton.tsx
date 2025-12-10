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
        // Base
        'group relative inline-flex items-center justify-center gap-2 overflow-hidden',
        'font-medium text-sm tracking-wide transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'rounded-lg', // Modern rounded corners
        
        // Size variants
        size === 'sm' && 'h-9 px-4 text-xs',
        size === 'md' && 'h-11 px-6',
        size === 'lg' && 'h-12 px-8',

        // === PRIMARY: Solid Green, Clean ===
        variant === 'primary' && [
          'bg-nexus-green text-nexus-void font-semibold',
          'hover:bg-white hover:shadow-[0_0_20px_rgba(40,231,162,0.3)]',
          'active:scale-[0.98]',
        ],

        // === SECONDARY: Subtle Border ===
        variant === 'secondary' && [
          'bg-white/5 border border-white/10 text-white/80',
          'hover:bg-white/10 hover:text-white hover:border-white/20',
          'active:scale-[0.98]',
        ],

        // === GHOST: Minimal ===
        variant === 'ghost' && [
          'bg-transparent text-white/60',
          'hover:bg-white/5 hover:text-white',
        ],

        // === DANGER: Critical ===
        variant === 'danger' && [
          'bg-red-500/10 border border-red-500/30 text-red-400',
          'hover:bg-red-500/20 hover:border-red-500/50',
        ],

        className
      )}
      {...props}
    >
      {/* Text Label */}
      <span>{children}</span>
      
      {/* Icon (if provided) */}
      {icon && (
        <span className="w-4 h-4 transition-transform group-hover:translate-x-0.5">
          {icon}
        </span>
      )}
    </button>
  );
};
