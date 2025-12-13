/**
 * StatusCard - Canon Component
 *
 * Displays status counts with colored styling from SSOT.
 * Built on shadcn/ui Card with Canon status variants.
 *
 * @component COMP_StatusCard
 * @version 1.0.0
 * @see REF_037 - Phase 3: Canon Page System
 */

import { Card, cn } from '@aibos/ui'
import { STATUS_CONFIG, type CanonStatus } from '@/canon-pages/registry'

export interface StatusCardProps {
  status: CanonStatus
  count: number
  className?: string
}

export function StatusCard({ status, count, className }: StatusCardProps) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon
  const cardId = `status-card-${status.toLowerCase()}`

  return (
    <Card
      id={cardId}
      className={cn(
        'focus-within:ring-nexus-green p-4 transition-all focus-within:ring-2 focus-within:ring-offset-2 hover:scale-[1.02]',
        config.border,
        config.bg,
        className
      )}
      role="region"
      aria-labelledby={`${cardId}-label`}
      tabIndex={0}
    >
      <div className="mb-2 flex items-center justify-between">
        <Icon className={cn('h-5 w-5', config.color)} aria-hidden="true" />
        <span
          className={cn('text-2xl font-bold', config.color)}
          aria-label={`${count} ${config.label.toLowerCase()} pages`}
        >
          {count}
        </span>
      </div>
      <span
        id={`${cardId}-label`}
        className="text-nexus-signal/70 text-xs font-medium"
      >
        {config.label} Pages
      </span>
    </Card>
  )
}

export const COMPONENT_META = {
  code: 'COMP_StatusCard',
  version: '1.0.0',
  family: 'CARD',
  purpose: 'STATUS',
  status: 'active',
} as const
