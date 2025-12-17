# PRD: GL-04 Period Close

> **Cell Code:** GL-04  
> **Domain:** General Ledger (DOM-05)  
> **Status:** 🟡 Design Phase — Awaiting User Review  
> **Created:** 2025-12-17  
> **Author:** AI-BOS Architecture Team

---

## 0. Executive Summary

The **Period Close** cell is the **cutoff enforcement mechanism** that controls when periods transition from open to closed, preventing backdated transactions and ensuring the integrity of financial statements. It is the **gatekeeper** for fiscal period boundaries.

**Why This Cell Exists:** Without period close control, users could post transactions to prior periods indefinitely, making financial statements unreliable and preventing month-end/year-end closings. Period close is **legally required** for SOX compliance and external audits.

**AIS Justification (Romney & Steinbart):**  
The **Cutoff Assertion** ensures that transactions are recorded in the correct accounting period. Period close is the technical implementation of this assertion, creating an immutable boundary once financial statements are finalized.

**COSO Mapping:**  
- **Control Activity:** Period-end control — ensures completeness and accuracy of period reporting
- **Assertion:** Cutoff — prevents period manipulation fraud

---

## 1. Business Justification

### 1.1 Problem Statement

**Current Pain Points:**
- ❌ No technical enforcement of period boundaries
- ❌ Users can backdate transactions indefinitely
- ❌ No controlled reopen process (Excel-based period management)
- ❌ Missing period close artifacts (TB snapshot, checklist)
- ❌ No audit trail of period state changes

### 1.2 Success Criteria

| # | Metric | Target | Measurement |
|---|--------|--------|-------------|
| 1 | **Closed Period Protection** | 100% | No postings to closed periods (except controlled reopen) |
| 2 | **Period Close Artifacts** | Complete | TB snapshot, checklist, audit logs |
| 3 | **Reopen Authorization** | 100% | All reopens require CFO + Auditor approval |
| 4 | **Close SLA** | < 5 business days | Time from month-end to hard close |
| 5 | **Audit Trail** | 100% | Every state change logged with justification |

---

## 2. Scope Definition

### 2.1 IN SCOPE

✅ **Period State Management**
- Open period (normal posting allowed)
- Soft close (adjustments only)
- Hard close (no posting, immutable)
- Controlled reopen (CFO-authorized corrections)

✅ **Period Close Checklist**
- Configurable tasks per period type (month/quarter/year)
- Task assignment and completion tracking
- Blocking close until all tasks complete

✅ **Period Close Artifacts**
- Trial Balance snapshot (immutable)
- Checklist completion evidence
- Close event audit log
- Reopen justification documents

✅ **Automated Validations**
- All subledgers reconciled to GL
- No unposted transactions in AP/AR/TR
- No unbalanced journals
- All bank accounts reconciled (for year-end)

✅ **Controlled Reopen Process**
- Reopen request with business justification
- CFO approval required
- Auditor notification
- Reopen window (time-limited)
- Auto-reclose after corrections

### 2.2 OUT OF SCOPE

❌ **Journal Entry Creation** — That's GL-02
❌ **Posting Logic** — That's GL-03
❌ **Trial Balance Calculation** — That's GL-05 (but TB snapshot stored here)
❌ **Financial Statement Generation** — Reporting domain
❌ **Consolidation Logic** — Future cell

---

## 3. Functional Requirements

### 3.1 Period State Machine

> **Authoritative Definition from CONT_07 Section 3.2.3**

