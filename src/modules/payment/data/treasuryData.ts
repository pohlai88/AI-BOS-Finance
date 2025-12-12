// ============================================================================
// SCH_PAY_02: TREASURY CONTEXT SCHEMA
// Solves the "100 Logins Problem" without backend integration
// ============================================================================
// PURPOSE: Group CFO needs to see subsidiary liquidity at a glance
// without logging into 15 different bank portals.
//
// MVP: Mock data that demonstrates the UX pattern
// Phase 2+: Backend integration with bank APIs / Treasury Management System
// ============================================================================

// ============================================================================
// 1. TREASURY CONTEXT TYPE
// ============================================================================

export type CashStatus = 'healthy' | 'low' | 'critical'
export type ICStatus = 'lender' | 'borrower' | 'balanced'

export interface TreasuryContext {
  // Identity
  entity_id: string
  entity_name: string
  entity_code: string

  // Bank Info
  bank_name: string
  bank_account_masked: string
  bank_country: string

  // Liquidity Position
  cash_balance: number
  cash_currency: string
  cash_status: CashStatus

  // Budget Performance
  budget_allocated: number
  budget_used: number
  budget_used_pct: number

  // Runway
  avg_monthly_burn: number
  runway_months: number

  // Intercompany Position
  ic_receivable: number // What other entities owe us
  ic_payable: number // What we owe other entities
  ic_net_position: number // Positive = Net Lender, Negative = Net Borrower
  ic_status: ICStatus

  // Pending Actions
  pending_payments_count: number
  pending_payments_amount: number
  pending_approvals_count: number

  // Last Updated
  last_sync: string
}

// ============================================================================
// 2. MOCK TREASURY DATA
// ============================================================================

export const TREASURY_DATA: Record<string, TreasuryContext> = {
  hq: {
    entity_id: 'hq',
    entity_name: 'Acme Holdings (HQ)',
    entity_code: 'ACME-HQ',

    bank_name: 'Chase',
    bank_account_masked: '****4821',
    bank_country: 'US',

    cash_balance: 1250000,
    cash_currency: 'USD',
    cash_status: 'healthy',

    budget_allocated: 2000000,
    budget_used: 900000,
    budget_used_pct: 0.45,

    avg_monthly_burn: 150000,
    runway_months: 8.3,

    ic_receivable: 350000,
    ic_payable: 150000,
    ic_net_position: 200000,
    ic_status: 'lender',

    pending_payments_count: 3,
    pending_payments_amount: 67840,
    pending_approvals_count: 2,

    last_sync: '2024-03-14T16:30:00Z',
  },

  sub_a: {
    entity_id: 'sub_a',
    entity_name: 'Acme Americas',
    entity_code: 'ACME-AM',

    bank_name: 'Bank of America',
    bank_account_masked: '****7732',
    bank_country: 'US',

    cash_balance: 580000,
    cash_currency: 'USD',
    cash_status: 'healthy',

    budget_allocated: 800000,
    budget_used: 576000,
    budget_used_pct: 0.72,

    avg_monthly_burn: 120000,
    runway_months: 4.8,

    ic_receivable: 50000,
    ic_payable: 200000,
    ic_net_position: -150000,
    ic_status: 'borrower',

    pending_payments_count: 5,
    pending_payments_amount: 256000,
    pending_approvals_count: 4,

    last_sync: '2024-03-14T16:25:00Z',
  },

  sub_b: {
    entity_id: 'sub_b',
    entity_name: 'Acme Europe',
    entity_code: 'ACME-EU',

    bank_name: 'Barclays',
    bank_account_masked: '****9921',
    bank_country: 'UK',

    cash_balance: 45000,
    cash_currency: 'USD',
    cash_status: 'critical', // ⚠️ DISTRESSED ENTITY

    budget_allocated: 500000,
    budget_used: 520000,
    budget_used_pct: 1.04, // Over budget!

    avg_monthly_burn: 60000,
    runway_months: 0.75, // Less than 1 month!

    ic_receivable: 0,
    ic_payable: 200000,
    ic_net_position: -200000,
    ic_status: 'borrower',

    pending_payments_count: 2,
    pending_payments_amount: 255000,
    pending_approvals_count: 2,

    last_sync: '2024-03-14T16:20:00Z',
  },

  sub_c: {
    entity_id: 'sub_c',
    entity_name: 'Acme Asia Pacific',
    entity_code: 'ACME-AP',

    bank_name: 'HSBC',
    bank_account_masked: '****3312',
    bank_country: 'SG',

    cash_balance: 420000,
    cash_currency: 'USD',
    cash_status: 'healthy',

    budget_allocated: 600000,
    budget_used: 360000,
    budget_used_pct: 0.6,

    avg_monthly_burn: 80000,
    runway_months: 5.25,

    ic_receivable: 150000,
    ic_payable: 150000,
    ic_net_position: 0,
    ic_status: 'balanced',

    pending_payments_count: 1,
    pending_payments_amount: 8500,
    pending_approvals_count: 0,

    last_sync: '2024-03-14T16:15:00Z',
  },
}

