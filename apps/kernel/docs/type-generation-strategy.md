# Type Generation Strategy: Database → Zod → Kernel Types → Canons

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Database Schema                          │
│              (PostgreSQL - Source of Truth)                  │
│         CREATE TABLE users (id UUID, email TEXT...)          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼ [Auto-Generate Types]
┌─────────────────────────────────────────────────────────────┐
│            Auto-Generated TypeScript Types                  │
│         (From DB Schema - Compile-time Safety)              │
│    export interface UsersTable { id: string; email: ... }   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼ [Generate Zod Schemas]
┌─────────────────────────────────────────────────────────────┐
│              Zod Schemas (Runtime Validation)               │
│         (Extra Layer of Protection - API Contracts)         │
│    export const UsersTableSchema = z.object({ ... })         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼ [Export from Kernel Core]
┌─────────────────────────────────────────────────────────────┐
│              Kernel Exports (@aibos/kernel-core)             │
│         (Types + Schemas for Canon Consumption)              │
│    export type { UsersTable } from './db/types'              │
│    export { UsersTableSchema } from './db/schemas'           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼ [Canons Import & Use]
┌─────────────────────────────────────────────────────────────┐
│              Canons Use Kernel Types                         │
│         (Guaranteed Consistency Across System)                │
│    import { UsersTable, UsersTableSchema }                   │
│         from '@aibos/kernel-core'                            │
└─────────────────────────────────────────────────────────────┘
```

## Why This Approach?

### 1. **Database as Source of Truth** ✅
- Database schema is the **single source of truth** for data structure
- Auto-generated types ensure **compile-time safety** matches database reality
- Prevents type drift between code and database
- **Matches PRD:** "Schema-first contract SSOT"

### 2. **Zod as Runtime Protection** ✅
- Zod schemas provide **runtime validation** at API boundaries
- Catches invalid data before it reaches the database
- Protects against:
  - Malformed requests
  - Type coercion issues
  - Data corruption
  - **Double protection:** TypeScript (compile-time) + Zod (runtime)

### 3. **Kernel as Type Provider** ✅
- Kernel exports types/schemas via `@aibos/kernel-core`
- Canons import and use these types
- Ensures **consistency** across the entire system
- **Matches Canon Identity governance:** Kernel provides contracts to Canons
- **Prevents:** Canon developers from creating incompatible types

## Current State vs Target State

### Current State (Day 2 - MVP)
```typescript
// Manual type annotations in SQL adapters
const result = await this.db.query<{
  id: string;
  tenant_id: string;
  email: string;
  // ... manually typed
}>(`SELECT ...`);
```

**Issues:**
- ⚠️ Types can drift from database schema
- ⚠️ No automatic sync when schema changes
- ⚠️ Manual maintenance required

### Target State (Post-MVP)
```typescript
// 1. Auto-generated from database
import type { UsersTable } from '@aibos/kernel-core/db/types';

// 2. Zod schema auto-generated from type
import { UsersTableSchema } from '@aibos/kernel-core/db/schemas';

// 3. Canon uses Kernel-provided types
const user = UsersTableSchema.parse(request.body); // Runtime validation
function processUser(user: UsersTable) { ... }      // Compile-time safety
```

**Benefits:**
- ✅ Types always match database
- ✅ Automatic sync on schema changes
- ✅ Zero manual maintenance
- ✅ Canon consistency guaranteed

## Implementation Strategy

### Phase 1: Generate Types from Database Schema

**Tool Options:**

#### Option A: `pg-typed` (Recommended)
```bash
pnpm add -D pg-typed
```

```typescript
// scripts/generate-db-types.ts
import { generateTypes } from 'pg-typed';

