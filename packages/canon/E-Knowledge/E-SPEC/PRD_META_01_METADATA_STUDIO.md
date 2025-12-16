# 📋 PRD: META_01 Metadata Studio ("The Schema Brain")

**Version:** 1.1.0  
**Last Updated:** 2025-12-16  
**Status:** ✅ **IMPLEMENTED (MVP)**  
**Document ID:** `DOC_META_01`  
**Code Reference:** `apps/kernel/src/metadata-studio`  
**Contract Reference:** CONT_06 Schema and Type Governance

> **Implementation Status:** Core functionality complete. See `docs/architecture/METADATA_INTEGRATION_COMPLETE.md` for details.

---

## 📑 Document Registry

| ID | Type | Name | Status | Role |
|----|------|------|--------|------|
| `DOC_META_01` | PRD | Metadata Studio (The Schema Brain) | 🔄 Active | **Behavioral Spec** |
| `CONT_06` | Contract | Schema and Type Governance | ✅ Approved | Governance Rules |
| `CONT_06_SCHEMA_SPEC` | Spec | Database Schema Specification | ✅ Approved | **Structural SSOT** |
| `CONT_06_HEXAGON_MAPPING` | Spec | Hexagonal Mapping | ✅ Approved | Cell Definitions |
| `REF_METADATA_GLOSSARY` | Reference | Metadata Glossary | ✅ Active | Term Definitions |
| `METADATA_LITE_MODE_GUIDE` | Guide | Lite Mode Developer Guide | ✅ Active | DX Documentation |
| `SCH_MDM_01` | Schema | mdm_global_metadata | ✅ Implemented | - |
| `SCH_MDM_02` | Schema | mdm_entity_catalog | ✅ Implemented | - |
| `SCH_MDM_03` | Schema | mdm_standard_pack | ✅ Implemented | - |
| `SCH_MDM_04` | Schema | mdm_metadata_mapping | ✅ Implemented | - |
| `SCH_MDM_05` | Schema | mdm_remediation_proposal | ✅ Implemented | - |
| `ADR_007` | ADR | Metadata Studio Architecture | ⏳ Pending | - |

### Document Roles

- **Structural SSOT (CONT_06_SCHEMA_SPEC):** Authoritative source for column definitions, types, and constraints. Code must match this spec.
- **Behavioral Spec (This PRD):** Defines cells, flows, APIs, and roles. References structural SSOT for schema details.

---

## 1. 🎯 Executive Summary

### 1.1 Vision

The **Metadata Studio** is the **Schema-First Governance Engine** of AI-BOS. It enforces the principle that **"Types are derived, never invented"** — all TypeScript interfaces, Zod schemas, and database DDL must trace back to the Global Metadata Registry.

> **"If it's not in the registry, it doesn't exist. If it's Tier 1 or Tier 2, it must be anchored to a Standard Pack."**

### 1.2 Core Philosophy

| Principle | Description |
|-----------|-------------|
| **Schema-First** | Database = Source of Truth. Types are generated, not hand-crafted. |
| **GRCD Enforcement** | Governance Rules for Canonical Data — no orphan fields, no unanchored Tier1/2 |
| **Hexagonal Molecularity** | Every operation is an Atomic Cell with 6 faces (Contract, Rules, Data, Interfaces, Controls, Telemetry) |
| **HITL for High-Tier** | Tier1/Tier2 changes require Human-In-The-Loop approval |
| **Remediation-Aware** | System actively scans for and proposes fixes to GRCD violations |

### 1.3 Problem Statement

| Problem | Impact | Solution | Status |
|---------|--------|----------|--------|
| **Orphan Fields** | TypeScript types exist without canonical definition | Auto-create entity + GRCD-11 violation | ✅ |
| **Unanchored Tier1/2** | High-governance fields lack regulatory backing | GRCD-12 enforcement (lite/governed mode) | ✅ |
| **Schema Drift** | Generated types diverge from database | Violation detection + HITL remediation | ✅ |
| **Manual SQL** | Raw SQL for metadata = audit gaps | BFF + typed API routes with telemetry | ✅ |
| **Naming Chaos** | Inconsistent field names across systems | `mdm_metadata_mapping` + validation | ✅ |

### 1.4 Target Audience

