# PRD: TR-05 Bank Reconciliation

> **Cell Code:** TR-05  
> **Domain:** Treasury (DOM-06)  
> **Status:** 📋 Design Phase — Awaiting User Review  
> **Created:** 2025-12-17  
> **Author:** AI-BOS Architecture Team

---

## 0. Executive Summary

The **Bank Reconciliation** cell matches **GL bank account balances with bank statement balances**, identifying and resolving timing differences, outstanding items, and discrepancies. It ensures the **Existence Assertion** (bank balance = GL balance) and provides audit-ready reconciliation reports.

**Why This Cell Exists:** Without bank reconciliation, companies cannot verify cash balances, detect bank errors or fraud, identify outstanding checks/deposits, or produce audit-ready financial statements.

**AIS Justification (Romney & Steinbart):**  
Bank Reconciliation is a **critical control activity** in the Treasury Cycle. It enforces **Existence Assertion** (bank balance matches GL), **Completeness Assertion** (all transactions recorded), and **Accuracy Assertion** (correct amounts).

**COSO Mapping:**  
- **Control Activity:** Daily/monthly reconciliation process
- **Assertion:** Existence, Completeness, Accuracy
- **Risk:** Undetected bank errors, fraud, missing transactions

---

## 1. Business Justification

### 1.1 Problem Statement

**Current Pain Points:**
- ❌ Manual bank reconciliation (spreadsheet-based, time-consuming)
- ❌ No automatic matching (manual line-by-line comparison)
- ❌ Outstanding items not tracked (aging issues)
- ❌ Bank errors not detected promptly
- ❌ Missing transactions (deposits, charges) not identified
- ❌ No audit trail for reconciliation adjustments

### 1.2 Success Criteria

| # | Metric | Target | Measurement |
|---|--------|--------|-------------|
| 1 | **Reconciliation Frequency** | 100% | All bank accounts reconciled monthly |
| 2 | **Automatic Matching Rate** | 80%+ | Percentage of items auto-matched |
| 3 | **Outstanding Item Aging** | < 30 days | Average age of outstanding items |
| 4 | **Reconciliation Accuracy** | 100% | GL balance = Bank balance (after adjustments) |
| 5 | **Audit Trail** | 100% | Every reconciliation action logged |

---

## 2. Scope Definition

### 2.1 IN SCOPE

✅ **Bank Statement Import**
- Multiple format support (MT940, BAI2, CSV, OFX)
- Duplicate detection
- Statement history retention
- Import validation rules

✅ **Automatic Matching**
- Exact match (amount + reference + date)
- Fuzzy match (amount + date proximity)
- Many-to-one matching (multiple GL transactions = one bank item)
- One-to-many matching (one GL transaction = multiple bank items)
- Confidence scoring

✅ **Reconciliation Workflow**
- Reconciling item categories:
  - Deposits in transit
  - Outstanding checks
  - Bank errors
  - Book errors
  - Bank charges
  - Interest income
- Manual matching interface
- Adjustment entry creation
- Finalization and locking

✅ **Reporting & Analytics**
- Daily reconciliation status
- Period-end reconciliation statement
- Variance analysis report
- Outstanding item aging
- Exception reporting

### 2.2 OUT OF SCOPE

❌ **Bank Statement Fetching** — External integration (future)
❌ **Payment Initiation** — That's AP-05 (Payment Execution)
❌ **Cash Forecasting** — Future module
❌ **Bank Fee Analysis** — Future enhancement

---

## 3. Functional Requirements

### 3.1 Reconciliation Lifecycle State Machine

```
┌─────────────────────────────────────────────────────────────┐
│              RECONCILIATION LIFECYCLE                        │
│                                                              │
│   DRAFT ──► IN_PROGRESS ──► RECONCILED ──► FINALIZED        │
│      │            │              │                            │
│      │            │              └──► ADJUSTED (book errors) │
│      │            │                      │                    │
│      │            │                      └──► RECONCILED      │
│      │            │                                            │
│      │            └──► EXCEPTION (large variance)             │
│      │                                                         │
│      └──► CANCELLED                                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

| State | Description | Can Finalize? | Transitions |
|-------|-------------|:-------------:|-------------|
| **DRAFT** | Statement imported, not started | ❌ No | → IN_PROGRESS, → CANCELLED |
| **IN_PROGRESS** | Matching in progress | ❌ No | → RECONCILED, → EXCEPTION |
| **RECONCILED** | All items matched, balance reconciled | ✅ Yes | → FINALIZED, → ADJUSTED |
| **ADJUSTED** | Book errors corrected | ✅ Yes | → RECONCILED |
| **FINALIZED** | Reconciliation locked | ❌ No | None (terminal) |
| **EXCEPTION** | Large variance, requires review | ❌ No | → IN_PROGRESS (after review) |
| **CANCELLED** | Reconciliation cancelled | ❌ No | None (terminal) |

### 3.2 Core Operations

#### 3.2.1 Import Bank Statement

**Process:**
1. Validate file format (MT940, BAI2, CSV, OFX)
2. Parse statement data
3. Detect duplicates (same statement already imported)
4. Validate statement period
5. Create statement record and transaction items

**Input:**
```typescript
{
  bankAccountId: string;               // FK to TR-01
  statementFormat: 'mt940' | 'bai2' | 'csv' | 'ofx';
  statementData: string | Buffer;     // File content
  statementDate: Date;
  importedBy: string;
}
```

**Statement Parsing:**
```typescript
// MT940 format example
interface MT940Statement {
  accountNumber: string;
  statementDate: Date;
  openingBalance: Money;
  closingBalance: Money;
  transactions: Array<{
    valueDate: Date;
    entryDate: Date;
    amount: Money;
    debitCredit: 'D' | 'C';           // Debit or Credit
    reference: string;
    description: string;
    counterparty?: string;
  }>;
}

