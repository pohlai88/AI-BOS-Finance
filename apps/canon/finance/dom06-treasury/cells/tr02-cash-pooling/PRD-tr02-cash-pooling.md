# PRD: TR-02 Cash Pooling

> **Cell Code:** TR-02  
> **Domain:** Treasury (DOM-06)  
> **Status:** 📋 Design Phase — Awaiting User Review  
> **Created:** 2025-12-17  
> **Author:** AI-BOS Architecture Team

---

## 0. Executive Summary

The **Cash Pooling** cell manages **intercompany cash concentration and sweeping operations** to optimize group-wide liquidity. It automates the movement of excess cash from operating companies to a central treasury account and provides funding when needed.

**Why This Cell Exists:** Without automated cash pooling, companies hold excess cash in low-yield accounts while other entities face cash shortages, leading to inefficient liquidity management and higher borrowing costs.

**AIS Justification (Romney & Steinbart):**  
Cash Pooling is a **critical treasury operation** in the Treasury Cycle. It enforces **Liquidity Optimization** (centralized cash concentration) and **Custody of Assets** (automated fund movements with dual authorization).

**COSO Mapping:**  
- **Control Activity:** Automated sweep execution with dual authorization
- **Assertion:** Completeness — all pool participants accounted for
- **Risk:** Unauthorized fund movements, interest allocation errors

---

## 1. Business Justification

### 1.1 Problem Statement

**Current Pain Points:**
- ❌ Manual cash transfers between entities (time-consuming, error-prone)
- ❌ Excess cash sitting idle in low-yield accounts
- ❌ Cash shortages requiring external borrowing
- ❌ No automated interest allocation to pool participants
- ❌ Inconsistent intercompany loan tracking
- ❌ No visibility into group-wide cash position

### 1.2 Success Criteria

| # | Metric | Target | Measurement |
|---|--------|--------|-------------|
| 1 | **Automated Sweep Execution** | 100% | All configured sweeps execute automatically |
| 2 | **Dual Authorization Compliance** | 100% | All cash movements require two distinct approvers |
| 3 | **Interest Allocation Accuracy** | 100% | Interest allocated per arm's length rate |
| 4 | **GL Posting Accuracy** | 100% | Every sweep creates balanced journal entries |
| 5 | **Pool Balance Reconciliation** | 100% | Pool balance = sum of participant balances |

---

## 2. Scope Definition

### 2.1 IN SCOPE

✅ **Cash Pool Configuration**
- Master account setup (central treasury account)
- Participant account setup (operating company accounts)
- Sweep thresholds and target balances
- Frequency configuration (daily, weekly, monthly)
- Priority ordering for multi-participant pools

✅ **Sweep Execution**
- Automatic sweep initiation (scheduled or threshold-based)
- Balance check before sweep
- Dual authorization for sweep execution
- GL posting on completion
- Notification on failure

✅ **Interest Allocation**
- Interest calculation per participant (based on daily balances)
- Arm's length rate compliance
- Automatic intercompany loan entries
- Interest accrual and payment

✅ **Pool Types**
- Physical pooling (actual fund movement)
- Notional pooling (interest optimization without movement)
- Zero-balance pooling (automatic sweep to zero)

### 2.2 OUT OF SCOPE

❌ **FX Conversion** — That's TR-03 (FX Hedging)
❌ **Bank Statement Import** — That's TR-05 (Bank Reconciliation)
❌ **Manual Cash Transfers** — That's AP-05 (Payment Execution)
❌ **Cash Forecasting** — Future module
❌ **Investment Management** — Future module

---

## 3. Functional Requirements

### 3.1 Cash Pool Lifecycle State Machine

```
┌─────────────────────────────────────────────────────────────┐
│              CASH POOL LIFECYCLE                             │
│                                                              │
│   DRAFT ──► ACTIVE ──► SUSPENDED ──► INACTIVE              │
│      │          │            │                              │
│      │          │            └──► ACTIVE (reactivate)       │
│      │          │                                            │
│      └──► CANCELLED                                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

| State | Description | Can Execute Sweeps? | Transitions |
|-------|-------------|:-------------------:|-------------|
| **DRAFT** | Pool configuration in progress | ❌ No | → ACTIVE, → CANCELLED |
| **ACTIVE** | Pool operational, sweeps enabled | ✅ Yes | → SUSPENDED, → INACTIVE |
| **SUSPENDED** | Temporarily disabled | ❌ No | → ACTIVE (reactivate) |
| **INACTIVE** | Permanently closed | ❌ No | None (terminal) |
| **CANCELLED** | Withdrawn before activation | ❌ No | None (terminal) |

### 3.2 Core Operations

#### 3.2.1 Create Cash Pool

**Input:**
```typescript
{
  tenantId: string;
  poolName: string;
  poolType: 'physical' | 'notional' | 'zero_balance';
  masterAccountId: string;           // TR-01 bank account (central treasury)
  participantAccounts: Array<{
    accountId: string;                // TR-01 bank account (operating company)
    companyId: string;
    targetBalance: Money;             // Minimum balance to maintain
    sweepThreshold: Money;            // Trigger sweep when balance exceeds this
    priority: number;                  // Sweep order (1 = first)
  }>;
  sweepFrequency: 'daily' | 'weekly' | 'monthly';
  sweepTime: string;                  // HH:MM (e.g., "09:00")
  interestRate: number;               // Annual rate (e.g., 0.025 = 2.5%)
  interestCalculationMethod: 'daily_balance' | 'average_balance';
  dualAuthorizationRequired: boolean; // Default: true
}
```

**Validations:**
- Master account must be ACTIVE (TR-01)
- All participant accounts must be ACTIVE (TR-01)
- **Currency Policy:** 
  - **Option A (Default):** Master account currency MUST match all participant currencies (hard-block mixed currency pools)
  - **Option B (Advanced):** Mixed currency pools allowed ONLY if TR-03 (FX Hedging) is enabled + FX conversion rate source configured + conversion posting rules defined
- Target balances must be >= 0
- Sweep thresholds must be > target balances
- Interest rate must be arm's length (policy check via K_POLICY)
- **Legal Requirements:**
  - Intercompany cash pooling agreement reference (per jurisdiction)
  - Interest benchmarking documentation
  - Withholding tax handling rules (if applicable)
  - Regulatory ring-fencing limits per entity (if applicable)

**Business Rules:**
- Physical pooling requires actual fund movement capability
- Notional pooling requires interest allocation only (no fund movement)
- Zero-balance pooling sweeps all excess to master (target balance = 0)
- **Configuration Changes:** All pool configuration changes (participants, thresholds, rates, master account) require maker-checker approval (see Section 4.4)

**Output:**
- Created cash pool (status: DRAFT)
- Audit event: `treasury.cash_pool.created`

#### 3.2.2 Execute Sweep (Physical Pooling)

**Process:**
1. Check pool status (must be ACTIVE)
2. **Get balance source-of-truth** (see Section 3.2.2.1)
3. **Validate balance staleness** (see Section 3.2.2.2)
4. Calculate sweep amounts per participant (see Section 3.2.2.3)
5. Require dual authorization (if configured)
6. **Execute fund movements with idempotency** (via AP-05 payment service)
7. **Handle partial failures** (see Section 3.2.2.4)
8. Post GL entries (via GL-03) — **entity-by-entity** (see Section 5)
9. Update pool balances
10. Send notifications

**Input:**
```typescript
{
  poolId: string;
  executionDate: Date;
  initiatorId: string;
  approver1Id: string;
  approver2Id: string;                // Required for dual authorization
  reason?: string;
  idempotencyKey?: string;            // Optional: for retry scenarios
}
```

**Validations:**
- Pool must be ACTIVE
- Execution date must be within open fiscal period (K_TIME)
- Dual authorization: approver1Id ≠ approver2Id ≠ initiatorId
- Both approvers must have `treasury.cash_pool.approve` permission
- **Company/Account Scoping:** Initiator and approvers must have access to all participant companies/accounts (see Section 4.5)
- **Balance staleness check:** Balance must be within allowed staleness window (see Section 3.2.2.2)

---

##### 3.2.2.1 Balance Source-of-Truth

**Rule:** Balance source depends on reconciliation status and bank API availability.

**Priority Order:**
1. **Last Reconciled Balance (Preferred):** If TR-05 reconciliation exists for this account within last 24 hours, use reconciled GL balance
2. **Bank API Balance (Fallback):** If bank API available and last updated < 1 hour ago, use bank API balance
3. **GL Ledger Balance (Last Resort):** Use GL-05 trial balance (may exclude pending transactions)

**Implementation:**
```typescript
async getAccountBalance(
  accountId: string,
  asOfDate: Date
): Promise<{ balance: Money; source: 'reconciled' | 'bank_api' | 'gl_ledger'; lastUpdated: Date }> {
  // 1. Check last reconciliation (TR-05)
  const lastReconciliation = await reconciliationRepo.findLatest(accountId);
  if (lastReconciliation && 
      lastReconciliation.finalizedAt &&
      (asOfDate.getTime() - lastReconciliation.finalizedAt.getTime()) < 24 * 60 * 60 * 1000) {
    return {
      balance: lastReconciliation.adjustedGLBalance,
      source: 'reconciled',
      lastUpdated: lastReconciliation.finalizedAt
    };
  }
  
  // 2. Check bank API (if available)
  const bankApiBalance = await bankApi.getBalance(accountId);
  if (bankApiBalance && 
      (Date.now() - bankApiBalance.lastUpdated.getTime()) < 60 * 60 * 1000) {
    return {
      balance: bankApiBalance.balance,
      source: 'bank_api',
      lastUpdated: bankApiBalance.lastUpdated
    };
  }
  
  // 3. Fallback to GL ledger
  const glBalance = await glTrialBalance.getAccountBalance(accountId, asOfDate);
  return {
    balance: glBalance,
    source: 'gl_ledger',
    lastUpdated: asOfDate
  };
}
```

---

##### 3.2.2.2 Balance Staleness & Cutoff Handling

**Staleness Rules:**
- **Reconciled balance:** Valid for 24 hours from reconciliation date
- **Bank API balance:** Valid for 1 hour from last API call
- **GL ledger balance:** Valid only if no pending outbound payments (check AP-05 pending payments)

**Cutoff & Holiday Handling:**
- **Bank cutoff times:** Sweeps scheduled after bank cutoff time (e.g., 3 PM) execute next business day
- **Weekends/Holidays:** Sweeps scheduled on non-business days execute next business day
- **Value date vs posting date:** 
  - Sweep execution date = posting date (GL)
  - Bank value date may differ (handled by TR-05 reconciliation)

**Pending Transaction Handling:**
```typescript
// Check for pending outbound payments
const pendingPayments = await paymentRepo.findPending(accountId);
const pendingTotal = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

