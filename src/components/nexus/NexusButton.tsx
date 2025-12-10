import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, ReactNode } from 'react';

interface NexusButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: ReactNode;
}

export const NexusButton = ({
  children,
  className,
  variant = 'primary',
  icon,
  ...props
}: NexusButtonProps) => {
  return (
    <button
      className={cn(
        'group relative h-12 px-8 flex items-center gap-3 justify-center overflow-hidden',
        'font-mono text-xs uppercase tracking-[0.15em] transition-all duration-300',
        'disabled:opacity-50 disabled:cursor-not-allowed',

        // === PRIMARY: THE WIREFRAME PROTOCOL ===
        // Default: Transparent Black + Green Border + Green Text
        // Hover: Fills with Green + Black Text (System Activation)
        variant === 'primary' && [
          'bg-nexus-void border border-nexus-green text-nexus-green',
          'hover:bg-nexus-green hover:text-nexus-void hover:shadow-[0_0_20px_rgba(40,231,162,0.4)]',
        ],

        // === SECONDARY: THE GHOST DATA ===
        variant === 'secondary' && [
          'border border-nexus-structure text-nexus-noise bg-transparent',
          'hover:text-nexus-signal hover:border-nexus-subtle',
        ],

        // === DANGER: THE CRITICAL ERROR ===
        variant === 'danger' && [
          'border border-red-900/50 text-red-500 bg-red-950/10',
          'hover:bg-red-900/20 hover:border-red-500',
        ],

        className
      )}
      {...props}
    >
      {/* === FORENSIC DECORATION (Only for Primary) === */}
      {variant === 'primary' && (
        <>
          {/* Top Left Corner */}
          <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-nexus-green transition-all duration-300 group-hover:w-full group-hover:h-full" />
          {/* Bottom Right Corner */}
          <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-nexus-green transition-all duration-300 group-hover:w-full group-hover:h-full" />

          {/* The "Scanline" pass-through effect on hover */}
          <span className="absolute inset-0 bg-nexus-green/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        </>
      )}

      {/* Icon Handling */}
      {icon && <span className="w-4 h-4 relative z-10">{icon}</span>}

      {/* Text Label (Z-Index ensures it stays above the hover fill) */}
      <span className="relative z-10 font-bold">{children}</span>
    </button>
  );
};