| Persona | Role | Primary Use |
|---------|------|-------------|
| **Canon Architect** | `kernel_architect` | Define entities, Tier1 fields, standard packs |
| **Data Steward** | `metadata_steward` | Register fields, approve mappings, remediate violations |
| **Integration Admin** | `integration_admin` | Map external system fields to canonical keys |
| **Business Admin** | `business_admin` | Register Tier3+ operational fields |
| **AI Orchestras** | `agent` | Query metadata, propose changes (Tier 0-2 autonomy) |

---

## 2. 🧠 Core Domain: The Four Tables

The Metadata Studio governs four core tables that form the **Metadata & Canon Molecule** in the Principle Hexagon:

### 2.1 `mdm_standard_pack` — The Regulatory Anchor

**Purpose:** Global registry of standards (MFRS, IFRS, SOC2, GDPR) that anchor Tier1/Tier2 fields.

| Column | Type | Description |
|--------|------|-------------|
| `pack_id` | TEXT | Unique identifier (e.g., `MFRS_15`) |
| `pack_name` | TEXT | Human-readable name |
| `version` | TEXT | Standard version (semver) |
| `category` | TEXT | Domain: `finance`, `security`, `privacy`, `operations`, `kernel` |
| `tier` | TEXT | Which governance tier this pack covers |
| `standard_body` | TEXT | Issuing body (IASB, AICPA, EU, AI-BOS) |
| `is_primary` | BOOLEAN | Primary SoT for its category |
| `status` | TEXT | `active`, `deprecated`, `draft` |

**Key Insight:** Standard packs are **global** (not per-tenant). They represent external regulatory requirements.

**Seeded Packs:**
- **Finance:** MFRS_101, MFRS_15, MFRS_16, MFRS_9, MFRS_2, MFRS15_REVENUE, IFRS_OTHER_*
- **Security:** KERNEL_ID_CORE, SOC2_IAM, SOC2_AUDIT, SOC2_ENCRYPTION, ISO27001_RISK
- **Privacy:** GDPR_PII, PDPA_MY
- **Kernel:** KERNEL_TENANT, KERNEL_USER, KERNEL_SESSION, KERNEL_ROLE, KERNEL_AUDIT, KERNEL_EVENT

---

### 2.2 `mdm_entity_catalog` — The Entity Registry

**Purpose:** Catalog of all entities (tables, views, APIs, screens) that fields belong to.

| Column | Type | Description |
|--------|------|-------------|
| `tenant_id` | UUID | Multi-tenant isolation |
| `entity_urn` | TEXT | Unique entity URN (e.g., `finance.gl.journal_entries`) |
| `entity_name` | TEXT | Human-readable name |
| `entity_type` | TEXT | `table`, `view`, `api`, `screen`, `report`, `kpi` |
| `domain` | TEXT | Business domain (kernel, finance, hr, operations) |
| `module` | TEXT | Module within domain (iam, gl, ap) |
| `criticality` | TEXT | `critical`, `high`, `medium`, `low` |
| `lifecycle_status` | TEXT | `draft`, `active`, `deprecated` |

**GRCD Rule:** No field can be registered without a corresponding entity in this catalog.

---

### 2.3 `mdm_global_metadata` — The Field Registry

**Purpose:** Canonical definition of every field/concept/KPI in the system.

> ⚠️ **For full column specification, see [CONT_06_SCHEMA_SPEC.md](../../A-Governance/A-CONT/CONT_06_SCHEMA_SPEC.md) Section 1.1**

| Column | Type | Description |
|--------|------|-------------|
| `tenant_id` | UUID | Multi-tenant isolation |
| `canonical_key` | TEXT | **Fully-qualified field URN** (e.g., `finance.journal_entries.amount`) |
| `label` | TEXT | Human-readable label |
| `description` | TEXT | Full definition |
| `domain` | TEXT | Business domain |
| `module` | TEXT | Module within domain |
| `entity_urn` | TEXT | FK to `mdm_entity_catalog.entity_urn` |
| `tier` | TEXT | `tier1`-`tier5` governance tier |
| `standard_pack_id` | TEXT | FK to `mdm_standard_pack.pack_id` (required for Tier1/2) |
| `data_type` | TEXT | `string`, `integer`, `decimal`, `boolean`, `date`, `datetime`, `json`, `uuid` |
| `format` | TEXT | Format specification (e.g., `18,2` for decimal) |
| `owner_id` | TEXT | Field owner (e.g., CFO) |
| `steward_id` | TEXT | Data steward responsible |
| `status` | TEXT | `active`, `deprecated`, `draft` |
| `is_draft` | BOOLEAN | Draft mode flag |