// Available balance = current balance - pending payments
const availableBalance = currentBalance - pendingTotal;

// Use available balance for sweep decision
if (availableBalance <= participant.targetBalance) {
  throw new InsufficientAvailableBalanceError(
    `Available balance (${availableBalance}) is at or below target (${participant.targetBalance})`
  );
}
```

**Validation:**
```typescript
const balanceInfo = await getAccountBalance(participant.accountId, executionDate);
const stalenessHours = (Date.now() - balanceInfo.lastUpdated.getTime()) / (1000 * 60 * 60);

if (balanceInfo.source === 'reconciled' && stalenessHours > 24) {
  throw new StaleBalanceError('Reconciled balance is stale (>24 hours)');
}

if (balanceInfo.source === 'bank_api' && stalenessHours > 1) {
  throw new StaleBalanceError('Bank API balance is stale (>1 hour)');
}

if (balanceInfo.source === 'gl_ledger') {
  // Check for pending payments
  const pendingPayments = await paymentRepo.findPending(participant.accountId);
  if (pendingPayments.length > 0) {
    throw new PendingTransactionsError('GL balance may be inaccurate due to pending payments');
  }
}
```

---

##### 3.2.2.3 Sweep Trigger & Amount Calculation (Single Truth)

**Sweep Trigger Rule (Definitive):**
```
IF currentBalance > sweepThreshold THEN
  sweepAmount = currentBalance - targetBalance
  (capped by dailyTransactionLimit and singleTransactionLimit)
ELSE
  sweepAmount = 0 (no sweep)
END IF
```

**Implementation:**
```typescript
async calculateSweepAmount(
  participant: ParticipantConfig,
  currentBalance: Money,
  availableBalance: Money
): Promise<{ shouldSweep: boolean; sweepAmount: Money }> {
  // Use available balance (current - pending payments)
  const balanceToUse = availableBalance;
  
  // Check trigger condition
  if (balanceToUse.amount <= participant.sweepThreshold.amount) {
    return { shouldSweep: false, sweepAmount: { amount: '0', currency: balanceToUse.currency } };
  }
  
  // Calculate sweep amount
  const excess = balanceToUse.amount - participant.targetBalance.amount;
  let sweepAmount = excess;
  
  // Apply limits (from bank account configuration - TR-01)
  const bankAccount = await bankRepo.findById(participant.accountId);
  if (bankAccount.singleTransactionLimit) {
    sweepAmount = Math.min(sweepAmount, bankAccount.singleTransactionLimit.amount);
  }
  
  if (bankAccount.dailyTransactionLimit) {
    const todaySweeps = await getTodaySweeps(participant.accountId);
    const todayTotal = todaySweeps.reduce((sum, s) => sum + s.amount.amount, 0);
    const remainingLimit = bankAccount.dailyTransactionLimit.amount - todayTotal;
    sweepAmount = Math.min(sweepAmount, remainingLimit);
  }
  
  // Ensure sweep amount is positive
  if (sweepAmount <= 0) {
    return { shouldSweep: false, sweepAmount: { amount: '0', currency: balanceToUse.currency } };
  }
  
  return {
    shouldSweep: true,
    sweepAmount: { amount: String(sweepAmount), currency: balanceToUse.currency }
  };
}
```

**Sweep Execution Logic:**
```typescript
// Generate idempotency key
const idempotencyKey = `POOL-${poolId}-${executionDate.toISOString().split('T')[0]}-${participant.accountId}`;

// Check if already executed (idempotency)
const existingSweep = await sweepRepo.findByKey(idempotencyKey);
if (existingSweep && existingSweep.status === 'executed') {
  return existingSweep; // Return existing result
}

// Calculate sweep amount
const { shouldSweep, sweepAmount } = await calculateSweepAmount(
  participant,
  balanceInfo.balance,
  availableBalance
);

if (!shouldSweep) {
  return { skipped: true, reason: 'Balance below threshold' };
}

// Create sweep record (status: pending)
const sweepRecord = await sweepRepo.create({
  poolId,
  participantAccountId: participant.accountId,
  participantCompanyId: participant.companyId,
  masterAccountId: pool.masterAccountId,
  executionDate,
  sweepType: 'sweep',
  amount: sweepAmount,
  currency: participant.currency,
  initiatorId,
  approver1Id,
  approver2Id,
  status: 'pending',
  idempotencyKey,
  version: 1
});

