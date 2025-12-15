# ADR-003: Database Provider Portability

> **Status:** ⏸️ DEFERRED TO v1.1.0  
> **Date:** 2025-01-27  
> **Deciders:** AI-BOS Architecture Team  
> **Derives From:** CONT_00 (Constitution), CONT_03 (Database Architecture)  
> **Gate:** MVP Acceptance Criteria (10/10) must pass before implementation

---

## ⚠️ DEFERRAL NOTICE

**This ADR is DOCUMENTATION-ONLY until MVP is complete.**

| Phase | Scope | Status |
|-------|-------|--------|
| **MVP (v1.0.0)** | Core PostgreSQL DDL, tenant isolation, schema boundaries | 🟡 IN PROGRESS |
| **Post-MVP (v1.1.0)** | Provider adapters, RLS policies, BYOS | ⏸️ DEFERRED |

**What is allowed now:**
- ✅ ADR documentation (this file)
- ✅ Adapter READMEs (empty scaffolds)
- ✅ Directory structure planning

**What is NOT allowed until MVP complete:**
- ❌ Executable adapter migrations (e.g., `001_enable_rls.sql`)
- ❌ Migration runner wiring for `adapters/`
- ❌ Provider-specific RLS policies
- ❌ Any schema changes that could drift from core

---

## Context

AI-BOS requires a database architecture that:
1. **Is portable** across PostgreSQL providers (Supabase, AWS RDS, Azure, GCP, self-hosted)
2. **Allows optimizations** for specific providers without breaking portability
3. **Follows hexagonal architecture** with clear separation of concerns

The current audit identified Supabase-specific recommendations (RLS with `auth.uid()`, advisors, etc.) that would create provider lock-in if implemented directly.

---

## Decision

**Adopt a two-layer database architecture:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI-BOS Applications                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              ADAPTER LAYER (Provider-Specific)            │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │  │
│  │  │ Supabase │  │ AWS RDS  │  │  Azure   │  │  Self-   │  │  │
│  │  │ Adapter  │  │ Adapter  │  │ Adapter  │  │  Hosted  │  │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              CORE LAYER (PostgreSQL Standard)             │  │
│  │                                                           │  │
│  │  • Standard PostgreSQL DDL                                │  │
│  │  • Standard indexes, constraints, triggers                │  │
│  │  • Application-layer tenant isolation                     │  │
│  │  • Provider-agnostic security model                       │  │
│  │                                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Layer Responsibilities

### Layer 1: Core (PostgreSQL Standard)

**Location:** `apps/db/migrations/`

**Contains:**
- Schema definitions (CREATE TABLE, CREATE INDEX)
- Standard constraints (PRIMARY KEY, FOREIGN KEY, CHECK, UNIQUE)
- Standard triggers (updated_at, audit logging)
- Standard functions (PL/pgSQL)
- Application-layer security (tenant_id enforcement via code)

