# PRD: TR-04 Intercompany Settlement

> **Cell Code:** TR-04  
> **Domain:** Treasury (DOM-06)  
> **Status:** 📋 Design Phase — Awaiting User Review  
> **Created:** 2025-12-17  
> **Author:** AI-BOS Architecture Team

---

## 0. Executive Summary

The **Intercompany Settlement** cell manages **netting of intercompany balances** for consolidated reporting and efficient cash settlement. It identifies IC receivables and payables, calculates net positions, generates settlement instructions, and ensures IC balances net to zero on period close.

**Why This Cell Exists:** Without intercompany settlement, companies maintain gross IC positions (inefficient), cannot accurately consolidate (IC balances don't net), and face cash flow inefficiencies (multiple settlements instead of netting).

**AIS Justification (Romney & Steinbart):**  
Intercompany Settlement is a **critical consolidation operation** in the Treasury Cycle. It enforces **Elimination Control** (IC balances net to zero) and **Completeness Assertion** (all IC transactions accounted for).

**COSO Mapping:**  
- **Control Activity:** IC balance netting validation on period close
- **Assertion:** Elimination Accuracy — IC balances must net to zero
- **Risk:** Incorrect consolidation, missing IC transactions

---

## 1. Business Justification

### 1.1 Problem Statement

**Current Pain Points:**
- ❌ Gross IC positions (Company A owes B $100K, B owes A $80K = net $20K, but both recorded)
- ❌ Manual IC reconciliation (time-consuming, error-prone)
- ❌ IC balances don't net to zero (consolidation errors)
- ❌ Multiple cash settlements instead of netting (inefficient)
- ❌ No IC loan tracking
- ❌ Missing transfer pricing documentation

### 1.2 Success Criteria

| # | Metric | Target | Measurement |
|---|--------|--------|-------------|
| 1 | **IC Balance Netting** | 100% | All IC balances net to zero on period close |
| 2 | **Settlement Efficiency** | 80%+ | Net settlements vs gross settlements |
| 3 | **Reconciliation Accuracy** | 100% | All IC transactions matched |
| 4 | **Period Close Validation** | 100% | Period cannot close if IC balances don't net |
| 5 | **Audit Trail** | 100% | Every IC settlement logged |

---

## 2. Scope Definition

### 2.1 IN SCOPE

✅ **IC Balance Reconciliation**
- Automatic IC account identification (AR-02, AP-02)
- IC receivable/payable pairing
- Variance detection and resolution
- Dispute resolution workflow

✅ **Netting Calculation**
- Bilateral netting (Company A ↔ Company B)
- Multilateral netting (multiple companies)
- Net payment instruction generation
- Settlement currency selection

✅ **Settlement Processing**
- Net settlement execution (via AP-05 or TR-02)
- IC loan creation and tracking
- Settlement confirmation
- GL posting (elimination entries)

✅ **Period Close Validation**
- IC balance netting check (must net to zero)
- Validation trigger on period close
- Exception reporting

### 2.2 OUT OF SCOPE

❌ **Full Consolidation** — Separate consolidation module
❌ **Minority Interest Calculations** — Consolidation module
❌ **Investment in Subsidiary Accounting** — Consolidation module
❌ **Transfer Pricing Calculation** — Tax module (but documentation required)

---

## 3. Functional Requirements

### 3.1 IC Settlement Lifecycle State Machine

```
┌─────────────────────────────────────────────────────────────┐
│              IC SETTLEMENT LIFECYCLE                         │
│                                                              │
│   IDENTIFIED ──► RECONCILED ──► NETTED ──► SETTLED          │
│        │              │            │                         │
│        │              │            └──► DISPUTED            │
│        │              │                  │                    │
│        │              │                  └──► RECONCILED    │
│        │              │                                        │
│        └──► EXCEPTION (cannot pair)                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

| State | Description | Can Settle? | Transitions |
|-------|-------------|:-----------:|-------------|
| **IDENTIFIED** | IC transaction identified | ❌ No | → RECONCILED, → EXCEPTION |
| **RECONCILED** | IC receivable/payable matched | ❌ No | → NETTED, → DISPUTED |
| **NETTED** | Net position calculated | ✅ Yes | → SETTLED |
| **DISPUTED** | Variance detected, under resolution | ❌ No | → RECONCILED (resolved) |
| **SETTLED** | Net settlement executed | ❌ No | None (terminal) |
| **EXCEPTION** | Cannot pair (manual review) | ❌ No | → RECONCILED (manual) |

### 3.2 Core Operations

#### 3.2.1 Identify IC Transactions

**Process:**
1. Scan AR-02 invoices (customer = IC company)
2. Scan AP-02 invoices (vendor = IC company)
3. Create IC receivable/payable records
4. Attempt automatic pairing

**Input:**
```typescript
{
  tenantId: string;
  periodCode: string;
  companyId?: string;                 // Optional: specific company
}
```

**IC Identification Logic:**
```typescript
// From AR-02 (Sales Invoice)
const icReceivables = await invoiceRepo.findICReceivables(tenantId, periodCode);
// Returns: [{ companyId: 'A', counterpartyId: 'B', amount: 100000, invoiceId: '...' }]

// From AP-02 (Supplier Invoice)
const icPayables = await invoiceRepo.findICPayables(tenantId, periodCode);
// Returns: [{ companyId: 'A', counterpartyId: 'B', amount: 80000, invoiceId: '...' }]

// Create IC balance records
for (const receivable of icReceivables) {
  await createICBalance({
    companyId: receivable.companyId,
    counterpartyId: receivable.counterpartyId,
    balanceType: 'receivable',
    amount: receivable.amount,
    currency: receivable.currency,
    sourceType: 'invoice',
    sourceId: receivable.invoiceId,
    periodCode
  });
}

for (const payable of icPayables) {
  await createICBalance({
    companyId: payable.companyId,
    counterpartyId: payable.counterpartyId,
    balanceType: 'payable',
    amount: payable.amount,
    currency: payable.currency,
    sourceType: 'invoice',
    sourceId: payable.invoiceId,
    periodCode
  });
}
```

**Output:**
- IC balance records created
- Pairing attempts logged
- Audit event: `treasury.ic.identified`

#### 3.2.2 Reconcile IC Balances

**Process:**
1. Match IC receivables with IC payables (same company pair, same currency)
2. Calculate variance (if any)
3. Flag for dispute if variance exceeds tolerance
4. Mark as reconciled if matched

**Input:**
```typescript
{
  companyId: string;
  counterpartyId: string;
  currency: string;
  periodCode: string;
  tolerance?: Money;                  // Default: 0.01 (1 cent)
}
```

**Reconciliation Logic (Multi-Currency Support):**
```typescript
// Get IC balances (may be in different currencies)
const receivables = await icRepo.findReceivables(companyId, counterpartyId, periodCode);
const payables = await icRepo.findPayables(companyId, counterpartyId, periodCode);

// Group by currency
const receivablesByCurrency = groupBy(receivables, r => r.currency);
const payablesByCurrency = groupBy(payables, p => p.currency);

// Reconcile per currency
for (const [currency, currencyReceivables] of Object.entries(receivablesByCurrency)) {
  const currencyPayables = payablesByCurrency[currency] || [];
  
  const totalReceivable = currencyReceivables.reduce((sum, r) => sum + parseFloat(r.amount.amount), 0);
  const totalPayable = currencyPayables.reduce((sum, p) => sum + parseFloat(p.amount.amount), 0);
  
  const variance = totalReceivable - totalPayable;
  
  if (Math.abs(variance) <= parseFloat(tolerance.amount)) {
    // Matched - mark as reconciled
    await icRepo.markReconciled(companyId, counterpartyId, currency, periodCode);
  } else {
    // Variance detected - flag for dispute
    await icRepo.flagDispute({
      companyId,
      counterpartyId,
      currency,
      periodCode,
      variance: { amount: String(variance), currency },
      receivables: currencyReceivables,
      payables: currencyPayables,
      tolerance
    });
  }
}
```

**Output:**
- Reconciliation status updated
- Dispute record (if variance)
- Audit event: `treasury.ic.reconciled`

#### 3.2.3 Calculate Net Position

**Process:**
1. Sum all IC receivables per company pair
2. Sum all IC payables per company pair
3. Calculate net position (receivable - payable)
4. Generate netting report

**Input:**
```typescript
{
  tenantId: string;
  periodCode: string;
  settlementCurrency?: string;       // Optional: convert to single currency
}
```

**Netting Calculation (Multi-Currency + FX Policy):**
```typescript
// Get settlement currency policy
const settlementCurrencyPolicy = await policyPort.getICSettlementCurrencyPolicy(tenantId);
// Returns: { defaultCurrency: 'USD', fxRateSource: 'K_FX' | 'TR-03', fxTiming: 'spot' | 'period_end' }

// Bilateral netting (Company A ↔ Company B) - per currency
const companies = await getCompanies(tenantId);
const nettingResults: Array<ICNetting> = [];

for (const companyA of companies) {
  for (const companyB of companies) {
    if (companyA.id === companyB.id) continue;
    
    // Get IC balances (may be in different currencies)
    const receivables = await icRepo.findReceivables(companyA.id, companyB.id, periodCode);
    const payables = await icRepo.findPayables(companyA.id, companyB.id, periodCode);
    
    // Group by currency
    const receivablesByCurrency = groupBy(receivables, r => r.currency);
    const payablesByCurrency = groupBy(payables, p => p.currency);
    
    // Get all currencies involved
    const allCurrencies = new Set([
      ...Object.keys(receivablesByCurrency),
      ...Object.keys(payablesByCurrency)
    ]);
    
    // Convert to settlement currency if multi-currency
    let netAmountInSettlementCurrency: Money;
    
    if (allCurrencies.size === 1) {
      // Single currency - no conversion needed
      const currency = Array.from(allCurrencies)[0];
      const totalReceivable = receivablesByCurrency[currency]?.reduce((sum, r) => sum + parseFloat(r.amount.amount), 0) || 0;
      const totalPayable = payablesByCurrency[currency]?.reduce((sum, p) => sum + parseFloat(p.amount.amount), 0) || 0;
      netAmountInSettlementCurrency = {
        amount: String(totalReceivable - totalPayable),
        currency
      };
    } else {
      // Multi-currency - convert to settlement currency
      const settlementCurrency = settlementCurrencyPolicy.defaultCurrency;
      const fxRateSource = settlementCurrencyPolicy.fxRateSource;
      const fxTiming = settlementCurrencyPolicy.fxTiming;
      
      let totalNetInSettlementCurrency = 0;
      
      for (const currency of allCurrencies) {
        const totalReceivable = receivablesByCurrency[currency]?.reduce((sum, r) => sum + parseFloat(r.amount.amount), 0) || 0;
        const totalPayable = payablesByCurrency[currency]?.reduce((sum, p) => sum + parseFloat(p.amount.amount), 0) || 0;
        const netInCurrency = totalReceivable - totalPayable;
        
        if (currency !== settlementCurrency) {
          // Get FX rate
          const fxRate = await getFXRate(currency, settlementCurrency, fxRateSource, fxTiming, periodCode);
          totalNetInSettlementCurrency += netInCurrency * fxRate;
        } else {
          totalNetInSettlementCurrency += netInCurrency;
        }
      }
      
      netAmountInSettlementCurrency = {
        amount: String(totalNetInSettlementCurrency),
        currency: settlementCurrency
      };
    }
    
    // Create netting record
    const netting = await icRepo.createNetting({
      tenantId,
      periodCode,
      fromCompanyId: companyA.id,
      toCompanyId: companyB.id,
      currency: netAmountInSettlementCurrency.currency,
      grossReceivable: calculateGross(receivables),
      grossPayable: calculateGross(payables),
      netAmount: netAmountInSettlementCurrency,
      status: 'calculated',
      calculatedBy: actor.userId
    });
    
    nettingResults.push(netting);
  }
}

// Multilateral netting (optional - reduces number of settlements)
const multilateralNetting = await calculateMultilateralNetting(nettingResults);
// Returns: optimized netting matrix with fewer settlements
```

**Output:**
- Netting report
- Net positions per company pair
- Settlement instructions
- Audit event: `treasury.ic.netted`

#### 3.2.4 Execute Net Settlement

**Process:**
1. Verify IC balances are netted and approved
2. Generate idempotency key
3. Generate settlement instruction
4. Execute net payment (via AP-05 or TR-02) - if cash settlement
5. Create IC loan entry **only if book_entry** (or explicit policy)
6. Post elimination GL entries (entity-by-entity + consolidation)
7. Update IC balance status to SETTLED
8. Handle partial failures (repair job)

**Input:**
```typescript
{
  nettingId: string;
  settlementDate: Date;
  settlementMethod: 'cash' | 'book_entry';  // Cash = actual payment, Book = IC loan only
  initiatorId: string;
  approver1Id: string;
  approver2Id: string;                     // Dual authorization
  idempotencyKey?: string;                 // Optional: for retry scenarios
}
```

**Settlement Execution (Idempotent + Saga Pattern):**
```typescript
async executeNetSettlement(
  nettingId: string,
  settlement: SettlementRequest,
  actor: ActorContext
): Promise<SettlementResult> {
  const netting = await icRepo.getNetting(nettingId);
  
  // Verify period is open (Lock 1: Period Lock)
  await timePort.verifyPeriodOpen(netting.tenantId, settlement.settlementDate);
  
  // Verify netting is approved
  if (netting.status !== 'approved') {
    throw new InvalidStateError('Netting must be approved before settlement');
  }
  
  // Generate idempotency key (Lock 3: Idempotent Posting)
  const idempotencyKey = settlement.idempotencyKey || 
    `IC-SETTLE-${nettingId}-${settlement.settlementDate.toISOString().split('T')[0]}`;
  
  // Check if already executed
  const existingSettlement = await settlementRepo.findByKey(idempotencyKey);
  if (existingSettlement && existingSettlement.status === 'settled') {
    return { alreadySettled: true, settlementId: existingSettlement.id };
  }
  
  // Create settlement record (status: executing)
  const settlementRecord = await settlementRepo.create({
    nettingId,
    settlementDate: settlement.settlementDate,
    settlementMethod: settlement.settlementMethod,
    netAmount: netting.netAmount,
    currency: netting.currency,
    initiatorId: actor.userId,
    approver1Id: settlement.approver1Id,
    approver2Id: settlement.approver2Id,
    status: 'executing',
    idempotencyKey,
    version: 1
  });
  
  try {
    // Step 1: Execute cash payment (if cash settlement)
    let paymentId: string | undefined;
    if (settlement.settlementMethod === 'cash') {
      const paymentResult = await paymentService.createPayment({
        fromCompanyId: netting.fromCompanyId,
        toCompanyId: netting.toCompanyId,
        amount: netting.netAmount,
        currency: netting.currency,
        paymentType: 'ic_settlement',
        reference: `IC-SETTLE-${nettingId}`,
        idempotencyKey: `PAY-${idempotencyKey}`,
        initiatorId: actor.userId,
        approver1Id: settlement.approver1Id,
        approver2Id: settlement.approver2Id
      });
      paymentId = paymentResult.paymentId;
      
      // Update settlement record
      await settlementRepo.update(settlementRecord.id, {
        paymentId,
        status: 'payment_executed'
      });
    }
    
    // Step 2: Create IC loan entry **only if book_entry** (Fix: Not always)
    let icLoanId: string | undefined;
    if (settlement.settlementMethod === 'book_entry') {
      // Book-entry netting: Create IC loan
      const icLoan = await icRepo.createICLoan({
        lenderCompanyId: netting.fromCompanyId,
        borrowerCompanyId: netting.toCompanyId,
        amount: netting.netAmount,
        currency: netting.currency,
        interestRate: await getArmLengthRate(netting.fromCompanyId, netting.toCompanyId),
        maturityDate: addMonths(settlement.settlementDate, 1), // 1 month term
        sourceType: 'ic_settlement',
        sourceId: settlementRecord.id
      });
      icLoanId = icLoan.id;
      
      await settlementRepo.update(settlementRecord.id, { icLoanId });
    } else if (settlement.settlementMethod === 'cash') {
      // Cash settlement: Clear IC AR/AP, no loan (unless policy requires)
      const policy = await policyPort.getICSettlementPolicy(netting.tenantId);
      if (policy.createLoanOnCashSettlement) {
        // Explicit policy: Convert residual into IC funding
        const icLoan = await icRepo.createICLoan({
          lenderCompanyId: netting.fromCompanyId,
          borrowerCompanyId: netting.toCompanyId,
          amount: netting.netAmount,
          currency: netting.currency,
          interestRate: await getArmLengthRate(netting.fromCompanyId, netting.toCompanyId),
          maturityDate: addMonths(settlement.settlementDate, 1),
          sourceType: 'ic_settlement',
          sourceId: settlementRecord.id
        });
        icLoanId = icLoan.id;
        await settlementRepo.update(settlementRecord.id, { icLoanId });
      }
      // Otherwise: No loan, IC AR/AP cleared by cash payment
    }
    
    // Step 3: Post GL entries (entity-by-entity + consolidation) - see Section 5
    const glResult = await postGLEntries(netting, settlementRecord, settlement.settlementMethod, actor);
    
    // Step 4: Update IC balances to SETTLED
    await icRepo.markSettled(netting.fromCompanyId, netting.toCompanyId, netting.periodCode, settlementRecord.id);
    
    // Step 5: Mark settlement as complete
    await settlementRepo.update(settlementRecord.id, {
      status: 'settled',
      settledAt: new Date(),
      version: settlementRecord.version + 1
    });
    
    return {
      settlementId: settlementRecord.id,
      paymentId,
      icLoanId,
      journalEntryIds: glResult.journalEntryIds
    };
    
  } catch (error) {
    // Handle partial failure
    await handleSettlementFailure(settlementRecord, error);
    
    // Trigger repair job
    await repairJob.enqueue(settlementRecord.id);
    
    throw error;
  }
}

async handleSettlementFailure(
  settlement: ICSettlement,
  error: Error
): Promise<void> {
  // Mark as failed
  await settlementRepo.update(settlement.id, {
    status: 'failed',
    errorMessage: error.message,
    failedAt: new Date()
  });
  
  // Reverse any GL entries that were posted
  if (settlement.journalEntryIds && settlement.journalEntryIds.length > 0) {
    for (const jeId of settlement.journalEntryIds) {
      await glPostingPort.reverseJournal(jeId, {
        reason: 'Settlement failed after GL posting',
        reversedBy: 'system'
      });
    }
  }
  
  // Cancel IC loan if created
  if (settlement.icLoanId) {
    await icLoanRepo.cancel(settlement.icLoanId, { reason: 'Settlement failed' });
  }
  
  // Cancel payment if created (via webhook from AP-05)
  if (settlement.paymentId) {
    // Payment cancellation handled by AP-05 webhook
  }
}
```

**Repair Job (Reconcile Partial Failures):**
```typescript
async repairSettlement(settlementId: string): Promise<void> {
  const settlement = await settlementRepo.findById(settlementId);
  const netting = await icRepo.getNetting(settlement.nettingId);
  
  // Check payment status
  const payment = settlement.paymentId 
    ? await paymentService.getPayment(settlement.paymentId)
    : null;
  
  // Check GL entries
  const glEntries = settlement.journalEntryIds 
    ? await Promise.all(settlement.journalEntryIds.map(id => glPostingPort.getJournalEntry(id)))
    : [];
  
  // Check IC loan
  const icLoan = settlement.icLoanId
    ? await icLoanRepo.findById(settlement.icLoanId)
    : null;
  
  // Repair logic
  if (settlement.settlementMethod === 'cash' && payment?.status === 'executed' && glEntries.length === 0) {
    // Payment succeeded but GL failed - post GL entries
    await postGLEntries(netting, settlement, settlement.settlementMethod, { userId: 'repair_job' });
    await settlementRepo.update(settlementId, { status: 'repaired', repairedAt: new Date() });
  } else if (payment?.status === 'failed' && glEntries.length > 0) {
    // Payment failed but GL posted - reverse GL entries
    for (const je of glEntries) {
      await glPostingPort.reverseJournal(je.id, { reason: 'Payment failed after GL posting', reversedBy: 'repair_job' });
    }
    await settlementRepo.update(settlementId, { status: 'failed' });
  }
  // ... other repair scenarios
}
```

**Output:**
- Settlement executed (with idempotency)
- IC loan created **only if book_entry** (or explicit policy)
- Elimination GL entries posted (entity-by-entity + consolidation)
- IC balances marked as SETTLED
- Audit event: `treasury.ic.settled`

#### 3.2.5 Validate IC Netting (Period Close)

**Process:**
1. Calculate all IC balances for period
2. Check **ALL open statuses** (not just non-settled) - Lock Rule
3. Sum receivables and payables per company pair
4. Verify net position = 0 (within tolerance)
5. Check for approved carry-forwards
6. If not zero and no approved carry-forward, block period close

**Lock Rule:** At period close, **no IC balances may remain in** `identified/reconciled/netted/disputed/exception` unless explicitly approved as carry-forward with a reason + audit.

**Input:**
```typescript
{
  tenantId: string;
  periodCode: string;
  tolerance?: Money;                  // Default: 0.01
  allowCarryForward?: boolean;        // Default: false (requires approval)
}
```

**Validation Logic (Fixed):**
```typescript
async validateICNetting(
  tenantId: string,
  periodCode: string,
  tolerance: Money,
  actor: ActorContext
): Promise<ValidationResult> {
  // Get ALL IC balances (not just non-settled)
  const allICBalances = await icRepo.getAllBalances(tenantId, periodCode);
  
  // Check for open statuses (Lock Rule)
  const openStatuses = ['identified', 'reconciled', 'netted', 'disputed', 'exception'];
  const openBalances = allICBalances.filter(b => openStatuses.includes(b.status));
  
  if (openBalances.length > 0) {
    // Check for approved carry-forwards
    const carryForwards = await icRepo.getApprovedCarryForwards(tenantId, periodCode);
    const carryForwardBalanceIds = new Set(carryForwards.map(cf => cf.balanceId));
    
    const nonCarryForwardOpen = openBalances.filter(b => !carryForwardBalanceIds.has(b.id));
    
    if (nonCarryForwardOpen.length > 0) {
      throw new ICNettingError(
        `IC balances remain in open statuses. Cannot close period.`,
        {
          tenantId,
          periodCode,
          openBalances: nonCarryForwardOpen.map(b => ({
            id: b.id,
            status: b.status,
            companyId: b.companyId,
            counterpartyId: b.counterpartyId,
            amount: b.amount
          })),
          carryForwards: carryForwards.length
        }
      );
    }
  }
  
  // Calculate net balance (only SETTLED balances should remain)
  const settledBalances = allICBalances.filter(b => b.status === 'settled');
  const netBalance = settledBalances.reduce((sum, balance) => {
    if (balance.balanceType === 'receivable') {
      return sum + parseFloat(balance.amount.amount);
    } else {
      return sum - parseFloat(balance.amount.amount);
    }
  }, 0);
  
  if (Math.abs(netBalance) > parseFloat(tolerance.amount)) {
    throw new ICNettingError(
      `IC balances do not net to zero. Net balance: ${netBalance}`,
      { tenantId, periodCode, netBalance, balances: settledBalances }
    );
  }
  
  // If net to zero and no open balances (or all approved carry-forwards), allow period close
  return { 
    valid: true, 
    netBalance: 0,
    openBalancesCount: openBalances.length,
    carryForwardsCount: carryForwards.length
  };
}
```

**Carry-Forward Approval:**
```typescript
async approveCarryForward(
  balanceId: string,
  reason: string,
  approver: ActorContext
): Promise<CarryForward> {
  const balance = await icRepo.findById(balanceId);
  
  // Verify balance is in open status
  if (balance.status === 'settled') {
    throw new InvalidStateError('Cannot carry forward settled balance');
  }
  
  // Create carry-forward approval
  const carryForward = await icRepo.createCarryForward({
    balanceId,
    fromPeriodCode: balance.periodCode,
    toPeriodCode: await getNextPeriodCode(balance.periodCode),
    reason,
    approvedBy: approver.userId,
    approvedAt: new Date()
  });
  
  // Audit
  await auditPort.emitTransactional({
    event: 'treasury.ic.carry_forward_approved',
    actor: approver,
    metadata: { balanceId, reason, carryForwardId: carryForward.id }
  });
  
  return carryForward;
}
```

**Database Trigger (Fixed):**
```sql
-- Trigger on period close (GL-04) - Fixed to check ALL open statuses
CREATE OR REPLACE FUNCTION finance.validate_ic_netting()
RETURNS TRIGGER AS $$
DECLARE
  open_balance_count INTEGER;
  net_balance NUMERIC;
BEGIN
  IF NEW.status = 'closed' THEN
    -- Check for open balances (Lock Rule)
    SELECT COUNT(*) INTO open_balance_count
    FROM treasury.intercompany_balances
    WHERE tenant_id = NEW.tenant_id 
      AND period_code = NEW.period_code
      AND status IN ('identified', 'reconciled', 'netted', 'disputed', 'exception')
      AND id NOT IN (
        SELECT balance_id 
        FROM treasury.ic_carry_forwards 
        WHERE tenant_id = NEW.tenant_id 
          AND from_period_code = NEW.period_code
          AND approved_by IS NOT NULL
      );
    
    IF open_balance_count > 0 THEN
      RAISE EXCEPTION 'IC balances remain in open statuses. Cannot close period. Open balances: %', open_balance_count;
    END IF;
    
    -- Verify net balance = 0 (for settled balances)
    SELECT SUM(
      CASE 
        WHEN balance_type = 'receivable' THEN amount
        WHEN balance_type = 'payable' THEN -amount
      END
    ) INTO net_balance
    FROM treasury.intercompany_balances
    WHERE tenant_id = NEW.tenant_id 
      AND period_code = NEW.period_code
      AND status = 'settled';
    
    IF ABS(net_balance) > 0.01 THEN
      RAISE EXCEPTION 'IC balances do not net to zero. Net: %', net_balance;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Output:**
- Validation result (valid/invalid)
- Net balance report
- Open balances report (if any)
- Carry-forwards report (if any)
- Period close blocked if invalid
- Audit event: `treasury.ic.validated`

---

## 4. Control Points

### 4.1 IC Balance Netting (Treasury Non-Negotiable)

**Requirement:** IC balances must net to zero on period close.

**Lock Rule:** At period close, **no IC balances may remain in** `identified/reconciled/netted/disputed/exception` unless explicitly approved as carry-forward with a reason + audit.

**Enforcement:**
- Database trigger on period close (GL-04) - checks ALL open statuses
- Service validation before period close
- Cannot close period if net balance ≠ 0 OR if open balances exist (without approved carry-forward)

### 4.2 Netting Approval Control (Maker-Checker)

**Requirement:** Netting calculation requires maker-checker approval (not just settlement).

**Enforcement:**
```typescript
async approveNetting(
  nettingId: string,
  approver1Id: string,
  approver2Id: string,
  actor: ActorContext
): Promise<void> {
  const netting = await icRepo.getNetting(nettingId);
  
  // SoD Rules: Calculator ≠ Approver; Initiator ≠ Approver
  if (netting.calculatedBy === approver1Id || netting.calculatedBy === approver2Id) {
    throw new SoDViolationError('Calculator cannot be an approver');
  }
  
  if (actor.userId === approver1Id || actor.userId === approver2Id) {
    throw new SoDViolationError('Initiator cannot be an approver');
  }
  
  if (approver1Id === approver2Id) {
    throw new SoDViolationError('Dual authorization requires two distinct approvers');
  }
  
  // Verify both approvers have permission
  await authPort.verifyPermission({ userId: approver1Id }, 'treasury.ic.approve_netting');
  await authPort.verifyPermission({ userId: approver2Id }, 'treasury.ic.approve_netting');
  
  // Approve netting
  await icRepo.updateNetting(nettingId, {
    status: 'approved',
    approver1Id,
    approver2Id,
    approvedAt: new Date()
  });
}
```

**Database Constraint:**
```sql
ALTER TABLE treasury.ic_nettings
  ADD CONSTRAINT chk_netting_approval
  CHECK (
    (status IN ('calculated', 'rejected')) OR
    (
      (status IN ('approved', 'settled')) AND
      (calculated_by IS NOT NULL) AND
      (approver1_id IS NOT NULL) AND
      (approver2_id IS NOT NULL) AND
      (approver1_id != approver2_id) AND
      (calculated_by != approver1_id) AND
      (calculated_by != approver2_id)
    )
  );
```

### 4.3 Dual Authorization (Treasury Non-Negotiable)

**Requirement:** All IC settlements require two distinct approvers.

**Enforcement:**
```sql
ALTER TABLE treasury.ic_settlements
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

### 4.4 Dispute Workflow (Enhanced)

**Dispute Resolution Process:**
1. Variance detected during reconciliation
2. Dispute record created with required fields
3. Assignment to resolver (role-based)
4. Resolution actions (credit note, debit note, FX true-up, write-off, reclass)
5. Evidence requirements (attachments, audit notes)
6. Approval workflow
7. Re-open/re-net with versioning

**Dispute Resolution Actions:**
```typescript
interface DisputeResolution {
  disputeId: string;
  resolutionAction: 'credit_note' | 'debit_note' | 'fx_trueup' | 'write_off' | 'reclass';
  resolutionAmount: Money;
  resolutionCurrency: string;
  reason: string;
  evidence: Array<{
    attachmentId: string;
    description: string;
  }>;
  resolvedBy: string;
  approvedBy: string;                  // Approval required
  resolvedAt: Date;
  version: number;                      // For re-opening
}
```

**Dispute SLA & Escalation:**
```typescript
interface DisputeSLA {
  disputeId: string;
  createdAt: Date;
  targetResolutionDate: Date;          // Based on SLA policy
  escalated: boolean;
  escalatedAt?: Date;
  escalatedTo?: string;                // Escalation role/user
  currentResolver: string;
  resolverRole: 'ic_accountant' | 'ic_manager' | 'controller' | 'cfo';
}
```

**Re-open Dispute:**
```typescript
async reopenDispute(
  disputeId: string,
  reason: string,
  actor: ActorContext
): Promise<Dispute> {
  const dispute = await disputeRepo.findById(disputeId);
  
  // Create new version
  const newVersion = await disputeRepo.createVersion({
    ...dispute,
    version: dispute.version + 1,
    status: 'open',
    reopenedBy: actor.userId,
    reopenedAt: new Date(),
    reopenReason: reason
  });
  
  // Mark old version as superseded
  await disputeRepo.update(disputeId, {
    status: 'superseded',
    supersededByVersion: newVersion.version
  });
  
  return newVersion;
}
```

### 4.5 Period Cutoff & Carry-Forward Rules

**Backdated IC Invoices:**
- If discovered after period close: Post to **adjusting period** (if within cutoff window) or **next period** (if outside cutoff)
- Cutoff window: Configurable (default: 5 business days after period close)

**Carry-Forward Rules:**
- Disputed items can be carried forward with approval
- Exception items can be carried forward with approval
- Carry-forward requires: reason, approver, target period
- Carried-forward items must be resolved in target period

**Re-open Period Control:**
- Period can be re-opened only with K_TIME policy approval
- Re-opening requires: reason, approver, audit trail
- Re-opening triggers re-calculation of IC netting

**Implementation:**
```typescript
async handleBackdatedInvoice(
  invoiceId: string,
  invoiceDate: Date,
  currentPeriodCode: string,
  actor: ActorContext
): Promise<{ periodCode: string; adjusting: boolean }> {
  const invoicePeriod = await timePort.getPeriodForDate(invoiceDate);
  const cutoffWindow = await policyPort.getPeriodCutoffWindow(currentPeriodCode);
  
  if (invoicePeriod.code === currentPeriodCode) {
    // Same period - post normally
    return { periodCode: currentPeriodCode, adjusting: false };
  } else if (isWithinCutoffWindow(invoiceDate, currentPeriodCode, cutoffWindow)) {
    // Within cutoff window - post to adjusting period
    return { periodCode: currentPeriodCode, adjusting: true };
  } else {
    // Outside cutoff window - post to next period
    const nextPeriod = await timePort.getNextPeriod(currentPeriodCode);
    return { periodCode: nextPeriod.code, adjusting: false };
  }
}
```

### 4.6 Configuration & Mapping Governance

**IC Partner Master Data:**
```typescript
interface ICPartner {
  id: string;
  tenant_id: string;
  company_id: string;
  counterparty_company_id: string;
  partner_code: string;                // Generated: IC-A-B
  
  // Trading Relationship
  relationship_type: 'parent_subsidiary' | 'sister_company' | 'joint_venture' | 'other';
  trading_agreement_reference: string;  // Document ID
  agreement_effective_date: Date;
  
  // Account Mappings (per entity)
  account_mappings: {
    ic_receivable_account: string;     // GL account code
    ic_payable_account: string;
    ic_loan_receivable_account: string;
    ic_loan_payable_account: string;
    ic_interest_income_account: string;
    ic_interest_expense_account: string;
    cash_account: string;
  };
  
  // Transfer Pricing
  transfer_pricing_documentation_id?: string; // Document reference (calculation out of scope)
  arm_length_rate_source: 'policy' | 'market' | 'agreement';
  
  // Status
  status: 'active' | 'suspended' | 'inactive';
  
  // Audit
  created_by: string;
  created_at: Date;
  updated_by?: string;
  updated_at?: Date;
}
```

**Settlement Currency Policy:**
```typescript
interface ICSettlementCurrencyPolicy {
  tenant_id: string;
  default_settlement_currency: string;
  fx_rate_source: 'K_FX' | 'TR-03';
  fx_timing: 'spot' | 'period_end';
  fx_difference_account: string;      // Where FX differences post (P&L vs OCI)
  fx_elimination_method: 'pairwise' | 'consolidation';
}
```

### 4.7 The Lock Checklist

1. **Period close passes only if no IC items remain in open statuses** (or approved carry-forward).
2. **IC loan created only for book-entry** (or explicit policy).
3. **Posting matrix: entity JE vs consolidation elimination JE** (no ambiguity).
4. **Idempotency + saga + repair job** for partial failures.
5. **Multi-currency + FX policy explicitly defined** (rate source, timing, postings, eliminations).
6. **Netting approval + SoD enforced** (not only settlement).
7. **Dispute workflow with resolution actions + evidence requirements.**

### 4.8 Audit Requirements

Every mutation **MUST** log:

| Event Type | Logged Data |
|------------|-------------|
| `treasury.ic.identified` | IC transactions identified, counts |
| `treasury.ic.reconciled` | Reconciliation results, variances |
| `treasury.ic.netted` | Netting calculation, net positions, calculator |
| `treasury.ic.netting_approved` | Netting approval, approvers, SoD validation |
| `treasury.ic.settled` | Settlement details, amounts, approvers, idempotency key |
| `treasury.ic.validated` | Period close validation, net balance, open balances, carry-forwards |
| `treasury.ic.dispute_created` | Dispute details, variance, resolver assignment |
| `treasury.ic.dispute_resolved` | Resolution action, evidence, approver |
| `treasury.ic.dispute_reopened` | Reopen reason, new version |
| `treasury.ic.carry_forward_approved` | Carry-forward reason, approver, target period |
| `treasury.ic.backdated_invoice` | Invoice date, posting period, adjusting flag |

---

## 5. GL Impact

**GL Posting:** This cell **DOES** create journal entries via GL-03.

**Critical:** All journal entries must be posted **entity-by-entity** (local entity ledgers) and **consolidation elimination layer** separately to prevent double counting and ensure accurate consolidation.

---

### 5.1 Posting Matrix (Entity-by-Entity + Consolidation)

**Cash Settlement (settlement_method = 'cash'):**

**Company A Entity Journal Entry:**
```
Dr. IC Payable (to B)                 $80,000
    Cr. Cash (or Bank)                            $20,000
    Cr. IC Receivable (from B)                    $60,000
```

**Company B Entity Journal Entry:**
```
Dr. Cash (or Bank)                    $20,000
Dr. IC Payable (to A)                 $60,000
    Cr. IC Receivable (from A)                    $80,000
```

**Consolidation Elimination Entry:**
```
Dr. IC Receivable (A from B)          $80,000
    Cr. IC Payable (B to A)                       $80,000
```

**Net Effect at Consolidation:** Only cash movement remains (Dr. Cash B, Cr. Cash A).

---

**Book-Entry Settlement (settlement_method = 'book_entry'):**

**Company A Entity Journal Entry:**
```
Dr. IC Payable (to B)                 $80,000
    Cr. IC Receivable (from B)                    $60,000
    Cr. IC Loan Receivable (to B)                 $20,000
```

**Company B Entity Journal Entry:**
```
Dr. IC Receivable (from A)             $80,000
    Cr. IC Payable (to A)                         $60,000
    Cr. IC Loan Payable (to A)                     $20,000
```

**Consolidation Elimination Entry:**
```
Dr. IC Receivable (A from B)          $80,000
    Cr. IC Payable (B to A)                       $80,000

Dr. IC Loan Receivable (A from B)     $20,000
    Cr. IC Loan Payable (B to A)                  $20,000
```

**Net Effect at Consolidation:** All IC balances eliminated (zero).

---

### 5.2 Implementation (Posting Matrix)

**Posting Function:**
```typescript
async postGLEntries(
  netting: ICNetting,
  settlement: ICSettlement,
  settlementMethod: 'cash' | 'book_entry',
  actor: ActorContext
): Promise<{ journalEntryIds: string[] }> {
  const journalEntryIds: string[] = [];
  
  // Get account mappings from IC partner configuration
  const companyAConfig = await icPartnerRepo.getAccountMapping(netting.fromCompanyId, netting.toCompanyId);
  const companyBConfig = await icPartnerRepo.getAccountMapping(netting.toCompanyId, netting.fromCompanyId);
  
  // Company A Entity Journal Entry
  const companyAJE = await glPostingPort.postJournal({
    sourceType: 'IC_SETTLEMENT',
    sourceId: settlement.id,
    entityId: netting.fromCompanyId,              // Company A entity
    lines: settlementMethod === 'cash' 
      ? [
          // Cash settlement: Clear IC AR/AP, cash movement
          {
            accountCode: companyAConfig.icPayableAccount,  // IC Payable (to B)
            debitAmount: netting.grossPayable,
            creditAmount: undefined,
          },
          {
            accountCode: companyAConfig.cashAccount,      // Cash
            debitAmount: netting.netAmount.amount < 0 
              ? { amount: String(Math.abs(parseFloat(netting.netAmount.amount))), currency: netting.currency }
              : undefined,
            creditAmount: netting.netAmount.amount > 0
              ? netting.netAmount
              : undefined,
          },
          {
            accountCode: companyAConfig.icReceivableAccount, // IC Receivable (from B)
            debitAmount: undefined,
            creditAmount: {
              amount: String(parseFloat(netting.grossReceivable.amount) - (netting.netAmount.amount > 0 ? parseFloat(netting.netAmount.amount) : 0)),
              currency: netting.currency
            },
          }
        ]
      : [
          // Book-entry: Clear IC AR/AP, create IC loan
          {
            accountCode: companyAConfig.icPayableAccount,
            debitAmount: netting.grossPayable,
            creditAmount: undefined,
          },
          {
            accountCode: companyAConfig.icReceivableAccount,
            debitAmount: undefined,
            creditAmount: {
              amount: String(parseFloat(netting.grossReceivable.amount) - (netting.netAmount.amount > 0 ? parseFloat(netting.netAmount.amount) : 0)),
              currency: netting.currency
            },
          },
          {
            accountCode: companyAConfig.icLoanReceivableAccount, // IC Loan Receivable
            debitAmount: netting.netAmount.amount > 0 ? netting.netAmount : undefined,
            creditAmount: netting.netAmount.amount < 0 
              ? { amount: String(Math.abs(parseFloat(netting.netAmount.amount))), currency: netting.currency }
              : undefined,
          }
        ],
    memo: `IC settlement ${settlementMethod}: ${netting.fromCompanyId} ↔ ${netting.toCompanyId}`,
    postedBy: actor.userId,
    correlationId: settlement.idempotencyKey
  });
  journalEntryIds.push(companyAJE.id);
  
  // Company B Entity Journal Entry (mirror)
  const companyBJE = await glPostingPort.postJournal({
    sourceType: 'IC_SETTLEMENT',
    sourceId: settlement.id,
    entityId: netting.toCompanyId,                // Company B entity
    lines: settlementMethod === 'cash'
      ? [
          {
            accountCode: companyBConfig.cashAccount,
            debitAmount: netting.netAmount.amount > 0 ? netting.netAmount : undefined,
            creditAmount: netting.netAmount.amount < 0
              ? { amount: String(Math.abs(parseFloat(netting.netAmount.amount))), currency: netting.currency }
              : undefined,
          },
          {
            accountCode: companyBConfig.icPayableAccount,
            debitAmount: {
              amount: String(parseFloat(netting.grossPayable.amount) - (netting.netAmount.amount < 0 ? Math.abs(parseFloat(netting.netAmount.amount)) : 0)),
              currency: netting.currency
            },
            creditAmount: undefined,
          },
          {
            accountCode: companyBConfig.icReceivableAccount,
            debitAmount: undefined,
            creditAmount: netting.grossReceivable,
          }
        ]
      : [
          {
            accountCode: companyBConfig.icReceivableAccount,
            debitAmount: netting.grossReceivable,
            creditAmount: undefined,
          },
          {
            accountCode: companyBConfig.icPayableAccount,
            debitAmount: undefined,
            creditAmount: {
              amount: String(parseFloat(netting.grossPayable.amount) - (netting.netAmount.amount < 0 ? Math.abs(parseFloat(netting.netAmount.amount)) : 0)),
              currency: netting.currency
            },
          },
          {
            accountCode: companyBConfig.icLoanPayableAccount, // IC Loan Payable
            debitAmount: netting.netAmount.amount < 0
              ? { amount: String(Math.abs(parseFloat(netting.netAmount.amount))), currency: netting.currency }
              : undefined,
            creditAmount: netting.netAmount.amount > 0 ? netting.netAmount : undefined,
          }
        ],
    memo: `IC settlement ${settlementMethod}: ${netting.toCompanyId} ↔ ${netting.fromCompanyId}`,
    postedBy: actor.userId,
    correlationId: settlement.idempotencyKey
  });
  journalEntryIds.push(companyBJE.id);
  
  // Consolidation Elimination Entry (posted to consolidation ledger)
  const eliminationJE = await glPostingPort.postJournal({
    sourceType: 'IC_ELIMINATION',
    sourceId: settlement.id,
    entityId: null,                     // Consolidation entity (not local entity)
    consolidationLevel: true,           // Mark as consolidation entry
    lines: [
      {
        accountCode: companyAConfig.icReceivableAccount, // IC Receivable (A from B)
        debitAmount: netting.grossReceivable,
        creditAmount: undefined,
      },
      {
        accountCode: companyBConfig.icPayableAccount,     // IC Payable (B to A)
        debitAmount: undefined,
        creditAmount: netting.grossPayable,
      }
    ],
    memo: `IC elimination: ${netting.fromCompanyId} ↔ ${netting.toCompanyId}`,
    postedBy: actor.userId,
    correlationId: settlement.idempotencyKey
  });
  journalEntryIds.push(eliminationJE.id);
  
  // If book-entry, also eliminate IC loans
  if (settlementMethod === 'book_entry' && settlement.icLoanId) {
    const loanEliminationJE = await glPostingPort.postJournal({
      sourceType: 'IC_LOAN_ELIMINATION',
      sourceId: settlement.id,
      entityId: null,
      consolidationLevel: true,
      lines: [
        {
          accountCode: companyAConfig.icLoanReceivableAccount,
          debitAmount: netting.netAmount.amount > 0 ? netting.netAmount : undefined,
          creditAmount: netting.netAmount.amount < 0
            ? { amount: String(Math.abs(parseFloat(netting.netAmount.amount))), currency: netting.currency }
            : undefined,
        },
        {
          accountCode: companyBConfig.icLoanPayableAccount,
          debitAmount: netting.netAmount.amount < 0
            ? { amount: String(Math.abs(parseFloat(netting.netAmount.amount))), currency: netting.currency }
            : undefined,
          creditAmount: netting.netAmount.amount > 0 ? netting.netAmount : undefined,
        }
      ],
      memo: `IC loan elimination: ${netting.fromCompanyId} ↔ ${netting.toCompanyId}`,
      postedBy: actor.userId,
      correlationId: settlement.idempotencyKey
    });
    journalEntryIds.push(loanEliminationJE.id);
  }
  
  // Store journal entry IDs in settlement record
  await settlementRepo.update(settlement.id, { journalEntryIds });
  
  return { journalEntryIds };
}
```

### 5.3 FX Differences (Multi-Currency)

**If settlement currency ≠ invoice currency, FX differences must be handled:**

**FX Difference Entry (Entity Level):**
```
Dr. IC Payable (FX difference)        $500
    Cr. FX Gain/Loss                              $500
```

**FX Difference Elimination (Consolidation):**
```
Dr. FX Gain/Loss (Company A)          $500
    Cr. FX Gain/Loss (Company B)                  $500
```

**Net Effect at Consolidation:** FX differences eliminated (zero).

---

### 5.4 Posting Matrix Summary

| Transaction | Company A Entity | Company B Entity | Consolidation Elimination | Net Effect |
|-------------|-----------------|------------------|---------------------------|------------|
| **Cash Settlement** | Dr. IC Payable<br>Cr. Cash<br>Cr. IC Receivable | Dr. Cash<br>Dr. IC Payable<br>Cr. IC Receivable | Dr. IC Receivable<br>Cr. IC Payable | Cash movement only |
| **Book-Entry Settlement** | Dr. IC Payable<br>Cr. IC Receivable<br>Cr. IC Loan Receivable | Dr. IC Receivable<br>Cr. IC Payable<br>Cr. IC Loan Payable | Dr. IC Receivable<br>Cr. IC Payable<br>Dr. IC Loan Receivable<br>Cr. IC Loan Payable | All eliminated (zero) |
| **FX Difference** | Dr. IC Payable<br>Cr. FX Gain/Loss | Dr. FX Gain/Loss<br>Cr. IC Payable | Dr. FX Gain/Loss (A)<br>Cr. FX Gain/Loss (B) | FX differences eliminated |

---

## 6. Data Model

### 6.1 Primary Entity: `treasury_intercompany_balances`

```typescript
interface IntercompanyBalance {
  // ═══════════════════════════════════════════════════════════
  // IDENTITY
  // ═══════════════════════════════════════════════════════════
  id: string;
  tenant_id: string;
  company_id: string;
  counterparty_id: string;
  period_code: string;
  
  // ═══════════════════════════════════════════════════════════
  // BALANCE DETAILS
  // ═══════════════════════════════════════════════════════════
  balance_type: 'receivable' | 'payable';
  amount: Money;
  currency: string;
  
  // ═══════════════════════════════════════════════════════════
  // SOURCE
  // ═══════════════════════════════════════════════════════════
  source_type: 'invoice' | 'payment' | 'cash_pool' | 'manual';
  source_id: string;                  // Invoice ID, payment ID, etc.
  source_reference: string;
  
  // ═══════════════════════════════════════════════════════════
  // RECONCILIATION
  // ═══════════════════════════════════════════════════════════
  status: 'identified' | 'reconciled' | 'netted' | 'settled' | 'disputed' | 'exception';
  matched_balance_id?: string;        // FK to paired balance
  variance?: Money;                    // If not perfectly matched
  dispute_reason?: string;
  
  // ═══════════════════════════════════════════════════════════
  // SETTLEMENT
  // ═══════════════════════════════════════════════════════════
  settlement_id?: string;              // FK to settlement record
  settled_at?: Date;
  
  // ═══════════════════════════════════════════════════════════
  // AUDIT TRAIL
  // ═══════════════════════════════════════════════════════════
  created_at: Date;
  reconciled_at?: Date;
  netted_at?: Date;
}
```

### 6.2 IC Partner Master Entity: `treasury_ic_partners`

```typescript
interface ICPartner {
  id: string;
  tenant_id: string;
  company_id: string;
  counterparty_company_id: string;
  partner_code: string;                // Generated: IC-A-B
  
  // Trading Relationship
  relationship_type: 'parent_subsidiary' | 'sister_company' | 'joint_venture' | 'other';
  trading_agreement_reference: string;  // Document ID
  agreement_effective_date: Date;
  
  // Account Mappings (per entity)
  ic_receivable_account: string;       // GL account code
  ic_payable_account: string;
  ic_loan_receivable_account: string;
  ic_loan_payable_account: string;
  ic_interest_income_account: string;
  ic_interest_expense_account: string;
  cash_account: string;
  
  // Transfer Pricing
  transfer_pricing_documentation_id?: string; // Document reference
  arm_length_rate_source: 'policy' | 'market' | 'agreement';
  
  // Status
  status: 'active' | 'suspended' | 'inactive';
  
  // Audit
  created_by: string;
  created_at: Date;
  updated_by?: string;
  updated_at?: Date;
}
```

### 6.3 Netting Entity: `treasury_ic_nettings`

```typescript
interface ICNetting {
  id: string;
  tenant_id: string;
  period_code: string;
  from_company_id: string;
  to_company_id: string;
  currency: string;                    // Settlement currency
  
  // Gross amounts
  gross_receivable: Money;
  gross_payable: Money;
  
  // Net position
  net_amount: Money;                  // receivable - payable
  
  // Settlement
  settlement_method: 'cash' | 'book_entry';
  settlement_id?: string;
  settlement_date?: Date;
  
  // Status
  status: 'calculated' | 'approved' | 'rejected' | 'settled';
  
  // Authorization (Maker-Checker)
  calculated_by: string;
  approver1_id?: string;              // Dual authorization
  approver2_id?: string;              // Dual authorization
  approved_at?: Date;
  settled_by?: string;
  
  // FX Conversion (if multi-currency)
  fx_rate_source?: 'K_FX' | 'TR-03';
  fx_timing?: 'spot' | 'period_end';
  fx_rates_used?: Record<string, number>; // Currency pair -> rate
  
  // Audit
  created_at: Date;
  settled_at?: Date;
  version: number;                     // For optimistic locking
}
```

### 6.4 Settlement Entity: `treasury_ic_settlements`

```typescript
interface ICSettlement {
  id: string;
  tenant_id: string;
  netting_id: string;                 // FK to treasury_ic_nettings
  settlement_date: Date;
  settlement_method: 'cash' | 'book_entry';
  
  // Amounts
  net_amount: Money;
  currency: string;
  
  // Payment (if cash)
  payment_id?: string;                 // FK to AP-05 payment
  payment_status?: string;
  
  // IC Loan (if book_entry or policy)
  ic_loan_id?: string;                 // FK to IC loan
  
  // GL Posting
  journal_entry_ids: string[];         // Array of JE IDs (entity + consolidation)
  
  // Authorization
  initiator_id: string;
  approver1_id: string;               // Dual authorization
  approver2_id: string;                // Dual authorization
  
  // Idempotency
  idempotency_key: string;             // Format: IC-SETTLE-{nettingId}-{date}
  
  // Status
  status: 'executing' | 'payment_executed' | 'settled' | 'failed' | 'needs_repair' | 'repaired';
  error_message?: string;
  
  // Audit
  created_at: Date;
  settled_at?: Date;
  failed_at?: Date;
  repaired_at?: Date;
  version: number;
}
```

### 6.5 Dispute Entity: `treasury_ic_disputes`

```typescript
interface ICDispute {
  id: string;
  tenant_id: string;
  balance_id: string;                  // FK to treasury_intercompany_balances
  company_id: string;
  counterparty_id: string;
  period_code: string;
  
  // Dispute Details
  variance: Money;
  variance_reason: string;
  dispute_type: 'amount' | 'currency' | 'timing' | 'other';
  
  // Resolution
  status: 'open' | 'resolved' | 'superseded';
  resolution_action?: 'credit_note' | 'debit_note' | 'fx_trueup' | 'write_off' | 'reclass';
  resolution_amount?: Money;
  resolution_reason?: string;
  evidence: Array<{
    attachment_id: string;
    description: string;
  }>;
  
  // Assignment & SLA
  current_resolver: string;
  resolver_role: 'ic_accountant' | 'ic_manager' | 'controller' | 'cfo';
  target_resolution_date: Date;
  escalated: boolean;
  escalated_at?: Date;
  escalated_to?: string;
  
  // Authorization
  resolved_by?: string;
  approved_by?: string;
  resolved_at?: Date;
  
  // Versioning
  version: number;
  superseded_by_version?: number;
  reopened_by?: string;
  reopened_at?: Date;
  reopen_reason?: string;
  
  // Audit
  created_at: Date;
}
```

### 6.6 Carry-Forward Entity: `treasury_ic_carry_forwards`

```typescript
interface ICCarryForward {
  id: string;
  tenant_id: string;
  balance_id: string;                  // FK to treasury_intercompany_balances
  from_period_code: string;
  to_period_code: string;
  
  // Approval
  reason: string;
  approved_by: string;
  approved_at: Date;
  
  // Status
  status: 'pending' | 'approved' | 'resolved';
  resolved_at?: Date;
  
  // Audit
  created_at: Date;
}
```

---

## 7. API Design

### 7.1 Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/treasury/ic-partners` | List IC partners | `treasury.ic.view` |
| POST | `/api/treasury/ic-partners` | Create IC partner | `treasury.ic.create_partner` |
| GET | `/api/treasury/ic-partners/:id` | Get IC partner details | `treasury.ic.view` |
| PATCH | `/api/treasury/ic-partners/:id` | Update IC partner | `treasury.ic.update_partner` |
| GET | `/api/treasury/intercompany-settlements` | List IC balances | `treasury.ic.view` |
| POST | `/api/treasury/intercompany-settlements/identify` | Identify IC transactions | `treasury.ic.identify` |
| POST | `/api/treasury/intercompany-settlements/reconcile` | Reconcile IC balances | `treasury.ic.reconcile` |
| POST | `/api/treasury/intercompany-settlements/net` | Calculate netting | `treasury.ic.net` |
| POST | `/api/treasury/intercompany-settlements/nettings/:id/approve` | Approve netting | `treasury.ic.approve_netting` + dual auth |
| POST | `/api/treasury/intercompany-settlements/:id/settle` | Execute settlement | `treasury.ic.settle` + dual auth |
| POST | `/api/treasury/intercompany-settlements/:id/repair` | Repair failed settlement | `treasury.ic.repair` |
| POST | `/api/treasury/intercompany-settlements/validate` | Validate netting | `treasury.ic.validate` |
| GET | `/api/treasury/intercompany-settlements/disputes` | List disputes | `treasury.ic.view` |
| POST | `/api/treasury/intercompany-settlements/disputes/:id/resolve` | Resolve dispute | `treasury.ic.resolve_dispute` |
| POST | `/api/treasury/intercompany-settlements/disputes/:id/reopen` | Reopen dispute | `treasury.ic.reopen_dispute` |
| POST | `/api/treasury/intercompany-settlements/carry-forwards` | Approve carry-forward | `treasury.ic.approve_carry_forward` |

---

## 8. Dependencies

| Dependency | Type | Purpose |
|------------|------|---------|
| **AR-02** | Upstream | IC receivables (sales invoices) |
| **AP-02** | Upstream | IC payables (supplier invoices) |
| **TR-02** | Downstream | Cash pool sweeps (IC loans) |
| **TR-03** | Optional | FX rate source (if multi-currency) |
| **AP-05** | Downstream | Cash settlement execution |
| **GL-03** | Downstream | Elimination journal entries (entity + consolidation) |
| **GL-04** | Downstream | Period close validation trigger |
| **K_TIME** | Kernel | Period cutoff, business day calendar, period re-open control |
| **K_FX** | Kernel | FX rate service (if settlement currency ≠ invoice currency) |
| **K_POLICY** | Kernel | Settlement currency policy, FX policy, carry-forward policy |
| **K_AUTH** | Kernel | Dual authorization enforcement, SoD rules |
| **K_LOG** | Kernel | Audit trail |

---

## 9. Test Requirements

### 9.1 Unit Tests
- `IntercompanyService.test.ts` — IC identification, reconciliation, netting
- `NettingService.test.ts` — Netting calculation logic

### 9.2 Control Tests
- `ICNetting.test.ts` — IC balances must net to zero
- `DualAuth.test.ts` — Two distinct approvers required  
- `PeriodClose.test.ts` — Period close blocked if IC doesn't net

### 9.3 Integration Tests
- `intercompany-cell.integration.test.ts` — Full workflow end-to-end

---

---

## 10. Critical Fixes Applied (P0 & P1)

This PRD has been updated to address all critical P0 (must fix) and P1 (should add) issues identified during review:

### ✅ P0 Fixes (Money + Audit + Consolidation Risk)

1. **✅ Period Close Trigger (Fixed: Check ALL Open Statuses)**
   - Fixed: Now checks **ALL open statuses** (`identified/reconciled/netted/disputed/exception`), not just non-settled
   - Lock Rule: No IC balances may remain in open statuses unless approved as carry-forward
   - Added carry-forward approval workflow with reason + audit

2. **✅ IC Loan Creation Logic (Fixed: Only for Book-Entry)**
   - Fixed: IC loan created **only** when `settlement_method='book_entry'` (or explicit policy)
   - Cash settlement: Clears IC AR/AP, no loan (unless policy requires)
   - Book-entry settlement: Creates IC loan for tracking

3. **✅ GL Elimination Entry Logic (Fixed: Posting Matrix)**
   - Added posting matrix: Entity JE vs Consolidation Elimination JE
   - Entity-level: Company A and Company B separate journal entries
   - Consolidation-level: Elimination entries (pairwise IC AR/AP elimination)
   - No "IC Net" catch-all account - clear entity-by-entity structure
   - FX differences handled with elimination

4. **✅ Idempotency + Partial Failure Handling**
   - Idempotency key: `IC-SETTLE-{nettingId}-{date}`
   - State machine: EXECUTING → PAYMENT_EXECUTED → SETTLED (with retry path)
   - Partial failure handling (payment succeeds, GL fails; vice versa)
   - Repair job for inconsistent states
   - Saga pattern for multi-step settlement

5. **✅ Multi-Currency + Different Functional Currency**
   - Settlement currency policy (default currency, FX rate source, FX timing)
   - FX conversion using K_FX or TR-03
   - FX difference posting (P&L vs OCI based on policy)
   - FX difference elimination at consolidation

### ✅ P1 Fixes (Prevents Operational Chaos)

6. **✅ Configuration & Mapping Governance**
   - Added `treasury_ic_partners` master entity
   - IC partner codes, trading relationships, account mappings per entity
   - Intercompany agreement reference (document ID, effective date)
   - Transfer pricing documentation pointer (calculation out of scope, but documentation required)

7. **✅ Dispute Workflow (Enhanced)**
   - Roles (who can resolve), SLA/escalation
   - Resolution actions (credit note, debit note, FX true-up, write-off, reclass)
   - Required attachments + audit notes
   - Ability to reopen/re-net with versioning
   - Dispute entity with full workflow tracking

8. **✅ Netting Approval Control (Maker-Checker)**
   - Netting approval requires dual authorization (not just settlement)
   - SoD rules: Calculator ≠ Approver; Initiator ≠ Approver
   - Database constraint enforces approval before settlement

9. **✅ Period Cutoff & Carry-Forward Rules**
   - Backdated IC invoices: Post to adjusting period (within cutoff) or next period
   - Carry-forward of disputed/exception items with approval
   - Re-open period control (K_TIME policy)
   - Carry-forward entity with approval workflow

### ✅ The Lock Checklist

1. ✅ Period close passes only if **no IC items remain in open statuses** (or approved carry-forward).
2. ✅ IC loan created **only for book-entry** (or explicit policy).
3. ✅ **Posting matrix: entity JE vs consolidation elimination JE** (no ambiguity).
4. ✅ **Idempotency + saga + repair job** for partial failures.
5. ✅ **Multi-currency + FX policy explicitly defined** (rate source, timing, postings, eliminations).
6. ✅ **Netting approval + SoD enforced** (not only settlement).
7. ✅ **Dispute workflow with resolution actions + evidence requirements.**

---

**Status:** ✅ PRD Locked — All Critical Issues Resolved  
**Next Steps:** Create ARCHITECTURE-BRIEF.md and begin implementation

---

**Last Updated:** December 2025  
**Maintainer:** Finance Cell Team  
**Review Status:** ✅ Critical Issues Addressed