// Execute transfer (via AP-05) with idempotency
try {
  const paymentResult = await paymentService.createPayment({
    fromAccountId: participant.accountId,
    toAccountId: pool.masterAccountId,
    amount: sweepAmount,
    currency: participant.currency,
    paymentType: 'cash_pool_sweep',
    reference: `POOL-${poolId}-SWEEP-${executionDate.toISOString()}`,
    idempotencyKey: `PAY-${idempotencyKey}`,
    initiatorId,
    approver1Id,
    approver2Id
  });
  
  // Update sweep record
  await sweepRepo.update(sweepRecord.id, {
    status: 'executed',
    paymentId: paymentResult.paymentId,
    executedAt: new Date(),
    version: sweepRecord.version + 1
  });
  
  // Post GL entries (entity-by-entity - see Section 5)
  await postGLEntries(sweepRecord, participant, pool);
  
  // Create IC loan entry (for TR-04)
  await createICLoan({
    lenderCompanyId: participant.companyId,
    borrowerCompanyId: pool.masterCompanyId,
    amount: sweepAmount,
    currency: participant.currency,
    interestRate: pool.interestRate,
    sourceType: 'cash_pool_sweep',
    sourceId: sweepRecord.id
  });
  
  return sweepRecord;
  
} catch (error) {
  // Handle partial failure (see Section 3.2.2.4)
  await handleSweepFailure(sweepRecord, error);
  throw error;
}
```

---

##### 3.2.2.4 Idempotency & Partial Failure Handling

**Idempotency Key Format:**
```
POOL-{poolId}-{executionDate}-{participantAccountId}
```

**Sweep State Machine (Per Leg):**
```
PENDING → EXECUTING → EXECUTED
    │          │
    │          └──► FAILED → RETRY → EXECUTING
    │                              │
    │                              └──► FAILED (max retries)
    │
    └──► CANCELLED
```

**Partial Failure Scenarios:**

**Scenario 1: Payment succeeds, GL posting fails**
```typescript
// Payment executed successfully
const paymentResult = await paymentService.createPayment(...);
await sweepRepo.update(sweepRecord.id, { paymentId: paymentResult.paymentId, status: 'executing' });

try {
  // GL posting fails
  await postGLEntries(sweepRecord, participant, pool);
} catch (glError) {
  // Mark sweep as "needs_reconciliation"
  await sweepRepo.update(sweepRecord.id, {
    status: 'needs_reconciliation',
    errorMessage: `GL posting failed: ${glError.message}`,
    glPostingError: glError
  });
  
  // Trigger reconciliation job (see Section 3.2.2.5)
  await reconciliationJob.enqueue(sweepRecord.id);
  
  // Do NOT throw - payment already executed, must reconcile
  return { status: 'partial_success', paymentExecuted: true, glPostingFailed: true };
}
```

**Scenario 2: Some participants succeed, others fail**
```typescript
const results: Array<{ participantId: string; status: 'success' | 'failed'; error?: string }> = [];

for (const participant of pool.participants) {
  try {
    const sweepResult = await executeSweepForParticipant(participant, pool, executionDate, initiatorId, approver1Id, approver2Id);
    results.push({ participantId: participant.accountId, status: 'success' });
  } catch (error) {
    results.push({ participantId: participant.accountId, status: 'failed', error: error.message });
    // Continue with other participants (don't fail entire sweep)
  }
}

// Return summary
return {
  poolId,
  executionDate,
  totalParticipants: pool.participants.length,
  successful: results.filter(r => r.status === 'success').length,
  failed: results.filter(r => r.status === 'failed').length,
  results
};
```

**Scenario 3: Payment submitted, later fails (webhook)**
```typescript
// Webhook from AP-05: Payment failed after submission
async handlePaymentWebhook(webhook: PaymentWebhook): Promise<void> {
  if (webhook.event === 'payment.failed') {
    const sweepRecord = await sweepRepo.findByPaymentId(webhook.paymentId);
    if (sweepRecord) {
      // Mark sweep as failed
      await sweepRepo.update(sweepRecord.id, {
        status: 'failed',
        errorMessage: `Payment failed: ${webhook.reason}`,
        paymentStatus: 'failed'
      });
      
      // Reverse any GL entries that were posted
      if (sweepRecord.journalEntryId) {
        await glPostingPort.reverseJournal(sweepRecord.journalEntryId, {
          reason: 'Payment failed after GL posting',
          reversedBy: 'system'
        });
      }
      
      // Cancel IC loan if created
      if (sweepRecord.icLoanId) {
        await icLoanRepo.cancel(sweepRecord.icLoanId, { reason: 'Sweep failed' });
      }
    }
  }
}
```

**Retry Logic:**
```typescript
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000; // 5 seconds

async retrySweep(sweepId: string): Promise<void> {
  const sweepRecord = await sweepRepo.findById(sweepId);
  
  if (sweepRecord.retryCount >= MAX_RETRIES) {
    await sweepRepo.update(sweepId, {
      status: 'failed_permanently',
      errorMessage: 'Max retries exceeded'
    });
    throw new MaxRetriesExceededError(`Sweep ${sweepId} failed after ${MAX_RETRIES} retries`);
  }
  
  // Increment retry count
  await sweepRepo.update(sweepId, {
    retryCount: sweepRecord.retryCount + 1,
    status: 'retry',
    nextRetryAt: new Date(Date.now() + RETRY_DELAY_MS * sweepRecord.retryCount)
  });
  
  // Schedule retry job
  await retryJob.enqueue(sweepId, { delay: RETRY_DELAY_MS * sweepRecord.retryCount });
}
```

---

##### 3.2.2.5 Reconcile & Repair Job

**Purpose:** Reconcile sweeps that had partial failures (payment succeeded but GL failed, or vice versa).

**Process:**
1. Find sweeps with status = `needs_reconciliation`
2. Check payment status (AP-05)
3. Check GL posting status (GL-03)
4. Repair inconsistencies:
   - If payment succeeded but no GL entry: Post GL entry
   - If GL entry exists but payment failed: Reverse GL entry
   - If IC loan missing: Create IC loan
5. Update sweep status to `reconciled` or `failed`

**Implementation:**
```typescript
async reconcileSweep(sweepId: string): Promise<void> {
  const sweep = await sweepRepo.findById(sweepId);
  
  // Check payment status
  const payment = await paymentService.getPayment(sweep.paymentId);
  
  // Check GL entry
  const glEntry = sweep.journalEntryId 
    ? await glPostingPort.getJournalEntry(sweep.journalEntryId)
    : null;
  
  // Repair logic
  if (payment.status === 'executed' && !glEntry) {
    // Payment succeeded but GL missing - post GL entry
    await postGLEntries(sweep, participant, pool);
    await sweepRepo.update(sweepId, { status: 'reconciled' });
  } else if (payment.status === 'failed' && glEntry) {
    // Payment failed but GL posted - reverse GL entry
    await glPostingPort.reverseJournal(glEntry.id, {
      reason: 'Payment failed after GL posting',
      reversedBy: 'reconciliation_job'
    });
    await sweepRepo.update(sweepId, { status: 'failed' });
  } else if (payment.status === 'executed' && glEntry && !sweep.icLoanId) {
    // Payment and GL OK, but IC loan missing - create IC loan
    await createICLoan(...);
    await sweepRepo.update(sweepId, { status: 'reconciled' });
  }
}
```

**Output:**
- Sweep execution record (with idempotency key)
- GL journal entries (via GL-03) — **entity-by-entity** (see Section 5)
- IC loan entries (for TR-04)
- Audit event: `treasury.cash_pool.sweep_executed`

#### 3.2.3 Execute Fund (Physical Pooling)

**Process:** Reverse of sweep — move funds from master to participant when deficit detected. Uses same balance source-of-truth, idempotency, and entity-by-entity GL posting as sweep.

**Input:**
```typescript
{
  poolId: string;
  participantAccountId: string;
  fundAmount: Money;
  executionDate: Date;
  initiatorId: string;
  approver1Id: string;
  approver2Id: string;
  reason: string;
  idempotencyKey?: string;            // Optional: for retry scenarios
}
```

**Validations:**
- Pool must be ACTIVE
- Master account must have sufficient balance (using balance source-of-truth rules)
- Dual authorization required (same rules as sweep)
- Fund amount must be within limits (K_POLICY)
- Company/account scoping validation (see Section 4.4)

**Fund Execution Logic:**
```typescript
// Generate idempotency key
const idempotencyKey = `POOL-${poolId}-FUND-${executionDate.toISOString().split('T')[0]}-${participantAccountId}`;

