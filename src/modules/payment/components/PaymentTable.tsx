// ============================================================================
// COM_PAY_04: PAYMENT TABLE - Transaction List View
// ============================================================================
// Wrapper around SuperTable with payment-specific configurations
// Highlights IC transactions, risk levels, and due dates
// ============================================================================

import React, { useMemo } from 'react'
import { SuperTable } from '@/modules/metadata/components/SuperTable'
import { generateColumnsFromSchema } from '@/modules/metadata/kernel'
import { cn } from '@aibos/ui'
import {
  PAYMENT_SCHEMA,
  type Payment,
  type PaymentStatus,
  type FunctionalCluster,
} from '../mock-data''

// ============================================================================
// TYPES
// ============================================================================

interface PaymentTableProps {
  payments: Payment[]
  selectedId?: string | null
  onRowClick: (payment: Payment) => void
  filterStatus?: PaymentStatus | 'all'
  filterCluster?: FunctionalCluster | 'all'
  className?: string
}

// ============================================================================
// CUSTOM ROW STYLING FUNCTION
// ============================================================================

function getRowClassName(payment: Payment): string {
  const classes: string[] = []

  // ðŸ›¡ï¸ GOVERNANCE: Uses status tokens instead of hardcoded colors
  // IC Unmatched - Red highlight
  if (
    payment.tx_type === 'intercompany' &&
    payment.elimination_status === 'unmatched'
  ) {
    classes.push('bg-status-error/5 hover:bg-status-error/10')
  }

  // High risk - Amber subtle
  else if (payment.risk_score > 80) {
    classes.push('bg-status-warning/5 hover:bg-status-warning/10')
  }

  // Overdue - Red subtle
  else if (
    new Date(payment.due_date) < new Date() &&
    payment.status === 'pending'
  ) {
    classes.push('bg-status-error/5 hover:bg-status-error/10')
  }

  return classes.join(' ')
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PaymentTable({
  payments,
  selectedId,
  onRowClick,
  filterStatus = 'all',
  filterCluster = 'all',
  className,
}: PaymentTableProps) {
  // Generate columns from schema
  const columns = useMemo(
    () => generateColumnsFromSchema<Payment>(PAYMENT_SCHEMA),
    []
  )

  // Filter payments
  const filteredPayments = useMemo(() => {
    let result = [...payments]

    if (filterStatus !== 'all') {
      result = result.filter((p) => p.status === filterStatus)
    }

    if (filterCluster !== 'all') {
      result = result.filter((p) => p.functional_cluster === filterCluster)
    }

    return result
  }, [payments, filterStatus, filterCluster])

  return (
    <div className={cn('h-full', className)}>
      <SuperTable<Payment>
        data={filteredPayments}
        columns={columns}
        title="PAYMENT_QUEUE"
        mobileKey="beneficiary"
        onRowClick={onRowClick}
        enableSelection={false}
        enablePagination={true}
        enableColumnVisibility={true}
        enableGlobalFilter={true}
        rowClassName={(row) =>
          cn(
            getRowClassName(row),
            // ðŸ›¡ï¸ GOVERNANCE: Uses action-primary token instead of hardcoded hex
            row.id === selectedId && 'ring-1 ring-action-primary ring-inset'
          )
        }
      />
    </div>
  )
}

export default PaymentTable
