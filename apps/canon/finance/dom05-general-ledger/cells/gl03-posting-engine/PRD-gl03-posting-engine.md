# PRD: GL-03 Posting Engine

> **Cell Code:** GL-03  
> **Domain:** General Ledger (DOM-05)  
> **Status:** 🔴 **CRITICAL — Foundation Cell**  
> **Priority:** P1 — Must be implemented before any other posting operations  
> **PRD Version:** 1.0  
> **Date:** 2025-12-17

---

## 1. Executive Summary

### 1.1 Business Justification

GL-03 is the **ONLY** component authorized to write to the immutable ledger (`gl_ledger_lines`). It is the **gatekeeper** that ensures:

- **Double-entry integrity**: Every entry balances (debit = credit)
- **Period cutoff enforcement**: No posting to closed periods
- **Account validation**: Only active, postable accounts
- **Audit completeness**: Every posting creates evidence
- **Immutability**: Posted entries cannot be modified

**Without GL-03, there is NO LEDGER.**

### 1.2 AIS Cycle Reference

| AIS Component | Application |
|---------------|-------------|
| **Processing Integrity** | Ensures balanced entries, validates invariants |
| **Transaction Recording** | Central point for all GL postings |
| **Audit Trail** | Immutable ledger with complete evidence |
| **Period Controls** | Enforces fiscal period boundaries |

### 1.3 COSO Framework Alignment

| COSO Component | GL-03 Implementation |
|----------------|---------------------|
| **Control Environment** | Central posting authority |
| **Risk Assessment** | Validates all invariants before posting |
| **Control Activities** | DB triggers, constraints, RLS |
| **Information & Communication** | Posting events, audit logs |
| **Monitoring** | Dashboard, reconciliation |

---

## 2. Scope

### 2.1 In Scope

| Feature | Description |
|---------|-------------|
| **Journal Entry Posting** | Post approved JEs from GL-02 to ledger |
| **Subledger Posting** | Post AP/AR entries to ledger |
| **Posting Validation** | Validate all invariants before posting |
| **Reversal Creation** | Generate reversal entries for corrections |
| **Auto-Reverse Execution** | Process scheduled auto-reverse entries |
| **Posting Reference Generation** | Generate unique posting references |
| **Idempotent Posting** | Prevent duplicate postings |
| **Period Lock Enforcement** | Final validation of period status |
| **Ledger Immutability** | DB triggers prevent modification |

### 2.2 Out of Scope

| Feature | Reason |
|---------|--------|
| Journal entry creation | Handled by GL-02 |
| Period management | Handled by GL-04 |
| Trial balance generation | Handled by GL-05 |
| Account management | Handled by GL-01 |
| Approval workflow | Handled by source cells |

---

## 3. Dependencies

### 3.1 Kernel Services (Mandatory)

| Service | Port | Purpose | Reliability |
|---------|------|---------|-------------|
| K_TIME | `FiscalTimePort` | Period status validation | Sync, blocking |
| K_COA | `COAPort` | Account validation | Sync, blocking |
| K_SEQ | `SequencePort` | Posting reference generation | Sync, blocking |
| K_LOG | `AuditPort` | Posting audit trail | Sync, transactional |
| K_NOTIFY | `NotifyPort` | Posting notifications | Async |

### 3.2 Upstream Dependencies (Source of Entries)

| Cell | Integration | Data Flow |
|------|-------------|-----------|
| GL-02 Journal Entry | Sync call | JE → Posting |
| AP-02 Invoice Entry | Sync call | Invoice → Posting |
| AP-05 Payment Execution | Sync call | Payment → Posting |
| AR-02 Sales Invoice | Sync call | Invoice → Posting |
| AR-03 Receipt Processing | Sync call | Receipt → Posting |

### 3.3 Downstream Consumers

| Cell | Usage |
|------|-------|
| GL-04 Period Close | Validates all postings complete |
| GL-05 Trial Balance | Reads from ledger for TB calculation |

---

## 4. Data Model

### 4.1 Primary Entity: `LedgerLine`

