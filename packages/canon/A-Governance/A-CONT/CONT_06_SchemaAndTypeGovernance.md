# CONT_06 — Schema and Type Governance Standard

> **🟢 [ACTIVE]** — Certified for Production  
> **Canon Code:** CONT_06  
> **Version:** 1.0.0  
> **Plane:** A — Governance (Contract)  
> **Binding Scope:** All AI-BOS repositories  
> **Authority:** AI-BOS Schema & Type Governance Standard  
> **Derives From:** [CONT_01_CanonIdentity.md](./CONT_01_CanonIdentity.md), [CONT_03_DatabaseArchitecture.md](./CONT_03_DatabaseArchitecture.md)

---

## ⚠️ Critical Principle: Metadata-First Architecture

**The Metadata Registry (`mdm_global_metadata`) is the Single Source of Truth (SSOT), NOT PostgreSQL.**

- ✅ **Metadata Registry** → Defines schemas, fields, entities
- ✅ **TypeScript Types** → Generated from metadata
- ✅ **Zod Schemas** → Generated from types
- ✅ **PostgreSQL** → Just persistence layer, schema derived from metadata

**Never create database schemas first. Always start with Metadata Registry registration.**

---

## 📋 Document Control

| Property | Value |
|----------|-------|
| **Version** | 1.0.0 |
| **Status** | 🟢 ACTIVE |
| **Last Updated** | 2025-12-15 |
| **Supersedes** | None (New Standard) |
| **Related Contracts** | CONT_01 (Canon Identity), CONT_03 (Database), CONT_05 (Naming) |

---

## 🎯 Purpose

This contract standardizes **schema creation**, **type generation**, and **validation patterns** across all AI-BOS layers. It ensures:

1. **Single Source of Truth** — **Metadata Registry** → TypeScript types → Zod schemas → Database persistence
2. **Metadata-First Architecture** — All schemas defined in Metadata Registry before implementation
3. **Governance Compliance** — All schemas registered with SCH codes (per CONT_01)
4. **Type Safety** — Compile-time (TypeScript) + Runtime (Zod) validation
5. **Canon Consistency** — Kernel provides types; Canons consume them
6. **Automation** — Auto-generation from Metadata Registry

---

