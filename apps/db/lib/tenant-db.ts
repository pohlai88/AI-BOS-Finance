/**
 * AI-BOS Tenant Database Access Layer (Tenant Guard v2)
 * 
 * Purpose: Safe, parameterized database access with mandatory tenant isolation
 * 
 * SECURITY PRINCIPLES:
 * 1. NO SQL string interpolation - all values are parameterized
 * 2. NO dynamic table names - all identifiers from compile-time whitelist
 * 3. MANDATORY tenant context for all tenant-scoped operations
 * 4. EXPLICIT column lists - no SELECT *
 * 
 * @version 2.0.0
 * @contract CONT_03 - Tenant isolation via parameterized predicates
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Tenant context required for all tenant-scoped operations
 */
export interface TenantContext {
  /** Tenant UUID - validated before any DB call */
  tenantId: string;
  /** User UUID - for audit logging */
  userId?: string;
  /** Correlation ID - for distributed tracing */
  correlationId?: string;
}

/**
 * Query options for read operations
 */
export interface QueryOptions {
  /** Maximum rows to return */
  limit?: number;
  /** Cursor for pagination (typically last ID) */
  cursor?: string;
  /** Order by clause (validated against whitelist) */
  orderBy?: { column: string; direction: 'ASC' | 'DESC' };
}

/**
 * Result of tenant-scoped query with audit metadata
 */
export interface TenantQueryResult<T extends QueryResultRow> {
  rows: T[];
  rowCount: number;
  /** The actual SQL executed (for audit) */
  query: { text: string; values: any[] };
}

// ============================================================================
// CONSTANTS - COMPILE-TIME WHITELIST (Security Critical)
// ============================================================================

/**
 * Whitelisted table identifiers - ONLY these can be queried
 * This prevents SQL injection via identifier manipulation
 */
export const TENANT_SCOPED_TABLES = {
  // Kernel schema - tenant-scoped tables
  'kernel.users': ['id', 'tenant_id', 'email', 'display_name', 'password_hash', 'status', 'created_at', 'updated_at'],
  'kernel.roles': ['id', 'tenant_id', 'name', 'description', 'created_at', 'updated_at'],
  'kernel.user_roles': ['id', 'tenant_id', 'user_id', 'role_id', 'created_at'],
  'kernel.sessions': ['id', 'user_id', 'token', 'expires_at', 'created_at'],
  'kernel.audit_events': ['id', 'tenant_id', 'user_id', 'action', 'entity_type', 'entity_id', 'old_values', 'new_values', 'ip_address', 'user_agent', 'created_at'],

  // Finance schema - tenant-scoped tables
  'finance.companies': ['id', 'tenant_id', 'code', 'name', 'type', 'base_currency', 'treasury_center_id', 'pool_participation', 'status', 'created_at', 'updated_at'],
  'finance.accounts': ['id', 'tenant_id', 'company_id', 'code', 'name', 'type', 'sub_type', 'currency', 'is_external', 'bank_code', 'bank_account_number', 'bank_swift_code', 'balance_cents', 'status', 'created_at', 'updated_at'],
  'finance.fx_rates': ['id', 'tenant_id', 'from_currency', 'to_currency', 'rate', 'valid_from', 'valid_to', 'source', 'created_at'],
  'finance.transactions': ['id', 'tenant_id', 'company_id', 'correlation_id', 'reference', 'type', 'status', 'amount_cents', 'currency', 'fx_rate', 'value_date', 'payment_date', 'beneficiary_name', 'beneficiary_account', 'beneficiary_bank_code', 'created_by', 'approved_by', 'posted_at', 'created_at', 'updated_at'],
  'finance.transaction_approvals': ['id', 'transaction_id', 'approver_id', 'level', 'decision', 'comment', 'created_at'],
  'finance.approval_matrices': ['id', 'tenant_id', 'company_id', 'payment_type', 'min_amount_cents', 'max_amount_cents', 'currency', 'required_approvals', 'approval_levels', 'requires_cfo', 'requires_dual_signature', 'created_at', 'updated_at'],
  'finance.journal_entries': ['id', 'tenant_id', 'company_id', 'transaction_id', 'correlation_id', 'reference', 'description', 'posting_date', 'status', 'posted_at', 'reversed_by', 'created_by', 'created_at', 'updated_at'],
  'finance.journal_lines': ['id', 'journal_entry_id', 'account_id', 'direction', 'amount_cents', 'currency', 'line_description', 'created_at'],
  'finance.intercompany_settlements': ['id', 'tenant_id', 'from_company_id', 'to_company_id', 'amount_cents', 'currency', 'status', 'settled_at', 'created_at'],
  'finance.treasury_pool_balances': ['id', 'tenant_id', 'company_id', 'pool_id', 'balance_cents', 'currency', 'snapshot_at', 'created_at'],
} as const;