```typescript
interface LedgerLine {
  // Identity
  id: string;
  tenantId: string;
  companyId: string;
  
  // Posting Reference
  postingReference: string;  // POST-2024-000001
  postingDate: Date;
  postingTimestamp: Date;    // Exact time of posting
  
  // Source Entry
  sourceType: 'journal_entry' | 'ap_invoice' | 'ap_payment' | 'ar_invoice' | 'ar_receipt';
  sourceId: string;
  sourceLineId?: string;
  
  // Account
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  
  // Amounts (string for precision - NO FLOATS)
  debitAmount: string;
  creditAmount: string;
  currency: string;
  functionalAmount?: string;
  exchangeRate?: string;
  
  // Period
  fiscalYear: number;
  fiscalPeriod: number;
  periodCode: string;  // "2024-12"
  
  // Description
  description: string;
  
  // Dimensions
  costCenter?: string;
  project?: string;
  department?: string;
  segment?: string;
  
  // Reversal
  isReversal: boolean;
  reversesLineId?: string;
  reversedByLineId?: string;
  
  // Audit (IMMUTABLE after posting)
  postedBy: string;
  postedAt: Date;
  
  // NO updatedAt or updatedBy - IMMUTABLE
}
```

### 4.2 Supporting Entity: `PostingBatch`

```typescript
interface PostingBatch {
  id: string;
  tenantId: string;
  companyId: string;
  
  // Batch Info
  batchReference: string;
  batchDate: Date;
  
  // Source
  sourceType: string;
  sourceCount: number;
  
  // Status
  status: 'pending' | 'processing' | 'completed' | 'failed';
  
  // Results
  totalEntries: number;
  postedEntries: number;
  failedEntries: number;
  totalDebit: string;
  totalCredit: string;
  
  // Timing
  startedAt: Date;
  completedAt?: Date;
  
  // Errors
  errors?: PostingError[];
}
```

---

## 5. Core Operations

### 5.1 Post Journal Entry

**Purpose:** Post an approved journal entry from GL-02.

```typescript
interface PostJournalEntryInput {
  journalEntryId: string;
  tenantId: string;
  companyId: string;
  entryDate: Date;
  entryType: JournalEntryType;
  reference: string;
  description: string;
  lines: JournalEntryLine[];
  postedBy: string;
}

interface PostingResult {
  success: boolean;
  postingReference?: string;
  ledgerLineIds?: string[];
  totalDebit: string;
  totalCredit: string;
  postedAt?: Date;
  error?: PostingError;
}
```

**Validation Flow:**

```
1. IDEMPOTENCY CHECK
   ├── Check if journalEntryId already posted
   └── If yes → Return existing posting reference

2. PERIOD VALIDATION (K_TIME)
   ├── Get period status for entryDate
   ├── Validate period is OPEN (or SOFT_CLOSE + allowed type)
   └── If HARD_CLOSE → REJECT

3. ENTRY TYPE VALIDATION
   ├── If SOFT_CLOSE → Only ADJUSTING, ACCRUAL allowed
   ├── If CONTROLLED_REOPEN → Only CORRECTION allowed
   └── If entry type not allowed → REJECT

4. ACCOUNT VALIDATION (K_COA)
   ├── For each line:
   │   ├── Validate account exists
   │   ├── Validate account is ACTIVE
   │   └── Validate account is POSTABLE
   └── If any invalid → REJECT with details

5. BALANCE VALIDATION
   ├── Calculate total debits
   ├── Calculate total credits
   ├── Validate debit = credit
   └── If unbalanced → REJECT

6. GENERATE POSTING REFERENCE (K_SEQ)
   └── POST-{YYYY}-{NNNNNN}

7. BEGIN TRANSACTION
   ├── Insert ledger lines
   ├── Update journal entry status → POSTED
   ├── Update journal entry posting reference
   ├── Emit audit event (K_LOG)
   └── COMMIT or ROLLBACK

8. EMIT NOTIFICATION (K_NOTIFY)
   └── finance.gl.journal.posted
```

### 5.2 Create Reversal

**Purpose:** Create a reversal posting for an existing posted entry.

```typescript
interface CreateReversalInput {
  originalPostingReference: string;
  reversalDate: Date;
  reason: string;
  reversedBy: string;
}

interface ReversalResult {
  success: boolean;
  reversalReference?: string;
  reversalLineIds?: string[];
  error?: PostingError;
}
```

**Reversal Logic:**
- Create new ledger lines with debits/credits swapped
- Link reversal to original (`reversesLineId`)
- Mark original as reversed (`reversedByLineId`)
- Original lines remain immutable (never deleted/updated)

### 5.3 Process Auto-Reverse

**Purpose:** Scheduled job to process entries with `autoReverse = true`.

