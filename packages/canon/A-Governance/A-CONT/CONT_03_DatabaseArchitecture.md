> **🟡 [DRAFT]** — Pending Certification  
> **Canon Code:** CONT_03  
> **Version:** 0.2.2 (MVP-Ready)  
> **Created:** 2025-12-15  
> **Updated:** 2025-12-15  
> **Plane:** A — Governance (Contract)  
> **Binding Scope:** All AI-BOS Database Infrastructure  
> **Authority:** AI-BOS Data Fabric & Persistence Standard

---

# AI-BOS Data Fabric Standard v0.2.2

> **Beyond "Just Postgres" — An Intelligent, Tenant-Aware Data Governance Layer**

---

## 1. Vision & Purpose

### 1.1 The "Data Fabric" Concept

AI-BOS DB is **not a database engine**; it is an **intelligent governance and orchestration layer** over raw infrastructure.

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
│  │  │ Schema   │ │ Query    │ │ Provider │ │ Compliance │  │    │
│  │  │ Guardian │ │ Optimizer│ │ Selector │ │ Enforcer   │  │    │
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

### 1.2 What We Complement (Not Replace)

| Layer | What They Provide | What AI-BOS Adds |
|-------|-------------------|------------------|
| **AWS RDS / Neon / Supabase** | Storage bytes, TCP port, backups | Semantic isolation, tenant governance, schema enforcement |
| **ERP / Accounting Systems** | Business transactions | Connectors, mapping, audit extraction |
| **ORMs / Migration Tools** | Schema management | Policy checks, compliance validation |
| **BI / Reporting Tools** | Data visualization | Governed access, audit trails |

**Positioning:** *"AI-BOS governs Postgres anywhere."*

**Migration-Friendly:** Source-of-truth can remain external (e.g., Autocount, ERPNext, legacy ERP) during migration. AI-BOS can run in **audit/extraction mode first**, becoming the system of record only when the customer is ready.

### 1.3 The Governance Gap We Fill

We replace the **messy human process**, not the database:

| Question | Without AI-BOS | With AI-BOS |
|----------|----------------|-------------|
| "Who changed schema and why?" | Git blame + Slack archaeology | Audit trail + migration manifest |
| "Why is this query slow?" | Manual EXPLAIN analysis | Automatic optimization suggestions |
| "Can we prove tenant isolation?" | "Trust me" | Application-level guard + schema separation + tests |
| "Which index should we add?" | DBA tribal knowledge | AI-recommended, shadow-tested |

### 1.4 Ecosystem Positioning

> **AI-BOS DB complements Postgres providers and existing systems; it is not a replacement engine.**

**Supported Providers (Postgres-first):**

| Provider Class | Examples | Use Case |
|----------------|----------|----------|
| **Local / Dev** | Docker Postgres | Development, testing |
| **Serverless** | Neon, Supabase | Low-cost, spiky workloads |
| **Managed** | AWS RDS, GCP Cloud SQL, Azure DB | Production, steady load |
| **Enterprise** | AWS Aurora, AlloyDB | High concurrency, compliance |

---

## 2. Core Philosophy

### 2.1 The Promise

> **"Write your Canon once. We manage provider selection based on the Tenant's profile — from serverless to enterprise-grade, without code changes."**

### 2.2 Non-Negotiable Rules

| Rule | Rationale | Enforcement |
|------|-----------|-------------|
| **Every table has `tenant_id`** | Multi-tenancy is mandatory | Schema Guardian rejects |
| **Every table has `created_at`, `updated_at`** | Audit trail requirement | Migration linter |
| **No cross-schema joins in app code** | Hexagonal boundaries | Query analyzer |
| **All DDL via numbered migrations** | Reproducible, auditable | CI/CD gate |
| **Soft deletes for business data** | Compliance requirement | Schema Guardian |

**Exception: Table Scoping Model**

Tables are classified as either `TENANT_SCOPED` or `GLOBAL`:

| Scope | `tenant_id` | Examples | Runtime Access |
|-------|-------------|----------|----------------|
| `TENANT_SCOPED` | Required, NOT NULL | `users`, `payments`, `accounts` | Read/Write via Cell |
| `GLOBAL` | NULL (column omitted) | `permissions`, `provider_profiles`, `currencies` | Read-only in runtime |

