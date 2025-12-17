# GL-02 Journal Entry — Architecture Refactor

> **Status:** 🔄 **REFACTOR REQUIRED**  
> **Date:** 2025-12-17  
> **Issue:** Current implementation violates Hexagonal Architecture (CONT_07)

---

## 🔴 Problem: What I Built Wrong

### Current Structure (WRONG)

```
gl02-journal-entry/
├── types.ts              ← MIXED: domain types + port interfaces  
├── errors.ts
├── JournalEntryService.ts ← Service with LOCAL port definitions
├── migration.sql         ← Should be in adapters
├── api-route-example.ts  ← Should be inbound adapter
└── index.ts
```

**Problems:**

1. **Ports defined locally** instead of in `@aibos/kernel-core`
2. **Adapter (migration.sql) mixed with domain** instead of in `@aibos/kernel-adapters`
3. **No proper separation** of domain/ports/adapters layers
4. **Duplicate port definitions** — I redefined ports that already exist in kernel-core

---

## ✅ Solution: Proper Hexagonal Architecture

### Step 1: Use Existing Kernel-Core Ports

The following ports **already exist** in `@aibos/kernel-core/src/ports/`:

| My Local Definition | Should Use From kernel-core |
|--------------------|-----------------------------|
| `PeriodServicePort` | `FiscalTimePort` ✅ |
| `COAServicePort` | `COAPort` ✅ |
| `SequencePort` (local) | `SequencePort` ✅ |
| `PostingEnginePort` | `GLPostingPort` ✅ |
| `AuditOutboxPort` | `AuditPort` ✅ |
| `PolicyPort` (local) | `PolicyPort` ✅ |
| `JournalEntryRepositoryPort` | **NOW ADDED** ✅ |

### Step 2: Proper Directory Structure

```
packages/
├── kernel-core/src/ports/
│   ├── journalEntryRepositoryPort.ts  ← ✅ NOW CREATED
│   ├── fiscalTimePort.ts              ← Already exists
│   ├── coaPort.ts                     ← Already exists
│   ├── sequencePort.ts                ← Already exists
│   ├── glPostingPort.ts               ← Already exists
│   ├── auditPort.ts                   ← Already exists
│   └── policyPort.ts                  ← Already exists
│
├── kernel-adapters/src/sql/
│   ├── journalEntryRepo.sql.ts        ← ✅ NOW CREATED
│   └── ...other SQL adapters

apps/canon/finance/dom05-general-ledger/cells/gl02-journal-entry/
├── domain/
│   ├── JournalEntryService.ts         ← Pure domain logic
│   └── errors.ts                      ← Domain errors
├── index.ts                           ← Re-exports, imports from @aibos/kernel-core
└── PRD-gl02-journal-entry.md          ← Requirements
```

### Step 3: Refactored JournalEntryService

**Before (WRONG):**
```typescript
// types.ts - LOCAL port definitions
export interface JournalEntryRepositoryPort { ... }
export interface PeriodServicePort { ... }
export interface COAServicePort { ... }

// JournalEntryService.ts
import { JournalEntryRepositoryPort, PeriodServicePort } from './types';
```

**After (CORRECT):**
```typescript
// JournalEntryService.ts
import {
  JournalEntryRepositoryPort,
  JournalEntry,
  JournalEntryStatus,
  CreateJournalEntryInput,
} from '@aibos/kernel-core';

import {
  FiscalTimePort,
  COAPort,
  SequencePort,
  GLPostingPort,
  AuditPort,
  PolicyPort,
} from '@aibos/kernel-core';
```

---

## 📦 What Was Created

### 1. `@aibos/kernel-core/src/ports/journalEntryRepositoryPort.ts`

**Purpose:** Port interface for journal entry persistence

**Exports:**
- `JournalEntry` — Domain entity
- `JournalEntryLine` — Line entity
- `JournalEntryAttachment` — Attachment entity
- `JournalEntryStatus` — Status enum
- `JournalEntryType` — Type enum
- `JournalEntryRepositoryPort` — Repository interface
- `CreateJournalEntryInput` — Create input DTO
- `UpdateJournalEntryInput` — Update input DTO
- `JournalEntryFilter` — Filter DTO
- `PaginationOptions` — Pagination DTO
- `PaginatedResult<T>` — Paginated result
- `TransactionContext` — Transaction context for atomic operations

