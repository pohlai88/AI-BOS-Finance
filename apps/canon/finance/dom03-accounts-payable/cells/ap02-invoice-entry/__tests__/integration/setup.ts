/**
 * Integration Test Setup
 * 
 * Provides real database connection and test utilities for AP-02 integration tests.
 * 
 * @file apps/canon/finance/dom03-accounts-payable/cells/ap02-invoice-entry/__tests__/integration/setup.ts
 */

import type { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// 1. DATABASE CONNECTION
// ============================================================================

let pool: Pool | null = null;

/**
 * Get database pool for integration tests
 */
export async function getTestPool(): Promise<Pool> {
  if (pool) return pool;

  // Dynamic import to avoid issues in non-Node environments
  const { Pool: PgPool } = await import('pg');

  const databaseUrl = process.env.DATABASE_URL || 'postgresql://aibos:aibos_password@localhost:5433/aibos_local';

  pool = new PgPool({
    connectionString: databaseUrl,
    max: 5,
    idleTimeoutMillis: 30000,
  });

  // Test connection
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('[TEST] Database connected successfully');
  } catch (error) {
    console.error('[TEST] Database connection failed:', error);
    throw error;
  }

  return pool;
}

/**
 * Close database pool
 */
export async function closeTestPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('[TEST] Database pool closed');
  }
}

// ============================================================================
// 2. TEST DATA FIXTURES
// ============================================================================

export const TEST_TENANT_ID = '00000000-0000-0000-0000-000000000099';
export const TEST_COMPANY_ID = '00000000-0000-0000-0000-000000000099';
export const TEST_VENDOR_ID = '00000000-0000-0000-0000-000000000099';
export const TEST_USER_ID = '00000000-0000-0000-0000-000000000099';

export interface TestActorContext {
  userId: string;
  tenantId: string;
  companyId: string;
  sessionId: string;
  type: 'user';
  roles: string[];
}

/**
 * Create a test actor context
 */
export function createIntegrationTestActor(overrides?: Partial<TestActorContext>): TestActorContext {
  return {
    userId: TEST_USER_ID,
    tenantId: TEST_TENANT_ID,
    companyId: TEST_COMPANY_ID,
    sessionId: `session-${uuidv4()}`,
    type: 'user',
    roles: ['ap_maker', 'ap_approver'],
    ...overrides,
  };
}

// ============================================================================
// 3. DATABASE CLEANUP
// ============================================================================

/**
 * Clean up test data before/after tests
 */
export async function cleanupTestData(testPool: Pool): Promise<void> {
  const client = await testPool.connect();
  try {
    await client.query('BEGIN');

    // Delete in order respecting foreign keys
    await client.query('DELETE FROM ap.invoice_lines WHERE tenant_id = $1', [TEST_TENANT_ID]);
    await client.query('DELETE FROM ap.invoices WHERE tenant_id = $1', [TEST_TENANT_ID]);

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Insert test vendor for invoice tests
 */
export async function insertTestVendor(testPool: Pool): Promise<void> {
  const client = await testPool.connect();
  try {
    // Check if vendor exists
    const existing = await client.query(
      'SELECT id FROM ap.vendors WHERE id = $1',
      [TEST_VENDOR_ID]
    );

    if (existing.rows.length === 0) {
      await client.query(`
        INSERT INTO ap.vendors (
          id, tenant_id, vendor_code, legal_name, country,
          currency_preference, status, created_by, version
        ) VALUES (
          $1, $2, 'TEST-VENDOR', 'Test Vendor Inc', 'US',
          'USD', 'approved', $3, 1
        )
      `, [TEST_VENDOR_ID, TEST_TENANT_ID, TEST_USER_ID]);
    }
  } finally {
    client.release();
  }
}

// ============================================================================
// 4. TEST DATA FACTORIES
// ============================================================================

export interface TestInvoiceInput {
  invoiceNumber?: string;
  invoiceDate?: Date;
  dueDate?: Date;
  reference?: string;
  vendorId?: string;
  subtotalCents?: number;
  taxAmountCents?: number;
  currency?: string;
  lines?: TestLineInput[];
}

export interface TestLineInput {
  lineNumber?: number;
  description?: string;
  quantity?: number;
  unitPriceCents?: number;
  debitAccountCode?: string;
  creditAccountCode?: string;
  costCenter?: string;
  projectCode?: string;
}

let invoiceCounter = 0;

/**
 * Create test invoice input with defaults
 */
export function createIntegrationTestInvoiceInput(overrides?: Partial<TestInvoiceInput>): TestInvoiceInput {
  invoiceCounter++;
  const defaultLine: TestLineInput = {
    lineNumber: 1,
    description: 'Test Item',
    quantity: 1,
    unitPriceCents: 10000,
    debitAccountCode: '5100',
    creditAccountCode: '2000',
  };

  const lines = overrides?.lines || [defaultLine];
  const subtotalCents = lines.reduce((sum, line) => {
    const qty = line.quantity || 1;
    const price = line.unitPriceCents || 0;
    return sum + Math.round(qty * price);
  }, 0);
  const taxAmountCents = overrides?.taxAmountCents ?? 0;

  return {
    invoiceNumber: `INV-${Date.now()}-${invoiceCounter}`,
    invoiceDate: new Date('2025-01-15'),
    dueDate: new Date('2025-02-15'),
    vendorId: TEST_VENDOR_ID,
    subtotalCents,
    taxAmountCents,
    currency: 'USD',
    lines,
    ...overrides,
  };
}