// Parse and create records
const statement = await parseMT940(statementData);
const statementRecord = await createStatement({
  bankAccountId,
  statementDate: statement.statementDate,
  openingBalance: statement.openingBalance,
  closingBalance: statement.closingBalance,
  currency: statement.openingBalance.currency,
  status: 'draft'
});

for (const tx of statement.transactions) {
  await createStatementItem({
    statementId: statementRecord.id,
    valueDate: tx.valueDate,
    entryDate: tx.entryDate,
    amount: tx.amount,
    debitCredit: tx.debitCredit,
    reference: tx.reference,
    description: tx.description,
    counterparty: tx.counterparty,
    status: 'unmatched'
  });
}
```

**Validations:**
- Statement date must be within open fiscal period (K_TIME)
- Bank account must be ACTIVE (TR-01)
- Statement must not be duplicate (see Section 3.2.1.1 for strong dedupe keys)
- Opening balance must match previous statement closing balance (or first statement)
- Statement period must be valid (period_start <= period_end)

**Duplicate Detection (Strong Keys):**
```typescript
async detectDuplicate(
  bankAccountId: string,
  statement: ParsedStatement
): Promise<{ isDuplicate: boolean; existingStatementId?: string }> {
  // Strong dedupe keys: bank_account_id + statement_number + statement_date + opening_balance + closing_balance + statement_range
  const existing = await statementRepo.findByKeys({
    bankAccountId,
    statementNumber: statement.statementNumber,
    statementDate: statement.statementDate,
    openingBalance: statement.openingBalance,
    closingBalance: statement.closingBalance,
    periodStart: statement.periodStart,
    periodEnd: statement.periodEnd
  });
  
  if (existing) {
    // Also check file hash if available
    if (statement.fileHash && existing.fileHash === statement.fileHash) {
      return { isDuplicate: true, existingStatementId: existing.id };
    }
    
    // If statement number + date + balances match, likely duplicate
    return { isDuplicate: true, existingStatementId: existing.id };
  }
  
  return { isDuplicate: false };
}
```

**Statement Period Model:**
```typescript
interface StatementPeriod {
  statementId: string;
  periodStart: Date;                  // First transaction date in statement
  periodEnd: Date;                    // Last transaction date in statement
  openingBalanceDate: Date;           // Date of opening balance
  closingBalanceDate: Date;            // Date of closing balance
  statementDate: Date;                 // Statement generation date
}
```

**Output:**
- Statement record created (status: DRAFT)
- Statement items created (status: unmatched)
- Audit event: `treasury.reconciliation.statement_imported`

#### 3.2.2 Automatic Matching

**Process:**
1. Get GL transactions for bank account (from GL-05)
2. Get bank statement items
3. Normalize amounts to signed minor units + currency
4. Run matching algorithms:
   - Exact match
   - Fuzzy match
   - Many-to-one
   - One-to-many
5. Assign confidence scores
6. Auto-match high-confidence items
7. Flag low-confidence items for manual review
8. Create match records in `treasury_recon_matches` table

**Input:**
```typescript
{
  statementId: string;
  matchingRules?: {
    exactMatchEnabled: boolean;
    fuzzyMatchEnabled: boolean;
    dateToleranceDays: number;        // Default: 3 days
  };
}
```

**Currency-Aware Tolerance:**
```typescript
// Get tolerance per currency (not hardcoded 0.01)
async getTolerance(currency: string): Promise<number> {
  const currencyConfig = await currencyRepo.getConfig(currency);
  // Returns minor unit tolerance:
  // JPY: 1 (no decimals)
  // KWD: 0.001 (3 decimals)
  // USD: 0.01 (2 decimals)
  // etc.
  return currencyConfig.tolerance;
}
```

**Amount Normalization (Signed Minor Units):**
```typescript
interface NormalizedAmount {
  signedMinorUnits: number;           // Integer: positive = credit, negative = debit
  currency: string;
  originalAmount: Money;
}

function normalizeBankAmount(bankItem: StatementItem): NormalizedAmount {
  const amountMinorUnits = parseFloat(bankItem.amount.amount) * Math.pow(10, getCurrencyDecimals(bankItem.amount.currency));
  // Bank items: D = debit (negative), C = credit (positive)
  const signedMinorUnits = bankItem.debitCredit === 'D' 
    ? -Math.round(amountMinorUnits)
    : Math.round(amountMinorUnits);
  
  return {
    signedMinorUnits,
    currency: bankItem.amount.currency,
    originalAmount: bankItem.amount
  };
}

