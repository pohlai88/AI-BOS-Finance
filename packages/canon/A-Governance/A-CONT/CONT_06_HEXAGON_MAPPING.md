# CONT_06 Hexagonal Mapping

> **Metadata & Canon Molecule** — Atomic Cells and Process Flows  
> This document maps CONT_06 to the Hexagonal Molecularity Model.

---

## 1. Principle Hexagon → Metadata & Canon Molecule

The four core tables from CONT_06 form the **Metadata & Canon Molecule** in the Principle Layer:

| Table | Purpose | Cell | Standard Packs |
|-------|---------|------|----------------|
| `mdm_global_metadata` | Field/Concept Registry | `FieldRegisterCell` | MFRS-*, IFRS-*, KERNEL-* |
| `mdm_entity_catalog` | Entity Registry | `EntityRegisterCell` | — |
| `mdm_metadata_mapping` | Local→Canonical Mapping | `FieldMappingCell` | — |
| `mdm_standard_pack` | Standards (IFRS, SOC2) | `StandardPackRegisterCell` | — |

### 1.1 Standard Packs (Principle-Level SoT)

| Pack ID | Name | Category | Tier | Standard Body |
|---------|------|----------|------|---------------|
| `KERNEL_ID_CORE` | Kernel Identity Core | security | tier1 | AI-BOS |
| `MFRS_101` | Presentation of Financial Statements | finance | tier1 | MFRS/IASB |
| `MFRS_15` | Revenue from Contracts with Customers | finance | tier1 | MFRS/IASB |
| `MFRS_16` | Leases | finance | tier1 | MFRS/IASB |
| `MFRS_9` | Financial Instruments | finance | tier1 | MFRS/IASB |
| `SOC2_IAM` | Identity & Access Management | security | tier1 | AICPA |
| `SOC2_AUDIT` | Logging & Monitoring | security | tier1 | AICPA |
| `GDPR_PII` | Personal Data Protection | privacy | tier1 | EU |
| `PDPA_MY` | Malaysia PDPA | privacy | tier1 | JPDP |

These packs anchor **Tier1/Tier2** fields legally. Without a `standard_pack_id`, high-tier fields violate GRCD rules.

---

## 2. Atomic Cells (6-Face Template)

Each Atomic Cell follows the **6-Face Template** from the Hexagonal Molecularity Model:

| Face | Hex Position | Purpose |
|------|--------------|---------|
| **Contract** | Top | What this cell promises (inputs, outputs, SLAs) |
| **Rules** | Upper-Right | Validation, business rules, GRCD enforcement |
| **Data** | Lower-Right | Target table(s), query patterns |
| **Interfaces** | Bottom | API endpoints, events, signals |
| **Controls** | Lower-Left | Who can invoke, required roles, approval workflow |
| **Telemetry** | Upper-Left | Metrics, logs, audit trail |

---

### 2.1 `EntityRegisterCell`

> **CELL_MDM_ENT_REG** — Register entities into `mdm_entity_catalog`

#### Contract (Top Face)
| Aspect | Definition |
|--------|------------|
| **Input** | `{ tenantId, entityUrn, entityName, entityType, domain, module, criticality?, description? }` |
| **Output** | `{ id, entityUrn, status: 'created' | 'updated' }` |
| **SLA** | Response < 200ms, consistency: strong |

#### Rules (Upper-Right Face)
| Rule | Enforcement |
|------|-------------|
| **GRCD-01** | `UNIQUE(tenant_id, entity_urn)` — One entity per URN per tenant |
| **GRCD-02** | `entity_type IN ('table', 'view', 'api', 'screen', 'report', 'kpi')` |
| **GRCD-03** | `domain` must be registered domain (kernel, finance, hr, etc.) |
| **Format** | `entity_urn` format: `<domain>.<module>.<entity_name>` (snake_case) |

#### Data (Lower-Right Face)
| Target | Query |
|--------|-------|
| **Table** | `mdm_entity_catalog` |
| **Insert** | `INSERT INTO mdm_entity_catalog (tenant_id, entity_urn, ...) VALUES (...)` |
| **Upsert** | `ON CONFLICT (tenant_id, entity_urn) DO UPDATE SET ...` |

