/**
 * Journal Entry Repository - PostgreSQL Adapter
 * 
 * Implements JournalEntryRepositoryPort for PostgreSQL.
 * Used by GL-02 Journal Entry Cell.
 * 
 * @file packages/kernel-adapters/src/sql/journalEntryRepo.sql.ts
 */

import { Pool, PoolClient } from 'pg';
import type {
  JournalEntryRepositoryPort,
  JournalEntry,
  JournalEntryLine,
  JournalEntryAttachment,
  JournalEntryFilter,
  JournalEntryStatus,
  CreateJournalEntryInput,
  CreateJournalEntryLineInput,
  UpdateJournalEntryInput,
  PaginationOptions,
  PaginatedResult,
  TransactionContext,
} from '@aibos/kernel-core';
import { mapDbError } from './db-errors';

// ============================================================================
// TYPES
// ============================================================================

interface DbJournalEntry {
  id: string;
  tenant_id: string;
  company_id: string;
  entry_number: string;
  entry_date: Date;
  entry_type: string;
  reference: string;
  description: string;
  total_debit: string;
  total_credit: string;
  currency: string;
  is_balanced: boolean;
  status: string;
  auto_reverse: boolean;
  reverse_date: Date | null;
  original_entry_id: string | null;
  has_reversal: boolean;
  reversal_entry_id: string | null;
  is_recurring: boolean;
  recurring_frequency: string | null;
  recurring_start_date: Date | null;
  recurring_end_date: Date | null;
  submitted_at: Date | null;
  submitted_by: string | null;
  approved_at: Date | null;
  approved_by: string | null;
  rejected_at: Date | null;
  rejected_by: string | null;
  rejection_reason: string | null;
  posted_at: Date | null;
  posted_by: string | null;
  gl_posting_reference: string | null;
  created_by: string;
  created_at: Date;
  updated_by: string | null;
  updated_at: Date | null;
  version: number;
}

interface DbJournalLine {
  id: string;
  journal_entry_id: string;
  line_number: number;
  account_code: string;
  account_name: string | null;
  debit_amount: string | null;
  credit_amount: string | null;
  currency: string;
  functional_amount: string | null;
  exchange_rate: string | null;
  description: string | null;
  cost_center: string | null;
  project: string | null;
  department: string | null;
  segment: string | null;
  source_document_type: string | null;
  source_document_id: string | null;
  source_line_id: string | null;
  created_at: Date;
  updated_at: Date | null;
}

// ============================================================================
// MAPPERS
// ============================================================================

function mapToJournalEntry(row: DbJournalEntry): JournalEntry {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    companyId: row.company_id,
    entryNumber: row.entry_number,
    entryDate: row.entry_date,
    entryType: row.entry_type as JournalEntry['entryType'],
    reference: row.reference,
    description: row.description,
    totalDebit: row.total_debit,
    totalCredit: row.total_credit,
    currency: row.currency,
    isBalanced: row.is_balanced,
    status: row.status as JournalEntryStatus,
    autoReverse: row.auto_reverse,
    reverseDate: row.reverse_date ?? undefined,
    originalEntryId: row.original_entry_id ?? undefined,
    hasReversal: row.has_reversal,
    reversalEntryId: row.reversal_entry_id ?? undefined,
    isRecurring: row.is_recurring,
    recurringFrequency: row.recurring_frequency as JournalEntry['recurringFrequency'],
    recurringStartDate: row.recurring_start_date ?? undefined,
    recurringEndDate: row.recurring_end_date ?? undefined,
    submittedAt: row.submitted_at ?? undefined,
    submittedBy: row.submitted_by ?? undefined,
    approvedAt: row.approved_at ?? undefined,
    approvedBy: row.approved_by ?? undefined,
    rejectedAt: row.rejected_at ?? undefined,
    rejectedBy: row.rejected_by ?? undefined,
    rejectionReason: row.rejection_reason ?? undefined,
    postedAt: row.posted_at ?? undefined,
    postedBy: row.posted_by ?? undefined,
    glPostingReference: row.gl_posting_reference ?? undefined,
    attachments: [], // Loaded separately if needed
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedBy: row.updated_by ?? undefined,
    updatedAt: row.updated_at ?? undefined,
    version: row.version,
  };
}

