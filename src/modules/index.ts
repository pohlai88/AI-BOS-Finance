// ============================================================================
// NEXUSCANON MODULES
// Business modules powered by the Kernel architecture
// ============================================================================

// Inventory Module (INV)
export { INV01Dashboard } from './inventory';

// System Module (SYS)
export { SYS01Bootloader } from './system';

// Payment Module (PAY) - DOC_PAY_01
export {
  // Page
  PAY01PaymentHub,
  
  // Schema
  PAYMENT_SCHEMA,
  PAYMENT_EXTENDED_FIELDS,
  PAYMENT_CONFIG,
  
  // Types
  type Payment,
  type PaymentStatus,
  type PaymentMethod,
  type TransactionType,
  type EliminationStatus,
  type FunctionalCluster,
  type Manifest,
  
  // Mock Data
  MOCK_PAYMENTS,
  getPaymentsByStatus,
  getPaymentsByEntity,
  getPaymentsByCluster,
  aggregateFunctionalClusters,
  
  // Treasury
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
} from './payment';

