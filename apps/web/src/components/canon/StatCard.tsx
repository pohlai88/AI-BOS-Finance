/**
 * StatCard - Canon Component
 * 
 * Displays statistics with icon, value, and label.
 * Built on shadcn/ui Card with Canon styling.
 * 
 * @component COMP_StatCard
 * @version 1.0.0
 * @see REF_037 - Phase 3: Canon Page System
 */

import { Card } from '@/components/ui/card'
import { cn } from '@/components/ui/utils'
import { type LucideIcon } from 'lucide-react'

export interface StatCardProps {
  icon: LucideIcon
  value: number | string
  label: string
  valueClassName?: string
  className?: string
  'aria-label'?: string
}

export function StatCard({ 
  icon: Icon, 
  value, 
  label, 
  valueClassName,
  className,
  'aria-label': ariaLabel
}: StatCardProps) {
  const cardId = `stat-card-${label.toLowerCase().replace(/\s+/g, '-')}`
  
  return (
    <Card 
      id={cardId}
      className={cn(
        'border-subtle/30 bg-surface-subtle/10 p-4 text-center focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2',
        className
      )}
      role="region"
      aria-labelledby={`${cardId}-label`}
      aria-label={ariaLabel}
      tabIndex={0}
    >
      <Icon 
        className="w-5 h-5 text-text-primary/60 mx-auto mb-2" 
        aria-hidden="true"
      />
      <div 
        className={cn('text-xl font-bold text-text-primary', valueClassName)}
        aria-hidden="true"
      >
        {value}
      </div>
      <div 
        id={`${cardId}-label`}
        className="text-xs font-medium text-text-primary/70 mt-1"
      >
        {label}
      </div>
    </Card>
  )
}

export const COMPONENT_META = {
  code: 'COMP_StatCard',
  version: '1.0.0',
  family: 'CARD',
  purpose: 'METRICS',
  status: 'active',
} as const