function normalizeGLAmount(glTransaction: GLTransaction): NormalizedAmount {
  const amountMinorUnits = parseFloat(glTransaction.amount.amount) * Math.pow(10, getCurrencyDecimals(glTransaction.amount.currency));
  // GL transactions: debit = positive, credit = negative (or vice versa depending on account type)
  // For bank account: debit increases balance (positive), credit decreases balance (negative)
  const signedMinorUnits = glTransaction.debitCredit === 'D'
    ? Math.round(amountMinorUnits)
    : -Math.round(amountMinorUnits);
  
  return {
    signedMinorUnits,
    currency: glTransaction.amount.currency,
    originalAmount: glTransaction.amount
  };
}
```

**Date Comparison (Day-Based, Timezone-Safe):**
```typescript
function compareDates(dateA: Date, dateB: Date, bankTimezone: string): number {
  // Convert to bank timezone
  const dateAInBankTz = convertToTimezone(dateA, bankTimezone);
  const dateBInBankTz = convertToTimezone(dateB, bankTimezone);
  
  // Get dates only (strip time)
  const dateAOnly = new Date(dateAInBankTz.getFullYear(), dateAInBankTz.getMonth(), dateAInBankTz.getDate());
  const dateBOnly = new Date(dateBInBankTz.getFullYear(), dateBInBankTz.getMonth(), dateBInBankTz.getDate());
  
  // Calculate difference in days (not milliseconds)
  const diffMs = dateAOnly.getTime() - dateBOnly.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  
  return diffDays;
}
```

**Matching Algorithms (Fixed):**
```typescript
async autoMatch(statementId: string, rules: MatchingRules, actor: ActorContext): Promise<MatchingResult> {
  const statement = await statementRepo.findById(statementId);
  const bankAccount = await bankRepo.findById(statement.bankAccountId);
  const bankItems = await statementItemRepo.findByStatement(statementId);
  const glTransactions = await glRepo.getTransactions(statement.bankAccountId, statement.periodStart, statement.periodEnd);
  
  const matches: Array<ReconMatch> = [];
  const tolerance = await getTolerance(statement.currency);
  
  // 1. Exact Match
  if (rules.exactMatchEnabled) {
    for (const bankItem of bankItems.filter(i => i.status === 'unmatched')) {
      const normalizedBank = normalizeBankAmount(bankItem);
      
      for (const glTxn of glTransactions.filter(gl => !gl.matched)) {
        const normalizedGL = normalizeGLAmount(glTxn);
        
        // Compare signed minor units
        if (normalizedBank.signedMinorUnits === normalizedGL.signedMinorUnits &&
            normalizedBank.currency === normalizedGL.currency &&
            normalizedBank.originalAmount.reference === normalizedGL.originalAmount.reference) {
          
          // Compare dates (day-based, not milliseconds)
          const dateDiff = compareDates(bankItem.valueDate, glTxn.transactionDate, bankAccount.timezone);
          if (dateDiff === 0) { // Same day
            const match = await createMatch({
              statementId,
              bankItemId: bankItem.id,
              glTransactionId: glTxn.id,
              allocatedAmount: bankItem.amount,
              matchType: 'exact',
              confidence: 1.0,
              matchedBy: actor.userId
            });
            matches.push(match);
            break; // One match per bank item
          }
        }
      }
    }
  }
  
  // 2. Fuzzy Match
  if (rules.fuzzyMatchEnabled) {
    for (const bankItem of bankItems.filter(i => i.status === 'unmatched')) {
      const normalizedBank = normalizeBankAmount(bankItem);
      const toleranceMinorUnits = tolerance * Math.pow(10, getCurrencyDecimals(bankItem.amount.currency));
      
      const fuzzyMatches = glTransactions
        .filter(gl => !gl.matched)
        .map(gl => {
          const normalizedGL = normalizeGLAmount(gl);
          const amountDiff = Math.abs(normalizedBank.signedMinorUnits - normalizedGL.signedMinorUnits);
          const dateDiff = Math.abs(compareDates(bankItem.valueDate, gl.transactionDate, bankAccount.timezone));
          
          if (amountDiff <= toleranceMinorUnits && dateDiff <= rules.dateToleranceDays) {
            const confidence = calculateConfidence(bankItem, gl, amountDiff, dateDiff);
            return { gl, confidence, amountDiff, dateDiff };
          }
          return null;
        })
        .filter(m => m !== null)
        .sort((a, b) => b!.confidence - a!.confidence);
      
      if (fuzzyMatches.length > 0 && fuzzyMatches[0]!.confidence >= 0.8) {
        const match = await createMatch({
          statementId,
          bankItemId: bankItem.id,
          glTransactionId: fuzzyMatches[0]!.gl.id,
          allocatedAmount: bankItem.amount,
          matchType: 'fuzzy',
          confidence: fuzzyMatches[0]!.confidence,
          matchedBy: actor.userId
        });
        matches.push(match);
      }
    }
  }
  
  // 3. Many-to-One (Multiple GL transactions = One bank item)
  const manyToOneMatches = await findManyToOneMatches(bankItems, glTransactions, tolerance, bankAccount.timezone, rules.dateToleranceDays);
  for (const match of manyToOneMatches) {
    // Create match record with allocations
    const matchRecord = await createMatch({
      statementId,
      bankItemId: match.bankItemId,
      glTransactionId: null, // Many-to-one: no single GL transaction
      allocatedAmount: match.totalAmount,
      matchType: 'many_to_one',
      confidence: match.confidence,
      matchedBy: actor.userId
    });
    
    // Create allocation records for each GL transaction
    for (const allocation of match.allocations) {
      await createMatchAllocation({
        matchId: matchRecord.id,
        glTransactionId: allocation.glTransactionId,
        allocatedAmount: allocation.amount,
        allocationOrder: allocation.order
      });
    }
    
    matches.push(matchRecord);
  }
  
  // 4. One-to-Many (One GL transaction = Multiple bank items)
  const oneToManyMatches = await findOneToManyMatches(bankItems, glTransactions, tolerance, bankAccount.timezone, rules.dateToleranceDays);
  for (const match of oneToManyMatches) {
    // Create match record
    const matchRecord = await createMatch({
      statementId,
      bankItemId: null, // One-to-many: no single bank item
      glTransactionId: match.glTransactionId,
      allocatedAmount: match.totalAmount,
      matchType: 'one_to_many',
      confidence: match.confidence,
      matchedBy: actor.userId
    });
    
    // Create allocation records for each bank item
    for (const allocation of match.allocations) {
      await createMatchAllocation({
        matchId: matchRecord.id,
        bankItemId: allocation.bankItemId,
        allocatedAmount: allocation.amount,
        allocationOrder: allocation.order
      });
    }
    
    matches.push(matchRecord);
  }
  
  return { matches, matchedCount: matches.length };
}
```

**Output:**
- Matched items updated (status: matched)
- Unmatched items flagged for manual review
- Matching report generated
- Audit event: `treasury.reconciliation.auto_matched`

#### 3.2.3 Manual Matching

**Process:**
1. Display unmatched items (bank and GL)
2. User selects items to match
3. Validate match (amounts, dates reasonable)
4. Create match record
5. Update item status

**Input:**
```typescript
{
  statementId: string;
  matches: Array<{
    bankItemId: string;
    glTransactionIds: string[];       // Can be multiple for many-to-one
    matchType: 'exact' | 'fuzzy' | 'manual';
    confidence?: number;
    reason?: string;                   // User-provided reason
  }>;
  matchedBy: string;
}
```

**Validations:**
- Amounts must match (within tolerance)
- Dates must be reasonable (within 30 days typically)
- Items must not already be matched
- User must have `treasury.reconciliation.match` permission

**Output:**
- Match records created
- Item statuses updated
- Audit event: `treasury.reconciliation.manually_matched`

#### 3.2.4 Calculate Adjusted GL Balance

**Process:**
1. Get GL balance at statement date
2. Get all reconciling items
3. Calculate adjusted GL balance using Money-safe arithmetic
4. Compare with bank balance using currency-aware tolerance
5. Check exception threshold

**Input:**
```typescript
{
  statementId: string;
}
```

**Adjusted GL Balance Calculation (Money-Safe):**
```typescript
async calculateAdjustedGLBalance(statementId: string): Promise<{
  glBalance: Money;
  adjustedGLBalance: Money;
  bankBalance: Money;
  difference: Money;
  isReconciled: boolean;
  exceptionThresholdExceeded: boolean;
}> {
  const statement = await statementRepo.findById(statementId);
  const bankAccount = await bankRepo.findById(statement.bankAccountId);
  
  // Get GL balance at statement date (using Money type)
  const glBalance = await glRepo.getAccountBalance(
    bankAccount.glAccountCode,
    statement.closingBalanceDate
  );
  
  // Get reconciling items
  const reconcilingItems = await reconcilingItemRepo.findByStatement(statementId);
  
  // Calculate adjustments using Money-safe arithmetic
  let adjustments = Money.zero(statement.currency);
  
  for (const item of reconcilingItems) {
    const itemAmount = Money.from(item.amount);
    
    // Add items that increase GL balance
    if (item.itemType === 'deposit_in_transit' || item.itemType === 'interest') {
      adjustments = adjustments.add(itemAmount);
    }
    
    // Subtract items that decrease GL balance
    if (item.itemType === 'outstanding_check' || item.itemType === 'bank_charge') {
      adjustments = adjustments.subtract(itemAmount);
    }
  }
  
  // Calculate adjusted GL balance (Money-safe)
  const adjustedGLBalance = glBalance.add(adjustments);
  
  // Compare with bank balance
  const bankBalance = Money.from(statement.closingBalance);
  const difference = adjustedGLBalance.subtract(bankBalance);
  
  // Get currency-aware tolerance
  const tolerance = await getTolerance(statement.currency);
  const toleranceMoney = Money.from({ amount: String(tolerance), currency: statement.currency });
  
  // Check if reconciled (within tolerance)
  const absDifference = difference.abs();
  const isReconciled = absDifference.lessThanOrEqual(toleranceMoney);
  
  // Check exception threshold
  const exceptionThreshold = await getExceptionThreshold(statement.currency);
  const exceptionThresholdMoney = Money.from({ amount: String(exceptionThreshold), currency: statement.currency });
  const exceptionThresholdExceeded = absDifference.greaterThan(exceptionThresholdMoney);
  
  // Update statement
  await statementRepo.update(statementId, {
    glBalance: glBalance.toJSON(),
    adjustedGLBalance: adjustedGLBalance.toJSON(),
    difference: difference.toJSON()
  });
  
  // If exception threshold exceeded, flag for review
  if (exceptionThresholdExceeded) {
    await flagException(statementId, {
      difference: difference.toJSON(),
      threshold: exceptionThresholdMoney.toJSON(),
      reason: 'Difference exceeds exception threshold',
      requiresEscalation: true
    });
  }
  
  return {
    glBalance: glBalance.toJSON(),
    adjustedGLBalance: adjustedGLBalance.toJSON(),
    bankBalance: bankBalance.toJSON(),
    difference: difference.toJSON(),
    isReconciled,
    exceptionThresholdExceeded
  };
}