```
┌─────────────────────────────────────────────────────────────┐
│                  PERIOD STATE MACHINE                        │
│                                                              │
│   OPEN ────► SOFT_CLOSE ────► HARD_CLOSE                    │
│     │            │                │                          │
│     │            │                │                          │
│     └──── Normal Posting ────────┘                          │
│                  │                                           │
│                  │ (EXCEPTION PATH)                          │
│                  ▼                                           │
│            CONTROLLED_REOPEN                                 │
│            (Policy-Gated)                                    │
│                  │                                           │
│                  └────► HARD_CLOSE (auto-reclose)           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

| State | Posting Allowed? | Transition Rules | Evidence Required |
|-------|:----------------:|:-----------------|:------------------|
| **OPEN** | ✅ All postings | → SOFT_CLOSE (Controller initiates) | None |
| **SOFT_CLOSE** | ⚠️ Adjustments only | → HARD_CLOSE (Controller + CFO) | TB Snapshot, Checklist |
| **HARD_CLOSE** | ❌ No posting | → CONTROLLED_REOPEN (CFO + Auditor) | Reopen Request |
| **CONTROLLED_REOPEN** | ⚠️ Corrections only | → HARD_CLOSE (automatic) | Correction JE, Reclose Checklist |

### 3.2 Core Operations

#### 3.2.1 Initiate Soft Close

**Trigger:** Controller at month-end after all regular transactions posted

**Input:**
```typescript
{
  periodId: string;              // "2024-12" (YYYY-MM format)
  companyId: string;
  initiatedBy: string;           // Must be Controller role
  notes?: string;
}
```

**Pre-Close Validations:**
- [ ] All AP invoices approved
- [ ] All AR receipts allocated
- [ ] All bank reconciliations current
- [ ] No unposted journal entries in GL-02
- [ ] No transactions in DRAFT status in AP/AR/TR

**Actions:**
1. Run validations
2. Create preliminary Trial Balance snapshot
3. Generate close checklist from template
4. Change period status → SOFT_CLOSE
5. Emit event: `gl.period.soft_closed`
6. Notify: GL team, Controller, CFO

**Output:**
- Period status → SOFT_CLOSE
- Posting restriction: Only journal entries with type = 'adjusting' or 'accrual'

#### 3.2.2 Execute Hard Close

**Trigger:** Controller after all adjustments posted, checklist complete

**Input:**
```typescript
{
  periodId: string;
  companyId: string;
  executedBy: string;            // Must be Controller role
  approvedBy: string;            // Must be CFO role
  checklistId: string;           // Completed checklist
  finalTBSnapshotHash: string;   // SHA-256 of TB data
  notes?: string;
}
```

**Pre-Hard-Close Validations:**
- [ ] Period currently in SOFT_CLOSE status
- [ ] All checklist tasks completed
- [ ] All adjusting entries posted
- [ ] Final TB balanced
- [ ] CFO approval obtained

**Actions:**
1. Run validations
2. Create **immutable** Trial Balance snapshot
3. Calculate TB hash for tamper detection
4. Mark checklist as complete (immutable)
5. Change period status → HARD_CLOSE
6. Emit event: `gl.period.hard_closed`
7. Lock all transactions for this period (database trigger)
8. Notify: All finance users, Auditors

**Output:**
- Period status → HARD_CLOSE
- All posting to this period **FORBIDDEN**
- Period artifacts stored (TB, checklist, audit log)

#### 3.2.3 Request Controlled Reopen

**Trigger:** Discovery of material error in closed period

**Input:**
```typescript
{
  periodId: string;
  companyId: string;
  requestedBy: string;           // Typically Controller
  businessJustification: string; // MANDATORY (detailed explanation)
  estimatedCorrectionAmount: Money;
  expectedCorrectionEntries: string[]; // List of planned JE references
  auditorNotified: boolean;      // Must be true
  reopenDuration: number;        // Days (max 5)
}
```

**Approval Workflow:**
1. Controller submits reopen request
2. CFO review & approval (cannot be same person as requestor)
3. Auditor notification & acknowledgment
4. System admin executes reopen

**Validations:**
- Period must be HARD_CLOSE
- Reopen request requires detailed justification
- CFO approval required (SoD: CFO ≠ Requestor)
- Auditor must be notified
- Reopen duration ≤ 5 business days

**Actions:**
1. Create reopen request record
2. Notify CFO for approval
3. Notify external auditor
4. After approval, change period status → CONTROLLED_REOPEN
5. Set reopen expiration (auto-reclose after N days)
6. Emit event: `gl.period.reopened`

**Output:**
- Period status → CONTROLLED_REOPEN
- Posting restriction: Only journal entries with type = 'correction'
- Reopen window: Time-limited (auto-reclose)

#### 3.2.4 Auto-Reclose After Corrections

**Trigger:** Reopen duration expires OR Controller manually recloses

**Input:**
```typescript
{
  periodId: string;
  companyId: string;
  reclosedBy: string;
  correctionEntriesPosted: string[]; // JE IDs
  updatedTBSnapshotHash: string;
}
```

**Actions:**
1. Verify all correction entries posted
2. Create updated Trial Balance snapshot
3. Calculate new TB hash
4. Mark reopen complete
5. Change period status → HARD_CLOSE
6. Emit event: `gl.period.reclosed`

**Output:**
- Period status → HARD_CLOSE (again)
- Reopen audit trail preserved

---

## 4. Period Close Checklist

### 4.1 Checklist Template (Month-End)

| # | Task | Owner | Blocking? |
|---|------|-------|:----------:|
| 1 | All AP invoices approved & posted | AP Team | ✅ |
| 2 | All AR receipts allocated | AR Team | ✅ |
| 3 | Bank reconciliations complete | Treasury | ✅ |
| 4 | Accruals reviewed & posted | GL Team | ✅ |
| 5 | Depreciation calculated & posted | Fixed Assets | ✅ |
| 6 | Inter-company balances reconciled | Consolidation | ✅ |
| 7 | FX revaluation run | Treasury | ✅ |
| 8 | Preliminary TB reviewed | Controller | ✅ |
| 9 | CFO sign-off obtained | CFO | ✅ |

### 4.2 Checklist Template (Year-End - Additional)

| # | Task | Owner | Blocking? |
|---|------|-------|:----------:|
| 10 | Physical inventory count reconciled | Operations | ✅ |
| 11 | All balance sheet accounts reviewed | GL Team | ✅ |
| 12 | Tax provision calculated | Tax Team | ✅ |
| 13 | Audit preparation materials compiled | Controller | ⚠️ |
| 14 | Board presentation prepared | CFO | ❌ |

### 4.3 Checklist Enforcement

**Business Rule:**  
- **Blocking tasks** must be completed before hard close
- **Warning tasks** generate alerts but don't block
- **Non-blocking tasks** are tracked but optional

---

## 5. Control Points

### 5.1 Segregation of Duties (SoD)

| Action | Controller | CFO | Auditor | Notes |
|--------|:----------:|:---:|:-------:|-------|
| Initiate Soft Close | ✅ | ✅ | ❌ | Either role |
| Execute Hard Close | ✅ Initiates | ✅ Approves | ❌ Notified | Two-person rule |
| Request Reopen | ✅ | ❌ | ❌ | Requestor |
| Approve Reopen | ❌ Cannot be requestor | ✅ | ⚠️ Notified | Approver |

**Database Constraint:**
```sql
-- CFO approver cannot be the reopen requestor
CHECK (reopen_approved_by IS NULL OR reopen_approved_by <> reopen_requested_by)
```

### 5.2 Authorization Matrix

| Role | Can Soft Close | Can Hard Close | Can Request Reopen | Can Approve Reopen |
|------|:--------------:|:--------------:|:------------------:|:------------------:|
| GL Officer | ❌ | ❌ | ❌ | ❌ |
| GL Manager | ⚠️ | ❌ | ❌ | ❌ |
| Controller | ✅ | ✅ Initiate | ✅ | ❌ |
| CFO | ✅ | ✅ Approve | ⚠️ | ✅ |

### 5.3 Audit Requirements

Every state transition **MUST** log:

| Event Type | Logged Data |
|------------|-------------|
| `gl.period.soft_closed` | Period ID, initiator, timestamp, preliminary TB hash |
| `gl.period.hard_closed` | Period ID, controller, CFO approver, timestamp, final TB hash |
| `gl.period.reopen_requested` | Period ID, requestor, justification, auditor ID |
| `gl.period.reopened` | Period ID, CFO approver, reopen duration, timestamp |
| `gl.period.reclosed` | Period ID, recloser, correction JE refs, updated TB hash |

---

## 6. GL Impact

**GL Posting:** This cell **DOES NOT** create journal entries.

**However, it CONTROLS:**
- **Period validation** for all cells (AP, AR, TR, GL-02, GL-03)
- **Posting lockout** after hard close
- **Trial Balance snapshot** preservation

**Integration Points:**
```
K_TIME (Fiscal Calendar) ◄──► GL-04 (Period Close)
                    │
                    └──► Validates posting dates for:
                         - AP Cells
                         - AR Cells
                         - TR Cells
                         - GL-02 (Journal Entry)
                         - GL-03 (Posting Engine)