```typescript
interface AutoReverseJob {
  runDate: Date;
  tenantId: string;
}

interface AutoReverseResult {
  processed: number;
  succeeded: number;
  failed: number;
  details: Array<{
    journalEntryId: string;
    status: 'reversed' | 'failed';
    reversalReference?: string;
    error?: string;
  }>;
}
```

---

## 6. Posting Invariants (CONT_07 Appendix H)

### 6.1 Invariant Catalog

| # | Invariant | Enforcement | Error Code |
|---|-----------|-------------|------------|
| 1 | Entry must balance | DB constraint + service | `UNBALANCED_ENTRY` |
| 2 | All accounts must be postable | Service validation | `ACCOUNT_NOT_POSTABLE` |
| 3 | All accounts must be active | Service validation | `ACCOUNT_INACTIVE` |
| 4 | Period must be open | Service validation | `PERIOD_CLOSED` |
| 5 | Entry type must be allowed | Service validation | `ENTRY_TYPE_NOT_ALLOWED` |
| 6 | No duplicate posting | Idempotency check | `ALREADY_POSTED` |
| 7 | Posting reference unique | DB constraint | `DUPLICATE_REFERENCE` |
| 8 | Debit XOR Credit per line | DB constraint | `INVALID_LINE_AMOUNTS` |
| 9 | Amount > 0 | DB constraint | `INVALID_AMOUNT` |
| 10 | Currency must match account | Service validation | `CURRENCY_MISMATCH` |
| 11 | All lines same currency | Service validation | `MIXED_CURRENCIES` |
| 12 | Source ID must exist | FK constraint | `INVALID_SOURCE` |

### 6.2 Database Constraints

```sql
-- Ledger Lines Table
CREATE TABLE gl_ledger_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  company_id UUID NOT NULL,
  
  posting_reference VARCHAR(20) NOT NULL,
  posting_date DATE NOT NULL,
  posting_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  source_type VARCHAR(20) NOT NULL,
  source_id UUID NOT NULL,
  source_line_id UUID,
  
  account_code VARCHAR(20) NOT NULL,
  account_name VARCHAR(200) NOT NULL,
  account_type VARCHAR(20) NOT NULL,
  
  debit_amount NUMERIC(18, 2),
  credit_amount NUMERIC(18, 2),
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  functional_amount NUMERIC(18, 2),
  exchange_rate NUMERIC(12, 6),
  
  fiscal_year INTEGER NOT NULL,
  fiscal_period INTEGER NOT NULL,
  period_code VARCHAR(10) NOT NULL,
  
  description TEXT NOT NULL,
  
  cost_center VARCHAR(20),
  project VARCHAR(20),
  department VARCHAR(20),
  segment VARCHAR(20),
  
  is_reversal BOOLEAN NOT NULL DEFAULT FALSE,
  reverses_line_id UUID REFERENCES gl_ledger_lines(id),
  reversed_by_line_id UUID,
  
  posted_by UUID NOT NULL,
  posted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- INVARIANT CONSTRAINTS
  CONSTRAINT chk_debit_xor_credit 
    CHECK ((debit_amount IS NOT NULL AND credit_amount IS NULL) OR 
           (debit_amount IS NULL AND credit_amount IS NOT NULL)),
  
  CONSTRAINT chk_amount_positive
    CHECK (COALESCE(debit_amount, 0) >= 0 AND COALESCE(credit_amount, 0) >= 0),
  
  CONSTRAINT chk_amount_not_zero
    CHECK (COALESCE(debit_amount, 0) > 0 OR COALESCE(credit_amount, 0) > 0)
);

-- Unique posting reference
CREATE UNIQUE INDEX uq_posting_reference 
ON gl_ledger_lines(company_id, posting_reference);

-- Idempotency: prevent duplicate posting of same source
CREATE UNIQUE INDEX uq_source_posting 
ON gl_ledger_lines(source_type, source_id, source_line_id) 
WHERE source_line_id IS NOT NULL;

-- Performance indexes
CREATE INDEX idx_ledger_period ON gl_ledger_lines(company_id, period_code);
CREATE INDEX idx_ledger_account ON gl_ledger_lines(company_id, account_code, posting_date);
CREATE INDEX idx_ledger_source ON gl_ledger_lines(source_type, source_id);
```

### 6.3 Immutability Trigger

