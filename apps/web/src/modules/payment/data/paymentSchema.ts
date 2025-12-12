// ============================================================================
// SCH_PAY_01: UNIFIED PAYMENT SCHEMA
// Single schema serving both Functional and Entity views
// ============================================================================
// PHILOSOPHY: "Observability First, Action Second."
// - Schema-driven UI generation
// - All fields governed by Kernel definitions
// - Changes here propagate to all payment views
// ============================================================================

import { MetadataField, STATUS_PRESETS } from '@/kernel';

// ============================================================================
// 1. THE GOVERNED SCHEMA
// ============================================================================

export const PAYMENT_SCHEMA: MetadataField[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // IDENTITY
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    technical_name: 'tx_id', 
    business_term: 'Payment ID', 
    data_type: 'code', 
    is_critical: true, 
    width: 120,
    description: 'Unique payment transaction identifier',
    sortable: true,
  },
  { 
    technical_name: 'beneficiary', 
    business_term: 'Beneficiary', 
    data_type: 'text', 
    width: 200,
    description: 'Vendor or recipient name',
    sortable: true,
    filterable: true,
  },
  { 
    technical_name: 'invoice_ref', 
    business_term: 'Invoice #', 
    data_type: 'code', 
    width: 120,
    description: 'Reference to source invoice',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GROUP CONTEXT (Dual-Lens Support)
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    technical_name: 'tx_type', 
    business_term: 'Type', 
    data_type: 'status',
    width: 100,
    status_config: {
      'external': 'bg-gray-800 text-gray-300 border-gray-600',
      'intercompany': 'bg-purple-900/30 text-purple-400 border-purple-800',
    },
    description: 'Transaction type: external vendor or intercompany',
    filterable: true,
  },
  { 
    technical_name: 'elimination_status', 
    business_term: 'IC Match', 
    data_type: 'status',
    width: 100,
    status_config: { 
      'matched': 'bg-emerald-900/30 text-emerald-400 border-emerald-800', 
      'unmatched': 'bg-red-900/30 text-red-400 border-red-800',
      'n/a': 'bg-gray-800 text-gray-400 border-gray-600',
    },
    description: 'Intercompany elimination matching status',
  },
  { 
    technical_name: 'functional_cluster', 
    business_term: 'Cluster', 
    data_type: 'status',
    width: 120,
    status_config: {
      'utilities': 'bg-yellow-900/30 text-yellow-400 border-yellow-800',
      'logistics': 'bg-blue-900/30 text-blue-400 border-blue-800',
      'professional': 'bg-purple-900/30 text-purple-400 border-purple-800',
      'intercompany': 'bg-pink-900/30 text-pink-400 border-pink-800',
      'other': 'bg-gray-800 text-gray-400 border-gray-600',
    },
    description: 'Functional grouping for batch processing',
    filterable: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // OBSERVABILITY
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    technical_name: 'risk_score', 
    business_term: 'Risk', 
    data_type: 'number',
    width: 70,
    description: 'Calculated risk score 0-100',
    sortable: true,
  },
  { 
    technical_name: 'deviation', 
    business_term: '% vs Avg', 
    data_type: 'percentage',
    width: 80,
    description: 'Deviation from historical average for this vendor',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MONEY (Governed - Critical)
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    technical_name: 'amount', 
    business_term: 'Amount', 
    data_type: 'currency', 
    format_pattern: 'USD', 
    is_critical: true, 
    width: 130,
    description: 'Payment amount in base currency',
    sortable: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // STATUS (Workflow)
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    technical_name: 'status', 
    business_term: 'Status', 
    data_type: 'status', 
    width: 100,
    status_config: {
      'draft': 'bg-gray-800 text-gray-400 border-gray-600',
      'pending': 'bg-amber-900/30 text-amber-400 border-amber-800',
      'approved': 'bg-emerald-900/30 text-emerald-400 border-emerald-800',
      'rejected': 'bg-red-900/30 text-red-400 border-red-800',
      'paid': 'bg-blue-900/30 text-blue-400 border-blue-800',
    },
    filterable: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HOW (Payment Method)
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    technical_name: 'method', 
    business_term: 'Method', 
    data_type: 'status', 
    width: 90,
    status_config: { 
      'wire': 'bg-blue-900/30 text-blue-400 border-blue-800', 
      'ach': 'bg-purple-900/30 text-purple-400 border-purple-800',
      'check': 'bg-gray-800 text-gray-400 border-gray-600',
      'card': 'bg-cyan-900/30 text-cyan-400 border-cyan-800',
    },
    filterable: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // WHO (Audit Trail)
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    technical_name: 'requested_by', 
    business_term: 'Requestor', 
    data_type: 'text', 
    width: 140,
    sortable: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // WHEN (Timeline)
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    technical_name: 'due_date', 
    business_term: 'Due Date', 
    data_type: 'date', 
    is_critical: true,
    width: 110,
    sortable: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // WHERE (Allocation)
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    technical_name: 'entity', 
    business_term: 'Entity', 
    data_type: 'text', 
    width: 140,
    description: 'Legal entity / subsidiary',
    filterable: true,
  },
  { 
    technical_name: 'cost_center', 
    business_term: 'Cost Center', 
    data_type: 'code',
    width: 120,
    filterable: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DOCUMENT COMPLETENESS
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    technical_name: 'docs_attached', 
    business_term: 'Docs', 
    data_type: 'number',
    width: 60,
    description: 'Number of documents attached',
  },
];

