import { cn } from '@aibos/ui'
import { ReactNode } from 'react'

interface NexusCardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'glass' | 'alert'
  title?: string // Optional header included
  action?: ReactNode // Optional top-right action
}

export const NexusCard = ({
  children,
  className,
  variant = 'default',
  title,
  action,
}: NexusCardProps) => {
  return (
    <div
      className={cn(
        'nexus-card relative transition-all duration-300', // Base class from globals.css + relative for corners
        // Variant Logic
        variant === 'glass' && 'bg-nexus-void/60 backdrop-blur-md',
        variant === 'alert' && 'border-red-900/50 bg-red-950/10',
        className
      )}
    >
      {/* Optional Built-in Header (Enforces Layout) */}
      {(title || action) && (
        <div className="border-nexus-structure flex items-center justify-between border-b p-4">
          {title && (
            <div className="flex items-center gap-2">
              <div className="bg-nexus-green/50 h-3 w-1" /> {/* Decoration */}
              <span className="nexus-label text-nexus-signal">{title}</span>
            </div>
          )}
          {action && <div>{action}</div>}
        </div>
      )}

      {/* Content Area */}
      <div className="p-5">{children}</div>

      {/* Decorative Corner Markers (The "Forensic" Touch) */}
      <div className="bg-nexus-structure absolute left-0 top-0 h-1 w-1" />
      <div className="bg-nexus-structure absolute right-0 top-0 h-1 w-1" />
      <div className="bg-nexus-structure absolute bottom-0 left-0 h-1 w-1" />
      <div className="bg-nexus-structure absolute bottom-0 right-0 h-1 w-1" />
    </div>
  )
}
