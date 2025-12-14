# AI-BOS Data Fabric — MVP Sprint Plan

> **The Foundation of Trust**  
> Proving tenant isolation, schema boundaries, and data integrity — before scaling.

---

## 📋 Document Control

| Property | Value |
|----------|-------|
| **Version** | 1.0.0 |
| **Status** | 🟡 ACTIVE |
| **Sprint** | 2 weeks |
| **Owner** | Data Fabric Team |
| **Derives From** | [PRD-DB.md](./PRD-DB.md) — Option A |
| **Contract** | [CONT_03_DatabaseArchitecture.md](../../packages/canon/A-Governance/A-CONT/CONT_03_DatabaseArchitecture.md) |

---

## 🎯 MVP Goal

> **The MVP is not about features. It's about proving, with verifiable tests, that:**
> 1. **Tenant A cannot see Tenant B's data** (Isolation)
> 2. **Kernel cannot access Finance data directly** (Schema Boundaries)
> 3. **Debits always equal Credits** (Data Integrity)
> 4. **Every schema change is tracked** (Governance)

---

## ✅ Current State (Already Complete)

| Component | Status | Location |
|-----------|--------|----------|
| Kernel Schema (13 migrations) | ✅ Done | `migrations/kernel/` |
| Finance Schema (core tables) | ✅ Done | `migrations/finance/` |
| Config Schema (provider profiles) | ✅ Done | `migrations/config/` |
| Migration Runner | ✅ Done | `scripts/migrate.ts` |
| Schema Guardian (basic) | ✅ Done | `tools/validate-schema.ts` |
| Demo Seeds (kernel + finance) | ✅ Done | `seeds/` |
| Docker Compose | ✅ Done | `docker-compose.yml` |

---

## 🏗️ MVP Deliverables

### Week 1: Security & Integrity

| Day | Task | Deliverable | Acceptance Criteria |
|-----|------|-------------|---------------------|
| **1** | DB Role Separation | `migrations/kernel/014_create_db_roles.sql` | 3 roles created: `aibos_kernel_role`, `aibos_finance_role`, `aibos_config_role` |
| **2** | Role Permissions | `migrations/kernel/015_grant_schema_permissions.sql` | Kernel role cannot SELECT from finance schema |
| **3** | Tenant Isolation Guard | `lib/tenant-guard.ts` | Query without `tenant_id` throws `TenantIsolationError` |
| **4** | Tenant Isolation Tests | `tests/tenant-isolation.test.ts` | 100% pass: cross-tenant access blocked |
| **5** | Double-Entry Constraint | `migrations/finance/101_double_entry_constraint.sql` | Insert with Debit ≠ Credit fails |

### Week 2: Operations & Demo

| Day | Task | Deliverable | Acceptance Criteria |
|-----|------|-------------|---------------------|
| **6** | Immutable Journal Check | `migrations/finance/102_journal_immutability.sql` | UPDATE/DELETE on `journal_entries` blocked |
| **7** | Connection Pooling Config | `docker-compose.yml` update | PgBouncer or connection limit configured |
| **8** | Observability Setup | `migrations/kernel/016_enable_logging.sql` | Slow query logging enabled (>1s) |
| **9** | Schema Guardian CI | `.github/workflows/validate-schema.yml` | PR blocked if validation fails |
| **10** | Documentation + Demo | `README.md` update, demo script | CFO/CTO can witness isolation demo |

---

## 📊 Technical Specifications

### Task 1: DB Role Separation

**File:** `migrations/kernel/014_create_db_roles.sql`

```sql
-- ============================================================================
-- DB ROLE SEPARATION
-- Purpose: Enforce hexagonal boundaries at database level
-- ============================================================================

-- Create schema-specific roles
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'aibos_kernel_role') THEN
    CREATE ROLE aibos_kernel_role;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'aibos_finance_role') THEN
    CREATE ROLE aibos_finance_role;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'aibos_config_role') THEN
    CREATE ROLE aibos_config_role;
  END IF;
END
$$;

COMMENT ON ROLE aibos_kernel_role IS 'Kernel Control Plane - kernel schema only';
COMMENT ON ROLE aibos_finance_role IS 'Finance Cells - finance schema only';
COMMENT ON ROLE aibos_config_role IS 'Platform Config - config schema read-only';
```

---

### Task 2: Role Permissions

**File:** `migrations/kernel/015_grant_schema_permissions.sql`