**Rule:** GLOBAL tables must be:
- Explicitly declared in migration comments
- Read-only at application runtime (writes only via admin/migration)
- Excluded from tenant isolation checks

### 2.3 Logical Sharding by Default

Every query is rewritten to enforce `WHERE tenant_id = $1`. Tenant isolation is **enforced at the application layer** via the Kernel Adapter, tested via integration tests.

**MVP Isolation Model:** Application-Level (Trusted Kernel Backend)  
**Future Enhancement:** Database-Level RLS as defense-in-depth (v1.1.0+)

```typescript
// What the Cell writes:
SELECT * FROM finance.payments WHERE status = 'pending'

// What AI-BOS executes:
SELECT * FROM finance.payments 
WHERE status = 'pending' 
  AND tenant_id = '11111111-1111-1111-1111-111111111111'
```

---

## 3. Deployment Modes

### 3.1 Mode Overview

| Mode | Kernel (Control Plane) | Finance (Data Plane) | Best For |
|------|------------------------|----------------------|----------|
| **Mode A: Managed** | AI-BOS hosts | AI-BOS hosts | Fastest onboarding, MVP |
| **Mode B: BYOS** | AI-BOS hosts | Tenant hosts | Enterprise, regulated |
| **Mode C: Hybrid** | AI-BOS hosts | Tenant choice | Complement philosophy |

### 3.2 Mode A — Fully Managed

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI-BOS MANAGED                                │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │              AI-BOS Postgres Cluster                     │   │
│   │                                                          │   │
│   │   kernel schema    │    finance schema                   │   │
│   │   (control plane)  │    (data plane)                     │   │
│   │                    │                                     │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Best for:** Startups, MVPs, teams without DBA expertise.

### 3.3 Mode B — Bring Your Own Storage (BYOS)

```
┌─────────────────────────────────────────────────────────────────┐
│   AI-BOS MANAGED                │     TENANT MANAGED            │
│                                 │                                │
│   ┌─────────────────────────┐   │   ┌─────────────────────────┐ │
│   │  AI-BOS Postgres        │   │   │  Tenant's AWS RDS       │ │
│   │                         │   │   │                         │ │
│   │  kernel schema          │◄──┼──►│  finance schema         │ │
│   │  (control plane)        │   │   │  (data plane)           │ │
│   │                         │   │   │                         │ │
│   └─────────────────────────┘   │   └─────────────────────────┘ │
│                                 │                                │
└─────────────────────────────────────────────────────────────────┘
```

**Best for:** Enterprise, regulated industries, "we own our data" requirement.

### 3.4 Mode C — Hybrid (Recommended)

- **Kernel control-plane** stays AI-BOS-managed (global reliability)
- **Domain data-plane** can be tenant-hosted or AI-BOS-managed
- Cells connect via Kernel Gateway regardless of data location

---

## 4. Schema Architecture

### 4.1 The "Two-Brain" Separation

The Control Plane and Data Plane are designed to be **physically separable**. Today they may share a Postgres cluster; tomorrow they could run on different servers.