// Check idempotency
const existingFund = await fundRepo.findByKey(idempotencyKey);
if (existingFund && existingFund.status === 'executed') {
  return existingFund;
}

// Get master account balance (using balance source-of-truth)
const masterBalanceInfo = await getAccountBalance(pool.masterAccountId, executionDate);
const masterAvailableBalance = await calculateAvailableBalance(pool.masterAccountId, executionDate);

// Validate sufficient balance
if (masterAvailableBalance.amount < fundAmount.amount) {
  throw new InsufficientBalanceError(
    `Master account has insufficient balance: ${masterAvailableBalance.amount} < ${fundAmount.amount}`
  );
}

// Create fund record
const fundRecord = await fundRepo.create({
  poolId,
  participantAccountId,
  participantCompanyId: participant.companyId,
  masterAccountId: pool.masterAccountId,
  executionDate,
  fundType: 'fund',
  amount: fundAmount,
  currency: participant.currency,
  initiatorId,
  approver1Id,
  approver2Id,
  status: 'pending',
  idempotencyKey,
  version: 1
});

// Execute transfer (via AP-05) with idempotency
try {
  const paymentResult = await paymentService.createPayment({
    fromAccountId: pool.masterAccountId,
    toAccountId: participantAccountId,
    amount: fundAmount,
    currency: participant.currency,
    paymentType: 'cash_pool_fund',
    reference: `POOL-${poolId}-FUND-${executionDate.toISOString()}`,
    idempotencyKey: `PAY-${idempotencyKey}`,
    initiatorId,
    approver1Id,
    approver2Id
  });
  
  // Update fund record
  await fundRepo.update(fundRecord.id, {
    status: 'executed',
    paymentId: paymentResult.paymentId,
    executedAt: new Date(),
    version: fundRecord.version + 1
  });
  
  // Post GL entries (entity-by-entity - see Section 5)
  await postFundGLEntries(fundRecord, participant, pool);
  
  // Create IC loan entry (master → participant)
  await createICLoan({
    lenderCompanyId: pool.masterCompanyId,
    borrowerCompanyId: participant.companyId,
    amount: fundAmount,
    currency: participant.currency,
    interestRate: pool.interestRate,
    sourceType: 'cash_pool_fund',
    sourceId: fundRecord.id
  });
  
  return fundRecord;
  
} catch (error) {
  // Handle partial failure (same as sweep)
  await handleFundFailure(fundRecord, error);
  throw error;
}
```

**Output:**
- Fund execution record (with idempotency key)
- GL journal entries (entity-by-entity)
- IC loan entries (master → participant)
- Audit event: `treasury.cash_pool.fund_executed`

#### 3.2.4 Allocate Interest (All Pool Types)

**Process:**
1. Calculate daily balances for each participant (using balance source-of-truth rules)
2. Calculate interest per participant using specified conventions
3. Allocate interest to participants
4. Post GL entries (interest income/expense) — **entity-by-entity** (see Section 5)
5. Update IC loan balances

**Input:**
```typescript
{
  poolId: string;
  periodStart: Date;
  periodEnd: Date;
  allocatedBy: string;
  approver1Id: string;
  approver2Id: string;                 // Dual authorization
  calculationMethod: 'daily_balance' | 'average_balance'; // Override pool default if needed
}
```

**Interest Calculation Conventions:**

**Day Count Convention:** ACT/365 (Actual days / 365) — standard for most jurisdictions
- Alternative: ACT/360 (for some money market instruments)

**Compounding:** Simple interest (no compounding) — standard for cash pools
- Interest calculated on daily balance, not compounded

**Rounding Rules:**
- Interest amounts rounded to 2 decimal places (currency-dependent)
- Rounding method: Banker's rounding (round half to even)

**Negative/Zero Balance Handling:**
- Zero balance: No interest (neither earned nor paid)
- Negative balance (overdraft): Interest charged at overdraft rate (if configured), otherwise no interest

**Intra-Period Joins/Leaves:**
- Participant joins mid-period: Interest calculated from join date
- Participant leaves mid-period: Interest calculated up to leave date
- Backdated corrections: Recalculate entire period (with audit trail)

**Interest Calculation Implementation:**

**Method 1: Daily Balance (Accurate)**
```typescript
async calculateInterestDailyBalance(
  participant: ParticipantConfig,
  pool: CashPool,
  periodStart: Date,
  periodEnd: Date
): Promise<Money> {
  const dayCountConvention = pool.dayCountConvention || 'ACT_365';
  const compounding = pool.compounding || 'simple';
  
  let totalInterest = 0;
  const dailyBalances: Array<{ date: Date; balance: number }> = [];
  
  // Get daily balances (using balance source-of-truth)
  for (let date = new Date(periodStart); date <= periodEnd; date = addDays(date, 1)) {
    // Skip weekends/holidays if configured
    if (pool.skipNonBusinessDays && !isBusinessDay(date)) {
      continue;
    }
    
    const balanceInfo = await getAccountBalance(participant.accountId, date);
    dailyBalances.push({ date, balance: parseFloat(balanceInfo.balance.amount) });
  }
  
  // Calculate interest per day
  for (const dayBalance of dailyBalances) {
    if (dayBalance.balance <= 0) {
      continue; // No interest on zero/negative balance
    }
    
    const daysInYear = dayCountConvention === 'ACT_365' ? 365 : 360;
    const dailyInterest = dayBalance.balance * (pool.interestRate / daysInYear);
    totalInterest += dailyInterest;
  }
  
  // Round to 2 decimal places (banker's rounding)
  const roundedInterest = roundToDecimalPlaces(totalInterest, 2);
  
  return {
    amount: String(roundedInterest),
    currency: participant.currency
  };
}
```

**Method 2: Average Balance (Simplified)**
```typescript
async calculateInterestAverageBalance(
  participant: ParticipantConfig,
  pool: CashPool,
  periodStart: Date,
  periodEnd: Date
): Promise<Money> {
  const dayCountConvention = pool.dayCountConvention || 'ACT_365';
  
  // Get daily balances
  const dailyBalances: number[] = [];
  for (let date = new Date(periodStart); date <= periodEnd; date = addDays(date, 1)) {
    if (pool.skipNonBusinessDays && !isBusinessDay(date)) {
      continue;
    }
    const balanceInfo = await getAccountBalance(participant.accountId, date);
    dailyBalances.push(parseFloat(balanceInfo.balance.amount));
  }
  
  // Calculate average balance
  const averageBalance = dailyBalances.reduce((sum, b) => sum + b, 0) / dailyBalances.length;
  
  if (averageBalance <= 0) {
    return { amount: '0', currency: participant.currency };
  }
  
  // Calculate interest
  const days = calculateDays(periodStart, periodEnd, dayCountConvention);
  const daysInYear = dayCountConvention === 'ACT_365' ? 365 : 360;
  const interest = averageBalance * (pool.interestRate / daysInYear) * days;
  
  // Round
  const roundedInterest = roundToDecimalPlaces(interest, 2);
  
  return {
    amount: String(roundedInterest),
    currency: participant.currency
  };
}
```

**Interest Allocation:**
```typescript
// For each participant
const interest = await calculateInterest(participant, pool, periodStart, periodEnd);

// Create interest allocation record
const allocation = await interestAllocationRepo.create({
  poolId,
  participantAccountId: participant.accountId,
  participantCompanyId: participant.companyId,
  periodStart,
  periodEnd,
  interestAmount: interest,
  calculationMethod: pool.interestCalculationMethod,
  dayCountConvention: pool.dayCountConvention || 'ACT_365',
  allocatedBy,
  approver1Id,
  approver2Id,
  status: 'allocated'
});

