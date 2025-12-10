import { InputHTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Lock } from 'lucide-react';

export interface NexusInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
  error?: string;
}

export const NexusInput = forwardRef<HTMLInputElement, NexusInputProps>(
  ({ className, label, icon, error, disabled, readOnly, ...props }, ref) => {
    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label className="nexus-label text-nexus-noise flex items-center gap-2">
            {label}
            {readOnly && <Lock className="w-2.5 h-2.5 opacity-50" />}
          </label>
        )}
        <div className="relative group">
          <input
            ref={ref}
            disabled={disabled}
            readOnly={readOnly}
            className={cn(
              // Base styles
              'w-full bg-nexus-void border border-nexus-structure text-nexus-signal text-sm font-mono px-3 py-2.5',
              // Focus states
              'focus:outline-none focus:border-nexus-green/50 focus:ring-1 focus:ring-nexus-green/20',
              // Placeholder
              'placeholder:text-nexus-structure transition-colors',
              // Disabled
              'disabled:cursor-not-allowed disabled:opacity-50',
              // Readonly variant (underline style)
              readOnly &&
                'bg-transparent border-transparent border-b-nexus-structure px-0 focus:ring-0 cursor-default',
              className
            )}
            {...props}
          />
          {icon && (
            <div className="absolute right-3 top-2.5 text-nexus-noise pointer-events-none group-focus-within:text-nexus-green transition-colors">
              {icon}
            </div>
          )}
        </div>
        {error && <p className="text-[10px] text-red-500 font-mono mt-1">{error}</p>}
      </div>
    );
  }
);

NexusInput.displayName = 'NexusInput';