```
┌─────────────────────────────────────────────────────────────────┐
│                       AI-BOS DATA FABRIC                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────┐      ┌──────────────────────────┐ │
│  │     CONTROL PLANE        │      │       DATA PLANE         │ │
│  │    (Schema: kernel)      │      │    (Schema: finance)     │ │
│  │                          │      │                          │ │
│  │   [Users] [Roles]        │  ◄/X/►   [Ledgers] [Journals]   │ │
│  │   [Routes][Audit]        │      │   [Accounts] [FX Rates]  │ │
│  │                          │      │                          │ │
│  │   Owned by: Kernel       │      │   Owned by: Finance Cell │ │
│  └──────────────────────────┘      └──────────────────────────┘ │
│             ▲                                    ▲              │
│             │                                    │              │
│      Always AI-BOS Managed              AI-BOS OR Tenant BYOS   │
│                                                                  │
│   ◄/X/► = NO CROSS-SCHEMA JOINS (API communication only)       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Future-Proofing:** The `kernel` and `finance` schemas could theoretically live on **different physical servers**. This is why cross-schema joins are forbidden — all communication goes through APIs.

### 4.2 Schema Hierarchy (Current: Single Cluster)

```
┌─────────────────────────────────────────────────────────────────┐
│                       AI-BOS DB (Postgres 15+)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    kernel (schema)                       │    │
│  │  Control Plane — Owned by AI-BOS Kernel                 │    │
│  │  Location: Always AI-BOS Managed                        │    │
│  │                                                          │    │
│  │  tenants │ users │ roles │ sessions │ canons │ routes   │    │
│  │  events  │ audit_events │ role_permissions              │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   finance (schema)                       │    │
│  │  Data Plane — Owned by Finance Cells                    │    │
│  │  Location: AI-BOS Managed OR Tenant BYOS                │    │
│  │                                                          │    │
│  │  accounts │ fx_rates │ transactions │ journal_entries   │    │
│  │  journal_lines │ companies │ approvals                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   config (schema)                        │    │
│  │  Platform Configuration — Read-heavy, Write-rare        │    │
│  │                                                          │    │
│  │  settings │ policies │ features │ provider_profiles     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Schema Ownership

| Schema | Owner | Access | Location |
|--------|-------|--------|----------|
| `kernel` | AI-BOS Kernel | Kernel only | Always AI-BOS managed |
| `finance` | Finance Cells | Finance Cells only | AI-BOS or BYOS |
| `config` | Platform | Read: All, Write: Admin | AI-BOS managed |

---

## 5. Provider Portability

### 5.1 Provider Selection Model

Use a **fitness function** across 6 dimensions:

```yaml
# Tenant Database Requirements Manifest
db_requirements:
  tenant_id: "11111111-1111-1111-1111-111111111111"
  
  # Scoring dimensions
  cost_sensitivity: "high"      # high | medium | low
  workload: "oltp"              # oltp | olap | mixed
  burstiness: "spiky"           # spiky | steady
  concurrency_target: 80        # expected connections
  compliance: "none"            # none | soc2 | pci | hipaa
  region: "ap-southeast-1"      # data residency
  budget_mode: "cost-sensitive" # cost-sensitive | performance | balanced
```

### 5.2 Provider Decision Matrix

| Profile | Dimensions | Recommended Provider |
|---------|------------|----------------------|
| **Starter** | cost-sensitive, spiky, <50 connections | Neon Serverless |
| **Growth** | balanced, steady, 50-200 connections | AWS RDS / Cloud SQL |
| **Enterprise** | performance, compliance, >200 connections | AWS Aurora / AlloyDB |
| **Regulated** | pci/hipaa, private networking | Dedicated RDS in VPC |

### 5.3 Provider Capabilities Profile

Each supported provider must declare capabilities and constraints. **Note:** Specific limits (storage, compute) are non-contractual examples and vary by provider tier.

```yaml
# Example: Serverless Provider Profile (Illustrative)
provider: serverless-class
capabilities:
  connection_pooling: true
  auto_suspend: true
  branching: boolean        # Provider-specific
  backup_rpo: "configurable"
  compliance: ["list of certifications"]
  regions: ["list of supported regions"]
  
constraints:
  max_connections: "tier-dependent"
  storage: "tier-dependent"
  compute: "tier-dependent"
```

### 5.4 Zero-Canon-Change Promise

The Canon and API code **never changes** when migrating between providers. Data movement follows an **approved migration runbook** which may include:
- Scheduled maintenance windows
- Data copy/sync periods
- Customer approval gates

**The Kernel's role:**
1. Reads the tenant's `db_requirements` manifest
2. Matches against available provider profiles
3. Initiates migration via approved runbook
4. Updates connection routing after validation

---

## 6. AI Governance Capabilities ("Silent Killers")

### 6.1 Schema Guardian (Normalization)

**What it does:** Detects schema violations before they reach production.

| Detection | Action |
|-----------|--------|
| Missing `tenant_id` | Block migration |
| Missing FK constraints | Warning + recommendation |
| 1NF/2NF/3NF violations | Suggestion (shadow mode) |
| Duplicate entities | Alert |

**Enforcement Levels:**

