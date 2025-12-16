/**
 * GL Posting Adapter - In-Memory Implementation
 * 
 * Mock implementation for development and testing.
 * Simulates GL journal creation for payment postings.
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  GLPostingPort,
  PaymentPostingInput,
  PaymentReversalInput,
  GLPostingResult,
  TransactionContext,
} from '@aibos/kernel-core';

// ============================================================================
// 1. IN-MEMORY STORES
// ============================================================================

interface StoredJournal {
  journalHeaderId: string;
  journalNumber: string;
  paymentId: string;
  tenantId: string;
  companyId: string;
  postingDate: Date;
  status: 'posted' | 'pending';
  lines: {
    id: string;
    accountCode: string;
    accountName: string;
    debit?: string;
    credit?: string;
    currency: string;
    description?: string;
  }[];
  isReversal: boolean;
  originalJournalId?: string;
  reversedByJournalId?: string;
}

const journals = new Map<string, StoredJournal>();
const journalNumbers = new Map<string, number>(); // tenant -> sequence

// ============================================================================
// 2. HELPER FUNCTIONS
// ============================================================================

function generateJournalNumber(tenantId: string): string {
  const current = journalNumbers.get(tenantId) || 0;
  const next = current + 1;
  journalNumbers.set(tenantId, next);
  return `JE-${new Date().getFullYear()}-${String(next).padStart(6, '0')}`;
}

// ============================================================================
// 3. ADAPTER IMPLEMENTATION
// ============================================================================

export function createMemoryGLPostingAdapter(): GLPostingPort {
  return {
    async createPaymentPosting(
      input: PaymentPostingInput,
      _txContext: TransactionContext
    ): Promise<GLPostingResult> {
      const journalHeaderId = uuidv4();
      const journalNumber = generateJournalNumber(input.tenantId);
      const now = new Date();

      // Create AP payment journal lines
      // Dr: Accounts Payable (decrease liability)
      // Cr: Cash/Bank (decrease asset)
      const lines = [
        {
          id: uuidv4(),
          accountCode: '2100-00', // Accounts Payable
          accountName: 'Accounts Payable',
          debit: input.amount,
          credit: undefined,
          currency: input.currency,
          description: `Payment ${input.bankConfirmationRef} - AP clearing`,
        },
        {
          id: uuidv4(),
          accountCode: '1010-00', // Cash/Bank
          accountName: 'Cash - Operating Account',
          debit: undefined,
          credit: input.amount,
          currency: input.currency,
          description: `Payment ${input.bankConfirmationRef} - Bank disbursement`,
        },
      ];

      const journal: StoredJournal = {
        journalHeaderId,
        journalNumber,
        paymentId: input.paymentId,
        tenantId: input.tenantId,
        companyId: input.companyId,
        postingDate: input.paymentDate,
        status: 'posted',
        lines,
        isReversal: false,
      };

      journals.set(journalHeaderId, journal);

      return {
        journalHeaderId,
        journalNumber,
        postingDate: input.paymentDate,
        lines: lines.map((line) => ({
          id: line.id,
          accountCode: line.accountCode,
          accountName: line.accountName,
          debit: line.debit,
          credit: line.credit,
          currency: line.currency,
          description: line.description,
        })),
        status: 'posted',
      };
    },

    async createReversalPosting(
      input: PaymentReversalInput,
      _txContext: TransactionContext
    ): Promise<GLPostingResult> {
      const originalJournal = journals.get(input.originalJournalHeaderId);
      if (!originalJournal) {
        throw new Error(`Original journal not found: ${input.originalJournalHeaderId}`);
      }

      const journalHeaderId = uuidv4();
      const journalNumber = generateJournalNumber(input.tenantId);

      // Create reversal lines (swap debits and credits)
      const lines = originalJournal.lines.map((line) => ({
        id: uuidv4(),
        accountCode: line.accountCode,
        accountName: line.accountName,
        debit: line.credit, // Swap
        credit: line.debit, // Swap
        currency: line.currency,
        description: `REVERSAL: ${input.reason}`,
      }));

      const reversal: StoredJournal = {
        journalHeaderId,
        journalNumber,
        paymentId: input.paymentId,
        tenantId: input.tenantId,
        companyId: input.companyId,
        postingDate: input.reversalDate,
        status: 'posted',
        lines,
        isReversal: true,
        originalJournalId: input.originalJournalHeaderId,
      };

      // Mark original as reversed
      originalJournal.reversedByJournalId = journalHeaderId;
      journals.set(input.originalJournalHeaderId, originalJournal);
      journals.set(journalHeaderId, reversal);

      return {
        journalHeaderId,
        journalNumber,
        postingDate: input.reversalDate,
        lines: lines.map((line) => ({
          id: line.id,
          accountCode: line.accountCode,
          accountName: line.accountName,
          debit: line.debit,
          credit: line.credit,
          currency: line.currency,
          description: line.description,
        })),
        status: 'posted',
      };
    },

    async getPostingByPaymentId(
      paymentId: string,
      tenantId: string
    ): Promise<GLPostingResult | null> {
      for (const journal of journals.values()) {
        if (
          journal.paymentId === paymentId &&
          journal.tenantId === tenantId &&
          !journal.isReversal
        ) {
          return {
            journalHeaderId: journal.journalHeaderId,
            journalNumber: journal.journalNumber,
            postingDate: journal.postingDate,
            lines: journal.lines.map((line) => ({
              id: line.id,
              accountCode: line.accountCode,
              accountName: line.accountName,
              debit: line.debit,
              credit: line.credit,
              currency: line.currency,
              description: line.description,
            })),
            status: journal.status,
          };
        }
      }
      return null;
    },
  };
}

// ============================================================================
// 4. TEST HELPERS
// ============================================================================

/**
 * Clear all GL data (for testing)
 */
export function clearGLData(): void {
  journals.clear();
  journalNumbers.clear();
}

/**
 * Get journal count (for testing)
 */
export function getJournalCount(): number {
  return journals.size;
}

/**
 * Get raw journal (for testing)
 */
export function getRawJournal(journalHeaderId: string): StoredJournal | undefined {
  return journals.get(journalHeaderId);
}