#### Interfaces (Bottom Face)
| Type | Endpoint/Topic |
|------|----------------|
| **REST** | `POST /api/metadata-studio/entities` |
| **Event Out** | `metadata.entity.registered` → EventBus |
| **Event Payload** | `{ tenantId, entityUrn, entityType, action: 'create' | 'update' }` |

#### Controls (Lower-Left Face)
| Aspect | Requirement |
|--------|-------------|
| **Roles** | `kernel_architect`, `metadata_steward` |
| **Approval** | None for create; major changes require `metadata_steward` approval |
| **Rate Limit** | 100 req/min per tenant |

#### Telemetry (Upper-Left Face)
| Metric | Description |
|--------|-------------|
| **Counter** | `mdm.entity.registered.total` (labels: tenant, domain, action) |
| **Audit** | `created_by`, `updated_by`, `created_at`, `updated_at` |
| **Log** | `info: Entity registered | entityUrn=finance.gl.journal_entries` |

---

### 2.2 `FieldRegisterCell`

> **CELL_MDM_FLD_REG** — Register fields into `mdm_global_metadata`

#### Contract (Top Face)
| Aspect | Definition |
|--------|------------|
| **Input** | `{ tenantId, canonicalKey, entityUrn, label, dataType, tier, standardPackId?, description? }` |
| **Output** | `{ id, canonicalKey, status: 'created' | 'updated' | 'pending_approval' }` |
| **SLA** | Response < 200ms for tier3+; tier1/2 may require HITL approval |

#### Rules (Upper-Right Face)
| Rule | Enforcement |
|------|-------------|
| **GRCD-10** | `UNIQUE(tenant_id, canonical_key)` — One field per key per tenant |
| **GRCD-11** | `entity_urn EXISTS IN mdm_entity_catalog` — No orphan fields |
| **GRCD-12** | `tier IN ('tier1', 'tier2') → standard_pack_id IS NOT NULL` |
| **GRCD-13** | `canonical_key` format: `snake_case`, max 64 chars |
| **GRCD-14** | `standard_pack_id EXISTS IN mdm_standard_pack.pack_id` |

#### Data (Lower-Right Face)
| Target | Query |
|--------|-------|
| **Table** | `mdm_global_metadata` |
| **FK Check** | `SELECT 1 FROM mdm_entity_catalog WHERE tenant_id = ? AND entity_urn = ?` |
| **Upsert** | `ON CONFLICT (tenant_id, canonical_key) DO UPDATE SET ...` |

#### Interfaces (Bottom Face)
| Type | Endpoint/Topic |
|------|----------------|
| **REST** | `POST /api/metadata-studio/fields` |
| **Event Out** | `metadata.field.registered` → EventBus |
| **Event Payload** | `{ tenantId, canonicalKey, tier, entityUrn, standardPackId }` |

#### Controls (Lower-Left Face)
| Aspect | Requirement |
|--------|-------------|
| **Roles** | `kernel_architect`, `metadata_steward`, `business_admin` (tier3+ only) |
| **Approval** | **Tier1**: `kernel_architect` approval required |
| | **Tier2**: `metadata_steward` approval required |
| | **Tier3+**: Immediate for steward/architect, approval for others |

#### Telemetry (Upper-Left Face)
| Metric | Description |
|--------|-------------|
| **Counter** | `mdm.field.registered.total` (labels: tenant, tier, domain) |
| **Gauge** | `mdm.field.pending_approval.count` |
| **Audit** | Full change history with diff |
| **Log** | `info: Field registered | canonicalKey=revenue_gross tier=tier1` |

---

### 2.3 `StandardPackRegisterCell`

> **CELL_MDM_PACK_REG** — Register standard packs into `mdm_standard_pack`

#### Contract (Top Face)
| Aspect | Definition |
|--------|------------|
| **Input** | `{ packId, packName, version, category, tier, standardBody, standardReference?, description? }` |
| **Output** | `{ id, packId, status: 'created' | 'updated' }` |
| **SLA** | Response < 200ms |

#### Rules (Upper-Right Face)
| Rule | Enforcement |
|------|-------------|
| **GRCD-20** | `UNIQUE(pack_id)` — Global uniqueness (not per-tenant) |
| **GRCD-21** | `category IN ('finance', 'security', 'privacy', 'operations', 'kernel')` |
| **GRCD-22** | `tier IN ('tier1', 'tier2', 'tier3')` |
| **GRCD-23** | `standard_body` is a recognized body (IASB, AICPA, ISO, EU, AI-BOS) |