```sql
-- IMMUTABLE LEDGER: Block all updates and deletes
CREATE OR REPLACE FUNCTION prevent_ledger_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'IMMUTABLE_LEDGER: Cannot modify or delete ledger lines. Use reversal instead.'
    USING ERRCODE = 'integrity_constraint_violation';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ledger_immutable
BEFORE UPDATE OR DELETE ON gl_ledger_lines
FOR EACH ROW
EXECUTE FUNCTION prevent_ledger_modification();
```

---

## 7. Integration Contracts

### 7.1 GL-02 → GL-03 Contract

```typescript
// GL-02 calls GL-03 after approval
interface GLPostingPort {
  postJournalEntry(input: PostJournalEntryInput): Promise<PostingResult>;
  createReversal(input: CreateReversalInput): Promise<ReversalResult>;
  getPostingBySourceId(sourceType: string, sourceId: string): Promise<LedgerLine[] | null>;
}
```

### 7.2 AP/AR → GL-03 Contract

```typescript
// AP-05 calls GL-03 on payment execution
interface SubledgerPostingInput {
  sourceType: 'ap_invoice' | 'ap_payment' | 'ar_invoice' | 'ar_receipt';
  sourceId: string;
  tenantId: string;
  companyId: string;
  postingDate: Date;
  description: string;
  lines: Array<{
    accountCode: string;
    debitAmount?: string;
    creditAmount?: string;
    currency: string;
    description?: string;
    dimensions?: Record<string, string>;
  }>;
  postedBy: string;
}
```

---

## 8. Event Taxonomy

| Event Type | Trigger | Payload |
|------------|---------|---------|
| `finance.gl.journal.posted` | Journal entry posted | postingReference, journalEntryId, totalDebit, totalCredit |
| `finance.gl.subledger.posted` | Subledger entry posted | postingReference, sourceType, sourceId |
| `finance.gl.reversal.created` | Reversal posted | reversalReference, originalReference, reason |
| `finance.gl.posting.failed` | Posting failed | sourceType, sourceId, errorCode, errorMessage |
| `finance.gl.autoreverse.completed` | Auto-reverse job completed | processed, succeeded, failed |

---

## 9. Non-Functional Requirements

| Requirement | Target | Measurement |
|-------------|--------|-------------|
| Posting latency | < 500ms | P99 for single entry |
| Throughput | 100 entries/second | Sustained load |
| Batch posting | 1000 entries/minute | With validation |
| Availability | 99.9% | Monthly |
| Data durability | Zero data loss | Transactional commits |

---

## 10. Security Controls

| Control | Implementation |
|---------|---------------|
| Authentication | K_AUTH token validation |
| Authorization | K_POLICY permission check |
| Audit | K_LOG for every posting |
| Immutability | DB trigger blocks modification |
| Tenant isolation | RLS policies |

---

## 11. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Posting success rate | > 99.5% | Valid entries that post successfully |
| Balance accuracy | 100% | Zero unbalanced entries in ledger |
| Period violations | 0 | No postings to closed periods |
| Invariant violations | 0 | All constraints enforced |
| Reversal accuracy | 100% | Reversals exactly negate originals |

---

## 12. Edge Cases

| Scenario | Handling |
|----------|----------|
| Duplicate posting attempt | Return existing posting reference (idempotent) |
| Period closes during posting | Transaction rollback, return PERIOD_CLOSED |
| Account deactivated during posting | Transaction rollback, return ACCOUNT_INACTIVE |
| Network failure after commit | Posting succeeded, event may need retry |
| Batch posting partial failure | All-or-nothing for batch, rollback all |
| Reversal of already reversed entry | Block with ALREADY_REVERSED error |
| Posting to non-existent period | Block with PERIOD_NOT_FOUND error |

---

## 13. Open Questions

1. **FX Revaluation:** Should GL-03 handle FX revaluation postings, or is that a separate cell?
2. **Intercompany:** Should IC elimination entries go through GL-03, or TR-04?
3. **Recurring Entries:** Should recurring entry generation be in GL-02 or GL-03?
4. **Consolidation:** Should consolidated postings be a separate posting type?

---

## 14. Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-17 | AI-BOS Architecture | Initial PRD |

---

**📅 Date:** 2025-12-17  
**🏆 Priority:** P1 (Critical)  
**👤 Team:** AI-BOS Architecture  
**📧 Questions:** #gl-posting-engine
