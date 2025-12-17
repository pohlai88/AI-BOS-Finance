# PRD: GL-05 Trial Balance

> **Cell Code:** GL-05  
> **Domain:** General Ledger (DOM-05)  
> **Status:** 🟡 Design Phase — Awaiting User Review  
> **Created:** 2025-12-17  
> **Author:** AI-BOS Architecture Team

---

## 0. Executive Summary

The **Trial Balance (TB)** cell is the **mathematical proof** that the General Ledger is in balance. It aggregates all account balances at a point in time and validates that total debits equal total credits, serving as the foundation for all financial statements.

**Why This Cell Exists:** The TB is a **prerequisite** for financial statement generation. If the ledger doesn't balance, financial statements are meaningless. The TB is also a critical control artifact for period close and audits.

**AIS Justification (Romney & Steinbart):**  
The Trial Balance is the **first step in financial reporting**, providing mathematical proof of ledger accuracy. It ensures that the fundamental accounting equation (Assets = Liabilities + Equity) holds.

**COSO Mapping:**  
- **Control Activity:** Reconciliation control — verifies GL integrity before reporting
- **Assertion:** Mathematical Accuracy — ensures all postings are balanced

---

## 1. Business Justification

### 1.1 Problem Statement

**Current Pain Points:**
- ❌ No automated TB generation (manual Excel extraction)
- ❌ No historical TB snapshots (cannot view prior period balances)
- ❌ No drill-down from TB to journal entries
- ❌ Missing account hierarchy rollup (parent-child aggregation)
- ❌ No comparison capabilities (current vs. prior period)

### 1.2 Success Criteria

| # | Metric | Target | Measurement |
|---|--------|--------|-------------|
| 1 | **Balance Validation** | 100% | Total debits = Total credits, always |
| 2 | **TB Generation Speed** | < 5 seconds | For 10,000 accounts |
| 3 | **Historical Snapshots** | ✅ | TB stored at every period close |
| 4 | **Drill-Down Coverage** | 100% | Every account line drills to journal entries |
| 5 | **Comparison Accuracy** | 100% | Current vs. prior period variance analysis |

---

## 2. Scope Definition

### 2.1 IN SCOPE

✅ **Trial Balance Generation**
- Real-time TB calculation (current date)
- As-of-date TB (historical snapshots)
- Multi-entity TB consolidation
- Hierarchy rollup (summary accounts)

✅ **TB Presentation Formats**
- Standard TB (account code, name, debit, credit, balance)
- Adjusted TB (with period adjustments highlighted)
- Comparative TB (current vs. prior period)
- Consolidated TB (multi-company rollup)

✅ **Account Hierarchy Support**
- Parent-child rollup (auto-calculate summary accounts)
- Multi-level nesting (up to 5 levels)
- Drill-down from summary to leaf accounts

✅ **TB Snapshots**
- Immutable snapshots at period close
- SHA-256 hash for tamper detection
- Differential storage (only changed balances)

✅ **Drill-Down Capability**
- From TB account line → All journal entries
- From journal entry → Source document (AP invoice, AR receipt, etc.)
- Full audit trail to evidence

### 2.2 OUT OF SCOPE

❌ **Financial Statement Generation** — Reporting domain
❌ **Budget vs. Actual** — Future cell
❌ **Cash Flow Statement** — Reporting domain
❌ **Consolidation Eliminations** — Future cell
❌ **Tax Reporting** — Tax domain

---

## 3. Functional Requirements

### 3.1 Trial Balance Types

| TB Type | Description | Use Case |
|---------|-------------|----------|
| **Unadjusted TB** | Before adjusting entries | Pre-close checkpoint |
| **Adjusted TB** | After adjusting entries | Final period balances |
| **Post-Closing TB** | After closing entries | Permanent accounts only (BS) |
| **Comparative TB** | Current vs. prior period | Variance analysis |
| **Consolidated TB** | Multi-company rollup | Group-level reporting |

### 3.2 Core Operations

#### 3.2.1 Generate Real-Time Trial Balance

**Input:**
```typescript
{
  companyId: string;
  asOfDate: Date;                // Defaults to today
  includeInactive: boolean;      // Show zero-balance accounts?
  includeHierarchy: boolean;     // Show parent-child rollup?
  currencyFilter?: string;       // ISO 4217 (optional)
}
```

