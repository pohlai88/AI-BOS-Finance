# CONT_06 Schema Specification v1.0

> **Canonical Metadata Registry Schema**  
> This document defines the **authoritative database schema** for the Metadata Registry.  
> All code (Drizzle, Zod, TypeScript) MUST be derived from this specification.

---

## ⚠️ Critical Principle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SSOT: The database rows in `mdm_global_metadata` ARE the source of truth. │
│        All Drizzle tables, Zod schemas, and TypeScript types are DERIVED.  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Core Tables (MVP v1.0)

### 1.1 `mdm_global_metadata` — Field/Concept Registry

The primary registry for all canonical field definitions.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `tenant_id` | UUID | NO | - | Multi-tenant isolation |
| `canonical_key` | TEXT | NO | - | Unique key per tenant (e.g., `finance.journal_entries.amount`) |
| `label` | TEXT | NO | - | Human-readable label |
| `description` | TEXT | YES | - | Detailed description |
| `domain` | TEXT | NO | - | Business domain (kernel, finance, hr) |
| `module` | TEXT | NO | - | Module within domain (iam, gl, ap) |
| `entity_urn` | TEXT | NO | - | Entity identifier (e.g., `finance.journal_entries`) |
| `tier` | TEXT | NO | `'tier3'` | Governance tier (tier1-tier5) |
| `standard_pack_id` | TEXT | YES | - | FK to `mdm_standard_pack.pack_id` |
| `data_type` | TEXT | NO | - | Technical data type (uuid, text, decimal, etc.) |
| `format` | TEXT | YES | - | Format pattern (e.g., `YYYY-MM-DD`) |
| `aliases_raw` | TEXT | YES | - | Semicolon-separated aliases |
| `owner_id` | TEXT | NO | - | Data owner role/person |
| `steward_id` | TEXT | NO | - | Data steward role/person |
| `status` | TEXT | NO | `'active'` | Status (active, deprecated, draft) |
| `is_draft` | BOOLEAN | NO | `false` | Draft flag |
| `created_at` | TIMESTAMPTZ | YES | `NOW()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | YES | `NOW()` | Last update timestamp |
| `created_by` | TEXT | NO | - | Creator ID |
| `updated_by` | TEXT | NO | - | Last updater ID |

**Constraints:**
- `UNIQUE(tenant_id, canonical_key)` — One definition per key per tenant
- `FK(standard_pack_id) → mdm_standard_pack(pack_id)`

**Indexes:**
- `(tenant_id, domain, module)` — Domain/module filtering
- `(tenant_id, tier, status)` — Governance queries
- `(tenant_id, entity_urn)` — Entity grouping

---

### 1.2 `mdm_entity_catalog` — Entity Registry

Catalog of all entities (tables, views, APIs, screens) in the system.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `tenant_id` | UUID | NO | - | Multi-tenant isolation |
| `entity_urn` | TEXT | NO | - | Unique entity URN (e.g., `finance.journal_entries`) |
| `entity_name` | TEXT | NO | - | Human-readable name |
| `entity_type` | TEXT | NO | - | Type (table, view, api, screen, report) |
| `domain` | TEXT | NO | - | Business domain |
| `module` | TEXT | NO | - | Module within domain |
| `system` | TEXT | YES | - | Source system (erp, external, etc.) |
| `criticality` | TEXT | YES | - | Criticality level (critical, high, medium, low) |
| `lifecycle_status` | TEXT | NO | `'active'` | Status (draft, active, deprecated) |
| `description` | TEXT | YES | - | Entity description |
| `created_at` | TIMESTAMPTZ | YES | `NOW()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | YES | `NOW()` | Last update timestamp |
| `created_by` | TEXT | NO | - | Creator ID |
| `updated_by` | TEXT | YES | - | Last updater ID |

**Constraints:**
- `UNIQUE(tenant_id, entity_urn)` — One entity per URN per tenant

**Indexes:**
- `(tenant_id, domain, module)` — Domain/module filtering
- `(tenant_id, entity_type)` — Type filtering

---

### 1.3 `mdm_metadata_mapping` — Field Mapping Registry

