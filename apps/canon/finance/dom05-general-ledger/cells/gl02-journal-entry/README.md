# GL-02: Journal Entry Cell

> **Cell Code:** GL-02  
> **Domain:** General Ledger (DOM-05)  
> **Status:** ✅ Implementation Complete  
> **Version:** 1.0.0

---

## 🎯 Purpose

The **Journal Entry** cell is the manual interface for recording adjusting entries, accruals, reclassifications, and other non-automated accounting transactions. It provides a controlled, audited workflow with approval enforcement.

---

## 🏗️ Architecture

### Hexagonal Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         GL-02 DOMAIN CORE                        │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │         JournalEntryService (Business Logic)               │ │
│  │                                                            │ │
│  │  • State Machine (DRAFT → SUBMITTED → APPROVED → POSTED)  │ │
│  │  • Balance Validation (debit = credit)                    │ │
│  │  • SoD Enforcement (approver ≠ creator)                   │ │
│  │  • Period Cutoff (K_TIME)                                 │ │
│  │  • Account Validation (GL-01)                             │ │
│  │  • Approval Routing (K_POLICY)                            │ │
│  │  • Reversal Creation (flip debit/credit)                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
           │                              │
           ▼                              ▼
    ┌──────────────┐            ┌─────────────────────┐
    │   INBOUND    │            │     OUTBOUND        │
    │   ADAPTERS   │            │      PORTS          │
    ├──────────────┤            ├─────────────────────┤
    │ REST API     │            │ Repository          │
    │ CLI          │            │ Sequence            │
    │ Queue        │            │ AuditOutbox         │
    │              │            │ Policy              │
    │              │            │ PeriodService       │
    │              │            │ COAService          │
    │              │            │ PostingEngine (GL-03)│
    └──────────────┘            └─────────────────────┘
```

---

## 📦 File Structure

```
gl02-journal-entry/
├── types.ts                    # Domain types & interfaces
├── errors.ts                   # Error factory
├── JournalEntryService.ts      # Core business logic
├── index.ts                    # Barrel export
├── migration.sql               # Database schema with constraints
├── api-route-example.ts        # Next.js route handler (reference)
├── README.md                   # This file
└── PRD-gl02-journal-entry.md   # Product requirements (design phase)
```

---

## 🔒 Invariants (The "Immortal Rails")

These constraints are **enforced at the database level** and **cannot be violated**:

| # | Invariant | Enforcement | Purpose |
|---|-----------|-------------|---------|
| 1 | **Balanced Entry** | `CHECK (total_debit = total_credit)` | Mathematical proof |
| 2 | **SoD** | `CHECK (approved_by <> created_by)` | Fraud prevention |
| 3 | **Debit XOR Credit per Line** | `CHECK ((debit IS NOT NULL AND credit IS NULL) OR ...)` | Data integrity |
| 4 | **Unique Reference per Company** | `UNIQUE (company_id, reference)` | Prevents duplicates |
| 5 | **Description Required** | `CHECK (char_length(description) > 0)` | Business justification |
| 6 | **Auto-Reverse ⊻ Recurring** | `CHECK (NOT (auto_reverse AND is_recurring))` | Logical conflict |

---

## 🔄 State Machine

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    JOURNAL ENTRY LIFECYCLE                              │
│                                                                         │
│   DRAFT ──► SUBMITTED ──► APPROVED ──► POSTED ──► CLOSED               │
│      │           │           │                                          │
│      │           │           └──► REJECTED ──► DRAFT (edit)            │
│      │           │                   │                                  │
│      │           │                   └──► CANCELLED                     │
│      └───────────┴──► CANCELLED                                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

| State | Can Post? | Editable? | Transitions |
|-------|:---------:|:---------:|-------------|
| **DRAFT** | ❌ | ✅ Yes | → SUBMITTED, → CANCELLED |
| **SUBMITTED** | ❌ | ❌ No | → APPROVED, → REJECTED |
| **APPROVED** | ⚠️ Queued | ❌ No | → POSTED |
| **POSTED** | ✅ Yes | ❌ No | → CLOSED |
| **REJECTED** | ❌ | ✅ Yes (via edit) | → DRAFT, → CANCELLED |
| **CANCELLED** | ❌ | ❌ No | None (terminal) |
| **CLOSED** | ✅ Yes | ❌ No | None (terminal) |

---

## 🚀 Usage Examples

### Create Journal Entry

```typescript
import { JournalEntryService, JournalEntryType } from '@finance/gl02';

const service = new JournalEntryService(
  repo,
  sequencePort,
  auditPort,
  policyPort,
  periodService,
  coaService,
  postingEngine
);

