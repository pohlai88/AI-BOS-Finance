# AI-BOS Data Fabric — Product Requirements Document

> **The Intelligent Database Governance & Orchestration Layer (DGOL)**  
> Beyond "Just Postgres" — An AI-Governed, Tenant-Aware Data Plane.

---

## 📋 Document Control

| Property | Value |
|----------|-------|
| **Version** | 2.1.0 |
| **Status** | 🟢 **MVP COMPLETE + CFO TRUST TEST VERIFIED** |
| **Owner** | Data Fabric Team |
| **Derives From** | [CONT_03_DatabaseArchitecture.md](../../packages/canon/A-Governance/A-CONT/CONT_03_DatabaseArchitecture.md) |
| **Constitution** | [CONT_00_Constitution.md](../../packages/canon/A-Governance/A-CONT/CONT_00_Constitution.md) — Pillar 5 (DB) |
| **Supabase Project** | `https://cnlutbuzjqtuicngldak.supabase.co` |
| **Security Rating** | **9.5/10** (Tenant Guard v2 + Governance Views) |
| **Last Updated** | 2025-12-15 |

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
| **Application (v2)** | `TenantDb` repository with parameterized queries | ✅ **Hardened** |
| **Driver** | Request rejected if `tenant_id` missing | ✅ Implemented |
| **Database (Roles)** | Schema-level permission separation | ✅ Deployed |
| **Database (RLS)** | Row-Level Security policies (Supabase) | ✅ 57 policies |

**Tenant Guard v2 (Repository Pattern):**

> ⚠️ **SECURITY UPGRADE:** The original SQL string rewriting approach was replaced
> with a repository pattern using parameterized queries and compile-time whitelisted identifiers.

```typescript
// TenantDb enforces isolation via parameterized queries
const tenantDb = new TenantDb(pool);
const ctx = { tenantId: 'uuid', userId: 'uuid' };

// All queries automatically include tenant_id = $1
const { rows } = await tenantDb.select(ctx, 'users', ['id', 'email']);
// Generates: SELECT id, email FROM users WHERE tenant_id = $1

// Inserts auto-inject tenant_id (cannot be overridden)
await tenantDb.insert(ctx, 'users', { email: 'test@example.com' });
// Generates: INSERT INTO users (email, tenant_id) VALUES ($1, $2)
```

**Security Guarantees:**
- ✅ No SQL string rewriting (eliminates injection risk)
- ✅ Compile-time whitelisted table/column identifiers
- ✅ Parameterized predicates only
- ✅ Cross-tenant access blocked at repository level
- ✅ 37 security tests passing

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

### 3.4 Provider Portability Architecture

**Purpose:** Run Canon code on any PostgreSQL provider without changes.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      AI-BOS DATABASE ARCHITECTURE                        │
│                    "PostgreSQL First, Adapters Second"                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                    CORE LAYER (PostgreSQL Standard)             │     │
│  │                                                                 │     │
│  │   migrations/kernel/  migrations/finance/  migrations/config/  │     │
│  │   ─────────────────────────────────────────────────────────── │     │
│  │   • Standard DDL (CREATE TABLE, INDEX, CONSTRAINT)             │     │
│  │   • Works on ANY PostgreSQL 15+ provider                       │     │
│  │   • NO provider-specific functions                             │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                              │                                           │
│                    [Provider Detection]                                  │
│                              │                                           │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                   ADAPTER LAYER (Provider-Specific)             │     │
│  │                                                                 │     │
│  │   adapters/supabase/     adapters/neon/     adapters/rds/      │     │
│  │   ──────────────────     ────────────────   ──────────────     │     │
│  │   • RLS with auth.uid()  • Branching        • Read replicas    │     │
│  │   • Storage policies     • Autoscaling      • IAM auth         │     │
│  │   • Edge Functions       • Serverless       • VPC              │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Current Adapters:**