#### Data (Lower-Right Face)
| Target | Query |
|--------|-------|
| **Table** | `mdm_standard_pack` (global, no tenant isolation) |
| **Upsert** | `ON CONFLICT (pack_id) DO UPDATE SET ...` |

#### Interfaces (Bottom Face)
| Type | Endpoint/Topic |
|------|----------------|
| **REST** | `POST /api/metadata-studio/standard-packs` |
| **Event Out** | `metadata.standard_pack.registered` → EventBus |
| **Batch** | CSV loader via `pnpm metadata:bootstrap` |

#### Controls (Lower-Left Face)
| Aspect | Requirement |
|--------|-------------|
| **Roles** | `kernel_architect` only |
| **Approval** | All changes require CFO/Compliance Officer sign-off for Tier1 packs |
| **Rate Limit** | 10 req/min (rare operation) |

#### Telemetry (Upper-Left Face)
| Metric | Description |
|--------|-------------|
| **Counter** | `mdm.standard_pack.registered.total` (labels: category, tier) |
| **Audit** | `created_by`, change diff |
| **Alert** | Notify `#compliance-channel` on Tier1 pack changes |

---

### 2.4 `FieldMappingCell`

> **CELL_MDM_MAP_FLD** — Map local system fields to canonical keys

#### Contract (Top Face)
| Aspect | Definition |
|--------|------------|
| **Input** | `{ tenantId, localSystem, localEntity, localField, canonicalKey, mappingSource? }` |
| **Output** | `{ id, mappingId, status: 'approved' | 'pending' | 'rejected' }` |
| **SLA** | Response < 300ms; AI-suggested mappings async |

#### Rules (Upper-Right Face)
| Rule | Enforcement |
|------|-------------|
| **GRCD-30** | `UNIQUE(tenant_id, local_system, local_entity, local_field)` |
| **GRCD-31** | `canonical_key EXISTS IN mdm_global_metadata.canonical_key` |
| **GRCD-32** | AI suggestions require HITL approval |

#### Data (Lower-Right Face)
| Target | Query |
|--------|-------|
| **Table** | `mdm_metadata_mapping` |
| **FK Check** | `SELECT 1 FROM mdm_global_metadata WHERE tenant_id = ? AND canonical_key = ?` |

#### Interfaces (Bottom Face)
| Type | Endpoint/Topic |
|------|----------------|
| **REST** | `POST /api/metadata-studio/mappings` |
| **Event Out** | `metadata.mapping.created`, `metadata.mapping.approved` |

#### Controls (Lower-Left Face)
| Aspect | Requirement |
|--------|-------------|
| **Roles** | `metadata_steward`, `integration_admin` |
| **Approval Workflow** | `manual` → auto-approved; `ai-suggested` → pending HITL |

#### Telemetry (Upper-Left Face)
| Metric | Description |
|--------|-------------|
| **Counter** | `mdm.mapping.created.total` (labels: source, tenant, system) |
| **Gauge** | `mdm.mapping.pending_approval.count` |
| **AI Metrics** | `mdm.mapping.ai_confidence.histogram` |

---

### 2.5 `TypeGenerationCell`

> **CELL_MDM_TYPE_GEN** — Generate TypeScript types and Zod schemas from metadata

#### Contract (Top Face)
| Aspect | Definition |
|--------|------------|
| **Input** | `{ tenantId, domainFilter?, outputPath? }` |
| **Output** | `{ filesGenerated: string[], entityCount, fieldCount }` |
| **SLA** | Generation < 5s for typical tenant (100 entities, 500 fields) |

#### Rules (Upper-Right Face)
| Rule | Enforcement |
|------|-------------|
| **GRCD-40** | Only `active` entities and fields are included |
| **GRCD-41** | Generated files must pass `tsc --noEmit` |
| **GRCD-42** | Zod schemas must `satisfies z.ZodType<T>` |

#### Data (Lower-Right Face)
| Source | Query |
|--------|-------|
| **Entities** | `SELECT * FROM mdm_entity_catalog WHERE tenant_id = ? AND lifecycle_status = 'active'` |
| **Fields** | `SELECT * FROM mdm_global_metadata WHERE tenant_id = ? AND status = 'active'` |
| **Output** | `packages/kernel-core/src/db/generated/types.ts` |