```

---

## 7. Data Model

### 7.1 Primary Entity: `gl_fiscal_periods`

```typescript
interface FiscalPeriod {
  // ═══════════════════════════════════════════════════════════
  // IDENTITY
  // ═══════════════════════════════════════════════════════════
  id: string;
  tenant_id: string;
  company_id: string;
  
  // ═══════════════════════════════════════════════════════════
  // PERIOD DEFINITION
  // ═══════════════════════════════════════════════════════════
  period_code: string;             // "2024-12" (YYYY-MM)
  period_name: string;             // "December 2024"
  period_type: 'month' | 'quarter' | 'year';
  fiscal_year: number;             // 2024
  start_date: Date;
  end_date: Date;
  
  // ═══════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════
  status: PeriodStatus;            // OPEN/SOFT_CLOSE/HARD_CLOSE/CONTROLLED_REOPEN
  
  // ═══════════════════════════════════════════════════════════
  // SOFT CLOSE
  // ═══════════════════════════════════════════════════════════
  soft_closed_at?: Date;
  soft_closed_by?: string;
  preliminary_tb_snapshot_hash?: string;
  
  // ═══════════════════════════════════════════════════════════
  // HARD CLOSE
  // ═══════════════════════════════════════════════════════════
  hard_closed_at?: Date;
  hard_closed_by?: string;
  hard_close_approved_by?: string; // CFO
  final_tb_snapshot_hash: string;  // SHA-256 (immutable)
  close_checklist_id: string;
  
