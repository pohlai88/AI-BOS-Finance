/**
 * GL Posting Port
 * 
 * Interface for General Ledger posting operations.
 * Used by AP-05 to create journal entries on payment completion.
 * 
 * Anti-Gravity: This is a PORT, not an adapter.
 * It defines WHAT we need, not HOW it's implemented.
 */

// ============================================================================
// 1. TYPES
// ============================================================================

import type { TransactionContext } from './paymentRepositoryPort';

/**
 * GL posting input for payment
 */
export interface PaymentPostingInput {
  /** Payment ID */
  paymentId: string;
  /** Tenant ID */
  tenantId: string;
  /** Company ID */
  companyId: string;
  /** Amount in functional currency */
  amount: string;
  /** Functional currency code */
  currency: string;
  /** Payment date */
  paymentDate: Date;
  /** Bank confirmation reference */
  bankConfirmationRef: string;
  /** Vendor ID (for AP account lookup) */
  vendorId?: string;
  /** Bank account ID (for cash account lookup) */
  bankAccountId?: string;
}

/**
 * GL posting result
 */
export interface GLPostingResult {
  /** Journal header ID */
  journalHeaderId: string;
  /** Journal number */
  journalNumber: string;
  /** Posting date */
  postingDate: Date;
  /** Journal lines created */
  lines: GLJournalLine[];
  /** Status */
  status: 'posted' | 'pending';
}

/**
 * GL journal line
 */
export interface GLJournalLine {
  /** Line ID */
  id: string;
  /** Account code */
  accountCode: string;
  /** Account name */
  accountName: string;
  /** Debit amount (string) */
  debit?: string;
  /** Credit amount (string) */
  credit?: string;
  /** Currency */
  currency: string;
  /** Description */
  description?: string;
}

/**
 * Reversal input
 */
export interface PaymentReversalInput {
  /** Original journal header ID */
  originalJournalHeaderId: string;
  /** Tenant ID */
  tenantId: string;
  /** Company ID */
  companyId: string;
  /** Reversal date */
  reversalDate: Date;
  /** Reason for reversal */
  reason: string;
  /** Payment ID being reversed */
  paymentId: string;
}

// ============================================================================
// 2. PORT INTERFACE
// ============================================================================

/**
 * GL Posting Port for AP-05 Payment Execution
 * 
 * ENTERPRISE REQUIREMENT: GL entries are created on payment completion (bank-confirmed).
 * If payment fails after GL posting, reversal policy must be defined.
 * 
 * Standard AP Payment Posting:
 * - Dr: Accounts Payable (decrease liability)
 * - Cr: Cash/Bank (decrease asset)
 */
export interface GLPostingPort {
  /**
   * Create GL posting for a completed payment
   * 
   * @param input - Payment posting details
   * @param txContext - Transaction context (same transaction as payment update)
   * @returns GL posting result with journal header ID
   * 
   * Business Rules:
   * - GL posting MUST be in same transaction as payment completion
   * - If GL posting fails, payment completion MUST rollback
   * - Journal is created with status 'posted' (already bank-confirmed)
   */
  createPaymentPosting(
    input: PaymentPostingInput,
    txContext: TransactionContext
  ): Promise<GLPostingResult>;

  /**
   * Create reversal posting
   * 
   * @param input - Reversal details
   * @param txContext - Transaction context
   * @returns Reversal journal result
   * 
   * Business Rules:
   * - Reversals create a new journal that negates original
   * - Original journal is linked to reversal
   * - Reversal reason is captured for audit
   */
  createReversalPosting(
    input: PaymentReversalInput,
    txContext: TransactionContext
  ): Promise<GLPostingResult>;

  /**
   * Get GL posting for a payment
   * 
   * @param paymentId - Payment ID
   * @param tenantId - Tenant ID
   * @returns GL posting result or null if not posted
   */
  getPostingByPaymentId(
    paymentId: string,
    tenantId: string
  ): Promise<GLPostingResult | null>;
}