/**
 * Global tables that do NOT require tenant isolation
 */
export const GLOBAL_TABLES = {
  'kernel.tenants': ['id', 'name', 'slug', 'status', 'created_at', 'updated_at'],
  'kernel.permissions': ['id', 'permission_code', 'category', 'description', 'created_at'],
  'kernel.canons': ['id', 'code', 'name', 'service_url', 'healthy', 'created_at', 'updated_at'],
  'kernel.routes': ['id', 'canon_id', 'method', 'path', 'required_permissions', 'active', 'created_at'],
  'config.provider_profiles': ['id', 'name', 'provider_type', 'config', 'created_at', 'updated_at'],
} as const;

// Type for valid table names
export type TenantScopedTable = keyof typeof TENANT_SCOPED_TABLES;
export type GlobalTable = keyof typeof GLOBAL_TABLES;
export type ValidTable = TenantScopedTable | GlobalTable;

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validate tenant context - throws if invalid
 */
export function assertTenantContext(ctx: TenantContext | undefined | null): asserts ctx is TenantContext {
  if (!ctx) {
    throw new TenantDbError('Tenant context is required for this operation', 'MISSING_CONTEXT');
  }

  if (!ctx.tenantId) {
    throw new TenantDbError('tenantId is required in tenant context', 'MISSING_TENANT_ID');
  }

  if (!UUID_REGEX.test(ctx.tenantId)) {
    throw new TenantDbError(
      `Invalid tenantId format: must be UUID, got "${ctx.tenantId.substring(0, 20)}..."`,
      'INVALID_TENANT_ID'
    );
  }

  if (ctx.userId && !UUID_REGEX.test(ctx.userId)) {
    throw new TenantDbError(
      `Invalid userId format: must be UUID`,
      'INVALID_USER_ID'
    );
  }
}

/**
 * Validate table name against whitelist - prevents identifier injection
 */
export function assertValidTable(table: string): asserts table is ValidTable {
  if (!(table in TENANT_SCOPED_TABLES) && !(table in GLOBAL_TABLES)) {
    throw new TenantDbError(
      `Invalid table name: "${table}" is not in the whitelist`,
      'INVALID_TABLE'
    );
  }
}

/**
 * Check if a table requires tenant isolation
 */
export function isTenantScoped(table: string): table is TenantScopedTable {
  return table in TENANT_SCOPED_TABLES;
}

/**
 * Validate column name against table's column whitelist
 */
export function assertValidColumn(table: ValidTable, column: string): void {
  const columns = TENANT_SCOPED_TABLES[table as TenantScopedTable] ||
    GLOBAL_TABLES[table as GlobalTable];

  if (!columns.includes(column as any)) {
    throw new TenantDbError(
      `Invalid column "${column}" for table "${table}"`,
      'INVALID_COLUMN'
    );
  }
}

// ============================================================================
// ERROR CLASS
// ============================================================================

export type TenantDbErrorCode =
  | 'MISSING_CONTEXT'
  | 'MISSING_TENANT_ID'
  | 'INVALID_TENANT_ID'
  | 'INVALID_USER_ID'
  | 'INVALID_TABLE'
  | 'INVALID_COLUMN'
  | 'QUERY_ERROR'
  | 'CROSS_TENANT_VIOLATION';

export class TenantDbError extends Error {
  constructor(
    message: string,
    public readonly code: TenantDbErrorCode,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'TenantDbError';
  }
}

// ============================================================================
// TENANT DATABASE CLASS (The "Safety Clamp")
// ============================================================================

/**
 * TenantDb - The ONLY way to execute tenant-scoped database queries
 * 
 * This class is the "safety clamp" that enforces:
 * 1. Mandatory tenant context
 * 2. Parameterized queries only
 * 3. Whitelist validation for identifiers
 * 
 * @example
 * ```typescript
 * const tenantDb = createTenantDb(pool);
 * 
 * // All queries require tenant context
 * const companies = await tenantDb.select(
 *   ctx,
 *   'finance.companies',
 *   ['id', 'name', 'status'],
 *   { status: 'active' }
 * );
 * ```
 */