| Level | Behavior |
|-------|----------|
| `shadow` | Log warnings, allow migration |
| `warn` | Require acknowledgment |
| `block` | Reject migration |

### 6.2 Query Optimizer (Performance)

**What it does:** Watches query patterns and suggests optimizations.

| Detection | Recommendation |
|-----------|----------------|
| OFFSET pagination at scale | Switch to keyset pagination |
| Missing index on filter column | Add index (with DDL) |
| N+1 query pattern | Batch or JOIN |
| Full table scan | Add WHERE clause or index |

**Optimization Guardrails:**

| Action | Approval Required |
|--------|-------------------|
| Index suggestion | Auto-apply in dev, manual in prod |
| Query rewrite | Always manual |
| Partition recommendation | Always manual |

### 6.3 Adaptive Cost Routing (Future)

**What it does:** Routes data to appropriate provider classes based on tenant profile.

```
┌─────────────────────────────────────────────────────────────────┐
│                    TENANT ROUTING LOGIC                          │
│                                                                  │
│   Tenant Profile     │  Provider Class      │  Rationale         │
│   ─────────────────────────────────────────────────────────────  │
│   Evaluation         │  Serverless (shared) │  Low barrier       │
│   Growth             │  Managed (dedicated) │  Steady workload   │
│   Enterprise         │  BYOS (tenant-owned) │  Compliance, VPC   │
│                                                                  │
│   Note: Specific providers selected based on region/compliance   │
└─────────────────────────────────────────────────────────────────┘
```

### 6.4 Semantic Caching

**What it does:** Caches based on business intent, not just blocks.

| Data Type | Cache Policy | Rationale |
|-----------|--------------|-----------|
| `fx_rates` | 24h cache | Changes daily |
| `audit_events` | No cache | Write-heavy, rarely read |
| `ledger_entries` | Bypass cache | Critical accuracy |
| `config.settings` | 1h cache | Rarely changes |

---

## 7. Kernel Schema (Control Plane)

### 7.1 Core Tables (Implemented)

| Table | Purpose | Migration |
|-------|---------|-----------|
| `tenants` | Organization isolation | 001 |
| `users` | Identity store | 002 |
| `roles` | Permission containers | 003 |
| `role_permissions` | Role ↔ Permission mapping | 004 |
| `sessions` | Active JWT sessions | 005 |
| `canons` | Service registry | 006 |
| `routes` | API route mappings | 007 |
| `events` | Event bus messages | 008 |
| `audit_events` | Immutable audit log | 009 |
| `permissions` | Permission definitions | 012 |
| `user_roles` | User ↔ Role mapping | 013 |

---

## 8. Finance Schema (Data Plane) — "The Business Truth"

### 8.1 Core Tables (MVP)

| Table | Purpose | Key Design | CFO Priority |
|-------|---------|------------|--------------|
| `accounts` | Chart of Accounts + Bank Accounts | `balance_cents` as BIGINT | High |
| `fx_rates` | Exchange rates (Market Truth) | High precision DECIMAL(20,10) | **Critical** |
| `transactions` | Payment requests (Intent) | Status machine | High |
| `journal_entries` | GL posting headers (System of Record) | Links to transaction | **Critical** |
| `journal_lines` | Debit/Credit entries (Immutable Truth) | Double-entry enforced | **Critical** |

### 8.2 System of Record Artifacts

**These tables are what CFOs and auditors care about most:**

| Artifact | Immutability Rule | Audit Requirement |
|----------|-------------------|-------------------|
| **`journal_entries`** | Append-only (no UPDATE, no DELETE) | Every entry has `posted_at`, `created_by` |
| **`journal_lines`** | Append-only (corrections via reversal journal) | Debit = Credit enforced |
| **`fx_rates`** | Versioned (no overwrite, `valid_from`/`valid_to`) | Rate source tracked |

### 8.3 Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Currency Safety** | Store as `BIGINT` (cents) or `DECIMAL`, never `FLOAT` |
| **Double-Entry** | Sum of debits = Sum of credits (enforced by trigger or constraint) |
| **Immutability** | Journal entries are append-only, corrections via reversal |
| **Tenant Isolation** | Every table has `tenant_id` with index |
| **Auditability** | Every table has `created_at`, `created_by` |