async function generate() {
  await generateTypes({
    connection: process.env.DATABASE_URL!,
    output: './src/db/generated/types.ts',
    schema: 'public',
    tables: ['users', 'roles', 'tenants', 'canons', 'routes', ...],
  });
}
```

**Output:**
```typescript
// apps/kernel/src/db/generated/types.ts
export interface UsersTable {
  id: string;
  tenant_id: string;
  email: string;
  name: string | null;
  password_hash: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface RolesTable {
  id: string;
  tenant_id: string;
  name: string;
  created_at: Date;
}
// ... etc
```

#### Option B: Custom Script (Lightweight)
```typescript
// scripts/generate-types-from-schema.ts
// Introspect PostgreSQL schema and generate TypeScript types
```

### Phase 2: Generate Zod Schemas from Types

**Tool:** `zod-prisma` or custom generator

```typescript
// scripts/generate-zod-schemas.ts
import { z } from 'zod';
import type { UsersTable } from './types';

// Auto-generate Zod schema from TypeScript type
export const UsersTableSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  password_hash: z.string().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
}) satisfies z.ZodType<UsersTable>;
```

**Or use `zod-prisma` style generator:**
```typescript
// Auto-generate from type definition
const UsersTableSchema = generateZodSchema(UsersTable);
```

### Phase 3: Export from Kernel Core

```typescript
// packages/kernel-core/src/db/types.ts
export type {
  UsersTable,
  RolesTable,
  TenantsTable,
  CanonsTable,
  RoutesTable,
  SessionsTable,
  EventsTable,
  AuditEventsTable,
} from '@aibos/kernel/db/generated/types';

// packages/kernel-core/src/db/schemas.ts
export {
  UsersTableSchema,
  RolesTableSchema,
  TenantsTableSchema,
  CanonsTableSchema,
  RoutesTableSchema,
  SessionsTableSchema,
  EventsTableSchema,
  AuditEventsTableSchema,
} from '@aibos/kernel/db/generated/schemas';
```

**Update package.json:**
```json
{
  "exports": {
    "./db/types": "./src/db/types.ts",
    "./db/schemas": "./src/db/schemas.ts"
  }
}
```

### Phase 4: Canons Use Kernel Types

```typescript
// apps/canon-demo/src/api/users.ts
import { 
  UsersTableSchema, 
  type UsersTable 
} from '@aibos/kernel-core/db/schemas';

// Runtime validation at API boundary
export async function POST(request: Request) {
  const body = await request.json();
  
  // Zod validates structure + types
  const userData = UsersTableSchema.parse(body);
  
  // TypeScript knows exact structure
  function processUser(user: UsersTable) {
    console.log(user.email); // ✅ Type-safe
    console.log(user.tenant_id); // ✅ Type-safe
  }
  
  processUser(userData);
}
```

## Benefits

### ✅ **Single Source of Truth**
- Database schema → Types → Schemas → Exports
- No manual synchronization needed
- **Matches PRD:** "Schema-first contract SSOT"

### ✅ **Compile-time + Runtime Safety**
- **TypeScript** catches errors at compile time
- **Zod** catches errors at runtime
- Double protection layer
- **Prevents:** Invalid data from reaching database

### ✅ **Canon Consistency**
- All Canons use same types from Kernel
- Guaranteed compatibility
- **Matches Canon Identity governance:** Kernel provides contracts
- **Prevents:** Canon developers from creating incompatible types

### ✅ **API Contract Enforcement**
- Zod schemas validate API boundaries
- Prevents invalid data propagation
- Clear error messages
- **Matches PRD:** "Schema-first everywhere"

### ✅ **Governance Compliance**
- Types are governed by Kernel (CONT_01)
- Canons cannot deviate from Kernel contracts
- Enforces Canon Identity rules
- **Matches:** "Kernel contains zero business logic" but provides contracts

## Complete Flow Example

### 1. Database Schema (Source of Truth)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  email TEXT NOT NULL,
  name TEXT,
  password_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_users_email_tenant UNIQUE (tenant_id, email)
);
```

### 2. Auto-Generated Type
```typescript
// apps/kernel/src/db/generated/types.ts
// Auto-generated from database introspection
export interface UsersTable {
  id: string;
  tenant_id: string;
  email: string;
  name: string | null;
  password_hash: string | null;
  created_at: Date;
  updated_at: Date;
}
```

