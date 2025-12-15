# AI-BOS Data Fabric — Library

> **Purpose:** Shared utilities for database operations  
> **Status:** ✅ Task 3 Complete

---

## Contents

| File | Purpose | MVP Task | Status |
|------|---------|----------|--------|
| `tenant-guard.ts` | Enforce `WHERE tenant_id = $1` | Task 3 | ✅ Created |
| `connection.ts` | Provider-agnostic connection factory | Task 7 | ⬜ Planned |
| `adapter-loader.ts` | Load provider-specific adapter | Post-MVP | ⏸️ Deferred |

---

## Tenant Guard (Task 3) — ✅ Implemented

Provides:

```typescript
// Using TenantGuard class
import { TenantGuard } from '@aibos/db/lib/tenant-guard';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const guard = new TenantGuard({ pool, strictMode: true });

// All queries automatically filtered by tenant
const result = await guard.query(
  { tenantId: 'abc-123' },
  'SELECT * FROM finance.companies'
);
// Executes: SELECT * FROM finance.companies WHERE tenant_id = $1

// Using convenience wrapper
import { withTenant } from '@aibos/db/lib/tenant-guard';

const companies = await withTenant(pool, tenantId, async (query) => {
  return query('SELECT * FROM finance.companies');
});

// Transaction support with tenant context
const result = await guard.transaction({ tenantId }, async (client) => {
  await client.query('INSERT INTO finance.companies ...');
  await client.query('INSERT INTO finance.accounts ...');
  return { success: true };
});
```

---

## Features

- **Automatic tenant filtering** - All SELECT, UPDATE, DELETE queries filtered
- **INSERT validation** - Ensures tenant_id is included in inserts
- **Transaction support** - Maintains tenant context across transaction
- **Strict mode** - Throws error if tenant context missing
- **Debug mode** - Logs original and guarded queries
- **Excluded tables** - Skip isolation for global tables (e.g., `kernel.tenants`)

---

## Implementation Notes

- Core layer only (no provider-specific code)
- PostgreSQL-portable patterns
- Adapter integration deferred to v1.1.0
