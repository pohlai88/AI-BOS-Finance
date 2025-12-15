# AI-BOS Database Library

> **Safe, tenant-isolated database access primitives**

---

## 🚨 Important: Tenant Guard v2

As of v2.0, **TenantDb** replaces the deprecated `TenantGuard`.

### Why the Change?

The original `TenantGuard` used SQL string rewriting which had security issues:
- ❌ Regex-based SQL parsing could corrupt complex queries
- ❌ Parameter index shifting was error-prone
- ❌ No protection against identifier injection

### New Approach: TenantDb

`TenantDb` provides safe, parameterized database access:
- ✅ Compile-time whitelist for table/column identifiers
- ✅ Parameterized queries only (no string interpolation)
- ✅ Mandatory tenant context validation
- ✅ Explicit column lists (no SELECT *)

---

## 📚 Usage

### Basic Queries

```typescript
import { createTenantDb, TenantContext } from './lib/tenant-db';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const tenantDb = createTenantDb(pool);

// Tenant context is REQUIRED for all tenant-scoped operations
const ctx: TenantContext = {
  tenantId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  userId: 'user-uuid',        // For audit logging
  correlationId: 'trace-id',  // For distributed tracing
};

// SELECT with tenant isolation (automatically adds WHERE tenant_id = $1)
const companies = await tenantDb.select(
  ctx,
  'finance.companies',           // Must be in whitelist
  ['id', 'name', 'status'],      // Explicit columns
  { status: 'active' },          // Additional filters (parameterized)
  { limit: 100, orderBy: { column: 'name', direction: 'ASC' } }
);

console.log(companies.rows);
console.log(companies.query);  // { text: "SELECT...", values: [...] }
```

### Insert Operations

```typescript
// INSERT automatically adds tenant_id
const newCompany = await tenantDb.insert(
  ctx,
  'finance.companies',
  {
    id: crypto.randomUUID(),
    code: 'NEW-CO',
    name: 'New Company',
    type: 'operating',
    base_currency: 'USD',
    status: 'active',
  },
  ['id', 'name']  // RETURNING columns
);

// ❌ This will throw - do NOT include tenant_id in data
await tenantDb.insert(ctx, 'finance.companies', {
  tenant_id: 'other-tenant',  // ERROR!
  name: 'Malicious'
});
```

### Transactions

```typescript
// All operations within transaction share tenant context
const result = await tenantDb.withTransaction(ctx, async (tx) => {
  const company = await tx.insert('finance.companies', { ... });
  const account = await tx.insert('finance.accounts', { company_id: company.id, ... });
  return { company, account };
});
```

### Global Tables (No Tenant Isolation)

```typescript
// Some tables don't require tenant isolation
const tenants = await tenantDb.selectGlobal(
  'kernel.tenants',
  ['id', 'name', 'status'],
  undefined,
  { limit: 100 }
);
```

---

## 🔐 Security Features

### 1. Whitelist-Based Identifier Validation

Only tables and columns in the compile-time whitelist can be queried:

```typescript
// ✅ Valid - in whitelist
await tenantDb.select(ctx, 'finance.companies', ['id', 'name']);

// ❌ Invalid - throws TenantDbError
await tenantDb.select(ctx, 'pg_user', ['usename']);  // Not in whitelist
await tenantDb.select(ctx, 'finance.companies; DROP TABLE users', ['id']);
```

### 2. Mandatory Tenant Context

```typescript
// ❌ Throws TenantDbError - context required
await tenantDb.select(undefined, 'finance.companies', ['id']);

// ❌ Throws TenantDbError - invalid UUID
await tenantDb.select({ tenantId: 'not-a-uuid' }, 'finance.companies', ['id']);

// ✅ Valid context
await tenantDb.select({ tenantId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' }, ...);
```

### 3. Cross-Tenant Protection

```typescript
// Tenant Alpha cannot see Tenant Beta's data
const alphaCtx = { tenantId: TENANT_ALPHA };
const companies = await tenantDb.select(alphaCtx, 'finance.companies', ['id']);

// All rows guaranteed to be Alpha's (WHERE tenant_id = $1)
for (const row of companies.rows) {
  assert(row.tenant_id === TENANT_ALPHA);
}
```

### 4. Immutable tenant_id

```typescript
// ❌ Cannot update tenant_id - throws CROSS_TENANT_VIOLATION
await tenantDb.update(ctx, 'finance.companies', 'id', {
  tenant_id: 'other-tenant'  // ERROR!
});
```

---

## 📁 Files

| File | Purpose |
|------|---------|
| `tenant-db.ts` | **NEW** - Safe tenant-isolated database access |
| `tenant-guard.ts` | **DEPRECATED** - Legacy implementation (kept for compatibility) |

---

## 🧪 Testing

```bash
# Run TenantDb security tests
pnpm test:tenant-db

# Run all isolation tests
pnpm test:isolation
```

---

## 📖 References

- [GA-PATCHLIST.md](../GA-PATCHLIST.md) - Patch 1 details
- [CONT_03: Database Architecture](../../packages/canon/A-Governance/A-CONT/CONT_03_DatabaseArchitecture.md)
- [ADR-003: Database Provider Portability](../ADR_003_DatabaseProviderPortability.md)

---

**Version:** 2.0.0  
**Last Updated:** 2025-12-15
