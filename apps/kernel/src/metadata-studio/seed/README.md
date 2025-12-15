# Metadata Bootstrap

## 🎯 Purpose

This directory contains **standard packs** and **canonical concepts** that are loaded into the metadata tables during system bootstrap.

**Flow:**
```
CSV Files → Loader Script → Database Tables → SSOT Wiki → Domain Code
```

---

## 📂 Directory Structure

```
bootstrap/metadata/
├── standard-packs/
│   └── finance-ifrs-core.csv       # Standard pack definitions
├── concepts/
│   ├── finance-core.csv            # Finance canonical concepts
│   └── finance-operational.csv     # (future)
├── aliases/
│   └── finance-aliases.csv         # (future) Alias mappings
├── load-metadata.ts                # Bootstrap loader script
└── README.md                       # This file
```

---

## 🚀 How to Run

### First Time Setup

```bash
# From project root
cd bootstrap/metadata
pnpm install
```

### Load Metadata

```bash
# From project root
pnpm metadata:bootstrap
```

This will:
1. ✅ Load standard packs from `standard-packs/*.csv`
2. ✅ Load concepts from `concepts/*.csv`
3. ✅ Validate all canonical_keys are snake_case
4. ✅ Idempotent upsert (safe to run multiple times)

---

## 📋 CSV File Formats

### Standard Packs (`standard-packs/*.csv`)

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `pack_key` | string | ✅ | Unique identifier (e.g., `MFRS15_REVENUE`) |
| `name` | string | ✅ | Human-readable name |
| `domain` | string | ✅ | FINANCE, TAX, DESIGN, etc. |
| `version` | string | ✅ | Semantic version (e.g., `1.0.0`) |
| `is_active` | boolean | ✅ | Whether pack is active |
| `description` | string | ⚪ | Description of the pack |

### Concepts (`concepts/*.csv`)

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `canonical_key` | string | ✅ | **Must be snake_case** (e.g., `revenue_ifrs_core`) |
| `label` | string | ✅ | Human-readable label |
| `domain` | string | ✅ | FINANCE, OPERATIONS, etc. |
| `standard_pack_key` | string | ✅ | References `pack_key` in standard packs |
| `semantic_type` | string | ✅ | `currency_amount`, `quantity`, `kpi`, etc. |
| `financial_element` | string | ⚪ | `INCOME`, `ASSET`, `MANAGEMENT_KPI`, etc. |
| `tier` | string | ✅ | `tier1`, `tier2`, `tier3`, `tier4`, `tier5` |
| `description` | string | ⚪ | Detailed description |

---

## 🔒 Validation Rules

### canonical_key MUST be snake_case

The loader validates all `canonical_key` values with this regex:
```regex
^[a-z0-9]+(_[a-z0-9]+)*$
```

**Valid:**
- ✅ `revenue_ifrs_core`
- ✅ `sales_value_operational`
- ✅ `user_id`

**Invalid:**
- ❌ `RevenueIFRSCore` (PascalCase)
- ❌ `revenue-ifrs-core` (kebab-case)
- ❌ `REVENUE_IFRS_CORE` (UPPER_SNAKE)

### standard_pack_key must exist

Before loading concepts, the loader checks that the referenced `standard_pack_key` exists in `mdm_standard_pack`.

---

## 🔄 Idempotent Upsert

The loader is safe to run multiple times:

- **If record exists** (by `pack_key` or `canonical_key`): Updates it
- **If record doesn't exist**: Inserts it

This means you can:
- ✅ Add new concepts to CSV and re-run
- ✅ Update descriptions and re-run
- ✅ Fix typos and re-run

**No duplicates will be created.**

---

## 🔗 Integration with SSOT Wiki

After loading, these concepts should be documented in:

**SSOT Wiki Pages:**
- `docs/metadata-ssot/finance-revenue-matrix.md`

**Front-matter:**
```yaml
canonical_concepts:
  - revenue_ifrs_core
  - other_income_ifrs
  - gain_ifrs_other
  - sales_value_operational
  - sales_quantity_operational
```

**Rule:** Every concept in the wiki MUST exist in `mdm_concept_global`.

---

## 📊 Current Standard Packs

| Pack Key | Name | Domain | Concepts |
|----------|------|--------|----------|
| `MFRS15_REVENUE` | IFRS/MFRS Core Revenue | FINANCE | `revenue_ifrs_core` |
| `IFRS_OTHER_INCOME` | IFRS Other Income | FINANCE | `other_income_ifrs` |
| `IFRS_OTHER_GAIN` | IFRS Gains | FINANCE | `gain_ifrs_other` |
| `AIBOS_INTERNAL_MANAGEMENT` | AI-BOS Internal Management KPIs | FINANCE | `sales_value_operational`, `sales_quantity_operational` |

---

## 🎯 Next Steps

After bootstrap:

1. **Verify in Supabase:**
   ```sql
   SELECT * FROM mdm_standard_pack;
   SELECT * FROM mdm_concept_global;
   ```

2. **Generate naming variants:**
   ```bash
   pnpm metadata:generate-variants
   ```

3. **Update SSOT wiki** to reference loaded concepts

4. **Use in code:**
   ```typescript
   import { resolveNameForConcept } from './naming';
   
   const tsName = await resolveNameForConcept({
     canonicalKey: "revenue_ifrs_core",
     context: "typescript",
     tenantId: "tenant-123",
   });
   ```

---

## 🚨 Troubleshooting

### Error: "canonical_key must be snake_case"

Fix: Update CSV to use snake_case:
```diff
- canonical_key: RevenueIFRS
+ canonical_key: revenue_ifrs_core
```

### Error: "standard_pack_key not found"

Fix: Load standard packs first, or check pack_key spelling:
```bash
pnpm metadata:bootstrap
```

### Error: "Database connection failed"

Fix: Check `.env` file has `DATABASE_URL` set

---

**Last Updated:** 2025-12-02  
**Owner:** CID – Central Insight Department