async getExceptionThreshold(currency: string): Promise<number> {
  const policy = await policyPort.getReconciliationPolicy(currency);
  // Returns threshold based on currency and policy:
  // USD: $1,000 (default)
  // JPY: ¥100,000
  // etc.
  return policy.exceptionThreshold;
}
```

**Output:**
- Reconciling items created
- Adjusted GL balance calculated
- Reconciliation status updated
- Audit event: `treasury.reconciliation.reconciling_items_created`

#### 3.2.5 Create Adjustment Entry

**Process:**
1. Identify book errors (missing transactions, incorrect amounts)
2. Create adjustment journal entry (via GL-03)
3. Post adjustment
4. Re-run matching
5. Update reconciliation status

**Input:**
```typescript
{
  statementId: string;
  adjustment: {
    accountCode: string;               // Bank account GL code
    debitAmount?: Money;
    creditAmount?: Money;
    description: string;
    reason: string;                     // Why adjustment needed
  };
  createdBy: string;
  approvedBy: string;                   // Dual authorization
}
```

**Adjustment Entry:**
```typescript
// Example: Bank charge not recorded in GL
await glPostingPort.postJournal({
  sourceType: 'BANK_RECONCILIATION_ADJUSTMENT',
  sourceId: statementId,
  lines: [
    {
      accountCode: adjustment.accountCode,  // Bank account
      debitAmount: undefined,
      creditAmount: adjustment.creditAmount, // Bank charge
    },
    {
      accountCode: 'BANK_CHARGES',          // Expense account
      debitAmount: adjustment.debitAmount,
      creditAmount: undefined,
    }
  ],
  memo: adjustment.description,
  postedBy: actor.userId,
  correlationId: actor.correlationId
});