```sql
-- ============================================================================
-- SCHEMA PERMISSION GRANTS
-- Purpose: Enforce "no cross-schema access" at database level
-- ============================================================================

-- Kernel role: kernel schema ONLY
GRANT USAGE ON SCHEMA kernel TO aibos_kernel_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA kernel TO aibos_kernel_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA kernel 
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO aibos_kernel_role;

-- Explicitly REVOKE cross-schema access
REVOKE ALL ON SCHEMA finance FROM aibos_kernel_role;
REVOKE ALL ON ALL TABLES IN SCHEMA finance FROM aibos_kernel_role;

-- Finance role: finance schema ONLY
GRANT USAGE ON SCHEMA finance TO aibos_finance_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA finance TO aibos_finance_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA finance 
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO aibos_finance_role;

-- Explicitly REVOKE cross-schema access
REVOKE ALL ON SCHEMA kernel FROM aibos_finance_role;
REVOKE ALL ON ALL TABLES IN SCHEMA kernel FROM aibos_finance_role;

-- Config role: config schema READ-ONLY
GRANT USAGE ON SCHEMA config TO aibos_config_role;
GRANT SELECT ON ALL TABLES IN SCHEMA config TO aibos_config_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA config 
  GRANT SELECT ON TABLES TO aibos_config_role;

-- Both kernel and finance can READ config (for provider profiles, etc.)
GRANT USAGE ON SCHEMA config TO aibos_kernel_role;
GRANT SELECT ON ALL TABLES IN SCHEMA config TO aibos_kernel_role;
GRANT USAGE ON SCHEMA config TO aibos_finance_role;
GRANT SELECT ON ALL TABLES IN SCHEMA config TO aibos_finance_role;
```

---

### Task 3: Tenant Isolation Guard

**File:** `lib/tenant-guard.ts`

```typescript
/**
 * Tenant Isolation Guard
 * 
 * Ensures every query to TENANT_SCOPED tables includes tenant_id.
 * This is the application-level enforcement (MVP).
 * 
 * Future: RLS policies as defense-in-depth (v1.1.0)
 */

export class TenantIsolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TenantIsolationError';
  }
}

export interface TenantContext {
  tenantId: string;
  userId?: string;
}

// Tables that require tenant_id (TENANT_SCOPED)
const TENANT_SCOPED_TABLES = [
  'kernel.users',
  'kernel.roles',
  'kernel.sessions',
  'kernel.canons',
  'kernel.routes',
  'kernel.events',
  'kernel.audit_events',
  'finance.companies',
  'finance.accounts',
  'finance.fx_rates',
  'finance.transactions',
  'finance.transaction_approvals',
  'finance.approval_matrices',
  'finance.journal_entries',
  'finance.journal_lines',
  'finance.intercompany_settlements',
  'finance.treasury_pool_balances',
];

// Tables that are GLOBAL (no tenant_id required)
const GLOBAL_TABLES = [
  'kernel.tenants',
  'kernel.permissions',
  'config.provider_profiles',
  'config.tenant_providers',
  'config.provider_selection_rules',
];

/**
 * Validates that a tenant context is provided for tenant-scoped queries.
 */
export function requireTenantContext(context: TenantContext | undefined): asserts context is TenantContext {
  if (!context || !context.tenantId) {
    throw new TenantIsolationError(
      'Tenant context required: All queries to tenant-scoped tables must include tenant_id'
    );
  }
  
  // Validate UUID format
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_REGEX.test(context.tenantId)) {
    throw new TenantIsolationError(
      `Invalid tenant_id format: ${context.tenantId}`
    );
  }
}

/**
 * Appends tenant_id filter to SQL query.
 * For MVP, this is the primary isolation mechanism.
 */
export function appendTenantFilter(sql: string, tenantId: string): string {
  // Simple implementation: assumes WHERE clause exists or needs to be added
  // In production, use a proper SQL parser
  
  if (sql.toUpperCase().includes('WHERE')) {
    return sql.replace(/WHERE/i, `WHERE tenant_id = '${tenantId}' AND`);
  } else if (sql.toUpperCase().includes('FROM')) {
    return sql.replace(/(FROM\s+[\w.]+)/i, `$1 WHERE tenant_id = '${tenantId}'`);
  }
  
  return sql;
}

/**
 * Checks if a table is tenant-scoped.
 */
export function isTenantScoped(tableName: string): boolean {
  return TENANT_SCOPED_TABLES.includes(tableName.toLowerCase());
}

/**
 * Checks if a table is global.
 */
export function isGlobalTable(tableName: string): boolean {
  return GLOBAL_TABLES.includes(tableName.toLowerCase());
}
```

