# Metadata Glossary

> **REF_METADATA_GLOSSARY** — Authoritative naming definitions for Metadata Studio  
> **Version:** 1.0.0  
> **Last Updated:** 2025-12-16  
> **Binding Scope:** All AI-BOS documentation, code, and tools

---

## ⚠️ Purpose

This glossary **freezes** the definitions of key terms used across:
- CONT_06 Schema and Type Governance
- PRD_META_01 Metadata Studio
- Metadata Studio code (`apps/kernel/src/metadata-studio`)
- Type generation scripts
- MCP tools and AI Orchestras

**If a term is not in this glossary, it should not be used in governed documentation.**

---

## 📖 Core Terms

### `entity_urn`

**Definition:** Fully-qualified identifier for an entity (table, view, API, screen).

**Format:** `{domain}.{entity_name}` (dot-separated, snake_case)

**Examples:**
- `kernel.tenants`
- `kernel.users`
- `finance.journal_entries`
- `finance.accounts`
- `metadata.global_metadata`

**Storage:** `mdm_entity_catalog.entity_urn`

**Constraint:** `UNIQUE(tenant_id, entity_urn)`

---

### `field_name`

**Definition:** The short, local name of a field within an entity.

**Format:** `snake_case`, max 64 characters

**Examples:**
- `id`
- `tenant_id`
- `journal_date`
- `amount`
- `account_code`

**Storage:** Implicit in `canonical_key` (see below)

---

### `canonical_key`

**Definition:** Fully-qualified unique identifier for a field.

**Format:** `{entity_urn}.{field_name}` (dot-separated)

**Examples:**
- `kernel.tenants.id`
- `kernel.users.tenant_id`
- `finance.journal_entries.journal_date`
- `finance.accounts.account_code`

**Storage:** `mdm_global_metadata.canonical_key`

**Constraint:** `UNIQUE(tenant_id, canonical_key)`

**Derivation:**
```typescript
// Given:
//   entity_urn = 'finance.journal_entries'
//   field_name = 'amount'
// Then:
//   canonical_key = 'finance.journal_entries.amount'
```

**⚠️ Important:** `canonical_key` is the **full path**, not just the field name. This ensures global uniqueness and supports lineage tracking across entities.

---

### `field_urn` (Alias)

**Definition:** Synonym for `canonical_key`. Used in some contexts for clarity.

**Usage:** Prefer `canonical_key` in code and database; use `field_urn` only in documentation when emphasizing the URN nature.

---

### `standard_pack_id`

**Definition:** Reference to a governance standard pack that anchors Tier1/Tier2 fields.

**Format:** `UPPER_SNAKE_CASE`

**Examples:**
- `MFRS_15` — Revenue from Contracts
- `SOC2_IAM` — Identity & Access Management
- `KERNEL_ID_CORE` — Kernel Identity Core
- `GDPR_PII` — Personal Data Protection

**Storage:** `mdm_global_metadata.standard_pack_id` → FK to `mdm_standard_pack.pack_id`

**Constraint:** Required for `tier = 'tier1'` or `tier = 'tier2'`

---

### `tier`

**Definition:** Governance tier that determines approval requirements and standard pack obligations.

**Values:**

| Tier | Name | Standard Pack | Approval |
|------|------|---------------|----------|
| `tier1` | Constitutional | **Required** | `kernel_architect` |
| `tier2` | Governed | **Required** | `metadata_steward` |
| `tier3` | Managed | Optional | Auto (steward+) |
| `tier4` | Operational | N/A | Auto (admin+) |
| `tier5` | User-defined | N/A | Auto |

**Storage:** `mdm_global_metadata.tier`

---

### `domain`

**Definition:** Top-level business area that owns the entity or field.

**Values:** `kernel`, `finance`, `hr`, `operations`, `sales`, `metadata`, etc.

**Storage:** Both `mdm_entity_catalog.domain` and `mdm_global_metadata.domain`

---

### `module`

**Definition:** Sub-area within a domain.