// ============================================================================
// 3. ENTITY LIST (for dropdown selector)
// ============================================================================

export interface EntityOption {
  id: string
  name: string
  code: string
  cash_status: CashStatus
}

export const ENTITY_OPTIONS: EntityOption[] = Object.values(TREASURY_DATA).map(
  (t) => ({
    id: t.entity_id,
    name: t.entity_name,
    code: t.entity_code,
    cash_status: t.cash_status,
  })
)

// ============================================================================
// 4. HELPER FUNCTIONS
// ============================================================================

/**
 * Get treasury context for a specific entity
 */
export function getTreasuryContext(entityId: string): TreasuryContext | null {
  return TREASURY_DATA[entityId] || null
}

/**
 * Get all entities with critical cash status
 */
export function getDistressedEntities(): TreasuryContext[] {
  return Object.values(TREASURY_DATA).filter(
    (t) => t.cash_status === 'critical'
  )
}

/**
 * Get all entities that are net borrowers
 */
export function getNetBorrowers(): TreasuryContext[] {
  return Object.values(TREASURY_DATA).filter((t) => t.ic_status === 'borrower')
}

/**
 * Calculate group-level aggregates
 */
export function getGroupTreasurySummary() {
  const entities = Object.values(TREASURY_DATA)

  return {
    total_cash: entities.reduce((sum, e) => sum + e.cash_balance, 0),
    total_pending_payments: entities.reduce(
      (sum, e) => sum + e.pending_payments_amount,
      0
    ),
    total_pending_count: entities.reduce(
      (sum, e) => sum + e.pending_payments_count,
      0
    ),
    entities_critical: entities.filter((e) => e.cash_status === 'critical')
      .length,
    entities_over_budget: entities.filter((e) => e.budget_used_pct > 1).length,
    net_ic_position: entities.reduce((sum, e) => sum + e.ic_net_position, 0),
  }
}

/**
 * Check if entity can afford a payment
 */
export function canAffordPayment(
  entityId: string,
  amount: number
): {
  canAfford: boolean
  remaining: number
  warning?: string
} {
  const context = TREASURY_DATA[entityId]
  if (!context) {
    return { canAfford: false, remaining: 0, warning: 'Entity not found' }
  }

  const remaining = context.cash_balance - amount
  const canAfford = remaining > 0

  let warning: string | undefined
  if (!canAfford) {
    warning = `Insufficient funds. Would require additional $${Math.abs(remaining).toLocaleString()}`
  } else if (remaining < context.avg_monthly_burn) {
    warning = `Payment would leave less than 1 month runway`
  } else if (context.cash_status === 'critical') {
    warning = `Entity is in critical cash status. Consider IC funding first.`
  }

  return { canAfford, remaining, warning }
}

// ============================================================================
// 5. INTERCOMPANY MATRIX (for settlement view)
// ============================================================================

export interface ICPosition {
  from_entity: string
  to_entity: string
  amount: number
  status: 'matched' | 'unmatched' | 'pending_settlement'
  loan_ref?: string
}

export const IC_POSITIONS: ICPosition[] = [
  {
    from_entity: 'sub_b',
    to_entity: 'hq',
    amount: 200000,
    status: 'pending_settlement',
    loan_ref: 'LN-2024-001',
  },
  {
    from_entity: 'sub_a',
    to_entity: 'hq',
    amount: 150000,
    status: 'matched',
    loan_ref: 'LN-2024-002',
  },
  {
    from_entity: 'sub_c',
    to_entity: 'sub_a',
    amount: 50000,
    status: 'unmatched', // Needs resolution
  },
]

/**
 * Get IC positions for a specific entity
 */
export function getICPositionsForEntity(entityId: string): {
  payables: ICPosition[]
  receivables: ICPosition[]
} {
  return {
    payables: IC_POSITIONS.filter((p) => p.from_entity === entityId),
    receivables: IC_POSITIONS.filter((p) => p.to_entity === entityId),
  }
}