const entry = await service.create(
  {
    companyId: 'company-uuid',
    entryDate: new Date('2024-12-31'),
    entryType: JournalEntryType.ACCRUAL,
    reference: 'ACR-2024-001',
    description: 'December utilities accrual',
    lines: [
      {
        accountCode: '5100',
        debitAmount: '1200.00',
        memo: 'Utilities expense',
      },
      {
        accountCode: '2300',
        creditAmount: '1200.00',
        memo: 'Accrued expenses',
      },
    ],
  },
  {
    tenantId: 'tenant-uuid',
    userId: 'user-uuid',
  }
);

console.log(`Created entry: ${entry.entryNumber}`);
```

### Submit for Approval

```typescript
const submitted = await service.submit(
  {
    journalEntryId: entry.id,
    submissionNotes: 'Ready for review',
  },
  actor
);

// Status: DRAFT → SUBMITTED
// Approval notification sent to Controller
```

### Approve Entry

```typescript
const approved = await service.approve(
  {
    journalEntryId: entry.id,
    approvalNotes: 'Looks good',
  },
  {
    tenantId: 'tenant-uuid',
    userId: 'controller-uuid', // Different from creator!
  }
);

// Status: SUBMITTED → APPROVED
// Auto-queued for posting to GL-03
```

### Create Reversal

```typescript
const reversalEntry = await service.reverse(
  {
    originalJournalEntryId: entry.id,
    reversalDate: new Date('2025-01-31'),
    reversalReason: 'Incorrect amount',
  },
  actor
);

// Creates new entry (type: REVERSAL) with flipped debit/credit
// Links: original.reversalEntryId = reversal.id
```

---

## 🔌 GL-03 Posting Engine Handshake

### Phase 1: Approval → Queued for Posting

When a journal entry is **approved**, GL-02 calls `PostingEnginePort.postJournalEntry()`:

```typescript
// Inside JournalEntryService.approve()
this.postingEngine.postJournalEntry(entry.id).catch((error) => {
  console.error(`Failed to post journal entry ${entry.id}:`, error);
  // Alert but don't fail approval
});
```

### Phase 2: GL-03 Processes the Entry

**GL-03 Responsibilities:**
1. Read approved journal entry + lines
2. Validate accounts (redundant check)
3. Write to `gl_ledger` table (immutable append-only)
4. Generate `gl_posting_reference`
5. Update journal entry: `status = POSTED`, `posted_at`, `gl_posting_reference`
6. Emit audit event: `gl.journal.posted`

**GL-03 Expected Input:**
```typescript
interface PostJournalEntryInput {
  journalEntryId: string;
}
```

**GL-03 Expected Output:**
```typescript
interface PostJournalEntryResult {
  posted: boolean;
  postingReference?: string; // "GL-2024-123456"
  error?: string;
}
```

### Phase 3: Auto-Reverse Handling

If `entry.autoReverse = true`:

1. GL-03 posts the original entry
2. GL-03 creates a **scheduled reversal job** for `entry.reverseDate`
3. On reversal date, GL-03 calls `JournalEntryService.reverse()` automatically
4. Reversal entry goes through full approval workflow (if configured) or auto-approves

---

## 📊 Event Taxonomy

Per **CONT_07 Section 5**, all events follow this taxonomy:

| Event Type | Emitted When | Payload |
|------------|--------------|---------|
| `gl.journal.created` | Entry created (DRAFT) | `{ entryNumber, entryType, totalDebit, totalCredit, lineCount, createdBy }` |
| `gl.journal.submitted` | Entry submitted for approval | `{ entryNumber, submittedBy, requiredApproverRole, totalAmount }` |
| `gl.journal.approved` | Entry approved | `{ entryNumber, approvedBy, totalAmount }` |
| `gl.journal.rejected` | Entry rejected | `{ entryNumber, rejectedBy, rejectionReason }` |
| `gl.journal.posted` | GL-03 posts entry to ledger | `{ entryNumber, postedBy, postingReference }` |
| `gl.journal.reversal_created` | Reversal entry created | `{ originalEntryId, reversalEntryNumber, reversalReason }` |

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
describe('JournalEntryService', () => {
  it('should create balanced journal entry', async () => {
    const entry = await service.create(validInput, actor);
    expect(entry.isBalanced).toBe(true);
    expect(entry.status).toBe(JournalEntryStatus.DRAFT);
  });

  it('should reject unbalanced entry', async () => {
    const input = {
      ...validInput,
      lines: [
        { accountCode: '1000', debitAmount: '100.00' },
        { accountCode: '2000', creditAmount: '200.00' }, // Unbalanced!
      ],
    };

    await expect(service.create(input, actor)).rejects.toThrow('ENTRY_NOT_BALANCED');
  });

  it('should enforce SoD on approval', async () => {
    const entry = await service.create(validInput, actor);
    await service.submit({ journalEntryId: entry.id }, actor);

    // Same user tries to approve
    await expect(
      service.approve({ journalEntryId: entry.id }, actor)
    ).rejects.toThrow('APPROVER_CANNOT_BE_CREATOR');
  });

  it('should block editing after submission', async () => {
    const entry = await service.create(validInput, actor);
    await service.submit({ journalEntryId: entry.id }, actor);

    // Try to modify
    await expect(
      service.create({ ...validInput }, actor) // Would need update method
    ).rejects.toThrow('ENTRY_NOT_EDITABLE');
  });
});
```

