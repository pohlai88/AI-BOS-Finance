# Self-Hosted Adapter

> **Purpose:** Standard PostgreSQL configurations for self-hosted deployments  
> **Applies To:** Self-hosted PostgreSQL, Docker, Kubernetes, or any non-managed PostgreSQL  
> **Status:** ⏸️ **DEFERRED TO v1.1.0**

---

## ⚠️ DEFERRAL NOTICE

**This adapter is DOCUMENTATION-ONLY until MVP is complete.**

```
┌─────────────────────────────────────────────────────────────┐
│  MVP GATE: All 10 acceptance criteria must pass first       │
│  See: PRD-DB-MVP.md → Acceptance Criteria                   │
│  Gate Owner: DIE / Architecture Team                        │
└─────────────────────────────────────────────────────────────┘
```

**DO NOT CREATE** any executable migrations in this directory until MVP gate is passed.

**Reference:** [ADR_003_DatabaseProviderPortability.md](../ADR_003_DatabaseProviderPortability.md)

---

## Overview (Post-MVP)

This adapter contains PostgreSQL-standard configurations that:
1. Enable Row Level Security (RLS) using session variables
2. Create tenant isolation policies without provider-specific auth
3. Configure connection pooling (PgBouncer)
4. Set up admin roles with RLS bypass

---

## Files

| File | Purpose |
|------|---------|
| `001_enable_rls.sql` | Enable RLS on all tables |
| `002_rls_policies.sql` | Session-based tenant isolation policies |
| `003_admin_roles.sql` | Admin roles with RLS bypass |
| `config.ts` | PgBouncer and connection configuration |

---

## Usage

```bash
# Apply after core migrations
PROVIDER=self-hosted pnpm db:apply-adapter

# Or manually
psql -f adapters/self-hosted/001_enable_rls.sql
psql -f adapters/self-hosted/002_rls_policies.sql
```

---

## Session-Based RLS Pattern

This adapter uses PostgreSQL session variables for tenant isolation:

```sql
-- Application sets tenant context before queries
SET app.current_tenant_id = 'uuid-of-tenant';

-- RLS policy uses session variable
CREATE POLICY "tenant_isolation"
ON finance.companies FOR ALL
USING (
  tenant_id = current_setting('app.current_tenant_id', true)::uuid
);
```

### Application Integration

```typescript
// Before executing queries, set tenant context
await pool.query(`SET app.current_tenant_id = $1`, [tenantId]);

// Now queries are automatically filtered
const result = await pool.query('SELECT * FROM finance.companies');
```

---

## PostgreSQL-Standard Features Used

| Feature | PostgreSQL Standard | Notes |
|---------|---------------------|-------|
| `current_setting()` | ✅ Yes | Standard function |
| `SET` command | ✅ Yes | Standard command |
| Custom roles | ✅ Yes | Standard roles |
| RLS policies | ✅ Yes | Standard RLS |

---

## Portability

> ✅ **These migrations work on any PostgreSQL 15+ installation.**  
> No provider-specific dependencies.

---

## References

- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [ADR-003: Database Provider Portability](../ADR_003_DatabaseProviderPortability.md)