function mapToJournalLine(row: DbJournalLine): JournalEntryLine {
  return {
    id: row.id,
    journalEntryId: row.journal_entry_id,
    lineNumber: row.line_number,
    accountCode: row.account_code,
    accountName: row.account_name ?? undefined,
    debitAmount: row.debit_amount ?? undefined,
    creditAmount: row.credit_amount ?? undefined,
    currency: row.currency,
    functionalAmount: row.functional_amount ?? undefined,
    exchangeRate: row.exchange_rate ?? undefined,
    description: row.description ?? undefined,
    costCenter: row.cost_center ?? undefined,
    project: row.project ?? undefined,
    department: row.department ?? undefined,
    segment: row.segment ?? undefined,
    sourceDocumentType: row.source_document_type ?? undefined,
    sourceDocumentId: row.source_document_id ?? undefined,
    sourceLineId: row.source_line_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
  };
}

// ============================================================================
// REPOSITORY IMPLEMENTATION
// ============================================================================

export function createJournalEntryRepository(pool: Pool): JournalEntryRepositoryPort {
  // Helper to get client
  const getClient = (txContext?: TransactionContext): PoolClient | Pool => {
    return (txContext?.client as PoolClient) ?? pool;
  };

  return {
    // -------------------------------------------------------------------------
    // CREATE
    // -------------------------------------------------------------------------
    async create(
      input: CreateJournalEntryInput,
      txContext?: TransactionContext
    ): Promise<JournalEntry> {
      const client = getClient(txContext);

      // Calculate totals from lines
      let totalDebit = 0;
      let totalCredit = 0;
      for (const line of input.lines) {
        if (line.debitAmount) totalDebit += parseFloat(line.debitAmount);
        if (line.creditAmount) totalCredit += parseFloat(line.creditAmount);
      }
      const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

      // Insert journal entry
      const entryResult = await client.query<DbJournalEntry>(
        `INSERT INTO gl_journal_entries (
          tenant_id, company_id, entry_date, entry_type, reference, description,
          total_debit, total_credit, currency, is_balanced, status,
          auto_reverse, reverse_date, is_recurring, recurring_frequency,
          recurring_start_date, recurring_end_date, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING *`,
        [
          input.tenantId,
          input.companyId,
          input.entryDate,
          input.entryType,
          input.reference,
          input.description,
          totalDebit.toFixed(2),
          totalCredit.toFixed(2),
          input.currency,
          isBalanced,
          'draft',
          input.autoReverse ?? false,
          input.reverseDate,
          input.isRecurring ?? false,
          input.recurringFrequency,
          input.recurringStartDate,
          input.recurringEndDate,
          input.createdBy,
        ]
      );

      const entry = mapToJournalEntry(entryResult.rows[0]);

      // Insert lines
      for (const line of input.lines) {
        await client.query(
          `INSERT INTO gl_journal_lines (
            journal_entry_id, line_number, account_code, debit_amount, credit_amount,
            currency, description, cost_center, project, department, segment,
            source_document_type, source_document_id, source_line_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            entry.id,
            line.lineNumber,
            line.accountCode,
            line.debitAmount,
            line.creditAmount,
            line.currency,
            line.description,
            line.costCenter,
            line.project,
            line.department,
            line.segment,
            line.sourceDocumentType,
            line.sourceDocumentId,
            line.sourceLineId,
          ]
        );
      }

      // Return with lines
      const lines = await this.getLines(entry.id, entry.tenantId);
      return { ...entry, lines };
    },

    // -------------------------------------------------------------------------
    // FIND BY ID
    // -------------------------------------------------------------------------
    async findById(
      id: string,
      tenantId: string,
      includeLines = true
    ): Promise<JournalEntry | null> {
      const result = await pool.query<DbJournalEntry>(
        `SELECT * FROM gl_journal_entries WHERE id = $1 AND tenant_id = $2`,
        [id, tenantId]
      );

      if (result.rows.length === 0) return null;

      const entry = mapToJournalEntry(result.rows[0]);

      if (includeLines) {
        entry.lines = await this.getLines(entry.id, entry.tenantId);
      }

      return entry;
    },

    // -------------------------------------------------------------------------
    // FIND BY ENTRY NUMBER
    // -------------------------------------------------------------------------
    async findByEntryNumber(
      entryNumber: string,
      tenantId: string,
      companyId: string
    ): Promise<JournalEntry | null> {
      const result = await pool.query<DbJournalEntry>(
        `SELECT * FROM gl_journal_entries 
         WHERE entry_number = $1 AND tenant_id = $2 AND company_id = $3`,
        [entryNumber, tenantId, companyId]
      );

      if (result.rows.length === 0) return null;

      return mapToJournalEntry(result.rows[0]);
    },

    // -------------------------------------------------------------------------
    // FIND BY FILTER
    // -------------------------------------------------------------------------
    async findByFilter(
      filter: JournalEntryFilter,
      pagination: PaginationOptions
    ): Promise<PaginatedResult<JournalEntry>> {
      const conditions: string[] = ['tenant_id = $1'];
      const params: unknown[] = [filter.tenantId];
      let paramIndex = 2;

      if (filter.companyId) {
        conditions.push(`company_id = $${paramIndex++}`);
        params.push(filter.companyId);
      }

      if (filter.status) {
        if (Array.isArray(filter.status)) {
          conditions.push(`status = ANY($${paramIndex++})`);
          params.push(filter.status);
        } else {
          conditions.push(`status = $${paramIndex++}`);
          params.push(filter.status);
        }
      }

      if (filter.entryType) {
        if (Array.isArray(filter.entryType)) {
          conditions.push(`entry_type = ANY($${paramIndex++})`);
          params.push(filter.entryType);
        } else {
          conditions.push(`entry_type = $${paramIndex++}`);
          params.push(filter.entryType);
        }
      }

      if (filter.dateFrom) {
        conditions.push(`entry_date >= $${paramIndex++}`);
        params.push(filter.dateFrom);
      }

      if (filter.dateTo) {
        conditions.push(`entry_date <= $${paramIndex++}`);
        params.push(filter.dateTo);
      }

      if (filter.reference) {
        conditions.push(`reference ILIKE $${paramIndex++}`);
        params.push(`%${filter.reference}%`);
      }

      if (filter.createdBy) {
        conditions.push(`created_by = $${paramIndex++}`);
        params.push(filter.createdBy);
      }

      const whereClause = conditions.join(' AND ');
      const sortColumn = pagination.sortBy ?? 'created_at';
      const sortOrder = pagination.sortOrder ?? 'desc';

      // Count total
      const countResult = await pool.query(
        `SELECT COUNT(*) as count FROM gl_journal_entries WHERE ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0].count, 10);

      // Fetch page
      const result = await pool.query<DbJournalEntry>(
        `SELECT * FROM gl_journal_entries 
         WHERE ${whereClause}
         ORDER BY ${sortColumn} ${sortOrder}
         LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
        [...params, pagination.limit, pagination.offset]
      );

      return {
        data: result.rows.map(mapToJournalEntry),
        total,
        limit: pagination.limit,
        offset: pagination.offset,
        hasMore: pagination.offset + result.rows.length < total,
      };
    },

    // -------------------------------------------------------------------------
    // UPDATE
    // -------------------------------------------------------------------------
    async update(
      id: string,
      tenantId: string,
      input: UpdateJournalEntryInput,
      expectedVersion: number,
      txContext?: TransactionContext
    ): Promise<JournalEntry> {
      const client = getClient(txContext);

      const setClauses: string[] = [];
      const params: unknown[] = [id, tenantId, expectedVersion];
      let paramIndex = 4;

      if (input.entryDate !== undefined) {
        setClauses.push(`entry_date = $${paramIndex++}`);
        params.push(input.entryDate);
      }
      if (input.entryType !== undefined) {
        setClauses.push(`entry_type = $${paramIndex++}`);
        params.push(input.entryType);
      }
      if (input.reference !== undefined) {
        setClauses.push(`reference = $${paramIndex++}`);
        params.push(input.reference);
      }
      if (input.description !== undefined) {
        setClauses.push(`description = $${paramIndex++}`);
        params.push(input.description);
      }
      if (input.autoReverse !== undefined) {
        setClauses.push(`auto_reverse = $${paramIndex++}`);
        params.push(input.autoReverse);
      }
      if (input.reverseDate !== undefined) {
        setClauses.push(`reverse_date = $${paramIndex++}`);
        params.push(input.reverseDate);
      }

      setClauses.push(`updated_by = $${paramIndex++}`);
      params.push(input.updatedBy);
      setClauses.push(`updated_at = NOW()`);
      setClauses.push(`version = version + 1`);

      const result = await client.query<DbJournalEntry>(
        `UPDATE gl_journal_entries
         SET ${setClauses.join(', ')}
         WHERE id = $1 AND tenant_id = $2 AND version = $3 AND status = 'draft'
         RETURNING *`,
        params
      );

      if (result.rows.length === 0) {
        throw mapDbError(new Error('VERSION_CONFLICT'), 'journal_entry');
      }

      return mapToJournalEntry(result.rows[0]);
    },

    // -------------------------------------------------------------------------
    // UPDATE STATUS
    // -------------------------------------------------------------------------
    async updateStatus(
      id: string,
      tenantId: string,
      newStatus: JournalEntryStatus,
      workflowData: Partial<JournalEntry>,
      expectedVersion: number,
      txContext?: TransactionContext
    ): Promise<JournalEntry> {
      const client = getClient(txContext);

      const setClauses: string[] = [`status = $4`, `version = version + 1`];
      const params: unknown[] = [id, tenantId, expectedVersion, newStatus];
      let paramIndex = 5;

      // Add workflow-specific fields
      if (workflowData.submittedAt !== undefined) {
        setClauses.push(`submitted_at = $${paramIndex++}`);
        params.push(workflowData.submittedAt);
      }
      if (workflowData.submittedBy !== undefined) {
        setClauses.push(`submitted_by = $${paramIndex++}`);
        params.push(workflowData.submittedBy);
      }
      if (workflowData.approvedAt !== undefined) {
        setClauses.push(`approved_at = $${paramIndex++}`);
        params.push(workflowData.approvedAt);
      }
      if (workflowData.approvedBy !== undefined) {
        setClauses.push(`approved_by = $${paramIndex++}`);
        params.push(workflowData.approvedBy);
      }
      if (workflowData.rejectedAt !== undefined) {
        setClauses.push(`rejected_at = $${paramIndex++}`);
        params.push(workflowData.rejectedAt);
      }
      if (workflowData.rejectedBy !== undefined) {
        setClauses.push(`rejected_by = $${paramIndex++}`);
        params.push(workflowData.rejectedBy);
      }
      if (workflowData.rejectionReason !== undefined) {
        setClauses.push(`rejection_reason = $${paramIndex++}`);
        params.push(workflowData.rejectionReason);
      }
      if (workflowData.postedAt !== undefined) {
        setClauses.push(`posted_at = $${paramIndex++}`);
        params.push(workflowData.postedAt);
      }
      if (workflowData.postedBy !== undefined) {
        setClauses.push(`posted_by = $${paramIndex++}`);
        params.push(workflowData.postedBy);
      }
      if (workflowData.glPostingReference !== undefined) {
        setClauses.push(`gl_posting_reference = $${paramIndex++}`);
        params.push(workflowData.glPostingReference);
      }

      const result = await client.query<DbJournalEntry>(
        `UPDATE gl_journal_entries
         SET ${setClauses.join(', ')}, updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2 AND version = $3
         RETURNING *`,
        params
      );

      if (result.rows.length === 0) {
        throw mapDbError(new Error('VERSION_CONFLICT'), 'journal_entry');
      }

      return mapToJournalEntry(result.rows[0]);
    },

    // -------------------------------------------------------------------------
    // GET LINES
    // -------------------------------------------------------------------------
    async getLines(
      journalEntryId: string,
      tenantId: string
    ): Promise<JournalEntryLine[]> {
      const result = await pool.query<DbJournalLine>(
        `SELECT l.* FROM gl_journal_lines l
         JOIN gl_journal_entries e ON l.journal_entry_id = e.id
         WHERE l.journal_entry_id = $1 AND e.tenant_id = $2
         ORDER BY l.line_number`,
        [journalEntryId, tenantId]
      );

      return result.rows.map(mapToJournalLine);
    },

    // -------------------------------------------------------------------------
    // ADD LINES
    // -------------------------------------------------------------------------
    async addLines(
      journalEntryId: string,
      tenantId: string,
      lines: CreateJournalEntryLineInput[],
      txContext?: TransactionContext
    ): Promise<JournalEntryLine[]> {
      const client = getClient(txContext);
      const createdLines: JournalEntryLine[] = [];

      for (const line of lines) {
        const result = await client.query<DbJournalLine>(
          `INSERT INTO gl_journal_lines (
            journal_entry_id, line_number, account_code, debit_amount, credit_amount,
            currency, description, cost_center, project, department, segment,
            source_document_type, source_document_id, source_line_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          RETURNING *`,
          [
            journalEntryId,
            line.lineNumber,
            line.accountCode,
            line.debitAmount,
            line.creditAmount,
            line.currency,
            line.description,
            line.costCenter,
            line.project,
            line.department,
            line.segment,
            line.sourceDocumentType,
            line.sourceDocumentId,
            line.sourceLineId,
          ]
        );
        createdLines.push(mapToJournalLine(result.rows[0]));
      }

      // Recalculate totals
      await this.recalculateTotals(journalEntryId, client);

      return createdLines;
    },

    // -------------------------------------------------------------------------
    // DELETE LINES
    // -------------------------------------------------------------------------
    async deleteLines(
      journalEntryId: string,
      tenantId: string,
      lineIds: string[],
      txContext?: TransactionContext
    ): Promise<void> {
      const client = getClient(txContext);

      await client.query(
        `DELETE FROM gl_journal_lines 
         WHERE journal_entry_id = $1 AND id = ANY($2)
         AND EXISTS (
           SELECT 1 FROM gl_journal_entries 
           WHERE id = $1 AND tenant_id = $3 AND status = 'draft'
         )`,
        [journalEntryId, lineIds, tenantId]
      );

      // Recalculate totals
      await this.recalculateTotals(journalEntryId, client);
    },

    // -------------------------------------------------------------------------
    // ADD ATTACHMENT
    // -------------------------------------------------------------------------
    async addAttachment(
      journalEntryId: string,
      tenantId: string,
      attachment: Omit<JournalEntryAttachment, 'id' | 'journalEntryId'>,
      txContext?: TransactionContext
    ): Promise<JournalEntryAttachment> {
      const client = getClient(txContext);

      const result = await client.query(
        `INSERT INTO gl_journal_attachments (
          journal_entry_id, file_name, file_type, file_size, storage_url, uploaded_by
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [
          journalEntryId,
          attachment.fileName,
          attachment.fileType,
          attachment.fileSize,
          attachment.storageUrl,
          attachment.uploadedBy,
        ]
      );

      return {
        id: result.rows[0].id,
        journalEntryId: result.rows[0].journal_entry_id,
        fileName: result.rows[0].file_name,
        fileType: result.rows[0].file_type,
        fileSize: result.rows[0].file_size,
        storageUrl: result.rows[0].storage_url,
        uploadedBy: result.rows[0].uploaded_by,
        uploadedAt: result.rows[0].uploaded_at,
      };
    },

    // -------------------------------------------------------------------------
    // FIND PENDING REVERSALS
    // -------------------------------------------------------------------------
    async findPendingReversals(
      tenantId: string,
      asOfDate: Date
    ): Promise<JournalEntry[]> {
      const result = await pool.query<DbJournalEntry>(
        `SELECT * FROM gl_journal_entries
         WHERE tenant_id = $1 
         AND auto_reverse = true 
         AND reverse_date <= $2
         AND has_reversal = false
         AND status = 'posted'`,
        [tenantId, asOfDate]
      );

      return result.rows.map(mapToJournalEntry);
    },

    // -------------------------------------------------------------------------
    // IS REFERENCE UNIQUE
    // -------------------------------------------------------------------------
    async isReferenceUnique(
      reference: string,
      tenantId: string,
      companyId: string,
      excludeId?: string
    ): Promise<boolean> {
      const result = await pool.query(
        `SELECT COUNT(*) as count FROM gl_journal_entries
         WHERE reference = $1 AND tenant_id = $2 AND company_id = $3
         ${excludeId ? 'AND id != $4' : ''}`,
        excludeId ? [reference, tenantId, companyId, excludeId] : [reference, tenantId, companyId]
      );

      return parseInt(result.rows[0].count, 10) === 0;
    },

    // -------------------------------------------------------------------------
    // TRANSACTION MANAGEMENT
    // -------------------------------------------------------------------------
    async beginTransaction(): Promise<TransactionContext> {
      const client = await pool.connect();
      await client.query('BEGIN');
      return { client };
    },

    async commitTransaction(txContext: TransactionContext): Promise<void> {
      const client = txContext.client as PoolClient;
      try {
        await client.query('COMMIT');
      } finally {
        client.release();
      }
    },

    async rollbackTransaction(txContext: TransactionContext): Promise<void> {
      const client = txContext.client as PoolClient;
      try {
        await client.query('ROLLBACK');
      } finally {
        client.release();
      }
    },

    // -------------------------------------------------------------------------
    // HELPER: Recalculate totals
    // -------------------------------------------------------------------------
    async recalculateTotals(
      journalEntryId: string,
      client: PoolClient | Pool
    ): Promise<void> {
      await client.query(
        `UPDATE gl_journal_entries
         SET 
           total_debit = (SELECT COALESCE(SUM(COALESCE(debit_amount::numeric, 0)), 0) FROM gl_journal_lines WHERE journal_entry_id = $1),
           total_credit = (SELECT COALESCE(SUM(COALESCE(credit_amount::numeric, 0)), 0) FROM gl_journal_lines WHERE journal_entry_id = $1),
           is_balanced = (
             SELECT ABS(
               COALESCE(SUM(COALESCE(debit_amount::numeric, 0)), 0) - 
               COALESCE(SUM(COALESCE(credit_amount::numeric, 0)), 0)
             ) < 0.01
             FROM gl_journal_lines WHERE journal_entry_id = $1
           ),
           updated_at = NOW()
         WHERE id = $1`,
        [journalEntryId]
      );
    },
  };
}