**Examples:**
- Domain: `kernel` → Modules: `iam`, `audit`, `event`
- Domain: `finance` → Modules: `gl`, `ap`, `ar`, `fa`

**Storage:** Both `mdm_entity_catalog.module` and `mdm_global_metadata.module`

---

## 📦 System Terms

### `Metadata Studio`

**Definition:** The governance engine that manages the Metadata Registry. Implements CONT_06.

**Location:** `apps/kernel/src/metadata-studio`

**Owns:** `mdm_global_metadata`, `mdm_entity_catalog`, `mdm_standard_pack`, `mdm_metadata_mapping`

---

### `liteMetadata`

**Definition:** Developer-friendly façade for Metadata Studio. Provides simple read/write access for Tier3+ fields without full governance overhead.

**Implementation:** `vw_mdm_lite_metadata` view + Lite Mode APIs

**Target Users:** App developers, AI Orchestras (Tier 0-1)

---

### `Metadata Registry`

**Definition:** The collection of `mdm_*` tables that form the SSOT for all schema definitions.

**Tables:**
- `mdm_global_metadata` — Fields/concepts
- `mdm_entity_catalog` — Entities
- `mdm_standard_pack` — Standards
- `mdm_metadata_mapping` — System mappings

---

### `GRCD`

**Definition:** Governance Rules for Canonical Data. The enforcement rules that ensure metadata integrity.

**Examples:**
- GRCD-11: `entity_urn` must exist in catalog
- GRCD-12: Tier1/2 must have `standard_pack_id`
- GRCD-13: `canonical_key` must be valid format

---

## 🔄 Key Relationships

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  mdm_standard_pack                                                          │
│  └── pack_id (e.g., 'MFRS_15')                                              │
│       ▲                                                                      │
│       │ FK: standard_pack_id                                                 │
│       │                                                                      │
│  mdm_entity_catalog                     mdm_global_metadata                 │
│  └── entity_urn (e.g., 'finance.journal_entries')                           │
│       ▲                                 └── canonical_key                    │
│       │ FK: entity_urn                      (e.g., 'finance.journal_entries.amount')
│       │                                     └── Includes entity_urn + field_name
│       │                                                                      │
│       └─────────────────────────────────────┘                               │
│                                                                              │
│  mdm_metadata_mapping                                                        │
│  └── local_system + local_entity + local_field                              │
│       → canonical_key (FK to mdm_global_metadata)                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚠️ Common Mistakes to Avoid

### ❌ Using `canonical_key` as just field name

```
# WRONG
canonical_key: 'revenue_gross'
entity_urn: 'finance.journal_entries'

# CORRECT
canonical_key: 'finance.journal_entries.revenue_gross'
entity_urn: 'finance.journal_entries'
```

### ❌ Creating fields without entity

```
# WRONG: Insert into mdm_global_metadata before entity exists
# CORRECT: First INSERT into mdm_entity_catalog, then mdm_global_metadata
```

### ❌ Tier1/2 without standard pack

```
# WRONG
INSERT INTO mdm_global_metadata (canonical_key, tier)
VALUES ('kernel.tenants.id', 'tier1');  -- Missing standard_pack_id!

# CORRECT
INSERT INTO mdm_global_metadata (canonical_key, tier, standard_pack_id)
VALUES ('kernel.tenants.id', 'tier1', 'KERNEL_ID_CORE');
```

---

## 📚 References

| Document | Purpose |
|----------|---------|
| CONT_06_SchemaAndTypeGovernance.md | Main governance contract |
| CONT_06_SCHEMA_SPEC.md | **Structural SSOT** — column definitions |
| PRD_META_01_METADATA_STUDIO.md | **Behavioral spec** — cells, flows, APIs |
| CONT_06_HEXAGON_MAPPING.md | Hexagonal architecture mapping |

---

## 🔖 Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-12-16 | System | Initial glossary |

---

*This glossary is part of the Canon Governance System. Changes require metadata_steward approval.*