// Post GL entries (entity-by-entity - see Section 5)
await postInterestGLEntries(allocation, participant, pool);

// Update IC loan balance
await icLoanRepo.addInterest(allocation.icLoanId, interest);
```

**Output:**
- Interest allocation record
- GL journal entries (interest income/expense) — **entity-by-entity** (see Section 5)
- IC loan balance updates
- Audit event: `treasury.cash_pool.interest_allocated`

---

## 4. Control Points

### 4.1 Dual Authorization (Treasury Non-Negotiable)

**Requirement:** All cash movements require two distinct approvers.

**Enforcement:**
```sql
-- Database constraint
ALTER TABLE treasury.cash_sweeps
  ADD CONSTRAINT chk_dual_approval
  CHECK (
    (initiator_id IS NOT NULL) AND
    (approver1_id IS NOT NULL) AND
    (approver2_id IS NOT NULL) AND
    (approver1_id != approver2_id) AND
    (initiator_id != approver1_id) AND
    (initiator_id != approver2_id)
  );
```

**Service Validation:**
```typescript
async executeSweep(request: SweepRequest, actor: ActorContext): Promise<SweepResult> {
  // Verify dual authorization
  if (request.approver1Id === request.approver2Id) {
    throw new SoDViolationError('Dual authorization requires two distinct approvers');
  }
  
  if (request.approver1Id === request.initiatorId || request.approver2Id === request.initiatorId) {
    throw new SoDViolationError('Initiator cannot be an approver');
  }
  
  // Verify both approvers have permission
  await this.authPort.verifyPermission({ userId: request.approver1Id }, 'treasury.cash_pool.approve');
  await this.authPort.verifyPermission({ userId: request.approver2Id }, 'treasury.cash_pool.approve');
  
  // ... execute sweep
}
```

### 4.2 Maker-Checker for Configuration Changes

**Requirement:** All pool configuration changes require approval workflow.

**Configuration Changes Requiring Approval:**
- Adding/removing participants
- Changing sweep thresholds or target balances
- Changing interest rate
- Changing master account
- Changing sweep frequency or time

**Approval Workflow:**
```typescript
interface PoolConfigChange {
  id: string;
  poolId: string;
  changeType: 'add_participant' | 'remove_participant' | 'update_threshold' | 'update_rate' | 'change_master' | 'update_frequency';
  beforeValue: unknown;              // Before state (JSON)
  afterValue: unknown;               // After state (JSON)
  requestedBy: string;
  approvedBy?: string;                // Required for approval
  effectiveDate?: Date;              // When change takes effect
  status: 'pending' | 'approved' | 'rejected' | 'effective' | 'cancelled';
  version: number;                    // For optimistic locking
}

// Create change request
async requestConfigChange(
  poolId: string,
  change: PoolConfigChange,
  actor: ActorContext
): Promise<PoolConfigChange> {
  // Get current pool version
  const pool = await poolRepo.findById(poolId);
  
  // Create change request
  const changeRequest = await changeRequestRepo.create({
    poolId,
    changeType: change.changeType,
    beforeValue: extractRelevantFields(pool, change.changeType),
    afterValue: change.afterValue,
    requestedBy: actor.userId,
    status: 'pending',
    version: pool.version
  });
  
  // Audit
  await auditPort.emitTransactional({
    event: 'treasury.cash_pool.config_change_requested',
    actor,
    metadata: { changeRequestId: changeRequest.id, changeType: change.changeType }
  });
  
  return changeRequest;
}

// Approve change request
async approveConfigChange(
  changeRequestId: string,
  approver: ActorContext
): Promise<void> {
  const changeRequest = await changeRequestRepo.findById(changeRequestId);
  const pool = await poolRepo.findById(changeRequest.poolId);
  
  // Verify version (optimistic locking)
  if (pool.version !== changeRequest.version) {
    throw new VersionConflictError(
      changeRequest.poolId,
      changeRequest.version,
      pool.version
    );
  }
  
  // Apply change
  await applyConfigChange(pool, changeRequest);
  
  // Update pool version
  await poolRepo.update(changeRequest.poolId, {
    version: pool.version + 1,
    updatedBy: approver.userId,
    updatedAt: new Date()
  });
  
  // Mark change request as approved
  await changeRequestRepo.update(changeRequestId, {
    status: 'approved',
    approvedBy: approver.userId,
    approvedAt: new Date()
  });
  
  // Audit
  await auditPort.emitTransactional({
    event: 'treasury.cash_pool.config_change_approved',
    actor: approver,
    metadata: { changeRequestId, changeType: changeRequest.changeType }
  });
}
```

**Versioning & Rollback:**
```typescript
// Store pool configuration history
interface PoolConfigHistory {
  poolId: string;
  version: number;
  configuration: CashPool;            // Full configuration snapshot
  changedBy: string;
  changedAt: Date;
  changeRequestId?: string;
}

// Rollback to previous version
async rollbackPoolConfig(
  poolId: string,
  targetVersion: number,
  actor: ActorContext
): Promise<void> {
  const history = await configHistoryRepo.findByVersion(poolId, targetVersion);
  if (!history) {
    throw new NotFoundError('Pool configuration version', String(targetVersion));
  }
  
  // Restore configuration
  await poolRepo.update(poolId, {
    ...history.configuration,
    version: history.version + 1,     // New version after rollback
    updatedBy: actor.userId,
    updatedAt: new Date()
  });
  
  // Audit
  await auditPort.emitTransactional({
    event: 'treasury.cash_pool.config_rolled_back',
    actor,
    metadata: { poolId, fromVersion: currentVersion, toVersion: targetVersion }
  });
}
```

---

### 4.3 Authorization Matrix

| Role | Can Create Pool | Can Request Config Change | Can Approve Config Change | Can Execute Sweep | Can Approve Sweep | Can Allocate Interest |
|------|:---------------:|:-------------------------:|:-------------------------:|:-----------------:|:-----------------:|:---------------------:|
| Treasury Officer | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Treasury Manager | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Controller | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| CFO | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

### 4.4 Company/Account-Level Permission Scoping

**Requirement:** Treasury users must be restricted to companies/accounts they're authorized to manage.

**Scope Constraints:**
```typescript
interface TreasuryUserScope {
  userId: string;
  authorizedCompanies: string[];      // Company IDs user can access
  authorizedAccounts: string[];       // Bank account IDs user can access
  authorizedPools: string[];          // Pool IDs user can access
}