### 3. Auto-Generated Zod Schema
```typescript
// apps/kernel/src/db/generated/schemas.ts
// Auto-generated from type
import { z } from 'zod';
import type { UsersTable } from './types';

export const UsersTableSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  password_hash: z.string().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
}) satisfies z.ZodType<UsersTable>;
```

### 4. Kernel Export
```typescript
// packages/kernel-core/src/db/index.ts
export type { UsersTable } from '@aibos/kernel/db/generated/types';
export { UsersTableSchema } from '@aibos/kernel/db/generated/schemas';
```

### 5. Canon Usage
```typescript
// apps/canon-demo/src/api/users.ts
import { 
  UsersTableSchema, 
  type UsersTable 
} from '@aibos/kernel-core/db/schemas';

export async function POST(request: Request) {
  const body = await request.json();
  
  // Runtime validation (Zod)
  const user = UsersTableSchema.parse(body);
  
  // Compile-time safety (TypeScript)
  function processUser(user: UsersTable) {
    // TypeScript knows exact structure
    console.log(user.email); // ✅ Type-safe
    console.log(user.tenant_id); // ✅ Type-safe
    
    // TypeScript prevents errors
    // console.log(user.invalid_field); // ❌ Compile error
  }
  
  processUser(user);
}
```

## Migration Path

### Current State (Day 2 - MVP)
- ✅ Manual type annotations (works for MVP)
- ✅ Zod schemas in `@aibos/contracts` (API boundaries)
- ⚠️ Types can drift from schema
- ⚠️ No auto-generation

### Target State (Post-MVP)
- ✅ Auto-generated types from DB schema
- ✅ Auto-generated Zod schemas from types
- ✅ Kernel exports types for Canons
- ✅ Full type safety + runtime validation
- ✅ Canon consistency guaranteed

## Implementation Plan

### Step 1: Add Type Generation Tool (Post-MVP)
```bash
pnpm add -D pg-typed
# or
pnpm add -D @databases/pg-typed
```

### Step 2: Create Generation Scripts
```typescript
// scripts/generate-db-types.ts
// Introspect PostgreSQL and generate TypeScript types

// scripts/generate-zod-schemas.ts
// Generate Zod schemas from TypeScript types
```

### Step 3: Update Build Process
```json
// package.json
{
  "scripts": {
    "db:generate-types": "tsx scripts/generate-db-types.ts",
    "db:generate-schemas": "tsx scripts/generate-zod-schemas.ts",
    "db:generate": "pnpm db:generate-types && pnpm db:generate-schemas"
  }
}
```

### Step 4: Update Kernel Core Exports
```typescript
// packages/kernel-core/src/db/index.ts
export type { ... } from '@aibos/kernel/db/generated/types';
export { ... } from '@aibos/kernel/db/generated/schemas';
```

### Step 5: Update Canon Integration Guide
Document how Canons should import and use Kernel types.

## Conclusion

**Your insight is architecturally correct!** The proper flow should be:

1. **Database Schema** → Source of truth
2. **Auto-generated Types** → Compile-time safety
3. **Zod Schemas** → Runtime validation + API contracts
4. **Kernel Exports** → Canon consumption
5. **Canon Usage** → Guaranteed consistency

This provides:
- ✅ **Type safety** (compile-time)
- ✅ **Runtime validation** (Zod)
- ✅ **API contracts** (Kernel → Canon)
- ✅ **Governance** (Canon Identity compliance)
- ✅ **Single source of truth** (Database → Types → Schemas)

**For MVP (Day 2):** Keep manual types ✅
- Matches PRD decision (avoid heavy ORMs)
- Already implemented
- Works for MVP scope

**For Post-MVP:** Implement auto-generation ✅
- Add `pg-typed` or similar
- Generate Zod schemas from types
- Export from Kernel Core
- Update Canon integration guide

This aligns perfectly with the Canon Identity governance model where Kernel provides contracts to Canons!
