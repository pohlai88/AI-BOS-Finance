/**
 * StatusBadge - Canon Component
 *
 * Displays status indicators using SSOT from registry.
 * Built on shadcn/ui Badge with Canon-specific variants.
 *
 * @component COMP_StatusBadge
 * @version 1.0.0
 * @see REF_037 - Phase 3: Canon Page System
 */

import { Badge, cn } from '@aibos/ui'
import { STATUS_CONFIG, type CanonStatus } from '@/canon-pages/registry'

export interface StatusBadgeProps {
  status: CanonStatus
  className?: string
  showIcon?: boolean
}

export function StatusBadge({
  status,
  className,
  showIcon = true,
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon

  return (
    <Badge
      variant="outline"
      className={cn('gap-1', config.bg, config.color, config.border, className)}
      role="status"
      aria-label={`Status: ${config.label}`}
    >
      {showIcon && <Icon className="h-3 w-3" aria-hidden="true" />}
      <span>{config.label}</span>
    </Badge>
  )
}

export const COMPONENT_META = {
  code: 'COMP_StatusBadge',
  version: '1.0.0',
  family: 'BADGE',
  purpose: 'STATUS',
  status: 'active',
} as const