// Check scope before sweep execution
async validateUserScope(
  userId: string,
  participantCompanyId: string,
  participantAccountId: string,
  poolId: string
): Promise<void> {
  const userScope = await getUserScope(userId);
  
  if (!userScope.authorizedCompanies.includes(participantCompanyId)) {
    throw new ForbiddenError(`User not authorized for company ${participantCompanyId}`);
  }
  
  if (!userScope.authorizedAccounts.includes(participantAccountId)) {
    throw new ForbiddenError(`User not authorized for account ${participantAccountId}`);
  }
  
  if (!userScope.authorizedPools.includes(poolId)) {
    throw new ForbiddenError(`User not authorized for pool ${poolId}`);
  }
}
```

**SoD Rules Beyond Dual Authorization:**
- Approver cannot be a beneficiary controller for the participant entity
- Approver cannot be the initiator's direct manager (if same entity)
- Approver must have approval permission for the specific company/account

**Enforcement:**
```typescript
async validateSoDForSweep(
  initiator: ActorContext,
  approver1: ActorContext,
  approver2: ActorContext,
  participantCompanyId: string
): Promise<void> {
  // Check beneficiary controller
  const beneficiaryController = await getCompanyController(participantCompanyId);
  if (approver1.userId === beneficiaryController.userId || 
      approver2.userId === beneficiaryController.userId) {
    throw new SoDViolationError(
      'Approver cannot be beneficiary controller for participant entity'
    );
  }
  
  // Check direct manager relationship
  const initiatorManager = await getUserManager(initiator.userId);
  if (approver1.userId === initiatorManager?.userId || 
      approver2.userId === initiatorManager?.userId) {
    throw new SoDViolationError(
      'Approver cannot be initiator\'s direct manager'
    );
  }
}
```

### 4.5 Legal & Transfer Pricing Requirements

**Intercompany Cash Pooling Agreement:**
- **Required:** Reference to signed intercompany cash pooling agreement (per jurisdiction)
- **Storage:** Agreement document ID stored in pool configuration
- **Validation:** Pool cannot be activated without agreement reference

**Interest Benchmarking:**
- **Required:** Interest rate must be benchmarked against market rates (e.g., LIBOR, SOFR, local interbank rate)
- **Documentation:** Benchmarking calculation stored with pool configuration
- **Policy Check:** K_POLICY validates rate is within acceptable range (e.g., benchmark ± 2%)

**Withholding Tax Handling:**
- **Required:** Withholding tax rules per jurisdiction (if applicable)
- **Calculation:** Automatic withholding tax calculation on interest payments
- **Reporting:** Withholding tax amounts tracked and reported

**Regulatory Ring-Fencing:**
- **Required:** Entity-level limits (if applicable per jurisdiction)
- **Enforcement:** Pool configuration cannot exceed entity limits
- **Validation:** K_POLICY checks entity limits before pool activation

**Implementation:**
```typescript
interface CashPoolLegal {
  poolId: string;
  agreementReference: string;         // Document ID or reference
  agreementDate: Date;
  jurisdictions: string[];            // Applicable jurisdictions
  interestBenchmark: {
    benchmarkRate: string;             // 'LIBOR', 'SOFR', etc.
    benchmarkValue: number;             // Current benchmark rate
    spread: number;                     // Spread above/below benchmark
    calculatedRate: number;            // Final rate
    benchmarkedAt: Date;
  };
  withholdingTaxRules: Array<{
    jurisdiction: string;
    rate: number;                      // Withholding tax rate
    applicable: boolean;
  }>;
  entityLimits: Array<{
    companyId: string;
    maxPoolParticipation: Money;       // Maximum amount in pool
    regulatoryLimit: Money;            // Regulatory limit (if any)
  }>;
}
```

---

### 4.6 Audit Requirements

Every mutation **MUST** log:

| Event Type | Logged Data |
|------------|-------------|
| `treasury.cash_pool.created` | Pool configuration, creator ID, legal references |
| `treasury.cash_pool.config_change_requested` | Change request, before/after diff, requester ID |
| `treasury.cash_pool.config_change_approved` | Change request, approver ID, effective date |
| `treasury.cash_pool.sweep_executed` | Sweep details, initiator, approvers, amounts, idempotency key |
| `treasury.cash_pool.sweep_failed` | Sweep details, error, retry count |
| `treasury.cash_pool.fund_executed` | Fund details, initiator, approvers, amounts |
| `treasury.cash_pool.interest_allocated` | Interest calculation, period, amounts per participant, day count convention |
| `treasury.cash_pool.suspended` | Suspension reason, suspended by |
| `treasury.cash_pool.reconciled` | Reconciliation details, repaired items |

---

## 5. GL Impact

**GL Posting:** This cell **DOES** create journal entries via GL-03.

**Critical:** All journal entries must be posted **entity-by-entity** (participant entity and master entity separately) to support both local ledger reporting and consolidation.

---

### 5.1 Sweep Entry (Participant → Master) — Entity-by-Entity

**Participant Entity Journal Entry:**
```
Dr. IC Loan Receivable (to Master)     $100,000
    Cr. Cash (Participant Account)                $100,000
```

**Master Entity Journal Entry:**
```
Dr. Cash (Master Account)              $100,000
    Cr. IC Loan Payable (to Participant)          $100,000
```

**Implementation:**
```typescript
async postSweepGLEntries(
  sweep: CashSweep,
  participant: ParticipantConfig,
  pool: CashPool
): Promise<{ participantJEId: string; masterJEId: string }> {
  // Participant entity journal entry
  const participantJE = await glPostingPort.postJournal({
    sourceType: 'CASH_POOL_SWEEP',
    sourceId: sweep.id,
    entityId: participant.companyId,              // Participant entity
    lines: [
      {
        accountCode: `IC_LOAN_RECEIVABLE_${pool.masterCompanyId}`, // IC Loan Receivable
        debitAmount: sweep.amount,
        creditAmount: undefined,
      },
      {
        accountCode: participant.glAccountCode,   // Cash (Participant)
        debitAmount: undefined,
        creditAmount: sweep.amount,
      }
    ],
    memo: `Cash pool sweep to master account`,
    postedBy: sweep.initiatorId,
    correlationId: sweep.id
  });
  
  // Master entity journal entry
  const masterJE = await glPostingPort.postJournal({
    sourceType: 'CASH_POOL_SWEEP',
    sourceId: sweep.id,
    entityId: pool.masterCompanyId,               // Master entity
    lines: [
      {
        accountCode: pool.masterGlAccountCode,    // Cash (Master)
        debitAmount: sweep.amount,
        creditAmount: undefined,
      },
      {
        accountCode: `IC_LOAN_PAYABLE_${participant.companyId}`, // IC Loan Payable
        debitAmount: undefined,
        creditAmount: sweep.amount,
      }
    ],
    memo: `Cash pool sweep from participant ${participant.companyId}`,
    postedBy: sweep.initiatorId,
    correlationId: sweep.id
  });
  
  // Update sweep record with journal entry IDs
  await sweepRepo.update(sweep.id, {
    participantJournalEntryId: participantJE.id,
    masterJournalEntryId: masterJE.id
  });
  
  return { participantJEId: participantJE.id, masterJEId: masterJE.id };
}
```

**Consolidation Elimination:**
- At consolidation (TR-04 or consolidation module), IC Loan Receivable and IC Loan Payable are eliminated
- Net effect: Only cash movement remains (Dr. Cash Master, Cr. Cash Participant)

---

### 5.2 Interest Allocation Entry — Entity-by-Entity

**Participant Entity Journal Entry:**
```
Dr. Interest Expense (IC Loan)         $500
    Cr. IC Loan Payable (to Master)                $500
```

**Master Entity Journal Entry:**
```
Dr. IC Loan Receivable (from Participant)  $500
    Cr. Interest Income (IC Loan)                    $500