| Adapter | Status | Features |
|---------|--------|----------|
| **Supabase** | ✅ Deployed | RLS, Storage, Edge Functions, Auth integration |
| **Self-Hosted** | 🟡 Planned | Session-based RLS, PgBouncer, vanilla PostgreSQL |
| **Neon** | 📋 Backlog | Serverless, branching, autoscaling |
| **AWS RDS** | 📋 Backlog | Read replicas, IAM, VPC |

---

### 3.5 Finance Data Model (CFO Priority)

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

### 3.6 Provider Selection Matrix

**Purpose:** Match tenant profile to optimal provider.

| Profile | Dimensions | Recommended Provider | Adapter |
|---------|------------|----------------------|---------|
| **Starter** | cost-sensitive, spiky, <50 connections | Supabase Free | `supabase` |
| **Growth** | balanced, steady, 50-200 connections | Supabase Pro / Neon | `supabase` / `neon` |
| **Enterprise** | performance, compliance, >200 connections | AWS Aurora | `aws-rds` |
| **Regulated** | PCI/HIPAA, private networking | Dedicated RDS in VPC | `aws-rds` |
| **Self-Hosted** | On-premise, full control | Docker / Kubernetes | `self-hosted` |

**Zero-Canon-Change Promise:** Canon and API code never changes when migrating between providers.

---

### 3.7 BYOS — Bring Your Own Storage (Backlog)

**Purpose:** Allow tenants to use their own storage while AI-BOS manages the database.

```
┌───────────────────────────────────────────────────────────────────┐
│                          BYOS ARCHITECTURE                         │
│              "AI-BOS Database + Tenant's Storage"                  │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────────────┐       ┌─────────────────────────────┐   │
│  │   AI-BOS MANAGED    │       │     TENANT MANAGED (BYOS)    │   │
│  │                     │       │                              │   │
│  │  PostgreSQL         │       │  Google Drive               │   │
│  │  ├── kernel.*      │◄─────►│  Dropbox                    │   │
│  │  ├── finance.*     │       │  OneDrive                   │   │
│  │  └── config.*      │       │  S3 (tenant account)        │   │
│  │                     │       │  MinIO (self-hosted)        │   │
│  │  Supabase Storage   │       │                              │   │
│  │  (if not BYOS)      │       │                              │   │
│  └─────────────────────┘       └─────────────────────────────┘   │
│                                                                    │
│  Metadata stored in:  finance.document_metadata                   │
│  Actual files stored: Tenant's chosen provider                    │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘
```

**BYOS Benefits:**
- **Data Sovereignty:** Tenant controls their document storage
- **Compliance:** Documents stay in tenant's jurisdiction
- **Cost:** Use existing storage quotas
- **Integration:** Native sharing/permissions in Drive/Dropbox

**BYOS Providers (Backlog):**