#### Interfaces (Bottom Face)
| Type | Endpoint/Topic |
|------|----------------|
| **CLI** | `pnpm metadata:generate-types` |
| **REST** | `POST /api/metadata-studio/generate-types` |
| **Event Out** | `metadata.types.generated` |

#### Controls (Lower-Left Face)
| Aspect | Requirement |
|--------|-------------|
| **Roles** | `kernel_architect`, `metadata_steward` |
| **Trigger** | Manual, or on `metadata.field.registered` (debounced) |

#### Telemetry (Upper-Left Face)
| Metric | Description |
|--------|-------------|
| **Timer** | `mdm.type_generation.duration_ms` |
| **Counter** | `mdm.type_generation.total` (labels: success, failure) |
| **Log** | `info: Types generated | entities=42 fields=187 duration=1234ms` |

---

## 3. Process Hexagon → Metadata Flows

### 3.1 Flow: Metadata Onboarding → Types

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
│  STEP 3: FieldMappingCell (Optional)                                        │
│  → Map local system fields → canonical keys                                 │
│  → Event: metadata.mapping.created                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 4: TypeGenerationCell                                                 │
│  → Query metadata, generate TS + Zod                                        │
│  → Output: packages/kernel-core/src/db/generated/                           │
│  → Event: metadata.types.generated                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 5: Consumption (Canon/Molecule/Cell)                                  │
│  → import { FinanceJournalEntriesTable } from '@aibos/kernel-core/db'       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 3.2 Flow: Metadata Remediation & Hardening

> **Purpose:** Bring existing data into GRCD compliance. Find violations, propose fixes, apply with audit.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 1: MetadataScanCell                                                   │
│  → Scan mdm_global_metadata for GRCD violations                             │
│  → Check: Tier1/2 missing standard_pack_id                                  │
│  → Check: entity_urn not in mdm_entity_catalog                              │
│  → Check: Orphan aliases, invalid formats                                   │
│  → Output: ViolationReport[]                                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 2: RemediationProposalCell                                            │
│  → For each violation, propose remediation                                  │
│  → Auto-assign standard_pack_id based on domain/tier heuristics             │
│  → Auto-create missing entity_catalog rows                                  │
│  → Output: RemediationProposal[] (status: pending)                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 3: RemediationApplyCell (HITL Gate)                                   │
│  → Steward reviews proposals                                                │
│  → Approve/Reject each proposal                                             │
│  → Apply approved changes with full audit trail                             │
│  → Event: metadata.remediation.applied                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 3.2.1 `MetadataScanCell`

> **CELL_MDM_SCAN** — Scan metadata for GRCD violations

| Face | Definition |
|------|------------|
| **Contract** | Input: `{ tenantId, scope?: string }` → Output: `{ violations: Violation[], summary }` |
| **Rules** | GRCD-12 (tier1/2 standard_pack), GRCD-11 (entity_urn FK), naming conventions |
| **Data** | Read-only scan of `mdm_global_metadata`, `mdm_entity_catalog`, `mdm_standard_pack` |
| **Interfaces** | `POST /api/metadata-studio/scan`, Event: `metadata.scan.completed` |
| **Controls** | Roles: `metadata_steward`, `kernel_architect` |
| **Telemetry** | `mdm.scan.violations.total`, `mdm.scan.duration_ms` |

**Violation Types:**
| Code | Description | Severity |
|------|-------------|----------|
| `GRCD-12-VIOLATION` | Tier1/Tier2 field missing standard_pack_id | Critical |
| `GRCD-11-VIOLATION` | entity_urn not found in mdm_entity_catalog | High |
| `NAMING-VIOLATION` | canonical_key format invalid | Medium |
| `ORPHAN-ALIAS` | Alias points to non-existent canonical_key | Low |

#### 3.2.2 `RemediationProposalCell`

> **CELL_MDM_PROPOSE** — Propose fixes for violations

| Face | Definition |
|------|------------|
| **Contract** | Input: `{ violations: Violation[] }` → Output: `{ proposals: Proposal[] }` |
| **Rules** | Heuristic assignment: finance domain → MFRS_*, kernel → KERNEL_*, security → SOC2_* |
| **Data** | Query `mdm_standard_pack` for matching packs, propose entity_catalog inserts |
| **Interfaces** | `POST /api/metadata-studio/propose-remediation` |
| **Controls** | Auto-generated proposals require steward approval |
| **Telemetry** | `mdm.proposal.created.total`, `mdm.proposal.auto_assigned.count` |