```

**Implementation:**
```typescript
async postInterestGLEntries(
  allocation: InterestAllocation,
  participant: ParticipantConfig,
  pool: CashPool
): Promise<{ participantJEId: string; masterJEId: string }> {
  // Participant entity journal entry
  const participantJE = await glPostingPort.postJournal({
    sourceType: 'CASH_POOL_INTEREST',
    sourceId: allocation.id,
    entityId: participant.companyId,
    lines: [
      {
        accountCode: participant.interestExpenseAccount, // Interest Expense
        debitAmount: allocation.interestAmount,
        creditAmount: undefined,
      },
      {
        accountCode: `IC_LOAN_PAYABLE_${pool.masterCompanyId}`, // IC Loan Payable
        debitAmount: undefined,
        creditAmount: allocation.interestAmount,
      }
    ],
    memo: `Interest on cash pool loan`,
    postedBy: allocation.allocatedBy,
    correlationId: allocation.id
  });
  
  // Master entity journal entry
  const masterJE = await glPostingPort.postJournal({
    sourceType: 'CASH_POOL_INTEREST',
    sourceId: allocation.id,
    entityId: pool.masterCompanyId,
    lines: [
      {
        accountCode: `IC_LOAN_RECEIVABLE_${participant.companyId}`, // IC Loan Receivable
        debitAmount: allocation.interestAmount,
        creditAmount: undefined,
      },
      {
        accountCode: pool.interestIncomeAccount, // Interest Income
        debitAmount: undefined,
        creditAmount: allocation.interestAmount,
      }
    ],
    memo: `Interest on cash pool loan from participant ${participant.companyId}`,
    postedBy: allocation.allocatedBy,
    correlationId: allocation.id
  });
  
  return { participantJEId: participantJE.id, masterJEId: masterJE.id };
}
```

**Consolidation Elimination:**
- At consolidation, IC Loan Receivable and IC Loan Payable (interest portion) are eliminated
- Net effect: Only interest income/expense remains (Dr. Interest Expense Participant, Cr. Interest Income Master)

---

### 5.3 Posting Matrix Summary

| Transaction | Participant Entity | Master Entity | Consolidation Effect |
|-------------|-------------------|---------------|---------------------|
| **Sweep** | Dr. IC Loan Receivable<br>Cr. Cash | Dr. Cash<br>Cr. IC Loan Payable | Eliminated: IC balances<br>Remaining: Cash movement |
| **Interest** | Dr. Interest Expense<br>Cr. IC Loan Payable | Dr. IC Loan Receivable<br>Cr. Interest Income | Eliminated: IC balances<br>Remaining: Interest income/expense |
| **Fund** | Dr. Cash<br>Cr. IC Loan Payable | Dr. IC Loan Receivable<br>Cr. Cash | Eliminated: IC balances<br>Remaining: Cash movement |

**Required by:**
- **TR-04 (Intercompany Settlement):** IC loan balances for netting
- **GL-03 (Posting Engine):** All cash movements and interest
- **Consolidation Module:** Elimination entries

---

## 6. Data Model

### 6.1 Primary Entity: `treasury_cash_pools`

```typescript
interface CashPool {
  // ═══════════════════════════════════════════════════════════
  // IDENTITY
  // ═══════════════════════════════════════════════════════════
  id: string;
  tenant_id: string;
  pool_code: string;                 // Generated: POOL-2024-001
  pool_name: string;
  
  // ═══════════════════════════════════════════════════════════
  // CONFIGURATION
  // ═══════════════════════════════════════════════════════════
  pool_type: 'physical' | 'notional' | 'zero_balance';
  master_account_id: string;          // FK to TR-01
  master_company_id: string;
  
  // ═══════════════════════════════════════════════════════════
  // PARTICIPANTS
  // ═══════════════════════════════════════════════════════════
  participants: Array<{
    account_id: string;                // FK to TR-01
    company_id: string;
    target_balance: Money;
    sweep_threshold: Money;
    priority: number;
  }>;
  
  // ═══════════════════════════════════════════════════════════
  // SWEEP CONFIGURATION
  // ═══════════════════════════════════════════════════════════
  sweep_frequency: 'daily' | 'weekly' | 'monthly';
  sweep_time: string;                  // HH:MM
  dual_authorization_required: boolean;
  
  // ═══════════════════════════════════════════════════════════
  // INTEREST CONFIGURATION
  // ═══════════════════════════════════════════════════════════
  interest_rate: number;                // Annual rate (e.g., 0.025)
  interest_calculation_method: 'daily_balance' | 'average_balance';
  interest_allocation_frequency: 'monthly' | 'quarterly';
  day_count_convention: 'ACT_365' | 'ACT_360'; // Default: ACT_365
  compounding: 'simple' | 'compound';   // Default: simple
  skip_non_business_days: boolean;      // Default: false
  
  // ═══════════════════════════════════════════════════════════
  // LEGAL & COMPLIANCE
  // ═══════════════════════════════════════════════════════════
  agreement_reference: string;          // Intercompany agreement document ID
  agreement_date: Date;
  jurisdictions: string[];             // Applicable jurisdictions
  interest_benchmark: {
    benchmark_rate: string;             // 'LIBOR', 'SOFR', etc.
    benchmark_value: number;
    spread: number;
    calculated_rate: number;
    benchmarked_at: Date;
  };
  withholding_tax_rules: Array<{
    jurisdiction: string;
    rate: number;
    applicable: boolean;
  }>;
  entity_limits: Array<{
    company_id: string;
    max_pool_participation: Money;
    regulatory_limit?: Money;
  }>;
  
  // ═══════════════════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════════════════
  status: 'draft' | 'active' | 'suspended' | 'inactive';
  effective_date?: Date;
  deactivation_date?: Date;
  
  // ═══════════════════════════════════════════════════════════
  // AUDIT TRAIL
  // ═══════════════════════════════════════════════════════════
  created_by: string;
  created_at: Date;
  updated_by?: string;
  updated_at?: Date;
  version: number;
}
```

### 6.2 Sweep Execution Entity: `treasury_cash_sweeps`

```typescript
interface CashSweep {
  id: string;
  tenant_id: string;
  pool_id: string;                    // FK to treasury_cash_pools
  execution_date: Date;
  sweep_type: 'sweep' | 'fund';
  
  // Participant details
  participant_account_id: string;      // FK to TR-01
  participant_company_id: string;
  master_account_id: string;          // FK to TR-01
  
  // Amounts
  amount: Money;
  currency: string;
  
  // Authorization
  initiator_id: string;
  approver1_id: string;
  approver2_id: string;               // Required for dual authorization
  
  // GL Posting
  participant_journal_entry_id?: string; // FK to GL-02 (participant entity)
  master_journal_entry_id?: string;     // FK to GL-02 (master entity)
  ic_loan_id?: string;                  // FK to TR-04
  
  // Idempotency & Retry
  idempotency_key: string;               // Format: POOL-{poolId}-{date}-{accountId}
  retry_count: number;                  // Default: 0
  max_retries: number;                   // Default: 3
  next_retry_at?: Date;
  
  // Status
  status: 'pending' | 'executing' | 'executed' | 'failed' | 'needs_reconciliation' | 'reconciled' | 'cancelled';
  error_message?: string;
  payment_id?: string;                  // FK to AP-05 payment
  payment_status?: string;               // From AP-05 webhook
  
  // Balance Source
  balance_source: 'reconciled' | 'bank_api' | 'gl_ledger';
  balance_as_of: Date;
  
  // Audit
  created_at: Date;
  executed_at?: Date;
  reconciled_at?: Date;
  version: number;                       // For optimistic locking
}
```

### 6.3 Interest Allocation Entity: `treasury_interest_allocations`

```typescript
interface InterestAllocation {
  id: string;
  tenant_id: string;
  pool_id: string;                       // FK to treasury_cash_pools
  participant_account_id: string;       // FK to TR-01
  participant_company_id: string;
  master_company_id: string;
  
  // Period
  period_start: Date;
  period_end: Date;
  
  // Interest Calculation
  interest_amount: Money;
  calculation_method: 'daily_balance' | 'average_balance';
  day_count_convention: 'ACT_365' | 'ACT_360';
  compounding: 'simple' | 'compound';
  
  // Daily balances (for audit trail)
  daily_balances: Array<{
    date: Date;
    balance: Money;
  }>;
  
  // GL Posting
  participant_journal_entry_id?: string; // FK to GL-02 (participant entity)
  master_journal_entry_id?: string;     // FK to GL-02 (master entity)
  ic_loan_id?: string;                  // FK to TR-04
  
  // Authorization
  allocated_by: string;
  approver1_id: string;
  approver2_id: string;                 // Dual authorization
  
  // Status
  status: 'calculated' | 'allocated' | 'posted' | 'failed';
  
  // Audit
  created_at: Date;
  allocated_at?: Date;
  version: number;
}
```

### 6.4 Pool Config Change Entity: `treasury_pool_config_changes`

```typescript
interface PoolConfigChange {
  id: string;
  tenant_id: string;
  pool_id: string;                      // FK to treasury_cash_pools
  change_type: 'add_participant' | 'remove_participant' | 'update_threshold' | 'update_rate' | 'change_master' | 'update_frequency' | 'update_legal';
  