**Key Clarification: `canonical_key` Format**

```
canonical_key = {entity_urn}.{field_name}

Examples:
- kernel.tenants.id
- finance.journal_entries.amount
- finance.accounts.account_code
```

The `canonical_key` is the **fully-qualified path**, not just the field name. This ensures:
1. Global uniqueness across all entities
2. Lineage tracking across entity boundaries
3. Self-documenting references in code and logs

See [REF_METADATA_GLOSSARY.md](../E-REF/REF_METADATA_GLOSSARY.md) for complete term definitions.

**GRCD Rules:**
- **GRCD-10:** `UNIQUE(tenant_id, canonical_key)`
- **GRCD-11:** `entity_urn MUST exist in mdm_entity_catalog`
- **GRCD-12:** `tier IN (tier1, tier2) → standard_pack_id IS NOT NULL`
- **GRCD-13:** `canonical_key` format: `{entity_urn}.{field_name}`, max 128 chars
- **GRCD-14:** `standard_pack_id MUST exist in mdm_standard_pack.pack_id`

---

### 2.4 `mdm_metadata_mapping` — The Translation Layer

**Purpose:** Maps local system fields (SAP, Oracle, Excel) to canonical keys.

| Column | Type | Description |
|--------|------|-------------|
| `tenant_id` | UUID | Multi-tenant isolation |
| `local_system` | TEXT | Source system (e.g., `SAP_ERP_PROD`) |
| `local_entity` | TEXT | Source entity/table (e.g., `BSEG`) |
| `local_field` | TEXT | Source field name (e.g., `DMBTR`) |
| `canonical_key` | TEXT | FK to `mdm_global_metadata.canonical_key` |
| `mapping_source` | TEXT | `manual`, `ai-suggested`, `rule-based` |
| `approval_status` | TEXT | `pending`, `approved`, `rejected` |
| `confidence_score` | DECIMAL | AI confidence (0.00-1.00) |

**GRCD Rules:**
- **GRCD-30:** `UNIQUE(tenant_id, local_system, local_entity, local_field)`
- **GRCD-31:** `canonical_key MUST exist in mdm_global_metadata`
- **GRCD-32:** AI suggestions require HITL approval

---

## 3. 🏗️ Governance Tiers

| Tier | Name | Standard Pack | Approval | Examples |
|------|------|---------------|----------|----------|
| **Tier 1** | Regulatory/Statutory | Required | `kernel_architect` | Revenue (MFRS 15), tenant_id (KERNEL_ID_CORE) |
| **Tier 2** | Compliance/Audit | Required | `metadata_steward` | User credentials (SOC2_IAM), PII fields (GDPR_PII) |
| **Tier 3** | Business Critical | Optional | Immediate for steward | Cost centers, GL accounts |
| **Tier 4** | Operational | N/A | Immediate for steward | Inventory counts, timestamps |
| **Tier 5** | Derived/Optional | N/A | Immediate | Calculated fields, preferences |

**Key Insight:** Tier determines:
1. Whether `standard_pack_id` is required
2. Who must approve changes
3. Whether Lite Mode or Governed Mode applies

---

## 3.1 🚀 Lite Mode vs Governed Mode

To balance governance rigor with developer velocity, Metadata Studio operates in two modes:

| Aspect | ⚡ Lite Mode | 🏛️ Governed Mode |
|--------|-------------|------------------|
| **Target Tiers** | Tier3, Tier4, Tier5 | Tier1, Tier2 |
| **Target Users** | Developers, AI Orchestras | Architects, Stewards |
| **Approval** | Auto-approve | HITL required |
| **Standard Pack** | Optional | **Required** |
| **Speed** | Fast (< 200ms) | Slower (approval workflow) |
| **Audit Depth** | Basic logging | Full change history with diff |