**Proposal Schema:**
```typescript
interface RemediationProposal {
  id: string;
  violationCode: string;
  targetTable: 'mdm_global_metadata' | 'mdm_entity_catalog';
  targetId: string;
  proposedChange: Record<string, unknown>;
  confidence: 'high' | 'medium' | 'low';
  status: 'pending' | 'approved' | 'rejected';
  proposedBy: string;
  proposedAt: Date;
}
```

#### 3.2.3 `RemediationApplyCell`

> **CELL_MDM_APPLY** — Apply approved remediation proposals

| Face | Definition |
|------|------------|
| **Contract** | Input: `{ proposalIds: string[], actorId }` → Output: `{ applied: number, failed: number }` |
| **Rules** | Only `approved` proposals can be applied; re-validate before apply |
| **Data** | UPDATE on target tables with full audit trail |
| **Interfaces** | `POST /api/metadata-studio/apply-remediation`, Event: `metadata.remediation.applied` |
| **Controls** | Roles: `metadata_steward` for tier3+, `kernel_architect` for tier1/2 |
| **Telemetry** | `mdm.remediation.applied.total`, `mdm.remediation.failed.total` |

---

### 3.3 Views

| View | Focus |
|------|-------|
| **Accounting/Domain** | Which business entity is being defined (journal_entries, accounts) |
| **AIS View** | Which tables & schemas are affected |
| **Compliance View** | Which standard_pack_id and tier rules apply |
| **Remediation View** | Outstanding violations, proposal status, remediation timeline |

---

## 4. Kernel Hexagon Integration

### 4.1 Cell & Flow Registry
- `mdm_entity_catalog` + `mdm_global_metadata` = Kernel-level SSOT for all schema
- All Atomic Cells registered in Kernel Cell Registry
- Process Flows defined as Cell orchestrations

### 4.2 Policy & Control Engine
Enforce GRCD rules:

| Rule | Description | Enforcement Point |
|------|-------------|-------------------|
| **GRCD-01** | No entity without catalog entry | `EntityRegisterCell` |
| **GRCD-10** | No field without canonical definition | `FieldRegisterCell` |
| **GRCD-11** | `entity_urn` must exist in catalog | `FieldRegisterCell` |
| **GRCD-12** | Tier1/Tier2 must have `standard_pack_id` | `FieldRegisterCell`, `MetadataScanCell` |
| **GRCD-20** | Standard packs globally unique | `StandardPackRegisterCell` |
| **GRCD-30** | Mappings reference valid `canonical_key` | `FieldMappingCell` |