**Calculation Logic:**
```sql
SELECT 
  coa.account_code,
  coa.account_name,
  coa.account_type,
  coa.normal_balance,
  coa.parent_account_code,
  coa.level,
  SUM(CASE WHEN jl.debit_amount IS NOT NULL THEN jl.debit_amount ELSE 0 END) AS total_debit,
  SUM(CASE WHEN jl.credit_amount IS NOT NULL THEN jl.credit_amount ELSE 0 END) AS total_credit,
  SUM(CASE WHEN jl.debit_amount IS NOT NULL THEN jl.debit_amount ELSE 0 END) -
  SUM(CASE WHEN jl.credit_amount IS NOT NULL THEN jl.credit_amount ELSE 0 END) AS net_balance
FROM gl_chart_of_accounts coa
LEFT JOIN gl_journal_lines jl ON jl.account_code = coa.account_code
LEFT JOIN gl_journal_entries je ON je.id = jl.journal_entry_id
WHERE je.company_id = ? 
  AND je.entry_date <= ?
  AND je.status = 'POSTED'
GROUP BY coa.account_code, coa.account_name, coa.account_type, coa.normal_balance
HAVING total_debit <> 0 OR total_credit <> 0 OR includeInactive = true
ORDER BY coa.account_code;
```

**Post-Processing:**
1. Calculate hierarchy rollup (parent account balances = sum of children)
2. Validate: SUM(total_debit) = SUM(total_credit)
3. Format balances (debit-normal vs. credit-normal)
4. Apply currency conversion (if multi-currency)

**Output:**
```typescript
interface TrialBalance {
  companyId: string;
  companyName: string;
  asOfDate: Date;
  currency: string;
  totalDebit: Money;
  totalCredit: Money;
  isBalanced: boolean;
  lines: TrialBalanceLine[];
  generatedAt: Date;
  generatedBy: string;
}

interface TrialBalanceLine {
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  parentAccountCode?: string;
  level: number;
  debitBalance: Money;
  creditBalance: Money;
  netBalance: Money;              // Signed (positive = debit, negative = credit)
  normalBalance: 'debit' | 'credit';
  displayBalance: Money;          // Absolute value, shown in normal balance column
  journalEntryCount: number;      // For drill-down
}
```

#### 3.2.2 Create TB Snapshot (Period Close)

**Trigger:** Called by GL-04 (Period Close) during hard close

**Input:**
```typescript
{
  periodId: string;
  companyId: string;
  asOfDate: Date;                // Period end date
  snapshotType: 'unadjusted' | 'adjusted' | 'post_closing';
  triggeredBy: string;
}
```

**Process:**
1. Generate TB as-of period end date
2. Validate TB is balanced
3. Store TB snapshot (immutable)
4. Calculate SHA-256 hash of TB data
5. Store hash in `gl_fiscal_periods` table
6. Return snapshot ID + hash

**Output:**
- TB snapshot ID
- SHA-256 hash (for tamper detection)
- Snapshot stored in `gl_trial_balance_snapshots` table

#### 3.2.3 Retrieve Historical TB

**Input:**
```typescript
{
  snapshotId: string;
  OR
  companyId: string;
  periodId: string;
  snapshotType: string;
}
```

**Output:**
- Immutable TB snapshot from `gl_trial_balance_snapshots`
- Includes original hash for verification

#### 3.2.4 Generate Comparative TB

**Input:**
```typescript
{
  companyId: string;
  currentPeriodId: string;
  comparisonPeriodId: string;     // Prior period or same period prior year
  varianceThreshold?: number;     // Highlight variances > X%
}
```

**Calculation Logic:**
1. Retrieve TB for current period
2. Retrieve TB for comparison period
3. Calculate variance (amount and percentage)
4. Highlight material variances

**Output:**
```typescript
interface ComparativeTrialBalance {
  currentPeriod: TrialBalance;
  comparisonPeriod: TrialBalance;
  variances: VarianceLine[];
}

interface VarianceLine {
  accountCode: string;
  accountName: string;
  currentBalance: Money;
  priorBalance: Money;
  varianceAmount: Money;
  variancePercent: number;
  isMaterial: boolean;            // Based on threshold
}
```

#### 3.2.5 Drill-Down to Journal Entries

**Input:**
```typescript
{
  accountCode: string;
  companyId: string;
  periodId: string;
}
```

**Output:**
- List of all journal entries that affected this account in this period
- Each entry includes: entry date, reference, description, debit/credit amount

**Further Drill-Down:**
- From journal entry → source document (AP invoice, AR receipt, manual JE)

---

## 4. Account Hierarchy Rollup

### 4.1 Hierarchy Example

```
1000  Cash (Parent)                     $50,000 DR
├── 1001  Petty Cash                    $500 DR
├── 1002  Bank - USD Checking           $30,000 DR
└── 1003  Bank - SGD Checking           $19,500 DR

4000  Revenue (Parent)                  $100,000 CR
├── 4100  Product Sales                 $80,000 CR
└── 4200  Service Revenue                $20,000 CR
```

### 4.2 Rollup Calculation