export class TenantDb {
  constructor(private readonly pool: Pool) { }

  // ==========================================================================
  // SELECT OPERATIONS
  // ==========================================================================

  /**
   * Select rows from a tenant-scoped table with mandatory tenant isolation
   */
  async select<T extends QueryResultRow>(
    ctx: TenantContext,
    table: TenantScopedTable,
    columns: readonly string[],
    where?: Record<string, any>,
    options?: QueryOptions
  ): Promise<TenantQueryResult<T>> {
    assertTenantContext(ctx);
    assertValidTable(table);

    // Validate all columns
    for (const col of columns) {
      assertValidColumn(table, col);
    }

    // Build parameterized query
    const columnList = columns.join(', ');
    const values: any[] = [ctx.tenantId];
    let paramIndex = 2;

    let sql = `SELECT ${columnList} FROM ${table} WHERE tenant_id = $1`;

    // Add additional WHERE conditions (all parameterized)
    if (where) {
      for (const [key, value] of Object.entries(where)) {
        assertValidColumn(table, key);
        sql += ` AND ${key} = $${paramIndex}`;
        values.push(value);
        paramIndex++;
      }
    }

    // Add pagination
    if (options?.cursor) {
      sql += ` AND id > $${paramIndex}`;
      values.push(options.cursor);
      paramIndex++;
    }

    // Add ordering (column validated against whitelist)
    if (options?.orderBy) {
      assertValidColumn(table, options.orderBy.column);
      const direction = options.orderBy.direction === 'DESC' ? 'DESC' : 'ASC';
      sql += ` ORDER BY ${options.orderBy.column} ${direction}`;
    } else {
      sql += ` ORDER BY created_at DESC`;
    }

    // Add limit
    if (options?.limit) {
      sql += ` LIMIT $${paramIndex}`;
      values.push(Math.min(options.limit, 1000)); // Hard cap at 1000
    }

    const result = await this.pool.query<T>(sql, values);

    return {
      rows: result.rows,
      rowCount: result.rowCount ?? 0,
      query: { text: sql, values }
    };
  }

  /**
   * Select a single row by ID with tenant isolation
   */
  async selectById<T extends QueryResultRow>(
    ctx: TenantContext,
    table: TenantScopedTable,
    columns: readonly string[],
    id: string
  ): Promise<T | null> {
    assertTenantContext(ctx);

    if (!UUID_REGEX.test(id)) {
      throw new TenantDbError('Invalid ID format: must be UUID', 'QUERY_ERROR');
    }

    const result = await this.select<T>(ctx, table, columns, { id });
    return result.rows[0] || null;
  }

  // ==========================================================================
  // INSERT OPERATIONS
  // ==========================================================================

  /**
   * Insert a row into a tenant-scoped table (tenant_id auto-added)
   */
  async insert<T extends QueryResultRow>(
    ctx: TenantContext,
    table: TenantScopedTable,
    data: Record<string, any>,
    returning?: readonly string[]
  ): Promise<T> {
    assertTenantContext(ctx);
    assertValidTable(table);

    // Ensure tenant_id is not in data (we add it automatically)
    if ('tenant_id' in data) {
      throw new TenantDbError(
        'Do not include tenant_id in insert data - it is added automatically',
        'QUERY_ERROR'
      );
    }

    // Validate all columns
    const columns = Object.keys(data);
    for (const col of columns) {
      assertValidColumn(table, col);
    }

    // Build parameterized INSERT
    const allColumns = ['tenant_id', ...columns];
    const values = [ctx.tenantId, ...Object.values(data)];
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

    let sql = `INSERT INTO ${table} (${allColumns.join(', ')}) VALUES (${placeholders})`;

    // Add RETURNING clause
    if (returning && returning.length > 0) {
      for (const col of returning) {
        assertValidColumn(table, col);
      }
      sql += ` RETURNING ${returning.join(', ')}`;
    } else {
      sql += ` RETURNING *`;
    }

    const result = await this.pool.query<T>(sql, values);
    return result.rows[0];
  }

  // ==========================================================================
  // UPDATE OPERATIONS
  // ==========================================================================