---

## 9. Migration Strategy

### 9.1 Naming Convention

```
{sequence}_{schema}_{action}_{entity}.sql

Kernel: 001-099
Finance: 100-199
Config: 200-299
```

### 9.2 Migration Rules

| Rule | Enforcement |
|------|-------------|
| Append-only | Never modify existing migrations |
| Idempotent | Use `IF NOT EXISTS`, `ON CONFLICT` |
| Rollback required | `{sequence}_down.sql` for production |
| Schema prefix | `kernel.users`, `finance.accounts` |

### 9.3 Optimization Guardrails

| Change Type | Dev Environment | Production |
|-------------|-----------------|------------|
| Add column | Auto-apply | Manual approval |
| Add index | Auto-apply | Shadow test → approval |
| Drop column | Block (use deprecation) | Block |
| Alter type | Manual | Requires DBA review |

---

## 10. Security

### 10.1 Access Control Roles

| Role | Permissions | Use Case |
|------|-------------|----------|
| `aibos_app` | CRUD on app tables | Application runtime |
| `aibos_migration` | ALL on objects | Schema migrations |
| `aibos_readonly` | SELECT only | Reporting, debugging |
| `aibos_admin` | ALL + CREATE/DROP | Emergency maintenance |

### 10.2 Tenant Isolation (MVP: Application-Level)

**For MVP, tenant isolation is enforced at the application layer:**

```typescript
// Kernel Adapter automatically appends tenant filter
async function query<T>(sql: string, params: any[], tenantId: string): Promise<T[]> {
  // Every query is rewritten to enforce tenant isolation
  const isolatedSql = appendTenantFilter(sql, tenantId);
  return await pool.query(isolatedSql, [...params, tenantId]);
}
```

**Why not RLS for MVP?**
- RLS requires complex "impersonation" (`SET app.tenant_id = ...`) for every query
- Adds latency and complexity to connection pooling
- The Kernel is a **trusted backend** — it controls all data access

**Future (v1.1.0+): RLS as Defense-in-Depth**

```sql
-- Future: Add RLS as secondary enforcement layer
ALTER TABLE finance.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON finance.accounts
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

### 10.3 Encryption

| Layer | Method | Notes |
|-------|--------|-------|
| In-Transit | TLS 1.3 | Required for production |
| At-Rest | AES-256 | Managed by provider |
| Application | bcrypt | Cost factor 12 for passwords |

### 10.4 Enforcement Mechanism (DB-Level)

**Hexagonal boundary enforcement via Postgres roles and grants:**

```sql
-- Separate roles per schema (Mode A: Managed)
CREATE ROLE aibos_kernel_role;
CREATE ROLE aibos_finance_role;
CREATE ROLE aibos_config_role;

-- Kernel role can ONLY access kernel schema
GRANT USAGE ON SCHEMA kernel TO aibos_kernel_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA kernel TO aibos_kernel_role;
REVOKE ALL ON SCHEMA finance FROM aibos_kernel_role;

-- Finance role can ONLY access finance schema
GRANT USAGE ON SCHEMA finance TO aibos_finance_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA finance TO aibos_finance_role;
REVOKE ALL ON SCHEMA kernel FROM aibos_finance_role;

