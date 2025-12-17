/**
 * AP-03 3-Way Match Engine - Integration Test Setup
 * 
 * Database setup and utilities for integration testing.
 * 
 * @file apps/canon/finance/dom03-accounts-payable/cells/ap03-3way-engine/__tests__/integration/setup.ts
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
    
    // Clean up match-related data
    await client.query(`DELETE FROM ap.match_exceptions WHERE tenant_id = $1`, [TEST_TENANT_ID]);
    await client.query(`DELETE FROM ap.match_results WHERE tenant_id = $1`, [TEST_TENANT_ID]);
    
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
    roles: ['ap-clerk', 'ap-match-override'],
    ...overrides,
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
 * Insert test invoice for matching
 */
export async function insertTestInvoice(pool: Pool, overrides: Partial<{
  id: string;
  vendorId: string;
  invoiceNumber: string;
  totalAmountCents: number;
  status: string;
  poNumber: string;
}> = {}): Promise<string> {
  const id = overrides.id || uuidv4();
  const client = await pool.connect();
  try {
    await client.query(`
      INSERT INTO ap.invoices (
        id, tenant_id, company_id, vendor_id, vendor_invoice_number,
        invoice_date, due_date, subtotal_cents, tax_amount_cents, total_amount_cents,
        currency, status, created_by, version, po_number
      ) VALUES (
        $1, $2, $3, $4, $5,
        CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', $6, 0, $6,
        'USD', $7, $8, 1, $9
      )
    `, [
      id,
      TEST_TENANT_ID,
      TEST_COMPANY_ID,
      overrides.vendorId || TEST_VENDOR_ID,
      overrides.invoiceNumber || `INV-${Date.now()}`,
      overrides.totalAmountCents || 10000,
      overrides.status || 'submitted',
      TEST_USER_ID,
      overrides.poNumber || null,
    ]);
    return id;
  } finally {
    client.release();
  }
}

/**
 * Insert test match result
 */
export async function insertTestMatchResult(pool: Pool, overrides: Partial<{
  id: string;
  invoiceId: string;
  matchMode: string;
  matchStatus: string;
  matchScore: number;
}> = {}): Promise<string> {
  const id = overrides.id || uuidv4();
  const invoiceId = overrides.invoiceId || uuidv4();
  const client = await pool.connect();
  try {
    await client.query(`
      INSERT INTO ap.match_results (
        id, tenant_id, invoice_id, match_mode, match_status,
        match_score, evaluated_at, evaluated_by, version
      ) VALUES (
        $1, $2, $3, $4, $5, $6, NOW(), $7, 1
      )
    `, [
      id,
      TEST_TENANT_ID,
      invoiceId,
      overrides.matchMode || '3-way',
      overrides.matchStatus || 'passed',
      overrides.matchScore || 100,
      TEST_USER_ID,
    ]);
    return id;
  } finally {
    client.release();
  }
}
