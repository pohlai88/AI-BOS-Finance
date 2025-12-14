# AI-BOS Data Fabric — Product Requirements Document

> **The Intelligent Database Governance & Orchestration Layer (DGOL)**  
> Beyond "Just Postgres" — An AI-Governed, Tenant-Aware Data Plane.

---

## 📋 Document Control

| Property | Value |
|----------|-------|
| **Version** | 1.0.0 |
| **Status** | 🟡 DRAFT |
| **Owner** | Data Fabric Team |
| **Derives From** | [CONT_03_DatabaseArchitecture.md](../../packages/canon/A-Governance/A-CONT/CONT_03_DatabaseArchitecture.md) |
| **Constitution** | [CONT_00_Constitution.md](../../packages/canon/A-Governance/A-CONT/CONT_00_Constitution.md) — Pillar 5 (DB) |

---

## 1. Executive Summary

### 1.1 What is AI-BOS Data Fabric?

AI-BOS Data Fabric is **not a database engine** — it is an **intelligent governance and orchestration layer** over raw infrastructure (PostgreSQL).

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI-BOS DATA FABRIC                            │
│         "Database Governance & Orchestration Layer (DGOL)"       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              GOVERNANCE LAYER (AI-BOS)                   │    │
│  │                                                          │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │    │
│  │  │ Schema   │ │ Query    │ │ Provider │ │ Tenant     │  │    │
│  │  │ Guardian │ │ Optimizer│ │ Selector │ │ Isolator   │  │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                    [Governance API]                              │
│                              │                                   │
│  ┌───────────────────────────┼───────────────────────────┐      │
│  │            RAW INFRASTRUCTURE (Complement)             │      │
│  │                                                        │      │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │      │
│  │  │  Docker  │  │   Neon   │  │ AWS RDS  │  ...        │      │
│  │  │ Postgres │  │Serverless│  │ Aurora   │             │      │
│  │  └──────────┘  └──────────┘  └──────────┘             │      │
│  │                                                        │      │
│  └────────────────────────────────────────────────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 The Governance Gap We Fill

| Question | Without AI-BOS | With AI-BOS |
|----------|----------------|-------------|
| "Who changed schema and why?" | Git blame + Slack archaeology | Audit trail + migration manifest |
| "Why is this query slow?" | Manual EXPLAIN analysis | Automatic optimization suggestions |
| "Can we prove tenant isolation?" | "Trust me" | Application-level guard + tests |
| "Which index should we add?" | DBA tribal knowledge | AI-recommended, shadow-tested |

---

## 2. Current State Analysis

### 2.1 What's Already Implemented

| Component | Status | Location |
|-----------|--------|----------|
| Kernel Schema (13 migrations) | ✅ Complete | `apps/db/migrations/kernel/` |
| Finance Schema (core tables) | ✅ Complete | `apps/db/migrations/finance/` |
| Config Schema (provider profiles) | ✅ Complete | `apps/db/migrations/config/` |
| Migration Runner | ✅ Complete | `apps/db/scripts/migrate.ts` |
| Schema Guardian (basic) | ✅ Complete | `apps/db/tools/validate-schema.ts` |
| Demo Seeds | ✅ Complete | `apps/db/seeds/` |
| Docker Compose | ✅ Complete | `apps/db/docker-compose.yml` |

### 2.2 What's Missing for Production

| Component | Status | Priority | Effort |
|-----------|--------|----------|--------|
| DB Role Separation (per schema) | ⬜ Not Started | P0 | 2 days |
| Tenant Isolation Tests | ⬜ Not Started | P0 | 1 day |
| Double-Entry Ledger Constraint | ⬜ Not Started | P1 | 1 day |
| Connection Pooling (PgBouncer) | ⬜ Not Started | P1 | 1 day |
| Backup Strategy | ⬜ Not Started | P1 | 1 day |
| Query Optimizer | ⬜ Not Started | P2 | 3 days |
| BYOS Mode | ⬜ Not Started | P2 | 5 days |
| RLS Policies | ⬜ Not Started | P2 | 3 days |

---

## 3. Feature Catalog

### 3.1 Schema Guardian (Governance)

**Purpose:** Prevent bad schemas from reaching production.

| Detection | Action | Implemented |
|-----------|--------|-------------|
| Missing `tenant_id` on TENANT_SCOPED tables | Block migration | ✅ Yes |
| Missing `created_at` | Block migration | ✅ Yes |
| Missing `updated_at` on mutable tables | Warning | ✅ Yes |
| Cross-schema JOINs | Warning | ✅ Yes |
| Missing index on `tenant_id` | Suggestion | ✅ Yes |

