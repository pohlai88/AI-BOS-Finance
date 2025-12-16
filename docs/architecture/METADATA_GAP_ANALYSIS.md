# Metadata System Gap Analysis

> **Version:** 1.0.0  
> **Date:** 2025-12-16  
> **Status:** Active  
> **Reference:** PRD_META_01_METADATA_STUDIO.md

---

## Executive Summary

This document provides a comprehensive gap analysis comparing the current implementation of the Metadata Studio against the PRD_META_01 specification. Following the cleanup and migration to UI-Driven Development (UDD), the system is now in a **clean, minimal state** ready for incremental enhancement.

---

## 1. Current State Summary

### 1.1 Backend (metadata-studio)

**Clean Structure:**

```
apps/kernel/src/metadata-studio/
├── api/                          # ✅ UDD Routes
│   ├── meta-governance.routes.ts  # META_01, META_04, META_06
│   ├── meta-fields.routes.ts      # META_02, META_03
│   ├── meta-entities.routes.ts    # META_05
│   └── metrics.routes.ts          # Prometheus metrics
├── db/
│   ├── client.ts                  # ✅ Drizzle client
│   ├── schema/                    # ✅ Core tables
│   │   ├── standard-pack.tables.ts
│   │   ├── entity-catalog.tables.ts
│   │   ├── metadata.tables.ts
│   │   ├── metadata-mapping.tables.ts
│   │   └── remediation.tables.ts
│   └── migrations/                # ✅ SQL migrations
├── seed/                          # ✅ Seed data
├── middleware/                    # ✅ Auth middleware
└── index.ts                       # ✅ Clean app entry
```

**Removed (Legacy):**
- ❌ `cells/` - Atomic Cells (8 cells removed)
- ❌ `services/` - Heavy services (20 files removed)
- ❌ `agents/` - AI agents (deferred)
- ❌ `events/` - Event bus (deferred)
- ❌ Legacy API routes (15 routes removed)

### 1.2 BFF Layer (Next.js)

**Complete:**
```
apps/web/
├── app/api/meta/
│   ├── governance/dashboard/route.ts
│   ├── governance/risks/route.ts
│   ├── governance/health/route.ts
│   ├── fields/route.ts
│   ├── fields/[id]/route.ts
│   ├── fields/[id]/mappings/route.ts
│   ├── entities/route.ts
│   ├── entities/tree/route.ts
│   └── entities/[urn]/route.ts
└── lib/
    ├── backend.server.ts          # Server-only backend client
    ├── bff-client.ts              # Browser-safe client
    └── index.ts
```

### 1.3 Frontend (META Pages)

**Existing:**
- `META_01_MetadataArchitecturePage.tsx` - Schema Governance
- `META_02_MetadataGodView.tsx` - Field Registry
- `META_03_ThePrismPage.tsx` - Prism Comparator
- `META_04_MetaRiskRadarPage.tsx` - Risk Radar
- `META_05_MetaCanonMatrixPage.tsx` - Canon Matrix
- `META_06_MetaHealthScanPage.tsx` - Health Scan
- `META_07_MetaLynxCodexPage.tsx` - Lynx Codex (AI)
- `META_08_ImplementationPlaybookPage.tsx` - Playbook

### 1.4 Database

**Core Tables (Implemented):**
| Table | Status | Used By |
|-------|--------|---------|
| `mdm_standard_pack` | ✅ | META_01, META_06 |
| `mdm_entity_catalog` | ✅ | META_05 |
| `mdm_global_metadata` | ✅ | META_02, META_03 |
| `mdm_metadata_mapping` | ✅ | META_03 |
| `mdm_remediation_proposal` | ✅ | Future |
| `mdm_violation_report` | ✅ | META_04 |
| `mdm_scan_history` | ✅ | Future |

---

## 2. Gap Analysis vs PRD_META_01

### 2.1 Core Tables & Schema

| PRD Requirement | Current State | Gap | Priority |
|-----------------|---------------|-----|----------|
| `mdm_standard_pack` schema | ✅ Implemented | None | - |
| `mdm_entity_catalog` schema | ✅ Implemented | None | - |
| `mdm_global_metadata` schema | ✅ Implemented | None | - |
| `mdm_metadata_mapping` schema | ✅ Implemented | None | - |
| `mdm_violation_report` schema | ✅ Implemented | None | - |
| `mdm_remediation_proposal` schema | ✅ Implemented | None | - |
| RLS policies | ⚠️ Partial | Need Supabase migration | P1 |

### 2.2 Atomic Cells (PRD Section 4)