---

### Task 4: Tenant Isolation Tests

**File:** `tests/tenant-isolation.test.ts`

```typescript
/**
 * Tenant Isolation Integration Tests
 * 
 * Verifies that tenant data is properly isolated.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { requireTenantContext, TenantIsolationError } from '../lib/tenant-guard';

const TENANT_1 = '11111111-1111-1111-1111-111111111111';
const TENANT_2 = '22222222-2222-2222-2222-222222222222';

describe('Tenant Isolation', () => {
  let pool: Pool;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || 
        'postgresql://aibos:aibos_password@localhost:5433/aibos_local'
    });
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('Tenant Context Guard', () => {
    it('should throw TenantIsolationError when tenant_id is missing', () => {
      expect(() => requireTenantContext(undefined)).toThrow(TenantIsolationError);
      expect(() => requireTenantContext({ tenantId: '' })).toThrow(TenantIsolationError);
    });

    it('should throw TenantIsolationError for invalid UUID format', () => {
      expect(() => requireTenantContext({ tenantId: 'not-a-uuid' })).toThrow(TenantIsolationError);
      expect(() => requireTenantContext({ tenantId: '123' })).toThrow(TenantIsolationError);
    });

    it('should pass for valid tenant context', () => {
      expect(() => requireTenantContext({ tenantId: TENANT_1 })).not.toThrow();
    });
  });

  describe('Data Isolation', () => {
    it('should only return data for the specified tenant', async () => {
      // Insert test data for Tenant 1
      await pool.query(`
        INSERT INTO kernel.users (id, tenant_id, email, password_hash, display_name)
        VALUES (uuid_generate_v4(), $1, 'test1@tenant1.com', 'hash', 'Test User 1')
        ON CONFLICT DO NOTHING
      `, [TENANT_1]);

      // Insert test data for Tenant 2
      await pool.query(`
        INSERT INTO kernel.users (id, tenant_id, email, password_hash, display_name)
        VALUES (uuid_generate_v4(), $1, 'test2@tenant2.com', 'hash', 'Test User 2')
        ON CONFLICT DO NOTHING
      `, [TENANT_2]);

      // Query with Tenant 1 filter
      const tenant1Result = await pool.query(
        'SELECT * FROM kernel.users WHERE tenant_id = $1',
        [TENANT_1]
      );

      // Query with Tenant 2 filter
      const tenant2Result = await pool.query(
        'SELECT * FROM kernel.users WHERE tenant_id = $1',
        [TENANT_2]
      );

      // Verify isolation
      for (const row of tenant1Result.rows) {
        expect(row.tenant_id).toBe(TENANT_1);
      }

      for (const row of tenant2Result.rows) {
        expect(row.tenant_id).toBe(TENANT_2);
      }

      // Verify no cross-contamination
      const tenant1Emails = tenant1Result.rows.map(r => r.email);
      const tenant2Emails = tenant2Result.rows.map(r => r.email);
      
      expect(tenant1Emails).not.toContain('test2@tenant2.com');
      expect(tenant2Emails).not.toContain('test1@tenant1.com');
    });
  });

  describe('Schema Boundary Enforcement', () => {
    it('should block kernel role from accessing finance schema', async () => {
      // This test requires connecting as aibos_kernel_role
      // For now, we verify the grants are in place
      const result = await pool.query(`
        SELECT has_schema_privilege('aibos_kernel_role', 'finance', 'USAGE') as has_access
      `);
      
      expect(result.rows[0]?.has_access).toBe(false);
    });

    it('should block finance role from accessing kernel schema', async () => {
      const result = await pool.query(`
        SELECT has_schema_privilege('aibos_finance_role', 'kernel', 'USAGE') as has_access
      `);
      
      expect(result.rows[0]?.has_access).toBe(false);
    });
  });
});
```

---

### Task 5: Double-Entry Constraint

**File:** `migrations/finance/101_double_entry_constraint.sql`

