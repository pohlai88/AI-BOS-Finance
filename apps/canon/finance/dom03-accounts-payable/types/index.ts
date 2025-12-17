/**
 * AP Molecule Types
 * 
 * Shared types for the Accounts Payable molecule.
 */

import type { ActorContext } from '@aibos/canon-governance';

// ============================================================================
// 1. MOLECULE CONTEXT
// ============================================================================

/**
 * AP Molecule Context - Shared context for all AP cells
 */
export interface APMoleculeContext {
  tenantId: string;
  companyId: string;
  fiscalPeriod: string;
  actor: ActorContext;
}

// ============================================================================
// 2. VENDOR TYPES
// ============================================================================

/**
 * Vendor Reference - Minimal vendor info for payments
 */
export interface VendorRef {
  vendorId: string;
  vendorName: string;
  bankAccount?: BankAccountRef;
}

/**
 * Bank Account Reference - For payment execution
 */
export interface BankAccountRef {
  accountNumber: string;
  routingNumber?: string;
  bankName: string;
  accountName: string;
  swiftCode?: string;
}

// ============================================================================
// 3. BENEFICIARY SNAPSHOT
// ============================================================================

/**
 * Beneficiary Snapshot - Captured at execution time for audit
 */
export interface BeneficiarySnapshot {
  accountNumber: string;
  routingNumber?: string;
  bankName: string;
  accountName: string;
  swiftCode?: string;
}

// ============================================================================
// 4. RESULT TYPES
// ============================================================================

/**
 * Base result type for operations
 */
export interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// ============================================================================
// 5. EXPORTS
// ============================================================================

export type {
  ActorContext,
};