Maps local system fields to canonical metadata definitions.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `tenant_id` | UUID | NO | - | Multi-tenant isolation |
| `local_system` | TEXT | NO | - | Source system name (e.g., `SAP_ERP_PROD`) |
| `local_entity` | TEXT | NO | - | Local table/entity name |
| `local_field` | TEXT | NO | - | Local field/column name |
| `canonical_key` | TEXT | NO | - | FK to `mdm_global_metadata.canonical_key` |
| `mapping_source` | TEXT | NO | `'manual'` | How mapped (manual, ai-suggested) |
| `approval_status` | TEXT | NO | `'approved'` | Status (pending, approved, rejected) |
| `confidence_score` | DECIMAL(3,2) | YES | - | AI confidence (0.00-1.00) |
| `created_at` | TIMESTAMPTZ | YES | `NOW()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | YES | `NOW()` | Last update timestamp |
| `created_by` | TEXT | NO | - | Creator ID |
| `updated_by` | TEXT | YES | - | Last updater ID |

**Constraints:**
- `UNIQUE(tenant_id, local_system, local_entity, local_field)` — One mapping per field

**Indexes:**
- `(tenant_id, canonical_key)` — Find all mappings for a canonical field
- `(tenant_id, local_system)` — Filter by source system

---

### 1.4 `mdm_standard_pack` — Standards Reference

Reference table for governance standards (IFRS, GAAP, SOC2).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `pack_id` | TEXT | NO | - | Unique pack identifier (e.g., `IFRS-15`) |
| `pack_name` | TEXT | NO | - | Human-readable name |
| `version` | TEXT | NO | - | Version string |
| `description` | TEXT | YES | - | Pack description |
| `category` | TEXT | NO | - | Category (accounting, compliance, security) |
| `tier` | TEXT | NO | - | Governance tier this pack applies to |
| `status` | TEXT | NO | `'active'` | Status (active, deprecated) |
| `is_primary` | BOOLEAN | NO | `false` | Primary pack for category |
| `standard_body` | TEXT | NO | - | Issuing body (IASB, FASB, SOC) |
| `standard_reference` | TEXT | YES | - | External reference URL |
| `created_at` | TIMESTAMPTZ | YES | `NOW()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | YES | `NOW()` | Last update timestamp |
| `created_by` | TEXT | NO | - | Creator ID |
| `updated_by` | TEXT | YES | - | Last updater ID |

**Constraints:**
- `UNIQUE(pack_id)` — Pack ID is globally unique

---

## 2. Governance Tiers

| Tier | Name | Approval Required | Standard Pack | Example |
|------|------|-------------------|---------------|---------|
| `tier1` | Constitutional | kernel_architect | REQUIRED | Core identity fields |
| `tier2` | Governed | metadata_steward | REQUIRED | Financial standards (IFRS) |
| `tier3` | Managed | auto-approve (steward+) | Optional | Business fields |
| `tier4` | Operational | auto-approve (admin+) | None | Local fields |
| `tier5` | User-defined | auto-approve | None | Custom fields |

---

## 3. Entity URN Format

```
{domain}.{entity_name}

Examples:
- kernel.tenants
- kernel.users
- finance.journal_entries
- finance.journal_lines
- finance.accounts
- metadata.global_metadata
```

---

## 4. Canonical Key Format

> 📖 **See Also:** [REF_METADATA_GLOSSARY.md](../../E-Knowledge/E-REF/REF_METADATA_GLOSSARY.md) for complete term definitions.

**Format:** `{entity_urn}.{field_name}`

- `entity_urn`: Fully-qualified entity identifier (e.g., `finance.journal_entries`)
- `field_name`: Short field name within the entity (e.g., `amount`)
- `canonical_key`: The combination (e.g., `finance.journal_entries.amount`)

```
Examples:
- kernel.tenants.id
- finance.journal_entries.journal_date
- finance.accounts.account_code
```

**Why fully-qualified?**
1. **Global Uniqueness:** No collisions across entities with same field names
2. **Lineage Tracking:** Self-documenting references in data flows
3. **Code Clarity:** `finance.journal_entries.amount` is unambiguous in logs/code

---

## 5. Type Generation Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 1: Define Entity in mdm_entity_catalog                               │
│  → INSERT INTO mdm_entity_catalog (entity_urn, ...) VALUES (...)           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 2: Define Fields in mdm_global_metadata                              │
│  → INSERT INTO mdm_global_metadata (canonical_key, entity_urn, ...) ...    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 3: Run Type Generator                                                 │
│  → pnpm metadata:generate-types                                             │
│  → Queries mdm_global_metadata via Supabase MCP                            │
│  → Outputs: packages/kernel-core/src/db/generated/types.ts                 │
│  → Outputs: packages/kernel-core/src/db/generated/schemas.ts               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 4: Import Types in Canon/Molecule/Cell                               │
│  → import { FinanceJournalEntriesTable } from '@aibos/kernel-core/db'      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. GRCD Rules Enforced

1. **No entity without catalog entry**: Every `entity_urn` in `mdm_global_metadata` MUST exist in `mdm_entity_catalog`.

2. **No field without canonical definition**: Any field used in type generation MUST be registered in `mdm_global_metadata`.

3. **Tier1/Tier2 require standard pack**: Fields with `tier = 'tier1'` or `tier = 'tier2'` MUST have a `standard_pack_id`.

4. **Unique keys per tenant**: `canonical_key` is unique within each tenant scope.

---

## 7. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-15 | System | Initial specification from Supabase schema |

---

## References

| Document | Purpose |
|----------|---------|
| [CONT_06_SchemaAndTypeGovernance.md](./CONT_06_SchemaAndTypeGovernance.md) | Governance contract |
| [CONT_06_HEXAGON_MAPPING.md](./CONT_06_HEXAGON_MAPPING.md) | Cell and flow definitions |
| [PRD_META_01_METADATA_STUDIO.md](../../E-Knowledge/E-SPEC/PRD_META_01_METADATA_STUDIO.md) | Behavioral specification |
| [REF_METADATA_GLOSSARY.md](../../E-Knowledge/E-REF/REF_METADATA_GLOSSARY.md) | Term definitions |
| [METADATA_LITE_MODE_GUIDE.md](/docs/guides/METADATA_LITE_MODE_GUIDE.md) | Developer DX guide |
| metadata-studio | `apps/kernel/src/metadata-studio/db/schema/` |
| Supabase | Live database with current schema |
