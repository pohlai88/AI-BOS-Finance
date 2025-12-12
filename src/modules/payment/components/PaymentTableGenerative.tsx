// ============================================================================
// COM_PAY_04: PAYMENT TABLE (Generative UI Version)
// ============================================================================
// This is the "Living Cell" version - UI grows from Zod schema
// Replaces the hardcoded PaymentTable with ZodBioList
// 🛡️ GOVERNANCE: Uses ZodBioList (which uses BioSkin atoms)
// ============================================================================

'use client'

import React from 'react'
import { z } from 'zod'
import { ZodBioList } from '@aibos/bioskin'
import {
  PaymentSchema,
  PaymentIntrospectionOptions,
} from '../schemas/PaymentZodSchema'
import type { Payment } from '../data/paymentSchema'

// ============================================================================
// TYPES - Derived from Schema (Single Source of Truth)
// ============================================================================

/** Payment type inferred from Zod schema - ensures type safety */
export type PaymentZod = z.infer<typeof PaymentSchema>

export interface PaymentTableGenerativeProps {
  /** Array of payments to display */
  payments: Payment[]
  /** Selected payment ID */
  selectedId?: string | null
  /** Row click handler */
  onRowClick?: (payment: Payment) => void
  /** Loading state */
  isLoading?: boolean
  /** Additional className */
  className?: string
  /** Custom renderers for specific columns (escape hatch) */
  customRenderers?: {
    [fieldName: string]: (value: unknown, record: Payment) => React.ReactNode
  }
}

// ============================================================================
// PAYMENT TABLE (GENERATIVE) - The Living Cell
// ============================================================================

/**
 * PaymentTableGenerative - Renders payment table from Zod schema
 *
 * This is the "Biological" approach - the UI grows from the schema.
 * Change the PaymentSchema, and the table adapts automatically.
 *
 * @example
 * ```tsx
 * <PaymentTableGenerative
 *   payments={payments}
 *   selectedId={selectedId}
 *   onRowClick={(payment) => selectPayment(payment.id)}
 * />
 * ```
 */
export function PaymentTableGenerative({
  payments,
  selectedId,
  onRowClick,
  isLoading = false,
  className,
  customRenderers,
}: PaymentTableGenerativeProps) {
  // Validate and convert Payment[] to PaymentZod[]
  // This ensures runtime type safety - if Payment doesn't match PaymentSchema, we'll catch it
  const validatedPayments = React.useMemo(() => {
    return payments.map((payment) => {
      // Runtime validation ensures Payment matches PaymentSchema
      const result = PaymentSchema.safeParse(payment)
      if (!result.success) {
        // Log warning in development, handle gracefully in production
        if (process.env.NODE_ENV === 'development') {
          console.warn('Payment does not match PaymentSchema:', {
            paymentId: payment.id,
            errors: result.error.errors,
          })
        }
        // In production, you might want to:
        // - Filter out invalid payments
        // - Send to error tracking service
        // - Show user-friendly error message
        return payment as PaymentZod
      }
      return result.data
    })
  }, [payments])

  // Convert customRenderers to work with PaymentZod
  const zodCustomRenderers = React.useMemo(() => {
    if (!customRenderers) return undefined

    return Object.fromEntries(
      Object.entries(customRenderers).map(([fieldName, renderer]) => [
        fieldName,
        (value: unknown, record: PaymentZod) =>
          renderer(value, record as Payment),
      ])
    )
  }, [customRenderers])

  return (
    <ZodBioList
      schema={PaymentSchema}
      data={validatedPayments}
      onRowClick={
        onRowClick ? (record) => onRowClick(record as Payment) : undefined
      }
      rowKey="id"
      isLoading={isLoading}
      className={className}
      introspectionOptions={PaymentIntrospectionOptions}
      customRenderers={zodCustomRenderers}
    />
  )
}

export default PaymentTableGenerative
