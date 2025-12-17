/**
 * GL Posting Adapter - SQL Implementation (PostgreSQL)
 * 
 * Implements GLPostingPort for production use.
 * Creates journal entries and lines in the General Ledger.
 * 
 * Database Tables:
 * - finance.journal_entries (header)
 * - finance.journal_lines (debit/credit lines)
 * - finance.accounts (account lookup)
 * 
 * @file packages/kernel-adapters/src/sql/glPosting.sql.ts
 */

import type { Pool, PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import type {
  GLPostingPort,
  PaymentPostingInput,
  PaymentReversalInput,
  GLPostingResult,
  GLJournalLine,
  TransactionContext,
} from '@aibos/kernel-core';

// ============================================================================
// 1. SQL QUERIES
// ============================================================================

const SQL = {
  // Create journal entry header
  CREATE_JOURNAL_ENTRY: `
    INSERT INTO finance.journal_entries (
      id, tenant_id, company_id, 
      correlation_id, posting_date, 
      reference, description, status,
      created_by, created_at
    ) VALUES (
      $1, $2, $3, 
      $4, $5, 
      $6, $7, $8,
      $9, NOW()
    )
    RETURNING *
  `,

  // Create journal line
  CREATE_JOURNAL_LINE: `
    INSERT INTO finance.journal_lines (
      id, journal_entry_id, account_id,
      direction, amount_cents, currency,
      line_description, created_at
    ) VALUES (
      $1, $2, $3,
      $4, $5, $6,
      $7, NOW()
    )
    RETURNING *
  `,

  // Update journal entry status to POSTED
  POST_JOURNAL_ENTRY: `
    UPDATE finance.journal_entries
    SET status = 'POSTED', posted_at = NOW()
    WHERE id = $1 AND tenant_id = $2
    RETURNING *
  `,

  // Find journal by payment/correlation ID
  FIND_BY_CORRELATION_ID: `
    SELECT 
      je.*,
      json_agg(
        json_build_object(
          'id', jl.id,
          'account_id', jl.account_id,
          'account_code', a.account_code,
          'account_name', a.account_name,
          'direction', jl.direction,
          'amount_cents', jl.amount_cents,
          'currency', jl.currency,
          'line_description', jl.line_description
        ) ORDER BY jl.created_at
      ) FILTER (WHERE jl.id IS NOT NULL) as lines
    FROM finance.journal_entries je
    LEFT JOIN finance.journal_lines jl ON je.id = jl.journal_entry_id
    LEFT JOIN finance.accounts a ON jl.account_id = a.id
    WHERE je.correlation_id = $1 
      AND je.tenant_id = $2
      AND je.status != 'REVERSED'
    GROUP BY je.id
    ORDER BY je.created_at DESC
    LIMIT 1
  `,

  // Find journal by ID
  FIND_BY_ID: `
    SELECT 
      je.*,
      json_agg(
        json_build_object(
          'id', jl.id,
          'account_id', jl.account_id,
          'account_code', a.account_code,
          'account_name', a.account_name,
          'direction', jl.direction,
          'amount_cents', jl.amount_cents,
          'currency', jl.currency,
          'line_description', jl.line_description
        ) ORDER BY jl.created_at
      ) FILTER (WHERE jl.id IS NOT NULL) as lines
    FROM finance.journal_entries je
    LEFT JOIN finance.journal_lines jl ON je.id = jl.journal_entry_id
    LEFT JOIN finance.accounts a ON jl.account_id = a.id
    WHERE je.id = $1 AND je.tenant_id = $2
    GROUP BY je.id
  `,

  // Generate journal reference number
  GENERATE_JOURNAL_NUMBER: `
    SELECT 'JE-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
           LPAD(NEXTVAL('finance.journal_number_seq')::TEXT, 6, '0') as journal_number
  `,

  // Create journal number sequence if not exists
  CREATE_JOURNAL_SEQUENCE: `
    CREATE SEQUENCE IF NOT EXISTS finance.journal_number_seq
    START WITH 1 INCREMENT BY 1
  `,

  // Find account by code
  FIND_ACCOUNT_BY_CODE: `
    SELECT id, account_code, account_name
    FROM finance.accounts
    WHERE account_code = $1 AND tenant_id = $2
  `,

  // Find or create system accounts
  FIND_OR_CREATE_ACCOUNT: `
    INSERT INTO finance.accounts (
      id, tenant_id, company_id, account_code, account_name,
      account_type, is_active, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, TRUE, NOW(), NOW()
    )
    ON CONFLICT (tenant_id, account_code) DO UPDATE SET updated_at = NOW()
    RETURNING id, account_code, account_name
  `,

  // Mark journal as reversed
  MARK_AS_REVERSED: `
    UPDATE finance.journal_entries
    SET status = 'REVERSED', reversed_by = $1
    WHERE id = $2 AND tenant_id = $3
    RETURNING *
  `,
};

// ============================================================================
// 2. HELPER TYPES
// ============================================================================

interface JournalEntryRow {
  id: string;
  tenant_id: string;
  company_id: string;
  correlation_id: string | null;
  posted_at: Date | null;
  posting_date: Date;
  reference: string | null;
  description: string | null;
  status: 'DRAFT' | 'POSTED' | 'REVERSED';
  reversed_by: string | null;
  created_by: string;
  created_at: Date;
  lines: Array<{
    id: string;
    account_id: string;
    account_code: string;
    account_name: string;
    direction: 'DEBIT' | 'CREDIT';
    amount_cents: number;
    currency: string;
    line_description: string | null;
  }> | null;
}

interface AccountInfo {
  id: string;
  account_code: string;
  account_name: string;
}

// ============================================================================
// 3. HELPER FUNCTIONS
// ============================================================================

/**
 * Convert cents to decimal string
 */
function centsToDecimal(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Convert decimal string to cents
 */
function decimalToCents(decimal: string): number {
  return Math.round(parseFloat(decimal) * 100);
}

/**
 * Map database row to GLPostingResult
 */
function mapRowToResult(row: JournalEntryRow): GLPostingResult {
  const lines: GLJournalLine[] = (row.lines || []).map((line) => ({
    id: line.id,
    accountCode: line.account_code,
    accountName: line.account_name,
    debit: line.direction === 'DEBIT' ? centsToDecimal(line.amount_cents) : undefined,
    credit: line.direction === 'CREDIT' ? centsToDecimal(line.amount_cents) : undefined,
    currency: line.currency,
    description: line.line_description || undefined,
  }));

  return {
    journalHeaderId: row.id,
    journalNumber: row.reference || row.id,
    postingDate: row.posting_date,
    lines,
    status: row.status === 'POSTED' ? 'posted' : 'pending',
  };
}

/**
 * Get or create a client from transaction context
 */
function getClient(txContext: TransactionContext): PoolClient {
  // TransactionContext should contain the pg client
  const client = txContext as unknown as { client?: PoolClient };
  if (!client.client) {
    throw new Error('Transaction context must contain a pg client');
  }
  return client.client;
}

// ============================================================================
// 4. ADAPTER IMPLEMENTATION
// ============================================================================

/**
 * SQL GL Posting Adapter
 */
export class SqlGLPostingAdapter implements GLPostingPort {
  private pool: Pool;
  private initialized = false;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Initialize adapter (create sequence if needed)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    const client = await this.pool.connect();
    try {
      await client.query(SQL.CREATE_JOURNAL_SEQUENCE);
      this.initialized = true;
    } finally {
      client.release();
    }
  }

  /**
   * Get or create account by code
   */
  private async getOrCreateAccount(
    client: PoolClient,
    tenantId: string,
    companyId: string,
    accountCode: string,
    accountName: string,
    accountType: string = 'ASSET'
  ): Promise<AccountInfo> {
    const result = await client.query(SQL.FIND_OR_CREATE_ACCOUNT, [
      uuidv4(),
      tenantId,
      companyId,
      accountCode,
      accountName,
      accountType,
    ]);
    return result.rows[0];
  }

  /**
   * Generate journal reference number
   */
  private async generateJournalNumber(client: PoolClient): Promise<string> {
    const result = await client.query(SQL.GENERATE_JOURNAL_NUMBER);
    return result.rows[0].journal_number;
  }

  /**
   * Create GL posting for a completed payment
   */
  async createPaymentPosting(
    input: PaymentPostingInput,
    txContext: TransactionContext
  ): Promise<GLPostingResult> {
    const client = getClient(txContext);
    const journalId = uuidv4();
    const journalNumber = await this.generateJournalNumber(client);

    // Get or create AP and Cash accounts
    const apAccount = await this.getOrCreateAccount(
      client,
      input.tenantId,
      input.companyId,
      '2100-00',
      'Accounts Payable',
      'LIABILITY'
    );

    const cashAccount = await this.getOrCreateAccount(
      client,
      input.tenantId,
      input.companyId,
      '1010-00',
      'Cash - Operating Account',
      'ASSET'
    );

    // Create journal entry header
    await client.query(SQL.CREATE_JOURNAL_ENTRY, [
      journalId,
      input.tenantId,
      input.companyId,
      input.paymentId, // correlation_id = paymentId
      input.paymentDate,
      journalNumber,
      `Payment disbursement - ${input.bankConfirmationRef}`,
      'DRAFT', // Start as draft, post after adding lines
      input.vendorId || uuidv4(), // created_by
    ]);

    const amountCents = decimalToCents(input.amount);

    // Create debit line (Accounts Payable - decrease liability)
    const debitLineId = uuidv4();
    await client.query(SQL.CREATE_JOURNAL_LINE, [
      debitLineId,
      journalId,
      apAccount.id,
      'DEBIT',
      amountCents,
      input.currency,
      `Payment ${input.bankConfirmationRef} - AP clearing`,
    ]);

    // Create credit line (Cash/Bank - decrease asset)
    const creditLineId = uuidv4();
    await client.query(SQL.CREATE_JOURNAL_LINE, [
      creditLineId,
      journalId,
      cashAccount.id,
      'CREDIT',
      amountCents,
      input.currency,
      `Payment ${input.bankConfirmationRef} - Bank disbursement`,
    ]);

    // Post the journal entry
    await client.query(SQL.POST_JOURNAL_ENTRY, [journalId, input.tenantId]);

    // Return the result
    return {
      journalHeaderId: journalId,
      journalNumber,
      postingDate: input.paymentDate,
      lines: [
        {
          id: debitLineId,
          accountCode: apAccount.account_code,
          accountName: apAccount.account_name,
          debit: input.amount,
          credit: undefined,
          currency: input.currency,
          description: `Payment ${input.bankConfirmationRef} - AP clearing`,
        },
        {
          id: creditLineId,
          accountCode: cashAccount.account_code,
          accountName: cashAccount.account_name,
          debit: undefined,
          credit: input.amount,
          currency: input.currency,
          description: `Payment ${input.bankConfirmationRef} - Bank disbursement`,
        },
      ],
      status: 'posted',
    };
  }

  /**
   * Create reversal posting
   */
  async createReversalPosting(
    input: PaymentReversalInput,
    txContext: TransactionContext
  ): Promise<GLPostingResult> {
    const client = getClient(txContext);

    // Get original journal
    const originalResult = await client.query(SQL.FIND_BY_ID, [
      input.originalJournalHeaderId,
      input.tenantId,
    ]);

    if (originalResult.rows.length === 0) {
      throw new Error(`Original journal not found: ${input.originalJournalHeaderId}`);
    }

    const original = originalResult.rows[0] as JournalEntryRow;

    if (original.status === 'REVERSED') {
      throw new Error(`Journal ${input.originalJournalHeaderId} is already reversed`);
    }

    const reversalId = uuidv4();
    const journalNumber = await this.generateJournalNumber(client);

    // Create reversal journal entry
    await client.query(SQL.CREATE_JOURNAL_ENTRY, [
      reversalId,
      input.tenantId,
      input.companyId,
      input.paymentId, // correlation_id
      input.reversalDate,
      journalNumber,
      `REVERSAL: ${input.reason} (original: ${original.reference})`,
      'DRAFT',
      input.paymentId, // created_by
    ]);

    // Create reversed lines (swap debits and credits)
    const lines: GLJournalLine[] = [];
    for (const line of original.lines || []) {
      const reversedDirection = line.direction === 'DEBIT' ? 'CREDIT' : 'DEBIT';
      const lineId = uuidv4();

      await client.query(SQL.CREATE_JOURNAL_LINE, [
        lineId,
        reversalId,
        line.account_id,
        reversedDirection,
        line.amount_cents,
        line.currency,
        `REVERSAL: ${input.reason}`,
      ]);

      lines.push({
        id: lineId,
        accountCode: line.account_code,
        accountName: line.account_name,
        debit: reversedDirection === 'DEBIT' ? centsToDecimal(line.amount_cents) : undefined,
        credit: reversedDirection === 'CREDIT' ? centsToDecimal(line.amount_cents) : undefined,
        currency: line.currency,
        description: `REVERSAL: ${input.reason}`,
      });
    }

    // Post the reversal
    await client.query(SQL.POST_JOURNAL_ENTRY, [reversalId, input.tenantId]);

    // Mark original as reversed
    await client.query(SQL.MARK_AS_REVERSED, [
      reversalId,
      input.originalJournalHeaderId,
      input.tenantId,
    ]);

    return {
      journalHeaderId: reversalId,
      journalNumber,
      postingDate: input.reversalDate,
      lines,
      status: 'posted',
    };
  }

  /**
   * Get GL posting for a payment
   */
  async getPostingByPaymentId(
    paymentId: string,
    tenantId: string
  ): Promise<GLPostingResult | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(SQL.FIND_BY_CORRELATION_ID, [
        paymentId,
        tenantId,
      ]);

      if (result.rows.length === 0) {
        return null;
      }

      return mapRowToResult(result.rows[0] as JournalEntryRow);
    } finally {
      client.release();
    }
  }
}

// ============================================================================
// 5. FACTORY FUNCTION
// ============================================================================

/**
 * Create SQL GL Posting Adapter
 */
export function createSqlGLPostingAdapter(pool: Pool): GLPostingPort {
  const adapter = new SqlGLPostingAdapter(pool);
  return adapter;
}

/**
 * Create and initialize SQL GL Posting Adapter
 */
export async function createAndInitGLPostingAdapter(pool: Pool): Promise<GLPostingPort> {
  const adapter = new SqlGLPostingAdapter(pool);
  await adapter.initialize();
  return adapter;
}