### Lite Mode Use Cases
- Adding operational fields for app development
- Quick prototyping and iteration
- AI Orchestra suggestions (Tier 0-1 autonomy)
- Fields not subject to regulatory reporting

### Governed Mode Use Cases
- Core identity fields (tenant_id, user_id)
- Financial reporting (revenue, cost, GL accounts)
- Compliance-sensitive (PII, audit logs)
- Any field touching MFRS/IFRS/SOC2/GDPR

### Lite Metadata View

A flattened view provides developer-friendly access:

```sql
SELECT * FROM vw_mdm_lite_metadata
WHERE domain = 'sales'
ORDER BY entity_urn, field_name;
```

See [METADATA_LITE_MODE_GUIDE.md](/docs/guides/METADATA_LITE_MODE_GUIDE.md) for full documentation.

### Tier Promotion

Fields can be promoted from Lite to Governed when requirements change:

```
Tier4 (Lite) → Tier2 (Governed) + SOC2_AUDIT
```

This triggers an approval request and requires standard pack anchoring
3. How quickly changes can be applied
4. Audit depth and retention

---

## 4. 🔷 Atomic Cells (6-Face Template)

Each operation in Metadata Studio is an **Atomic Cell** with six faces:

| Face | Position | Purpose |
|------|----------|---------|
| **Contract** | Top | Input/output types, SLAs |
| **Rules** | Upper-Right | Validation, GRCD enforcement |
| **Data** | Lower-Right | Target tables, queries |
| **Interfaces** | Bottom | REST endpoints, events |
| **Controls** | Lower-Left | Roles, approval workflows |
| **Telemetry** | Upper-Left | Metrics, logs, audit |

### 4.1 Cell Registry

| Cell ID | Name | Purpose | Target Table |
|---------|------|---------|--------------|
| `CELL_MDM_ENT_REG` | EntityRegisterCell | Register entities | `mdm_entity_catalog` |
| `CELL_MDM_FLD_REG` | FieldRegisterCell | Register fields with GRCD | `mdm_global_metadata` |
| `CELL_MDM_PACK_REG` | StandardPackRegisterCell | Register standard packs | `mdm_standard_pack` |
| `CELL_MDM_MAP_FLD` | FieldMappingCell | Map local → canonical | `mdm_metadata_mapping` |
| `CELL_MDM_TYPE_GEN` | TypeGenerationCell | Generate TS + Zod | File system |
| `CELL_MDM_SCAN` | MetadataScanCell | Scan for violations | Read-only |
| `CELL_MDM_PROPOSE` | RemediationProposalCell | Propose fixes | `mdm_remediation_proposal` |
| `CELL_MDM_APPLY` | RemediationApplyCell | Apply remediations | Multiple tables |

### 4.2 Cell Implementation Status

| Cell | Contract | Rules | Data | Interfaces | Controls | Telemetry | Status |
|------|----------|-------|------|------------|----------|-----------|--------|
| EntityRegisterCell | ✅ | ✅ | ✅ | ⏳ | ✅ | ⏳ | 🔄 80% |
| FieldRegisterCell | ✅ | ✅ | ✅ | ⏳ | ✅ | ⏳ | 🔄 80% |
| StandardPackRegisterCell | ✅ | ✅ | ✅ | ⏳ | ✅ | ⏳ | 🔄 80% |
| FieldMappingCell | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | 🔄 20% |
| TypeGenerationCell | ✅ | ✅ | ✅ | ⏳ | ✅ | ⏳ | 🔄 80% |
| MetadataScanCell | ✅ | ✅ | ✅ | ⏳ | ✅ | ⏳ | 🔄 80% |
| RemediationProposalCell | ✅ | ✅ | ✅ | ⏳ | ✅ | ⏳ | 🔄 80% |
| RemediationApplyCell | ✅ | ✅ | ✅ | ⏳ | ✅ | ⏳ | 🔄 80% |

---

## 5. 🔄 Process Flows

