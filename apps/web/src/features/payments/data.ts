/**
 * Payment Data & Configuration
 * Mock data and configuration constants for payment features
 * 
 * @note This file was recreated after legacy payment feature removal
 * TODO: Move to proper config/schema location or API
 */

// ============================================================================
// TYPES
// ============================================================================

export interface Payment {
  id: string;
  paymentNumber: string;
  vendorName: string;
  amount: number;
  currency: string;
  paymentDate: string;
  dueDate?: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'failed';
  risk_score?: number;
  entity?: string;
  tx_type?: 'intercompany' | 'external';
  createdBy?: string;
  version?: number;
}

export interface FunctionalCluster {
  id: string;
  name: string;
  payments: Payment[];
  totalAmount: number;
  riskLevel: 'low' | 'medium' | 'high';
  anomalyCount: number;
}

export interface ICPosition {
  id: string;
  from_entity: string;
  to_entity: string;
  amount: number;
  currency: string;
  status: 'pending' | 'matched' | 'settled';
}

export interface Manifest {
  id: string;
  type: string;
  url?: string;
  status: 'pending' | 'verified' | 'rejected';
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export const PAYMENT_CONFIG = {
  approval_thresholds: {
    low: 1000,
    medium: 10000,
    high: 50000,
  },
  risk_levels: {
    low: 30,
    medium: 60,
    high: 90,
  },
  batch_rules: {
    max_amount: 100000,
    max_anomalies: 0,
    require_ic_settlement: true,
  },
  ic_rules: {
    require_matching: true,
    auto_settle: false,
  },
  doc_requirements: {
    invoice: { required: true, verify: true },
    po: { required: false, verify: false },
    receipt: { required: false, verify: false },
  },
  sod_rules: {
    creator_cannot_approve: true,
    require_dual_approval: false,
  },
} as const;

// ============================================================================
// MOCK DATA
// ============================================================================

export const MOCK_PAYMENTS: Payment[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    paymentNumber: 'PAY-2024-0001',
    vendorName: 'Acme Corp',
    amount: 15000.00,
    currency: 'USD',
    paymentDate: '2024-12-20',
    dueDate: '2024-12-25',
    status: 'pending',
    risk_score: 45,
    createdBy: 'user-001',
    version: 1,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    paymentNumber: 'PAY-2024-0002',
    vendorName: 'GlobalTech Ltd',
    amount: 8500.50,
    currency: 'EUR',
    paymentDate: '2024-12-18',
    dueDate: '2024-12-22',
    status: 'approved',
    risk_score: 25,
    createdBy: 'user-002',
    version: 1,
  },
];

export const IC_POSITIONS: ICPosition[] = [
  {
    id: 'ic-001',
    from_entity: 'ENTITY_A',
    to_entity: 'ENTITY_B',
    amount: 5000,
    currency: 'USD',
    status: 'pending',
  },
];

// ============================================================================
// UTILITIES
// ============================================================================

export function aggregateFunctionalClusters(): FunctionalCluster[] {
  // Group payments by functional area
  const clusters: Record<string, Payment[]> = {};

  MOCK_PAYMENTS.forEach(payment => {
    const cluster = payment.vendorName.split(' ')[0]; // Simple grouping
    if (!clusters[cluster]) {
      clusters[cluster] = [];
    }
    clusters[cluster].push(payment);
  });

  return Object.entries(clusters).map(([name, payments]) => ({
    id: `cluster-${name}`,
    name,
    payments,
    totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
    riskLevel: payments.some(p => (p.risk_score || 0) > 60) ? 'high' :
      payments.some(p => (p.risk_score || 0) > 30) ? 'medium' : 'low',
    anomalyCount: payments.filter(p => (p.risk_score || 0) > PAYMENT_CONFIG.risk_levels.medium).length,
  }));
}
