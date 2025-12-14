> **🟡 [DRAFT]** — Pending Certification  
> **Canon Code:** CONT_03  
> **Version:** 0.1.0  
> **Created:** 2025-12-15  
> **Plane:** A — Governance (Contract)  
> **Binding Scope:** All AI-BOS Database Infrastructure  
> **Authority:** Database Architecture & Data Persistence Standard

---

# AI-BOS Database Architecture Standard v0.1.0

> **AI-BOS DB** — The Persistence Foundation for AI-BOS Platform

---

## 1. Purpose & Scope

### 1.1 Purpose

AI-BOS DB is the **single source of truth for all persistent state** across the AI-BOS platform. It provides:

1. **Control Plane Data** — Users, Roles, Permissions, Audit Logs (Kernel-owned)
2. **Domain Data** — Transactions, Accounts, Entities (Cell-owned)
3. **Configuration Data** — Registry, Routes, Policies (Platform-owned)

### 1.2 Core Philosophy

> **"One Database Engine, Logical Isolation"**

- Single Postgres cluster for operational simplicity
- Schema-level isolation for Control Plane vs. Data Plane
- Row-level tenant isolation via `tenant_id` on every table

### 1.3 Non-Negotiable Rules

| Rule | Rationale |
|------|-----------|
| **Every table has `tenant_id`** | Multi-tenancy is mandatory |
| **Every table has `created_at`, `updated_at`** | Audit trail requirement |
| **No cross-schema joins in application code** | Enforce hexagonal boundaries |
| **All DDL via numbered migrations** | Reproducible, auditable schema changes |
| **Soft deletes for business data** | Compliance requirement |

---

## 2. Schema Architecture

### 2.1 Schema Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                       AI-BOS DB (Postgres 15+)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    kernel (schema)                       │    │
│  │  Control Plane — Owned by AI-BOS Kernel                 │    │
│  │                                                          │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │    │
│  │  │ tenants  │ │  users   │ │  roles   │ │   routes   │  │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │    │
│  │  │ sessions │ │  canons  │ │  events  │ │audit_events│  │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   finance (schema)                       │    │
│  │  Data Plane — Owned by Finance Cells                    │    │
│  │                                                          │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │    │
│  │  │companies │ │ accounts │ │payments  │ │ fx_rates   │  │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │    │
│  │  │approvals │ │ journals │ │bank_accts│ │intercompany│  │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   config (schema)                        │    │
│  │  Platform Configuration — Read-heavy, Write-rare        │    │
│  │                                                          │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                 │    │
│  │  │ settings │ │ policies │ │ features │                 │    │
│  │  └──────────┘ └──────────┘ └──────────┘                 │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Schema Ownership

| Schema | Owner | Access | Purpose |
|--------|-------|--------|---------|
| `kernel` | AI-BOS Kernel | Kernel only | Identity, Auth, Audit |
| `finance` | Finance Cells | Finance Cells only | Business transactions |
| `config` | Platform | Read: All, Write: Admin | System configuration |

### 2.3 Cross-Schema Communication

```
❌ FORBIDDEN: Direct SQL joins across schemas
   SELECT * FROM kernel.users JOIN finance.payments ...

✅ REQUIRED: API-based communication via Kernel Gateway
   Cell → Kernel API → Kernel DB (kernel schema)
   Cell → Cell DB → Cell DB (finance schema)
```

---

## 3. Kernel Schema (Control Plane)

### 3.1 Entity Relationship

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   tenants    │────<│    users     │────<│   sessions   │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │
       │                    │ user_roles
       │                    ▼
       │             ┌──────────────┐
       │             │    roles     │────< role_permissions
       │             └──────────────┘
       │
       ├────────────<┌──────────────┐
       │             │    canons    │────<┌──────────────┐
       │             └──────────────┘     │    routes    │
       │                                  └──────────────┘
       │
       ├────────────<┌──────────────┐
       │             │audit_events  │
       │             └──────────────┘
       │
       └────────────<┌──────────────┐
                     │   events     │
                     └──────────────┘
