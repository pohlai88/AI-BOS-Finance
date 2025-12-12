// ============================================================================
// RULE_PAY_04: DOCUMENT COMPLETENESS RULES
// ============================================================================
// Validates that required documents are attached before approval
// Thresholds determine requirements: higher amounts = more docs
// ============================================================================

import { useMemo } from 'react'
import { PAYMENT_CONFIG, type Payment, type Manifest } from '../data'

// ============================================================================
// TYPES
// ============================================================================

export type DocumentType = 'invoice' | 'receipt' | 'contract' | 'po'

export interface DocumentRequirement {
  type: DocumentType
  label: string
  attached: boolean
  required: boolean
}

export interface DocumentValidationResult {
  isComplete: boolean
  attached: DocumentType[]
  missing: DocumentType[]
  optional: DocumentType[]
  requirements: DocumentRequirement[]
  completionRatio: string
  warningMessage: string | null
  blockApproval: boolean
}

// ============================================================================
// DOCUMENT LABELS
// ============================================================================

const DOC_LABELS: Record<DocumentType, string> = {
  invoice: 'Invoice',
  receipt: 'Receipt',
  contract: 'Contract',
  po: 'Purchase Order',
}

// ============================================================================
// RULE_PAY_04: DOCUMENT VALIDATION FUNCTION
// ============================================================================

export function validateDocuments(payment: Payment): DocumentValidationResult {
  const { doc_requirements } = PAYMENT_CONFIG

  // Determine threshold tier
  const tier =
    payment.amount < 1000
      ? 'under_1000'
      : payment.amount < 10000
        ? 'under_10000'
        : 'over_10000'

  const required = doc_requirements[tier].required as DocumentType[]
  const optional = doc_requirements[tier].optional as DocumentType[]

  // Get attached document types
  const attached = (payment.manifests || []).map(
    (m) => m.type
  ) as DocumentType[]

  // Find missing required docs
  const missing = required.filter((r) => !attached.includes(r))

  // Build requirements list
  const requirements: DocumentRequirement[] = [
    ...required.map((type) => ({
      type,
      label: DOC_LABELS[type],
      attached: attached.includes(type),
      required: true,
    })),
    ...optional.map((type) => ({
      type,
      label: DOC_LABELS[type],
      attached: attached.includes(type),
      required: false,
    })),
  ]

  const isComplete = missing.length === 0
  const completionRatio = `${attached.filter((a) => required.includes(a)).length}/${required.length}`

  // Generate warning
  let warningMessage: string | null = null
  if (!isComplete) {
    warningMessage = `Missing: ${missing.map((m) => DOC_LABELS[m]).join(', ')}`
  }

  // MVP: Warning only, don't block
  // Phase 2: Set blockApproval = !isComplete for enforcement
  const blockApproval = false

  return {
    isComplete,
    attached,
    missing,
    optional: optional.filter((o) => !attached.includes(o)),
    requirements,
    completionRatio,
    warningMessage,
    blockApproval,
  }
}

// ============================================================================
// DOCUMENT VALIDATION HOOK
// ============================================================================

export function useDocumentValidation(
  payment: Payment | null
): DocumentValidationResult | null {
  return useMemo(() => {
    if (!payment) return null
    return validateDocuments(payment)
  }, [payment])
}

// ============================================================================
// DOCUMENT ICON HELPER
// ============================================================================

export function getDocumentIcon(type: DocumentType): string {
  const icons: Record<DocumentType, string> = {
    invoice: '📄',
    receipt: '🧾',
    contract: '📝',
    po: '📋',
  }
  return icons[type]
}

// ============================================================================
// DOCUMENT STATUS SUMMARY
// ============================================================================

export function getDocumentStatusSummary(payment: Payment): {
  icon: string
  text: string
  status: 'complete' | 'incomplete' | 'warning'
} {
  const validation = validateDocuments(payment)

  if (validation.isComplete) {
    return {
      icon: '✅',
      text: `${validation.completionRatio} docs`,
      status: 'complete',
    }
  }

  return {
    icon: '⚠️',
    text: `${validation.completionRatio} docs`,
    status: validation.missing.length > 1 ? 'incomplete' : 'warning',
  }
}
