# MVP → Adapter Gate Checklist

> **Purpose:** Pass/fail gate for unlocking adapter layer development  
> **Gate Owner:** DIE / Architecture Team  
> **Reference:** PRD-DB-MVP.md, ADR_003_DatabaseProviderPortability.md

---

## 🚦 Gate Status

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   ADAPTER LAYER IS:  🔴 LOCKED                                  │
│                                                                 │
│   MVP Status:        [ ] / 10 criteria passed                   │
│   Witnessed Demo:    [ ] NOT YET                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**To unlock adapter layer:** ALL 10 criteria must be ✅, demo must be witnessed.

---

## ✅ MVP Acceptance Criteria (Pass/Fail)

### Week 1: Core Security & Integrity

| # | Criterion | Test Command | Status |
|---|-----------|--------------|--------|
| 1 | **DB Role Separation** | `pnpm verify:roles` | ✅ Created |
|   | Three roles exist: `aibos_kernel_role`, `aibos_finance_role`, `aibos_config_role` | | |
| 2 | **Schema Permissions** | `pnpm verify:roles` | ✅ Created |
|   | Cross-schema access blocked (kernel ↔ finance) | | |
| 3 | **Tenant Isolation Guard** | `pnpm test:isolation` (Vitest) | ✅ Created |
|   | `WHERE tenant_id = $1` enforced in all queries | | |
| 4 | **Tenant Isolation Tests** | `pnpm test:isolation:pgtap` (pgTAP) | ✅ Comprehensive |
|   | Cross-tenant access, attack scenarios, schema boundary — 37 tests | | |
| 5 | **Double-Entry Constraint** | `pnpm test:constraints` (pgTAP) | ✅ Created |
|   | Journal entries must balance (debits = credits) | | |

### Week 2: Operational Excellence

| # | Criterion | Test Command | Status |
|---|-----------|--------------|--------|
| 6 | **Journal Immutability** | `pnpm test:constraints` (pgTAP) | ⬜ |
|   | Posted journal entries cannot be modified/deleted | | |
| 7 | **Connection Pooling** | `docker-compose ps` shows pgbouncer healthy | ⬜ |
|   | PgBouncer configured with transaction mode | | |
| 8 | **Query Logging** | Check `docker logs postgres` for slow queries | ⬜ |
|   | `log_min_duration_statement = 100` active | | |
| 9 | **Schema CI** | `pnpm ci:validate` exits 0 | ⬜ |
|   | Squawk lints migrations, dry-run validates | | |
| 10 | **CFO Demo** | Live demo witnessed by stakeholder | ⬜ |
|    | End-to-end: create tenant → post journal → verify isolation | | |

---

## 🎯 Demo Script (Criterion #10)

```bash
# 1. Start fresh database
pnpm db:reset

# 2. Run all migrations
pnpm migrate

# 3. Seed test data
pnpm seed:all

# 4. Run all tests
pnpm test

# 5. Show isolation (manual verification)
# - Create Tenant A journal entry
# - Switch to Tenant B context  
# - Verify Tenant A data is NOT visible
# - Attempt cross-schema query → BLOCKED
# - Attempt journal modification → BLOCKED
```

**Demo Witness Sign-off:**

| Role | Name | Date | Signature |
|------|------|------|-----------|
| CFO/Finance Lead | | | |
| Architecture Lead | | | |
| DIE Lead | | | |

---

## 🔓 Unlock Procedure

When ALL criteria are ✅:

1. **Update Gate Status** above to `🟢 UNLOCKED`
2. **Record completion date** in this document
3. **Update ADR-003** status from `DEFERRED` to `APPROVED`
4. **Proceed with adapter implementation:**
   - `adapters/supabase/001_enable_rls.sql`
   - `adapters/supabase/002_rls_policies.sql`
   - Migration runner wiring for `adapters/`

---

## ⛔ Forbidden Until Gate Passes

