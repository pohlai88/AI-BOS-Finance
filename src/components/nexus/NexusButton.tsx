import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion } from 'motion/react';

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
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={cn(
        // Base Architecture
        'group relative inline-flex items-center justify-center gap-2.5',
        'font-medium transition-all duration-300 ease-out',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-nexus-green/50 focus-visible:ring-offset-2 focus-visible:ring-offset-nexus-void',
        
        // Size System
        size === 'sm' && 'h-9 px-4 text-xs rounded-md',
        size === 'md' && 'h-11 px-5 text-sm rounded-lg',
        size === 'lg' && 'h-12 px-7 text-sm rounded-lg',

        // === PRIMARY: The Crystalline Action ===
        // Solid, confident, unmistakable call-to-action
        variant === 'primary' && [
          // Surface: Rich green with subtle inner glow
          'bg-gradient-to-b from-nexus-green to-emerald-600',
          'text-nexus-void font-semibold',
          // Depth: Multi-layer shadow for "lifted" feel
          'shadow-[0_1px_2px_rgba(0,0,0,0.3),0_4px_12px_rgba(40,231,162,0.15),inset_0_1px_0_rgba(255,255,255,0.1)]',
          // Hover: Brighten + elevate
          'hover:from-emerald-400 hover:to-nexus-green',
          'hover:shadow-[0_2px_4px_rgba(0,0,0,0.3),0_8px_24px_rgba(40,231,162,0.25),inset_0_1px_0_rgba(255,255,255,0.15)]',
        ],

        // === SECONDARY: The Glass Protocol ===
        // Subtle, professional, secondary action
        variant === 'secondary' && [
          // Surface: Frosted glass
          'bg-white/[0.03] backdrop-blur-sm',
          'border border-white/[0.08]',
          'text-white/70',
          // Hover: Reveal
          'hover:bg-white/[0.06] hover:border-white/[0.12] hover:text-white',
          // Subtle shadow
          'shadow-[0_1px_2px_rgba(0,0,0,0.2)]',
        ],

        // === GHOST: The Whisper ===
        variant === 'ghost' && [
          'bg-transparent text-white/50',
          'hover:bg-white/[0.04] hover:text-white/80',
        ],

        // === DANGER: The Alert ===
        variant === 'danger' && [
          'bg-red-500/10 border border-red-500/20',
          'text-red-400',
          'hover:bg-red-500/15 hover:border-red-500/30 hover:text-red-300',
          'shadow-[0_1px_2px_rgba(0,0,0,0.2)]',
        ],

        className
      )}
      {...props}
    >
      {/* Primary: Shimmer overlay on hover */}
      {variant === 'primary' && (
        <span className="absolute inset-0 overflow-hidden rounded-[inherit]">
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </span>
      )}

      {/* Content Layer */}
      <span className="relative z-10 flex items-center gap-2.5">
        <span className="tracking-wide">{children}</span>
        
        {icon && (
          <span className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5">
            {icon}
          </span>
        )}
      </span>
    </motion.button>
  );
};