  // ═══════════════════════════════════════════════════════════
  // CONTROLLED REOPEN
  // ═══════════════════════════════════════════════════════════
  reopen_requested_at?: Date;
  reopen_requested_by?: string;
  reopen_justification?: string;
  reopen_approved_at?: Date;
  reopen_approved_by?: string;     // CFO
  reopen_auditor_notified?: boolean;
  reopen_auditor_id?: string;
  reopen_expires_at?: Date;
  reclosed_at?: Date;
  reclosed_by?: string;
  updated_tb_snapshot_hash?: string;
  
  // ═══════════════════════════════════════════════════════════
  // METADATA
  // ═══════════════════════════════════════════════════════════
  notes?: string;
  version: number;
}
```

### 7.2 Child Entity: `gl_period_close_checklist_tasks`

```typescript
interface PeriodCloseTask {
  id: string;
  period_id: string;
  checklist_template_id: string;
  
  task_number: number;
  task_name: string;
  task_owner_role: string;
  
  // ⚠️ CRITICAL FIX #3: 3-level severity model
  severity: 'blocking' | 'warning' | 'optional';
  
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  
  completed_at?: Date;
  completed_by?: string;
  completion_notes?: string;
  
  // For skipped tasks (warnings/optional)
  skipped_at?: Date;
  skipped_by?: string;
  skipped_reason?: string;
  