### 5.1 Flow: Metadata Onboarding → Types

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 1: EntityRegisterCell                                                 │
│  → Define entity in mdm_entity_catalog                                      │
│  → Validate: entity_urn format, domain exists                               │
│  → Event: metadata.entity.registered                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 2: FieldRegisterCell                                                  │
│  → Define fields in mdm_global_metadata                                     │
│  → Validate: entity exists, tier rules, canonical_key format                │
│  → HITL Gate: Tier1/2 require approval                                      │
│  → Event: metadata.field.registered                                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 3: FieldMappingCell (Optional)                                        │
│  → Map local system fields → canonical keys                                 │
│  → AI suggestions require HITL approval                                     │
│  → Event: metadata.mapping.created                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 4: TypeGenerationCell                                                 │
│  → Query metadata, generate TypeScript + Zod                                │
│  → Output: packages/kernel-core/src/db/generated/types.ts                   │
│  → Validate: tsc --noEmit                                                   │
│  → Event: metadata.types.generated                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 5: Consumption                                                        │
│  → import { JournalEntriesRow } from '@aibos/kernel-core/db/generated'      │
│  → Zod schemas: JournalEntriesSchema.parse(data)                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Flow: Metadata Remediation & Hardening

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 1: MetadataScanCell                                                   │
│  → Scan mdm_global_metadata for GRCD violations                             │
│  → Violations: GRCD-12 (missing pack), GRCD-11 (orphan entity)              │
│  → Output: ViolationReport[] stored in mdm_violation_report                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 2: RemediationProposalCell                                            │
│  → For each violation, propose remediation                                  │
│  → Heuristics: finance → MFRS_*, kernel → KERNEL_*, security → SOC2_*       │
│  → Output: RemediationProposal[] in mdm_remediation_proposal                │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 3: HITL Review (Retool/Admin UI)                                      │
│  → Steward reviews proposals                                                │
│  → Approve, Reject, or Modify                                               │
│  → Approved proposals → status: 'approved'                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 4: RemediationApplyCell                                               │
│  → Apply approved proposals with full audit trail                           │
│  → Update target tables (mdm_global_metadata, mdm_entity_catalog)           │
│  → Event: metadata.remediation.applied                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. 🔌 API Contract

### 6.1 Entity Endpoints

| Endpoint | Method | Cell | Description |
|----------|--------|------|-------------|
| `/api/metadata-studio/entities` | POST | EntityRegisterCell | Create/update entity |
| `/api/metadata-studio/entities` | GET | - | List entities (with filters) |
| `/api/metadata-studio/entities/:urn` | GET | - | Get entity by URN |

### 6.2 Field Endpoints

| Endpoint | Method | Cell | Description |
|----------|--------|------|-------------|
| `/api/metadata-studio/fields` | POST | FieldRegisterCell | Create/update field |
| `/api/metadata-studio/fields` | GET | - | List fields (with filters) |
| `/api/metadata-studio/fields/:key` | GET | - | Get field by canonical_key |
| `/api/metadata-studio/fields/search` | GET | - | Search fields by term |

### 6.3 Standard Pack Endpoints

| Endpoint | Method | Cell | Description |
|----------|--------|------|-------------|
| `/api/metadata-studio/standard-packs` | POST | StandardPackRegisterCell | Create/update pack |
| `/api/metadata-studio/standard-packs` | GET | - | List all packs |
| `/api/metadata-studio/standard-packs/:id` | GET | - | Get pack by pack_id |

### 6.4 Mapping Endpoints

| Endpoint | Method | Cell | Description |
|----------|--------|------|-------------|
| `/api/metadata-studio/mappings` | POST | FieldMappingCell | Create mapping |
| `/api/metadata-studio/mappings/lookup` | GET | - | Lookup by local field |
| `/api/metadata-studio/mappings/suggest` | POST | - | AI-suggest mappings |

### 6.5 Type Generation Endpoints

| Endpoint | Method | Cell | Description |
|----------|--------|------|-------------|
| `/api/metadata-studio/generate-types` | POST | TypeGenerationCell | Generate TS + Zod |
| `/api/metadata-studio/types/status` | GET | - | Get last generation status |

### 6.6 Remediation Endpoints

| Endpoint | Method | Cell | Description |
|----------|--------|------|-------------|
| `/api/metadata-studio/scan` | POST | MetadataScanCell | Run GRCD scan |
| `/api/metadata-studio/scan/history` | GET | - | Get scan history |
| `/api/metadata-studio/violations` | GET | - | List open violations |
| `/api/metadata-studio/proposals` | GET | - | List pending proposals |
| `/api/metadata-studio/proposals/:id/approve` | POST | - | Approve proposal |
| `/api/metadata-studio/proposals/:id/reject` | POST | - | Reject proposal |
| `/api/metadata-studio/remediate` | POST | RemediationApplyCell | Apply approved proposals |