**Future Enhancements:**
- [ ] 1NF/2NF/3NF violation detection
- [ ] Duplicate entity detection
- [ ] Foreign key enforcement checks

---

### 3.2 Tenant Isolation (Security)

**Purpose:** Ensure no tenant can access another tenant's data.

| Layer | Mechanism | Status |
|-------|-----------|--------|
| **Application** | Kernel Adapter appends `WHERE tenant_id = $1` | ✅ Implemented |
| **Driver** | Request rejected if `tenant_id` missing | ⬜ Planned |
| **Database (Roles)** | Schema-level permission separation | ⬜ Planned |
| **Database (RLS)** | Row-Level Security policies | 🔮 Future (v1.1.0) |

**MVP Isolation Model:**
```typescript
// Every query is rewritten by the Kernel Adapter
SELECT * FROM finance.payments WHERE status = 'pending'
// Becomes:
SELECT * FROM finance.payments 
WHERE status = 'pending' AND tenant_id = '...'
```

---

### 3.3 Schema Architecture (Separation of Concerns)

**The "Two-Brain" Separation:**

```
┌──────────────────────────┐      ┌──────────────────────────┐
│     CONTROL PLANE        │      │       DATA PLANE         │
│    (Schema: kernel)      │      │    (Schema: finance)     │
│                          │      │                          │
│   [Users] [Roles]        │  ◄/X/►   [Ledgers] [Journals]   │
│   [Routes][Audit]        │      │   [Accounts] [FX Rates]  │
│                          │      │                          │
│   Owned by: Kernel       │      │   Owned by: Finance Cell │
└──────────────────────────┘      └──────────────────────────┘

◄/X/► = NO CROSS-SCHEMA JOINS (API communication only)
```

| Schema | Owner | Tables | Access |
|--------|-------|--------|--------|
| `kernel` | Kernel | tenants, users, roles, sessions, audit_events | Kernel only |
| `finance` | Finance Cells | companies, accounts, payments, journals | Finance Cells only |
| `config` | Platform | provider_profiles, selection_rules | Read-only at runtime |

---

### 3.4 Finance Data Model (CFO Priority)

**System of Record Artifacts:**

| Table | Immutability | Audit Fields | CFO Priority |
|-------|--------------|--------------|--------------|
| `journal_entries` | Append-only (no UPDATE/DELETE) | `posted_at`, `created_by` | **Critical** |
| `journal_lines` | Append-only (corrections via reversal) | Debit = Credit enforced | **Critical** |
| `fx_rates` | Versioned (`valid_from`/`valid_to`) | Rate source tracked | **Critical** |
| `accounts` | Mutable | `updated_at` | High |
| `payments` | Status machine | Full approval trail | High |

**Design Principles:**
- Currency stored as `BIGINT` (cents) or `DECIMAL` — never `FLOAT`
- Double-entry enforced: Sum(debit) = Sum(credit)
- Corrections via reversal journal, not UPDATE

---

### 3.5 Provider Portability (Future)

**Purpose:** Run Canon code on any Postgres provider without changes.

| Profile | Dimensions | Recommended Provider |
|---------|------------|----------------------|
| **Starter** | cost-sensitive, spiky, <50 connections | Neon Serverless |
| **Growth** | balanced, steady, 50-200 connections | AWS RDS |
| **Enterprise** | performance, compliance, >200 connections | AWS Aurora |
| **Regulated** | pci/hipaa, private networking | Dedicated RDS in VPC |

**Zero-Canon-Change Promise:** Canon and API code never changes when migrating between providers.

---

## 4. Deployment Modes

| Mode | Control Plane | Data Plane | Best For |
|------|---------------|------------|----------|
| **Mode A: Managed** | AI-BOS hosts | AI-BOS hosts | MVP, fastest onboarding |
| **Mode B: BYOS** | AI-BOS hosts | Tenant hosts | Enterprise, regulated |
| **Mode C: Hybrid** | AI-BOS hosts | Tenant choice | Complement philosophy |

---

## 5. Roadmap Options

### Option A: MVP (2-Week Sprint)

**Goal:** Production-ready for demo with Kernel integration.

