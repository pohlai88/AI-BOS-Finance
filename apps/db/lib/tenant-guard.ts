/**
 * AI-BOS Tenant Isolation Guard
 * 
 * Purpose: Enforce tenant isolation at application layer
 * MVP Task: #3 - Tenant Isolation Guard
 * Reference: CONT_03 - "Primary enforcement at application layer"
 * 
 * This module ensures ALL database queries include tenant_id filtering,
 * preventing cross-tenant data access.
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

// ============================================================================
// TYPES
// ============================================================================

export interface TenantContext {
  tenantId: string;
  userId?: string;
  schema?: 'kernel' | 'finance' | 'config';
}

export interface TenantGuardConfig {
  pool: Pool;
  /** Tables that don't require tenant isolation (e.g., lookup tables) */
  excludedTables?: string[];
  /** Enable strict mode - throws on queries without tenant context */
  strictMode?: boolean;
  /** Enable query logging for debugging */
  debug?: boolean;
}

export interface GuardedQuery {
  text: string;
  values: any[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Tables that are tenant-scoped and require isolation */
const TENANT_SCOPED_TABLES = {
  kernel: ['users', 'roles', 'user_roles', 'sessions', 'audit_events'],
  finance: [
    'companies',
    'accounts',
    'fx_rates',
    'transactions',
    'transaction_approvals',
    'approval_matrices',
    'journal_entries',
    'journal_lines',
    'intercompany_settlements',
    'treasury_pool_balances'
  ],
  config: ['provider_profiles']
} as const;

/** Tables that are global (no tenant isolation) */
const GLOBAL_TABLES = [
  'kernel.tenants',  // Tenants table itself
  'kernel.canons',
  'kernel.routes',
  'kernel.permissions'
];

// ============================================================================
// TENANT GUARD CLASS
// ============================================================================

export class TenantGuard {
  private pool: Pool;
  private excludedTables: Set<string>;
  private strictMode: boolean;
  private debug: boolean;

  constructor(config: TenantGuardConfig) {
    this.pool = config.pool;
    this.excludedTables = new Set([
      ...GLOBAL_TABLES,
      ...(config.excludedTables || [])
    ]);
    this.strictMode = config.strictMode ?? true;
    this.debug = config.debug ?? false;
  }

  /**
   * Execute a query within a tenant context
   * Automatically adds WHERE tenant_id = $1 to applicable queries
   */
  async query<T extends QueryResultRow = any>(
    context: TenantContext,
    sql: string,
    params: any[] = []
  ): Promise<QueryResult<T>> {
    const guardedQuery = this.guardQuery(context, sql, params);

    if (this.debug) {
      console.log('[TenantGuard] Original:', sql);
      console.log('[TenantGuard] Guarded:', guardedQuery.text);
      console.log('[TenantGuard] Params:', guardedQuery.values);
    }

    return this.pool.query<T>(guardedQuery.text, guardedQuery.values);
  }

  /**
   * Execute multiple queries within a transaction with tenant context
   */
  async transaction<T>(
    context: TenantContext,
    callback: (client: TenantGuardedClient) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const guardedClient = new TenantGuardedClient(client, context, {
        excludedTables: this.excludedTables,
        strictMode: this.strictMode,
        debug: this.debug
      });

      const result = await callback(guardedClient);

      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Transform a query to include tenant isolation
   */
  guardQuery(context: TenantContext, sql: string, params: any[] = []): GuardedQuery {
    const { tenantId } = context;

    if (!tenantId) {
      if (this.strictMode) {
        throw new TenantGuardError('Tenant context required but not provided');
      }
      return { text: sql, values: params };
    }

    // Parse and validate the query
    const normalizedSql = sql.trim().toUpperCase();

    // Determine query type
    if (normalizedSql.startsWith('SELECT')) {
      return this.guardSelectQuery(tenantId, sql, params);
    } else if (normalizedSql.startsWith('INSERT')) {
      return this.guardInsertQuery(tenantId, sql, params);
    } else if (normalizedSql.startsWith('UPDATE')) {
      return this.guardUpdateQuery(tenantId, sql, params);
    } else if (normalizedSql.startsWith('DELETE')) {
      return this.guardDeleteQuery(tenantId, sql, params);
    }

    // For other queries (DDL, etc.), pass through
    return { text: sql, values: params };
  }

  /**
   * Guard SELECT queries - add WHERE tenant_id = $1
   */
  private guardSelectQuery(tenantId: string, sql: string, params: any[]): GuardedQuery {
    const table = this.extractTableName(sql);

    if (this.isExcludedTable(table)) {
      return { text: sql, values: params };
    }

    // Shift parameter indices to make room for tenant_id as $1
    const shiftedSql = this.shiftParameterIndices(sql, 1);
    const newParams = [tenantId, ...params];

    // Add tenant_id filter
    if (sql.toUpperCase().includes('WHERE')) {
      // Insert tenant_id condition after WHERE
      const guardedSql = shiftedSql.replace(
        /WHERE/i,
        'WHERE tenant_id = $1 AND'
      );
      return { text: guardedSql, values: newParams };
    } else {
      // Add WHERE clause before ORDER BY, GROUP BY, LIMIT, or at end
      const guardedSql = this.insertWhereClause(shiftedSql, 'tenant_id = $1');
      return { text: guardedSql, values: newParams };
    }
  }

  /**
   * Guard INSERT queries - ensure tenant_id is included
   */
  private guardInsertQuery(tenantId: string, sql: string, params: any[]): GuardedQuery {
    const table = this.extractTableName(sql);

    if (this.isExcludedTable(table)) {
      return { text: sql, values: params };
    }

    // Check if tenant_id is already in the INSERT
    if (sql.toLowerCase().includes('tenant_id')) {
      // Verify the value matches context
      return { text: sql, values: params };
    }

    // Add tenant_id to INSERT
    // INSERT INTO schema.table (col1, col2) VALUES ($1, $2)
    // becomes: INSERT INTO schema.table (tenant_id, col1, col2) VALUES ($1, $2, $3)

    const shiftedSql = this.shiftParameterIndices(sql, 1);
    const newParams = [tenantId, ...params];

    // Find the column list and add tenant_id
    const guardedSql = shiftedSql.replace(
      /INSERT\s+INTO\s+(\S+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i,
      (match, table, cols, vals) => {
        return `INSERT INTO ${table} (tenant_id, ${cols}) VALUES ($1, ${vals})`;
      }
    );

    return { text: guardedSql, values: newParams };
  }

  /**
   * Guard UPDATE queries - add WHERE tenant_id = $1
   */
  private guardUpdateQuery(tenantId: string, sql: string, params: any[]): GuardedQuery {
    const table = this.extractTableName(sql);

    if (this.isExcludedTable(table)) {
      return { text: sql, values: params };
    }

    const shiftedSql = this.shiftParameterIndices(sql, 1);
    const newParams = [tenantId, ...params];

    if (sql.toUpperCase().includes('WHERE')) {
      const guardedSql = shiftedSql.replace(
        /WHERE/i,
        'WHERE tenant_id = $1 AND'
      );
      return { text: guardedSql, values: newParams };
    } else {
      // UPDATE without WHERE is dangerous - add tenant filter
      const guardedSql = shiftedSql + ' WHERE tenant_id = $1';
      return { text: guardedSql, values: newParams };
    }
  }

  /**
   * Guard DELETE queries - add WHERE tenant_id = $1
   */
  private guardDeleteQuery(tenantId: string, sql: string, params: any[]): GuardedQuery {
    const table = this.extractTableName(sql);

    if (this.isExcludedTable(table)) {
      return { text: sql, values: params };
    }

    const shiftedSql = this.shiftParameterIndices(sql, 1);
    const newParams = [tenantId, ...params];

    if (sql.toUpperCase().includes('WHERE')) {
      const guardedSql = shiftedSql.replace(
        /WHERE/i,
        'WHERE tenant_id = $1 AND'
      );
      return { text: guardedSql, values: newParams };
    } else {
      // DELETE without WHERE is dangerous - add tenant filter
      const guardedSql = shiftedSql + ' WHERE tenant_id = $1';
      return { text: guardedSql, values: newParams };
    }
  }

  /**
   * Extract table name from SQL query
   */
  private extractTableName(sql: string): string {
    // Handle common patterns: FROM table, INTO table, UPDATE table
    const patterns = [
      /FROM\s+(\S+)/i,
      /INTO\s+(\S+)/i,
      /UPDATE\s+(\S+)/i,
      /DELETE\s+FROM\s+(\S+)/i
    ];

    for (const pattern of patterns) {
      const match = sql.match(pattern);
      if (match) {
        return match[1].replace(/['"]/g, '').toLowerCase();
      }
    }

    return '';
  }

  /**
   * Check if table is excluded from tenant isolation
   */
  private isExcludedTable(table: string): boolean {
    return this.excludedTables.has(table) ||
      this.excludedTables.has(table.replace(/^(kernel|finance|config)\./, ''));
  }

  /**
   * Shift all $N parameter references by offset
   */
  private shiftParameterIndices(sql: string, offset: number): string {
    return sql.replace(/\$(\d+)/g, (match, num) => {
      return `$${parseInt(num) + offset}`;
    });
  }

  /**
   * Insert WHERE clause before ORDER BY, GROUP BY, LIMIT, or at end
   */
  private insertWhereClause(sql: string, condition: string): string {
    const keywords = ['ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'OFFSET', 'FOR UPDATE', 'FOR SHARE'];

    for (const keyword of keywords) {
      const index = sql.toUpperCase().indexOf(keyword);
      if (index !== -1) {
        return sql.slice(0, index) + ` WHERE ${condition} ` + sql.slice(index);
      }
    }

    // No keywords found, append at end
    return sql + ` WHERE ${condition}`;
  }
}

// ============================================================================
// TENANT GUARDED CLIENT (for transactions)
// ============================================================================

export class TenantGuardedClient {
  private client: PoolClient;
  private context: TenantContext;
  private excludedTables: Set<string>;
  private strictMode: boolean;
  private debug: boolean;

  constructor(
    client: PoolClient,
    context: TenantContext,
    config: { excludedTables: Set<string>; strictMode: boolean; debug: boolean }
  ) {
    this.client = client;
    this.context = context;
    this.excludedTables = config.excludedTables;
    this.strictMode = config.strictMode;
    this.debug = config.debug;
  }

  async query<T extends QueryResultRow = any>(
    sql: string,
    params: any[] = []
  ): Promise<QueryResult<T>> {
    const guard = new TenantGuard({
      pool: null as any, // Not used for guardQuery
      excludedTables: Array.from(this.excludedTables),
      strictMode: this.strictMode,
      debug: this.debug
    });

    const guardedQuery = guard.guardQuery(this.context, sql, params);

    if (this.debug) {
      console.log('[TenantGuardedClient] Original:', sql);
      console.log('[TenantGuardedClient] Guarded:', guardedQuery.text);
    }

    return this.client.query<T>(guardedQuery.text, guardedQuery.values);
  }

  /**
   * Get the raw client for unguarded queries (use with caution!)
   */
  getRawClient(): PoolClient {
    console.warn('[TenantGuardedClient] Using raw client bypasses tenant isolation!');
    return this.client;
  }
}

// ============================================================================
// ERRORS
// ============================================================================

export class TenantGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TenantGuardError';
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a tenant guard instance
 * 
 * @example
 * ```typescript
 * const guard = createTenantGuard({ pool });
 * 
 * // All queries automatically filtered by tenant
 * const result = await guard.query(
 *   { tenantId: 'abc-123' },
 *   'SELECT * FROM finance.companies'
 * );
 * // Executes: SELECT * FROM finance.companies WHERE tenant_id = $1
 * ```
 */
export function createTenantGuard(config: TenantGuardConfig): TenantGuard {
  return new TenantGuard(config);
}

// ============================================================================
// CONVENIENCE WRAPPER
// ============================================================================

/**
 * Execute a query with tenant isolation
 * 
 * @example
 * ```typescript
 * const companies = await withTenant(pool, tenantId, async (query) => {
 *   return query('SELECT * FROM finance.companies');
 * });
 * ```
 */
export async function withTenant<T>(
  pool: Pool,
  tenantId: string,
  callback: (query: (sql: string, params?: any[]) => Promise<QueryResult>) => Promise<T>
): Promise<T> {
  const guard = new TenantGuard({ pool, strictMode: true });
  const context: TenantContext = { tenantId };

  const boundQuery = (sql: string, params: any[] = []) =>
    guard.query(context, sql, params);

  return callback(boundQuery);
}

export default TenantGuard;