// ============================================================================
// 2. EXTENDED SCHEMA (for Audit Sidebar - not displayed in table)
// ============================================================================

export const PAYMENT_EXTENDED_FIELDS: MetadataField[] = [
  { technical_name: 'currency', business_term: 'Currency', data_type: 'text', width: 80 },
  { technical_name: 'bank_account', business_term: 'Bank Account', data_type: 'text', width: 150 },
  { technical_name: 'requestor_id', business_term: 'Requestor ID', data_type: 'code', width: 100 },
  { technical_name: 'approved_by', business_term: 'Approved By', data_type: 'text', width: 150 },
  { technical_name: 'approved_at', business_term: 'Approved At', data_type: 'datetime', width: 150 },
  { technical_name: 'created_at', business_term: 'Created', data_type: 'datetime', width: 150 },
  { technical_name: 'gl_account', business_term: 'GL Account', data_type: 'code', width: 100 },
  { technical_name: 'docs_required', business_term: 'Docs Required', data_type: 'number', width: 60 },
  { technical_name: 'counterparty_entity', business_term: 'IC Counterparty', data_type: 'text', width: 140 },
];

// ============================================================================
// 3. PAYMENT TYPE INTERFACE
// ============================================================================

export type PaymentStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'paid';
export type PaymentMethod = 'wire' | 'ach' | 'check' | 'card';
export type TransactionType = 'external' | 'intercompany';
export type EliminationStatus = 'matched' | 'unmatched' | 'n/a';
export type FunctionalCluster = 'utilities' | 'logistics' | 'professional' | 'intercompany' | 'other';

export interface Manifest {
  type: 'invoice' | 'receipt' | 'contract' | 'po';
  ref_id: string;
  label: string;
  file_size?: string;
  url?: string;
}

export interface Payment {
  id: string;
  tx_id: string;
  beneficiary: string;
  invoice_ref: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  
  // GROUP CONTEXT
  tx_type: TransactionType;
  elimination_status: EliminationStatus;
  functional_cluster: FunctionalCluster;
  counterparty_entity?: string;
  
  // OBSERVABILITY
  risk_score: number;
  deviation?: number;
  
  // WHO
  requested_by: string;
  requestor_id: string;
  approved_by?: string;
  approver_id?: string;
  
  // WHEN
  created_at: string;
  due_date: string;
  approved_at?: string;
  
  // WHERE
  entity: string;
  cost_center: string;
  gl_account: string;
  
  // DOCUMENTS
  docs_attached: number;
  docs_required: number;
  manifests?: Manifest[];
  
  // GOVERNANCE
  policy_violation?: string;
  sod_warning?: boolean;
}