---

## 7. 🛡️ Security & Controls

### 7.1 Role-Based Access Control

| Role | Entities | Fields | Standard Packs | Mappings | Remediation |
|------|----------|--------|----------------|----------|-------------|
| `kernel_architect` | CRUD | CRUD (all tiers) | CRUD | View | CRUD |
| `metadata_steward` | CRUD | CRUD (tier2+) | View | CRUD | CRUD (tier2+) |
| `business_admin` | View | CRUD (tier3+) | View | View | View |
| `integration_admin` | View | View | View | CRUD | View |
| `user` | View | View | View | View | View |

### 7.2 Approval Matrix

| Operation | Tier 1 | Tier 2 | Tier 3+ |
|-----------|--------|--------|---------|
| Create Field | `kernel_architect` approval | `metadata_steward` approval | Immediate (steward) |
| Update Field | `kernel_architect` approval | `metadata_steward` approval | Immediate (steward) |
| Delete Field | `kernel_architect` approval | `metadata_steward` approval | Immediate (steward) |
| Apply Remediation | `kernel_architect` only | `metadata_steward` | `metadata_steward` |

### 7.3 Row-Level Security

```sql
-- All MDM tables (except mdm_standard_pack) have RLS
ALTER TABLE mdm_global_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdm_entity_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdm_metadata_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdm_violation_report ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdm_remediation_proposal ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy
CREATE POLICY tenant_isolation ON mdm_global_metadata
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

---

## 8. 📊 Telemetry & Risk Dashboard

### 8.1 Key Metrics

| Metric | Query | Alert Threshold |
|--------|-------|-----------------|
| **Orphan Fields** | `entity_urn NOT IN (SELECT entity_urn FROM mdm_entity_catalog)` | > 0 |
| **Unanchored Tier1/2** | `tier IN ('tier1','tier2') AND standard_pack_id IS NULL` | > 0 |
| **Draft in Production** | `is_draft = true AND status = 'active'` | > 5 |
| **Pending Proposals** | `status = 'pending'` in mdm_remediation_proposal | > 10 |
| **Schema Drift** | Hash(generated types) ≠ Hash(committed types) | mismatch |
| **Scan Coverage** | Last scan > 7 days ago | alert |

### 8.2 Audit Events

| Event | Payload | Retention |
|-------|---------|-----------|
| `metadata.entity.registered` | entity_urn, action, actor_id | 7 years |
| `metadata.field.registered` | canonical_key, tier, action, actor_id | 7 years |
| `metadata.field.approval_requested` | canonical_key, tier, requested_by | 7 years |
| `metadata.field.approved` | canonical_key, approved_by | 7 years |
| `metadata.mapping.created` | mapping details, confidence_score | 7 years |
| `metadata.scan.completed` | scan_id, violations_found | 2 years |
| `metadata.remediation.applied` | proposal_id, applied_by | 7 years |
| `metadata.types.generated` | entity_count, field_count, duration | 1 year |

---

## 9. 🗂️ Directory Structure

```
apps/kernel/src/metadata-studio/
├── cells/                           # Atomic Cells (6-face)
│   ├── index.ts
│   ├── types.ts                     # Cell types (CellMeta, CellContext, CellResult)
│   ├── entity-register.cell.ts     # CELL_MDM_ENT_REG
│   ├── field-register.cell.ts      # CELL_MDM_FLD_REG
│   ├── standard-pack-register.cell.ts # CELL_MDM_PACK_REG
│   ├── field-mapping.cell.ts       # CELL_MDM_MAP_FLD
│   ├── type-generation.cell.ts     # CELL_MDM_TYPE_GEN
│   ├── metadata-scan.cell.ts       # CELL_MDM_SCAN
│   ├── remediation-proposal.cell.ts # CELL_MDM_PROPOSE
│   └── remediation-apply.cell.ts   # CELL_MDM_APPLY
├── db/
│   ├── client.ts                    # Drizzle client
│   ├── schema/
│   │   ├── index.ts
│   │   ├── standard-pack.tables.ts  # mdm_standard_pack
│   │   ├── entity-catalog.tables.ts # mdm_entity_catalog
│   │   ├── metadata.tables.ts       # mdm_global_metadata
│   │   ├── metadata-mapping.tables.ts # mdm_metadata_mapping
│   │   └── remediation.tables.ts    # mdm_violation_report, mdm_remediation_proposal
│   └── migrations/
├── seed/
│   ├── standard-packs/
│   │   ├── finance-ifrs-core.csv   # MFRS, IFRS packs
│   │   └── kernel-identity.csv     # KERNEL_* packs
│   ├── concepts/
│   │   └── finance-core.csv        # Initial concepts
│   ├── aliases/
│   │   └── finance-aliases.csv
│   └── load-metadata.ts            # Bootstrap script
├── services/
│   ├── metadata.service.ts         # Field CRUD with GRCD
│   ├── approval.service.ts         # Approval workflow
│   ├── compliance.service.ts       # Compliance checks
│   └── remediation.service.ts      # Scan, propose, apply
├── api/
│   ├── metadata.routes.ts
│   ├── entity.routes.ts
│   ├── mapping.routes.ts
│   ├── standard-pack.routes.ts
│   └── remediation.routes.ts
├── events/
│   └── event-bus.ts
└── middleware/
    └── auth.middleware.ts