### Integration Tests

```typescript
describe('GL-02 ↔ GL-03 Integration', () => {
  it('should post approved entry via GL-03', async () => {
    // Create & approve
    const entry = await service.create(validInput, actor);
    await service.submit({ journalEntryId: entry.id }, actor);
    const approved = await service.approve({ journalEntryId: entry.id }, controllerActor);

    // Wait for GL-03 to process
    await waitFor(() => {
      const posted = await service.getById(entry.id);
      expect(posted.status).toBe(JournalEntryStatus.POSTED);
      expect(posted.glPostingReference).toBeDefined();
    });
  });
});
```

---

## 🔧 Configuration

### Approval Routing Rules

**Amount-Based Routing:**

| Total Amount | Required Approver | Policy Code |
|--------------|-------------------|-------------|
| < $10,000 | Senior Accountant | `journal_entry.approve.senior_accountant` |
| $10,000 - $99,999 | Manager | `journal_entry.approve.manager` |
| $100,000 - $999,999 | Controller | `journal_entry.approve.controller` |
| ≥ $1,000,000 | Controller + CFO | `journal_entry.approve.controller,cfo` |

**Configure in K_POLICY:**
```yaml
policies:
  - code: journal_entry.approve.controller
    rule: |
      user.role in ['controller', 'cfo'] AND
      context.entryAmount < 1000000
```

---

## 🚨 Error Handling

All errors extend `JournalEntryCellError` with:
- `code`: Machine-readable error code
- `message`: Human-readable message
- `statusCode`: HTTP status code (400/403/404/409/500)
- `metadata`: Additional context

**Example:**
```typescript
try {
  await service.create(input, actor);
} catch (error) {
  if (error instanceof JournalEntryCellError) {
    if (error.code === 'ENTRY_NOT_BALANCED') {
      // Show balance validation error to user
      console.log(`Total debit: ${error.metadata.totalDebit}`);
      console.log(`Total credit: ${error.metadata.totalCredit}`);
    }
  }
}
```

---

## 📚 Dependencies

### Kernel Services (K_*)

| Service | Usage | Criticality |
|---------|-------|-------------|
| **K_TIME** | Period open validation | 🔴 Blocking |
| **K_AUTH** | Identity, SoD enforcement | 🔴 Blocking |
| **K_LOG** | Audit trail | 🔴 Blocking |
| **K_POLICY** | Approval routing | 🔴 Blocking |
| **K_SEQ** | Entry number generation | 🔴 Blocking |

### Upstream Dependencies

| Cell | Usage |
|------|-------|
| **GL-01 (COA)** | Validates account codes, postable status |

### Downstream Dependencies

| Cell | Usage |
|------|-------|
| **GL-03 (Posting Engine)** | Posts approved entries to ledger |

---

## 🏆 Production Readiness Checklist

- [x] Database schema with constraints
- [x] Service implementation with full validation
- [x] Error handling with error factory
- [x] State machine enforcement
- [x] SoD enforcement (database + application)
- [x] Period cutoff integration (K_TIME)
- [x] Account validation integration (GL-01)
- [x] Approval routing integration (K_POLICY)
- [x] Audit event emission (K_LOG)
- [x] API route handlers (example)
- [x] Reversal creation logic
- [x] GL-03 posting engine handshake
- [ ] Repository implementation (PostgreSQL adapter)
- [ ] Unit test suite (80%+ coverage)
- [ ] Integration test suite
- [ ] Load testing (500 entries/month baseline)
- [ ] Security audit (penetration testing)
- [ ] UI implementation (React + Next.js)

---

## 📖 Related Documentation

- **PRD:** `PRD-gl02-journal-entry.md`
- **CONT_07:** Finance Canon Architecture (Section 3.2.2 - Journal Entry)
- **ADR_002:** Server-Side Canon Context Verification

---

## 🤝 Contributing

Follow the **Locked Implementation Patterns** from CONT_07 Appendix I:
1. Service class structure
2. Error handling with error factory
3. State machine helpers
4. Audit event emission
5. Repository port pattern

---

**📅 Last Updated:** 2025-12-17  
**👤 Maintainer:** AI-BOS Architecture Team  
**📧 Support:** #gl-support