| Provider | Priority | Status | Notes |
|----------|----------|--------|-------|
| Google Drive | P2 | 📋 Backlog | OAuth, Drive API v3 |
| Dropbox | P2 | 📋 Backlog | OAuth, Dropbox API v2 |
| OneDrive | P3 | 📋 Backlog | Microsoft Graph API |
| S3 (tenant) | P2 | 📋 Backlog | Tenant provides credentials |
| MinIO | P3 | 📋 Backlog | Self-hosted S3-compatible |

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
│   ├── kernel/           # 001-016 (Control Plane + Governance Views)
│   ├── finance/          # 100-102 (Data Plane + Constraints)
│   └── config/           # 200+ (Platform Config)
├── adapters/
│   └── supabase/         # Supabase-specific RLS, storage, indexes
├── lib/
│   ├── tenant-db.ts      # 🔒 Tenant Guard v2 (repository pattern)
│   └── tenant-guard.ts   # ⚠️ Deprecated (safety clamp)
├── seeds/
│   ├── kernel/           # Demo tenant, admin user
│   ├── finance/          # Demo companies, accounts
│   └── challenge/        # Deterministic challenge seed + attacks
├── scripts/
│   ├── migrate.ts        # Migration runner
│   ├── demo-trust.ts     # 🎯 One-command CFO Trust Test
│   └── export-evidence-pack.ts  # Auditor evidence export
├── tests/
│   ├── tenant-db.test.ts # 37 security tests for TenantDb
│   └── child-table-isolation.test.sql  # FK isolation proof
├── tools/
│   └── validate-schema.ts    # Schema Guardian
├── docs/
│   ├── PAYMENT-HUB-INTEGRATION.md  # Payment Hub contract
│   └── backlog/          # Future feature specs
├── docker-compose.yml
├── package.json
├── README.md
├── PRD-DB.md             # This document
├── PRD-DB-MVP.md         # Sprint status
└── GA-PATCHLIST.md       # Production readiness
```

---

## 13. Backlog & Future Roadmap

### v1.1.0 — Governance Observability (COMPLETE ✅)

| Feature | Status | Notes |
|---------|--------|-------|
| Governance Views | ✅ Deployed | 8 views in kernel/finance schemas |
| Monitor Role | ✅ Created | `aibos_monitor_role` (read-only) |
| Evidence Pack Export | ✅ Implemented | JSON/CSV with tamper-evident hash |
| CFO Trust Test | ✅ Verified | 5 attacks blocked, all checks PASS |

**Views Created:**
- `kernel.v_tenant_health` — Tenant status, user/company counts
- `kernel.v_tenant_isolation_check` — Tenant isolation verification
- `kernel.v_schema_boundary_check` — Cross-schema access audit
- `kernel.v_governance_summary` — Aggregated pass/fail counts
- `finance.v_journal_integrity` — Double-entry balance verification
- `finance.v_journal_integrity_summary` — Per-tenant integrity summary
- `finance.v_immutability_check` — POSTED journal protection status
- `finance.v_double_entry_check` — Debit/credit balance per entry

### v1.2.0 — Neon Adapter (Q1 2025)

| Feature | Description | Effort |
|---------|-------------|--------|
| Neon Detection | Auto-detect `neon.tech` in DATABASE_URL | 1 day |
| Branching Support | Create dev/staging branches | 2 days |
| Autoscaling Config | Connection limits, compute scaling | 1 day |
| Cold Start Optimization | Connection pooling for serverless | 2 days |

**Why Neon?**
- Serverless PostgreSQL (pay-per-query)
- Instant branching (like Git for databases)
- Autoscaling compute
- Good for development/staging environments

---

### v1.3.0 — BYOS Storage Adapters (Q2 2025)

| Feature | Description | Effort |
|---------|-------------|--------|
| Storage Provider Interface | Abstract storage operations | 3 days |
| Google Drive Adapter | OAuth + Drive API integration | 5 days |
| Dropbox Adapter | OAuth + Dropbox API integration | 5 days |
| S3-Compatible Adapter | AWS S3, MinIO, Backblaze B2 | 3 days |
| Document Sync Service | Sync metadata with external storage | 5 days |

**Use Case:**
- CFO uploads invoice to their Google Drive
- AI-BOS stores metadata in `finance.document_metadata`
- Document remains in tenant's Drive (data sovereignty)
- AI-BOS can reference the document via stored path

---

### v1.4.0 — AWS/Azure Adapters (Q3 2025)

| Feature | Description | Effort |
|---------|-------------|--------|
| AWS RDS Adapter | IAM auth, read replicas, VPC | 5 days |
| AWS Aurora Adapter | Serverless v2, global database | 5 days |
| Azure PostgreSQL Adapter | Flexible server, AAD auth | 5 days |
| GCP Cloud SQL Adapter | Private IP, IAM | 5 days |

### v2.0.0 — Governance Dashboard UI (Q4 2025)

> **Philosophy:** External tools (Supabase Dashboard, Metabase, Grafana) handle generic DB management.
> AI-BOS builds a **Governance Overlay** that provides unique, AI-BOS-specific insights.

| Feature | Description | Priority |
|---------|-------------|----------|
| Tenant Health Score | Cross-tenant verification, anomaly detection | P1 |
| Journal Integrity Dashboard | Real-time balanced/unbalanced visualization | P1 |
| Compliance Posture Checklist | SOC2/HIPAA control status | P2 |
| Drift/Schema Guardian Alerts | Real-time schema change notifications | P2 |
| Evidence Pack Generator UI | One-click auditor artifact export | P2 |

**Non-Goals for v2.0:**
- ❌ SQL editor / query console (use Supabase/pgAdmin)
- ❌ Table browser / data viewer (use Supabase/Metabase)
- ❌ Backup management UI (use provider tools)

**Documentation:** [Governance Dashboard Backlog](./docs/backlog/100_governance_dashboard.md)

---

## 14. Compliance & Governance

### 14.1 SOC2 Type II Readiness

AI-BOS Data Fabric implements controls aligned with AICPA Trust Service Criteria:

| Control | TSC Reference | Implementation | Evidence |
|---------|---------------|----------------|----------|
| **Logical Access** | CC6.1 | TenantGuard + RLS policies | `lib/tenant-guard.ts`, RLS policies |
| **Role-Based Access** | CC6.2 | DB roles per schema | `014_create_db_roles.sql` |
| **Audit Logging** | CC6.6 | Immutable audit trail | `kernel.audit_events` |
| **Change Management** | CC8.1 | Numbered migrations + CI | `.github/workflows/db-validate.yml` |
| **Recovery Procedures** | CC7.4 | PITR + quarterly drills | `docs/backlog/099_emergency_recovery_plan.md` |

### 14.2 HIPAA Security Rule (if applicable)

For customers handling Protected Health Information (PHI):

| Requirement | Section | Implementation |
|-------------|---------|----------------|
| **Unique User Identification** | § 164.312(a)(2)(i) | `kernel.users.id` UUID |
| **Automatic Logoff** | § 164.312(a)(2)(iii) | JWT expiry + session timeout |
| **Encryption** | § 164.312(a)(2)(iv) | TLS 1.3 in-transit, AES-256 at-rest |
| **Audit Controls** | § 164.312(b) | `pg_stat_statements`, slow query log |
| **Integrity Controls** | § 164.312(c)(1) | Double-entry, journal immutability |
| **Transmission Security** | § 164.312(e)(1) | TLS 1.3 required for all connections |

### 14.3 Data Residency

| Region | Provider Options | Compliance |
|--------|------------------|------------|
| US (Oregon) | Supabase, AWS RDS | SOC2, HIPAA |
| EU (Frankfurt) | Supabase, AWS RDS | GDPR, SOC2 |
| Singapore | Supabase, AWS RDS | PDPA, SOC2 |
| Australia | AWS RDS | Privacy Act, SOC2 |

### 14.4 Disaster Recovery

| Objective | Target | Method |
|-----------|--------|--------|
| **RTO** (Recovery Time) | < 15 minutes | PITR, automated failover |
| **RPO** (Recovery Point) | < 1 minute | Continuous WAL archiving |
| **Backup Retention** | 30 days | Supabase managed |
| **Audit Log Retention** | 7 years | Cold storage (SOC2/HIPAA) |

**Documentation:** [Disaster Recovery Plan](./docs/backlog/099_emergency_recovery_plan.md)

### 14.5 GA Patchlist

Before production launch, review and complete:

**Documentation:** [GA Patchlist](./GA-PATCHLIST.md)

| Priority | Items | Status |
|----------|-------|--------|
| P0 (Blockers) | Tenant Guard v2 | ✅ **COMPLETE** |
| P0 (Blockers) | Governance Views | ✅ **COMPLETE** |
| P1 (Recommended) | pg_stat_statements, role hygiene | ✅ Deployed |
| P2 (Compliance) | SOC2/HIPAA docs, DR drills | 📋 Backlog |

### 14.6 CFO Trust Test Results (2025-12-15)

The database has been verified with a comprehensive "CFO Trust Test":

| Governance Check | Pass | Fail | Status |
|------------------|------|------|--------|
| **Tenant Isolation** | 25 | 0 | ✅ PASS |
| **Schema Boundary** | 0 | 0 | ✅ PASS |
| **Journal Integrity** | 14 | 0 | ✅ PASS |
| **Immutability** | 14 | 0 | ✅ PASS |

| Attack Scenario | Result |
|-----------------|--------|
| POST unbalanced journal | ✅ BLOCKED |
| Modify POSTED journal | ✅ BLOCKED |
| Delete POSTED journal | ✅ BLOCKED |
| Create orphan journal line | ✅ BLOCKED |
| Add lines to POSTED journal | ✅ BLOCKED |

**Run the demo:**
```bash
pnpm demo:trust
```

---

## 15. CLI & Tooling

### Supabase CLI

```bash
# Check version (should be 2.67.1+)
npx supabase --version

