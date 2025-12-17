# CONT_06 Developer Workflow Guide

> **Purpose:** Step-by-step guide for creating schemas and types per CONT_06  
> **Audience:** Canon, Molecule, and Cell developers  
> **Last Updated:** 2025-12-15

---

## ⚠️ Critical: Metadata-First Architecture

**The Metadata Registry is the SSOT, NOT PostgreSQL.**

Always start with Metadata Registry registration. Database schemas are derived from metadata, not the other way around.

---

## 🎯 Quick Start

When developing a Canon/Molecule/Cell, follow this workflow:

1. **Register in Metadata Registry** (SSOT - this is the source)
2. **Generate/Update TypeScript Type** (from metadata)
3. **Create Database Migration** (derived from metadata)
4. **Create Zod Schema**
5. **Register SCH Code**
6. **Export from Kernel Core**
7. **Use in Your Code**

---

## 📋 Step-by-Step Workflow

### Scenario: Creating a Payment Request Schema

#### Step 1: Register in Metadata Registry (SSOT)

**First, define the schema in the Metadata Registry:**

```typescript
// Register via Kernel Metadata API
// This is the SSOT - all schema definitions start here

const metadataEntry = {
  dict_id: "DS-PR-001",
  business_term: "Payment Request",
  technical_name: "payment_requests",
  version: "1.0.0",
  domain: "Finance",
  entity_group: "Accounts Payable",
  definition_full: "A payment request represents a request to pay a vendor...",
  fields: [
    {
      field_name: "vendor_id",
      data_type: "UUID",
      required: true,
      definition: "Reference to vendor"
    },
    {
      field_name: "amount",
      data_type: "DECIMAL",
      required: true,
      definition: "Payment amount"
    },
    // ... other fields from metadata registry
  ]
};
```

#### Step 2: Generate TypeScript Type from Metadata

```sql
-- apps/db/migrations/finance/104_payment_requests.sql
CREATE TABLE finance.payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES kernel.tenants(id),
  vendor_id UUID NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  due_date DATE NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

```typescript
// packages/kernel-core/src/db/schema.types.ts
// Types derived from Metadata Registry (SSOT: DS-PR-001)
export interface DbPaymentRequestRow {
  id: string;
  tenant_id: string;
  vendor_id: string;
  amount: string; // DECIMAL as string
  currency: string;
  due_date: string; // ISO date string
  description: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}
```

#### Step 3: Create Database Migration (Derived from Metadata)

```sql
-- apps/db/migrations/finance/104_payment_requests.sql
-- Schema derived from Metadata Registry entry: DS-PR-001
CREATE TABLE finance.payment_requests (

```typescript
// packages/schemas/src/finance/payment-request.ts
import { z } from 'zod';
import type { DbPaymentRequestRow } from '@aibos/kernel-core/db/schema.types';

/**
 * SCH_201 - Payment Request Schema
 * 
 * Runtime validation for payment request data.
 * Used in payment-hub cell for payment creation.
 */
export const PaymentRequestTableSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  vendor_id: z.string().uuid(),
  amount: z.string().regex(/^\d+\.\d{2}$/), // DECIMAL format
  currency: z.string().length(3),
  due_date: z.string().date(),
  description: z.string().nullable(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'PAID']),
  created_at: z.date(),
  updated_at: z.date(),
}) satisfies z.ZodType<DbPaymentRequestRow>;

export type PaymentRequestTable = z.infer<typeof PaymentRequestTableSchema>;

// API Request Schema (subset for creation)
export const CreatePaymentRequestSchema = PaymentRequestTableSchema.omit({
  id: true,
  tenant_id: true,
  status: true,
  created_at: true,
  updated_at: true,
});

export type CreatePaymentRequest = z.infer<typeof CreatePaymentRequestSchema>;
```

#### Step 4: Create Zod Schema

```yaml
# canon/schemas.yaml
schemas:
  # ... existing schemas ...
  
  - code: SCH_201
    version: 1.0.0
    name: "Payment Request Schema"
    kind: "zod"
    module: "@aibos/schemas/finance/payment-request"
    export: "PaymentRequestTableSchema"
    impl_file: "packages/schemas/src/finance/payment-request.ts"
    status: "active"
    owner: "CID_FINANCE"
    description: >
      Schema for payment request data validation.
      Used in payment-hub cell for payment creation.
```

#### Step 5: Export from Kernel Core

```typescript
// packages/kernel-core/src/db/schemas.ts
export { PaymentRequestTableSchema, CreatePaymentRequestSchema } from '@aibos/schemas/finance/payment-request';
export type { PaymentRequestTable, CreatePaymentRequest } from '@aibos/schemas/finance/payment-request';
```

#### Step 6: Export from Kernel Core

```typescript
// apps/canon/finance/dom03-accounts-payable/payment-hub/src/index.ts
import { CreatePaymentRequestSchema, type CreatePaymentRequest } from '@aibos/kernel-core/db/schemas';
import { TenantDb } from '@aibos/db/lib/tenant-db';

export async function createPaymentRequest(
  ctx: TenantContext,
  data: unknown
): Promise<PaymentRequestTable> {
  // Runtime validation
  const validated = CreatePaymentRequestSchema.parse(data);
  
  // Compile-time safety
  const db = new TenantDb(pool);
  const result = await db.insert(ctx, 'payment_requests', validated);
  
  return result.rows[0];
}
```

---

## ✅ Validation Checklist

Before committing:

```bash
# 1. Validate schema registration
pnpm validate:schemas

# 2. Check boundaries
pnpm check:boundaries

# 3. Validate structure
pnpm validate:structure
```

---

## 🚨 Common Mistakes

### ❌ Mistake 1: Forgetting SCH Code Registration

```typescript
// ❌ BAD: Schema created but not registered
export const MySchema = z.object({ ... });
```

**Fix:** Add entry to `canon/schemas.yaml`

### ❌ Mistake 2: Wrong Export Name

```typescript
// ❌ BAD: Export name doesn't match registration
export const PaymentSchema = z.object({ ... });

// canon/schemas.yaml says: export: "PaymentRequestSchema"
```

**Fix:** Rename export to match registration

### ❌ Mistake 3: Missing `satisfies z.ZodType<T>`

```typescript
// ❌ BAD: No type safety guarantee
export const MySchema = z.object({ ... });

// ✅ GOOD: Type-safe schema
export const MySchema = z.object({ ... }) satisfies z.ZodType<MyType>;
```

**Fix:** Add `satisfies z.ZodType<YourType>`

### ❌ Mistake 4: Canon Creating Its Own Types

```typescript
// ❌ BAD: Canon creates its own types
// apps/canon/finance/payment-hub/src/types.ts
export interface Payment { ... }

// ✅ GOOD: Canon imports from Kernel
import type { PaymentRequestTable } from '@aibos/kernel-core/db/types';
```

**Fix:** Import from `@aibos/kernel-core`

---

## 📚 Reference

- **Contract:** [CONT_06_SchemaAndTypeGovernance.md](../../packages/canon/A-Governance/A-CONT/CONT_06_SchemaAndTypeGovernance.md)
- **Type Generation:** [Type Generation Strategy](../../apps/kernel/docs/type-generation-strategy.md)
- **Canon Identity:** [CONT_01_CanonIdentity.md](../../packages/canon/A-Governance/A-CONT/CONT_01_CanonIdentity.md)

---

**Version:** 1.0.0  
**Status:** 🟢 ACTIVE  
**Last Updated:** 2025-12-15