  created_at: Date;
}
```

### 7.3 Enums

```typescript
enum PeriodStatus {
  OPEN = 'open',
  SOFT_CLOSE = 'soft_close',
  HARD_CLOSE = 'hard_close',
  CONTROLLED_REOPEN = 'controlled_reopen'
}
```

### 7.4 Indexes

```sql
CREATE INDEX idx_period_company_date ON gl_fiscal_periods(company_id, start_date);
CREATE INDEX idx_period_status ON gl_fiscal_periods(status);
CREATE INDEX idx_period_code ON gl_fiscal_periods(company_id, period_code);
```

### 7.5 Constraints

```sql
-- ⚠️ CRITICAL FIX #1: Real overlap prevention (not just duplicate detection)
-- Using PostgreSQL EXCLUDE constraint with daterange
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE gl_fiscal_periods
ADD CONSTRAINT excl_period_no_overlap
EXCLUDE USING GIST (
  company_id WITH =,
  daterange(start_date, end_date, '[]') WITH &&
);

-- ⚠️ CRITICAL FIX #1b: Period code must be unique per company
ALTER TABLE gl_fiscal_periods
ADD CONSTRAINT uq_period_company_code
UNIQUE (company_id, period_code);

-- ⚠️ CRITICAL FIX #2: SoD for Reopen (approver ≠ requestor)
ALTER TABLE gl_fiscal_periods
ADD CONSTRAINT chk_reopen_sod
CHECK (reopen_approved_by IS NULL OR reopen_approved_by <> reopen_requested_by);

