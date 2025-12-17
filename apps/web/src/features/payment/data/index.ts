/**
 * Payment Data Module
 * 
 * Mock data and configuration for payment features.
 * In production, this would be fetched from the backend API.
 */

// ============================================================================
// TYPES
// ============================================================================

export type FunctionalCluster = 
  | 'utilities' 
  | 'logistics' 
  | 'professional' 
  | 'intercompany' 
  | 'other';

export type PaymentStatus = 
  | 'draft' 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'processing' 
  | 'completed' 
  | 'failed';

export type TransactionType = 
  | 'standard' 
  | 'intercompany' 
  | 'recurring';

export interface Payment {
  id: string;
  tx_id: string;
  vendor_name: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  functional_cluster: FunctionalCluster;
  tx_type: TransactionType;
  risk_score: number;
  due_date: string;
  created_at: string;
  // IC-specific fields
  entity?: string;
  counterparty_entity?: string;
  elimination_status?: 'matched' | 'unmatched' | 'pending';
}

export interface ICPosition {
  id: string;
  from_entity: string;
  to_entity: string;
  amount: number;
  currency: string;
  loan_ref?: string;
  status: 'open' | 'settled' | 'netting';
}

export interface ClusterAggregate {
  cluster_id: FunctionalCluster;
  cluster_name: string;
  invoice_count: number;
  total_amount: number;
  anomaly_count: number;
  status: 'clean' | 'anomalies' | 'blocked';
  can_batch_approve: boolean;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export const PAYMENT_CONFIG = {
  batch_rules: {
    require_zero_anomalies: true,
    block_ic_batch: true,
    max_batch_amount: 50000,
  },
  risk_levels: {
    low: 30,
    medium: 60,
    high: 80,
  },
  approval_thresholds: {
    manager: 25000,
    director: 50000,
    vp: 100000,
    cfo: Infinity,
  },
  ic_rules: {
    require_elimination_match: true,
    allow_netting: true,
    max_unmatched_days: 30,
  },
};

// ============================================================================
// IC POSITIONS (Intercompany)
// ============================================================================

export const IC_POSITIONS: ICPosition[] = [
  {
    id: 'ic-1',
    from_entity: 'HQ',
    to_entity: 'SUB_A',
    amount: 150000,
    currency: 'USD',
    loan_ref: 'IC-LOAN-2024-001',
    status: 'open',
  },
  {
    id: 'ic-2',
    from_entity: 'HQ',
    to_entity: 'SUB_B',
    amount: 200000,
    currency: 'USD',
    loan_ref: 'IC-LOAN-2024-002',
    status: 'open',
  },
  {
    id: 'ic-3',
    from_entity: 'SUB_A',
    to_entity: 'SUB_C',
    amount: 50000,
    currency: 'USD',
    status: 'netting',
  },
];

// ============================================================================
// MOCK DATA
// ============================================================================

export const MOCK_PAYMENTS: Payment[] = [
  {
    id: '1',
    tx_id: 'PAY-2024-0001',
    vendor_name: 'Electric Co',
    amount: 2500.00,
    currency: 'USD',
    status: 'pending',
    functional_cluster: 'utilities',
    tx_type: 'recurring',
    risk_score: 15,
    due_date: '2024-12-25',
    created_at: '2024-12-17',
  },
  {
    id: '2',
    tx_id: 'PAY-2024-0002',
    vendor_name: 'Water Corp',
    amount: 1200.00,
    currency: 'USD',
    status: 'pending',
    functional_cluster: 'utilities',
    tx_type: 'recurring',
    risk_score: 10,
    due_date: '2024-12-26',
    created_at: '2024-12-17',
  },
  {
    id: '3',
    tx_id: 'PAY-2024-0003',
    vendor_name: 'FastShip Logistics',
    amount: 8500.00,
    currency: 'USD',
    status: 'pending',
    functional_cluster: 'logistics',
    tx_type: 'standard',
    risk_score: 25,
    due_date: '2024-12-22',
    created_at: '2024-12-17',
  },
  {
    id: '4',
    tx_id: 'PAY-2024-0004',
    vendor_name: 'Legal Partners LLP',
    amount: 15000.00,
    currency: 'USD',
    status: 'pending',
    functional_cluster: 'professional',
    tx_type: 'standard',
    risk_score: 45,
    due_date: '2024-12-28',
    created_at: '2024-12-17',
  },
  {
    id: '5',
    tx_id: 'PAY-2024-0005',
    vendor_name: 'Subsidiary A',
    amount: 50000.00,
    currency: 'USD',
    status: 'pending',
    functional_cluster: 'intercompany',
    tx_type: 'intercompany',
    risk_score: 20,
    due_date: '2024-12-30',
    created_at: '2024-12-17',
    entity: 'HQ',
    counterparty_entity: 'SUB_A',
    elimination_status: 'matched',
  },
  {
    id: '6',
    tx_id: 'PAY-2024-0006',
    vendor_name: 'Unknown Vendor',
    amount: 75000.00,
    currency: 'USD',
    status: 'pending',
    functional_cluster: 'other',
    tx_type: 'standard',
    risk_score: 85,
    due_date: '2024-12-20',
    created_at: '2024-12-17',
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const CLUSTER_NAMES: Record<FunctionalCluster, string> = {
  utilities: 'Utilities',
  logistics: 'Logistics & Freight',
  professional: 'Professional Services',
  intercompany: 'Intercompany',
  other: 'Other',
};

export function aggregateFunctionalClusters(
  payments: Payment[] = MOCK_PAYMENTS
): ClusterAggregate[] {
  const clusters: FunctionalCluster[] = ['utilities', 'logistics', 'professional', 'intercompany', 'other'];
  
  return clusters.map(clusterId => {
    const clusterPayments = payments.filter(
      p => p.functional_cluster === clusterId && p.status === 'pending'
    );
    
    const anomalyCount = clusterPayments.filter(
      p => p.risk_score > PAYMENT_CONFIG.risk_levels.medium
    ).length;
    
    const hasIC = clusterId === 'intercompany';
    const hasHighValue = clusterPayments.some(
      p => p.amount > PAYMENT_CONFIG.batch_rules.max_batch_amount
    );
    
    const canBatchApprove = 
      clusterPayments.length > 0 &&
      anomalyCount === 0 &&
      !hasIC &&
      !hasHighValue;
    
    const status: ClusterAggregate['status'] = 
      hasIC ? 'blocked' :
      anomalyCount > 0 ? 'anomalies' :
      'clean';
    
    return {
      cluster_id: clusterId,
      cluster_name: CLUSTER_NAMES[clusterId],
      invoice_count: clusterPayments.length,
      total_amount: clusterPayments.reduce((sum, p) => sum + p.amount, 0),
      anomaly_count: anomalyCount,
      status,
      can_batch_approve: canBatchApprove,
    };
  }).filter(c => c.invoice_count > 0);
}

// ============================================================================
// TREASURY DATA (for TreasuryHeader component)
// ============================================================================

export interface TreasuryContext {
  entity_id: string;
  entity_name: string;
  bank_name: string;
  bank_account_masked: string;
  cash_balance: number;
  cash_status: 'healthy' | 'low' | 'critical';
  budget_used_pct: number;
  ic_net_position: number;
  ic_status: 'lender' | 'borrower' | 'balanced';
  runway_months: number;
  pending_payments_count: number;
  pending_payments_amount: number;
  last_sync: string;
}

export interface EntityOption {
  id: string;
  name: string;
  code: string;
  cash_status: 'healthy' | 'low' | 'critical';
}

export const ENTITY_OPTIONS: EntityOption[] = [
  { id: 'HQ', name: 'HQ Holdings', code: 'HQ-001', cash_status: 'healthy' },
  { id: 'SUB_A', name: 'Subsidiary A', code: 'SUB-A', cash_status: 'healthy' },
  { id: 'SUB_B', name: 'Subsidiary B', code: 'SUB-B', cash_status: 'low' },
  { id: 'SUB_C', name: 'Subsidiary C', code: 'SUB-C', cash_status: 'critical' },
];

export const TREASURY_DATA: Record<string, TreasuryContext> = {
  HQ: {
    entity_id: 'HQ',
    entity_name: 'HQ Holdings',
    bank_name: 'Chase Bank',
    bank_account_masked: '****4521',
    cash_balance: 2500000,
    cash_status: 'healthy',
    budget_used_pct: 0.72,
    ic_net_position: 500000,
    ic_status: 'lender',
    runway_months: 8.5,
    pending_payments_count: 12,
    pending_payments_amount: 145000,
    last_sync: new Date().toISOString(),
  },
  SUB_A: {
    entity_id: 'SUB_A',
    entity_name: 'Subsidiary A',
    bank_name: 'Bank of America',
    bank_account_masked: '****7832',
    cash_balance: 850000,
    cash_status: 'healthy',
    budget_used_pct: 0.65,
    ic_net_position: -150000,
    ic_status: 'borrower',
    runway_months: 5.2,
    pending_payments_count: 8,
    pending_payments_amount: 67000,
    last_sync: new Date().toISOString(),
  },
  SUB_B: {
    entity_id: 'SUB_B',
    entity_name: 'Subsidiary B',
    bank_name: 'Wells Fargo',
    bank_account_masked: '****1234',
    cash_balance: 120000,
    cash_status: 'low',
    budget_used_pct: 0.92,
    ic_net_position: -200000,
    ic_status: 'borrower',
    runway_months: 2.1,
    pending_payments_count: 5,
    pending_payments_amount: 45000,
    last_sync: new Date().toISOString(),
  },
  SUB_C: {
    entity_id: 'SUB_C',
    entity_name: 'Subsidiary C',
    bank_name: 'Citibank',
    bank_account_masked: '****9876',
    cash_balance: 25000,
    cash_status: 'critical',
    budget_used_pct: 1.15,
    ic_net_position: -150000,
    ic_status: 'borrower',
    runway_months: 0.5,
    pending_payments_count: 3,
    pending_payments_amount: 28000,
    last_sync: new Date().toISOString(),
  },
};