  /**
   * Update rows in a tenant-scoped table with mandatory tenant isolation
   */
  async update<T extends QueryResultRow>(
    ctx: TenantContext,
    table: TenantScopedTable,
    id: string,
    data: Record<string, any>,
    returning?: readonly string[]
  ): Promise<T | null> {
    assertTenantContext(ctx);
    assertValidTable(table);

    if (!UUID_REGEX.test(id)) {
      throw new TenantDbError('Invalid ID format: must be UUID', 'QUERY_ERROR');
    }

    // Ensure tenant_id is not being updated
    if ('tenant_id' in data) {
      throw new TenantDbError(
        'Cannot update tenant_id',
        'CROSS_TENANT_VIOLATION'
      );
    }

    // Validate all columns
    const columns = Object.keys(data);
    for (const col of columns) {
      assertValidColumn(table, col);
    }

    // Build parameterized UPDATE
    const values: any[] = [];
    const setClauses: string[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(data)) {
      setClauses.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }

    // Add tenant_id and id to WHERE
    values.push(ctx.tenantId);
    values.push(id);

    let sql = `UPDATE ${table} SET ${setClauses.join(', ')}, updated_at = NOW() WHERE tenant_id = $${paramIndex} AND id = $${paramIndex + 1}`;

    // Add RETURNING clause
    if (returning && returning.length > 0) {
      for (const col of returning) {
        assertValidColumn(table, col);
      }
      sql += ` RETURNING ${returning.join(', ')}`;
    } else {
      sql += ` RETURNING *`;
    }

    const result = await this.pool.query<T>(sql, values);
    return result.rows[0] || null;
  }

  // ==========================================================================
  // DELETE OPERATIONS
  // ==========================================================================

  /**
   * Delete a row from a tenant-scoped table (soft delete if supported)
   */
  async delete(
    ctx: TenantContext,
    table: TenantScopedTable,
    id: string
  ): Promise<boolean> {
    assertTenantContext(ctx);
    assertValidTable(table);

    if (!UUID_REGEX.test(id)) {
      throw new TenantDbError('Invalid ID format: must be UUID', 'QUERY_ERROR');
    }

    // Use soft delete where status column exists
    const columns = TENANT_SCOPED_TABLES[table];
    if (columns.includes('status' as any)) {
      const sql = `UPDATE ${table} SET status = 'deleted', updated_at = NOW() WHERE tenant_id = $1 AND id = $2`;
      const result = await this.pool.query(sql, [ctx.tenantId, id]);
      return (result.rowCount ?? 0) > 0;
    }

    // Hard delete for tables without status
    const sql = `DELETE FROM ${table} WHERE tenant_id = $1 AND id = $2`;
    const result = await this.pool.query(sql, [ctx.tenantId, id]);
    return (result.rowCount ?? 0) > 0;
  }

  // ==========================================================================
  // TRANSACTION SUPPORT
  // ==========================================================================