-- ⚠️ CRITICAL FIX #2b: SoD for Hard Close (CFO ≠ Controller who initiated)
ALTER TABLE gl_fiscal_periods
ADD CONSTRAINT chk_hard_close_sod
CHECK (hard_close_approved_by IS NULL OR hard_close_approved_by <> hard_closed_by);
```

**Constraint Notes:**

- **`EXCLUDE USING GIST`**: Prevents any two periods for the same company from having overlapping date ranges. This is the **correct** way to prevent overlaps (not a unique index on start/end).
- **`daterange(start_date, end_date, '[]')`**: Inclusive on both ends (`[]` means `[start, end]` inclusive).
- **SoD for Hard Close**: Prevents Controller from being their own approver (two-person rule).

---

## 8. Dependencies

### 8.1 Kernel Services Required

| Service | Usage | Criticality |
|---------|-------|-------------|
| **K_TIME** | Period definition & validation | 🔴 Blocking |
| **K_AUTH** | Role verification (Controller, CFO) | 🔴 Blocking |
| **K_LOG** | Audit trail for state changes | 🔴 Blocking |
| **K_POLICY** | Approval routing for reopen | 🔴 Blocking |

### 8.2 Upstream Dependencies

| Cell | Dependency | Usage |
|------|------------|-------|
| **GL-05** (Trial Balance) | TB snapshot | Capture TB at close for immutability |

### 8.3 Downstream Dependencies (Who depends on GL-04?)

| Cell | Dependency | Failure Mode |
|------|------------|--------------|
| **GL-02** (Journal Entry) | Period open check | Cannot create JEs for closed periods |
| **GL-03** (Posting Engine) | Period validation | Cannot post to closed periods |
| **AP/AR/TR Cells** | Period validation | Cannot create transactions in closed periods |

---

## 9. Non-Functional Requirements

### 9.1 Performance

| Operation | Target | Measurement |
|-----------|--------|-------------|
| **Period Status Check** | < 20ms | Cached (Redis) |
| **Soft Close** | < 5 seconds | Including validations |
| **Hard Close** | < 30 seconds | Including TB snapshot |
| **Reopen Request** | < 2 seconds | — |

### 9.2 Security

- **Immutable TB Snapshots:** SHA-256 hashing for tamper detection
- **Reopen Audit Trail:** Every reopen logged with justification
- **Access Control:** Only Controller/CFO roles can close periods

### 9.3 Availability

- **Uptime SLA:** 99.99% (four nines) — critical for period validation
- **RPO:** 0 (synchronous replication)
- **RTO:** 15 minutes

---

## 10. Edge Cases & Error Scenarios

| # | Scenario | Expected Behavior |
|---|----------|------------------|
| 1 | **Attempt to hard close with incomplete checklist** | Reject with `CHECKLIST_INCOMPLETE` |
| 2 | **Attempt to post to hard closed period** | Reject with `PERIOD_CLOSED` |
| 3 | **Reopen request without CFO approval** | Reject with `APPROVAL_REQUIRED` |
| 4 | **Reopen expires before reclose** | Auto-reclose period, notify Controller |
| 5 | **Concurrent close by 2 controllers** | First wins, second gets `VERSION_CONFLICT` |
| 6 | **TB snapshot hash mismatch** | Alert for potential tampering |
| 7 | **Reopen requestor = CFO approver** | Reject with `SOD_VIOLATION` |
| 8 | **Soft close with unposted JEs** | Reject with `UNPOSTED_TRANSACTIONS_EXIST` |
| 9 | **Hard close without CFO approval** | Reject with `CFO_APPROVAL_REQUIRED` |
| 10 | **Multiple reopen requests for same period** | Only allow one reopen at a time |

---

## 11. Test Strategy

### 11.1 Unit Tests

- [ ] Soft close with all validations passing
- [ ] Soft close with unposted transactions (reject)
- [ ] Hard close with complete checklist
- [ ] Hard close with incomplete checklist (reject)
- [ ] Reopen request with justification
- [ ] Reopen approval by CFO
- [ ] Reopen approval by requestor (SoD violation)
- [ ] Auto-reclose after duration expires
- [ ] Post to closed period (reject)
- [ ] Post to reopened period (allow corrections only)

### 11.2 SoD Tests

- [ ] `test_reopen_approver_cannot_be_requestor()`
- [ ] `test_hard_close_requires_cfo_approval()`

### 11.3 Integration Tests

- [ ] End-to-end: Open → Soft Close → Hard Close
- [ ] Reopen workflow: Request → Approve → Correct → Reclose
- [ ] TB snapshot preservation
- [ ] Period validation from GL-02/GL-03
- [ ] Checklist completion enforcement

### 11.4 Control Tests

- [ ] `test_audit_event_on_soft_close()`
- [ ] `test_audit_event_on_hard_close()`
- [ ] `test_audit_event_on_reopen()`
- [ ] `test_tb_hash_immutability()`

---

## 12. Success Metrics (Post-Implementation)

| Metric | Target | How Measured |
|--------|--------|--------------|
| **Closed Period Protection** | 100% | Count of posting attempts to closed periods blocked |
| **Close SLA** | < 5 business days | Time from period end to hard close |
| **Reopen Frequency** | < 2 per year | Count of reopens (indicator of quality) |
| **Checklist Compliance** | 100% | All blocking tasks complete before hard close |
| **Dashboard Health Score** | > 95 | Based on on-time closes, minimal reopens |

---

## 12. Critical Technical Specifications (MUST-HAVES)

### 12.1 Period Boundary Rules (⚠️ CRITICAL FIX #4)

**Problem:** Ambiguous period boundaries cause posting errors across timezones and at midnight.

**Specification:**

| Rule | Value | Rationale |
|------|-------|-----------|
| **End Date Inclusivity** | **Inclusive** (`<=`) | Period "2024-12" includes transactions on `2024-12-31` |
| **Timezone Authority** | **Company timezone** (from company profile) | SG company uses `Asia/Singapore`, US company uses `America/New_York` |
| **Cutoff Time** | **23:59:59.999999** in company timezone | Last microsecond of period end date |
| **Posting Date Comparison** | **Convert to company timezone before comparison** | Avoid midnight edge cases |

**Implementation:**

```sql
-- Period validation function
CREATE FUNCTION is_period_open_for_date(
  p_company_id UUID,
  p_posting_date TIMESTAMPTZ
) RETURNS BOOLEAN AS $$
DECLARE
  v_company_tz TEXT;
  v_posting_date_local DATE;
  v_period_status TEXT;
