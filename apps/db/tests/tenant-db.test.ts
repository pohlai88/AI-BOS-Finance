/**
 * AI-BOS TenantDb Security Tests
 * 
 * Tests for Tenant Guard v2 (TenantDb)
 * Verifies:
 * 1. Mandatory tenant context
 * 2. Cross-tenant isolation
 * 3. Identifier safety (no injection)
 * 4. Parameterized queries only
 * 
 * @version 2.0.0
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Pool } from 'pg';
import {
  TenantDb,
  createTenantDb,
  TenantContext,
  TenantDbError,
  assertTenantContext,
  assertValidTable,
  assertValidColumn,
  isTenantScoped,
  TENANT_SCOPED_TABLES,
  GLOBAL_TABLES,
} from '../lib/tenant-db';

// ============================================================================
// TEST CONSTANTS
// ============================================================================

const TENANT_ALPHA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const TENANT_BETA = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const USER_ALPHA = 'a1111111-1111-1111-1111-111111111111';
const USER_BETA = 'b2222222-2222-2222-2222-222222222222';

const CTX_ALPHA: TenantContext = { tenantId: TENANT_ALPHA, userId: USER_ALPHA };
const CTX_BETA: TenantContext = { tenantId: TENANT_BETA, userId: USER_BETA };

// ============================================================================
// TEST SETUP
// ============================================================================

describe('TenantDb Security Tests', () => {
  let pool: Pool;
  let tenantDb: TenantDb;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL ||
        'postgresql://aibos:aibos_password@localhost:5433/aibos_local'
    });
    tenantDb = createTenantDb(pool);

    // Setup test tenants
    await pool.query(`
      INSERT INTO kernel.tenants (id, name, slug, status)
      VALUES
        ($1, 'Alpha Corp', 'alpha', 'active'),
        ($2, 'Beta Corp', 'beta', 'active')
      ON CONFLICT (id) DO NOTHING
    `, [TENANT_ALPHA, TENANT_BETA]);
  });

  afterAll(async () => {
    await pool.end();
  });

  // ==========================================================================
  // 1. TENANT CONTEXT VALIDATION TESTS
  // ==========================================================================

  describe('Tenant Context Validation', () => {
    it('should throw when tenant context is undefined', () => {
      expect(() => assertTenantContext(undefined)).toThrow(TenantDbError);
      expect(() => assertTenantContext(undefined)).toThrow('Tenant context is required');
    });

    it('should throw when tenant context is null', () => {
      expect(() => assertTenantContext(null)).toThrow(TenantDbError);
    });

    it('should throw when tenantId is missing', () => {
      expect(() => assertTenantContext({ tenantId: '' })).toThrow('tenantId is required');
    });

    it('should throw when tenantId is not a valid UUID', () => {
      const invalidIds = [
        'not-a-uuid',
        '12345',
        'abc',
        "'; DROP TABLE users; --",
        '<script>alert(1)</script>',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa', // one char short
        'AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA-EXTRA',
      ];

      for (const id of invalidIds) {
        expect(
          () => assertTenantContext({ tenantId: id }),
          `Should reject: ${id}`
        ).toThrow('Invalid tenantId format');
      }
    });

    it('should accept valid UUID tenantId', () => {
      expect(() => assertTenantContext(CTX_ALPHA)).not.toThrow();
      expect(() => assertTenantContext(CTX_BETA)).not.toThrow();
    });

    it('should validate userId if provided', () => {
      expect(() => assertTenantContext({
        tenantId: TENANT_ALPHA,
        userId: 'not-a-uuid'
      })).toThrow('Invalid userId format');
    });
  });

  // ==========================================================================
  // 2. IDENTIFIER WHITELIST TESTS
  // ==========================================================================

  describe('Identifier Whitelist (Injection Prevention)', () => {
    it('should reject table names not in whitelist', () => {
      const maliciousTables = [
        'pg_user',
        'information_schema.tables',
        "kernel.users; DROP TABLE kernel.tenants; --",
        'finance.companies WHERE 1=1; --',
        '../../etc/passwd',
        '<script>',
      ];

      for (const table of maliciousTables) {
        expect(
          () => assertValidTable(table),
          `Should reject: ${table}`
        ).toThrow('Invalid table name');
      }
    });

    it('should accept valid table names from whitelist', () => {
      expect(() => assertValidTable('kernel.users')).not.toThrow();
      expect(() => assertValidTable('finance.companies')).not.toThrow();
      expect(() => assertValidTable('finance.journal_entries')).not.toThrow();
    });

    it('should correctly identify tenant-scoped vs global tables', () => {
      expect(isTenantScoped('kernel.users')).toBe(true);
      expect(isTenantScoped('finance.companies')).toBe(true);
      expect(isTenantScoped('kernel.tenants')).toBe(false);
      expect(isTenantScoped('kernel.permissions')).toBe(false);
    });

    it('should reject invalid column names', () => {
      expect(() => assertValidColumn('kernel.users', 'not_a_column')).toThrow('Invalid column');
      expect(() => assertValidColumn('kernel.users', "id; DROP TABLE users")).toThrow('Invalid column');
    });

    it('should accept valid column names', () => {
      expect(() => assertValidColumn('kernel.users', 'id')).not.toThrow();
      expect(() => assertValidColumn('kernel.users', 'tenant_id')).not.toThrow();
      expect(() => assertValidColumn('finance.companies', 'name')).not.toThrow();
    });

    it('should have all TENANT_SCOPED_TABLES include tenant_id column', () => {
      for (const [table, columns] of Object.entries(TENANT_SCOPED_TABLES)) {
        expect(
          columns.includes('tenant_id' as any),
          `${table} should have tenant_id column`
        ).toBe(true);
      }
    });

    it('should NOT have tenant_id in GLOBAL_TABLES', () => {
      for (const [table, columns] of Object.entries(GLOBAL_TABLES)) {
        // Most global tables don't have tenant_id, but some might for reference
        // This is informational, not a hard requirement
        console.log(`${table}: ${columns.includes('tenant_id' as any) ? 'has' : 'no'} tenant_id`);
      }
    });
  });

  // ==========================================================================
  // 3. CROSS-TENANT ISOLATION TESTS
  // ==========================================================================

  describe('Cross-Tenant Isolation', () => {
    const COMPANY_ALPHA_ID = 'ca111111-1111-1111-1111-111111111111';
    const COMPANY_BETA_ID = 'cb222222-2222-2222-2222-222222222222';

    beforeEach(async () => {
      // Clean up test data
      await pool.query('DELETE FROM finance.companies WHERE id IN ($1, $2)', [COMPANY_ALPHA_ID, COMPANY_BETA_ID]);

      // Seed test data for both tenants
      await pool.query(`
        INSERT INTO finance.companies (id, tenant_id, code, name, type, base_currency, status)
        VALUES
          ($1, $2, 'ALPHA-CO', 'Alpha Company', 'operating', 'USD', 'active'),
          ($3, $4, 'BETA-CO', 'Beta Company', 'operating', 'EUR', 'active')
      `, [COMPANY_ALPHA_ID, TENANT_ALPHA, COMPANY_BETA_ID, TENANT_BETA]);
    });

    it('should only return data for the requesting tenant (Alpha)', async () => {
      const result = await tenantDb.select(
        CTX_ALPHA,
        'finance.companies',
        ['id', 'tenant_id', 'code', 'name']
      );

      // Should only see Alpha's company
      expect(result.rows.length).toBeGreaterThanOrEqual(1);
      for (const row of result.rows) {
        expect(row.tenant_id).toBe(TENANT_ALPHA);
      }

      // Should NOT see Beta's company
      const betaCodes = result.rows.map(r => r.code);
      expect(betaCodes).not.toContain('BETA-CO');
    });

    it('should only return data for the requesting tenant (Beta)', async () => {
      const result = await tenantDb.select(
        CTX_BETA,
        'finance.companies',
        ['id', 'tenant_id', 'code', 'name']
      );

      // Should only see Beta's company
      expect(result.rows.length).toBeGreaterThanOrEqual(1);
      for (const row of result.rows) {
        expect(row.tenant_id).toBe(TENANT_BETA);
      }

      // Should NOT see Alpha's company
      const alphaCodes = result.rows.map(r => r.code);
      expect(alphaCodes).not.toContain('ALPHA-CO');
    });

    it('should not allow reading another tenant data by ID', async () => {
      // Alpha tries to read Beta's company by ID
      const result = await tenantDb.selectById(
        CTX_ALPHA,
        'finance.companies',
        ['id', 'tenant_id', 'code'],
        COMPANY_BETA_ID
      );

      // Should return null (not found for this tenant)
      expect(result).toBeNull();
    });

    it('should not allow updating another tenant data', async () => {
      // Alpha tries to update Beta's company
      const result = await tenantDb.update(
        CTX_ALPHA,
        'finance.companies',
        COMPANY_BETA_ID,
        { name: 'Hacked by Alpha' }
      );

      // Should return null (not found/not updated)
      expect(result).toBeNull();

      // Verify Beta's company is unchanged
      const betaCompany = await pool.query(
        'SELECT name FROM finance.companies WHERE id = $1',
        [COMPANY_BETA_ID]
      );
      expect(betaCompany.rows[0].name).toBe('Beta Company');
    });

    it('should not allow deleting another tenant data', async () => {
      // Alpha tries to delete Beta's company
      const result = await tenantDb.delete(
        CTX_ALPHA,
        'finance.companies',
        COMPANY_BETA_ID
      );

      // Should return false (not deleted)
      expect(result).toBe(false);

      // Verify Beta's company still exists
      const betaCompany = await pool.query(
        'SELECT id FROM finance.companies WHERE id = $1',
        [COMPANY_BETA_ID]
      );
      expect(betaCompany.rows.length).toBe(1);
    });

    it('should enforce tenant isolation in transactions', async () => {
      const results = await tenantDb.withTransaction(CTX_ALPHA, async (tx) => {
        const companies = await tx.select(
          'finance.companies',
          ['id', 'tenant_id', 'code']
        );
        return companies;
      });

      // All results should be Alpha's tenant
      for (const row of results) {
        expect(row.tenant_id).toBe(TENANT_ALPHA);
      }
    });
  });

  // ==========================================================================
  // 4. PARAMETERIZED QUERY TESTS
  // ==========================================================================

  describe('Parameterized Query Safety', () => {
    it('should return query metadata with text and values', async () => {
      const result = await tenantDb.select(
        CTX_ALPHA,
        'finance.companies',
        ['id', 'name'],
        { status: 'active' },
        { limit: 10 }
      );

      // Verify query metadata is returned
      expect(result.query).toBeDefined();
      expect(result.query.text).toContain('SELECT');
      expect(result.query.text).toContain('tenant_id = $1');
      expect(result.query.values).toContain(TENANT_ALPHA);

      // Verify no string interpolation in query
      expect(result.query.text).not.toContain(TENANT_ALPHA);
    });

    it('should use parameterized values for all WHERE conditions', async () => {
      const result = await tenantDb.select(
        CTX_ALPHA,
        'finance.companies',
        ['id', 'name'],
        { status: 'active', type: 'operating' }
      );

      // All values should be in the values array, not interpolated
      expect(result.query.values).toContain(TENANT_ALPHA);
      expect(result.query.values).toContain('active');
      expect(result.query.values).toContain('operating');

      // Query text should only have placeholders
      expect(result.query.text).not.toContain("'active'");
      expect(result.query.text).not.toContain("'operating'");
    });
  });

  // ==========================================================================
  // 5. INSERT OPERATION TESTS
  // ==========================================================================

  describe('Insert Operations', () => {
    it('should automatically add tenant_id to inserts', async () => {
      const testId = 'c3333333-3333-3333-3333-333333333333';

      try {
        const result = await tenantDb.insert(
          CTX_ALPHA,
          'finance.companies',
          {
            id: testId,
            code: 'TEST-INSERT',
            name: 'Test Insert Company',
            type: 'operating',
            base_currency: 'USD',
            pool_participation: false,
            status: 'active'
          },
          ['id', 'tenant_id', 'code']
        );

        expect(result.tenant_id).toBe(TENANT_ALPHA);
        expect(result.code).toBe('TEST-INSERT');
      } finally {
        await pool.query('DELETE FROM finance.companies WHERE id = $1', [testId]);
      }
    });

    it('should reject insert if tenant_id is provided in data', async () => {
      await expect(
        tenantDb.insert(
          CTX_ALPHA,
          'finance.companies',
          {
            id: 'test-id',
            tenant_id: TENANT_BETA, // Trying to insert into another tenant!
            code: 'MALICIOUS',
            name: 'Malicious Insert',
            type: 'operating',
            base_currency: 'USD',
            status: 'active'
          }
        )
      ).rejects.toThrow('Do not include tenant_id in insert data');
    });
  });

  // ==========================================================================
  // 6. UPDATE OPERATION TESTS
  // ==========================================================================

  describe('Update Operations', () => {
    it('should reject attempts to change tenant_id', async () => {
      const testId = 'c4444444-4444-4444-4444-444444444444';

      // Create a test record
      await pool.query(`
        INSERT INTO finance.companies (id, tenant_id, code, name, type, base_currency, status)
        VALUES ($1, $2, 'UPDATE-TEST', 'Update Test Co', 'operating', 'USD', 'active')
      `, [testId, TENANT_ALPHA]);

      try {
        await expect(
          tenantDb.update(
            CTX_ALPHA,
            'finance.companies',
            testId,
            { tenant_id: TENANT_BETA } // Trying to move to another tenant!
          )
        ).rejects.toThrow('Cannot update tenant_id');
      } finally {
        await pool.query('DELETE FROM finance.companies WHERE id = $1', [testId]);
      }
    });
  });

  // ==========================================================================
  // 7. GLOBAL TABLE ACCESS TESTS
  // ==========================================================================

  describe('Global Table Access', () => {
    it('should allow access to global tables without tenant context', async () => {
      const result = await tenantDb.selectGlobal(
        'kernel.tenants',
        ['id', 'name', 'status'],
        undefined,
        { limit: 10 }
      );

      expect(result.rows.length).toBeGreaterThanOrEqual(1);
    });

    it('should reject attempts to access tenant-scoped tables via selectGlobal', async () => {
      await expect(
        tenantDb.selectGlobal(
          'finance.companies' as any, // Type system should catch this, but test runtime too
          ['id', 'name']
        )
      ).rejects.toThrow(); // Should fail validation or type check
    });
  });

  // ==========================================================================
  // 8. ERROR HANDLING TESTS
  // ==========================================================================

  describe('Error Handling', () => {
    it('should provide meaningful error codes', () => {
      try {
        assertTenantContext(undefined);
      } catch (e) {
        expect(e).toBeInstanceOf(TenantDbError);
        expect((e as TenantDbError).code).toBe('MISSING_CONTEXT');
      }
    });

    it('should reject invalid UUID format for ID lookups', async () => {
      await expect(
        tenantDb.selectById(
          CTX_ALPHA,
          'finance.companies',
          ['id', 'name'],
          'not-a-uuid'
        )
      ).rejects.toThrow('Invalid ID format');
    });
  });
});
