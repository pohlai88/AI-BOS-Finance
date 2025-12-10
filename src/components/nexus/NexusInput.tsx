import { InputHTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '../../lib/utils';
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
          <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-2">
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
              "w-full bg-[#050505] border border-[#27272a] text-zinc-100 text-sm font-mono px-3 py-2.5 rounded-[2px]",
              "focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20",
              "placeholder:text-zinc-700 transition-colors",
              "disabled:cursor-not-allowed disabled:opacity-50",
              readOnly && "bg-transparent border-transparent border-b-[#27272a] px-0 rounded-none focus:ring-0 cursor-default",
              className
            )}
            {...props}
          />
          {icon && (
            <div className="absolute right-3 top-2.5 text-zinc-500 pointer-events-none group-focus-within:text-emerald-500 transition-colors">
              {icon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-[10px] text-red-500 font-mono mt-1">{error}</p>
        )}
      </div>
    );
  }
);
NexusInput.displayName = "NexusInput";
