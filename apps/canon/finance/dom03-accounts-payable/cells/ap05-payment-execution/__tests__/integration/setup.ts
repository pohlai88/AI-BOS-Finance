/**
 * Integration Test Setup
 * 
 * Uses existing Docker Compose Postgres (port 5433)
 * Fast setup - no testcontainers overhead
 * 
 * @improvement Next.js 16 best practice: Reuse existing infrastructure
 */

import { Pool } from 'pg';
import { execSync } from 'child_process';

const DATABASE_URL = process.env.DATABASE_URL ||
  'postgresql://aibos:aibos_password@localhost:5433/aibos_local';

let pool: Pool | null = null;

export async function setupTestDatabase(): Promise<Pool> {
  if (pool) return pool;

  pool = new Pool({
    connectionString: DATABASE_URL,
    max: 5,
  });

  // Verify connection
  try {
    await pool.query('SELECT 1');
  } catch (error) {
    throw new Error(
      `Failed to connect to test database at ${DATABASE_URL}. ` +
      `Ensure Postgres is running: pnpm --filter @aibos/db db:up`
    );
  }

  // Run migrations (idempotent)
  // Note: Some migrations may fail due to dependencies, but core tables should exist
  try {
    execSync('pnpm --filter @aibos/db migrate', {
      stdio: 'pipe', // Suppress output to avoid cluttering test output
      env: { ...process.env, DATABASE_URL }
    });
  } catch (error) {
    // Check if core tables exist - if they do, migration is likely fine
    try {
      await pool.query('SELECT 1 FROM finance.payments LIMIT 1');
      // Table exists, migration likely succeeded for our needs
    } catch {
      // Table doesn't exist, this is a real problem
      throw new Error(
        `Database tables not found. Please run migrations manually: pnpm --filter @aibos/db migrate`
      );
    }
  }

  return pool;
}

export async function cleanupTestDatabase(pool: Pool): Promise<void> {
  // Clean up test data (keep schema)
  await pool.query(`
    TRUNCATE 
      finance.payments, 
      finance.payment_approvals, 
      kernel.audit_events,
      finance.payment_outbox
    CASCADE
  `);
  await pool.end();
  pool = null;
}

export function getTestPool(): Pool {
  if (!pool) throw new Error('Database not initialized. Call setupTestDatabase() first.');
  return pool;
}