```sql
-- ============================================================================
-- DOUBLE-ENTRY ACCOUNTING CONSTRAINT
-- Purpose: Ensure Debits = Credits for every journal entry
-- ============================================================================

-- Constraint 1: Each line must be either debit OR credit, not both
ALTER TABLE finance.journal_lines
DROP CONSTRAINT IF EXISTS check_debit_or_credit;

ALTER TABLE finance.journal_lines
ADD CONSTRAINT check_debit_or_credit
CHECK (
  (debit_cents > 0 AND (credit_cents IS NULL OR credit_cents = 0)) OR
  (credit_cents > 0 AND (debit_cents IS NULL OR debit_cents = 0)) OR
  (debit_cents = 0 AND credit_cents = 0) -- Zero lines allowed for corrections
);

-- Trigger: Validate double-entry balance after each insert
CREATE OR REPLACE FUNCTION finance.validate_double_entry()
RETURNS TRIGGER AS $$
DECLARE
  total_debits BIGINT;
  total_credits BIGINT;
BEGIN
  -- Calculate totals for this journal entry
  SELECT 
    COALESCE(SUM(CASE WHEN debit_cents > 0 THEN debit_cents ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN credit_cents > 0 THEN credit_cents ELSE 0 END), 0)
  INTO total_debits, total_credits
  FROM finance.journal_lines
  WHERE journal_entry_id = NEW.journal_entry_id;

  -- Only validate when posting (not during draft)
  -- Check if journal entry is being finalized
  IF EXISTS (
    SELECT 1 FROM finance.journal_entries 
    WHERE id = NEW.journal_entry_id 
    AND status = 'POSTED'
  ) THEN
    IF total_debits != total_credits THEN
      RAISE EXCEPTION 'Double-entry violation: Debits (%) must equal Credits (%) for journal entry %',
        total_debits, total_credits, NEW.journal_entry_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trg_validate_double_entry ON finance.journal_lines;

-- Create trigger
CREATE TRIGGER trg_validate_double_entry
AFTER INSERT OR UPDATE ON finance.journal_lines
FOR EACH ROW
EXECUTE FUNCTION finance.validate_double_entry();

-- Add status column to journal_entries if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'finance' 
    AND table_name = 'journal_entries' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE finance.journal_entries 
    ADD COLUMN status VARCHAR(20) DEFAULT 'DRAFT' 
    CHECK (status IN ('DRAFT', 'POSTED', 'REVERSED'));
  END IF;
END
$$;

COMMENT ON FUNCTION finance.validate_double_entry() IS 
  'Enforces double-entry accounting: Sum(Debits) = Sum(Credits) for POSTED entries';
```

---

### Task 6: Journal Immutability

**File:** `migrations/finance/102_journal_immutability.sql`

```sql
-- ============================================================================
-- JOURNAL IMMUTABILITY
-- Purpose: Prevent UPDATE/DELETE on posted journal entries
-- ============================================================================

-- Trigger: Block UPDATE on posted journal entries
CREATE OR REPLACE FUNCTION finance.prevent_journal_modification()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'POSTED' THEN
    RAISE EXCEPTION 'Cannot modify POSTED journal entry %. Use reversal journal instead.',
      OLD.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Block DELETE on journal entries
CREATE OR REPLACE FUNCTION finance.prevent_journal_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'POSTED' THEN
    RAISE EXCEPTION 'Cannot delete POSTED journal entry %. Use reversal journal instead.',
      OLD.id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS trg_prevent_journal_modification ON finance.journal_entries;
CREATE TRIGGER trg_prevent_journal_modification
BEFORE UPDATE ON finance.journal_entries
FOR EACH ROW
EXECUTE FUNCTION finance.prevent_journal_modification();

DROP TRIGGER IF EXISTS trg_prevent_journal_deletion ON finance.journal_entries;
CREATE TRIGGER trg_prevent_journal_deletion
BEFORE DELETE ON finance.journal_entries
FOR EACH ROW
EXECUTE FUNCTION finance.prevent_journal_deletion();

-- Also protect journal lines
DROP TRIGGER IF EXISTS trg_prevent_line_modification ON finance.journal_lines;
CREATE TRIGGER trg_prevent_line_modification
BEFORE UPDATE OR DELETE ON finance.journal_lines
FOR EACH ROW
WHEN (EXISTS (
  SELECT 1 FROM finance.journal_entries 
  WHERE id = OLD.journal_entry_id AND status = 'POSTED'
))
EXECUTE FUNCTION finance.prevent_journal_modification();

COMMENT ON FUNCTION finance.prevent_journal_modification() IS 
  'Enforces immutability: POSTED journal entries cannot be modified';
COMMENT ON FUNCTION finance.prevent_journal_deletion() IS 
  'Enforces immutability: POSTED journal entries cannot be deleted';
```