| Week | Deliverable | Status |
|------|-------------|--------|
| **Week 1** | | |
| Day 1-2 | DB Role Separation (kernel, finance, config roles) | ⬜ |
| Day 3 | Tenant Isolation Integration Tests | ⬜ |
| Day 4 | Double-Entry Constraint (trigger or check) | ⬜ |
| Day 5 | Connection Pooling (PgBouncer or pgpool) | ⬜ |
| **Week 2** | | |
| Day 6-7 | Backup Strategy (pg_dump automation) | ⬜ |
| Day 8 | Observability (slow query logging, metrics) | ⬜ |
| Day 9 | Schema Guardian Enforcement (block mode in CI) | ⬜ |
| Day 10 | Documentation + Demo | ⬜ |

**MVP Acceptance Criteria:**

| Criterion | Test |
|-----------|------|
| Tenant isolation enforced | Query without `tenant_id` throws error |
| Schema boundary enforced | `aibos_kernel_role` cannot SELECT from finance |
| Double-entry enforced | Insert with Debit ≠ Credit fails |
| Migrations run cleanly | `pnpm migrate` exits 0 |
| Schema Guardian passes | `pnpm validate` exits 0 |

---

### Option B: Full Development (6-Week Sprint)

**Goal:** Enterprise-ready with provider portability and RLS.

| Phase | Weeks | Deliverables |
|-------|-------|--------------|
| **Phase 1: Foundation** | 1-2 | MVP scope (see above) |
| **Phase 2: Security** | 3-4 | RLS policies, encryption-at-rest, audit logging |
| **Phase 3: Portability** | 5-6 | BYOS mode, provider selection, migration runbooks |

**Additional Features:**

| Feature | Description | Week |
|---------|-------------|------|
| RLS Policies | Row-Level Security for all TENANT_SCOPED tables | 3 |
| Provider Profiles | `config.provider_profiles` implementation | 4 |
| BYOS Mode | Split-brain deployment testing | 5 |
| Migration Runbook | Automated provider migration workflow | 6 |
| Query Optimizer | Slow query detection + index recommendations | 6 |

---

## 6. Technical Specifications

### 6.1 DB Roles (to be implemented)

```sql
-- Create schema-specific roles
CREATE ROLE aibos_kernel_role;
CREATE ROLE aibos_finance_role;
CREATE ROLE aibos_config_role;

-- Kernel role: kernel schema only
GRANT USAGE ON SCHEMA kernel TO aibos_kernel_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA kernel TO aibos_kernel_role;
REVOKE ALL ON SCHEMA finance FROM aibos_kernel_role;
REVOKE ALL ON SCHEMA config FROM aibos_kernel_role;

-- Finance role: finance schema only
GRANT USAGE ON SCHEMA finance TO aibos_finance_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA finance TO aibos_finance_role;
REVOKE ALL ON SCHEMA kernel FROM aibos_finance_role;

-- Config role: config schema read-only
GRANT USAGE ON SCHEMA config TO aibos_config_role;
GRANT SELECT ON ALL TABLES IN SCHEMA config TO aibos_config_role;
```

### 6.2 Double-Entry Constraint

```sql
-- Option A: Trigger (flexible)
CREATE OR REPLACE FUNCTION finance.check_double_entry()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT SUM(CASE WHEN debit_cents > 0 THEN debit_cents ELSE 0 END) -
             SUM(CASE WHEN credit_cents > 0 THEN credit_cents ELSE 0 END)
      FROM finance.journal_lines
      WHERE journal_entry_id = NEW.journal_entry_id) != 0 THEN
    RAISE EXCEPTION 'Double-entry violation: Debits must equal Credits';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Option B: Check constraint (immediate)
ALTER TABLE finance.journal_lines
ADD CONSTRAINT check_debit_or_credit
CHECK (
  (debit_cents > 0 AND credit_cents = 0) OR
  (credit_cents > 0 AND debit_cents = 0)
);
```

### 6.3 Tenant Isolation Test

```typescript
// Integration test: Tenant isolation
describe('Tenant Isolation', () => {
  it('should reject query without tenant_id', async () => {
    await expect(
      db.query('SELECT * FROM finance.payments')
    ).rejects.toThrow('tenant_id required');
  });

  it('should only return data for specified tenant', async () => {
    const tenant1Data = await db.query(
      'SELECT * FROM finance.payments',
      { tenantId: TENANT_1 }
    );
    const tenant2Data = await db.query(
      'SELECT * FROM finance.payments',
      { tenantId: TENANT_2 }
    );
    
    expect(tenant1Data).not.toContainEqual(
      expect.objectContaining({ tenant_id: TENANT_2 })
    );
  });
});
```

---

## 7. Security Requirements

### 7.1 Non-Negotiables (from Constitution)

