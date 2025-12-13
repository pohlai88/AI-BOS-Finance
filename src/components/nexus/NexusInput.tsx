import { InputHTMLAttributes, forwardRef, ReactNode } from 'react'
import { cn } from '@aibos/ui'
import { Lock } from 'lucide-react'

export interface NexusInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  icon?: ReactNode
  error?: string
}

export const NexusInput = forwardRef<HTMLInputElement, NexusInputProps>(
  ({ className, label, icon, error, disabled, readOnly, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="nexus-label text-nexus-noise flex items-center gap-2">
            {label}
            {readOnly && <Lock className="h-2.5 w-2.5 opacity-50" />}
          </label>
        )}
        <div className="group relative">
          <input
            ref={ref}
            disabled={disabled}
            readOnly={readOnly}
            className={cn(
              // Base styles
              'bg-nexus-void border-nexus-structure text-nexus-signal w-full border px-3 py-2.5 font-mono text-sm',
              // Focus states
              'focus:border-nexus-green/50 focus:ring-nexus-green/20 focus:outline-none focus:ring-1',
              // Placeholder
              'placeholder:text-nexus-structure transition-colors',
              // Disabled
              'disabled:cursor-not-allowed disabled:opacity-50',
              // Readonly variant (underline style)
              readOnly &&
                'border-b-nexus-structure cursor-default border-transparent bg-transparent px-0 focus:ring-0',
              className
            )}
            {...props}
          />
          {icon && (
            <div className="text-nexus-noise group-focus-within:text-nexus-green pointer-events-none absolute right-3 top-2.5 transition-colors">
              {icon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 font-mono text-[10px] text-red-500">{error}</p>
        )}
      </div>
    )
  }
)

NexusInput.displayName = 'NexusInput'
