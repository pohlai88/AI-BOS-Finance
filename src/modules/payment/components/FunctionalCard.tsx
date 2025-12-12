// ============================================================================
// COM_PAY_03: FUNCTIONAL CARD - Batch Processing Clusters
// ============================================================================
// Visual representation of functional payment clusters
// Distinguishes: Clean (Green/Approve) vs Anomalies (Yellow/Review)
// 🛡️ GOVERNANCE: Uses Surface, Txt, Btn, StatusDot components (no hardcoded colors)
// ============================================================================

import React from 'react'
import {
  Zap,
  Truck,
  Briefcase,
  Building2,
  Package,
  CheckCircle2,
  AlertTriangle,
  Ban,
  Search,
  ArrowRightLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Surface, Txt, Btn, StatusDot } from '@aibos/ui'

// ============================================================================
// TYPES
// ============================================================================

export type ClusterStatus = 'clean' | 'anomalies' | 'blocked'
export type ClusterType =
  | 'utilities'
  | 'logistics'
  | 'professional'
  | 'intercompany'
  | 'other'

export interface FunctionalClusterData {
  cluster_id: ClusterType
  cluster_name: string
  invoice_count: number
  total_amount: number
  anomaly_count: number
  status: ClusterStatus
  can_batch_approve: boolean
  block_reason?: string
}

interface FunctionalCardProps {
  cluster: FunctionalClusterData
  onApprove: (clusterId: string) => void
  onReview: (clusterId: string) => void
  onSettle?: (clusterId: string) => void
  className?: string
}

// ============================================================================
// CLUSTER ICONS
// ============================================================================

const CLUSTER_ICONS: Record<ClusterType, React.ElementType> = {
  utilities: Zap,
  logistics: Truck,
  professional: Briefcase,
  intercompany: Building2,
  other: Package,
}

const CLUSTER_COLORS: Record<
  ClusterType,
  { bg: string; text: string; border: string }
