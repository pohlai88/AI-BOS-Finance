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

import { Card, cn } from '@aibos/ui'
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
  'aria-label': ariaLabel,
}: StatCardProps) {
  const cardId = `stat-card-${label.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <Card
      id={cardId}
      className={cn(
        'border-nexus-border/30 bg-nexus-surface/10 focus-within:ring-nexus-green p-4 text-center focus-within:ring-2 focus-within:ring-offset-2',
        className
      )}
      role="region"
      aria-labelledby={`${cardId}-label`}
      aria-label={ariaLabel}
      tabIndex={0}
    >
      <Icon
        className="text-nexus-signal/60 mx-auto mb-2 h-5 w-5"
        aria-hidden="true"
      />
      <div
        className={cn('text-nexus-signal text-xl font-bold', valueClassName)}
        aria-hidden="true"
      >
        {value}
      </div>
      <div
        id={`${cardId}-label`}
        className="text-nexus-signal/70 mt-1 text-xs font-medium"
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