## 🏛️ The Type Generation Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│         METADATA REGISTRY (mdm_global_metadata)             │
│         Single Source of Truth (SSOT)                        │
│         Defines schemas, fields, entities                    │
│         Location: Kernel Metadata Registry                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼ [Generate Types from Metadata]
┌─────────────────────────────────────────────────────────────┐
│         TypeScript Types (Compile-time Safety)              │
│    export interface JournalEntriesTable { ... }             │
│    Location: packages/kernel-core/src/db/schema.types.ts   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼ [Generate Zod Schemas]
┌─────────────────────────────────────────────────────────────┐
│         Zod Schemas (Runtime Validation)                   │
│    export const JournalEntriesTableSchema = z.object(...)  │
│    Location: packages/schemas/src/<domain>/<entity>.ts     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼ [Register SCH Code]
┌─────────────────────────────────────────────────────────────┐
│         Canon Registry (canon/schemas.yaml)                 │
│    - code: SCH_101                                          │
│      module: "@aibos/schemas/finance/journal"               │
│      export: "JournalEntriesTableSchema"                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼ [Export from Kernel]
┌─────────────────────────────────────────────────────────────┐
│         Kernel Core Exports                                │
│    @aibos/kernel-core/db/types                             │
│    @aibos/kernel-core/db/schemas                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼ [Canons Import & Use]
┌─────────────────────────────────────────────────────────────┐
│         Canon/Molecule/Cell Usage                          │
│    import { JournalEntriesTableSchema }                    │
│         from '@aibos/kernel-core/db/schemas'              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼ [Persist to Database]
┌─────────────────────────────────────────────────────────────┐
│         PostgreSQL Database (Persistence Layer)            │
│         CREATE TABLE journal_entries (...)                  │
│         Schema derived from Metadata Registry              │
└─────────────────────────────────────────────────────────────┘
```

**Key Principle:** The **Metadata Registry** is the SSOT. PostgreSQL is just the persistence layer. Schema definitions flow from Metadata → Types → Zod → Database, not the reverse.

---

## 📏 Schema Governance Rules

### 1. SCH Code Assignment (per CONT_01)

| Rule | Requirement |
|------|-------------|
| **Pattern** | `SCH_[0-9]{3}` (e.g., `SCH_101`, `SCH_201`) |
| **Registration** | MUST be registered in `canon/schemas.yaml` |
| **Uniqueness** | Each SCH code is globally unique |
| **Versioning** | Use SemVer (e.g., `1.0.0`) |
| **Status** | `active` | `draft` | `deprecated` |

### 2. Schema Location Rules

| Schema Type | Location Pattern | Example |
|-------------|------------------|---------|
| **Kernel DB Tables** | `packages/kernel-core/src/db/schema.types.ts` | `DbUserRow`, `DbTenantRow` |
| **Kernel API Contracts** | `packages/schemas/src/kernel.ts` | `MetadataSearchRequestSchema` |
| **Canon Domain Schemas** | `packages/schemas/src/<domain>/<entity>.ts` | `packages/schemas/src/finance/journal.ts` |
| **Cell-Specific Schemas** | `packages/schemas/src/<domain>/<molecule>/<cell>.ts` | `packages/schemas/src/finance/ap/payment-hub.ts` |

### 3. Naming Conventions

| Entity | Pattern | Example |
|--------|---------|---------|
| **TypeScript Type** | `{Entity}Table` or `{Entity}Row` | `JournalEntriesTable`, `DbUserRow` |
| **Zod Schema** | `{Entity}TableSchema` or `{Entity}Schema` | `JournalEntriesTableSchema`, `PaymentRequestSchema` |
| **File Name** | `{entity}.ts` (kebab-case) | `journal-entries.ts`, `payment-request.ts` |
| **Export Name** | Match schema name | `export const JournalEntriesTableSchema` |

---

## 🔧 Workflow: Creating a New Schema

### Step 1: Register in Metadata Registry (SSOT)

**First, define the schema in the Metadata Registry:**

```typescript
// Register via Kernel Metadata API or Metadata Registry UI
// This is the SSOT - all schema definitions start here

const metadataEntry = {
  dict_id: "DS-JE-001",
  business_term: "Journal Entry",
  technical_name: "journal_entries",
  version: "1.0.0",
  domain: "Finance",
  entity_group: "Transactional",
  definition_full: "A journal entry records a financial transaction...",
  fields: [
    {
      field_name: "journal_date",
      data_type: "DATE",
      required: true,
      definition: "Date of the journal entry"
    },
    {
      field_name: "description",
      data_type: "TEXT",
      required: true,
      definition: "Description of the transaction"
    },
    // ... other fields
  ]
};
```

### Step 2: Generate TypeScript Type from Metadata

**Option A: Manual (Current MVP)**
```typescript
// packages/kernel-core/src/db/schema.types.ts
// Types derived from Metadata Registry (SSOT)
export interface DbJournalEntryRow {
  id: string;
  tenant_id: string;
  journal_date: string; // ISO date string (from metadata: DS-JE-001)
  description: string;   // (from metadata: DS-JE-001)
  created_at: Date;
  updated_at: Date;
}
```

**Option B: Auto-Generated from Metadata (Post-MVP)**
```bash
pnpm metadata:generate-types
# Reads from Metadata Registry (mdm_global_metadata)
# Outputs to packages/kernel-core/src/db/generated/types.ts
```

### Step 3: Create Database Migration (Derived from Metadata)

**The database schema is derived from Metadata Registry:**

```sql
-- apps/db/migrations/finance/103_journal_entries.sql
-- Schema derived from Metadata Registry entry: DS-JE-001
CREATE TABLE finance.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES kernel.tenants(id),
  journal_date DATE NOT NULL,        -- From metadata: DS-JE-001
  description TEXT NOT NULL,         -- From metadata: DS-JE-001
  -- ... other columns from metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Step 4: Create Zod Schema