### 4.3 RLS & Tenant Isolation
```sql
-- All MDM tables except mdm_standard_pack have RLS enabled
ALTER TABLE mdm_global_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdm_entity_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdm_metadata_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON mdm_global_metadata
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

### 4.4 Telemetry & Risk Dashboard

| Metric | Query | Alert Threshold |
|--------|-------|-----------------|
| **Orphan Fields** | `SELECT COUNT(*) FROM mdm_global_metadata WHERE entity_urn NOT IN (SELECT entity_urn FROM mdm_entity_catalog)` | > 0 |
| **Unanchored Tier1/2** | `SELECT COUNT(*) FROM mdm_global_metadata WHERE tier IN ('tier1','tier2') AND standard_pack_id IS NULL` | > 0 |
| **Draft in Production** | `SELECT COUNT(*) FROM mdm_global_metadata WHERE is_draft = true AND status = 'active'` | > 5 |
| **Pending Remediation** | `SELECT COUNT(*) FROM mdm_remediation_proposal WHERE status = 'pending'` | > 10 |
| **Schema Drift** | Compare generated types hash vs. committed hash | mismatch |

---

## 5. Directory Structure

```
apps/kernel/src/metadata-studio/
├── cells/                           # Atomic Cells
│   ├── entity-register.cell.ts      # CELL_MDM_ENT_REG
│   ├── field-register.cell.ts       # CELL_MDM_FLD_REG
│   ├── field-mapping.cell.ts        # CELL_MDM_MAP_FLD
│   ├── standard-pack-register.cell.ts # CELL_MDM_PACK_REG
│   ├── type-generation.cell.ts      # CELL_MDM_TYPE_GEN
│   ├── metadata-scan.cell.ts        # CELL_MDM_SCAN (Remediation)
│   ├── remediation-proposal.cell.ts # CELL_MDM_PROPOSE
│   └── remediation-apply.cell.ts    # CELL_MDM_APPLY
├── db/
│   └── schema/
│       ├── entity-catalog.tables.ts    # mdm_entity_catalog
│       ├── metadata.tables.ts          # mdm_global_metadata
│       ├── metadata-mapping.tables.ts  # mdm_metadata_mapping
│       ├── standard-pack.tables.ts     # mdm_standard_pack
│       └── remediation.tables.ts       # mdm_remediation_proposal (NEW)
├── seed/
│   ├── standard-packs/
│   │   ├── finance-ifrs-core.csv       # MFRS, IFRS packs
│   │   └── kernel-identity.csv         # KERNEL_* packs
│   ├── concepts/
│   │   └── finance-core.csv
│   └── load-metadata.ts                # Bootstrap script
├── api/                              # REST endpoints
│   ├── metadata.routes.ts
│   ├── entity.routes.ts
│   ├── mapping.routes.ts
│   ├── standard-pack.routes.ts
│   └── remediation.routes.ts          # NEW
├── services/                         # Business logic
│   ├── metadata.service.ts
│   ├── compliance.service.ts
│   └── remediation.service.ts         # NEW
└── events/                           # Event bus
    └── event-bus.ts
```

---

## 6. Implementation Roadmap

### Phase 1: Seed Standard Packs (Principle Hexagon) ✅
- [x] Extend `finance-ifrs-core.csv` with MFRS-101, MFRS-15, MFRS-16, MFRS-9, MFRS-2
- [x] Add `kernel-identity.csv` for KERNEL_* packs (tenant, user, session, role, audit, event)
- [x] Add SOC2 (IAM, AUDIT, ENCRYPTION), GDPR, PDPA, ISO27001 packs
- [x] Update `load-metadata.ts` to load all CSV files from standard-packs/
- [ ] Run `pnpm metadata:bootstrap` to seed database
- [ ] Verify packs: `SELECT * FROM mdm_standard_pack`

### Phase 2: Metadata Remediation Flow (Process Hexagon) ✅
- [x] Create `remediation.tables.ts` for `mdm_violation_report`, `mdm_remediation_proposal`, `mdm_scan_history`
- [x] Implement `remediation.service.ts` with scan, proposal, and apply logic
- [x] Implement `MetadataScanCell` (CELL_MDM_SCAN)
- [x] Implement `RemediationProposalCell` (CELL_MDM_PROPOSE)
- [x] Implement `RemediationApplyCell` (CELL_MDM_APPLY)
- [ ] Add REST endpoints in `remediation.routes.ts`
- [ ] Run initial scan to find existing violations

### Phase 2.5: Atomic Cells Implementation ✅
- [x] Create `cells/` directory with 6-face template implementations
- [x] Implement `EntityRegisterCell` (CELL_MDM_ENT_REG)
- [x] Implement `FieldRegisterCell` (CELL_MDM_FLD_REG)
- [x] Implement `StandardPackRegisterCell` (CELL_MDM_PACK_REG)
- [x] Implement `TypeGenerationCell` (CELL_MDM_TYPE_GEN)
- [x] Define GRCD rules and controls in each cell

### Phase 3: Metadata Studio UI/API (Kernel + Process)
- [ ] Wire cells to unified API routes
- [ ] Build Retool/Admin UI for:
  - Entity catalog management
  - Field registration with tier/pack selection
  - Mapping configuration
  - Remediation workflow approval (HITL)
- [ ] Integrate type generation into CI/CD
- [ ] Add telemetry dashboards for violation tracking

---

## 7. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-15 | System | Initial hexagonal mapping |
| 1.1 | 2025-12-16 | System | Added 6-face templates, remediation flow, standard packs |

---

## References

- **CONT_06**: Schema and Type Governance
- **CONT_06_SCHEMA_SPEC.md**: Database schema specification
- **CONT_06_SchemaAndTypeGovernance.md**: Full governance contract
- **Hexagonal Molecularity Model**: AI-BOS architecture framework
