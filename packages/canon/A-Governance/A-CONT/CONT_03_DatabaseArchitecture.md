> **🟡 [DRAFT]** — Pending Certification  
> **Canon Code:** CONT_03  
> **Version:** 0.2.0 (Strategic Update)  
> **Created:** 2025-12-15  
> **Plane:** A — Governance (Contract)  
> **Binding Scope:** All AI-BOS Database Infrastructure  
> **Authority:** AI-BOS Data Fabric & Persistence Standard

---

# AI-BOS Data Fabric Standard v0.2.0

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

### 1.3 The Governance Gap We Fill

We replace the **messy human process**, not the database:

| Question | Without AI-BOS | With AI-BOS |
|----------|----------------|-------------|
| "Who changed schema and why?" | Git blame + Slack archaeology | Audit trail + migration manifest |
| "Why is this query slow?" | Manual EXPLAIN analysis | Automatic optimization suggestions |
| "Can we prove tenant isolation?" | "Trust me" | Mathematical enforcement at driver layer |
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

> **"Write your Canon once. We decide if it runs on a $0/mo Neon instance or a $5000/mo AWS cluster based on the Tenant's tier."**

### 2.2 Non-Negotiable Rules

| Rule | Rationale | Enforcement |
|------|-----------|-------------|
| **Every table has `tenant_id`** | Multi-tenancy is mandatory | Schema Guardian rejects |
| **Every table has `created_at`, `updated_at`** | Audit trail requirement | Migration linter |
| **No cross-schema joins in app code** | Hexagonal boundaries | Query analyzer |
| **All DDL via numbered migrations** | Reproducible, auditable | CI/CD gate |
| **Soft deletes for business data** | Compliance requirement | Schema Guardian |

### 2.3 Logical Sharding by Default

Every query is rewritten to enforce `WHERE tenant_id = $1`. Data leakage is **mathematically impossible** at the driver layer.

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

### 4.1 Schema Hierarchy

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

Each supported provider must declare:

```yaml
# Example: Neon Serverless Profile
provider: neon-serverless
capabilities:
  max_connections: 100
  connection_pooling: true
  branching: true           # Unique to Neon
  auto_suspend: true
  backup_rpo: "1h"
  compliance: ["soc2"]
  regions: ["us-east-1", "eu-west-1", "ap-southeast-1"]
  
limits:
  storage_gb: 10            # Free tier
  compute_hours: 100        # Per month
```

### 5.4 Zero-Migration Promise

The Canon code **never changes** when migrating between providers. The Kernel:
1. Reads the tenant's `db_requirements` manifest
2. Matches against available provider profiles
3. Provisions or migrates transparently
4. Updates connection routing

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

**What it does:** Routes data to appropriate providers based on tier.

```
┌─────────────────────────────────────────────────────────────────┐
│                    TENANT ROUTING LOGIC                          │
│                                                                  │
│   Tenant Tier        │  Provider            │  Rationale         │
│   ─────────────────────────────────────────────────────────────  │
│   Free Trial         │  Neon Free Tier      │  $0, auto-suspend  │
│   Starter            │  Neon Pro            │  Low cost, spiky   │
│   Growth             │  AWS RDS             │  Steady, reliable  │
│   Enterprise         │  BYOS (their RDS)    │  Compliance, VPC   │
│                                                                  │
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

## 8. Finance Schema (Data Plane)

### 8.1 Core Tables (MVP)

| Table | Purpose | Key Design |
|-------|---------|------------|
| `accounts` | Chart of Accounts + Bank Accounts | `balance_cents` as BIGINT |
| `fx_rates` | Exchange rates | High precision DECIMAL(20,10) |
| `transactions` | Payment requests | Status machine |
| `journal_entries` | GL posting headers | Links to transaction |
| `journal_lines` | Debit/Credit entries | Double-entry enforced |

### 8.2 Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Currency Safety** | Store as `BIGINT` (cents) or `DECIMAL`, never `FLOAT` |
| **Double-Entry** | Sum of debits = Sum of credits (enforced by trigger) |
| **Immutability** | Journal entries are append-only, corrections via reversal |
| **Tenant Isolation** | Every table has `tenant_id` with index |

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

### 10.2 Row-Level Security (RLS)

```sql
-- Automatic tenant isolation
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

Enable AI agents to orchestrate across the data fabric:

```typescript
// Future: AI assistant query
"Show all failed payments from last week with related audit events"

// MCP translates to:
1. Query finance.transactions WHERE status = 'FAILED'
2. Join kernel.audit_events ON correlation_id
3. Format response for human consumption
```

---

## 13. MVP Scope

### 13.1 What's Included in MVP

- [x] Kernel schema (13 migrations)
- [ ] Finance schema (accounts, fx_rates, transactions, journals)
- [ ] Schema Guardian (basic validation)
- [ ] Docker Compose for local dev
- [ ] Basic observability

### 13.2 What's Deferred to v1.1.0

- [ ] BYOS mode
- [ ] Provider auto-selection
- [ ] Query Optimizer
- [ ] Read replicas
- [ ] RLS policies

---

**End of Contract CONT_03 v0.2.0**

---

**Next Steps:**
1. Create `100_finance_schema.sql` migration
2. Create `PRD-DB-MVP.md` sprint plan
3. Implement Schema Guardian (basic)