```typescript
// packages/schemas/src/finance/journal-entries.ts
import { z } from 'zod';
import type { DbJournalEntryRow } from '@aibos/kernel-core/db/schema.types';

/**
 * SCH_101 - Journal Entry Schema
 * 
 * Runtime validation for journal entry data.
 * Used in finance journal entry forms and API endpoints.
 */
export const JournalEntriesTableSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  journal_date: z.string().date(),
  description: z.string().min(1).max(500),
  created_at: z.date(),
  updated_at: z.date(),
}) satisfies z.ZodType<DbJournalEntryRow>;

export type JournalEntriesTable = z.infer<typeof JournalEntriesTableSchema>;
```

### Step 5: Register SCH Code

```yaml
# canon/schemas.yaml
schemas:
  - code: SCH_101
    version: 1.0.0
    name: "Journal Entry Schema"
    kind: "zod"
    module: "@aibos/schemas/finance/journal-entries"
    export: "JournalEntriesTableSchema"
    impl_file: "packages/schemas/src/finance/journal-entries.ts"
    status: "active"
    owner: "CID_FINANCE"
    description: >
      Schema for journal entry data validation.
      Used in finance journal entry forms and API endpoints.
```

### Step 5: Export from Kernel Core

```typescript
// packages/kernel-core/src/db/schemas.ts
export { JournalEntriesTableSchema } from '@aibos/schemas/finance/journal-entries';
export type { JournalEntriesTable } from '@aibos/schemas/finance/journal-entries';
```

### Step 7: Use in Canon/Molecule/Cell

```typescript
// apps/canon/finance/general-ledger/journal-entry-cell/src/index.ts
import { JournalEntriesTableSchema, type JournalEntriesTable } from '@aibos/kernel-core/db/schemas';

export async function createJournalEntry(data: unknown) {
  // Runtime validation
  const validated = JournalEntriesTableSchema.parse(data);
  
  // Compile-time safety
  function processEntry(entry: JournalEntriesTable) {
    // TypeScript knows exact structure
    console.log(entry.journal_date);
  }
  
  processEntry(validated);
}
```

---

## 🚫 Anti-Patterns (Forbidden)

### ❌ Creating Types Without Schemas

```typescript
// ❌ BAD: Type without runtime validation
export interface PaymentData {
  amount: number;
  currency: string;
}

// ✅ GOOD: Type + Zod schema
export const PaymentDataSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3),
});
export type PaymentData = z.infer<typeof PaymentDataSchema>;
```

### ❌ Unregistered SCH Codes

```typescript
// ❌ BAD: Schema without SCH code registration
export const MySchema = z.object({ ... });

// ✅ GOOD: Schema registered in canon/schemas.yaml
// SCH_201 registered in canon/schemas.yaml
export const PaymentRequestSchema = z.object({ ... });
```

### ❌ Canon Creating Its Own Types

```typescript
// ❌ BAD: Canon creates its own types
// apps/canon/finance/payment-hub/src/types.ts
export interface Payment { ... }

// ✅ GOOD: Canon imports from Kernel
import type { PaymentTable } from '@aibos/kernel-core/db/types';
```

### ❌ Direct Database Access from Frontend

```typescript
// ❌ BAD: Frontend imports DB types directly
import { pool } from '@aibos/db';

// ✅ GOOD: Frontend uses Server Actions with schemas
import { PaymentRequestSchema } from '@aibos/kernel-core/db/schemas';
```

---

## 🔧 Enforcement Mechanisms

### 1. Schema Registration Validator

**Tool:** `scripts/validate-schemas.ts`

```bash
pnpm validate:schemas
```