| Cell | PRD Status | Current State | Gap | Priority |
|------|------------|---------------|-----|----------|
| `EntityRegisterCell` | Required | ❌ Removed | Now UDD route | Deferred |
| `FieldRegisterCell` | Required | ❌ Removed | Now UDD route | Deferred |
| `StandardPackRegisterCell` | Required | ❌ Removed | Admin only | Deferred |
| `FieldMappingCell` | Required | ❌ Removed | Now UDD route | Deferred |
| `TypeGenerationCell` | Required | ❌ Removed | CLI script exists | P2 |
| `MetadataScanCell` | Required | ❌ Removed | Need implementation | P2 |
| `RemediationProposalCell` | Required | ❌ Removed | Need implementation | P3 |
| `RemediationApplyCell` | Required | ❌ Removed | Need implementation | P3 |

**Decision:** Atomic Cells were deemed too heavy for MVP. UDD routes provide equivalent functionality with less complexity. Cells can be reintroduced when HITL workflows are needed.

### 2.3 API Endpoints (PRD Section 6)

| PRD Endpoint | Current State | Gap | Priority |
|--------------|---------------|-----|----------|
| `GET /entities` | ✅ `/api/meta/entities` | None | - |
| `POST /entities` | ✅ `/api/meta/entities` | None | - |
| `GET /entities/:urn` | ✅ `/api/meta/entities/:urn` | None | - |
| `GET /fields` | ✅ `/api/meta/fields` | None | - |
| `POST /fields` | ✅ `/api/meta/fields` | None | - |
| `GET /fields/:id` | ✅ `/api/meta/fields/:id` | None | - |
| `GET /fields/:key/mappings` | ✅ `/api/meta/fields/:key/mappings` | None | - |
| `GET /standard-packs` | ❌ Missing | Need implementation | P2 |
| `POST /standard-packs` | ❌ Missing | Admin-only | P3 |
| `POST /mappings` | ❌ Missing | Need implementation | P2 |
| `POST /scan` | ❌ Missing | Remediation workflow | P3 |
| `GET /violations` | ⚠️ Inline | Part of /risks | - |
| `GET /proposals` | ❌ Missing | Remediation workflow | P3 |
| `POST /generate-types` | ❌ Missing | CLI only | P3 |

### 2.4 Governance Features (PRD Section 3)

| Feature | PRD Spec | Current State | Gap | Priority |
|---------|----------|---------------|-----|----------|
| **Tier System** | tier1-tier5 | ✅ Implemented in schema | None | - |
| **Standard Pack FK** | Required for tier1/2 | ✅ Schema enforces | None | - |
| **GRCD-12 Enforcement** | Block tier1/2 without pack | ⚠️ Warn only (Lite Mode) | Need Governed Mode | P2 |
| **GRCD-11 Enforcement** | Block orphan entity_urn | ⚠️ Auto-create (Lite Mode) | Need Governed Mode | P2 |
| **HITL Approvals** | Tier1/2 changes need approval | ❌ Not implemented | Major gap | P1 |
| **Audit Trail** | Full change history | ⚠️ Basic logging | Need audit table | P2 |

### 2.5 Lite Mode vs Governed Mode (PRD Section 3.1)

| Mode | PRD Spec | Current State | Gap |
|------|----------|---------------|-----|
| **Lite Mode (Tier3-5)** | Auto-approve, fast | ✅ Implemented | None |
| **Governed Mode (Tier1-2)** | HITL, strict validation | ❌ Not implemented | Major |
| **Lite View** | `vw_mdm_lite_metadata` | ✅ Migration exists | None |
| **Tier Promotion** | Lite → Governed flow | ❌ Not implemented | P2 |

### 2.6 Security & RBAC (PRD Section 7)

| Requirement | PRD Spec | Current State | Gap | Priority |
|-------------|----------|---------------|-----|----------|
| Role definitions | 5 roles defined | ⚠️ Auth middleware exists | Need RBAC | P1 |
| Approval matrix | Per-tier approvers | ❌ Not implemented | Need workflow | P1 |
| RLS policies | Tenant isolation | ⚠️ Partial | Need Supabase migration | P1 |

### 2.7 Telemetry (PRD Section 8)

| Metric | PRD Spec | Current State | Gap | Priority |
|--------|----------|---------------|-----|----------|
| Prometheus metrics | `/metrics` endpoint | ✅ Exists | None | - |
| Orphan field count | Real-time | ⚠️ Query in /risks | Works | - |
| Unanchored tier1/2 | Real-time | ⚠️ Query in /risks | Works | - |
| Audit events | 7-year retention | ❌ Not implemented | Need audit table | P2 |

---

## 3. Priority Matrix

### P0 - Critical (Blocking MVP)
None - MVP is unblocked

### P1 - High Priority (Next Sprint)
| Gap | Description | Effort |
|-----|-------------|--------|
| HITL Approvals | Tier1/2 changes need human approval | 3-5 days |
| RBAC Implementation | Role-based access control | 2-3 days |
| RLS Policies | Row-level security in Supabase | 1-2 days |
| NextAuth Integration | Real authentication in BFF | 2-3 days |