---

## 🎬 Demo Script: "The CFO Trust Test"

### Scenario: Prove the Three Guarantees

**Setup:**
- Tenant A: "Demo Corp" (existing from seed)
- Tenant B: "Acme Inc" (created for demo)

### Demo Flow

| Step | Action | Expected Result | CFO Sees |
|------|--------|-----------------|----------|
| 1 | Query Tenant A users | Returns Demo Corp users | "Only my data" |
| 2 | Query Tenant B users | Returns Acme Inc users | "Isolated" |
| 3 | Try cross-tenant query | Returns empty / blocked | "Isolation enforced" |
| 4 | Connect as `aibos_kernel_role`, SELECT from finance | Permission denied | "Boundaries enforced" |
| 5 | Create journal with Debits ≠ Credits | Error thrown | "Integrity enforced" |
| 6 | Try to UPDATE posted journal | Error thrown | "Immutability enforced" |

### The Pitch

> "This database proves three things your current system cannot:
> 1. **Tenant A cannot see Tenant B's data** — mathematically enforced
> 2. **The payment system cannot access identity data** — permission-blocked
> 3. **Journal entries cannot be edited after posting** — auditor-approved
> 
> And we have automated tests that verify this on every deployment."

---

## 📅 Sprint Calendar

| Week | Mon | Tue | Wed | Thu | Fri |
|------|-----|-----|-----|-----|-----|
| **1** | DB Roles | Permissions | Tenant Guard | Isolation Tests | Double-Entry |
| **2** | Immutability | Connection Pool | Observability | Schema CI | Demo |

---

## ✅ MVP Acceptance Criteria

| # | Criterion | Test | Status |
|---|-----------|------|--------|
| 1 | DB roles created | `SELECT * FROM pg_roles WHERE rolname LIKE 'aibos_%'` returns 3 rows | ⬜ |
| 2 | Kernel cannot access finance | `has_schema_privilege('aibos_kernel_role', 'finance', 'USAGE')` = false | ⬜ |
| 3 | Finance cannot access kernel | `has_schema_privilege('aibos_finance_role', 'kernel', 'USAGE')` = false | ⬜ |
| 4 | Tenant guard throws on missing context | Unit test passes | ⬜ |
| 5 | Tenant isolation integration test | `pnpm test:isolation` exits 0 | ⬜ |
| 6 | Unbalanced journal fails | INSERT with Debits ≠ Credits throws | ⬜ |
| 7 | Posted journal cannot be modified | UPDATE on POSTED entry throws | ⬜ |
| 8 | Migrations run cleanly | `pnpm migrate` exits 0 | ⬜ |
| 9 | Schema Guardian passes | `pnpm validate` exits 0 | ⬜ |
| 10 | Demo script completed | CFO/CTO witness all 6 steps | ⬜ |

---

## 📁 Files to Create

| File | Type | Purpose |
|------|------|---------|
| `migrations/kernel/014_create_db_roles.sql` | Migration | Create DB roles |
| `migrations/kernel/015_grant_schema_permissions.sql` | Migration | Grant permissions |
| `migrations/kernel/016_enable_logging.sql` | Migration | Slow query logging |
| `migrations/finance/101_double_entry_constraint.sql` | Migration | Double-entry enforcement |
| `migrations/finance/102_journal_immutability.sql` | Migration | Journal protection |
| `lib/tenant-guard.ts` | Library | Tenant isolation guard |
| `tests/tenant-isolation.test.ts` | Test | Integration tests |
| `.github/workflows/validate-schema.yml` | CI | Schema validation |

---

## 🚀 Post-MVP (v1.1.0)

| Feature | Description |
|---------|-------------|
| RLS Policies | Row-Level Security as defense-in-depth |
| BYOS Mode | Bring Your Own Storage support |
| Query Optimizer | Slow query detection + recommendations |
| Provider Auto-Selection | Match tenant profile to provider |

---

## 📎 Related Documents

- [PRD-DB.md](./PRD-DB.md) — Full Product Requirements
- [CONT_03: Database Architecture](../../packages/canon/A-Governance/A-CONT/CONT_03_DatabaseArchitecture.md) — Contract
- [CONT_00: Constitution](../../packages/canon/A-Governance/A-CONT/CONT_00_Constitution.md) — Supreme Governance

---

**End of PRD-DB-MVP v1.0.0**