**Checks:**
- ✅ All SCH codes in `canon/schemas.yaml` have corresponding files
- ✅ All schema files export the registered export name
- ✅ Schema files match the registered `impl_file` path
- ✅ No duplicate SCH codes

### 2. Type Generation Script ✅ IMPLEMENTED

**Tool:** `scripts/generate-types-from-metadata.ts`

```bash
# Generate types from metadata (uses mock data if DB not connected)
pnpm metadata:generate-types

# Generate with explicit mock data (for development)
pnpm metadata:generate-types:mock

# Preview without writing files
pnpm metadata:generate-types:dry-run
```

**Generates:**
- TypeScript interfaces from Metadata Registry (mdm_global_metadata)
- Zod schemas with `satisfies z.ZodType<T>` for type safety
- Output locations:
  - `packages/kernel-core/src/db/generated/types.ts`
  - `packages/kernel-core/src/db/generated/schemas.ts`
- **Source:** Metadata Registry (SSOT), not PostgreSQL

**Architecture:**
```
┌─────────────────────────────────────────────────────────────┐
│ Metadata Registry (apps/kernel/src/metadata-studio/)        │
│ - mdm_global_metadata table                                 │
│ - Zod schema: MdmGlobalMetadataSchema                       │
│ - Drizzle table: mdmGlobalMetadata                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼ [scripts/generate-types-from-metadata.ts]
┌─────────────────────────────────────────────────────────────┐
│ Generated Output (packages/kernel-core/src/db/generated/)  │
│ - types.ts    → TypeScript interfaces                      │
│ - schemas.ts  → Zod schemas with satisfies                 │
│ - index.ts    → Re-exports                                 │
└─────────────────────────────────────────────────────────────┘
```

**Example Generated Output:**
```typescript
// packages/kernel-core/src/db/generated/types.ts
export interface FinanceJournalEntriesTable {
  journal_id: string;
  journal_date: string;
  description: string;
  status: string;
  total_debit: string;
  total_credit: string;
}

// packages/kernel-core/src/db/generated/schemas.ts
export const FinanceJournalEntriesTableSchema = z.object({
  journal_id: z.string().uuid(),
  journal_date: z.string().date(),
  description: z.string(),
  status: z.string(),
  total_debit: z.string(),
  total_credit: z.string(),
}) satisfies z.ZodType<FinanceJournalEntriesTable>;
```

### 3. Metadata Studio

**Location:** `apps/kernel/src/metadata-studio/`

The Metadata Studio is the runtime service for the Metadata Registry:
- **API:** REST endpoints for CRUD operations on metadata
- **Schemas:** Zod schemas for validation (SSOT)
- **Database:** Drizzle ORM table definitions
- **Services:** Business logic for metadata management

### 4. Boundary Checker (CONT_05)

**Tool:** `scripts/check-boundaries.ts`

**Checks:**
- ✅ No Canon → Canon type imports
- ✅ No Frontend → DB direct access
- ✅ All types imported from `@aibos/kernel-core`

---

## 📋 Validation Checklist

Before merging any PR with schema changes:

- [ ] Database migration created (if needed)
- [ ] TypeScript type created/updated
- [ ] Zod schema created with `satisfies z.ZodType<T>`
- [ ] SCH code registered in `canon/schemas.yaml`
- [ ] Schema exported from `packages/kernel-core/src/db/schemas.ts`
- [ ] Schema file follows naming conventions
- [ ] `pnpm validate:schemas` passes
- [ ] `pnpm check:boundaries` passes

---

## 🎓 Examples

### Example 1: Kernel Table Schema

```typescript
// packages/kernel-core/src/db/schema.types.ts
export interface DbUserRow {
  id: string;
  tenant_id: string;
  email: string;
  name: string;
  password_hash: string | null;
  created_at: Date;
  updated_at: Date;
}

// packages/schemas/src/kernel/users.ts
import { z } from 'zod';
import type { DbUserRow } from '@aibos/kernel-core/db/schema.types';

export const UsersTableSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  password_hash: z.string().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
}) satisfies z.ZodType<DbUserRow>;

export type UsersTable = z.infer<typeof UsersTableSchema>;
```

