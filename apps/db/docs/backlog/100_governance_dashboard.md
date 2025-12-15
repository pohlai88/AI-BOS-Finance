# AI-BOS Governance Dashboard (v2.0+)

> **Canon Code:** BACKLOG_100  
> **Status:** 📋 BACKLOG  
> **Priority:** P3 (after core finance features)  
> **Created:** 2025-12-15  
> **Dependencies:** v1.x Observability Contract

---

## 🎯 Strategic Position

> **The Complement Doctrine Applied:**  
> We do NOT build generic database tools. We build what only AI-BOS can offer.

### What We're NOT Building

| Feature | Why Not | Use Instead |
|---------|---------|-------------|
| SQL Editor | Supabase Dashboard has it | Supabase Dashboard |
| Table Browser | Generic CRUD UI exists | pgAdmin, Supabase |
| Backup Management | Provider handles it | Supabase Dashboard |
| Query Analyzer | Mature tools exist | EXPLAIN, pgAdmin |
| Generic Charts | BI tools do this better | Metabase, Grafana |

### What We ARE Building (Unique Value)

| Feature | Why Unique | Can't Get Elsewhere |
|---------|------------|---------------------|
| **Tenant Health Score** | Multi-tenant isolation verification | ✅ AI-BOS only |
| **Journal Integrity** | Double-entry audit dashboard | ✅ AI-BOS only |
| **Schema Boundary Map** | Hexagonal enforcement visual | ✅ AI-BOS only |
| **Compliance Posture** | SOC2/HIPAA control status | ✅ AI-BOS only |
| **Drift Alerts** | Schema Guardian live warnings | ✅ AI-BOS only |

---

## ✅ MVP Prerequisites (Ship in v1.x WITHOUT UI)

Before building any dashboard, we ship the **Observability Contract** — stable views and roles that external tools can consume.

### 1. Monitoring Role

```sql
-- Created in migration 016_governance_views.sql
CREATE ROLE aibos_monitor_role NOLOGIN;

-- Read-only access to governance views
GRANT SELECT ON kernel.v_tenant_health TO aibos_monitor_role;
GRANT SELECT ON kernel.v_governance_summary TO aibos_monitor_role;
GRANT SELECT ON finance.v_journal_integrity TO aibos_monitor_role;
```

### 2. Governance Views (Stable Contract)

| View | Schema | Purpose |
|------|--------|---------|
| `v_tenant_health` | kernel | Per-tenant health metrics |
| `v_governance_summary` | kernel | All pass/fail checks in one view |
| `v_schema_boundary_check` | kernel | Hexagonal boundary verification |
| `v_tenant_isolation_check` | kernel | tenant_id column verification |
| `v_journal_integrity` | finance | Double-entry balance per journal |
| `v_journal_integrity_summary` | finance | Integrity summary by tenant |
| `v_immutability_check` | finance | Posted journal modification check |

### 3. Evidence Pack Export

```bash
# Generate auditor-ready evidence pack
pnpm evidence:export

# Output: JSON + CSV files
# - governance-summary-{timestamp}.csv
# - tenant-health-{timestamp}.csv
# - schema-boundary-{timestamp}.csv
# - tenant-isolation-{timestamp}.csv
# - journal-integrity-{timestamp}.csv
```

### 4. External Tool Integration

| Tool | Connect Via | What They Can Show |
|------|-------------|-------------------|
| **Metabase** | `aibos_monitor_role` | All governance views as dashboards |
| **Grafana** | PostgreSQL datasource | Time-series metrics, alerts |
| **pgAdmin** | Direct connection | Ad-hoc queries on views |

---

## 🔮 v2.0 Overlay UI (Future)

### Design Principles

1. **Unique Value Only** — No generic DB features
2. **Governance Focus** — Trust, not data
3. **Auditor-First** — Export-ready evidence
4. **Minimal Surface** — Read-only, no SQL execution

### Proposed Screens

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    AI-BOS GOVERNANCE DASHBOARD                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────┐  ┌────────────────────────┐                 │
│  │   OVERALL STATUS       │  │   COMPLIANCE           │                 │
│  │                        │  │                         │                 │
│  │   ✅ 4/4 PASSING       │  │   SOC2     ✅ Ready     │                 │
│  │                        │  │   HIPAA    🟡 Pending   │                 │
│  │   Last Check: 2m ago   │  │                         │                 │
│  └────────────────────────┘  └────────────────────────┘                 │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     GOVERNANCE CHECKS                              │   │
│  │                                                                    │   │
│  │  ✅ Tenant Isolation    Pass: 25  Fail: 0                         │   │
│  │  ✅ Schema Boundary     Pass: 9   Fail: 0                         │   │
│  │  ✅ Journal Integrity   Balanced: 1,234  Violations: 0            │   │
│  │  ✅ Immutability        OK: 987  Potential: 0                     │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     TENANT HEALTH                                  │   │
│  │                                                                    │   │
│  │  Demo Corp     ✅ HEALTHY    Users: 5   Journals: 234              │   │
│  │  Acme Inc      ✅ HEALTHY    Users: 3   Journals: 89               │   │
│  │  Widget Co     ⚠️  NO_USERS  Users: 0   Journals: 0                │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  📥 EXPORT EVIDENCE PACK                                          │   │
│  │                                                                    │   │
│  │  [ Download JSON ]  [ Download CSV ]  [ Schedule Weekly ]          │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Tech Stack (if built)

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Frontend | Next.js + Shadcn UI | Matches existing AI-BOS stack |
| Data Fetch | Supabase Realtime | Live updates without polling |
| Charts | Tremor or Recharts | Modern, accessible |
| Auth | Supabase Auth | Already integrated |

---

## 📋 Acceptance Criteria

### v1.x Prerequisites

- [x] `aibos_monitor_role` created
- [x] All governance views created
- [x] Evidence Pack export script
- [ ] Views applied to Supabase project
- [ ] Metabase connected and tested
- [ ] Evidence Pack exported and reviewed

### v2.0 Overlay (Future)

- [ ] Overall status dashboard
- [ ] Tenant health list
- [ ] Governance check details
- [ ] Evidence Pack download
- [ ] Real-time updates via Supabase
- [ ] SOC2/HIPAA compliance checklist

---

## 🚫 Security Non-Negotiables

| Rule | Implementation |
|------|----------------|
| **Read-Only** | `aibos_monitor_role` has SELECT only |
| **No SQL Editor** | Dashboard cannot execute arbitrary SQL |
| **No Write Actions** | No INSERT/UPDATE/DELETE from UI |
| **Audit Logging** | All dashboard access logged |
| **Role Separation** | Dashboard role separate from app roles |

---

## 📅 Timeline (Estimated)

| Phase | Scope | Effort |
|-------|-------|--------|
| v1.x | Views + Evidence Pack + External Tools | ✅ Done |
| v2.0a | Overlay UI MVP (read-only) | 3 weeks |
| v2.0b | Real-time + Alerts | 2 weeks |
| v2.0c | Compliance Checklist | 1 week |

---

## 📚 References

- [PRD-DB.md](../../PRD-DB.md) — Full product requirements
- [GA-PATCHLIST.md](../../GA-PATCHLIST.md) — Production readiness
- [016_governance_views.sql](../../migrations/kernel/016_governance_views.sql) — View definitions
- [export-evidence-pack.ts](../../scripts/export-evidence-pack.ts) — Export script

---

**Last Updated:** 2025-12-15  
**Owner:** AI-BOS Data Fabric Team