-- Cross-schema joins become IMPOSSIBLE by permissions, not just policy
```

**Result:** Even if application code attempts a cross-schema join, Postgres will reject it with a permission error.

| Enforcement Layer | Mechanism | Failure Mode | MVP Status |
|-------------------|-----------|--------------|------------|
| **Application** | Query analyzer warns | Logged warning | ✅ Implemented |
| **Driver** | Tenant context guard | Request rejected (400) | ✅ Implemented |
| **Database** | Role permissions | SQL error (42501) | ✅ Implemented |
| **Defense-in-Depth** | RLS policies | Row filtered silently | 🔮 Future (v1.1.0) |

---

## 11. Observability

### 11.1 Metrics to Monitor

| Metric | Alert Threshold | Action |
|--------|-----------------|--------|
| Connection pool utilization | > 80% | Scale pool |
| Query latency p99 | > 100ms | Analyze slow queries |
| Disk usage | > 80% | Expand storage |
| Replication lag | > 60s | Check replica |

### 11.2 Query Analysis

```sql
-- Enable slow query logging
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET log_statement = 'ddl';
```

---

## 12. AI Governance & Orchestration Layer (Future State)

### 12.1 Vision

Move from **static governance** to **autonomous data management**:

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI GOVERNANCE LAYER                           │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │ Deep Active      │  │ Self-Healing     │  │ Multi-Cloud   │  │
│  │ Optimization     │  │ Anomaly Detect   │  │ Orchestrator  │  │
│  │                  │  │                  │  │               │  │
│  │ - Index tuning   │  │ - Latency spikes │  │ - Cost routing│  │
│  │ - Query rewrite  │  │ - Security events│  │ - Compliance  │  │
│  │ - Partition      │  │ - Data drift     │  │ - Migration   │  │
│  └──────────────────┘  └──────────────────┘  └───────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 12.2 Roadmap

| Phase | Capability | Target |
|-------|------------|--------|
| **Phase 1** | Observability instrumentation | MVP |
| **Phase 2** | Auto-indexing with shadow testing | v1.1.0 |
| **Phase 3** | Provider auto-selection | v1.2.0 |
| **Phase 4** | Predictive scaling | v2.0.0 |

### 12.3 MCP Integration (Model Context Protocol)

Enable AI agents to orchestrate across the data fabric **via APIs, not cross-schema joins**:

```typescript
// Future: AI assistant query
"Show all failed payments from last week with related audit events"

// MCP translates to (API-based, respecting hexagonal boundaries):
1. Query Payment Cell API: GET /payments?status=FAILED&since=7d
   → Returns: [{id, correlation_id, ...}, ...]
   
2. Query Kernel Audit API: GET /audit?correlation_id=abc123,def456
   → Returns: [{action, actor_id, timestamp, ...}, ...]
   
3. Correlate in-memory by correlation_id
4. Format response for human consumption

// Note: NO cross-schema SQL joins — APIs enforce boundaries
```

---

## 13. MVP Scope

### 13.1 What's Included in MVP

- [x] Kernel schema (13 migrations)
- [x] Finance schema (100_finance_schema.sql)
- [ ] Schema Guardian (basic validation)
- [ ] Docker Compose for local dev
- [ ] Basic observability

### 13.2 MVP Acceptance Criteria (Measurable Gates)

| Gate | Acceptance Criteria | Verification |
|------|---------------------|--------------|
| **Tenant Isolation** | No query executes without tenant context | Driver guard throws if `tenant_id` missing |
| **Schema Guardian** | Blocks migrations missing `tenant_id` on TENANT_SCOPED tables | Unit test: reject bad migration |
| **Double-Entry Ledger** | Sum(debit) = Sum(credit) per journal entry | Trigger or check constraint |
| **Finance MVP Tables** | companies, accounts, transactions, journals exist | Migration success |
| **Cross-Schema Block** | Kernel role cannot SELECT from finance schema | Postgres permission error test |

### 13.3 What's Deferred to v1.1.0

- [ ] BYOS mode implementation
- [ ] Provider auto-selection
- [ ] Query Optimizer
- [ ] Read replicas
- [ ] Full RLS policy coverage
- [ ] Neon branching integration for shadow testing

---

**End of Contract CONT_03 v0.2.2**

---

**Changelog:**
- v0.2.2: MVP-ready — deferred RLS to v1.1.0, emphasized Application-Level Isolation, added "Two-Brain" physical separation, emphasized System of Record artifacts
- v0.2.1: Certifiable patch — removed absolute claims, fixed MCP example, added GLOBAL table exception, renamed Zero-Canon-Change Promise, added enforcement mechanism
- v0.2.0: Strategic update — DGOL positioning, deployment modes, provider portability
- v0.1.0: Initial draft

**Next Steps:**
1. Apply `100_finance_schema.sql` migration
2. Create `PRD-DB-MVP.md` sprint plan
3. Implement Schema Guardian (basic)
4. Implement DB role separation per schema
5. Create finance seed script (`seed-finance.ts`)