| Action | Reason |
|--------|--------|
| Create `adapters/**/*.sql` files | Schema drift risk |
| Wire migration runner to scan `adapters/` | Premature execution |
| Implement provider-specific RLS | Core isolation not verified |
| Add Supabase `auth.uid()` dependencies | Portability violation |
| Deploy to Supabase with RLS | Untested security model |

---

## 📋 Current MVP Progress

### Completed
- [x] Migration scaffolding (`migrations/kernel/`, `migrations/finance/`)
- [x] PRD-DB-MVP.md created
- [x] ADR-003 documented (deferred)
- [x] Adapter READMEs scaffolded (documentation-only)
- [x] Schema validation tools (Squawk, pgTAP) configured
- [x] pgTAP tests created (`tests/schema/`, `tests/constraints/`)

### Created (Pending DB Application)
- [x] Task 1: DB Role Separation — `014_create_db_roles.sql` CREATED
- [x] Task 2: Schema Permissions — `015_grant_schema_permissions.sql` CREATED
- [x] Task 3: Tenant Isolation Guard — `lib/tenant-guard.ts` CREATED
- [x] Task 4: Tenant Isolation Tests — **COMPREHENSIVE** 37 tests created:
  - `tests/isolation/001_cross_tenant_blocked.sql` (15 tests)
  - `tests/isolation/002_schema_boundary.sql` (12 tests)
  - `tests/isolation/003_attack_scenarios.sql` (10 tests)
  - `tests/tenant-isolation.test.ts` (Vitest integration tests)
- [x] Task 5: Double-Entry Constraint — `101_double_entry_constraint.sql` CREATED
- [x] Task 6: Journal Immutability — `102_journal_immutability.sql` CREATED
- [ ] ⏳ Run `pnpm db:up && pnpm migrate` to apply all migrations
- [ ] ⏳ Run `pnpm verify:roles` to verify roles
- [ ] ⏳ Run `pnpm test:all` to verify all tests

### Not Started
- [ ] Task 10: CFO Demo

### Infrastructure Created
- [x] Task 7: Connection Pooling — `docker-compose.yml` + PgBouncer CREATED
- [x] Task 8: Query Logging — `config/postgresql.conf` CREATED
- [x] Task 9: Schema CI — `.github/workflows/db-validate.yml` CREATED

---

## 📅 Timeline

| Phase | Target | Status |
|-------|--------|--------|
| **Week 1 (Days 1-5)** | Criteria 1-5 | 🟢 Code Created (Pending DB) |
| **Week 2 (Days 6-10)** | Criteria 6-10 | 🟡 Partially Started |
| **Post-MVP (v1.1.0)** | Adapter layer | ⏸️ DEFERRED |

---

## 📊 Code Creation Progress

| Task | Code Created | Tests | Pending |
|------|--------------|-------|---------|
| Task 1 (DB Roles) | ✅ `014_create_db_roles.sql` | `003_roles_exist.sql` | Apply to DB |
| Task 2 (Permissions) | ✅ `015_grant_schema_permissions.sql` | `002_schema_boundary.sql` | Apply to DB |
| Task 3 (Tenant Guard) | ✅ `lib/tenant-guard.ts` | `tenant-isolation.test.ts` | — |
| Task 4 (Isolation Tests) | ✅ **37 tests created** | `tests/isolation/*.sql` | Apply to DB |
| Task 5 (Double-Entry) | ✅ `101_double_entry_constraint.sql` | `001_double_entry.sql` | Apply to DB |
| Task 6 (Immutability) | ✅ `102_journal_immutability.sql` | `002_immutability.sql` | Apply to DB |
| Task 7 (Pooling) | ✅ `docker-compose.yml` | — | Start with `pnpm db:up` |
| Task 8 (Logging) | ✅ `config/postgresql.conf` | — | Apply on db restart |
| Task 9 (Schema CI) | ✅ `.github/workflows/db-validate.yml` | — | Push to trigger |
| Task 10 (Demo) | ⬜ | — | Stakeholder meeting |

---

**Last Updated:** 2025-01-27  
**Gate Owner:** DIE / Architecture Team
