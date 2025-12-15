# AI-BOS Data Fabric

> **The Intelligent Database Governance & Orchestration Layer (DGOL)**  
> Beyond "Just Postgres" — An AI-Governed, Tenant-Aware Data Plane.

---

## 🚦 Status

| Phase | Status | Notes |
|-------|--------|-------|
| Core Migrations | ✅ Complete | `kernel`, `finance`, `config` schemas |
| MVP Criteria (10/10) | ✅ Complete | All tests passing |
| Supabase Adapter | ✅ Deployed | 25 tables, 57 RLS policies |
| Self-Hosted Adapter | 📋 Planned | v1.2.0 |
| Neon Adapter | 📋 Backlog | v1.2.0 |

**Project URL:** `https://cnlutbuzjqtuicngldak.supabase.co`

---

## 📚 Architecture

This package implements the **AI-BOS Data Fabric** as defined in [CONT_03](../../packages/canon/A-Governance/A-CONT/CONT_03_DatabaseArchitecture.md).

### Two-Layer Architecture

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
│  │   • Standard DDL (portable to any PostgreSQL 15+ provider)     │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                              │                                           │
│                    [Provider Detection]                                  │
│                              │                                           │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                   ADAPTER LAYER (Provider-Specific)             │     │
│  │                                                                 │     │
│  │   adapters/supabase/ ✅    adapters/neon/ 📋   adapters/rds/ 📋 │     │
│  │   • RLS with auth.uid()    • Branching        • Read replicas  │     │
│  │   • Storage policies       • Autoscaling      • IAM auth       │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Schema Hierarchy

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
│  └──────────────────────────┘      └──────────────────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                   config (schema)                            │ │
│  │   [Provider Profiles] [Selection Rules] [Tenant Mapping]   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│   ◄/X/► = NO CROSS-SCHEMA JOINS (API communication only)       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Local Development (Docker)

```bash
# Start PostgreSQL + PgBouncer
pnpm db:up

# Run migrations
pnpm migrate

# Seed demo data
pnpm seed:all

# Run tests
pnpm test:all

# Verify roles
pnpm verify:roles
```

**Connection Strings:**

```bash
# For applications (via PgBouncer - recommended)
DATABASE_URL=postgres://aibos:aibos_password@localhost:6432/aibos_local

# For migrations/admin (direct to PostgreSQL)
DATABASE_URL=postgres://aibos:aibos_password@localhost:5433/aibos_local
```

### Supabase (Production)

```bash
# Check CLI version
npx supabase --version

# Login and link
npx supabase login
npx supabase link --project-ref cnlutbuzjqtuicngldak

# Apply adapter
pnpm db:apply-supabase

# Generate types
npx supabase gen types typescript --linked > types.ts
```

---

## 📁 Directory Structure

```
apps/db/
├── migrations/               # CORE LAYER (PostgreSQL Standard)
│   ├── kernel/               # Control Plane (13 migrations)
│   ├── finance/              # Data Plane (journals, transactions)
│   └── config/               # Platform Configuration
├── adapters/                 # ADAPTER LAYER (Provider-Specific)
│   ├── supabase/ ✅           # Supabase: RLS, Storage, Performance
│   │   ├── 001_enable_rls.sql
│   │   ├── 002_rls_policies.sql
│   │   ├── 003_performance.sql
│   │   ├── 004_storage_buckets.sql
│   │   ├── config.ts
│   │   ├── types.generated.ts
│   │   └── README.md
│   └── self-hosted/ 📋        # Vanilla PostgreSQL
├── tests/                    # pgTAP Database Tests
│   ├── schema/               # Schema validation
│   ├── constraints/          # Double-entry, immutability
│   └── isolation/            # Tenant isolation
├── lib/
│   └── tenant-guard.ts       # Application-level isolation
├── seeds/
│   ├── kernel/
│   └── finance/
├── scripts/
│   ├── migrate.ts            # Migration runner
│   ├── apply-adapter.ts      # Adapter loader
│   └── verify-roles.ts       # Role verification
├── tools/
│   └── validate-schema.ts    # Schema Guardian
├── config/
│   ├── postgresql.conf       # Query logging
│   └── pgbouncer/            # Connection pooling
├── docker-compose.yml
├── PRD-DB.md                 # Full PRD with roadmap
├── PRD-DB-MVP.md             # MVP status & tasks
└── README.md                 # This file
```