> = {
  utilities: {
    bg: 'bg-yellow-900/20',
    text: 'text-yellow-400',
    border: 'border-yellow-800/50',
  },
  logistics: {
    bg: 'bg-blue-900/20',
    text: 'text-blue-400',
    border: 'border-blue-800/50',
  },
  professional: {
    bg: 'bg-purple-900/20',
    text: 'text-purple-400',
    border: 'border-purple-800/50',
  },
  intercompany: {
    bg: 'bg-pink-900/20',
    text: 'text-pink-400',
    border: 'border-pink-800/50',
  },
  other: {
    bg: 'bg-gray-900/20',
    text: 'text-gray-400',
    border: 'border-gray-700/50',
  },
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function FunctionalCard({
  cluster,
  onApprove,
  onReview,
  onSettle,
  className,
}: FunctionalCardProps) {
  const Icon = CLUSTER_ICONS[cluster.cluster_id]
  const colors = CLUSTER_COLORS[cluster.cluster_id]

  // Format currency
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(amount)
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // 🛡️ GOVERNANCE: Status styling uses status tokens
  const getStatusStyle = () => {
    switch (cluster.status) {
      case 'clean':
        return {
          bg: 'bg-status-success/10',
          border: 'border-status-success/30',
          icon: CheckCircle2,
          variant: 'success' as const,
          text: 'CLEAN',
        }
      case 'anomalies':
        return {
          bg: 'bg-status-warning/10',
          border: 'border-status-warning/30',
          icon: AlertTriangle,
          variant: 'warning' as const,
          text: `${cluster.anomaly_count} ANOMAL${cluster.anomaly_count === 1 ? 'Y' : 'IES'}`,
        }
      case 'blocked':
        return {
          bg: 'bg-status-error/10',
          border: 'border-status-error/30',
          icon: Ban,
          variant: 'error' as const,
          text: 'BLOCKED',
        }
    }
  }

  const statusStyle = getStatusStyle()
  const StatusIcon = statusStyle.icon

  return (
    <Surface
      variant="base"
      className={cn(
        'hover:border-border-surface-base flex flex-col overflow-hidden transition-colors',
        className
      )}
    >
      {/* Header */}
      {/* 🛡️ GOVERNANCE: Uses Surface + Txt components */}
      <Surface variant="flat" className="border-b p-4">
        <div className="flex items-center gap-3">
          <Surface variant="flat" className={cn('rounded p-2', colors.bg)}>
            <Icon className={cn('h-5 w-5', colors.text)} />
          </Surface>
          <div>
            <Txt variant="h3">{cluster.cluster_name}</Txt>
            <Txt
              variant="small"
              className="font-mono uppercase tracking-wider text-text-tertiary"
            >
              Global
            </Txt>
          </div>
        </div>
      </Surface>

      {/* Metrics */}
      {/* 🛡️ GOVERNANCE: Uses Txt component */}
      <Surface variant="flat" className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Txt variant="small" className="text-text-tertiary">
              📄
            </Txt>
            <Txt variant="h2" className="font-mono">
              {cluster.invoice_count}
            </Txt>
            <Txt variant="small" className="text-text-tertiary">
              Invoices
            </Txt>
          </div>

          <div className="bg-border-surface-base h-4 w-px" />

          <div className="flex items-center gap-2">
            <Txt variant="small" className="text-text-tertiary">
              💰
            </Txt>
            <Txt variant="h2" className="font-mono text-action-primary">
              {formatCurrency(cluster.total_amount)}
            </Txt>
          </div>
        </div>
      </Surface>

      {/* Status Section */}
      {/* 🛡️ GOVERNANCE: Uses Surface + StatusDot + Txt components */}
      <Surface
        variant="base"
        className={cn('border-b px-4 py-3', statusStyle.bg)}
      >
        <div className="flex items-center gap-2">
          <StatusDot variant={statusStyle.variant} size="sm" />
          <Txt
            variant="small"
            className={cn(
              'font-mono font-bold uppercase tracking-wider',
              statusStyle.variant === 'success' && 'text-status-success',
              statusStyle.variant === 'warning' && 'text-status-warning',
              statusStyle.variant === 'error' && 'text-status-error'
            )}
          >
            Status: {statusStyle.text}
          </Txt>
        </div>
        {cluster.block_reason && (
          <Txt variant="small" className="mt-1 pl-6 text-text-secondary">
            {cluster.block_reason}
          </Txt>
        )}
        {cluster.status === 'clean' && (
          <Txt variant="small" className="mt-1 pl-6 text-text-tertiary">
            0 Anomalies found.
          </Txt>
        )}
      </Surface>

      {/* Action Button */}
      {/* 🛡️ GOVERNANCE: Uses Btn component */}
      <div className="mt-auto p-4">
        {cluster.cluster_id === 'intercompany' ? (
          // Special IC settlement action
          <Btn
            variant="secondary"
            size="md"
            onClick={() => onSettle?.(cluster.cluster_id)}
            className="w-full"
          >
            <ArrowRightLeft className="h-4 w-4" />
            Settle IC
          </Btn>
        ) : cluster.can_batch_approve ? (
          // Clean - can batch approve
          <Btn
            variant="primary"
            size="md"
            onClick={() => onApprove(cluster.cluster_id)}
            className="w-full"
          >
            <CheckCircle2 className="h-4 w-4" />
            Approve Batch
          </Btn>
        ) : (
          // Anomalies - must review
          <Btn
            variant="secondary"
            size="md"
            onClick={() => onReview(cluster.cluster_id)}
            className="border-status-warning/50 hover:bg-status-warning/10 w-full text-status-warning"
          >
            <Search className="h-4 w-4" />
            Review Risks
          </Btn>
        )}
      </div>
    </Surface>
  )
}

// ============================================================================
// FUNCTIONAL CARD GRID COMPONENT
// ============================================================================

interface FunctionalCardGridProps {
  clusters: FunctionalClusterData[]
  onApprove: (clusterId: string) => void
  onReview: (clusterId: string) => void
  onSettle?: (clusterId: string) => void
  className?: string
}

export function FunctionalCardGrid({
  clusters,
  onApprove,
  onReview,
  onSettle,
  className,
}: FunctionalCardGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4',
        className
      )}
    >
      {clusters.map((cluster) => (
        <FunctionalCard
          key={cluster.cluster_id}
          cluster={cluster}
          onApprove={onApprove}
          onReview={onReview}
          onSettle={onSettle}
        />
      ))}
    </div>
  )
}

export default FunctionalCard
