# AI-BOS Data Fabric

> **The Intelligent Database Governance & Orchestration Layer (DGOL)**  
> Beyond "Just Postgres" — An AI-Governed, Tenant-Aware Data Plane.

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

### 1. Start Database

```bash
cd apps/db
pnpm db:up
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
├── migrations/
│   ├── kernel/           # Control Plane (IAM, Audit, Registry)
│   │   ├── 001_create_tenants.sql
│   │   ├── 002_create_users.sql
│   │   └── ...
│   ├── finance/          # Data Plane (Ledger, Payments, Treasury)
│   │   ├── 100_create_schema.sql
│   │   ├── 101_companies.sql
│   │   └── ...
│   └── config/           # Platform Configuration
│       └── 200_provider_profiles.sql
├── seeds/
│   ├── kernel/
│   │   └── seed-happy-path.ts
│   └── finance/
│       └── seed-demo-corp.ts
├── tools/
│   └── validate-schema.ts    # Schema Guardian linter
├── scripts/
│   └── migrate.ts            # Migration runner
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

## 🛠️ Tools

### Schema Guardian

Validates migrations against AI-BOS Data Fabric standards:

- ✅ All TENANT_SCOPED tables have `tenant_id`
- ✅ All tables have `created_at`
- ✅ Mutable tables have `updated_at`
- ✅ No cross-schema joins

```bash
pnpm validate
```

---

## 📖 Related Documents

- [CONT_03: Database Architecture](../../packages/canon/A-Governance/A-CONT/CONT_03_DatabaseArchitecture.md)
- [CONT_04: Payment Hub Architecture](../../packages/canon/A-Governance/A-CONT/CONT_04_PaymentHubArchitecture.md)