```typescript
// Recursive rollup
function calculateParentBalance(parentAccount: Account): Money {
  const childAccounts = getChildren(parentAccount.code);
  
  if (childAccounts.length === 0) {
    // Leaf account: return posted balance
    return getPostedBalance(parentAccount.code);
  } else {
    // Summary account: sum of children
    return childAccounts.reduce((sum, child) => {
      return sum + calculateParentBalance(child);
    }, Money.zero());
  }
}
```

---

## 5. Control Points

### 5.1 Balance Validation

**Rule:** TB generation **MUST** validate that total debits = total credits.

**If Unbalanced:**
- **Block:** Cannot create snapshot
- **Alert:** Notify Controller + GL Team
- **Investigate:** Run diagnostic query to find unbalanced journal entries

### 5.2 Immutable Snapshots

**Rule:** TB snapshots created at period close are **IMMUTABLE**.

**Protection:**
- Database trigger prevents UPDATE/DELETE on `gl_trial_balance_snapshots`
- SHA-256 hash stored for tamper detection
- Any attempt to modify snapshot triggers alert

### 5.3 Audit Requirements

| Event Type | Logged Data |
|------------|-------------|
| `gl.tb.generated` | Company, as-of date, generated by, timestamp |
| `gl.tb.snapshot_created` | Snapshot ID, period ID, hash, timestamp |
| `gl.tb.accessed` | User, snapshot ID, access timestamp |

---

## 6. GL Impact

**GL Posting:** This cell **DOES NOT** post to the ledger.

**However, it READS from:**
- **GL-03 (Posting Engine):** All posted journal lines
- **GL-01 (COA):** Account definitions, hierarchy

**Used By:**
- **GL-04 (Period Close):** TB snapshot for immutability
- **Reporting Domain:** TB is input for financial statements
- **Controllers/CFOs:** Monthly/quarterly TB review

---

## 7. Data Model

### 7.1 Primary Entity: `gl_trial_balance_snapshots`

```typescript
interface TrialBalanceSnapshot {
  // ═══════════════════════════════════════════════════════════
  // IDENTITY
  // ═══════════════════════════════════════════════════════════
  id: string;
  tenant_id: string;
  company_id: string;
  
  // ═══════════════════════════════════════════════════════════
  // SNAPSHOT METADATA
  // ═══════════════════════════════════════════════════════════
  period_id: string;
  snapshot_date: Date;
  snapshot_type: 'unadjusted' | 'adjusted' | 'post_closing';
  
  // ═══════════════════════════════════════════════════════════
  // BALANCES
  // ═══════════════════════════════════════════════════════════
  total_debit: Money;
  total_credit: Money;
  is_balanced: boolean;
  currency: string;
  
  // ═══════════════════════════════════════════════════════════
  // SNAPSHOT DATA
  // ═══════════════════════════════════════════════════════════
  lines: TrialBalanceLine[];     // JSONB
  snapshot_hash: string;          // SHA-256 (for tamper detection)
  
  // ═══════════════════════════════════════════════════════════
  // AUDIT TRAIL
  // ═══════════════════════════════════════════════════════════
  created_at: Date;
  created_by: string;
  is_immutable: boolean;          // true for period close snapshots
}
```

### 7.2 Indexes

```sql
CREATE INDEX idx_tb_snapshot_period ON gl_trial_balance_snapshots(period_id);
CREATE INDEX idx_tb_snapshot_date ON gl_trial_balance_snapshots(company_id, snapshot_date);
```

### 7.3 Constraints

```sql
-- Immutable snapshots cannot be deleted
CREATE TRIGGER trg_prevent_tb_snapshot_delete
BEFORE DELETE ON gl_trial_balance_snapshots
FOR EACH ROW
WHEN (OLD.is_immutable = true)
EXECUTE FUNCTION finance.prevent_modification();

-- Immutable snapshots cannot be updated
CREATE TRIGGER trg_prevent_tb_snapshot_update
BEFORE UPDATE ON gl_trial_balance_snapshots
FOR EACH ROW
WHEN (OLD.is_immutable = true)
EXECUTE FUNCTION finance.prevent_modification();
```

---

## 8. Dependencies

### 8.1 Kernel Services Required

| Service | Usage | Criticality |
|---------|-------|-------------|
| **K_AUTH** | Identity for audit trail | 🔴 Blocking |
| **K_LOG** | Audit trail | 🔴 Blocking |

### 8.2 Upstream Dependencies

| Cell | Dependency | Usage |
|------|------------|-------|
| **GL-01** (COA) | Account definitions | Hierarchy, account names |
| **GL-03** (Posting Engine) | Posted journal lines | Source data for TB |

### 8.3 Downstream Dependencies