BEGIN
  -- Get company timezone
  SELECT timezone INTO v_company_tz
  FROM companies WHERE id = p_company_id;
  
  -- Convert posting date to company local date
  v_posting_date_local := (p_posting_date AT TIME ZONE v_company_tz)::DATE;
  
  -- Check if any period contains this date AND is open/soft_close
  SELECT status INTO v_period_status
  FROM gl_fiscal_periods
  WHERE company_id = p_company_id
    AND start_date <= v_posting_date_local
    AND end_date >= v_posting_date_local  -- Inclusive
    AND status IN ('open', 'soft_close', 'controlled_reopen');
  
  RETURN v_period_status IS NOT NULL;
END;
$$ LANGUAGE plpgsql;
```

**Date Range Construction:**
```typescript
// Period: 2024-12 (December 2024)
{
  start_date: '2024-12-01',  // Midnight start of day (00:00:00)
  end_date: '2024-12-31',    // INCLUSIVE - last day of period
}

// Valid posting dates: 2024-12-01 00:00:00 through 2024-12-31 23:59:59.999999
```

---

### 12.2 Trial Balance Hash Canonicalization (⚠️ CRITICAL FIX #5)

**Problem:** "SHA-256 of TB data" is ambiguous — different serializations produce different hashes, breaking tamper detection.

**Canonical TB Snapshot Format:**

```typescript
interface CanonicalTBSnapshot {
  metadata: {
    company_id: string;
    period_id: string;
    snapshot_date: string;        // ISO 8601: "2024-12-31"
    snapshot_type: string;        // "unadjusted" | "adjusted" | "post_closing"
    currency: string;             // ISO 4217: "USD"
    generated_at: string;         // ISO 8601: "2024-12-31T23:59:59.999Z"
  };
  totals: {
    total_debit: string;          // Fixed 2 decimals: "123456.78"
    total_credit: string;         // Fixed 2 decimals: "123456.78"
    is_balanced: boolean;
  };
  lines: Array<{
    account_code: string;
    account_name: string;
    account_type: string;
    debit_balance: string;        // Fixed 2 decimals, "0.00" if null
    credit_balance: string;       // Fixed 2 decimals, "0.00" if null
    net_balance: string;          // Signed, fixed 2 decimals
  }>;
}
```

**Hash Calculation Algorithm:**

```typescript
function calculateTBHash(snapshot: CanonicalTBSnapshot): string {
  // 1. Sort lines by account_code (ascending, case-sensitive)
  const sortedLines = snapshot.lines.slice().sort((a, b) => 
    a.account_code.localeCompare(b.account_code, 'en', { sensitivity: 'case' })
  );
  
  // 2. Create canonical representation
  const canonical = {
    ...snapshot,
    lines: sortedLines,
  };
  
  // 3. Serialize to JSON with stable key ordering
  const json = JSON.stringify(canonical, Object.keys(canonical).sort());
  
  // 4. Compute SHA-256
  const hash = createHash('sha256').update(json, 'utf8').digest('hex');
  
  return hash;
}
```

**Invariants:**
- ✅ **Stable ordering:** Lines sorted by `account_code` (ASCII)
- ✅ **Fixed precision:** All money amounts formatted to 2 decimal places
- ✅ **Null handling:** Nulls converted to `"0.00"` (not omitted)
- ✅ **Deterministic serialization:** JSON keys sorted alphabetically
- ✅ **UTF-8 encoding:** Consistent character encoding

**Storage:**
```sql
-- Store hash on period
UPDATE gl_fiscal_periods
SET final_tb_snapshot_hash = 'a1b2c3d4...'
WHERE id = period_id;

