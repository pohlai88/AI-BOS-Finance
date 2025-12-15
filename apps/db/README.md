# AI-BOS Data Fabric

> **The Intelligent Database Governance & Orchestration Layer (DGOL)**  
> Beyond "Just Postgres" — An AI-Governed, Tenant-Aware Data Plane.

---

## 🚦 MVP Status

See [MVP-GATE-CHECKLIST.md](./MVP-GATE-CHECKLIST.md) for current progress.

| Phase | Status |
|-------|--------|
| Core Migrations | ✅ Created |
| Validation Tools | ✅ Configured |
| MVP Criteria 1-10 | 🟡 In Progress |
| Adapter Layer | ⏸️ DEFERRED to v1.1.0 |

---

## 📚 Architecture

This package implements the **AI-BOS Data Fabric** as defined in [CONT_03](../../packages/canon/A-Governance/A-CONT/CONT_03_DatabaseArchitecture.md).

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

### 1. Start Database (with PgBouncer)

```bash
cd apps/db
pnpm db:up
```

This starts:
- **PostgreSQL** on port `5433` (direct access)
- **PgBouncer** on port `6432` (connection pooling - **recommended for apps**)

### Connection Strings

```bash
# For applications (via PgBouncer - recommended)
DATABASE_URL=postgres://aibos:aibos_password@localhost:6432/aibos_local

# For migrations/admin (direct to PostgreSQL)
DATABASE_URL=postgres://aibos:aibos_password@localhost:5433/aibos_local
```

### 2. Run Migrations

```bash
# All schemas
pnpm migrate

# Individual schemas
pnpm migrate:kernel
pnpm migrate:finance
pnpm migrate:config
```

### 3. Seed Demo Data

```bash
# All seeds
pnpm seed:all

# Individual seeds
pnpm seed:kernel    # Creates Demo Corp tenant, admin user
pnpm seed:finance   # Creates companies, accounts, FX rates
```

### 4. Validate Schema

```bash
pnpm validate
```

---

## 📁 Directory Structure

```
apps/db/
├── migrations/               # CORE LAYER (PostgreSQL Standard)
│   ├── kernel/               # Control Plane (IAM, Audit, Roles)
│   │   ├── 001_create_tenants.sql
│   │   ├── 002_create_users.sql
│   │   ├── 014_create_db_roles.sql      # MVP Task 1
│   │   ├── 015_grant_schema_permissions.sql  # MVP Task 2
│   │   └── ...
│   ├── finance/              # Data Plane (Ledger, Payments, Treasury)
│   │   └── 100_finance_schema.sql
│   └── config/               # Platform Configuration
│       └── 101_config_provider_profiles.sql
├── adapters/                 # ADAPTER LAYER (⏸️ DEFERRED to v1.1.0)
│   ├── supabase/             # Supabase-specific optimizations
│   └── self-hosted/          # Self-hosted PostgreSQL config
├── tests/                    # pgTAP Database Tests
│   ├── schema/               # Schema validation tests
│   │   ├── 001_schemas_exist.sql
│   │   ├── 002_tenant_isolation_columns.sql
│   │   └── 003_roles_exist.sql
│   └── constraints/          # Business constraint tests
│       ├── 001_double_entry.sql
│       └── 002_immutability.sql
├── seeds/
│   ├── kernel/
│   │   └── seed-happy-path.ts
│   └── finance/
│       └── seed-demo-corp.ts
├── lib/                      # (Coming) Tenant Guard, Connection Utils
├── scripts/
│   ├── migrate.ts            # Migration runner
│   └── verify-roles.ts       # Role verification
├── tools/
│   └── validate-schema.ts    # Schema Guardian linter
├── .squawk.toml              # Squawk migration linter config
├── docker-compose.yml
└── README.md
```

---

## 🔒 Security Model

### Separation of Concerns

| Schema | Owner | Can Access |
|--------|-------|------------|
| `kernel` | AI-BOS Kernel | `kernel` only |
| `finance` | Finance Cells | `finance` only |
| `config` | Platform Admin | `config` only (read-only at runtime) |

**Cross-schema joins are forbidden.** All communication goes through APIs.

### Tenant Isolation

Every query is rewritten by the driver to enforce:

```sql
WHERE tenant_id = $current_tenant
```

---

## 🛠️ Validation Tools

### Squawk — Migration Safety Linter

Detects dangerous migration patterns:

```bash
pnpm lint:migrations
```

### pgTAP — Database Unit Testing

Run schema and constraint tests:

```bash
# Schema tests (roles, columns, FKs)
pnpm test:schema

# Constraint tests (double-entry, immutability)
pnpm test:constraints

# All tests
pnpm test:all
```

### Schema Guardian

Validates migrations against AI-BOS Data Fabric standards:

```bash
pnpm validate
```

### CI Validation

Combined lint + dry-run for CI pipelines:

```bash
pnpm ci:validate
```

---

## 📖 Related Documents

### Governance
- [CONT_03: Database Architecture](../../packages/canon/A-Governance/A-CONT/CONT_03_DatabaseArchitecture.md)
- [ADR-003: Database Provider Portability](./ADR_003_DatabaseProviderPortability.md)

### Planning
- [PRD-DB.md](./PRD-DB.md) — Full scope
- [PRD-DB-MVP.md](./PRD-DB-MVP.md) — MVP sprint plan
- [MVP-GATE-CHECKLIST.md](./MVP-GATE-CHECKLIST.md) — Gate criteria

### Tools
- [SCHEMA-VALIDATION-TOOLS.md](./SCHEMA-VALIDATION-TOOLS.md) — pgTAP, Squawk setup
- [SUPABASE-MCP-CAPABILITIES.md](./SUPABASE-MCP-CAPABILITIES.md) — MCP tool mapping

### Audits
- [AUDIT-SUPABASE-POSTGRES.md](./AUDIT-SUPABASE-POSTGRES.md) — Compliance audit
- [VALIDATION-AUDIT.md](./VALIDATION-AUDIT.md) — Work consistency check
