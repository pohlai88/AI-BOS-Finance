# GL-03 Posting Engine — Architecture Brief

> **Cell Code:** GL-03  
> **Domain:** General Ledger (DOM-05)  
> **Status:** 🔴 **CRITICAL — Foundation Cell**  
> **Date:** 2025-12-17

---

## 1. Purpose

GL-03 is the **ONLY** authorized writer to the immutable ledger (`gl_ledger_lines`). It is the central posting authority for the entire Finance Canon.

**Core Responsibility:** Ensure every financial transaction is recorded correctly, completely, and immutably.

---

## 2. Key Responsibilities

| Responsibility | Description |
|---------------|-------------|
| **Posting Authority** | The ONLY component that writes to `gl_ledger_lines` |
| **Invariant Enforcement** | Validates 12+ posting rules before every posting |
| **Period Gatekeeper** | Final validation of period status before posting |
| **Immutability Guardian** | Ensures ledger cannot be modified after posting |
| **Reversal Engine** | Creates reversals (never deletes/updates) |

---

## 3. Dependencies

### Kernel Services Used

| Service | Port | Purpose |
|---------|------|---------|
| K_TIME | `FiscalTimePort` | Period status validation |
| K_COA | `COAPort` | Account validation |
| K_SEQ | `SequencePort` | Posting reference generation |
| K_LOG | `AuditPort` | Posting audit trail |
| K_NOTIFY | `NotifyPort` | Posting notifications |

### Upstream Dependencies (Sources of Entries)

| Cell | What It Sends |
|------|---------------|
| GL-02 | Journal entries (approved) |
| AP-02 | AP invoice postings |
| AP-05 | AP payment postings |
| AR-02 | AR invoice postings |
| AR-03 | AR receipt postings |

### Downstream Consumers

| Cell | What It Reads |
|------|---------------|
| GL-04 | Validates all entries posted before close |
| GL-05 | Reads ledger for trial balance calculation |

---

## 4. Data Model Summary

### Primary Entity: `LedgerLine`

```typescript
interface LedgerLine {
  id: string;
  postingReference: string;  // POST-2024-000001
  postingDate: Date;
  sourceType: 'journal_entry' | 'ap_invoice' | 'ap_payment' | 'ar_invoice' | 'ar_receipt';
  sourceId: string;
  accountCode: string;
  debitAmount: string;       // String for precision
  creditAmount: string;
  currency: string;
  fiscalYear: number;
  fiscalPeriod: number;
  isReversal: boolean;
  postedBy: string;
  postedAt: Date;
  // NO updatedAt - IMMUTABLE
}
```

### Key Invariant: **IMMUTABLE AFTER POSTING**

```sql
CREATE TRIGGER trg_ledger_immutable
BEFORE UPDATE OR DELETE ON gl_ledger_lines
FOR EACH ROW
EXECUTE FUNCTION prevent_ledger_modification();
```

---

## 5. Key Business Rules

| Rule | Enforcement | CONT_07 Reference |
|------|-------------|------------------|
| Entry must balance | DB constraint + service | Appendix H #1 |
| All accounts must be postable | Service validation | Appendix H #2 |
| Period must be open | Service validation | Section 3.2 |
| Entry type must be allowed | Service validation | Section 3.2.2 |
| No duplicate posting | Idempotency check | Section 5.1 |
| Ledger is immutable | DB trigger | Section 5.1 |

---

## 6. Core Operations

| Operation | Input | Output |
|-----------|-------|--------|
| `postJournalEntry` | JE from GL-02 | PostingResult |
| `postSubledgerEntry` | Entry from AP/AR | PostingResult |
| `createReversal` | Original posting ref | ReversalResult |
| `processAutoReverse` | Scheduled job | AutoReverseResult |
| `validatePosting` | Entry data | ValidationResult |

---

## 7. API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/gl/posting/journal-entry` | Post journal entry |
| POST | `/gl/posting/subledger` | Post subledger entry |
| POST | `/gl/posting/reversal` | Create reversal |
| GET | `/gl/posting/:reference` | Get posting by reference |
| GET | `/gl/posting/source/:type/:id` | Get posting by source |

---

## 8. Integration Pattern

```
GL-02                          GL-03                         DB
  │                              │                            │
  │ POST /approve                │                            │
  │──────────────────────────────>                            │
  │                              │                            │
  │                              │ Validate all invariants    │
  │                              │<───────────────────────────│
  │                              │                            │
  │                              │ BEGIN TRANSACTION          │
  │                              │────────────────────────────>
  │                              │                            │
  │                              │ INSERT ledger lines        │
  │                              │────────────────────────────>
  │                              │                            │
  │                              │ UPDATE JE → POSTED         │
  │                              │────────────────────────────>
  │                              │                            │
  │                              │ INSERT audit event         │
  │                              │────────────────────────────>
  │                              │                            │
  │                              │ COMMIT                     │
  │                              │────────────────────────────>
  │                              │                            │
  │ PostingResult                │                            │
  │<──────────────────────────────                            │
```

---

## 9. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Posting latency | < 500ms P99 |
| Throughput | 100 entries/second |
| Availability | 99.9% |
| Data durability | Zero loss |

---

## 10. File Structure

```
gl03-posting-engine/
├── __tests__/
│   └── PostingEngineService.test.ts
├── ARCHITECTURE-BRIEF.md         ← This file
├── ARCHITECTURE-REVIEW.md        ← Quality gate review
├── DashboardService.ts           ← Posting metrics
├── errors.ts                     ← Error factory
├── index.ts                      ← Barrel exports
├── PostingEngineService.ts       ← Main domain service
└── PRD-gl03-posting-engine.md    ← Requirements
```

---

## 11. Implementation Checklist

- [ ] Create `errors.ts` — Error factory
- [ ] Create `PostingEngineService.ts` — Domain service
- [ ] Create `DashboardService.ts` — Dashboard metrics
- [ ] Create `index.ts` — Barrel exports
- [ ] Create `ARCHITECTURE-REVIEW.md` — Quality gate
- [ ] Add ledger repository port to `@aibos/kernel-core`
- [ ] Add SQL adapter to `@aibos/kernel-adapters`
- [ ] Create DB migration for `gl_ledger_lines`
- [ ] Create immutability trigger
- [ ] Create `__tests__/PostingEngineService.test.ts`

---

**📅 Date:** 2025-12-17  
**👤 Author:** AI-BOS Architecture Team