// ============================================================================
// 4. GOVERNANCE CONFIGURATION
// ============================================================================

export const PAYMENT_CONFIG = {
  // Approval thresholds by role
  approval_thresholds: {
    auto_approve: 500,
    manager_required: 5000,
    vp_required: 10000,
    cfo_required: 50000,
  },
  
  // Risk score boundaries
  risk_levels: {
    low: 30,
    medium: 60,
    high: 80,
  },
  
  // Document requirements by amount
  doc_requirements: {
    under_1000: { required: ['invoice'], optional: ['receipt'] },
    under_10000: { required: ['invoice', 'po'], optional: ['contract'] },
    over_10000: { required: ['invoice', 'po', 'contract'], optional: ['receipt'] },
  },
  
  // Segregation of Duties
  sod_rules: {
    self_approval_blocked: true,
    enforcement: 'warn' as const,
  },
  
  // Intercompany rules
  ic_rules: {
    require_elimination_match: true,
    block_unmatched_approval: true,
  },
  
  // Batch approval rules
  batch_rules: {
    require_zero_anomalies: true,
    block_ic_batch: true,
    max_batch_amount: 10000,
  },
  
  // Base configuration
  base_currency: 'USD',
  tenant: 'Acme Corporation',
} as const;

// ============================================================================
// 5. MOCK DATA - Realistic Payment Records
// ============================================================================

