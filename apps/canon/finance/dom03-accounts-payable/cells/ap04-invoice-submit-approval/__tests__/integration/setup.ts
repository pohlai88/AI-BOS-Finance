/**
 * AP-04 Invoice Approval Workflow - Integration Test Setup
 * 
 * Database setup and utilities for integration testing.
 * 
 * @file apps/canon/finance/dom03-accounts-payable/cells/ap04-invoice-submit-approval/__tests__/integration/setup.ts
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import type { ActorContext } from '@aibos/canon-governance';

// ============================================================================
// TEST CONSTANTS
// ============================================================================

export const TEST_TENANT_ID = '00000000-0000-0000-0000-000000000001';
export const TEST_COMPANY_ID = '00000000-0000-0000-0000-000000000002';
export const TEST_VENDOR_ID = '00000000-0000-0000-0000-000000000003';
export const TEST_USER_ID = '00000000-0000-0000-0000-000000000004';
export const TEST_APPROVER_ID = '00000000-0000-0000-0000-000000000005';
export const TEST_APPROVER_L2_ID = '00000000-0000-0000-0000-000000000006';

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

let pool: Pool | null = null;

/**
 * Get test database pool
 */
export async function getTestPool(): Promise<Pool> {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL || 
      'postgresql://postgres:postgres@localhost:5433/aibos_test';
    
    pool = new Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 30000,
    });

    // Verify connection
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
    } finally {
      client.release();
    }
  }
  return pool;
}

/**
 * Close test database pool
 */
export async function closeTestPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// ============================================================================
// TEST DATA CLEANUP
// ============================================================================

/**
 * Clean up test data between tests
 */
export async function cleanupTestData(pool: Pool): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Clean up approval-related data
    await client.query(`DELETE FROM ap.invoice_approvals WHERE tenant_id = $1`, [TEST_TENANT_ID]);
    await client.query(`DELETE FROM ap.approval_routes WHERE tenant_id = $1`, [TEST_TENANT_ID]);
    
    // Clean up invoices if table exists
    await client.query(`DELETE FROM ap.invoices WHERE tenant_id = $1`, [TEST_TENANT_ID]).catch(() => {});
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

/**
 * Create integration test actor
 */
export function createIntegrationTestActor(overrides: Partial<ActorContext> = {}): ActorContext {
  return {
    userId: TEST_USER_ID,
    tenantId: TEST_TENANT_ID,
    roles: ['ap-clerk'],
    ...overrides,
  };
}

/**
 * Create approver actor
 */
export function createApproverActor(level: number = 1): ActorContext {
  return {
    userId: level === 1 ? TEST_APPROVER_ID : TEST_APPROVER_L2_ID,
    tenantId: TEST_TENANT_ID,
    roles: [`ap-approver-l${level}`],
  };
}

/**
 * Insert test vendor
 */
export async function insertTestVendor(pool: Pool): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      INSERT INTO ap.vendors (
        id, tenant_id, company_id, vendor_code, legal_name, 
        status, created_by, version
      ) VALUES (
        $1, $2, $3, 'TEST-VENDOR', 'Test Vendor Inc',
        'approved', $4, 1
      )
      ON CONFLICT (id) DO NOTHING
    `, [TEST_VENDOR_ID, TEST_TENANT_ID, TEST_COMPANY_ID, TEST_USER_ID]);
  } finally {
    client.release();
  }
}

/**
 * Insert test invoice for approval
 */
export async function insertTestInvoice(pool: Pool, overrides: Partial<{
  id: string;
  vendorId: string;
  invoiceNumber: string;
  totalAmountCents: number;
  status: string;
}> = {}): Promise<string> {
  const id = overrides.id || uuidv4();
  const client = await pool.connect();
  try {
    await client.query(`
      INSERT INTO ap.invoices (
        id, tenant_id, company_id, vendor_id, vendor_invoice_number,
        invoice_date, due_date, subtotal_cents, tax_amount_cents, total_amount_cents,
        currency, status, created_by, version
      ) VALUES (
        $1, $2, $3, $4, $5,
        CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', $6, 0, $6,
        'USD', $7, $8, 1
      )
    `, [
      id,
      TEST_TENANT_ID,
      TEST_COMPANY_ID,
      overrides.vendorId || TEST_VENDOR_ID,
      overrides.invoiceNumber || `INV-${Date.now()}`,
      overrides.totalAmountCents || 10000,
      overrides.status || 'matched',
      TEST_USER_ID,
    ]);
    return id;
  } finally {
    client.release();
  }
}

/**
 * Insert test approval route
 */
export async function insertTestApprovalRoute(pool: Pool, overrides: Partial<{
  id: string;
  minAmountCents: number;
  maxAmountCents: number;
  requiredLevels: number;
}> = {}): Promise<string> {
  const id = overrides.id || uuidv4();
  const client = await pool.connect();
  try {
    await client.query(`
      INSERT INTO ap.approval_routes (
        id, tenant_id, company_id, name,
        min_amount_cents, max_amount_cents, required_levels,
        is_active, created_at
      ) VALUES (
        $1, $2, $3, 'Test Route',
        $4, $5, $6,
        TRUE, NOW()
      )
    `, [
      id,
      TEST_TENANT_ID,
      TEST_COMPANY_ID,
      overrides.minAmountCents || 0,
      overrides.maxAmountCents || 100000000,
      overrides.requiredLevels || 1,
    ]);
    return id;
  } finally {
    client.release();
  }
}