  /**
   * Execute operations within a tenant-isolated transaction
   */
  async withTransaction<T>(
    ctx: TenantContext,
    fn: (tx: TenantTransaction) => Promise<T>
  ): Promise<T> {
    assertTenantContext(ctx);

    const client = await this.pool.connect();
    const tx = new TenantTransaction(client, ctx);

    try {
      await client.query('BEGIN');
      const result = await fn(tx);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ==========================================================================
  // GLOBAL TABLE ACCESS (No tenant isolation)
  // ==========================================================================

  /**
   * Select from a global table (no tenant isolation)
   * Use sparingly - most operations should be tenant-scoped
   */
  async selectGlobal<T extends QueryResultRow>(
    table: GlobalTable,
    columns: readonly string[],
    where?: Record<string, any>,
    options?: QueryOptions
  ): Promise<TenantQueryResult<T>> {
    assertValidTable(table);

    // Validate all columns
    for (const col of columns) {
      assertValidColumn(table, col);
    }

    // Build parameterized query
    const columnList = columns.join(', ');
    const values: any[] = [];
    let paramIndex = 1;

    let sql = `SELECT ${columnList} FROM ${table}`;

    // Add WHERE conditions
    if (where && Object.keys(where).length > 0) {
      const conditions: string[] = [];
      for (const [key, value] of Object.entries(where)) {
        assertValidColumn(table, key);
        conditions.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Add ordering
    if (options?.orderBy) {
      assertValidColumn(table, options.orderBy.column);
      const direction = options.orderBy.direction === 'DESC' ? 'DESC' : 'ASC';
      sql += ` ORDER BY ${options.orderBy.column} ${direction}`;
    }

    // Add limit
    if (options?.limit) {
      sql += ` LIMIT $${paramIndex}`;
      values.push(Math.min(options.limit, 1000));
    }

    const result = await this.pool.query<T>(sql, values);

    return {
      rows: result.rows,
      rowCount: result.rowCount ?? 0,
      query: { text: sql, values }
    };
  }
}

// ============================================================================
// TENANT TRANSACTION CLASS
// ============================================================================

/**
 * Transaction-scoped tenant database operations
 */
export class TenantTransaction {
  constructor(
    private readonly client: PoolClient,
    private readonly ctx: TenantContext
  ) { }

  /**
   * Select within transaction
   */
  async select<T extends QueryResultRow>(
    table: TenantScopedTable,
    columns: readonly string[],
    where?: Record<string, any>
  ): Promise<T[]> {
    assertValidTable(table);

    for (const col of columns) {
      assertValidColumn(table, col);
    }

    const columnList = columns.join(', ');
    const values: any[] = [this.ctx.tenantId];
    let paramIndex = 2;

    let sql = `SELECT ${columnList} FROM ${table} WHERE tenant_id = $1`;

    if (where) {
      for (const [key, value] of Object.entries(where)) {
        assertValidColumn(table, key);
        sql += ` AND ${key} = $${paramIndex}`;
        values.push(value);
        paramIndex++;
      }
    }

    const result = await this.client.query<T>(sql, values);
    return result.rows;
  }

  /**
   * Insert within transaction
   */
  async insert<T extends QueryResultRow>(
    table: TenantScopedTable,
    data: Record<string, any>,
    returning?: readonly string[]
  ): Promise<T> {
    assertValidTable(table);

    if ('tenant_id' in data) {
      throw new TenantDbError(
        'Do not include tenant_id in insert data',
        'QUERY_ERROR'
      );
    }

    const columns = Object.keys(data);
    for (const col of columns) {
      assertValidColumn(table, col);
    }

    const allColumns = ['tenant_id', ...columns];
    const values = [this.ctx.tenantId, ...Object.values(data)];
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

    let sql = `INSERT INTO ${table} (${allColumns.join(', ')}) VALUES (${placeholders})`;

    if (returning && returning.length > 0) {
      sql += ` RETURNING ${returning.join(', ')}`;
    } else {
      sql += ` RETURNING *`;
    }

    const result = await this.client.query<T>(sql, values);
    return result.rows[0];
  }

  /**
   * Update within transaction
   */
  async update<T extends QueryResultRow>(
    table: TenantScopedTable,
    id: string,
    data: Record<string, any>
  ): Promise<T | null> {
    assertValidTable(table);

    if (!UUID_REGEX.test(id)) {
      throw new TenantDbError('Invalid ID format', 'QUERY_ERROR');
    }

    if ('tenant_id' in data) {
      throw new TenantDbError('Cannot update tenant_id', 'CROSS_TENANT_VIOLATION');
    }

    const columns = Object.keys(data);
    for (const col of columns) {
      assertValidColumn(table, col);
    }

    const values: any[] = [];
    const setClauses: string[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(data)) {
      setClauses.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }

    values.push(this.ctx.tenantId);
    values.push(id);

    const sql = `UPDATE ${table} SET ${setClauses.join(', ')}, updated_at = NOW() WHERE tenant_id = $${paramIndex} AND id = $${paramIndex + 1} RETURNING *`;

    const result = await this.client.query<T>(sql, values);
    return result.rows[0] || null;
  }

  /**
   * Get the tenant context for this transaction
   */
  getContext(): TenantContext {
    return { ...this.ctx };
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a TenantDb instance
 * 
 * @example
 * ```typescript
 * const tenantDb = createTenantDb(pool);
 * 
 * // All operations are tenant-isolated
 * const companies = await tenantDb.select(
 *   { tenantId: 'abc-123', userId: 'user-456' },
 *   'finance.companies',
 *   ['id', 'name', 'status'],
 *   { status: 'active' },
 *   { limit: 100 }
 * );
 * ```
 */
export function createTenantDb(pool: Pool): TenantDb {
  return new TenantDb(pool);
}

// ============================================================================
// RE-EXPORT FOR BACKWARD COMPATIBILITY
// ============================================================================

// Export the error from old tenant-guard for compatibility
export { TenantDbError as TenantIsolationError };

export default TenantDb;