# Login to Supabase
npx supabase login

# Link to project
npx supabase link --project-ref cnlutbuzjqtuicngldak

# Push migrations
npx supabase db push

# Generate types
npx supabase gen types typescript --linked > types.ts

# Start local Supabase (for development)
npx supabase start
```

### Adapter Scripts

```bash
# Apply adapter based on DATABASE_URL
pnpm db:apply-adapter

# Apply specific adapter
pnpm db:apply-adapter --provider supabase
pnpm db:apply-adapter --provider neon
pnpm db:apply-adapter --provider self-hosted
```

### CFO Trust Test (Demo)

```bash
# 🎯 One-command demo: seed + verify + evidence pack
pnpm demo:trust

# Individual steps
pnpm seed:challenge           # Seed deterministic test data
pnpm test:tenant-db           # Run 37 security tests
pnpm evidence:export          # Generate auditor evidence pack
```

---

## 16. Related Documentation

### Governance & Architecture
- [CONT_00: Constitution](../../packages/canon/A-Governance/A-CONT/CONT_00_Constitution.md) — Supreme Governance
- [CONT_03: Database Architecture](../../packages/canon/A-Governance/A-CONT/CONT_03_DatabaseArchitecture.md) — Full Specification
- [ADR-003: Database Provider Portability](./ADR_003_DatabaseProviderPortability.md) — Two-layer architecture

### Operational
- [README.md](./README.md) — Quick start guide
- [PRD-DB-MVP.md](./PRD-DB-MVP.md) — MVP status & tasks
- [MVP-GATE-CHECKLIST.md](./MVP-GATE-CHECKLIST.md) — Gate criteria
- [GA-PATCHLIST.md](./GA-PATCHLIST.md) — Production readiness

### Adapters
- [adapters/supabase/README.md](./adapters/supabase/README.md) — Supabase setup
- [adapters/supabase/STORAGE-SETUP-GUIDE.md](./adapters/supabase/STORAGE-SETUP-GUIDE.md) — Storage config

### Compliance & DR
- [docs/backlog/099_emergency_recovery_plan.md](./docs/backlog/099_emergency_recovery_plan.md) — Disaster recovery

---

**End of PRD-DB v2.0.0**

---

## ✅ Current Status

| Phase | Status | Notes |
|-------|--------|-------|
| MVP (Option A) | ✅ Complete | 12/12 tasks done |
| Supabase Adapter | ✅ Deployed | 25 tables, 57 RLS policies |
| Tenant Guard v2 | ✅ **Hardened** | Repository pattern, 37 tests |
| Governance Views | ✅ Deployed | 8 views, monitor role |
| CFO Trust Test | ✅ **VERIFIED** | 5 attacks blocked, all checks PASS |
| Neon Adapter | 📋 Backlog | v1.2.0 |
| BYOS Storage | 📋 Backlog | v1.3.0 |
| AWS/Azure Adapters | 📋 Backlog | v1.4.0 |

**Current Rating:** 9.5/10 (Security + Compliance)

**Next Priority:** 
1. Payment Hub integration for end-to-end demo
2. Neon adapter for serverless development environments