export const MOCK_PAYMENTS: Payment[] = [
  // --- HIGH RISK: External, High Value ---
  { 
    id: '1', 
    tx_id: 'PAY-8821', 
    beneficiary: 'Logistics Co. International', 
    invoice_ref: 'INV-2024-001',
    amount: 12500.00, 
    currency: 'USD',
    method: 'wire', 
    status: 'pending', 
    tx_type: 'external',
    elimination_status: 'n/a',
    functional_cluster: 'logistics',
    risk_score: 85, 
    deviation: 45.2,
    requested_by: 'Sarah Jenkins', 
    requestor_id: 'USR-001',
    created_at: '2024-03-10T09:00:00Z',
    due_date: '2024-03-15', 
    entity: 'Subsidiary A',
    cost_center: 'CC-901', 
    gl_account: '5000-20',
    docs_attached: 2,
    docs_required: 3,
    policy_violation: 'Amount > $10k requires VP approval',
    manifests: [
      { type: 'invoice', ref_id: 'INV-2024-001', label: 'Invoice_INV-2024-001.pdf', file_size: '1.2 MB' },
      { type: 'po', ref_id: 'PO-4422', label: 'PurchaseOrder_4422.pdf', file_size: '850 KB' },
    ],
  },
  
  // --- LOW RISK: External, Low Value, Approved ---
  { 
    id: '2', 
    tx_id: 'PAY-8822', 
    beneficiary: 'Office Supplies Inc', 
    invoice_ref: 'INV-OFF-99',
    amount: 340.50, 
    currency: 'USD',
    method: 'ach', 
    status: 'approved', 
    tx_type: 'external',
    elimination_status: 'n/a',
    functional_cluster: 'utilities',
    risk_score: 10, 
    deviation: -5.3,
    requested_by: 'Mike Ross', 
    requestor_id: 'USR-002',
    approved_by: 'Harvey Specter', 
    approver_id: 'USR-010',
    created_at: '2024-03-11T14:30:00Z',
    approved_at: '2024-03-11T16:00:00Z',
    due_date: '2024-03-20', 
    entity: 'HQ',
    cost_center: 'CC-101', 
    gl_account: '6000-10',
    docs_attached: 1,
    docs_required: 1,
    manifests: [
      { type: 'invoice', ref_id: 'INV-OFF-99', label: 'Invoice_OFF-99.pdf', file_size: '420 KB' },
    ],
  },
  
  // --- CRITICAL: External, Very High Value, New Vendor ---
  { 
    id: '3', 
    tx_id: 'PAY-8823', 
    beneficiary: 'Consulting Group LLC', 
    invoice_ref: 'CONS-Q1-FINAL',
    amount: 55000.00, 
    currency: 'USD',
    method: 'wire', 
    status: 'pending', 
    tx_type: 'external',
    elimination_status: 'n/a',
    functional_cluster: 'professional',
    risk_score: 92, 
    deviation: 120.5,
    requested_by: 'Jessica Pearson', 
    requestor_id: 'USR-003',
    created_at: '2024-03-12T10:15:00Z',
    due_date: '2024-03-25', 
    entity: 'Subsidiary B',
    cost_center: 'CC-001', 
    gl_account: '7000-50',
    docs_attached: 2,
    docs_required: 3,
    policy_violation: 'New Vendor + High Value',
    manifests: [
      { type: 'invoice', ref_id: 'CONS-Q1-FINAL', label: 'ConsultingQ1_Final.pdf', file_size: '2.1 MB' },
      { type: 'contract', ref_id: 'CON-110', label: 'ServiceAgreement_110.pdf', file_size: '1.8 MB' },
    ],
  },
  
  // --- LOW RISK: External, Recurring, Paid ---
  { 
    id: '4', 
    tx_id: 'PAY-8824', 
    beneficiary: 'Cloud Services Pro', 
    invoice_ref: 'CSP-MAR-24',
    amount: 2499.00, 
    currency: 'USD',
    method: 'card', 
    status: 'paid', 
    tx_type: 'external',
    elimination_status: 'n/a',
    functional_cluster: 'utilities',
    risk_score: 25, 
    deviation: 0,
    requested_by: 'Louis Litt', 
    requestor_id: 'USR-004',
    approved_by: 'Harvey Specter', 
    approver_id: 'USR-010',
    created_at: '2024-03-08T11:00:00Z',
    approved_at: '2024-03-08T14:30:00Z',
    due_date: '2024-03-12', 
    entity: 'HQ',
    cost_center: 'CC-200', 
    gl_account: '6500-30',
    docs_attached: 1,
    docs_required: 1,
    manifests: [
      { type: 'invoice', ref_id: 'CSP-MAR-24', label: 'CloudServices_Mar24.pdf', file_size: '380 KB' },
    ],
  },
  
  // --- MEDIUM RISK: External, Rejected ---
  { 
    id: '5', 
    tx_id: 'PAY-8825', 
    beneficiary: 'Marketing Agency XYZ', 
    invoice_ref: 'MKT-CAM-001',
    amount: 8750.00, 
    currency: 'USD',
    method: 'wire', 
    status: 'rejected', 
    tx_type: 'external',
    elimination_status: 'n/a',
    functional_cluster: 'professional',
    risk_score: 45, 
    deviation: 25.8,
    requested_by: 'Donna Paulsen', 
    requestor_id: 'USR-005',
    created_at: '2024-03-09T16:45:00Z',
    due_date: '2024-03-18', 
    entity: 'HQ',
    cost_center: 'CC-300', 
    gl_account: '7200-10',
    docs_attached: 1,
    docs_required: 2,
    policy_violation: 'Missing PO documentation',
    manifests: [
      { type: 'invoice', ref_id: 'MKT-CAM-001', label: 'Campaign_Invoice.pdf', file_size: '1.5 MB' },
    ],
  },
  
  // --- HIGH RISK: External, Legal, Pending ---
  { 
    id: '6', 
    tx_id: 'PAY-8826', 
    beneficiary: 'Legal Partners LLP', 
    invoice_ref: 'LEG-RET-2024',
    amount: 25000.00, 
    currency: 'USD',
    method: 'wire', 
    status: 'pending', 
    tx_type: 'external',
    elimination_status: 'n/a',
    functional_cluster: 'professional',
    risk_score: 60, 
    deviation: 0,
    requested_by: 'Rachel Zane', 
    requestor_id: 'USR-006',
    created_at: '2024-03-13T09:30:00Z',
    due_date: '2024-03-28', 
    entity: 'Subsidiary A',
    cost_center: 'CC-400', 
    gl_account: '7100-20',
    docs_attached: 2,
    docs_required: 3,
    policy_violation: 'Quarterly retainer - requires Finance Director approval',
    manifests: [
      { type: 'invoice', ref_id: 'LEG-RET-2024', label: 'Retainer_Q1_2024.pdf', file_size: '920 KB' },
      { type: 'contract', ref_id: 'CON-LEG-01', label: 'LegalServices_Agreement.pdf', file_size: '3.2 MB' },
    ],
  },
  
  // --- INTERCOMPANY: MATCHED ---
  { 
    id: '7', 
    tx_id: 'PAY-8827', 
    beneficiary: 'Acme Holdings (HQ)', 
    invoice_ref: 'IC-LOAN-001',
    amount: 150000.00, 
    currency: 'USD',
    method: 'wire', 
    status: 'pending', 
    tx_type: 'intercompany',
    elimination_status: 'matched',
    functional_cluster: 'intercompany',
    counterparty_entity: 'HQ',
    risk_score: 20, 
    deviation: 0,
    requested_by: 'Treasury Desk', 
    requestor_id: 'USR-TREAS',
    created_at: '2024-03-14T08:00:00Z',
    due_date: '2024-03-31', 
    entity: 'Subsidiary B',
    cost_center: 'CC-TREAS', 
    gl_account: '2300-10',
    docs_attached: 1,
    docs_required: 1,
    manifests: [
      { type: 'contract', ref_id: 'IC-LOAN-001', label: 'IC_Loan_Agreement.pdf', file_size: '500 KB' },
    ],
  },
  
  // --- INTERCOMPANY: UNMATCHED (BLOCKED) ---
  { 
    id: '8', 
    tx_id: 'PAY-8828', 
    beneficiary: 'Acme Asia Pacific', 
    invoice_ref: 'IC-MGMT-002',
    amount: 200000.00, 
    currency: 'USD',
    method: 'wire', 
    status: 'pending', 
    tx_type: 'intercompany',
    elimination_status: 'unmatched',
    functional_cluster: 'intercompany',
    counterparty_entity: 'Subsidiary C',
    risk_score: 95, 
    deviation: 0,
    requested_by: 'Group Controller', 
    requestor_id: 'USR-GC',
    created_at: '2024-03-13T15:00:00Z',
    due_date: '2024-03-20', 
    entity: 'Subsidiary A',
    cost_center: 'CC-IC', 
    gl_account: '2400-10',
    docs_attached: 0,
    docs_required: 1,
    policy_violation: 'Unilateral IC booking - no matching entry in counterparty',
    manifests: [],
  },
  
  // --- UTILITIES: Low risk, batch-ready ---
  { 
    id: '9', 
    tx_id: 'PAY-8829', 
    beneficiary: 'City Power & Light', 
    invoice_ref: 'UTIL-MAR-001',
    amount: 1250.00, 
    currency: 'USD',
    method: 'ach', 
    status: 'pending', 
    tx_type: 'external',
    elimination_status: 'n/a',
    functional_cluster: 'utilities',
    risk_score: 5, 
    deviation: -2.1,
    requested_by: 'Facilities Team', 
    requestor_id: 'USR-FAC',
    created_at: '2024-03-14T10:00:00Z',
    due_date: '2024-03-25', 
    entity: 'HQ',
    cost_center: 'CC-FAC', 
    gl_account: '6100-10',
    docs_attached: 1,
    docs_required: 1,
    manifests: [
      { type: 'invoice', ref_id: 'UTIL-MAR-001', label: 'PowerBill_Mar.pdf', file_size: '200 KB' },
    ],
  },
  
  // --- UTILITIES: Low risk, batch-ready ---
  { 
    id: '10', 
    tx_id: 'PAY-8830', 
    beneficiary: 'Metro Water Authority', 
    invoice_ref: 'UTIL-MAR-002',
    amount: 480.00, 
    currency: 'USD',
    method: 'ach', 
    status: 'pending', 
    tx_type: 'external',
    elimination_status: 'n/a',
    functional_cluster: 'utilities',
    risk_score: 5, 
    deviation: 0,
    requested_by: 'Facilities Team', 
    requestor_id: 'USR-FAC',
    created_at: '2024-03-14T10:05:00Z',
    due_date: '2024-03-25', 
    entity: 'HQ',
    cost_center: 'CC-FAC', 
    gl_account: '6100-20',
    docs_attached: 1,
    docs_required: 1,
    manifests: [
      { type: 'invoice', ref_id: 'UTIL-MAR-002', label: 'WaterBill_Mar.pdf', file_size: '180 KB' },
    ],
  },
  
  // --- LOGISTICS: Medium risk, anomaly ---
  { 
    id: '11', 
    tx_id: 'PAY-8831', 
    beneficiary: 'Fast Freight Inc', 
    invoice_ref: 'FF-2024-099',
    amount: 18500.00, 
    currency: 'USD',
    method: 'wire', 
    status: 'pending', 
    tx_type: 'external',
    elimination_status: 'n/a',
    functional_cluster: 'logistics',
    risk_score: 72, 
    deviation: 85.3,
    requested_by: 'Warehouse Ops', 
    requestor_id: 'USR-WH',
    created_at: '2024-03-13T14:00:00Z',
    due_date: '2024-03-22', 
    entity: 'Subsidiary A',
    cost_center: 'CC-WH', 
    gl_account: '5000-30',
    docs_attached: 1,
    docs_required: 2,
    policy_violation: '85% above historical average for this vendor',
    manifests: [
      { type: 'invoice', ref_id: 'FF-2024-099', label: 'Freight_Invoice.pdf', file_size: '1.1 MB' },
    ],
  },
  
  // --- DRAFT: Not yet submitted ---
  { 
    id: '12', 
    tx_id: 'PAY-8832', 
    beneficiary: 'Tech Hardware Co', 
    invoice_ref: 'THC-Q1-001',
    amount: 4200.00, 
    currency: 'USD',
    method: 'card', 
    status: 'draft', 
    tx_type: 'external',
    elimination_status: 'n/a',
    functional_cluster: 'other',
    risk_score: 15, 
    deviation: 0,
    requested_by: 'IT Department', 
    requestor_id: 'USR-IT',
    created_at: '2024-03-14T16:00:00Z',
    due_date: '2024-04-01', 
    entity: 'HQ',
    cost_center: 'CC-IT', 
    gl_account: '6500-10',
    docs_attached: 0,
    docs_required: 2,
    manifests: [],
  },
];

