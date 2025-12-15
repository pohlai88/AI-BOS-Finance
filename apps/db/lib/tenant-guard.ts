/**
 * AI-BOS Tenant Isolation Guard (DEPRECATED)
 * 
 * @deprecated Use `lib/tenant-db.ts` (TenantDb) instead
 * 
 * This module is DEPRECATED due to security concerns:
 * - SQL string rewriting can corrupt complex queries
 * - Parameter index shifting is error-prone
 * - Regex-based parsing cannot handle all SQL patterns
 * 
 * The new TenantDb class provides:
 * - Compile-time whitelist for table/column identifiers
 * - Parameterized queries only (no string interpolation)
 * - Type-safe operations with explicit column lists
 * 
 * @see lib/tenant-db.ts for the new implementation
 * @version 1.0.0 (DEPRECATED)
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

// Re-export new implementation
export {
  TenantDb,
  TenantTransaction,
  TenantContext,
  TenantDbError,
  createTenantDb,
  assertTenantContext,
  assertValidTable,
  isTenantScoped,
  TENANT_SCOPED_TABLES,
  GLOBAL_TABLES,
} from './tenant-db';

// ============================================================================
// DEPRECATED TYPES (kept for backward compatibility)
// ============================================================================

/** @deprecated Use TenantContext from tenant-db.ts */
export interface LegacyTenantContext {
  tenantId: string;
  userId?: string;
  schema?: 'kernel' | 'finance' | 'config';
}

/** @deprecated Use TenantDbError from tenant-db.ts */
export class TenantIsolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TenantIsolationError';
    console.warn('[DEPRECATED] TenantIsolationError is deprecated. Use TenantDbError from tenant-db.ts');
  }
}

// ============================================================================
// DEPRECATED GUARD CLASS
// ============================================================================

/**
 * @deprecated Use TenantDb from tenant-db.ts instead
 * 
 * This class is kept for backward compatibility only.
 * All new code should use TenantDb.
 */
export class TenantGuard {
  private pool: Pool;
  private strictMode: boolean;
  private debug: boolean;

  constructor(config: { pool: Pool; strictMode?: boolean; debug?: boolean }) {
    console.warn(
      '[DEPRECATED] TenantGuard is deprecated and will be removed in v2.0.\n' +
      'Use TenantDb from lib/tenant-db.ts instead.\n' +
      'See GA-PATCHLIST.md Patch 1 for migration guide.'
    );

    this.pool = config.pool;
    this.strictMode = config.strictMode ?? true;
    this.debug = config.debug ?? false;
  }

  /**
   * @deprecated Use TenantDb.select() instead
   */
  async query<T extends QueryResultRow = any>(
    context: LegacyTenantContext,
    sql: string,
    params: any[] = []
  ): Promise<QueryResult<T>> {
    console.warn('[DEPRECATED] TenantGuard.query() is deprecated. Use TenantDb.select()');

    // Basic validation
    if (!context?.tenantId) {
      throw new TenantIsolationError('Tenant context required');
    }

    // For backward compatibility, still execute but log warning
    // This is intentionally NOT using the old SQL rewriting logic
    // to prevent the security issues

    // If the query already has tenant_id parameter, execute as-is
    if (sql.toLowerCase().includes('tenant_id')) {
      return this.pool.query<T>(sql, params);
    }

    // Otherwise, refuse to execute without explicit tenant filter
    throw new TenantIsolationError(
      'Query must include explicit tenant_id filter. ' +
      'Use TenantDb from lib/tenant-db.ts for safe tenant-scoped queries.'
    );
  }

  /**
   * @deprecated Use TenantDb.withTransaction() instead
   */
  async transaction<T>(
    context: LegacyTenantContext,
    callback: (client: DeprecatedTenantGuardedClient) => Promise<T>
  ): Promise<T> {
    console.warn('[DEPRECATED] TenantGuard.transaction() is deprecated. Use TenantDb.withTransaction()');

    if (!context?.tenantId) {
      throw new TenantIsolationError('Tenant context required');
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const guardedClient = new DeprecatedTenantGuardedClient(client, context);
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
}

/**
 * @deprecated Use TenantTransaction from tenant-db.ts instead
 */
class DeprecatedTenantGuardedClient {
  constructor(
    private client: PoolClient,
    private context: LegacyTenantContext
  ) {
    console.warn('[DEPRECATED] TenantGuardedClient is deprecated. Use TenantTransaction');
  }

  async query<T extends QueryResultRow = any>(
    sql: string,
    params: any[] = []
  ): Promise<QueryResult<T>> {
    // Refuse queries without explicit tenant filter
    if (!sql.toLowerCase().includes('tenant_id')) {
      throw new TenantIsolationError(
        'Query must include explicit tenant_id filter. ' +
        'Use TenantTransaction from lib/tenant-db.ts'
      );
    }

    return this.client.query<T>(sql, params);
  }

  /** @deprecated */
  getRawClient(): PoolClient {
    console.warn('[DEPRECATED] getRawClient() bypasses tenant isolation - DO NOT USE');
    return this.client;
  }
}

// ============================================================================
// DEPRECATED FACTORY FUNCTIONS
// ============================================================================

/**
 * @deprecated Use createTenantDb() from tenant-db.ts instead
 */
export function createTenantGuard(config: { pool: Pool; strictMode?: boolean; debug?: boolean }): TenantGuard {
  console.warn('[DEPRECATED] createTenantGuard() is deprecated. Use createTenantDb()');
  return new TenantGuard(config);
}

/**
 * @deprecated Use TenantDb instead
 */
export async function withTenant<T>(
  pool: Pool,
  tenantId: string,
  callback: (query: (sql: string, params?: any[]) => Promise<QueryResult>) => Promise<T>
): Promise<T> {
  console.warn('[DEPRECATED] withTenant() is deprecated. Use TenantDb');

  throw new TenantIsolationError(
    'withTenant() is deprecated and disabled for security reasons. ' +
    'Use TenantDb from lib/tenant-db.ts instead.'
  );
}

// ============================================================================
// DEPRECATED UTILITY FUNCTIONS
// ============================================================================

/**
 * @deprecated Validation is now built into TenantDb
 */
export function requireTenantContext(context: LegacyTenantContext | undefined): asserts context is LegacyTenantContext {
  console.warn('[DEPRECATED] requireTenantContext() is deprecated. Use assertTenantContext()');

  if (!context || !context.tenantId) {
    throw new TenantIsolationError('Tenant context required');
  }

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_REGEX.test(context.tenantId)) {
    throw new TenantIsolationError(`Invalid tenant_id format: ${context.tenantId}`);
  }
}

/**
 * @deprecated SQL rewriting is disabled for security
 */
export function appendTenantFilter(sql: string, tenantId: string): string {
  throw new TenantIsolationError(
    'appendTenantFilter() is disabled for security reasons. ' +
    'SQL rewriting can corrupt queries and enable injection attacks. ' +
    'Use TenantDb from lib/tenant-db.ts instead.'
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default TenantGuard;