### Example 2: Canon Domain Schema

```typescript
// packages/schemas/src/finance/payment-request.ts
import { z } from 'zod';

/**
 * SCH_201 - Payment Request Schema
 * Used in payment-hub cell for payment creation.
 */
export const PaymentRequestSchema = z.object({
  vendor_id: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  due_date: z.string().date(),
  description: z.string().max(500).optional(),
});

export type PaymentRequest = z.infer<typeof PaymentRequestSchema>;
```

**Registration:**
```yaml
# canon/schemas.yaml
schemas:
  - code: SCH_201
    version: 1.0.0
    name: "Payment Request Schema"
    kind: "zod"
    module: "@aibos/schemas/finance/payment-request"
    export: "PaymentRequestSchema"
    impl_file: "packages/schemas/src/finance/payment-request.ts"
    status: "active"
    owner: "CID_FINANCE"
```

---

## 🔄 Migration Guide

### Migrating Existing Schemas

1. **Identify unregistered schemas:**
   ```bash
   pnpm validate:schemas
   ```

2. **Assign SCH codes:**
   - Check `canon/schemas.yaml` for next available code
   - Assign `SCH_XXX` code

3. **Register in `canon/schemas.yaml`:**
   - Add entry with code, version, module, export

4. **Update imports:**
   - Replace direct imports with `@aibos/kernel-core/db/schemas`

5. **Validate:**
   ```bash
   pnpm validate:schemas
   pnpm check:boundaries
   ```

---

## 📚 Related Documents

- [CONT_01: Canon Identity](./CONT_01_CanonIdentity.md) — SCH code governance
- [CONT_03: Database Architecture](./CONT_03_DatabaseArchitecture.md) — DB schema patterns
- [CONT_05: Naming and Structure](./CONT_05_NamingAndStructure.md) — Directory structure
- [PRD: Kernel](../../apps/kernel/PRD-KERNEL.md) — Metadata Registry architecture
- [Type Generation Strategy](../../apps/kernel/docs/type-generation-strategy.md) — Implementation details (Note: Update to reflect Metadata-first approach)

---

## ✅ Acceptance Criteria

This contract is considered **implemented** when:

- [x] Type generation script exists (`scripts/generate-types-from-metadata.ts`)
- [x] Generated types output location exists (`packages/kernel-core/src/db/generated/`)
- [x] Metadata Studio moved to proper location (`apps/kernel/src/metadata-studio/`)
- [x] Types generated from Metadata Registry, not PostgreSQL
- [x] npm scripts added (`pnpm metadata:generate-types`)
- [ ] All schemas defined in Metadata Registry (SSOT) — In Progress
- [ ] All existing schemas registered with SCH codes — Pending
- [ ] Schema validator (`validate-schemas.ts`) exists and passes — Exists, needs schemas
- [ ] All Canon/Molecule/Cell code uses Kernel-provided types — Migration needed
- [ ] No direct DB imports from Frontend — Enforced via boundary checker
- [ ] DB connection integrated for live metadata generation — Pending

---

## 📝 Implementation Status

| Component | Status | Location |
|-----------|--------|----------|
| **Type Generator** | ✅ Done | `scripts/generate-types-from-metadata.ts` |
| **Generated Types** | ✅ Done | `packages/kernel-core/src/db/generated/types.ts` |
| **Generated Schemas** | ✅ Done | `packages/kernel-core/src/db/generated/schemas.ts` |
| **Metadata Studio** | ✅ Moved | `apps/kernel/src/metadata-studio/` |
| **DB Integration** | 🟡 Pending | Connect to live `mdm_global_metadata` |
| **SCH Registration** | 🟡 Pending | Add to `canon/schemas.yaml` |

---

**Version:** 1.0.1  
**Status:** 🟢 ACTIVE  
**Last Updated:** 2025-12-15  
**Next Review:** 2026-01-15
