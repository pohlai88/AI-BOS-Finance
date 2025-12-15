# MVP → Adapter Gate Checklist

> **Purpose:** Pass/fail gate for unlocking adapter layer development  
> **Gate Owner:** DIE / Architecture Team  
> **Reference:** PRD-DB-MVP.md, ADR_003_DatabaseProviderPortability.md  
> **Last Updated:** 2025-12-15

---

## 🚦 Gate Status

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   ADAPTER LAYER IS:  🟢 UNLOCKED                                │
│                                                                 │
│   MVP Status:        12 / 12 criteria passed ✅                  │
│   Supabase Adapter:  ✅ DEPLOYED                                │
│   CFO Trust Test:    ✅ VERIFIED (2025-12-15)                   │
│   Security Rating:   9.5 / 10                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ MVP Acceptance Criteria (All Passed)

### Week 1: Core Security & Integrity

| # | Criterion | Test Command | Status |
|---|-----------|--------------|--------|
| 1 | **DB Role Separation** | `pnpm verify:roles` | ✅ Passed |
|   | Four roles: `aibos_kernel_role`, `aibos_finance_role`, `aibos_config_role`, `aibos_monitor_role` | | |
| 2 | **Schema Permissions** | `pnpm verify:roles` | ✅ Passed |
|   | Cross-schema access blocked (kernel ↔ finance) | | |
| 3 | **Tenant Guard v2** | `pnpm test:tenant-db` | ✅ Passed |
|   | Repository pattern with parameterized queries (no SQL rewriting) | | |
| 4 | **Tenant Isolation Tests** | `pnpm test:tenant-db` | ✅ Passed |
|   | Cross-tenant access, identifier injection, attack scenarios — **37 tests** | | |
| 5 | **Double-Entry Constraint** | Supabase verified | ✅ Passed |
|   | Journal entries must balance (debits = credits) | | |

### Week 2: Operational Excellence

| # | Criterion | Test Command | Status |
|---|-----------|--------------|--------|
| 6 | **Journal Immutability** | Supabase verified | ✅ Passed |
|   | Posted journal entries cannot be modified/deleted | | |
| 7 | **Connection Pooling** | `docker-compose ps` | ✅ Passed |
|   | PgBouncer configured with transaction mode | | |
| 8 | **Query Logging** | `config/postgresql.conf` | ✅ Passed |
|   | Slow queries >100ms logged | | |
| 9 | **Schema CI** | `.github/workflows/db-validate.yml` | ✅ Passed |
|   | Squawk linting + pgTAP tests in CI | | |
| 10 | **Supabase Adapter** | `adapters/supabase/` | ✅ Deployed |
|   | RLS enabled, 57 policies, storage configured | | |

### Week 3: Governance & Demo

| # | Criterion | Test Command | Status |
|---|-----------|--------------|--------|
| 11 | **Governance Views** | `migrations/kernel/016_governance_views.sql` | ✅ Deployed |
|   | 8 views: tenant_health, isolation_check, journal_integrity, etc. | | |
| 12 | **CFO Trust Test** | `pnpm demo:trust` | ✅ Verified |
|   | 5 attacks blocked, all governance checks PASS | | |

---

## 🚀 Adapter Layer (UNLOCKED)

With MVP complete, the following adapters are now available for development:

| Adapter | Status | Priority |
|---------|--------|----------|
| **Supabase** | ✅ Deployed | — |
| **Self-Hosted** | 📋 Planned | P2 |
| **Neon** | 📋 Backlog | P1 |
| **AWS RDS** | 📋 Backlog | P2 |

---

## 📋 Verification Commands

```bash
# Run CFO Trust Test (one-command demo)
pnpm demo:trust

# Run security tests
pnpm test:tenant-db

# Generate evidence pack
pnpm evidence:export

# Verify database roles
pnpm verify:roles

# Check Supabase security
# (via Supabase MCP)
get_advisors({ type: "security" })

# Check RLS status
npx supabase db lint
```

---

## 📊 CFO Trust Test Results (2025-12-15)

| Governance Check | Pass | Fail | Status |
|------------------|------|------|--------|
| Tenant Isolation | 25 | 0 | ✅ PASS |
| Schema Boundary | 0 | 0 | ✅ PASS |
| Journal Integrity | 14 | 0 | ✅ PASS |
| Immutability | 14 | 0 | ✅ PASS |

| Attack Scenario | Result |
|-----------------|--------|
| POST unbalanced journal | ✅ BLOCKED |
| Modify POSTED journal | ✅ BLOCKED |
| Delete POSTED journal | ✅ BLOCKED |
| Create orphan journal line | ✅ BLOCKED |
| Add lines to POSTED journal | ✅ BLOCKED |

---

**Gate Passed:** 2025-12-15  
**CFO Trust Test Verified:** 2025-12-15  
**Witnessed By:** AI-BOS Data Fabric Team