### 2. `@aibos/kernel-adapters/src/sql/journalEntryRepo.sql.ts`

**Purpose:** PostgreSQL implementation of JournalEntryRepositoryPort

**Features:**
- Full CRUD operations
- Transaction management
- Optimistic locking with version
- Pagination support
- Filter queries
- Automatic total recomputation from lines

---

## 🔧 Refactor Checklist

### Phase 1: Move Types to kernel-core ✅ DONE
- [x] Create `journalEntryRepositoryPort.ts` in kernel-core
- [x] Export from kernel-core index
- [x] Create SQL adapter in kernel-adapters
- [x] Export from kernel-adapters index

### Phase 2: Refactor GL-02 Service ⬜ PENDING
- [ ] Update imports to use `@aibos/kernel-core`
- [ ] Remove local port definitions from `types.ts`
- [ ] Keep only cell-specific types in `types.ts` (ActorContext, etc.)
- [ ] Update service to use imported types

### Phase 3: Move Migration to Adapters ⬜ PENDING
- [ ] Move `migration.sql` to proper location (or keep as documentation)
- [ ] Ensure DB-GUARDRAILS.sql is referenced properly

### Phase 4: Update API Routes ⬜ PENDING
- [ ] Refactor `api-route-example.ts` into proper inbound adapter
- [ ] Use dependency injection for service instantiation

---

## 🏗️ Dependency Injection Pattern

### Proper Wiring (in Next.js route handler)

```typescript
// apps/web/app/api/gl/journal-entries/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Ports from kernel-core
import type {
  JournalEntryRepositoryPort,
  FiscalTimePort,
  COAPort,
  SequencePort,
  AuditPort,
} from '@aibos/kernel-core';

// Adapters from kernel-adapters
import {
  createJournalEntryRepository,
  createSqlSequenceAdapter,
  createSqlCOAAdapter,
} from '@aibos/kernel-adapters';

// Domain service from cell
import { JournalEntryService } from '@/canon/finance/dom05-general-ledger/cells/gl02-journal-entry';

// Create pool (singleton in production)
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Wire up adapters to ports
const journalEntryRepo = createJournalEntryRepository(pool);
const sequenceAdapter = createSqlSequenceAdapter(pool);
const coaAdapter = createSqlCOAAdapter(pool);
// ... other adapters

// Create service with injected dependencies
const journalEntryService = new JournalEntryService({
  repository: journalEntryRepo,
  sequence: sequenceAdapter,
  coa: coaAdapter,
  // ... other ports
});

export async function POST(request: NextRequest) {
  const { canon, payload } = await request.json();
  
  // Verify server-side (per security rules)
  // ... security checks per ADR_002
  
  const result = await journalEntryService.create(payload, actorContext);
  return NextResponse.json(result);
}
```

---

## 📊 Architecture Compliance

| Requirement | Before | After |
|-------------|:------:|:-----:|
| Ports in kernel-core | ❌ Local | ✅ @aibos/kernel-core |
| Adapters in kernel-adapters | ❌ Missing | ✅ @aibos/kernel-adapters |
| Domain layer pure | ⚠️ Mixed | ✅ Pure logic |
| Dependency injection | ❌ None | ✅ Constructor injection |
| Reusable across cells | ❌ No | ✅ Yes |
| Testable with mocks | ⚠️ Hard | ✅ Easy |

---

## 🔄 Migration Steps for Other Cells

If other cells (AR-01, etc.) have similar issues, apply the same refactor:

1. **Identify local port definitions** that duplicate kernel-core
2. **Add missing ports to kernel-core** if truly new
3. **Create SQL adapter** in kernel-adapters
4. **Update cell imports** to use kernel-core
5. **Wire adapters** via dependency injection

---

## ✅ Conclusion

The GL-02 implementation logic is correct, but the **structure violates hexagonal architecture**. The fix is:

1. ✅ Ports moved to `@aibos/kernel-core` (DONE)
2. ✅ Adapters added to `@aibos/kernel-adapters` (DONE)
3. ⬜ Cell refactored to import from packages (PENDING)
4. ⬜ Dependency injection wiring (PENDING)

**Time to complete refactor:** ~1-2 hours

---

**📅 Date:** 2025-12-17  
**👤 Reviewer:** AI-BOS Architecture Team  
**📧 Questions:** #architecture-refactor
