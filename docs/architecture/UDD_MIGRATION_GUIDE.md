# UI-Driven Development Migration Guide

> **Version:** 1.0.0  
> **Date:** 2025-12-16  
> **Status:** Active

---

## Overview

This document describes the **UI-Driven Development (UDD)** migration for Metadata Studio. Instead of building a complex backend first, we now build exactly what the frontend needs.

## Philosophy

```
Traditional:  Backend → API → Frontend (guess what UI needs)
UDD:          Frontend → API Contract → Backend (build what UI asks for)
```

## New Route Structure

### META Page Routes (`/api/meta/*`)

| Endpoint | Serves | Description |
|----------|--------|-------------|
| `GET /api/meta/governance/dashboard` | META_01 | Schema governance stats, system bindings, violations |
| `GET /api/meta/governance/risks` | META_04 | Risk radar by category |
| `GET /api/meta/governance/health` | META_06 | Health scan with standard pack coverage |
| `GET /api/meta/entities/tree` | META_05 | Entity hierarchy for Canon Matrix |
| `GET /api/meta/entities` | META_05 | List entities with filters |
| `POST /api/meta/entities` | META_05 | Create entity (Lite Mode) |
| `GET /api/meta/fields` | META_02 | God View - paginated field list |
| `GET /api/meta/fields/:id` | META_02/03 | Single field detail |
| `POST /api/meta/fields` | META_02 | Create field (Lite Mode) |
| `GET /api/meta/fields/:key/mappings` | META_03 | Prism comparator - field mappings |

---

## Keep / Defer / Delete Guidance

### ✅ KEEP (Valuable, Stable)

| Path | Reason |
|------|--------|
| `db/schema/*.tables.ts` | Database schema is SSOT |
| `db/migrations/*` | Table structure is stable |
| `seed/standard-packs/*.csv` | Valuable governance data |
| `seed/concepts/*.csv` | Field definitions |
| `middleware/auth.middleware.ts` | Auth is required |
| `db/client.ts` | Database connection |
| `events/` | Event bus infrastructure |
| `observability/` | Metrics and tracing |

### ⏸️ DEFER (Useful Later, Too Heavy for MVP)

| Path | Reason | When to Reintroduce |
|------|--------|---------------------|
| `cells/*.cell.ts` | Too formal for MVP | When HITL approvals are needed |
| `services/remediation.service.ts` | No data to remediate yet | When violations exist |
| `services/compliance.service.ts` | Full GRCD enforcement | After Tier1/2 fields are populated |
| `services/tier-promotion.service.ts` | Complex workflow | After Lite Mode is stable |
| `services/rollback.service.ts` | Advanced feature | After audit trail is needed |

### 🔀 KEEP BUT DEPRECATE (Backward Compatibility)

| Path | Status | Replacement |
|------|--------|-------------|
| `api/metadata.routes.ts` | Deprecated | `/api/meta/fields` |
| `api/mapping.routes.ts` | Deprecated | `/api/meta/fields/:key/mappings` |
| `api/quality.routes.ts` | Keep for now | May merge into `/api/meta/governance/health` |

### ❌ CANDIDATES FOR REMOVAL (After Transition)

| Path | Reason |
|------|--------|
| `cells/` folder | Replaced by simple route handlers |
| Complex approval workflows | Defer until needed |

---

## Migration Checklist

### Phase 1: Core Routes (Current)

- [x] Create shared types (`@ai-bos/shared`)
- [x] Create `meta-governance.routes.ts` (META_01, META_04, META_06)
- [x] Create `meta-entities.routes.ts` (META_05)
- [x] Create `meta-fields.routes.ts` (META_02, META_03)
- [x] Mount new routes in `index.ts`
- [ ] Connect frontend META pages to new endpoints

### Phase 2: Data Population

- [ ] Run `seed/load-metadata.ts` to populate standard packs
- [ ] Create initial entities in `mdm_entity_catalog`
- [ ] Create initial fields in `mdm_global_metadata`
- [ ] Verify META pages display real data

### Phase 3: Governance (Later)

- [ ] Enable GRCD-12 enforcement (block tier1/2 without standard_pack)
- [ ] Enable GRCD-11 enforcement (require entity before field)
- [ ] Add HITL approval workflows for tier1/2 changes
- [ ] Reintroduce Cells as wrappers around route logic

---

## API Contract

The shared types package (`@ai-bos/shared`) defines the exact contract between frontend and backend:

```typescript
import type { 
  MetadataFieldsResponse,
  GovernanceDashboardResponse,
  EntityTreeResponse,
} from '@ai-bos/shared';
```

**Rules:**
1. Backend routes MUST return data matching these types
2. Frontend can import and rely on these types
3. Any breaking change requires updating both sides

---

## Lite Mode vs Governed Mode

### Lite Mode (Current Default)

- Fields can be created without strict validation
- GRCD violations are **logged** but not blocked
- Auto-creates missing entities
- Default tier is `tier3`
- No approval required

### Governed Mode (Future)

- GRCD violations **block** the operation
- Tier1/2 require `standard_pack_id`
- Tier1/2 require HITL approval
- Entity must exist before field creation

**Toggle:** Environment variable `METADATA_GOVERNANCE_MODE=lite|governed`

---

## Directory Structure (After Migration)

```
apps/kernel/src/metadata-studio/
├── api/
│   ├── meta-governance.routes.ts  # NEW: META_01, META_04, META_06
│   ├── meta-entities.routes.ts    # NEW: META_05
│   ├── meta-fields.routes.ts      # NEW: META_02, META_03
│   ├── metadata.routes.ts         # DEPRECATED: use meta-fields
│   └── ... (other legacy routes)
├── db/
│   ├── schema/                    # KEEP: SSOT
│   ├── migrations/                # KEEP: stable
│   └── client.ts                  # KEEP: db connection
├── cells/                         # DEFER: reintroduce later
├── services/                      # MIXED: some keep, some defer
├── seed/                          # KEEP: valuable data
├── events/                        # KEEP: infrastructure
├── middleware/                    # KEEP: auth
└── index.ts                       # UPDATED: new route mounting
```

---

## Testing the New Routes

```bash
# Start the server
cd apps/kernel/src/metadata-studio
npm run dev

# Test META_01 dashboard
curl http://localhost:8787/api/meta/governance/dashboard

# Test META_02 field list
curl http://localhost:8787/api/meta/fields

# Test META_05 entity tree
curl http://localhost:8787/api/meta/entities/tree

# Create a field (Lite Mode)
curl -X POST http://localhost:8787/api/meta/fields \
  -H "Content-Type: application/json" \
  -d '{"entity_urn":"finance.journal_entries","field_name":"amount","label":"Amount"}'
```

---

## Next Steps

1. **Connect Frontend**: Update META_01-08 pages to use new `/api/meta/*` endpoints
2. **Populate Data**: Run seed scripts to create real metadata
3. **Validate UX**: Ensure pages display correctly with real data
4. **Progressive Governance**: Add GRCD enforcement incrementally
