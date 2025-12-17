# GL-02 Journal Entry — Architecture Brief

> **Cell Code:** GL-02  
> **Domain:** General Ledger (DOM-05)  
> **Status:** ✅ **IMPLEMENTED** (pending refactor)  
> **Date:** 2025-12-17

---

## 1. Purpose

GL-02 provides the **manual interface** for creating, managing, and approving journal entries. It is the primary mechanism for adjusting entries, accruals, reclassifications, and corrections.

**Key Point:** GL-02 creates journal entries but does NOT write to the ledger. Posting is handled by GL-03.

---

## 2. Key Responsibilities

| Responsibility | Description |
|---------------|-------------|
| **JE Creation** | Create draft journal entries with lines |
| **Validation** | Validate balance, accounts, period |
| **Approval Workflow** | Submit → Approve/Reject with SoD |
| **Reversal Initiation** | Initiate reversal requests |
| **Recurring Setup** | Configure recurring entries |
| **Auto-Reverse Flagging** | Mark entries for auto-reversal |

---

## 3. Dependencies

### Kernel Services Used

| Service | Port | Purpose |
|---------|------|---------|
| K_SEQ | `SequencePort` | Entry number generation |
| K_TIME | `FiscalTimePort` | Period validation |
| K_COA | `COAPort` | Account validation |
| K_LOG | `AuditPort` | Audit trail |
| K_POLICY | `PolicyPort` | Approval routing |

### Upstream Dependencies

None — GL-02 initiates entries.

### Downstream Consumers

| Cell | Usage |
|------|-------|
| GL-03 Posting Engine | Posts approved entries to ledger |
| GL-04 Period Close | Validates all entries processed |

---

## 4. Data Model Summary

### Primary Entity: `JournalEntry`

```typescript
interface JournalEntry {
  id: string;
  entryNumber: string;
  entryDate: Date;
  entryType: JournalEntryType;
  reference: string;
  description: string;
  totalDebit: string;
  totalCredit: string;
  isBalanced: boolean;
  status: JournalEntryStatus;
  autoReverse: boolean;
  reverseDate?: Date;
  createdBy: string;
  approvedBy?: string;
  version: number;
  lines: JournalEntryLine[];
}
```

### State Machine

```
DRAFT → SUBMITTED → APPROVED → POSTED → CLOSED
           ↓
        REJECTED → DRAFT (revise and resubmit)
           ↓
        CANCELLED
```

---

## 5. Key Business Rules

| Rule | Enforcement | CONT_07 Reference |
|------|-------------|------------------|
| Entry must balance | Service + DB constraint | Appendix H |
| SoD: Approver ≠ Creator | DB constraint | Section 2.1 |
| Debit XOR Credit per line | DB constraint | Appendix H |
| Entry type restrictions by period | Service validation | Section 3.2 |
| Immutable after submission | DB trigger | Section 5.1 |

---

## 6. API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/gl/journal-entries` | Create draft |
| POST | `/gl/journal-entries/:id/submit` | Submit for approval |
| POST | `/gl/journal-entries/:id/approve` | Approve entry |
| POST | `/gl/journal-entries/:id/reject` | Reject entry |
| POST | `/gl/journal-entries/:id/reverse` | Initiate reversal |
| GET | `/gl/journal-entries` | List entries |
| GET | `/gl/journal-entries/:id` | Get entry details |
| PUT | `/gl/journal-entries/:id` | Update draft |

---

## 7. Integration with GL-03

```typescript
// After approval, GL-02 triggers GL-03 posting
const postingResult = await postingEngine.postJournalEntry({
  journalEntryId: entry.id,
  tenantId: entry.tenantId,
  companyId: entry.companyId,
  entryDate: entry.entryDate,
  entryType: entry.entryType,
  reference: entry.reference,
  description: entry.description,
  lines: entry.lines.map(convertToPostingLine),
  postedBy: actor.userId,
});

// Update JE status to POSTED
await updateJournalEntryStatus(entry.id, 'posted', {
  glPostingReference: postingResult.postingReference,
  postedAt: postingResult.postedAt,
  postedBy: actor.userId,
});
```

---

## 8. File Structure

```
gl02-journal-entry/
├── __tests__/
│   └── JournalEntryService.test.ts
├── ARCHITECTURE-BRIEF.md         ← This file
├── ARCHITECTURE-REVIEW.md        ← Quality gate review
├── DashboardService.ts           ← JE dashboard metrics
├── errors.ts                     ← Error factory ✅
├── index.ts                      ← Barrel exports ✅
├── JournalEntryService.ts        ← Main domain service ✅
├── types.ts                      ← Local types (to refactor)
└── PRD-gl02-journal-entry.md     ← Requirements ✅
```

---

## 9. Implementation Status

| File | Status | Notes |
|------|:------:|-------|
| PRD | ✅ | Complete |
| errors.ts | ✅ | Complete |
| JournalEntryService.ts | ✅ | Complete (~770 lines) |
| types.ts | ⚠️ | Needs refactor to use kernel-core |
| DashboardService.ts | ✅ | Now complete |
| index.ts | ✅ | Complete |
| ARCHITECTURE-BRIEF.md | ✅ | This file |
| ARCHITECTURE-REVIEW.md | ⬜ | Pending |
| Tests | ⬜ | Pending |

---

## 10. Refactor Notes

**Current Issue:** Types and ports defined locally in `types.ts` instead of using `@aibos/kernel-core`.

**Fix Applied:**
- ✅ `JournalEntryRepositoryPort` added to `kernel-core`
- ✅ SQL adapter added to `kernel-adapters`
- ⬜ Service needs to import from `@aibos/kernel-core`

See `ARCHITECTURE-REFACTOR.md` for details.

---

**📅 Date:** 2025-12-17  
**👤 Author:** AI-BOS Architecture Team