| Cell | Usage |
|------|-------|
| **GL-04** (Period Close) | TB snapshot for immutability |
| **Reporting Domain** | TB is input for financial statements |

---

## 9. Non-Functional Requirements

### 9.1 Performance

| Operation | Target | Measurement |
|-----------|--------|-------------|
| **Real-Time TB Generation** | < 5 seconds | 10,000 accounts |
| **TB Snapshot Creation** | < 10 seconds | Including hash calculation |
| **Historical TB Retrieval** | < 2 seconds | From snapshot table |
| **Comparative TB** | < 7 seconds | Two periods |

### 9.2 Security

- **Snapshot Immutability:** Database triggers + SHA-256 hash
- **Access Logging:** Every TB access logged (compliance requirement)
- **Data Residency:** TB data stored in company jurisdiction

### 9.3 Scalability

- **Max Accounts per Company:** 50,000
- **Max Transactions per Period:** 1,000,000
- **Snapshot Storage:** Compressed JSONB (differential storage)

### 9.4 Availability

- **Uptime SLA:** 99.9%
- **RPO:** 5 minutes
- **RTO:** 1 hour

---

## 10. Edge Cases & Error Scenarios

| # | Scenario | Expected Behavior |
|---|----------|------------------|
| 1 | **Unbalanced TB** | Alert Controller, block snapshot creation |
| 2 | **Zero-balance accounts in TB** | Exclude by default (unless `includeInactive = true`) |
| 3 | **Multi-currency TB** | Convert to base currency using period-end rates |
| 4 | **Historical TB for future date** | Reject with `FUTURE_DATE_INVALID` |
| 5 | **TB snapshot hash mismatch** | Alert for potential tampering |
| 6 | **Summary account with direct postings** | Alert (should be leaf account only) |
| 7 | **Drill-down to deleted journal entry** | Show "Entry deleted" with audit trail |
| 8 | **TB generation during active posting** | Use snapshot isolation (read committed) |
| 9 | **Comparative TB with different account structures** | Show side-by-side with unmapped accounts flagged |
| 10 | **TB retrieval for non-existent period** | Reject with `PERIOD_NOT_FOUND` |

---

## 11. Test Strategy

### 11.1 Unit Tests

- [ ] Generate real-time TB (balanced)
- [ ] Generate real-time TB with zero-balance accounts
- [ ] Create TB snapshot with hash
- [ ] Retrieve historical TB snapshot
- [ ] Generate comparative TB (current vs. prior)
- [ ] Calculate account hierarchy rollup
- [ ] Validate TB is balanced (sum debits = sum credits)
- [ ] Drill-down from TB line to journal entries

### 11.2 Integration Tests

- [ ] Generate TB after posting journal entries (GL-03)
- [ ] TB snapshot at period close (GL-04)
- [ ] Verify snapshot immutability (attempt UPDATE/DELETE)
- [ ] Multi-company TB consolidation

### 11.3 Control Tests

- [ ] `test_audit_event_on_tb_generation()`
- [ ] `test_snapshot_immutability_trigger()`
- [ ] `test_hash_tamper_detection()`

---

## 12. Success Metrics (Post-Implementation)

| Metric | Target | How Measured |
|--------|--------|--------------|
| **TB Balance Validation** | 100% | All TBs balanced before snapshot |
| **Snapshot Immutability** | 100% | Zero successful tampering attempts |
| **TB Generation Speed** | < 5 seconds | P99 latency for 10K accounts |
| **Drill-Down Coverage** | 100% | Every TB line drills to source |
| **Dashboard Health Score** | > 95 | Based on TB accuracy, snapshot integrity |

---

## 13. Open Questions (for User Review)

1. **Snapshot Frequency:** Should we auto-snapshot daily, or only at period close?
2. **Retention Policy:** How long should historical TB snapshots be retained? (7 years for audit?)
3. **Multi-Currency Display:** Should TB show native currency + base currency side-by-side?
4. **Hierarchy Depth:** Is 5 levels sufficient, or do we need deeper nesting?
5. **Real-Time vs. Cached:** Should TB be cached (Redis) or always calculated on-demand?

---

## 14. Document Control

| Property | Value |
|----------|-------|
| **Cell Code** | GL-05 |
| **PRD Version** | 1.0 |
| **Status** | 🟡 Awaiting User Review |
| **Author** | AI-BOS Architecture Team |
| **Created** | 2025-12-17 |
| **Quality Gate** | 1 of 2 (PRD Review) |

---

**🔴 USER ACTION REQUIRED:**  
Please review this PRD against the Quality Gate Checklist (Appendix J in CONT_07).  
**Approve** this design to proceed to Architecture Review, or **Provide Feedback** for revision.
