/**
 * Chart of Accounts Adapter - SQL Implementation (PostgreSQL)
 * 
 * Implements COAPort for account validation and lookups.
 * 
 * @file packages/kernel-adapters/src/sql/coa.sql.ts
 */

import type { Pool } from 'pg';
import type {
  COAPort,
  Account,
  AccountValidationResult,
  AccountSearchFilters,
  AccountBalance,
  AccountType,
} from '@aibos/kernel-core';
import { getNormalBalance } from '@aibos/kernel-core';

// ============================================================================
// 1. SQL QUERIES
// ============================================================================

const SQL = {
  // Get account by code
  GET_BY_CODE: `
    SELECT 
      a.id, a.tenant_id, a.company_id, a.account_code, a.account_name,
      a.account_type, a.parent_account_id, a.level, a.is_postable,
      a.is_active, a.currency, a.description, a.created_at, a.updated_at
    FROM finance.accounts a
    WHERE a.account_code = $1 AND a.tenant_id = $2
      AND ($3::uuid IS NULL OR a.company_id = $3)
    LIMIT 1
  `,

  // Get account by ID
  GET_BY_ID: `
    SELECT 
      a.id, a.tenant_id, a.company_id, a.account_code, a.account_name,
      a.account_type, a.parent_account_id, a.level, a.is_postable,
      a.is_active, a.currency, a.description, a.created_at, a.updated_at
    FROM finance.accounts a
    WHERE a.id = $1 AND a.tenant_id = $2
  `,

  // Search accounts base query
  SEARCH_BASE: `
    SELECT 
      a.id, a.tenant_id, a.company_id, a.account_code, a.account_name,
      a.account_type, a.parent_account_id, a.level, a.is_postable,
      a.is_active, a.currency, a.description, a.created_at, a.updated_at
    FROM finance.accounts a
    WHERE a.tenant_id = $1
  `,

  // Get account hierarchy
  GET_HIERARCHY: `
    WITH RECURSIVE account_tree AS (
      SELECT 
        a.id, a.tenant_id, a.company_id, a.account_code, a.account_name,
        a.account_type, a.parent_account_id, a.level, a.is_postable,
        a.is_active, a.currency, a.description, a.created_at, a.updated_at,
        0 as depth
      FROM finance.accounts a
      WHERE a.tenant_id = $1 AND a.company_id = $2
        AND ($3::uuid IS NULL OR a.id = $3 OR a.parent_account_id IS NULL)
      
      UNION ALL
      
      SELECT 
        c.id, c.tenant_id, c.company_id, c.account_code, c.account_name,
        c.account_type, c.parent_account_id, c.level, c.is_postable,
        c.is_active, c.currency, c.description, c.created_at, c.updated_at,
        p.depth + 1
      FROM finance.accounts c
      INNER JOIN account_tree p ON c.parent_account_id = p.id
    )
    SELECT * FROM account_tree
    ORDER BY account_code
  `,

  // Get account balance
  GET_BALANCE: `
    SELECT 
      a.id as account_id,
      a.account_code,
      a.account_name,
      COALESCE(SUM(CASE WHEN jl.direction = 'DEBIT' THEN jl.amount_cents ELSE 0 END), 0) as debit_balance,
      COALESCE(SUM(CASE WHEN jl.direction = 'CREDIT' THEN jl.amount_cents ELSE 0 END), 0) as credit_balance,
      COALESCE(SUM(CASE WHEN jl.direction = 'DEBIT' THEN jl.amount_cents ELSE -jl.amount_cents END), 0) as net_balance,
      a.currency,
      $4::date as as_of_date
    FROM finance.accounts a
    LEFT JOIN finance.journal_lines jl ON a.id = jl.account_id
    LEFT JOIN finance.journal_entries je ON jl.journal_entry_id = je.id
      AND je.status = 'POSTED'
      AND je.posting_date <= $4
    WHERE a.account_code = $1 AND a.tenant_id = $2 AND a.company_id = $3
    GROUP BY a.id, a.account_code, a.account_name, a.currency
  `,
};

// ============================================================================
// 2. HELPER FUNCTIONS
// ============================================================================

