/**
 * Test Setup for AP-01 Vendor Master
 * 
 * Provides test utilities for both unit and integration tests.
 * Database setup is optional and only loaded when needed.
 */

// Database setup (optional - only for integration tests)
let pgModule: typeof import('pg') | null = null;
let execSync: typeof import('child_process').execSync | null = null;

async function loadDatabaseModules() {
  if (!pgModule) {
    try {
      pgModule = await import('pg');
      const childProcess = await import('child_process');
      execSync = childProcess.execSync;
    } catch (error) {
      // pg not available - that's ok for unit tests
      return null;
    }
  }
  return { Pool: pgModule.Pool, execSync };
}

const DATABASE_URL = process.env.DATABASE_URL ||
  'postgresql://aibos:aibos_password@localhost:5433/aibos_local';

let pool: any = null;

export async function setupTestDatabase(): Promise<any> {
  const modules = await loadDatabaseModules();
  if (!modules) {
    throw new Error('pg module not available. Install with: pnpm add -D pg @types/pg');
  }

  const { Pool } = modules;
  
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
  if (modules.execSync) {
    try {
      modules.execSync('pnpm --filter @aibos/db migrate', {
        stdio: 'pipe',
        env: { ...process.env, DATABASE_URL }
      });
    } catch (error) {
      // Check if core tables exist
      try {
        await pool.query('SELECT 1 FROM ap.vendors LIMIT 1');
      } catch {
        throw new Error(
          `Database tables not found. Please run migrations manually: pnpm --filter @aibos/db migrate`
        );
      }
    }
  }

  return pool;
}

export async function cleanupTestDatabase(pool: any): Promise<void> {
  if (!pool) return;
  
  await pool.query(`
    TRUNCATE 
      ap.vendors, 
      ap.vendor_bank_accounts, 
      kernel.audit_events
    CASCADE
  `);
  await pool.end();
  pool = null;
}

export function getTestPool(): any {
  if (!pool) throw new Error('Database not initialized. Call setupTestDatabase() first.');
  return pool;
}

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Create a test actor context
 */
export function createTestActor() {
  return {
    userId: 'test-user-123',
    tenantId: 'test-tenant-123',
    permissions: ['ap.vendor.create', 'ap.vendor.read', 'ap.vendor.update', 'ap.vendor.approve'],
  };
}

/**
 * Create a test transaction context
 */
export function createTestTransactionContext() {
  return {
    transactionId: 'test-txn-123',
    tenantId: 'test-tenant-123',
  };
}
