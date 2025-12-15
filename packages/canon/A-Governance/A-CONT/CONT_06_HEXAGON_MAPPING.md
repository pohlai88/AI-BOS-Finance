# CONT_06 Hexagonal Mapping

> **Metadata & Canon Molecule** — Atomic Cells and Process Flows  
> This document maps CONT_06 to the Hexagonal Molecularity Model.

---

## 1. Principle Hexagon → Metadata & Canon Molecule

The four core tables from CONT_06 form the **Metadata & Canon Molecule** in the Principle Layer:

| Table | Purpose | Cell |
|-------|---------|------|
| `mdm_global_metadata` | Field/Concept Registry | `FieldRegisterCell` |
| `mdm_entity_catalog` | Entity Registry | `EntityRegisterCell` |
| `mdm_metadata_mapping` | Local→Canonical Mapping | `FieldMappingCell` |
| `mdm_standard_pack` | Standards (IFRS, SOC2) | `StandardPackRegisterCell` |

---

## 2. Atomic Cells (6-Face Template)

### 2.1 `EntityRegisterCell`

| Face | Description |
|------|-------------|
| **Input** | Entity definition (URN, name, type, domain, module) |
| **Validation** | UNIQUE(tenant_id, entity_urn), valid entity_type |
| **Logic** | Create/update entity in catalog |
| **Output** | Created/updated entity record |
| **Event** | `metadata.entity.registered` |
| **Audit** | created_by, updated_by, timestamps |

**Target Table:** `mdm_entity_catalog`

---

### 2.2 `FieldRegisterCell`

| Face | Description |
|------|-------------|
| **Input** | Field definition (canonical_key, entity_urn, data_type, tier) |
| **Validation** | UNIQUE(tenant_id, canonical_key), entity_urn exists in catalog, tier1/2 require standard_pack_id |
| **Logic** | Create/update field in metadata registry |
| **Output** | Created/updated field record |
| **Event** | `metadata.field.registered` |
| **Audit** | created_by, updated_by, timestamps |

**Target Table:** `mdm_global_metadata`

**GRCD Rules Enforced:**
1. No field without entity (FK check to mdm_entity_catalog)
2. Tier1/Tier2 require standard_pack_id
3. canonical_key format: `{entity_urn}.{field_name}`

---

### 2.3 `FieldMappingCell`

| Face | Description |
|------|-------------|
| **Input** | Mapping definition (local_system, local_entity, local_field, canonical_key) |
| **Validation** | UNIQUE(tenant_id, local_system, local_entity, local_field), canonical_key exists |
| **Logic** | Create/update mapping, handle AI suggestions |
| **Output** | Created/updated mapping record |
| **Event** | `metadata.mapping.created` or `metadata.mapping.approved` |
| **Audit** | created_by, updated_by, timestamps, confidence_score |

**Target Table:** `mdm_metadata_mapping`

**Approval Workflow:**
- `manual` → `approved` (auto)
- `ai-suggested` → `pending` → `approved`/`rejected` (HITL)

---

### 2.4 `StandardPackRegisterCell`

| Face | Description |
|------|-------------|
| **Input** | Standard pack definition (pack_id, name, category, tier, standard_body) |
| **Validation** | UNIQUE(pack_id), valid category and tier |
| **Logic** | Create/update standard pack |
| **Output** | Created/updated pack record |
| **Event** | `metadata.standard_pack.registered` |
| **Audit** | created_by, updated_by, timestamps |

**Target Table:** `mdm_standard_pack`

**Categories:**
- `accounting` (IFRS, GAAP, MFRS)
- `compliance` (SOC2, HIPAA)
- `security` (ISO27001)

---

### 2.5 `TypeGenerationCell`

| Face | Description |
|------|-------------|
| **Input** | Tenant ID, optional domain filter |
| **Validation** | Tenant exists, metadata populated |
| **Logic** | Query mdm_entity_catalog + mdm_global_metadata, generate TS + Zod |
| **Output** | Generated files: `types.ts`, `schemas.ts` |
| **Event** | `metadata.types.generated` |
| **Audit** | Generation timestamp, field count, entity count |

**Output Location:** `packages/kernel-core/src/db/generated/`

**Pipeline:**
1. Read `mdm_entity_catalog` → Get entities
2. Read `mdm_global_metadata` → Get fields per entity
3. Generate TypeScript interfaces
4. Generate Zod schemas with `satisfies z.ZodType<T>`
5. Write to generated directory

---

## 3. Process Hexagon → Metadata Onboarding Flow

### Flow: Metadata → Types

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 1: EntityRegisterCell                                                 │
│  → Define entity in mdm_entity_catalog                                      │
│  → Event: metadata.entity.registered                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 2: FieldRegisterCell                                                  │
│  → Define fields in mdm_global_metadata                                     │
│  → Validate: entity exists, tier rules, canonical_key format                │
│  → Event: metadata.field.registered                                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 3: TypeGenerationCell                                                 │
│  → Query metadata, generate TS + Zod                                        │
│  → Output: packages/kernel-core/src/db/generated/                           │
│  → Event: metadata.types.generated                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 4: Consumption (Canon/Molecule/Cell)                                  │
│  → import { FinanceJournalEntriesTable } from '@aibos/kernel-core/db'       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Views

| View | Focus |
|------|-------|
| **Accounting/Domain** | Which business entity is being defined (journal_entries, accounts) |
| **AIS View** | Which tables & schemas are affected |
| **Compliance View** | Which standard_pack_id and tier rules apply |

---

## 4. Kernel Hexagon Integration

### Cell & Flow Registry
- `mdm_entity_catalog` + `mdm_global_metadata` = Kernel-level SSOT for all schema

### Policy & Control Engine
Enforce GRCD rules:
1. ✅ No entity without catalog entry
2. ✅ No field without canonical definition
3. ✅ Tier1/Tier2 must have standard_pack_id
4. ✅ canonical_key unique per tenant

### Telemetry & Risk (Future)
- Orphan entity detection
- Draft fields in production alerts
- Metadata coverage metrics
- Schema drift detection

---

## 5. Directory Structure

```
apps/kernel/src/metadata-studio/
├── cells/                        # Atomic Cells (NEW)
│   ├── entity-register.cell.ts
│   ├── field-register.cell.ts
│   ├── field-mapping.cell.ts
│   ├── standard-pack-register.cell.ts
│   └── type-generation.cell.ts
├── db/
│   └── schema/
│       ├── entity-catalog.tables.ts      # mdm_entity_catalog
│       ├── metadata.tables.ts            # mdm_global_metadata
│       ├── metadata-mapping.tables.ts    # mdm_metadata_mapping
│       └── standard-pack.tables.ts       # mdm_standard_pack
├── api/                          # REST endpoints
├── services/                     # Business logic
└── events/                       # Event bus
```

---

## 6. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-15 | System | Initial hexagonal mapping |

---

## References

- **CONT_06**: Schema and Type Governance
- **CONT_06_SCHEMA_SPEC.md**: Database schema specification
- **Hexagonal Molecularity Model**: AI-BOS architecture framework