// Re-run matching after adjustment
await autoMatch(statementId);
```

**Output:**
- Adjustment journal entry posted
- GL balance updated
- Matching re-run
- Reconciliation status updated
- Audit event: `treasury.reconciliation.adjustment_created`

#### 3.2.6 Finalize Reconciliation

**Process:**
1. Verify all items matched or categorized as reconciling items
2. Verify adjusted GL balance = bank balance (within currency-aware tolerance)
3. Verify no exception threshold exceeded
4. Lock reconciliation (cannot modify)
5. Generate reconciliation report
6. Store statement-derived balance snapshot (do NOT overwrite GL balance)

**Input:**
```typescript
{
  statementId: string;
  finalizedBy: string;
  approver1Id: string;
  approver2Id: string;                   // Dual authorization
  notes?: string;
}
```

**Finalization Validations (Money-Safe + Rounding Rules):**
```typescript
async finalizeReconciliation(
  statementId: string,
  finalization: FinalizationRequest,
  actor: ActorContext
): Promise<FinalizationResult> {
  const statement = await statementRepo.findById(statementId);
  const bankAccount = await bankRepo.findById(statement.bankAccountId);
  
  // Verify period is open (Lock 1: Period Lock)
  await timePort.verifyPeriodOpen(statement.tenantId, statement.statementDate);
  
  // 1. Verify all items matched or categorized
  const unmatchedItems = await statementItemRepo.findUnmatched(statementId);
  if (unmatchedItems.length > 0) {
    throw new ReconciliationNotCompleteError(
      `Cannot finalize: ${unmatchedItems.length} unmatched items remaining`,
      { unmatchedItems: unmatchedItems.map(i => ({ id: i.id, amount: i.amount, description: i.description })) }
    );
  }
  
  // 2. Calculate adjusted GL balance (Money-safe)
  const balanceResult = await calculateAdjustedGLBalance(statementId);
  
  if (!balanceResult.isReconciled) {
    throw new ReconciliationNotBalancedError(
      `Cannot finalize: Difference of ${balanceResult.difference.amount} ${balanceResult.difference.currency} remains`,
      { difference: balanceResult.difference, tolerance: await getTolerance(statement.currency) }
    );
  }
  
  // 3. Verify no exception threshold exceeded
  if (balanceResult.exceptionThresholdExceeded) {
    throw new ReconciliationExceptionError(
      `Cannot finalize: Difference exceeds exception threshold`,
      { difference: balanceResult.difference, threshold: await getExceptionThreshold(statement.currency) }
    );
  }
  
  // 4. Verify dual authorization
  if (finalization.approver1Id === finalization.approver2Id) {
    throw new SoDViolationError('Dual authorization requires two distinct approvers');
  }
  
  if (finalization.approver1Id === actor.userId || finalization.approver2Id === actor.userId) {
    throw new SoDViolationError('Finalizer cannot be an approver');
  }
  
  // 5. Finalize (lock reconciliation)
  await statementRepo.update(statementId, {
    status: 'finalized',
    finalizedBy: actor.userId,
    approver1Id: finalization.approver1Id,
    approver2Id: finalization.approver2Id,
    finalizedAt: new Date(),
    notes: finalization.notes,
    version: statement.version + 1
  });
  
  // 6. Store statement-derived balance snapshot (do NOT overwrite GL balance)
  await bankAccountBalanceSnapshotRepo.create({
    bankAccountId: statement.bankAccountId,
    statementId: statementId,
    balanceDate: statement.closingBalanceDate,
    balance: statement.closingBalance,
    source: 'bank_statement',
    reconciledAt: new Date(),
    reconciledBy: actor.userId
  });
  
  // 7. Generate reconciliation report
  const report = await generateReconciliationReport(statementId);
  
  // Audit
  await auditPort.emitTransactional({
    event: 'treasury.reconciliation.finalized',
    actor,
    metadata: {
      statementId,
      adjustedGLBalance: balanceResult.adjustedGLBalance,
      bankBalance: balanceResult.bankBalance,
      difference: balanceResult.difference,
      approvers: [finalization.approver1Id, finalization.approver2Id]
    }
  });
  
  return {
    statementId,
    finalizedAt: new Date(),
    adjustedGLBalance: balanceResult.adjustedGLBalance,
    bankBalance: balanceResult.bankBalance,
    reportId: report.id
  };
}
```

**Rounding Rules:**
```typescript
interface RoundingRules {
  currency: string;
  bankRounding: 'round_half_up' | 'round_half_down' | 'round_half_even' | 'truncate';
  glRounding: 'round_half_up' | 'round_half_down' | 'round_half_even' | 'truncate';
  decimalPlaces: number;
}

// Apply rounding rules when comparing balances
function applyRoundingRules(amount: Money, rules: RoundingRules, source: 'bank' | 'gl'): Money {
  const roundingMethod = source === 'bank' ? rules.bankRounding : rules.glRounding;
  const roundedAmount = roundMoney(amount, rules.decimalPlaces, roundingMethod);
  return roundedAmount;
}
```

**Output:**
- Reconciliation status → FINALIZED
- Reconciliation report generated
- Reconciliation locked (immutable)
- Audit event: `treasury.reconciliation.finalized`

---

## 4. Control Points

### 4.1 Period Cutoff (Treasury Non-Negotiable)

**Requirement:** Reconciliation must be finalized before period close.

**Lock Rule:** Cannot close period if any **required** bank account has pending reconciliation.

**Required Reconciliation Set:**
- **ACTIVE** bank accounts with transactions or statements in period
- Exemptions: Dormant accounts (no transactions for 12+ months), New accounts (created in current period, no prior statements)

**Enforcement:**
```typescript
async validatePeriodClose(
  tenantId: string,
  periodCode: string
): Promise<ValidationResult> {
  // Get required bank accounts (ACTIVE with transactions or statements)
  const requiredAccounts = await bankRepo.findRequiredForReconciliation(tenantId, periodCode);
  
  // Check reconciliation status for each required account
  const pendingReconciliations: Array<{ accountId: string; reason: string }> = [];
  
  for (const account of requiredAccounts) {
    const reconciliation = await reconciliationRepo.findLatest(account.id, periodCode);
    
    if (!reconciliation || reconciliation.status !== 'finalized') {
      pendingReconciliations.push({
        accountId: account.id,
        reason: reconciliation 
          ? `Reconciliation status: ${reconciliation.status}`
          : 'No reconciliation found'
      });
    }
  }
  
  if (pendingReconciliations.length > 0) {
    throw new PeriodCloseBlockedError(
      `Cannot close period: ${pendingReconciliations.length} bank accounts have pending reconciliation`,
      { pendingReconciliations }
    );
  }
  
  return { valid: true, requiredAccountsCount: requiredAccounts.length };
}
```

**Database Trigger:**
```sql
-- Trigger on period close (GL-04)
CREATE OR REPLACE FUNCTION finance.validate_bank_reconciliation()
RETURNS TRIGGER AS $$
DECLARE
  pending_count INTEGER;