| Requirement | Implementation |
|-------------|----------------|
| **Tenant Isolation** | Application-level guard (MVP), RLS (future) |
| **Audit Trail** | `kernel.audit_events` (immutable) |
| **Schema Boundaries** | DB role permissions + no cross-schema JOINs |
| **Encryption** | TLS 1.3 in-transit, AES-256 at-rest |

### 7.2 Access Control Matrix

| Role | kernel | finance | config |
|------|--------|---------|--------|
| `aibos_kernel_role` | CRUD | ❌ | Read |
| `aibos_finance_role` | ❌ | CRUD | Read |
| `aibos_config_role` | ❌ | ❌ | Read |
| `aibos_admin` | ALL | ALL | ALL |
| `aibos_migration` | DDL | DDL | DDL |

---

## 8. Observability

### 8.1 Metrics to Monitor

| Metric | Alert Threshold | Action |
|--------|-----------------|--------|
| Connection pool utilization | > 80% | Scale pool |
| Query latency p99 | > 100ms | Analyze slow queries |
| Disk usage | > 80% | Expand storage |
| Failed tenant isolation attempts | > 0 | Immediate investigation |

### 8.2 Slow Query Logging

```sql
-- Enable in production
ALTER SYSTEM SET log_min_duration_statement = 1000; -- 1 second
ALTER SYSTEM SET log_statement = 'ddl';
SELECT pg_reload_conf();
```

---

## 9. Decision Matrix

### 9.1 MVP vs Full Development

| Factor | MVP (2 weeks) | Full (6 weeks) |
|--------|---------------|----------------|
| **Scope** | Core governance | Enterprise-ready |
| **Tenant Isolation** | Application-level | Application + RLS |
| **Provider Portability** | Docker only | Multi-provider |
| **Deployment Mode** | Managed only | Managed + BYOS |
| **Risk** | Low | Medium |
| **Suitable For** | Demo, PoC, early customers | Production, enterprise |

### 9.2 Recommendation

**Start with MVP (2 weeks):**
1. Proves the governance model works
2. Integrates with Kernel and Payment Hub Cell
3. Can demo to CFO/CTO
4. Foundation for Phase 2 expansion

**Then extend to Full Development:**
1. Add RLS for defense-in-depth
2. Implement BYOS for enterprise customers
3. Build Query Optimizer for performance

---

## 10. Success Metrics

### 10.1 MVP Success Criteria

| Metric | Target |
|--------|--------|
| Schema Guardian blocks bad migrations | 100% |
| Tenant isolation test pass rate | 100% |
| Cross-schema access blocked | 100% |
| Migration runner success rate | 100% |
| Double-entry constraint violations | 0 |

### 10.2 Production Success Criteria

| Metric | Target |
|--------|--------|
| Query latency p99 | < 100ms |
| Database uptime | 99.9% |
| Failed isolation attempts (blocked) | 0 |
| Backup success rate | 100% |
| Migration rollback success | 100% |

---

## 11. Related Documents

- [CONT_00: Constitution](../../packages/canon/A-Governance/A-CONT/CONT_00_Constitution.md) — Supreme Governance
- [CONT_03: Database Architecture](../../packages/canon/A-Governance/A-CONT/CONT_03_DatabaseArchitecture.md) — Full Specification
- [CONT_02: Kernel Architecture](../../packages/canon/A-Governance/A-CONT/CONT_02_KernelArchitecture.md) — Control Plane
- [apps/db/README.md](./README.md) — Quick Start Guide

---

## 12. Appendix: File Structure

```
apps/db/
├── migrations/
│   ├── kernel/           # 001-013 (Control Plane)
│   ├── finance/          # 100+ (Data Plane)
│   └── config/           # 200+ (Platform Config)
├── seeds/
│   ├── kernel/           # Demo tenant, admin user
│   └── finance/          # Demo companies, accounts
├── tools/
│   └── validate-schema.ts    # Schema Guardian
├── scripts/
│   └── migrate.ts            # Migration runner
├── docker-compose.yml
├── package.json
├── README.md
└── PRD-DB.md                 # This document
```

---

**End of PRD-DB v1.0.0**

---

## 🎯 Next Step: Choose Your Path

| Option | Description | Duration | Command |
|--------|-------------|----------|---------|
| **A** | MVP Sprint | 2 weeks | Start with DB Role Separation |
| **B** | Full Development | 6 weeks | Start with MVP, extend to RLS |

**Recommendation:** Start with **MVP (Option A)** to prove the model, then extend.
