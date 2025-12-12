// ============================================================================
// SCH_PAY_01: PAYMENT ZOD SCHEMA - The DNA
// ============================================================================
// Zod schema definition for Payment entity
// This is the "DNA" that generates the UI automatically
// 🛡️ GOVERNANCE: Single source of truth for Payment structure
// ============================================================================

import { z } from 'zod'

// ============================================================================
// ENUMS
// ============================================================================

export const PaymentStatusEnum = z.enum(['draft', 'pending', 'approved', 'rejected', 'paid'])
export const PaymentMethodEnum = z.enum(['wire', 'ach', 'check', 'card'])
export const TransactionTypeEnum = z.enum(['external', 'intercompany'])
export const EliminationStatusEnum = z.enum(['matched', 'unmatched', 'n/a'])
export const FunctionalClusterEnum = z.enum(['utilities', 'logistics', 'professional', 'intercompany', 'other'])

// ============================================================================
// MANIFEST SCHEMA
// ============================================================================

export const ManifestSchema = z.object({
  type: z.enum(['invoice', 'receipt', 'contract', 'po']),
  ref_id: z.string(),
  label: z.string(),
  file_size: z.string().optional(),
  url: z.string().url().optional(),
})

// ============================================================================
// PAYMENT SCHEMA - The DNA
// ============================================================================

export const PaymentSchema = z.object({
  // Identity
  id: z.string().describe('Unique payment identifier'),
  tx_id: z.string().describe('Transaction ID'),
  beneficiary: z.string().min(1).describe('Recipient name'),
  invoice_ref: z.string().describe('Invoice reference'),

  // Financial
  amount: z.number().min(0).describe('Payment amount'),
  currency: z.string().default('USD').describe('Currency code'),

  // Payment Details
  method: PaymentMethodEnum.describe('Payment method'),
  status: PaymentStatusEnum.describe('Payment status'),

  // Group Context
  tx_type: TransactionTypeEnum.describe('Transaction type'),
  elimination_status: EliminationStatusEnum.describe('IC elimination status'),
  functional_cluster: FunctionalClusterEnum.describe('Functional cluster'),
  counterparty_entity: z.string().optional().describe('IC counterparty entity'),

  // Observability
  risk_score: z.number().min(0).max(100).describe('Risk score (0-100)'),
  deviation: z.number().optional().describe('Deviation from historical average'),

  // Audit Trail
  requested_by: z.string().describe('Requestor name'),
  requestor_id: z.string().describe('Requestor ID'),
  approved_by: z.string().optional().describe('Approver name'),
  approver_id: z.string().optional().describe('Approver ID'),

  // Timeline
  created_at: z.string().datetime().describe('Creation timestamp'),
  due_date: z.string().describe('Due date'),
  approved_at: z.string().datetime().optional().describe('Approval timestamp'),

  // Allocation
  entity: z.string().describe('Legal entity'),
  cost_center: z.string().describe('Cost center'),
  gl_account: z.string().describe('GL account'),

  // Documents
  docs_attached: z.number().min(0).describe('Documents attached'),
  docs_required: z.number().min(0).describe('Documents required'),
  manifests: z.array(ManifestSchema).optional().describe('Linked manifests'),

  // Governance
  policy_violation: z.string().optional().describe('Policy violation message'),
  sod_warning: z.boolean().optional().describe('Segregation of Duties warning'),
})

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type PaymentZod = z.infer<typeof PaymentSchema>
export type PaymentStatus = z.infer<typeof PaymentStatusEnum>
export type PaymentMethod = z.infer<typeof PaymentMethodEnum>
export type TransactionType = z.infer<typeof TransactionTypeEnum>
export type EliminationStatus = z.infer<typeof EliminationStatusEnum>
export type FunctionalCluster = z.infer<typeof FunctionalClusterEnum>
export type Manifest = z.infer<typeof ManifestSchema>

// ============================================================================
// INTROSPECTION OPTIONS - UI Customization
// ============================================================================

export const PaymentIntrospectionOptions = {
  businessTermMap: {
    tx_id: 'Transaction ID',
    invoice_ref: 'Invoice Reference',
    tx_type: 'Transaction Type',
    elimination_status: 'IC Match Status',
    functional_cluster: 'Functional Cluster',
    risk_score: 'Risk Score',
    requested_by: 'Requested By',
    requestor_id: 'Requestor ID',
    approved_by: 'Approved By',
    approver_id: 'Approver ID',
    created_at: 'Created At',
    due_date: 'Due Date',
    approved_at: 'Approved At',
    docs_attached: 'Docs Attached',
    docs_required: 'Docs Required',
    counterparty_entity: 'Counterparty Entity',
    policy_violation: 'Policy Violation',
    sod_warning: 'SoD Warning',
  },
  fieldGroups: {
    id: 'Identity',
    tx_id: 'Identity',
    beneficiary: 'Identity',
    invoice_ref: 'Identity',
    amount: 'Financial',
    currency: 'Financial',
    method: 'Payment Details',
    status: 'Payment Details',
    tx_type: 'Group Context',
    elimination_status: 'Group Context',
    functional_cluster: 'Group Context',
    counterparty_entity: 'Group Context',
    risk_score: 'Observability',
    deviation: 'Observability',
    requested_by: 'Audit Trail',
    requestor_id: 'Audit Trail',
    approved_by: 'Audit Trail',
    approver_id: 'Audit Trail',
    created_at: 'Timeline',
    due_date: 'Timeline',
    approved_at: 'Timeline',
    entity: 'Allocation',
    cost_center: 'Allocation',
    gl_account: 'Allocation',
    docs_attached: 'Documents',
    docs_required: 'Documents',
    manifests: 'Documents',
    policy_violation: 'Governance',
    sod_warning: 'Governance',
  },
  fieldOrder: {
    id: 1,
    tx_id: 2,
    beneficiary: 3,
    invoice_ref: 4,
    amount: 10,
    currency: 11,
    method: 20,
    status: 21,
    tx_type: 30,
    elimination_status: 31,
    functional_cluster: 32,
    risk_score: 40,
    deviation: 41,
    requested_by: 50,
    requestor_id: 51,
    created_at: 60,
    due_date: 61,
    entity: 70,
    cost_center: 71,
    gl_account: 72,
  },
  hiddenFields: ['approver_id'], // Hide internal IDs from UI
} as const
