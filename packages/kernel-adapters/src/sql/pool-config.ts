/**
 * PostgreSQL Connection Pool Configuration
 * 
 * Optimized pool settings for production use.
 * 
 * @file packages/kernel-adapters/src/sql/pool-config.ts
 */

import type { PoolConfig } from 'pg';

/**
 * Environment-specific pool configurations
 */
export interface PoolConfigOptions {
  /** Max connections (default: 20) */
  maxConnections?: number;
  /** Idle timeout in ms (default: 30000) */
  idleTimeoutMillis?: number;
  /** Connection timeout in ms (default: 10000) */
  connectionTimeoutMillis?: number;
  /** Statement timeout in ms (default: 60000) */
  statementTimeoutMillis?: number;
  /** Enable SSL (default: true in production) */
  enableSsl?: boolean;
}

/**
 * Create optimized pool configuration
 */
export function createPoolConfig(
  connectionString: string,
  options: PoolConfigOptions = {}
): PoolConfig {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    connectionString,

    // Connection pool size
    max: options.maxConnections ?? (isProduction ? 20 : 10),
    min: isProduction ? 2 : 1,

    // Timeouts
    idleTimeoutMillis: options.idleTimeoutMillis ?? 30000, // 30s
    connectionTimeoutMillis: options.connectionTimeoutMillis ?? 10000, // 10s

    // SSL configuration
    ssl: options.enableSsl ?? isProduction
      ? { rejectUnauthorized: false }
      : undefined,

    // Statement timeout (prevent long-running queries)
    statement_timeout: options.statementTimeoutMillis ?? 60000, // 60s

    // Application name for monitoring
    application_name: 'aibos-finance',

    // Keep connections alive
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  };
}

/**
 * Default pool configuration from environment
 */
export function getDefaultPoolConfig(): PoolConfig {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL or POSTGRES_URL environment variable is required');
  }

  return createPoolConfig(connectionString, {
    maxConnections: process.env.DB_POOL_SIZE
      ? parseInt(process.env.DB_POOL_SIZE, 10)
      : undefined,
    statementTimeoutMillis: process.env.DB_STATEMENT_TIMEOUT
      ? parseInt(process.env.DB_STATEMENT_TIMEOUT, 10)
      : undefined,
  });
}

/**
 * Pool health check query
 */
export const HEALTH_CHECK_QUERY = 'SELECT 1 as healthy';

/**
 * Set tenant context for RLS
 */
export function setTenantContextSQL(tenantId: string): string {
  return `SET app.current_tenant_id = '${tenantId}'`;
}