-- Store snapshot data
INSERT INTO gl_trial_balance_snapshots (
  period_id,
  snapshot_hash,  -- Same hash for verification
  snapshot_data   -- JSONB (canonical format)
) VALUES (...);
```

---

### 12.3 Auto-Reclose Failure Handling (⚠️ CRITICAL FIX #6)

**Problem:** Reopen window expires but corrections are incomplete — system must behave deterministically.

**Decision Matrix:**

| Scenario | Verification Status | Action | Period Status | Notification |
|----------|---------------------|--------|---------------|--------------|
| **Happy Path** | All corrections posted | Auto-reclose | `HARD_CLOSE` | ✅ Controller |
| **Corrections Pending** | Some JEs still in DRAFT/SUBMITTED | **Block reclose** + Extend window + Escalate | `CONTROLLED_REOPEN` (extended) | 🚨 CFO + Controller |
| **Corrections Failed** | JE rejected or posting failed | **Force reclose** + Mark exception + Audit flag | `HARD_CLOSE` (exception) | 🚨 CFO + Auditor |
| **GL-03 Queue Delayed** | Approved but not yet posted | Wait 1 hour + Retry | `CONTROLLED_REOPEN` (waiting) | ⚠️ Controller |

**Implementation:**

```typescript
async function attemptAutoReclose(periodId: string): Promise<{
  success: boolean;
  action: 'reclosed' | 'extended' | 'forced' | 'waiting';
  reason?: string;
}> {
  const period = await getPeriod(periodId);
  
  // Get all correction entries created during reopen
  const corrections = await getCorrectionEntriesForPeriod(
    periodId,
    period.reopen_requested_at,
    new Date()
  );
  
  // Check status of all corrections
  const pending = corrections.filter(je => ['DRAFT', 'SUBMITTED'].includes(je.status));
  const approved = corrections.filter(je => je.status === 'APPROVED');
  const posted = corrections.filter(je => je.status === 'POSTED');
  const rejected = corrections.filter(je => je.status === 'REJECTED');
  
  // Scenario 1: Happy path
  if (pending.length === 0 && approved.length === 0 && rejected.length === 0) {
    await executeReclose(periodId);
    await notify('Controller', 'Period reclosed successfully');
    return { success: true, action: 'reclosed' };
  }
  
  // Scenario 2: Corrections pending
  if (pending.length > 0) {
    await extendReopenWindow(periodId, 2); // +2 days
    await notify('CFO,Controller', `${pending.length} corrections still pending`, 'escalation');
    return { success: false, action: 'extended', reason: 'Corrections pending' };
  }
  
  // Scenario 3: Corrections failed
  if (rejected.length > 0) {
    await forceReclose(periodId, { exception: true, rejectedCount: rejected.length });
    await notify('CFO,Auditor', `Forced reclose with ${rejected.length} rejected corrections`, 'critical');
    return { success: true, action: 'forced', reason: 'Corrections rejected' };
  }
  
  // Scenario 4: Approved but not posted (GL-03 delay)
  if (approved.length > 0) {
    await wait(1, 'hour');
    return attemptAutoReclose(periodId); // Retry
  }
  
  // Fallback
  return { success: false, action: 'waiting', reason: 'Unknown state' };
}
```

**Audit Log:**
```sql
INSERT INTO period_reclose_audit (
  period_id,
  reclose_action,
  pending_corrections,
  rejected_corrections,
  forced,
  reason,
  timestamp
) VALUES (...);
```

---

## 13. Open Questions (for User Review)

1. **Soft Close Duration:** Should there be a maximum time limit for soft close (e.g., 5 business days)?
2. **Reopen Auditor Approval:** Should external auditor **approve** reopens, or just be notified?
3. **Multi-Level Approval for Reopen:** Should reopens >$100K require Board approval?
4. **Auto-Reopen for Immaterial Errors:** Should there be a threshold below which Controller can reopen without CFO approval?
5. **Historical Period Access:** Should users be able to view (read-only) transactions from closed periods, or is access completely blocked?

---

## 14. Document Control

| Property | Value |
|----------|-------|
| **Cell Code** | GL-04 |
| **PRD Version** | 1.0 |
| **Status** | 🟡 Awaiting User Review |
| **Author** | AI-BOS Architecture Team |
| **Created** | 2025-12-17 |
| **Quality Gate** | 1 of 2 (PRD Review) |

---

**🔴 USER ACTION REQUIRED:**  
Please review this PRD against the Quality Gate Checklist (Appendix J in CONT_07).  
**Approve** this design to proceed to Architecture Review, or **Provide Feedback** for revision.