// ============================================================================
// 6. HELPER FUNCTIONS
// ============================================================================

/**
 * Get payments filtered by status
 */
export function getPaymentsByStatus(status: PaymentStatus): Payment[] {
  return MOCK_PAYMENTS.filter(p => p.status === status);
}

/**
 * Get payments filtered by entity
 */
export function getPaymentsByEntity(entity: string): Payment[] {
  return MOCK_PAYMENTS.filter(p => p.entity === entity);
}

/**
 * Get payments filtered by functional cluster
 */
export function getPaymentsByCluster(cluster: FunctionalCluster): Payment[] {
  return MOCK_PAYMENTS.filter(p => p.functional_cluster === cluster);
}

/**
 * Aggregate payments into functional clusters
 */
export function aggregateFunctionalClusters() {
  const clusters = ['utilities', 'logistics', 'professional', 'intercompany', 'other'] as const;
  
  return clusters.map(cluster => {
    const payments = MOCK_PAYMENTS.filter(p => 
      p.functional_cluster === cluster && 
      p.status === 'pending'
    );
    
    const anomalies = payments.filter(p => p.risk_score > 50).length;
    const hasUnmatchedIC = payments.some(p => 
      p.tx_type === 'intercompany' && 
      p.elimination_status === 'unmatched'
    );
    
    return {
      cluster_id: cluster,
      cluster_name: cluster.charAt(0).toUpperCase() + cluster.slice(1),
      invoice_count: payments.length,
      total_amount: payments.reduce((sum, p) => sum + p.amount, 0),
      anomaly_count: anomalies,
      status: hasUnmatchedIC ? 'blocked' : anomalies > 0 ? 'anomalies' : 'clean',
      can_batch_approve: anomalies === 0 && !hasUnmatchedIC && cluster !== 'intercompany',
    };
  });
}

