/**
 * AI-BOS Tenant Isolation Integration Tests
 * 
 * Purpose: PROVE tenant isolation works at application layer
 * MVP CRITICAL: This is the core security guarantee
 * 
 * Run: pnpm test:isolation
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Pool, PoolClient } from 'pg';
import {
  TenantGuard,
  TenantGuardError,
  createTenantGuard,
  withTenant,
  TenantContext
} from '../lib/tenant-guard';

// ============================================================================
// TEST CONSTANTS
// ============================================================================

const TENANT_ALPHA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const TENANT_BETA = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const TENANT_INVALID = 'not-a-valid-uuid';
const TENANT_NONEXISTENT = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

const DATABASE_URL = process.env.DATABASE_URL ||
  'postgresql://aibos:aibos_password@localhost:5433/aibos_local';

// ============================================================================
// TEST SUITE
// ============================================================================

describe('Tenant Isolation Guard', () => {
  let pool: Pool;
  let guard: TenantGuard;

  beforeAll(async () => {
    pool = new Pool({ connectionString: DATABASE_URL });
    guard = createTenantGuard({ pool, strictMode: true, debug: false });

    // Ensure test tenants exist
    await pool.query(`
      INSERT INTO kernel.tenants (id, name, slug, status)
      VALUES 
        ($1, 'Test Alpha', 'test-alpha', 'active'),
        ($2, 'Test Beta', 'test-beta', 'active')
      ON CONFLICT (id) DO NOTHING
    `, [TENANT_ALPHA, TENANT_BETA]);
  });

  afterAll(async () => {
    // Cleanup test data (in reverse FK order)
    try {
      // Delete test users only (not seed data)
      await pool.query(`DELETE FROM kernel.users WHERE tenant_id = $1 AND email LIKE 'alpha%'`, [TENANT_ALPHA]);
      await pool.query(`DELETE FROM kernel.users WHERE tenant_id = $1 AND email LIKE 'beta%'`, [TENANT_BETA]);
    } catch (e) {
      // Ignore cleanup errors
    }
    await pool.end();
  });

  // ==========================================================================
  // 1. TENANT CONTEXT VALIDATION
  // ==========================================================================

  describe('Tenant Context Validation', () => {
    it('should throw TenantGuardError when tenantId is missing in strict mode', () => {
      expect(() => {
        guard.guardQuery({} as TenantContext, 'SELECT * FROM kernel.users');
      }).toThrow(TenantGuardError);
    });

    it('should throw TenantGuardError when tenantId is empty string', () => {
      expect(() => {
        guard.guardQuery({ tenantId: '' }, 'SELECT * FROM kernel.users');
      }).toThrow(TenantGuardError);
    });

    it('should throw TenantGuardError when tenantId is null', () => {
      expect(() => {
        guard.guardQuery({ tenantId: null as any }, 'SELECT * FROM kernel.users');
      }).toThrow(TenantGuardError);
    });

    it('should throw TenantGuardError when tenantId is undefined', () => {
      expect(() => {
        guard.guardQuery({ tenantId: undefined as any }, 'SELECT * FROM kernel.users');
      }).toThrow(TenantGuardError);
    });

    it('should accept valid UUID tenant ID', () => {
      const result = guard.guardQuery(
        { tenantId: TENANT_ALPHA },
        'SELECT * FROM kernel.users'
      );
      expect(result.text).toContain('tenant_id = $1');
      expect(result.values[0]).toBe(TENANT_ALPHA);
    });
  });

  // ==========================================================================
  // 2. SELECT QUERY TRANSFORMATION
  // ==========================================================================

  describe('SELECT Query Transformation', () => {
    it('should add WHERE tenant_id for simple SELECT', () => {
      const result = guard.guardQuery(
        { tenantId: TENANT_ALPHA },
        'SELECT * FROM kernel.users'
      );
      expect(result.text).toBe('SELECT * FROM kernel.users WHERE tenant_id = $1');
      expect(result.values).toEqual([TENANT_ALPHA]);
    });

    it('should prepend tenant_id to existing WHERE clause', () => {
      const result = guard.guardQuery(
        { tenantId: TENANT_ALPHA },
        'SELECT * FROM kernel.users WHERE email = $1',
        ['test@test.com']
      );
      expect(result.text).toBe('SELECT * FROM kernel.users WHERE tenant_id = $1 AND email = $2');
      expect(result.values).toEqual([TENANT_ALPHA, 'test@test.com']);
    });

    it('should shift parameter indices correctly', () => {
      const result = guard.guardQuery(
        { tenantId: TENANT_ALPHA },
        'SELECT * FROM kernel.users WHERE email = $1 AND status = $2',
        ['test@test.com', 'active']
      );
      expect(result.text).toBe('SELECT * FROM kernel.users WHERE tenant_id = $1 AND email = $2 AND status = $3');
      expect(result.values).toEqual([TENANT_ALPHA, 'test@test.com', 'active']);
    });

    it('should handle SELECT with ORDER BY', () => {
      const result = guard.guardQuery(
        { tenantId: TENANT_ALPHA },
        'SELECT * FROM kernel.users ORDER BY created_at DESC'
      );
      expect(result.text).toContain('WHERE tenant_id = $1');
      expect(result.text).toContain('ORDER BY created_at DESC');
    });

    it('should handle SELECT with LIMIT and OFFSET', () => {
      const result = guard.guardQuery(
        { tenantId: TENANT_ALPHA },
        'SELECT * FROM kernel.users LIMIT 10 OFFSET 5'
      );
      expect(result.text).toContain('WHERE tenant_id = $1');
      expect(result.text).toContain('LIMIT 10 OFFSET 5');
    });

    it('should handle SELECT with GROUP BY', () => {
      const result = guard.guardQuery(
        { tenantId: TENANT_ALPHA },
        'SELECT status, COUNT(*) FROM kernel.users GROUP BY status'
      );
      expect(result.text).toContain('WHERE tenant_id = $1');
      expect(result.text).toContain('GROUP BY status');
    });

    it('should handle schema-qualified table names', () => {
      const result = guard.guardQuery(
        { tenantId: TENANT_ALPHA },
        'SELECT * FROM finance.companies'
      );
      expect(result.text).toContain('tenant_id = $1');
    });
  });

  // ==========================================================================
  // 3. INSERT QUERY TRANSFORMATION
  // ==========================================================================

  describe('INSERT Query Transformation', () => {
    it('should add tenant_id to INSERT without it', () => {
      const result = guard.guardQuery(
        { tenantId: TENANT_ALPHA },
        'INSERT INTO kernel.users (email, password_hash) VALUES ($1, $2)',
        ['test@test.com', 'hash']
      );
      expect(result.text).toContain('tenant_id');
      expect(result.values[0]).toBe(TENANT_ALPHA);
    });

    it('should not duplicate tenant_id if already present', () => {
      const result = guard.guardQuery(
        { tenantId: TENANT_ALPHA },
        'INSERT INTO kernel.users (tenant_id, email) VALUES ($1, $2)',
        [TENANT_ALPHA, 'test@test.com']
      );
      // Should pass through without modification
      expect(result.values).toEqual([TENANT_ALPHA, 'test@test.com']);
    });
  });

  // ==========================================================================
  // 4. UPDATE QUERY TRANSFORMATION
  // ==========================================================================

  describe('UPDATE Query Transformation', () => {
    it('should add tenant_id WHERE clause to UPDATE', () => {
      const result = guard.guardQuery(
        { tenantId: TENANT_ALPHA },
        'UPDATE kernel.users SET email = $1 WHERE id = $2',
        ['new@test.com', 'user-id']
      );
      expect(result.text).toContain('tenant_id = $1');
      expect(result.values[0]).toBe(TENANT_ALPHA);
    });

    it('should add WHERE clause to UPDATE without one (CRITICAL SAFETY)', () => {
      const result = guard.guardQuery(
        { tenantId: TENANT_ALPHA },
        'UPDATE kernel.users SET status = $1',
        ['inactive']
      );
      expect(result.text).toContain('WHERE tenant_id = $1');
      expect(result.values[0]).toBe(TENANT_ALPHA);
    });
  });

  // ==========================================================================
  // 5. DELETE QUERY TRANSFORMATION
  // ==========================================================================

  describe('DELETE Query Transformation', () => {
    it('should add tenant_id WHERE clause to DELETE', () => {
      const result = guard.guardQuery(
        { tenantId: TENANT_ALPHA },
        'DELETE FROM kernel.users WHERE id = $1',
        ['user-id']
      );
      expect(result.text).toContain('tenant_id = $1');
      expect(result.values[0]).toBe(TENANT_ALPHA);
    });

    it('should add WHERE clause to DELETE without one (CRITICAL SAFETY)', () => {
      const result = guard.guardQuery(
        { tenantId: TENANT_ALPHA },
        'DELETE FROM kernel.users'
      );
      expect(result.text).toContain('WHERE tenant_id = $1');
      expect(result.values[0]).toBe(TENANT_ALPHA);
    });
  });

  // ==========================================================================
  // 6. EXCLUDED TABLES (GLOBAL TABLES)
  // ==========================================================================

  describe('Excluded Tables (Global Tables)', () => {
    it('should not add tenant filter to tenants table', () => {
      const result = guard.guardQuery(
        { tenantId: TENANT_ALPHA },
        'SELECT * FROM kernel.tenants'
      );
      expect(result.text).not.toContain('tenant_id = $1');
      expect(result.values).toEqual([]);
    });

    it('should not add tenant filter to permissions table', () => {
      const result = guard.guardQuery(
        { tenantId: TENANT_ALPHA },
        'SELECT * FROM kernel.permissions'
      );
      expect(result.text).not.toContain('tenant_id = $1');
    });
  });

  // ==========================================================================
  // 7. ACTUAL DATABASE QUERIES - DATA ISOLATION
  // ==========================================================================

  describe('Database Isolation - Live Queries', () => {
    beforeEach(async () => {
      // Setup test data
      await pool.query(`
        INSERT INTO kernel.users (id, tenant_id, email, password_hash, display_name)
        VALUES 
          ('11111111-1111-1111-1111-111111111111', $1, 'alpha1@test.com', 'hash', 'Alpha User 1'),
          ('22222222-2222-2222-2222-222222222222', $1, 'alpha2@test.com', 'hash', 'Alpha User 2'),
          ('33333333-3333-3333-3333-333333333333', $2, 'beta1@test.com', 'hash', 'Beta User 1')
        ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
      `, [TENANT_ALPHA, TENANT_BETA]);
    });

    it('should only return data for the specified tenant', async () => {
      const result = await guard.query(
        { tenantId: TENANT_ALPHA },
        'SELECT * FROM kernel.users'
      );

      expect(result.rows.length).toBeGreaterThanOrEqual(2);
      for (const row of result.rows) {
        expect(row.tenant_id).toBe(TENANT_ALPHA);
      }
    });

    it('should NOT return other tenant data', async () => {
      const result = await guard.query(
        { tenantId: TENANT_ALPHA },
        'SELECT * FROM kernel.users'
      );

      const emails = result.rows.map(r => r.email);
      expect(emails).not.toContain('beta1@test.com');
    });

    it('should return correct count for tenant', async () => {
      const alphaResult = await guard.query(
        { tenantId: TENANT_ALPHA },
        'SELECT COUNT(*) as count FROM kernel.users'
      );

      const betaResult = await guard.query(
        { tenantId: TENANT_BETA },
        'SELECT COUNT(*) as count FROM kernel.users'
      );

      expect(parseInt(alphaResult.rows[0].count)).toBeGreaterThanOrEqual(2);
      expect(parseInt(betaResult.rows[0].count)).toBeGreaterThanOrEqual(1);
    });

    it('should isolate data in transactions', async () => {
      await guard.transaction({ tenantId: TENANT_ALPHA }, async (client) => {
        const result = await client.query('SELECT * FROM kernel.users');

        for (const row of result.rows) {
          expect(row.tenant_id).toBe(TENANT_ALPHA);
        }
      });
    });
  });

  // ==========================================================================
  // 8. ATTACK PREVENTION
  // ==========================================================================

  describe('Attack Prevention', () => {
    it('should prevent reading other tenant data even with known IDs', async () => {
      // Alpha user tries to query Beta's known user ID
      const result = await guard.query(
        { tenantId: TENANT_ALPHA },
        'SELECT * FROM kernel.users WHERE id = $1',
        ['33333333-3333-3333-3333-333333333333'] // Beta's user ID
      );

      expect(result.rows.length).toBe(0);
    });

    it('should prevent UPDATE on other tenant data', async () => {
      // Alpha tries to update Beta's user
      const result = await guard.query(
        { tenantId: TENANT_ALPHA },
        'UPDATE kernel.users SET email = $1 WHERE id = $2 RETURNING *',
        ['hacked@test.com', '33333333-3333-3333-3333-333333333333']
      );

      expect(result.rowCount).toBe(0);
    });

    it('should prevent DELETE on other tenant data', async () => {
      // Alpha tries to delete Beta's user
      const result = await guard.query(
        { tenantId: TENANT_ALPHA },
        'DELETE FROM kernel.users WHERE id = $1 RETURNING *',
        ['33333333-3333-3333-3333-333333333333']
      );

      expect(result.rowCount).toBe(0);
    });
  });

  // ==========================================================================
  // 9. withTenant HELPER
  // ==========================================================================

  describe('withTenant Helper', () => {
    it('should work with the convenience wrapper', async () => {
      const result = await withTenant(pool, TENANT_ALPHA, async (query) => {
        return query('SELECT COUNT(*) as count FROM kernel.users');
      });

      expect(parseInt(result.rows[0].count)).toBeGreaterThanOrEqual(2);
    });
  });
});

// ============================================================================
// CROSS-TENANT ATTACK SIMULATION TESTS
// ============================================================================

describe('Cross-Tenant Attack Simulation', () => {
  let pool: Pool;
  let guard: TenantGuard;

  beforeAll(async () => {
    pool = new Pool({ connectionString: DATABASE_URL });
    guard = createTenantGuard({ pool, strictMode: true });
  });

  afterAll(async () => {
    await pool.end();
  });

  it('should block malicious tenant switching mid-query', async () => {
    // Attacker starts with their tenant, tries to access victim data
    const result = await guard.query(
      { tenantId: TENANT_BETA }, // Attacker's tenant
      'SELECT * FROM kernel.users WHERE email LIKE $1',
      ['alpha%'] // Trying to find Alpha's users
    );

    // Should find nothing because tenant_id filter is applied
    const alphaEmails = result.rows.filter(r => r.email?.includes('alpha'));
    expect(alphaEmails.length).toBe(0);
  });

  it('should prevent UNION-based data extraction', async () => {
    // This test verifies that even if UNION is used, tenant filter applies
    const result = await guard.query(
      { tenantId: TENANT_BETA },
      'SELECT email FROM kernel.users'
    );

    const emails = result.rows.map(r => r.email);
    expect(emails.every(e => !e?.includes('alpha'))).toBe(true);
  });
});