interface AccountRow {
  id: string;
  tenant_id: string;
  company_id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  parent_account_id: string | null;
  level: number;
  is_postable: boolean;
  is_active: boolean;
  currency: string | null;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

function mapRowToAccount(row: AccountRow): Account {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    companyId: row.company_id,
    accountCode: row.account_code,
    accountName: row.account_name,
    accountType: row.account_type as AccountType,
    parentAccountId: row.parent_account_id || undefined,
    level: row.level,
    isPostable: row.is_postable,
    status: row.is_active ? 'active' : 'inactive',
    normalBalance: getNormalBalance(row.account_type as AccountType),
    currency: row.currency || undefined,
    description: row.description || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ============================================================================
// 3. ADAPTER IMPLEMENTATION
// ============================================================================

/**
 * SQL COA Adapter
 */
export class SqlCOAAdapter implements COAPort {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Validate an account for posting
   */
  async validateAccount(
    accountCode: string,
    tenantId: string,
    companyId: string
  ): Promise<AccountValidationResult> {
    const account = await this.getAccountByCode(accountCode, tenantId, companyId);

    if (!account) {
      return {
        isValid: false,
        errorCode: 'ACCOUNT_NOT_FOUND',
        errorMessage: `Account ${accountCode} not found`,
      };
    }

    if (account.status === 'inactive') {
      return {
        isValid: false,
        account,
        errorCode: 'ACCOUNT_INACTIVE',
        errorMessage: `Account ${accountCode} is inactive`,
      };
    }

    if (account.status === 'blocked') {
      return {
        isValid: false,
        account,
        errorCode: 'ACCOUNT_BLOCKED',
        errorMessage: `Account ${accountCode} is blocked`,
      };
    }

    if (!account.isPostable) {
      return {
        isValid: false,
        account,
        errorCode: 'ACCOUNT_NOT_POSTABLE',
        errorMessage: `Account ${accountCode} is not a posting account`,
      };
    }

    return {
      isValid: true,
      account,
    };
  }

  /**
   * Get account by code
   */
  async getAccountByCode(
    accountCode: string,
    tenantId: string,
    companyId?: string
  ): Promise<Account | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(SQL.GET_BY_CODE, [
        accountCode,
        tenantId,
        companyId || null,
      ]);

      if (result.rows.length === 0) {
        return null;
      }

      return mapRowToAccount(result.rows[0]);
    } finally {
      client.release();
    }
  }

  /**
   * Get account by ID
   */
  async getAccountById(
    accountId: string,
    tenantId: string
  ): Promise<Account | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(SQL.GET_BY_ID, [accountId, tenantId]);

      if (result.rows.length === 0) {
        return null;
      }

      return mapRowToAccount(result.rows[0]);
    } finally {
      client.release();
    }
  }

  /**
   * Search accounts
   */
  async searchAccounts(filters: AccountSearchFilters): Promise<Account[]> {
    const client = await this.pool.connect();
    try {
      let query = SQL.SEARCH_BASE;
      const params: unknown[] = [filters.tenantId];
      let paramIndex = 2;

      if (filters.companyId) {
        query += ` AND a.company_id = $${paramIndex++}`;
        params.push(filters.companyId);
      }

      if (filters.codePrefix) {
        query += ` AND a.account_code LIKE $${paramIndex++}`;
        params.push(`${filters.codePrefix}%`);
      }

      if (filters.nameContains) {
        query += ` AND a.account_name ILIKE $${paramIndex++}`;
        params.push(`%${filters.nameContains}%`);
      }

      if (filters.accountType) {
        query += ` AND a.account_type = $${paramIndex++}`;
        params.push(filters.accountType);
      }

      if (filters.status) {
        query += ` AND a.is_active = $${paramIndex++}`;
        params.push(filters.status === 'active');
      }

      if (filters.postableOnly) {
        query += ' AND a.is_postable = TRUE';
      }

      if (filters.parentOnly) {
        query += ' AND a.is_postable = FALSE';
      }

      if (filters.parentAccountId) {
        query += ` AND a.parent_account_id = $${paramIndex++}`;
        params.push(filters.parentAccountId);
      }

      query += ' ORDER BY a.account_code';

      const result = await client.query(query, params);
      return result.rows.map(mapRowToAccount);
    } finally {
      client.release();
    }
  }

  /**
   * Get account hierarchy
   */
  async getAccountHierarchy(
    tenantId: string,
    companyId: string,
    rootAccountId?: string
  ): Promise<Account[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(SQL.GET_HIERARCHY, [
        tenantId,
        companyId,
        rootAccountId || null,
      ]);
      return result.rows.map(mapRowToAccount);
    } finally {
      client.release();
    }
  }

  /**
   * Get account balance
   */
  async getAccountBalance(
    accountCode: string,
    tenantId: string,
    companyId: string,
    asOfDate: Date
  ): Promise<AccountBalance | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(SQL.GET_BALANCE, [
        accountCode,
        tenantId,
        companyId,
        asOfDate,
      ]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        accountId: row.account_id,
        accountCode: row.account_code,
        accountName: row.account_name,
        debitBalance: parseInt(row.debit_balance, 10),
        creditBalance: parseInt(row.credit_balance, 10),
        netBalance: parseInt(row.net_balance, 10),
        currency: row.currency,
        asOfDate: row.as_of_date,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Validate multiple accounts in batch
   */
  async validateAccountsBatch(
    accountCodes: string[],
    tenantId: string,
    companyId: string
  ): Promise<Map<string, AccountValidationResult>> {
    const results = new Map<string, AccountValidationResult>();

    // Process in parallel for efficiency
    const validations = await Promise.all(
      accountCodes.map(async (code) => ({
        code,
        result: await this.validateAccount(code, tenantId, companyId),
      }))
    );

    for (const { code, result } of validations) {
      results.set(code, result);
    }

    return results;
  }
}

// ============================================================================
// 4. FACTORY FUNCTION
// ============================================================================

/**
 * Create SQL COA Adapter
 */
export function createSqlCOAAdapter(pool: Pool): COAPort {
  return new SqlCOAAdapter(pool);
}