**Does NOT contain:**
- Provider-specific extensions (unless PostgreSQL-standard)
- Provider-specific RLS helpers (e.g., Supabase's `auth.uid()`)
- Provider-specific connection pooling config
- Provider-specific auth integration

**Portability Guarantee:**
> Any migration in the Core layer MUST work on vanilla PostgreSQL 15+

---

### Layer 2: Adapters (Provider-Specific)

**Location:** `apps/db/adapters/<provider>/`

**Each adapter provides:**
1. **Optimization migrations** - Provider-specific enhancements
2. **RLS policies** - Using provider's auth system
3. **Connection config** - Pooling, timeouts, etc.
4. **Monitoring integration** - Provider's observability tools

---

## Directory Structure

```
apps/db/
├── migrations/                    # CORE LAYER (PostgreSQL Standard)
│   ├── kernel/                    # Kernel schema (portable)
│   │   ├── 001_create_tenants.sql
│   │   ├── 002_create_users.sql
│   │   └── ...
│   ├── finance/                   # Finance schema (portable)
│   │   ├── 100_finance_schema.sql
│   │   └── ...
│   └── config/                    # Config schema (portable)
│       └── 101_config_provider_profiles.sql
│
├── adapters/                      # ADAPTER LAYER (Provider-Specific)
│   ├── supabase/                  # Supabase optimizations
│   │   ├── README.md
│   │   ├── 001_enable_rls.sql
│   │   ├── 002_rls_policies.sql
│   │   ├── 003_supabase_auth_integration.sql
│   │   ├── 004_performance_indexes.sql
│   │   └── config.ts              # Connection config
│   │
│   ├── aws-rds/                   # AWS RDS optimizations
│   │   ├── README.md
│   │   ├── 001_rds_rls.sql
│   │   ├── 002_iam_auth.sql
│   │   └── config.ts
│   │
│   ├── azure/                     # Azure Database optimizations
│   │   └── ...
│   │
│   └── self-hosted/               # Self-hosted PostgreSQL
│       ├── README.md
│       ├── 001_basic_rls.sql
│       └── config.ts
│
├── lib/                           # Shared utilities
│   ├── tenant-guard.ts            # Tenant isolation (app layer)
│   ├── connection.ts              # Provider-agnostic connection
│   └── adapter-loader.ts          # Load provider adapter
│
└── scripts/
    ├── migrate.ts                 # Run core migrations
    └── apply-adapter.ts           # Apply provider adapter
```

---

## Implementation Guidelines

### Core Migrations (Provider-Agnostic)

```sql
-- ✅ ALLOWED: Standard PostgreSQL
CREATE TABLE IF NOT EXISTS kernel.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES kernel.tenants(id),
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ✅ ALLOWED: Standard trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ❌ NOT ALLOWED: Supabase-specific
-- CREATE POLICY "Users see own data" ON users
-- USING (auth.uid() = user_id);  -- auth.uid() is Supabase-specific!
```

### Adapter Migrations (Supabase Example)

```sql
-- File: adapters/supabase/002_rls_policies.sql
-- Purpose: Supabase-specific RLS using auth.uid()

-- Enable RLS (required for Supabase Data API)
ALTER TABLE kernel.users ENABLE ROW LEVEL SECURITY;

-- Supabase-specific policy using auth.uid()
CREATE POLICY "tenant_isolation_users"
ON kernel.users
FOR ALL
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id 
    FROM kernel.users 
    WHERE id = (SELECT auth.uid())  -- Supabase-specific!
  )
);

-- Service role bypass (Supabase-specific)
CREATE POLICY "service_role_bypass"
ON kernel.users
FOR ALL
TO service_role  -- Supabase-specific role!
USING (true);
```

### Adapter Migrations (Self-Hosted Example)

```sql
-- File: adapters/self-hosted/001_basic_rls.sql
-- Purpose: Standard PostgreSQL RLS without auth providers

-- Enable RLS
ALTER TABLE kernel.users ENABLE ROW LEVEL SECURITY;

-- Application-managed RLS using session variables
CREATE POLICY "tenant_isolation_users"
ON kernel.users
FOR ALL
USING (
  tenant_id = current_setting('app.current_tenant_id', true)::uuid
);

-- Admin role bypass
CREATE POLICY "admin_bypass"
ON kernel.users
FOR ALL
TO aibos_admin_role
USING (true);
```

---

## Migration Workflow

### 1. Development (Any Provider)

```bash
# Run core migrations (always)
pnpm db:migrate

# Apply provider adapter (based on environment)
PROVIDER=supabase pnpm db:apply-adapter
```

### 2. Provider Detection

```typescript
// lib/adapter-loader.ts
export function getProvider(): 'supabase' | 'aws-rds' | 'azure' | 'self-hosted' {
  // Option 1: Environment variable
  if (process.env.DB_PROVIDER) {
    return process.env.DB_PROVIDER as any;
  }
  
  // Option 2: Auto-detect from connection string
  const url = process.env.DATABASE_URL || '';
  if (url.includes('supabase.co')) return 'supabase';
  if (url.includes('rds.amazonaws.com')) return 'aws-rds';
  if (url.includes('database.azure.com')) return 'azure';
  
  return 'self-hosted';
}
```

### 3. Apply Adapter Script

```typescript
// scripts/apply-adapter.ts
import { getProvider } from '../lib/adapter-loader';
import { runMigrations } from '../lib/migrate';

async function applyAdapter() {
  const provider = getProvider();
  console.log(`Applying ${provider} adapter...`);
  
  await runMigrations({
    directory: `adapters/${provider}`,
    table: 'adapter_migrations'  // Separate tracking table
  });
}
```

---

## Feature Comparison by Provider

| Feature | Core (Portable) | Supabase | AWS RDS | Self-Hosted |
|---------|-----------------|----------|---------|-------------|
| **Schema DDL** | ✅ Standard | ✅ | ✅ | ✅ |
| **Indexes** | ✅ Standard | + Advisor hints | + pg_stat | ✅ |
| **RLS** | App-layer | auth.uid() | IAM roles | Session vars |
| **Auth** | App-managed | Supabase Auth | IAM/Cognito | Custom |
| **Pooling** | App-managed | Supavisor | RDS Proxy | PgBouncer |
| **Monitoring** | App logs | get_logs() | CloudWatch | Custom |
| **Extensions** | Standard only | + 80 available | + select | + any |

---

## Consequences

### Positive
- ✅ No provider lock-in
- ✅ Can migrate between providers
- ✅ Core schema is testable on local PostgreSQL
- ✅ Provider-specific optimizations without breaking portability
- ✅ Clear separation of concerns

### Negative
- ⚠️ More complex directory structure
- ⚠️ Need to maintain multiple adapters
- ⚠️ Some features may not be available on all providers

### Mitigations
- Document adapter requirements clearly
- Use feature flags for provider-specific features
- Test core migrations on vanilla PostgreSQL in CI

---

## References

- [CONT_00_Constitution.md](../../packages/canon/A-Governance/A-CONT/CONT_00_Constitution.md)
- [CONT_03_DatabaseArchitecture.md](../../packages/canon/A-Governance/A-CONT/CONT_03_DatabaseArchitecture.md)
- [Hexagonal Architecture](https://en.wikipedia.org/wiki/Hexagonal_architecture_(software))

---

## Decision Outcome

**PROPOSED** — Awaiting approval before implementation.

**Next Steps:**
1. Review and approve this ADR
2. Create `adapters/` directory structure
3. Move Supabase-specific optimizations to `adapters/supabase/`
4. Update migration scripts to support adapters
5. Update audit documents to reflect this architecture