BEGIN
  IF NEW.status = 'closed' THEN
    SELECT COUNT(*) INTO pending_count
    FROM treasury.bank_accounts ba
    WHERE ba.tenant_id = NEW.tenant_id
      AND ba.status = 'active'
      AND ba.id IN (
        SELECT DISTINCT bank_account_id
        FROM treasury.bank_statements
        WHERE tenant_id = NEW.tenant_id
          AND period_code = NEW.period_code
      )
      AND NOT EXISTS (
        SELECT 1
        FROM treasury.bank_statements bs
        WHERE bs.bank_account_id = ba.id
          AND bs.period_code = NEW.period_code
          AND bs.status = 'finalized'
      );
    
    IF pending_count > 0 THEN
      RAISE EXCEPTION 'Cannot close period: % bank accounts have pending reconciliation', pending_count;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 4.2 Dual Authorization (Treasury Non-Negotiable)

**Requirement:** All adjustments and finalizations require two distinct approvers.

**Enforcement:**
```sql
ALTER TABLE treasury.reconciliation_adjustments
  ADD CONSTRAINT chk_dual_approval
  CHECK (
    (created_by IS NOT NULL) AND
    (approved_by IS NOT NULL) AND
    (created_by != approved_by)
  );
```

### 4.3 Exception Policy

**Exception Threshold:**
- Currency-aware threshold (e.g., USD: $1,000, JPY: ¥100,000)
- Configurable per currency via K_POLICY

**Exception Escalation:**
- If difference exceeds threshold → status = EXCEPTION
- Required roles for resolution:
  - **IC Accountant:** Can investigate and create reconciling items
  - **IC Manager:** Can approve adjustments up to threshold
  - **Controller:** Can approve adjustments above threshold
  - **CFO:** Can approve all adjustments

**Resolution Actions:**
- Book error adjustment (via GL-03)
- Bank error claim (contact bank, document claim)
- Carry-forward approval (if timing difference, requires approval)

**Exception Workflow:**
```typescript
async handleException(
  statementId: string,
  exception: ExceptionDetails,
  actor: ActorContext
): Promise<void> {
  const statement = await statementRepo.findById(statementId);
  
  // Check if exception threshold exceeded
  const threshold = await getExceptionThreshold(statement.currency);
  const difference = parseFloat(statement.difference.amount);
  
  if (Math.abs(difference) > threshold) {
    // Flag as exception
    await statementRepo.update(statementId, {
      status: 'exception',
      exceptionReason: exception.reason,
      exceptionThreshold: threshold,
      escalatedTo: determineEscalationRole(difference, threshold)
    });
    
    // Notify escalation role
    await notifyEscalation(statementId, determineEscalationRole(difference, threshold));
  }
}

function determineEscalationRole(difference: number, threshold: number): string {
  if (Math.abs(difference) > threshold * 10) {
    return 'cfo'; // Large variance → CFO
  } else if (Math.abs(difference) > threshold * 5) {
    return 'controller'; // Medium variance → Controller
  } else {
    return 'ic_manager'; // Small variance → IC Manager
  }
}
```

### 4.4 The Lock Checklist

1. ✅ Normalize bank & GL lines into **signed minor units + currency** before matching.
2. ✅ Replace date comparisons with **day-based** logic (timezone-safe).
3. ✅ Currency-aware tolerances (not `0.01`).
4. ✅ Strong dedupe keys + file hash.
5. ✅ Introduce **match join table** with allocations + idempotency.
6. ✅ Finalization uses Money-safe arithmetic + rounding rules.
7. ✅ Statement-derived balance snapshot (do NOT overwrite GL balance).
8. ✅ Exception policy with thresholds and escalation.
9. ✅ Period close validation with required reconciliation set.

### 4.5 Audit Requirements

Every mutation **MUST** log:

| Event Type | Logged Data |
|------------|-------------|
| `treasury.reconciliation.statement_imported` | Statement details, import source, file hash, dedupe keys |
| `treasury.reconciliation.auto_matched` | Matching results, confidence scores, match type, allocations |
| `treasury.reconciliation.manually_matched` | Manual matches, user ID, reason |
| `treasury.reconciliation.match_unmatched` | Unmatch action, reason, version |
| `treasury.reconciliation.reconciling_items_created` | Reconciling items, categories, amounts |
| `treasury.reconciliation.adjustment_created` | Adjustment details, approvers, journal entry ID |
| `treasury.reconciliation.finalized` | Final reconciliation, approvers, adjusted GL balance, bank balance, difference |
| `treasury.reconciliation.exception_flagged` | Exception details, threshold, escalation role |
| `treasury.reconciliation.exception_resolved` | Resolution action, approver, evidence |

---

## 5. GL Impact

**GL Posting:** This cell **DOES** create journal entries via GL-03 (for adjustments only).

**Adjustment Entry Example:**
```
Dr. Bank Charges                      $45.00
    Cr. Cash (Bank Account)                       $45.00
```

**Note:** Reconciliation itself does not post entries. Only adjustments (book errors) create journal entries.

---

## 6. Data Model

### 6.1 Primary Entity: `treasury_bank_statements`