```

### 3.2 Core Tables (Already Implemented)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `tenants` | Organization isolation | `id`, `name`, `status` |
| `users` | Identity store | `id`, `tenant_id`, `email`, `password_hash` |
| `roles` | Permission containers | `id`, `tenant_id`, `name` |
| `user_roles` | User ↔ Role mapping | `user_id`, `role_id` |
| `role_permissions` | Role ↔ Permission mapping | `role_id`, `permission` |
| `sessions` | Active JWT sessions | `id`, `user_id`, `expires_at`, `revoked` |
| `canons` | Service registry | `id`, `tenant_id`, `name`, `service_url` |
| `routes` | API route mappings | `tenant_id`, `canon_id`, `method`, `path` |
| `events` | Event bus messages | `id`, `tenant_id`, `type`, `payload` |
| `audit_events` | Immutable audit log | `id`, `tenant_id`, `action`, `actor_id` |

---

## 4. Finance Schema (Data Plane)

### 4.1 Multi-Company Treasury Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    TENANT (Group/Holding)                        │
│                                                                  │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐          │
│   │  Company A  │   │  Company B  │   │  Company C  │          │
│   │  (OpCo 1)   │   │  (OpCo 2)   │   │  Treasury)  │          │
│   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘          │
│          │                 │                 │                   │
│          ▼                 ▼                 ▼                   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                 Chart of Accounts (CoA)                  │   │
│   │   Each company has its own CoA, mapped to Group CoA     │   │
│   └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│          ┌───────────────────┼───────────────────┐              │
│          ▼                   ▼                   ▼              │
│   ┌────────────┐     ┌────────────┐     ┌────────────┐         │
│   │  Payments  │     │ Interco    │     │  Treasury  │         │
│   │  Outbound  │     │ Settlements│     │  Pooling   │         │
│   └────────────┘     └────────────┘     └────────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Core Tables (To Be Implemented)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `companies` | Legal entities within tenant | `id`, `tenant_id`, `code`, `name`, `base_currency` |
| `accounts` | Chart of Accounts | `id`, `company_id`, `code`, `name`, `type`, `currency` |
| `bank_accounts` | External bank accounts | `id`, `company_id`, `bank_code`, `account_number`, `currency` |
| `payments` | Payment requests | `id`, `company_id`, `type`, `amount`, `currency`, `status` |
| `payment_approvals` | Approval workflow | `id`, `payment_id`, `approver_id`, `level`, `decision` |
| `journals` | GL postings | `id`, `company_id`, `date`, `reference`, `status` |
| `journal_lines` | Debit/Credit entries | `id`, `journal_id`, `account_id`, `debit`, `credit` |
| `fx_rates` | Exchange rates | `id`, `tenant_id`, `from_currency`, `to_currency`, `rate`, `date` |
| `intercompany_settlements` | Cross-company payments | `id`, `from_company`, `to_company`, `amount`, `status` |

### 4.3 Multi-Company Approval Matrix

```sql
-- Example: Approval levels by company and amount threshold
CREATE TABLE finance.approval_matrices (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  company_id UUID NOT NULL,
  payment_type VARCHAR(50) NOT NULL,  -- 'vendor', 'intercompany', 'treasury'
  min_amount DECIMAL(18,2) NOT NULL,
  max_amount DECIMAL(18,2),
  required_approvers INTEGER NOT NULL DEFAULT 1,
  approver_roles TEXT[] NOT NULL,     -- ['finance.approver.l1', 'finance.approver.l2']
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Example data:
-- Company A: <10K = 1 approver, 10K-100K = 2 approvers, >100K = 3 approvers
-- Company B: <50K = 1 approver, >50K = 2 approvers (CFO required)
```

---

## 5. Connection Architecture

### 5.1 Connection Pooling

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Kernel    │────>│    PgBouncer    │────>│    Postgres     │
│  (App Pool) │     │  (Transaction)  │     │   (Primary)     │
└─────────────┘     └─────────────────┘     └─────────────────┘
                           │
┌─────────────┐            │
│Payment Cell │────────────┘
│  (App Pool) │
└─────────────┘
```

### 5.2 Connection Parameters

| Environment | Pool Size | Mode | Timeout |
|-------------|-----------|------|---------|
| Development | 5 | Transaction | 30s |
| Staging | 20 | Transaction | 15s |
| Production | 50 | Transaction | 10s |

### 5.3 Environment Configuration

```bash
# Development (Docker)
DATABASE_URL=postgres://aibos:aibos_dev@localhost:5433/aibos_dev

# Production (Managed)
DATABASE_URL=postgres://aibos:${DB_PASSWORD}@db.aibos.com:5432/aibos_prod
DATABASE_POOL_SIZE=50
DATABASE_SSL_MODE=require
```

---

## 6. Migration Strategy

### 6.1 Migration Naming Convention

```
{sequence}_{schema}_{action}_{entity}.sql

Examples:
001_kernel_create_tenants.sql
002_kernel_create_users.sql
013_kernel_add_correlation_id.sql
101_finance_create_companies.sql
102_finance_create_accounts.sql
```

### 6.2 Migration Rules

| Rule | Enforcement |
|------|-------------|
| Migrations are append-only | Never modify existing migrations |
| Each migration is idempotent | Use `IF NOT EXISTS`, `ON CONFLICT` |
| Rollback scripts required | `{sequence}_down.sql` for production |
| Schema prefix in all objects | `kernel.users`, `finance.payments` |

### 6.3 Current Migration State

```
apps/kernel/db/migrations/
├── 001_create_tenants.sql          ✅ Applied
├── 002_create_users.sql            ✅ Applied
├── 003_create_roles.sql            ✅ Applied
├── 004_create_user_roles.sql       ✅ Applied
├── 005_create_role_permissions.sql ✅ Applied
├── 006_create_sessions.sql         ✅ Applied
├── 007_create_canons.sql           ✅ Applied
├── 008_create_routes.sql           ✅ Applied
├── 009_create_events.sql           ✅ Applied
├── 010_create_audit_events.sql     ✅ Applied
├── 011_add_http_metadata.sql       ✅ Applied
├── 012_add_route_active.sql        ✅ Applied
└── 013_add_correlation_id.sql      ✅ Applied

(Future: 101-199 for finance schema)
```

---

## 7. Backup & Recovery

### 7.1 Backup Strategy

| Type | Frequency | Retention | Method |
|------|-----------|-----------|--------|
| Full | Daily | 30 days | pg_dump |
| Incremental | Hourly | 7 days | WAL archiving |
| Point-in-Time | Continuous | 7 days | WAL streaming |

### 7.2 Disaster Recovery

```
RPO (Recovery Point Objective): < 1 hour
RTO (Recovery Time Objective): < 4 hours
```

---

## 8. Security

### 8.1 Access Control

| Role | Permissions | Use Case |
|------|-------------|----------|
| `aibos_app` | SELECT, INSERT, UPDATE, DELETE on app tables | Application runtime |
| `aibos_migration` | ALL on all objects | Schema migrations |
| `aibos_readonly` | SELECT only | Reporting, debugging |
| `aibos_admin` | ALL + CREATE/DROP | Emergency maintenance |

### 8.2 Row-Level Security (RLS)

```sql
-- Enable RLS on all tenant-scoped tables
ALTER TABLE kernel.users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own tenant's data
CREATE POLICY tenant_isolation ON kernel.users
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

### 8.3 Encryption

| Layer | Method | Notes |
|-------|--------|-------|
| In-Transit | TLS 1.3 | Required for production |
| At-Rest | AES-256 | Managed by cloud provider |
| Application | bcrypt (passwords) | Cost factor 12 |

---

## 9. Observability

### 9.1 Metrics to Monitor

| Metric | Alert Threshold | Action |
|--------|-----------------|--------|
| Connection pool utilization | > 80% | Scale pool or add read replica |
| Query latency p99 | > 100ms | Analyze slow queries |
| Disk usage | > 80% | Expand storage |
| Replication lag | > 60s | Check replica health |

### 9.2 Logging

```sql
-- Enable query logging for slow queries
ALTER SYSTEM SET log_min_duration_statement = 1000;  -- 1 second
ALTER SYSTEM SET log_statement = 'ddl';              -- Log all DDL
```

---

## 10. MVP Scope

### 10.1 What's Included in MVP

- [x] Kernel schema (13 migrations)
- [ ] Finance schema (companies, accounts, payments, approvals)
- [ ] Connection pooling configuration
- [ ] Basic backup/restore scripts
- [ ] Docker image for consistent deployment

### 10.2 What's Deferred to v1.1.0

- [ ] Read replicas
- [ ] PgBouncer setup
- [ ] Row-Level Security policies
- [ ] Automated backup verification
- [ ] Multi-region replication

---

## 11. Appendix: Docker Configuration

### 11.1 Production-Ready Dockerfile

```dockerfile
FROM postgres:15-alpine

# Set locale
ENV LANG en_US.utf8

# Custom configuration
COPY postgresql.conf /etc/postgresql/postgresql.conf
COPY pg_hba.conf /etc/postgresql/pg_hba.conf

# Initialization scripts
COPY init/ /docker-entrypoint-initdb.d/

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD pg_isready -U aibos -d aibos_dev

EXPOSE 5432
```

### 11.2 Docker Compose (Production)

```yaml
services:
  aibos_db:
    build: ./db
    container_name: aibos_db
    environment:
      POSTGRES_USER: aibos
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: aibos_prod
    volumes:
      - aibos_data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U aibos"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  aibos_data:
```

---

**End of Contract CONT_03 v0.1.0**

---

**Next Steps:**
1. Review and certify this document
2. Create `PRD-DB-MVP.md` with specific sprint tasks
3. Implement finance schema migrations
