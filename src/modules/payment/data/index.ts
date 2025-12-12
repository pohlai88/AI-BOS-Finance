// ============================================================================
// PAYMENT MODULE - DATA LAYER
// Schemas, types, and mock data for the Payment Hub
// ============================================================================

// Schema & Types
export {
  PAYMENT_SCHEMA,
  PAYMENT_EXTENDED_FIELDS,
  PAYMENT_CONFIG,
  type Payment,
  type PaymentStatus,
  type PaymentMethod,
  type TransactionType,
  type EliminationStatus,
  type FunctionalCluster,
  type Manifest,
} from './paymentSchema'

// Mock Data
export {
  MOCK_PAYMENTS,
  getPaymentsByStatus,
  getPaymentsByEntity,
  getPaymentsByCluster,
  aggregateFunctionalClusters,
} from './paymentSchema'

// Treasury Context
export {
  TREASURY_DATA,
  ENTITY_OPTIONS,
  IC_POSITIONS,
  type TreasuryContext,
  type CashStatus,
  type ICStatus,
  type EntityOption,
  type ICPosition,
  getTreasuryContext,
  getDistressedEntities,
  getNetBorrowers,
  getGroupTreasurySummary,
  canAffordPayment,
  getICPositionsForEntity,
} from './treasuryData'