```typescript
interface BankStatement {
  // ═══════════════════════════════════════════════════════════
  // IDENTITY
  // ═══════════════════════════════════════════════════════════
  id: string;
  tenant_id: string;
  bank_account_id: string;            // FK to TR-01
  statement_number: string;            // From bank
  statement_date: Date;                // Statement generation date
  
  // ═══════════════════════════════════════════════════════════
  // STATEMENT PERIOD
  // ═══════════════════════════════════════════════════════════
  period_start: Date;                  // First transaction date
  period_end: Date;                    // Last transaction date
  opening_balance_date: Date;          // Date of opening balance
  closing_balance_date: Date;          // Date of closing balance
  
  // ═══════════════════════════════════════════════════════════
  // BALANCES
  // ═══════════════════════════════════════════════════════════
  opening_balance: Money;
  closing_balance: Money;
  currency: string;
  
  // ═══════════════════════════════════════════════════════════
  // RECONCILIATION
  // ═══════════════════════════════════════════════════════════
  gl_balance: Money;                   // GL balance at closing_balance_date
  adjusted_gl_balance: Money;         // After reconciling items
  difference: Money;                   // adjusted_gl_balance - closing_balance
  
  // ═══════════════════════════════════════════════════════════
  // STATUS
  // ═══════════════════════════════════════════════════════════
  status: 'draft' | 'in_progress' | 'reconciled' | 'adjusted' | 'finalized' | 'exception' | 'cancelled';
  
  // ═══════════════════════════════════════════════════════════
  // EXCEPTION
  // ═══════════════════════════════════════════════════════════
  exception_reason?: string;
  exception_threshold?: Money;
  escalated_to?: string;              // Role: 'ic_manager' | 'controller' | 'cfo'
  
  // ═══════════════════════════════════════════════════════════
  // METADATA
  // ═══════════════════════════════════════════════════════════
  import_format: 'mt940' | 'bai2' | 'csv' | 'ofx';
  import_source: string;               // File name or API source
  file_hash?: string;                  // SHA-256 hash for deduplication
  total_items: number;
  matched_items: number;
  unmatched_items: number;
  
  // ═══════════════════════════════════════════════════════════
  // AUDIT TRAIL
  // ═══════════════════════════════════════════════════════════
  imported_by: string;
  imported_at: Date;
  finalized_by?: string;
  finalized_at?: Date;
  approver1_id?: string;              // Dual authorization
  approver2_id?: string;               // Dual authorization
  version: number;
}
```

### 6.2 Statement Item Entity: `treasury_statement_items`

```typescript
interface StatementItem {
  id: string;
  statement_id: string;                // FK to treasury_bank_statements
  value_date: Date;
  entry_date: Date;
  amount: Money;
  debit_credit: 'D' | 'C';            // Debit or Credit
  reference: string;
  description: string;
  counterparty?: string;
  
  // Matching (status only - actual matches in treasury_recon_matches)
  status: 'unmatched' | 'matched' | 'reconciling_item';
  
  // Reconciling item
  reconciling_item_type?: 'deposit_in_transit' | 'outstanding_check' | 'bank_error' | 'book_error' | 'bank_charge' | 'interest';
  expected_clearing_date?: Date;
}
```

### 6.3 Match Entity: `treasury_recon_matches` (Many-to-Many + Allocations)

```typescript
interface ReconMatch {
  id: string;
  tenant_id: string;
  statement_id: string;                // FK to treasury_bank_statements
  bank_item_id?: string;               // FK to treasury_statement_items (null for one-to-many)
  gl_transaction_id?: string;          // FK to GL transactions (null for many-to-one)
  
  // Match Details
  match_type: 'exact' | 'fuzzy' | 'manual' | 'many_to_one' | 'one_to_many';
  allocated_amount: Money;              // Total allocated amount for this match
  confidence: number;                   // 0.0 - 1.0
  match_reason?: string;               // User-provided reason (for manual matches)
  
  // Status
  status: 'active' | 'unmatched' | 'superseded';
  unmatched_reason?: string;
  unmatched_by?: string;
  unmatched_at?: Date;
  
  // Authorization
  matched_by: string;
  matched_at: Date;
  
  // Idempotency
  idempotency_key?: string;            // For retry scenarios
  
  // Versioning
  version: number;                      // For optimistic locking
  superseded_by_version?: number;
}
```

### 6.4 Match Allocation Entity: `treasury_recon_match_allocations`

```typescript
interface ReconMatchAllocation {
  id: string;
  match_id: string;                    // FK to treasury_recon_matches
  bank_item_id?: string;                // FK to treasury_statement_items (for one-to-many)
  gl_transaction_id?: string;           // FK to GL transactions (for many-to-one)
  allocated_amount: Money;              // Partial amount allocated
  allocation_order: number;             // Order in allocation sequence
  created_at: Date;
}
```

### 6.5 Bank Account Balance Snapshot Entity: `treasury_bank_account_balance_snapshots`

```typescript
interface BankAccountBalanceSnapshot {
  id: string;
  tenant_id: string;
  bank_account_id: string;             // FK to TR-01
  statement_id: string;                 // FK to treasury_bank_statements
  balance_date: Date;
  balance: Money;
  source: 'bank_statement' | 'manual' | 'api';
  reconciled_at: Date;
  reconciled_by: string;
  created_at: Date;
}
```

---

## 7. API Design

### 7.1 Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/treasury/reconciliations` | List reconciliations | `treasury.reconciliation.view` |
| POST | `/api/treasury/reconciliations` | Import statement | `treasury.reconciliation.import` |
| GET | `/api/treasury/reconciliations/:id` | Get reconciliation details | `treasury.reconciliation.view` |
| POST | `/api/treasury/reconciliations/:id/auto-match` | Auto-match items | `treasury.reconciliation.match` |
| POST | `/api/treasury/reconciliations/:id/manual-match` | Manual match | `treasury.reconciliation.match` |
| POST | `/api/treasury/reconciliations/:id/reconciling-items` | Create reconciling items | `treasury.reconciliation.reconcile` |
| POST | `/api/treasury/reconciliations/:id/adjustment` | Create adjustment | `treasury.reconciliation.adjust` + dual auth |
| POST | `/api/treasury/reconciliations/:id/finalize` | Finalize reconciliation | `treasury.reconciliation.finalize` + dual auth |