```

---

## 10. 🚀 Implementation Roadmap

### Phase 1: Foundation (✅ Complete)
- [x] Core tables: `mdm_standard_pack`, `mdm_entity_catalog`, `mdm_global_metadata`, `mdm_metadata_mapping`
- [x] Drizzle schema definitions
- [x] Basic services: metadata.service.ts, approval.service.ts
- [x] Seed data loaders

### Phase 2: Standard Packs & GRCD (✅ Complete)
- [x] Extend standard packs with MFRS, SOC2, GDPR, PDPA, KERNEL packs
- [x] Implement GRCD enforcement in services
- [x] Create remediation tables (violation_report, remediation_proposal, scan_history)
- [x] Implement remediation.service.ts

### Phase 3: Atomic Cells (✅ Complete)
- [x] Define 6-face template structure
- [x] Implement EntityRegisterCell
- [x] Implement FieldRegisterCell
- [x] Implement StandardPackRegisterCell
- [x] Implement TypeGenerationCell
- [x] Implement MetadataScanCell, RemediationProposalCell, RemediationApplyCell

### Phase 4: API Layer (🔄 In Progress)
- [ ] Create remediation.routes.ts
- [ ] Wire cells to REST endpoints
- [ ] Add OpenAPI documentation
- [ ] Implement rate limiting

### Phase 5: UI/Admin (⏳ Pending)
- [ ] Retool dashboard for entity/field management
- [ ] Remediation workflow UI (HITL approval)
- [ ] Scan results visualization
- [ ] Telemetry dashboard

### Phase 6: Integration (⏳ Pending)
- [ ] CI/CD integration for type generation
- [ ] AI Orchestra integration (MCP tools)
- [ ] Event bus integration (Redis)
- [ ] Lineage tracking integration

---

## 11. 🔗 Dependencies & Integration Points

### 11.1 Kernel Hexagon
- **Policy Engine:** RBAC enforcement for all cells
- **Event Bus:** All cells emit events
- **Audit Trail:** All changes logged

### 11.2 Process Hexagon
- **Onboarding Flow:** Entity → Field → Mapping → Types
- **Remediation Flow:** Scan → Propose → Review → Apply

### 11.3 Principle Hexagon
- **Standard Packs:** Regulatory anchors
- **GRCD Rules:** Enforcement points in cells

### 11.4 External Systems
- **Supabase:** Database hosting
- **Retool:** Admin UI
- **GitHub Actions:** CI/CD for type generation

---

## 12. ✅ Success Criteria

### 12.1 Functional Requirements

| Requirement | Validation |
|-------------|------------|
| No Tier1/2 field without standard_pack_id | MetadataScanCell returns 0 GRCD-12 violations |
| No orphan fields | MetadataScanCell returns 0 GRCD-11 violations |
| Type generation works | `pnpm metadata:generate-types` produces valid TS |
| HITL works | Tier1 field creation triggers approval request |
| Remediation works | Violation → Proposal → Apply cycle completes |

### 12.2 Performance Requirements

| Metric | Target |
|--------|--------|
| Field registration | < 200ms |
| Type generation | < 5s for 500 fields |
| Scan execution | < 10s for 1000 fields |
| API response time | < 100ms (p95) |

### 12.3 Security Requirements

| Requirement | Validation |
|-------------|------------|
| Tenant isolation | RLS enabled, tested |
| Role enforcement | Unauthorized requests rejected |
| Audit trail | All changes logged with actor |

---

## 13. 📚 References

### 13.1 Related Documents

| Document | Location | Purpose |
|----------|----------|---------|
| CONT_06 | `packages/canon/A-Governance/A-CONT/CONT_06_SchemaAndTypeGovernance.md` | Main governance contract |
| CONT_06_SCHEMA_SPEC | `packages/canon/A-Governance/A-CONT/CONT_06_SCHEMA_SPEC.md` | Database schema spec |
| CONT_06_HEXAGON_MAPPING | `packages/canon/A-Governance/A-CONT/CONT_06_HEXAGON_MAPPING.md` | Hexagonal mapping |
| PRD_KERNEL_01 | `packages/canon/E-Knowledge/E-SPEC/PRD_KERNEL_01_AIBOS_KERNEL.md` | Parent kernel PRD |

### 13.2 Technical References

| Reference | URL |
|-----------|-----|
| Drizzle ORM | https://orm.drizzle.team |
| Zod | https://zod.dev |
| Hono | https://hono.dev |

---

## 14. 📋 Appendix

### A. GRCD Rules Reference

| Rule | Description | Enforcement Cell |
|------|-------------|------------------|
| GRCD-01 | No entity without catalog entry | EntityRegisterCell |
| GRCD-10 | UNIQUE(tenant_id, canonical_key) | FieldRegisterCell |
| GRCD-11 | entity_urn MUST exist in catalog | FieldRegisterCell |
| GRCD-12 | Tier1/2 MUST have standard_pack_id | FieldRegisterCell, MetadataScanCell |
| GRCD-13 | canonical_key snake_case, max 64 chars | FieldRegisterCell |
| GRCD-14 | standard_pack_id MUST exist | FieldRegisterCell |
| GRCD-20 | UNIQUE(pack_id) globally | StandardPackRegisterCell |
| GRCD-21 | Valid category | StandardPackRegisterCell |
| GRCD-22 | Valid tier | StandardPackRegisterCell |
| GRCD-23 | Recognized standard_body | StandardPackRegisterCell |
| GRCD-30 | UNIQUE(tenant, system, entity, field) | FieldMappingCell |
| GRCD-31 | canonical_key MUST exist | FieldMappingCell |
| GRCD-32 | AI suggestions require HITL | FieldMappingCell |

### B. Violation Codes

| Code | Severity | Description |
|------|----------|-------------|
| GRCD-12-VIOLATION | Critical | Tier1/2 missing standard_pack_id |
| GRCD-11-VIOLATION | High | entity_urn not in catalog |
| GRCD-14-VIOLATION | High | standard_pack_id not found |
| NAMING-VIOLATION | Medium | canonical_key format invalid |
| ORPHAN-ALIAS | Low | Alias points to non-existent key |

### C. Standard Pack Categories

| Category | Packs | Standard Bodies |
|----------|-------|-----------------|
| finance | MFRS_*, IFRS_* | MFRS/IASB, IASB |
| security | SOC2_*, ISO27001_*, KERNEL_* | AICPA, ISO, AI-BOS |
| privacy | GDPR_*, PDPA_* | EU, JPDP |
| kernel | KERNEL_* | AI-BOS |
| operations | AIBOS_* | AI-BOS |

---

**Status:** 🔄 **IN DEVELOPMENT**

**Next Actions:**
1. Run `pnpm metadata:bootstrap` to seed standard packs
2. Create `remediation.routes.ts` API endpoints
3. Build Retool admin UI for HITL approval

---

*This PRD is part of the Canon Governance System. See `CONT_01_CanonIdentity.md` for governance rules.*