### P2 - Medium Priority (Sprint +1)
| Gap | Description | Effort |
|-----|-------------|--------|
| Standard Pack API | CRUD for standard packs | 1 day |
| Mapping API | POST /mappings endpoint | 1 day |
| GRCD Governed Mode | Strict enforcement for tier1/2 | 2-3 days |
| Audit Trail | Audit table and events | 2-3 days |
| MetadataScanCell | Scan for violations | 2 days |
| Tier Promotion | Lite → Governed workflow | 1-2 days |

### P3 - Low Priority (Backlog)
| Gap | Description | Effort |
|-----|-------------|--------|
| Remediation Workflow | Full scan → propose → apply | 5-7 days |
| Type Generation API | HTTP endpoint (CLI exists) | 1 day |
| Event Bus | Redis event system | 3-5 days |
| AI Agents | Data quality sentinel | 5-7 days |

---

## 4. Recommended Roadmap

### Phase 1: Auth & Security (Week 1-2)
1. ✅ BFF layer complete
2. [ ] Integrate NextAuth with backend.server.ts
3. [ ] Add RBAC middleware
4. [ ] Deploy RLS policies to Supabase

### Phase 2: Governed Mode (Week 3-4)
1. [ ] Add HITL approval workflow
2. [ ] Implement strict GRCD enforcement for tier1/2
3. [ ] Add audit trail table
4. [ ] Create approval UI in frontend

### Phase 3: Remediation (Week 5-6)
1. [ ] Implement MetadataScanCell
2. [ ] Build remediation workflow
3. [ ] Create remediation UI

### Phase 4: Advanced (Week 7+)
1. [ ] Event bus integration
2. [ ] AI agents
3. [ ] Type generation automation

---

## 5. Files Removed in Cleanup

### Backend (`apps/kernel/src/metadata-studio/`)

**Cells (8 files):**
- entity-register.cell.ts
- field-register.cell.ts
- metadata-scan.cell.ts
- remediation-apply.cell.ts
- remediation-proposal.cell.ts
- standard-pack-register.cell.ts
- type-generation.cell.ts
- types.ts, index.ts

**Services (20 files):**
- agent-proposal.service.ts
- approval.service.ts
- auto-apply.service.ts
- business-rule.service.ts
- compliance.service.ts
- glossary.service.ts
- impact.service.ts
- kpi-metrics.service.ts
- kpi.service.ts
- lineage.service.ts
- mapping.service.ts
- metadata.service.ts
- naming-policy.service.ts
- policy.service.ts
- quality-scoring.ts
- quality.service.ts
- remediation.service.ts
- rollback.service.ts
- tags.service.ts
- tier-promotion.service.ts

**Legacy Routes (15 files):**
- rules.routes.ts
- approvals.routes.ts
- metadata.routes.ts
- lineage.routes.ts
- glossary.routes.ts
- tags.routes.ts
- kpi.routes.ts
- impact.routes.ts
- quality.routes.ts
- naming.routes.ts
- mapping.routes.ts
- policy.routes.ts
- naming-policy.routes.ts
- agent-proposal.routes.ts
- auto-apply.routes.ts

**Other:**
- agents/data-quality-sentinel.ts
- events/ folder (4 files)
- naming/ folder (3 files)
- observability/ folder (2 files)
- schemas/ (legacy Zod schemas - 10 files)
- tests/integration/

---

## 6. Summary

| Dimension | Before Cleanup | After Cleanup |
|-----------|----------------|---------------|
| API Routes | 18 files | 4 files |
| Services | 20 files | 0 files |
| Cells | 8 files | 0 files |
| Schemas (TS) | 10 files | 1 file |
| DB Schema | 15 tables | 5 core tables |
| Total Backend Files | ~80 files | ~20 files |
| Lines of Code (est) | ~15,000 | ~3,000 |

**Result:** A **75% reduction in codebase size** while maintaining 100% of MVP functionality.

---

## 7. Conclusion

The Metadata Studio is now in a **clean, minimal state** that:

1. ✅ Serves all META frontend pages (META_01 through META_08)
2. ✅ Implements core CONT_06 schema (4 tables + remediation)
3. ✅ Provides BFF layer for secure frontend communication
4. ✅ Supports Lite Mode for rapid development
5. ⚠️ Defers Governed Mode (HITL) for future sprints
6. ⚠️ Defers Remediation workflow for future sprints

**Next Steps:**
1. Complete NextAuth integration (P1)
2. Implement RBAC (P1)
3. Add HITL for tier1/2 (P1)
4. Consider standard-packs API (P2)

---

*This document is part of the Canon Governance System.*