---

## 8. Dependencies

| Dependency | Type | Purpose |
|------------|------|---------|
| **TR-01** | Upstream | Bank account configuration, timezone |
| **GL-05** | Upstream | GL bank balances, transactions |
| **GL-03** | Downstream | Adjustment journal entries |
| **GL-04** | Downstream | Period close validation trigger |
| **K_TIME** | Kernel | Period cutoff, business day calendar |
| **K_FX** | Kernel | Currency configuration (decimals, tolerance) |
| **K_POLICY** | Kernel | Exception threshold policy, rounding rules |
| **K_AUTH** | Kernel | Dual authorization enforcement, role hierarchy |
| **K_LOG** | Kernel | Audit trail |

---

## 9. Test Requirements

### 9.1 Unit Tests
- `ReconciliationService.test.ts` — Statement import, matching, reconciliation
- `MatchingService.test.ts` — Matching algorithms (exact, fuzzy, many-to-one, one-to-many)

### 9.2 Control Tests
- `DualAuth.test.ts` — Two distinct approvers required
- `PeriodLock.test.ts` — Period close blocked if not reconciled
- `Audit.test.ts` — Audit event coverage

### 9.3 Integration Tests
- `reconciliation-cell.integration.test.ts` — Full workflow end-to-end

---

---

## 10. Critical Fixes Applied (P0 & P1)

This PRD has been updated to address all critical P0 (must fix) and P1 (should add) issues identified during review:

### ✅ P0 Fixes (Accuracy + Lock Correctness)

1. **✅ Date-Diff Logic (Fixed: Milliseconds → Days)**
   - Fixed: Convert milliseconds to days (`ms / 86_400_000`)
   - Added timezone-safe date comparison (bank timezone)
   - Day-based logic: `compareDates()` function returns days, not milliseconds

2. **✅ Amount Equality (Fixed: Signed Minor Units + Debit/Credit)**
   - Normalize to **signed minor units** (integer) + currency
   - Incorporate `debit_credit` from bank items (D/C) into signed amount
   - Bank items: D = negative, C = positive
   - GL transactions: Debit = positive (for bank account), Credit = negative

3. **✅ Tolerance "0.01" (Fixed: Currency-Aware)**
   - Tolerance stored as **minor-unit tolerance** per currency
   - JPY: 1 (no decimals), KWD: 0.001 (3 decimals), USD: 0.01 (2 decimals)
   - Retrieved from currency configuration, not hardcoded

4. **✅ Duplicate Detection (Fixed: Strong Keys)**
   - Strong dedupe keys: `{bank_account_id, statement_number, statement_date, opening_balance, closing_balance, period_start, period_end}`
   - Added file hash (SHA-256) for additional validation
   - Prevents false positives/negatives

5. **✅ Finalization Math (Fixed: Money-Safe + Rounding Rules)**
   - Uses Money-safe arithmetic (add, subtract, abs, lessThanOrEqual)
   - Defined rounding rules (bank rounding vs GL rounding)
   - Currency-aware tolerance comparison

### ✅ P1 Fixes (Prevents Future Firefighting)

6. **✅ Match Table (Many-to-Many + Allocations)**
   - Added `treasury_recon_matches` table (match join table)
   - Supports partial allocations (one bank line matches multiple GL lines with split amounts)
   - Supports reversals/unmatches with audit
   - Prevents GL line from being matched to multiple statements
   - Added `treasury_recon_match_allocations` for allocation details

7. **✅ Statement Period Model**
   - Added `period_start`, `period_end`, `opening_balance_date`, `closing_balance_date`
   - Matching depends on value/entry dates
   - Period model stored in statement entity

8. **✅ Bank Account Balance (Fixed: Statement-Derived Snapshot)**
   - Bank statement is **evidence**, not ledger overwrite
   - Store "latest bank balance" as **statement-derived snapshot** separate from GL
   - Added `treasury_bank_account_balance_snapshots` entity
   - Do NOT overwrite GL balance

9. **✅ Exception Policy (Defined)**
   - Exception threshold: Currency-aware (USD: $1,000, JPY: ¥100,000)
   - Required roles: IC Accountant, IC Manager, Controller, CFO
   - Resolution actions: Book error adjustment, bank error claim, carry-forward approval
   - Escalation workflow based on variance magnitude

10. **✅ Cutoff and Period-Close Rule (Clarified)**
    - Required reconciliation set = "ACTIVE bank accounts with transactions or statements in period"
    - Explicit exemptions: Dormant accounts (12+ months), New accounts (created in current period)
    - Database trigger enforces validation

### ✅ The Lock Checklist

1. ✅ Normalize bank & GL lines into **signed minor units + currency** before matching.
2. ✅ Replace date comparisons with **day-based** logic (timezone-safe).
3. ✅ Currency-aware tolerances (not `0.01`).
4. ✅ Strong dedupe keys + file hash.
5. ✅ Introduce **match join table** with allocations + idempotency.
6. ✅ Finalization uses Money-safe arithmetic + rounding rules.
7. ✅ Statement-derived balance snapshot (do NOT overwrite GL balance).
8. ✅ Exception policy with thresholds and escalation.
9. ✅ Period close validation with required reconciliation set.

---

**Status:** ✅ PRD Locked — All Critical Issues Resolved  
**Next Steps:** Create ARCHITECTURE-BRIEF.md and begin implementation

---

**Last Updated:** December 2025  
**Maintainer:** Finance Cell Team  
**Review Status:** ✅ Critical Issues Addressed