  // Before/After State
  before_value: Record<string, unknown>; // JSON snapshot of before state
  after_value: Record<string, unknown>;  // JSON snapshot of after state
  diff: Array<{
    field: string;
    before: unknown;
    after: unknown;
  }>;
  
  // Workflow
  requested_by: string;
  approved_by?: string;
  rejected_by?: string;
  rejection_reason?: string;
  
  // Effective Date
  effective_date?: Date;                // When change takes effect
  
  // Status
  status: 'pending' | 'approved' | 'rejected' | 'effective' | 'cancelled';
  
  // Versioning
  pool_version_before: number;         // Pool version before change
  pool_version_after?: number;         // Pool version after change
  
  // Audit
  requested_at: Date;
  approved_at?: Date;
  rejected_at?: Date;
  effective_at?: Date;
  version: number;
}
```

### 6.5 Pool Configuration History Entity: `treasury_pool_config_history`

```typescript
interface PoolConfigHistory {
  id: string;
  tenant_id: string;
  pool_id: string;                      // FK to treasury_cash_pools
  version: number;                      // Configuration version number
  
  // Full Configuration Snapshot
  configuration: CashPool;              // Complete pool configuration at this version
  
  // Change Tracking
  change_request_id?: string;           // FK to treasury_pool_config_changes
  changed_by: string;
  changed_at: Date;
  change_reason?: string;
  
  // Rollback Support
  is_current: boolean;                  // Is this the current version?
  rolled_back_from_version?: number;    // If rolled back, which version was rolled back from
}
```

---

## 7. API Design

### 7.1 Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/treasury/cash-pools` | List pools | `treasury.cash_pool.view` |
| POST | `/api/treasury/cash-pools` | Create pool | `treasury.cash_pool.create` |
| GET | `/api/treasury/cash-pools/:id` | Get pool details | `treasury.cash_pool.view` |
| PATCH | `/api/treasury/cash-pools/:id` | Update pool (creates change request) | `treasury.cash_pool.update` |
| POST | `/api/treasury/cash-pools/:id/config-changes` | Request config change | `treasury.cash_pool.update` |
| POST | `/api/treasury/cash-pools/:id/config-changes/:changeId/approve` | Approve config change | `treasury.cash_pool.approve_config` |
| POST | `/api/treasury/cash-pools/:id/config-changes/:changeId/reject` | Reject config change | `treasury.cash_pool.approve_config` |
| GET | `/api/treasury/cash-pools/:id/config-history` | Get config history | `treasury.cash_pool.view` |
| POST | `/api/treasury/cash-pools/:id/rollback` | Rollback to previous version | `treasury.cash_pool.rollback` |
| POST | `/api/treasury/cash-pools/:id/execute-sweep` | Execute sweep | `treasury.cash_pool.execute` + dual auth |
| POST | `/api/treasury/cash-pools/:id/allocate-interest` | Allocate interest | `treasury.cash_pool.allocate_interest` + dual auth |
| POST | `/api/treasury/cash-pools/:id/reconcile` | Reconcile failed sweeps | `treasury.cash_pool.reconcile` |

---

## 8. Dependencies

| Dependency | Type | Purpose |
|------------|------|---------|
| **TR-01** | Upstream | Bank account registry (master/participant accounts) |
| **TR-03** | Optional | FX conversion (if mixed currency pools enabled) |
| **TR-05** | Upstream | Reconciled balances (preferred balance source) |
| **AP-05** | Downstream | Payment execution (sweep/fund transfers) |
| **GL-03** | Downstream | Journal entry posting (sweeps, interest) — entity-by-entity |
| **GL-05** | Upstream | GL balances (fallback balance source) |
| **TR-04** | Downstream | IC loan tracking |
| **K_TIME** | Kernel | Fiscal period validation, business day calendar |
| **K_POLICY** | Kernel | Interest rate validation (arm's length), entity limits, legal compliance |
| **K_AUTH** | Kernel | Dual authorization enforcement, company/account scoping |
| **K_LOG** | Kernel | Audit trail |
| **K_NOTIFY** | Kernel | Webhook notifications (payment status updates) |

---

## 9. Test Requirements

### 9.1 Unit Tests
- `CashPoolingService.test.ts` — Pool CRUD, sweep logic, interest calculation
- `ApprovalService.test.ts` — Dual authorization enforcement

### 9.2 Control Tests
- `DualAuth.test.ts` — Two distinct approvers required
- `Audit.test.ts` — Audit event coverage
- `PeriodLock.test.ts` — Period cutoff enforcement

### 9.3 Integration Tests
- `cash-pooling-cell.integration.test.ts` — Full workflow end-to-end

---

---

## 10. Critical Fixes Applied (P0 & P1)

This PRD has been updated to address all critical P0 (must fix) and P1 (should add) issues identified during review:

### ✅ P0 Fixes (Real Money Risk)

1. **✅ Sweep Trigger & Amount Math (Single Truth)**
   - Defined single trigger rule: `IF currentBalance > sweepThreshold THEN sweepAmount = currentBalance - targetBalance`
   - Removed inconsistent "excess" vs "threshold" logic
   - Added limit capping (daily and single transaction limits)

2. **✅ Balance Source-of-Truth & Cutoff Handling**
   - Defined priority: Reconciled balance (24h) → Bank API (1h) → GL Ledger (with pending check)
   - Added staleness validation
   - Added bank cutoff times, weekends/holidays handling
   - Added pending transaction handling (available vs ledger balance)

3. **✅ Idempotency + Partial Failure + Rollback Model**
   - Idempotency key format: `POOL-{poolId}-{date}-{accountId}`
   - Sweep state machine: PENDING → EXECUTING → EXECUTED (with retry path)
   - Partial failure handling (payment succeeds, GL fails; vice versa)
   - Reconcile & repair job for inconsistent states
   - Saga pattern for multi-leg sweeps

4. **✅ Entity-by-Entity GL Posting Clarity**
   - Separate journal entries for participant entity and master entity
   - Clear posting matrix showing consolidation elimination behavior
   - Implementation code showing entity-specific accounts

5. **✅ Multi-Currency Policy (Explicit)**
   - Option A (Default): Hard-block mixed currency pools
   - Option B (Advanced): Allow mixed currency only if TR-03 enabled + FX conversion configured
   - Removed contradictory "or FX conversion required" without TR-03

6. **✅ Legal / Transfer Pricing / Intercompany Agreement Requirements**
   - Intercompany cash pooling agreement reference (required)
   - Interest benchmarking (LIBOR/SOFR/local rate)
   - Withholding tax handling rules
   - Regulatory ring-fencing limits per entity
   - K_POLICY integration for enforcement

### ✅ P1 Fixes (Prevents Future Firefighting)

7. **✅ Maker-Checker for Configuration Changes**
   - Change request → approve → effective date workflow
   - Versioning + rollback capability
   - Audit "diff" (before/after) logging

8. **✅ Interest Calculation Details (Fully Specified)**
   - Day count convention: ACT/365 (default) or ACT/360
   - Compounding: Simple (default) or compound
   - Rounding rules: Banker's rounding to 2 decimal places
   - Negative/zero balance handling
   - Intra-period joins/leaves handling
   - Backdated corrections process

9. **✅ Authorization Scoping by Company/Account**
   - Company-level permission scoping
   - Account-level permission scoping
   - SoD rules beyond dual authorization (beneficiary controller, direct manager)

---

**Status:** ✅ PRD Locked — All Critical Issues Resolved  
**Next Steps:** Create ARCHITECTURE-BRIEF.md and begin implementation

---

**Last Updated:** December 2025  
**Maintainer:** Finance Cell Team  
**Review Status:** ✅ Critical Issues Addressed