---

## 🔒 Security Model

### Schema Isolation

| Schema | Owner | Can Access | RLS |
|--------|-------|------------|-----|
| `kernel` | Kernel | `kernel` only | ✅ Enabled |
| `finance` | Finance Cells | `finance` only | ✅ Enabled |
| `config` | Platform Admin | Read-only | ✅ Enabled |

### Tenant Isolation

**Application Layer (Primary):**
```typescript
// Every query enforced by TenantGuard
const result = await tenantGuard.query(
  'SELECT * FROM finance.companies',
  { tenantId: session.tenantId }
);
```

**Database Layer (Defense-in-Depth):**
```sql
-- Supabase RLS policy
CREATE POLICY "tenant_isolation" ON finance.companies
  FOR ALL TO authenticated
  USING (tenant_id = public.get_current_tenant_id());
```

---

## 🛠️ Validation & Governance Tools

```bash
# Squawk — Migration safety linter
pnpm lint:migrations

# pgTAP — Database unit testing
pnpm test:schema
pnpm test:constraints
pnpm test:isolation

# Schema Guardian — AI-BOS standards
pnpm validate

# CI validation (all combined)
pnpm ci:validate

# Auditor Evidence Pack — SOC2/HIPAA compliance
pnpm evidence:export           # JSON + CSV
pnpm evidence:json             # JSON only
pnpm evidence:csv              # CSV only
```

### Governance Views (Observability Contract)

External tools (Metabase, Grafana) can connect using `aibos_monitor_role`:

| View | Purpose |
|------|---------|
| `kernel.v_governance_summary` | All pass/fail checks in one view |
| `kernel.v_tenant_health` | Per-tenant health metrics |
| `kernel.v_schema_boundary_check` | Hexagonal boundary verification |
| `kernel.v_tenant_isolation_check` | tenant_id column verification |
| `finance.v_journal_integrity` | Double-entry balance per journal |
| `finance.v_journal_integrity_summary` | Integrity summary by tenant |

---

## 📖 Related Documents

### Requirements
- [PRD-DB.md](./PRD-DB.md) — Full scope + roadmap
- [PRD-DB-MVP.md](./PRD-DB-MVP.md) — MVP status (10/10 ✅)

### Governance
- [CONT_03: Database Architecture](../../packages/canon/A-Governance/A-CONT/CONT_03_DatabaseArchitecture.md)
- [ADR-003: Database Provider Portability](./ADR_003_DatabaseProviderPortability.md)

### Tools & Audits
- [SCHEMA-VALIDATION-TOOLS.md](./SCHEMA-VALIDATION-TOOLS.md) — pgTAP, Squawk
- [SUPABASE-MCP-CAPABILITIES.md](./SUPABASE-MCP-CAPABILITIES.md) — MCP tools
- [AUDIT-SUPABASE-POSTGRES.md](./AUDIT-SUPABASE-POSTGRES.md) — Compliance

### Adapters
- [adapters/supabase/README.md](./adapters/supabase/README.md) — Supabase setup
- [adapters/supabase/STORAGE-SETUP-GUIDE.md](./adapters/supabase/STORAGE-SETUP-GUIDE.md) — Storage config

### Compliance & Governance
- [docs/backlog/099_emergency_recovery_plan.md](./docs/backlog/099_emergency_recovery_plan.md) — Disaster recovery
- [docs/backlog/100_governance_dashboard.md](./docs/backlog/100_governance_dashboard.md) — Governance overlay (v2.0)
- [migrations/kernel/016_governance_views.sql](./migrations/kernel/016_governance_views.sql) — Observability contract

---

## 🚀 Next Steps

1. **Create Storage Buckets** — Supabase Dashboard → Storage
2. **Enable Leaked Password Protection** — Dashboard → Auth → Settings
3. **Develop Neon Adapter** — v1.2.0 backlog
4. **Implement BYOS** — v1.3.0 backlog

---

**Last Updated:** 2025-12-15  
**Maintainer:** AI-BOS Data Fabric Team
