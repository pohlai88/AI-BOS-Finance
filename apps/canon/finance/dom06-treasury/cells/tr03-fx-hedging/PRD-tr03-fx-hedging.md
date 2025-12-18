# PRD: TR-03 FX Hedging

> **Cell Code:** TR-03  
> **Domain:** Treasury (DOM-06)  
> **Status:** 📋 Design Phase — Awaiting User Review  
> **Created:** 2025-12-17  
> **Author:** AI-BOS Architecture Team

---

## 0. Executive Summary

The **FX Hedging** cell manages **currency risk through forward contracts and hedging strategies** in compliance with IFRS 9 hedge accounting standards. It tracks FX exposures, designates hedges, performs effectiveness testing, and recognizes fair value adjustments.

**Why This Cell Exists:** Without FX hedging management, companies face currency volatility risk, cannot comply with IFRS 9 hedge accounting requirements, and cannot accurately report unrealized FX gains/losses.

**AIS Justification (Romney & Steinbart):**  
FX Hedging is a **critical risk management operation** in the Treasury Cycle. It enforces **Currency Risk Management** (IAS 21/IFRS 9 compliance) and **Valuation Assertion** (accurate fair value reporting).

**COSO Mapping:**  
- **Control Activity:** Hedge designation workflow, effectiveness testing
- **Assertion:** Valuation — fair value adjustments per IFRS 9
- **Risk:** Incorrect hedge accounting, ineffective hedges

---

## 1. Business Justification

### 1.1 Problem Statement

**Current Pain Points:**
- ❌ No systematic tracking of FX exposures
- ❌ Manual forward contract management (spreadsheet-based)
- ❌ No hedge effectiveness testing
- ❌ Incorrect hedge accounting (IFRS 9 violations)
- ❌ No mark-to-market valuation
- ❌ Missing hedge documentation

### 1.2 Success Criteria

| # | Metric | Target | Measurement |
|---|--------|--------|-------------|
| 1 | **Hedge Effectiveness** | Policy Threshold | Effectiveness ratio within policy-defined range (quantitative tests as internal policy) |
| 2 | **IFRS 9 Compliance** | 100% | All hedges properly documented, designated, and meet economic relationship requirements |
| 3 | **Fair Value Accuracy** | 100% | MTM valuations match external sources (independent pricing validation) |
| 4 | **Settlement Accuracy** | 100% | All settlements posted correctly (deliverable vs NDF) |
| 5 | **Audit Trail** | 100% | Every hedge action logged (including amendments, cancellations, de-designations) |

---

## 2. Scope Definition

### 2.1 IN SCOPE

✅ **Forward Contract Management**
- Forward contract entry (buy/sell, currency pair, amount, maturity)
- Counterparty master data (ISDA agreements, netting sets, settlement instructions, limits)
- Contract amendments and cancellations
- Settlement processing (deliverable forwards and NDFs)

✅ **Hedge Accounting (IFRS 9)**
- Hedge designation workflow (cash flow hedge, fair value hedge, net investment hedge)
- Prospective effectiveness testing
- Retrospective effectiveness testing
- Hedge de-designation
- Hedge documentation (required for IFRS 9)

✅ **Valuation & Reporting**
- Daily mark-to-market (MTM) calculation
- Fair value adjustments
- OCI (Other Comprehensive Income) tracking
- Effectiveness ratio monitoring
- IFRS 9 disclosure reports

✅ **FX Rate Integration**
- Integration with K_FX for spot and forward rates
- Rate revaluation triggers
- Historical rate tracking

### 2.2 OUT OF SCOPE

❌ **Spot FX Transactions** — Handled by K_FX (Kernel service)
❌ **Complex Derivatives** — Swaps, options (future phase)
❌ **Trading Book** — Banking book only (hedging, not trading)
❌ **FX Risk Analytics** — Future module

---

## 3. Functional Requirements

### 3.1 FX Contract Lifecycle State Machine

```
┌─────────────────────────────────────────────────────────────┐
│              FX CONTRACT LIFECYCLE                           │
│                                                              │
│   DRAFT ──► DESIGNATED ──► ACTIVE ──► SETTLED               │
│      │            │            │                             │
│      │            │            └──► DE-DESIGNATED            │
│      │            │                  │                        │
│      │            │                  └──► ACTIVE (re-designate)│
│      │            │                                            │
│      │            └──► REJECTED (effectiveness failed)        │
│      │                                                         │
│      └──► CANCELLED                                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

| State | Description | Can Revalue? | Transitions |
|-------|-------------|:------------:|-------------|
| **DRAFT** | Contract entry in progress | ❌ No | → DESIGNATED, → CANCELLED |
| **DESIGNATED** | Hedge designated, effectiveness testing | ✅ Yes | → ACTIVE (passed), → REJECTED (failed) |
| **ACTIVE** | Hedge active, MTM tracking | ✅ Yes | → SETTLED, → DE-DESIGNATED |
| **DE-DESIGNATED** | Hedge de-designated | ✅ Yes | → ACTIVE (re-designate) |
| **SETTLED** | Contract settled | ❌ No | None (terminal) |
| **REJECTED** | Effectiveness test failed | ❌ No | → DRAFT (retry) |
| **CANCELLED** | Contract cancelled | ❌ No | None (terminal) |

### 3.2 Core Operations

#### 3.2.1 Create Forward Contract

**Input:**
```typescript
{
  tenantId: string;
  contractNumber: string;             // Generated: FX-2024-001
  contractType: 'buy' | 'sell';       // Buy base currency, sell quote currency
  baseCurrency: string;                // Currency being bought/sold
  quoteCurrency: string;                // Currency being sold/bought
  notionalAmount: Money;               // Amount in base currency
  forwardRate: number;                 // Contracted forward rate
  spotRate: number;                    // Spot rate at contract date
  maturityDate: Date;
  settlementDate: Date;
  settlementMethod: 'deliverable' | 'ndf'; // Deliverable forward or NDF
  counterpartyId: string;              // FK to treasury_counterparties
  hedgeDesignation?: {
    hedgeType: 'cash_flow' | 'fair_value' | 'net_investment';
    hedgedItem: HedgedItemLink;       // Typed link to hedged item (see Section 3.2.2)
    hedgedItemType: 'forecast_transaction' | 'recognized_asset' | 'net_investment';
  };
}
```

**Validations:**
- Currency pair must be valid (K_FX validation)
- Forward rate must be within market range (K_FX validation)
- Maturity date must be in the future
- Settlement date must be >= maturity date
- Notional amount must be > 0

**Business Rules:**
- Forward contracts require hedge designation for IFRS 9 compliance
- Cash flow hedges require forecast transaction documentation
- Fair value hedges require recognized asset/liability

**Output:**
- Created forward contract (status: DRAFT)
- Audit event: `treasury.fx_contract.created`

#### 3.2.2 Designate Hedge

**Process:**
1. Verify contract is DRAFT
2. Validate hedge designation details
3. Perform prospective effectiveness test
4. Create hedge documentation
5. Update contract status to DESIGNATED
6. Begin effectiveness monitoring

**Input:**
```typescript
{
  contractId: string;
  hedgeType: 'cash_flow' | 'fair_value' | 'net_investment';
  hedgedItem: HedgedItemLink;         // Typed link (see Section 3.2.2.1)
  hedgedItemType: 'forecast_transaction' | 'recognized_asset' | 'net_investment';
  effectivenessTestMethod: 'dollar_offset' | 'regression' | 'critical_terms';
  effectivenessThreshold?: { min: number; max: number }; // Policy threshold (default from K_POLICY)
  documentation: {
    riskManagementObjective: string;
    hedgingStrategy: string;
    hedgedItemDescription: string;
    hedgeInstrumentDescription: string;
    economicRelationship: string;     // Required for IFRS 9
    sourcesOfIneffectiveness: string; // Required for IFRS 9
    hedgeRatio: number;               // Hedge ratio (e.g., 1.0 = 100% hedge)
  };
  designatedBy: string;
  approver1Id: string;                 // Dual authorization
  approver2Id: string;                 // Dual authorization
}
```

---

##### 3.2.2.1 Hedged Item Link (Typed Structure)

**Requirement:** Hedged item must be a typed link with complete identification for IFRS 9 documentation.

**Structure:**
```typescript
interface HedgedItemLink {
  hedgedObjectType: 'invoice' | 'purchase_order' | 'forecast_sale' | 'recognized_asset' | 'recognized_liability' | 'net_investment';
  hedgedObjectId: string;              // ID of the hedged object
  exposureCurrency: string;            // Currency of the exposure
  exposureAmount: Money;              // Amount of the exposure
  exposureTiming: Date;               // When exposure occurs (maturity/transaction date)
  probabilityAssessment?: number;     // For forecast transactions: probability (0-1)
  designationDateSnapshot: Record<string, unknown>; // Snapshot of hedged item at designation
}
```

**Validation:**
```typescript
async validateHedgedItemLink(link: HedgedItemLink): Promise<void> {
  // Verify hedged object exists
  const hedgedObject = await getHedgedObject(link.hedgedObjectType, link.hedgedObjectId);
  if (!hedgedObject) {
    throw new NotFoundError(`Hedged ${link.hedgedObjectType}`, link.hedgedObjectId);
  }
  
  // For forecast transactions, verify probability
  if (link.hedgedObjectType === 'forecast_sale' || link.hedgedObjectType === 'purchase_order') {
    if (!link.probabilityAssessment || link.probabilityAssessment < 0.5) {
      throw new ValidationError('Forecast transactions must have probability >= 50%');
    }
  }
  
  // Store snapshot for audit
  link.designationDateSnapshot = {
    objectType: link.hedgedObjectType,
    objectId: link.hedgedObjectId,
    currency: hedgedObject.currency,
    amount: hedgedObject.amount,
    timing: hedgedObject.timing,
    snapshotDate: new Date()
  };
}
```

---

##### 3.2.2.2 Prospective Effectiveness Test (IFRS 9 Compliant)

**IFRS 9 Requirements:**
- **Economic Relationship:** Hedged item and hedging instrument must have an economic relationship
- **Credit Risk:** Credit risk must not dominate the value changes
- **Hedge Ratio:** Must reflect actual risk management (not arbitrary)

**Note:** IFRS 9 removed the bright-line 80-125% test from IAS 39. Quantitative tests (dollar-offset, regression) are used as **internal policy thresholds**, not IFRS 9 requirements.

**Prospective Effectiveness Test:**
```typescript
async performProspectiveEffectivenessTest(
  contract: FXContract,
  hedgedItem: HedgedItemLink,
  method: 'dollar_offset' | 'regression' | 'critical_terms',
  policyThreshold?: { min: number; max: number }
): Promise<EffectivenessTestResult> {
  // Get policy threshold from K_POLICY if not provided
  const threshold = policyThreshold || await policyPort.getEffectivenessThreshold(contract.tenantId);
  
  // 1. Economic Relationship Assessment (IFRS 9 requirement)
  const economicRelationship = await assessEconomicRelationship(contract, hedgedItem);
  if (!economicRelationship.isValid) {
    throw new EffectivenessTestFailedError(
      'Economic relationship not established',
      { reason: economicRelationship.reason }
    );
  }
  
  // 2. Credit Risk Assessment (IFRS 9 requirement)
  const creditRiskAssessment = await assessCreditRisk(contract, hedgedItem);
  if (creditRiskAssessment.dominates) {
    throw new EffectivenessTestFailedError(
      'Credit risk dominates value changes',
      { assessment: creditRiskAssessment }
    );
  }
  
  // 3. Quantitative Test (Policy Threshold - Internal Control)
  let quantitativeResult: { passed: boolean; ratio?: number; details: unknown };
  
  if (method === 'critical_terms') {
    quantitativeResult = await testCriticalTerms(contract, hedgedItem, threshold);
  } else if (method === 'dollar_offset') {
    quantitativeResult = await testDollarOffset(contract, hedgedItem, threshold);
  } else if (method === 'regression') {
    quantitativeResult = await testRegression(contract, hedgedItem, threshold);
  }
  
  return {
    passed: economicRelationship.isValid && 
            !creditRiskAssessment.dominates && 
            quantitativeResult.passed,
    economicRelationship,
    creditRiskAssessment,
    quantitativeTest: quantitativeResult,
    method,
    threshold,
    testedAt: new Date()
  };
}

// Critical Terms Test (Fixed Logic Bug)
async testCriticalTerms(
  contract: FXContract,
  hedgedItem: HedgedItemLink,
  threshold: { min: number; max: number }
): Promise<{ passed: boolean; ratio?: number; details: unknown }> {
  // Fix: Convert milliseconds to days
  const maturityDiffMs = Math.abs(
    contract.maturityDate.getTime() - hedgedItem.exposureTiming.getTime()
  );
  const maturityDiffDays = maturityDiffMs / (1000 * 60 * 60 * 24);
  
  // Fix: Check each term individually, not object truthiness
  const criticalTermsMatch = {
    currencyPair: contract.baseCurrency === hedgedItem.exposureCurrency,
    maturityDate: maturityDiffDays <= 30, // 30 days tolerance
    notionalAmount: Math.abs(
      parseFloat(contract.notionalAmount.amount) - parseFloat(hedgedItem.exposureAmount.amount)
    ) / parseFloat(hedgedItem.exposureAmount.amount) <= 0.05 // 5% tolerance
  };
  
  // Fix: Check if all terms match
  const allTermsMatch = Object.values(criticalTermsMatch).every(Boolean);
  
  if (!allTermsMatch) {
    return {
      passed: false,
      details: {
        currencyPair: criticalTermsMatch.currencyPair,
        maturityDate: { match: criticalTermsMatch.maturityDate, diffDays: maturityDiffDays },
        notionalAmount: criticalTermsMatch.notionalAmount
      }
    };
  }
  
  return { passed: true, details: criticalTermsMatch };
}
```

---

##### 3.2.2.3 Designation Dossier (Immutable Record)

**Requirement:** Once a hedge is DESIGNATED, the designation record is immutable. Changes create a new version.

**Designation Dossier Structure:**
```typescript
interface HedgeDesignationDossier {
  id: string;
  contractId: string;
  version: number;                     // Incremented on amendments
  isCurrent: boolean;                  // Is this the current designation?
  
  // Designation Details
  hedgeType: 'cash_flow' | 'fair_value' | 'net_investment';
  hedgedItem: HedgedItemLink;          // Snapshot at designation
  hedgeRatio: number;
  effectivenessTestMethod: 'dollar_offset' | 'regression' | 'critical_terms';
  effectivenessThreshold: { min: number; max: number };
  
  // IFRS 9 Documentation
  riskManagementObjective: string;
  hedgingStrategy: string;
  hedgedItemDescription: string;
  hedgeInstrumentDescription: string;
  economicRelationship: string;
  sourcesOfIneffectiveness: string;
  
  // Effectiveness Test Results
  prospectiveTestResult: EffectivenessTestResult;
  retrospectiveTestResults: Array<{
    testDate: Date;
    result: EffectivenessTestResult;
  }>;
  
  // OCI Release Method
  ociReleaseMethod: 'recycle_to_pnl' | 'basis_adjustment' | 'none';
  
  // Authorization
  designatedBy: string;
  approver1Id: string;
  approver2Id: string;
  designatedAt: Date;
  
  // Immutability
  isImmutable: boolean;                 // Once DESIGNATED, cannot be modified
  supersededByVersion?: number;         // If amended, new version created
}
```

**Creating Designation Dossier:**
```typescript
async createDesignationDossier(
  contractId: string,
  designation: HedgeDesignation,
  testResult: EffectivenessTestResult,
  actor: ActorContext
): Promise<HedgeDesignationDossier> {
  const contract = await contractRepo.findById(contractId);
  
  // Determine OCI release method based on hedged item type
  const ociReleaseMethod = determineOCIReleaseMethod(designation.hedgedItemType, contract.hedgeType);
  
  const dossier = await designationRepo.create({
    contractId,
    version: 1,
    isCurrent: true,
    hedgeType: designation.hedgeType,
    hedgedItem: designation.hedgedItem,
    hedgeRatio: designation.documentation.hedgeRatio,
    effectivenessTestMethod: designation.effectivenessTestMethod,
    effectivenessThreshold: designation.effectivenessThreshold || await policyPort.getEffectivenessThreshold(contract.tenantId),
    riskManagementObjective: designation.documentation.riskManagementObjective,
    hedgingStrategy: designation.documentation.hedgingStrategy,
    hedgedItemDescription: designation.documentation.hedgedItemDescription,
    hedgeInstrumentDescription: designation.documentation.hedgeInstrumentDescription,
    economicRelationship: designation.documentation.economicRelationship,
    sourcesOfIneffectiveness: designation.documentation.sourcesOfIneffectiveness,
    prospectiveTestResult: testResult,
    retrospectiveTestResults: [],
    ociReleaseMethod,
    designatedBy: actor.userId,
    approver1Id: designation.approver1Id,
    approver2Id: designation.approver2Id,
    designatedAt: new Date(),
    isImmutable: true
  });
  
  // Mark as immutable (cannot be modified)
  await designationRepo.markImmutable(dossier.id);
  
  return dossier;
}
```

**Amending Designation (Creates New Version):**
```typescript
async amendDesignation(
  contractId: string,
  amendments: Partial<HedgeDesignation>,
  actor: ActorContext
): Promise<HedgeDesignationDossier> {
  const currentDossier = await designationRepo.findCurrent(contractId);
  
  // Verify period is open (Lock 1: Period Lock)
  await timePort.verifyPeriodOpen(contract.tenantId, new Date());
  
  // Create new version (old version remains immutable)
  const newDossier = await designationRepo.createVersion({
    ...currentDossier,
    ...amendments,
    version: currentDossier.version + 1,
    isCurrent: true,
    supersededByVersion: currentDossier.version,
    amendedBy: actor.userId,
    amendedAt: new Date()
  });
  
  // Mark old version as superseded
  await designationRepo.update(currentDossier.id, {
    isCurrent: false,
    supersededByVersion: newDossier.version
  });
  
  return newDossier;
}
```

**Output:**
- Contract status → DESIGNATED
- Hedge designation record
- Effectiveness test result
- Audit event: `treasury.fx_contract.hedge_designated`

#### 3.2.3 Revalue Contract (Mark-to-Market)

**Process:**
1. Get current spot rate (K_FX)
2. Calculate forward rate for remaining maturity
3. Calculate fair value (MTM)
4. Calculate unrealized gain/loss
5. Post GL entries per IFRS 9
6. Update effectiveness ratio

**Input:**
```typescript
{
  contractId: string;
  valuationDate: Date;
  revaluedBy: string;
}
```

**MTM Calculation (Independent Pricing):**
```typescript
// Get independent pricing source (Lock 8: Independent Pricing Control)
const internalRate = await fxPort.getForwardRate(
  contract.baseCurrency,
  contract.quoteCurrency,
  valuationDate,
  contract.maturityDate
);

// Get external pricing source for validation
const externalRate = await getExternalPricingSource(
  contract.baseCurrency,
  contract.quoteCurrency,
  valuationDate,
  contract.maturityDate
);

// Compare and flag variances (control)
const rateVariance = Math.abs((internalRate - externalRate) / externalRate);
if (rateVariance > 0.01) { // 1% variance threshold
  await auditPort.emitTransactional({
    event: 'treasury.fx_contract.pricing_variance',
    actor,
    metadata: {
      contractId,
      internalRate,
      externalRate,
      variance: rateVariance
    }
  });
}

// Use mid rate (or bid/ask based on contract type)
const valuationRate = contract.contractType === 'buy' 
  ? externalRate.bid  // Buying base currency, use bid
  : externalRate.ask; // Selling base currency, use ask

// Calculate fair value
const contractValue = parseFloat(contract.notionalAmount.amount) * contract.forwardRate;
const currentValue = parseFloat(contract.notionalAmount.amount) * valuationRate;
const unrealizedGainLoss = currentValue - contractValue;

// Apply discounting if required (for longer-dated contracts)
const daysToMaturity = (contract.maturityDate.getTime() - valuationDate.getTime()) / (1000 * 60 * 60 * 24);
const discountFactor = daysToMaturity > 90 
  ? calculateDiscountFactor(daysToMaturity, contract.quoteCurrency)
  : 1.0;

const discountedUnrealizedGainLoss = unrealizedGainLoss * discountFactor;

// Store valuation source snapshot
const valuationSnapshot = {
  valuationDate,
  internalRate,
  externalRate,
  valuationRate,
  discountFactor,
  pricingSource: 'external',
  pricingSourceName: externalRate.source,
  variance: rateVariance
};
```

**GL Posting (IFRS 9):**
```typescript
// Cash flow hedge: OCI
if (contract.hedgeType === 'cash_flow') {
  await glPostingPort.postJournal({
    sourceType: 'FX_REVALUATION',
    sourceId: contractId,
    lines: [
      {
        accountCode: contract.hedgeAccount,        // Asset/Liability
        debitAmount: unrealizedGainLoss > 0 ? { amount: String(unrealizedGainLoss), currency: contract.quoteCurrency } : undefined,
        creditAmount: unrealizedGainLoss < 0 ? { amount: String(Math.abs(unrealizedGainLoss)), currency: contract.quoteCurrency } : undefined,
      },
      {
        accountCode: contract.ociAccount,          // OCI
        debitAmount: unrealizedGainLoss < 0 ? { amount: String(Math.abs(unrealizedGainLoss)), currency: contract.quoteCurrency } : undefined,
        creditAmount: unrealizedGainLoss > 0 ? { amount: String(unrealizedGainLoss), currency: contract.quoteCurrency } : undefined,
      }
    ],
    postedBy: actor.userId,
    correlationId: actor.correlationId
  });
}

// Fair value hedge: P&L
if (contract.hedgeType === 'fair_value') {
  await glPostingPort.postJournal({
    sourceType: 'FX_REVALUATION',
    sourceId: contractId,
    lines: [
      {
        accountCode: contract.hedgeAccount,
        debitAmount: unrealizedGainLoss > 0 ? { amount: String(unrealizedGainLoss), currency: contract.quoteCurrency } : undefined,
        creditAmount: unrealizedGainLoss < 0 ? { amount: String(Math.abs(unrealizedGainLoss)), currency: contract.quoteCurrency } : undefined,
      },
      {
        accountCode: contract.pnlAccount,          // P&L
        debitAmount: unrealizedGainLoss < 0 ? { amount: String(Math.abs(unrealizedGainLoss)), currency: contract.quoteCurrency } : undefined,
        creditAmount: unrealizedGainLoss > 0 ? { amount: String(unrealizedGainLoss), currency: contract.quoteCurrency } : undefined,
      }
    ],
    postedBy: actor.userId,
    correlationId: actor.correlationId
  });
}
```

**Output:**
- Revaluation record
- GL journal entries
- Updated effectiveness ratio
- Audit event: `treasury.fx_contract.revalued`

#### 3.2.4 Test Effectiveness (Retrospective)

**Process:**
1. Calculate hedge effectiveness ratio (using policy threshold, not IFRS 9 requirement)
2. Compare to policy threshold
3. If outside range, flag for de-designation
4. Update effectiveness test record in designation dossier

**Effectiveness Calculation (Policy Threshold - Not IFRS 9 Requirement):**
```typescript
// Dollar offset method
const changeInHedgeValue = currentHedgeValue - previousHedgeValue;
const changeInHedgedItemValue = currentHedgedItemValue - previousHedgedItemValue;

// Avoid division by zero
if (Math.abs(changeInHedgedItemValue) < 0.01) {
  throw new EffectivenessTestError('Hedged item value change too small for testing');
}

const effectivenessRatio = Math.abs(changeInHedgeValue / changeInHedgedItemValue);

// Get policy threshold (not IFRS 9 requirement)
const threshold = await policyPort.getEffectivenessThreshold(contract.tenantId);

if (effectivenessRatio < threshold.min || effectivenessRatio > threshold.max) {
  // Hedge is ineffective per policy threshold
  await flagForDeDesignation(contractId, effectivenessRatio, {
    reason: 'Effectiveness ratio outside policy threshold',
    ratio: effectivenessRatio,
    threshold
  });
}

// Store test result in designation dossier (immutable append)
await designationRepo.appendRetrospectiveTest(contractId, {
  testDate: new Date(),
  result: {
    passed: effectivenessRatio >= threshold.min && effectivenessRatio <= threshold.max,
    ratio: effectivenessRatio,
    threshold,
    method: 'dollar_offset',
    changeInHedgeValue,
    changeInHedgedItemValue
  }
});
```

**Output:**
- Effectiveness test result
- De-designation flag (if ineffective)
- Audit event: `treasury.fx_contract.effectiveness_tested`

#### 3.2.5 Settle Contract

**Process:**
1. Verify contract is ACTIVE
2. Verify settlement date reached
3. Calculate final settlement amount
4. Post settlement GL entries
5. Release OCI (for cash flow hedges)
6. Update contract status to SETTLED

**Input:**
```typescript
{
  contractId: string;
  settlementDate: Date;
  actualSettlementRate: number;       // Actual rate at settlement
  settledBy: string;
  approvedBy: string;                  // Dual authorization
}
```

**Settlement Calculation (Deliverable vs NDF):**

**Deliverable Forward Settlement:**
- Two legs: Base currency received + Quote currency paid at **contracted forward rate**
- Unwind derivative carrying value (fair value adjustment)

**NDF Settlement:**
- Single cash settlement: Difference between contracted rate and fixing rate
- No physical currency exchange

**Implementation:**
```typescript
async settleContract(
  contractId: string,
  settlementDate: Date,
  actualSettlementRate: number,
  actor: ActorContext
): Promise<SettlementResult> {
  const contract = await contractRepo.findById(contractId);
  const dossier = await designationRepo.findCurrent(contractId);
  
  // Verify period is open (Lock 1: Period Lock)
  await timePort.verifyPeriodOpen(contract.tenantId, settlementDate);
  
  // Generate idempotency key (Lock 3: Idempotent Posting)
  const idempotencyKey = `FX_SETTLEMENT-${contractId}-${settlementDate.toISOString().split('T')[0]}`;
  
  // Check if already posted
  const existingPosting = await glPostingPort.findByKey(idempotencyKey);
  if (existingPosting) {
    return { alreadyPosted: true, journalEntryId: existingPosting.id };
  }
  
  if (contract.settlementMethod === 'deliverable') {
    return await settleDeliverableForward(contract, dossier, settlementDate, actualSettlementRate, idempotencyKey, actor);
  } else {
    return await settleNDF(contract, dossier, settlementDate, actualSettlementRate, idempotencyKey, actor);
  }
}

async settleDeliverableForward(
  contract: FXContract,
  dossier: HedgeDesignationDossier,
  settlementDate: Date,
  actualSettlementRate: number,
  idempotencyKey: string,
  actor: ActorContext
): Promise<SettlementResult> {
  // Contracted forward rate determines cash flows
  const baseCurrencyAmount = parseFloat(contract.notionalAmount.amount);
  const quoteCurrencyAmount = baseCurrencyAmount * contract.forwardRate;
  
  // Get current fair value (carrying value of derivative)
  const currentFairValue = contract.fairValue || { amount: '0', currency: contract.quoteCurrency };
  const fairValueAmount = parseFloat(currentFairValue.amount);
  
  // Settlement entry: Two legs
  const settlementJE = await glPostingPort.postJournal({
    sourceType: 'FX_SETTLEMENT',
    sourceId: contract.id,
    idempotencyKey,
    lines: [
      // Leg 1: Base currency received
      {
        accountCode: contract.cashAccountBase,     // Cash (Base Currency)
        debitAmount: { amount: String(baseCurrencyAmount), currency: contract.baseCurrency },
        creditAmount: undefined,
      },
      // Leg 2: Quote currency paid
      {
        accountCode: contract.cashAccountQuote,    // Cash (Quote Currency)
        debitAmount: undefined,
        creditAmount: { amount: String(quoteCurrencyAmount), currency: contract.quoteCurrency },
      },
      // Unwind derivative carrying value
      {
        accountCode: contract.hedgeAccount,       // Hedge Asset/Liability
        debitAmount: fairValueAmount < 0 ? { amount: String(Math.abs(fairValueAmount)), currency: contract.quoteCurrency } : undefined,
        creditAmount: fairValueAmount > 0 ? { amount: String(fairValueAmount), currency: contract.quoteCurrency } : undefined,
      },
      // P&L (difference between contracted and actual)
      {
        accountCode: contract.pnlAccount,
        debitAmount: (actualSettlementRate < contract.forwardRate) 
          ? { amount: String((contract.forwardRate - actualSettlementRate) * baseCurrencyAmount), currency: contract.quoteCurrency }
          : undefined,
        creditAmount: (actualSettlementRate > contract.forwardRate)
          ? { amount: String((actualSettlementRate - contract.forwardRate) * baseCurrencyAmount), currency: contract.quoteCurrency }
          : undefined,
      }
    ],
    postedBy: actor.userId,
    correlationId: idempotencyKey
  });
  
  // Release OCI based on dossier method
  await releaseOCI(contract, dossier, idempotencyKey, actor);
  
  return { journalEntryId: settlementJE.id, settlementMethod: 'deliverable' };
}

async settleNDF(
  contract: FXContract,
  dossier: HedgeDesignationDossier,
  settlementDate: Date,
  fixingRate: number,
  idempotencyKey: string,
  actor: ActorContext
): Promise<SettlementResult> {
  // NDF: Cash settle only the difference
  const baseCurrencyAmount = parseFloat(contract.notionalAmount.amount);
  const contractedValue = baseCurrencyAmount * contract.forwardRate;
  const fixingValue = baseCurrencyAmount * fixingRate;
  const settlementDifference = fixingValue - contractedValue;
  
  // Get current fair value (carrying value)
  const currentFairValue = contract.fairValue || { amount: '0', currency: contract.quoteCurrency };
  const fairValueAmount = parseFloat(currentFairValue.amount);
  
  // Settlement entry: Single cash leg
  const settlementJE = await glPostingPort.postJournal({
    sourceType: 'FX_SETTLEMENT',
    sourceId: contract.id,
    idempotencyKey,
    lines: [
      // Cash settlement (difference only)
      {
        accountCode: contract.cashAccountQuote,
        debitAmount: settlementDifference > 0 
          ? { amount: String(settlementDifference), currency: contract.quoteCurrency }
          : undefined,
        creditAmount: settlementDifference < 0
          ? { amount: String(Math.abs(settlementDifference)), currency: contract.quoteCurrency }
          : undefined,
      },
      // Unwind derivative carrying value
      {
        accountCode: contract.hedgeAccount,
        debitAmount: fairValueAmount < 0 ? { amount: String(Math.abs(fairValueAmount)), currency: contract.quoteCurrency } : undefined,
        creditAmount: fairValueAmount > 0 ? { amount: String(fairValueAmount), currency: contract.quoteCurrency } : undefined,
      },
      // P&L (remaining difference)
      {
        accountCode: contract.pnlAccount,
        debitAmount: (settlementDifference - fairValueAmount) < 0
          ? { amount: String(Math.abs(settlementDifference - fairValueAmount)), currency: contract.quoteCurrency }
          : undefined,
        creditAmount: (settlementDifference - fairValueAmount) > 0
          ? { amount: String(settlementDifference - fairValueAmount), currency: contract.quoteCurrency }
          : undefined,
      }
    ],
    postedBy: actor.userId,
    correlationId: idempotencyKey
  });
  
  // Release OCI based on dossier method
  await releaseOCI(contract, dossier, idempotencyKey, actor);
  
  return { journalEntryId: settlementJE.id, settlementMethod: 'ndf' };
}

async releaseOCI(
  contract: FXContract,
  dossier: HedgeDesignationDossier,
  idempotencyKey: string,
  actor: ActorContext
): Promise<void> {
  if (contract.hedgeType !== 'cash_flow') {
    return; // Only cash flow hedges have OCI
  }
  
  // Get OCI balance
  const ociBalance = await glPostingPort.getOCIBalance(contract.id, contract.ociAccountCode);
  
  // Determine release method from dossier
  if (dossier.ociReleaseMethod === 'recycle_to_pnl') {
    // Standard: Release OCI to P&L at settlement
    await glPostingPort.postJournal({
      sourceType: 'FX_OCI_RELEASE',
      sourceId: contract.id,
      idempotencyKey: `${idempotencyKey}-OCI`,
      lines: [
        {
          accountCode: contract.ociAccountCode,
          debitAmount: ociBalance > 0 ? { amount: String(ociBalance), currency: contract.quoteCurrency } : undefined,
          creditAmount: ociBalance < 0 ? { amount: String(Math.abs(ociBalance)), currency: contract.quoteCurrency } : undefined,
        },
        {
          accountCode: contract.pnlAccountCode,
          debitAmount: ociBalance < 0 ? { amount: String(Math.abs(ociBalance)), currency: contract.quoteCurrency } : undefined,
          creditAmount: ociBalance > 0 ? { amount: String(ociBalance), currency: contract.quoteCurrency } : undefined,
        }
      ],
      postedBy: actor.userId,
      correlationId: `${idempotencyKey}-OCI`
    });
  } else if (dossier.ociReleaseMethod === 'basis_adjustment') {
    // Basis adjustment: Adjust hedged item carrying value instead of P&L
    // Used for forecast transactions that become recognized assets/liabilities
    await applyBasisAdjustment(contract, dossier, ociBalance, idempotencyKey, actor);
  }
  // 'none' means OCI remains (e.g., for net investment hedges)
}

function determineOCIReleaseMethod(
  hedgedItemType: string,
  hedgeType: string
): 'recycle_to_pnl' | 'basis_adjustment' | 'none' {
  if (hedgeType === 'net_investment') {
    return 'none'; // Net investment hedges: OCI remains until disposal
  }
  
  if (hedgedItemType === 'forecast_transaction') {
    // Forecast transactions: Use basis adjustment when transaction occurs
    return 'basis_adjustment';
  }
  
  // Recognized assets/liabilities: Standard recycle to P&L
  return 'recycle_to_pnl';
}
```

**Output:**
- Contract status → SETTLED
- Settlement GL entries
- OCI release entries (if applicable)
- Audit event: `treasury.fx_contract.settled`

---

## 4. Control Points

### 4.1 Dual Authorization (Treasury Non-Negotiable)

**Requirement:** All hedge designations and settlements require two distinct approvers.

**Enforcement (Lock 4: Maker-Checker Boundary):**
- Dual authorization enforced at **command execution** (designate/settle), not globally at table insert
- DRAFT records do NOT require dual authorization
- Only DESIGNATED/ACTIVE/SETTLED records require dual authorization

**Service-Level Validation:**
```typescript
async designateHedge(
  contractId: string,
  designation: HedgeDesignation,
  actor: ActorContext
): Promise<void> {
  const contract = await contractRepo.findById(contractId);
  
  if (contract.status !== 'draft') {
    throw new InvalidStateError('Contract must be in DRAFT status');
  }
  
  // Lock 4: Maker-Checker Boundary - Enforce at command execution
  if (designation.approver1Id === designation.approver2Id) {
    throw new SoDViolationError('Dual authorization requires two distinct approvers');
  }
  
  if (designation.approver1Id === actor.userId || designation.approver2Id === actor.userId) {
    throw new SoDViolationError('Designator cannot be an approver');
  }
  
  // Verify both approvers have permission
  await authPort.verifyPermission({ userId: designation.approver1Id }, 'treasury.fx_contract.approve');
  await authPort.verifyPermission({ userId: designation.approver2Id }, 'treasury.fx_contract.approve');
  
  // Perform designation
  await performDesignation(contractId, designation, actor);
}
```

**Database Constraint (Conditional):**
```sql
-- Conditional constraint: Only enforce when status requires dual auth
ALTER TABLE treasury.fx_contracts
  ADD CONSTRAINT chk_dual_approval_when_required
  CHECK (
    (status IN ('draft', 'cancelled', 'rejected')) OR
    (
      (status IN ('designated', 'active', 'settled')) AND
      (designated_by IS NOT NULL) AND
      (approved_by IS NOT NULL) AND
      (designated_by != approved_by)
    )
  );
```

**Note:** For settlements, dual authorization is enforced at the service level (not stored in contract table, but in settlement record).

### 4.2 IFRS 9 Compliance

**Requirement:** All hedges must have proper documentation and effectiveness testing.

**Enforcement:**
- Hedge designation requires documentation (risk objective, strategy, hedged item, economic relationship)
- Effectiveness test must pass before hedge becomes ACTIVE (prospective test)
- Retrospective effectiveness testing required quarterly (policy threshold, not IFRS 9 requirement)
- Designation dossier is immutable once DESIGNATED (Lock 2)

### 4.3 The 5 Control Locks

**Lock 1: Period Lock**
- Block revalue/settle if K_TIME says period closed
- Require reversal workflow for closed periods
```typescript
async revalueContract(contractId: string, valuationDate: Date, actor: ActorContext): Promise<void> {
  // Lock 1: Period Lock
  await timePort.verifyPeriodOpen(contract.tenantId, valuationDate);
  // ... perform revaluation
}
```

**Lock 2: Designation Dossier Immutability**
- Once DESIGNATED, the designation record is immutable
- Changes create a new version (old version remains immutable)
- See Section 3.2.2.3 for implementation

**Lock 3: Idempotent Posting**
- Every `FX_REVALUATION/FX_SETTLEMENT/FX_OCI_RELEASE` has a unique posting key
- Format: `FX_{TYPE}-{contractId}-{date}-{sequence}`
- Prevents duplicate postings
```typescript
const idempotencyKey = `FX_REVALUATION-${contractId}-${valuationDate.toISOString().split('T')[0]}`;
const existingPosting = await glPostingPort.findByKey(idempotencyKey);
if (existingPosting) {
  return existingPosting; // Already posted
}
```

**Lock 4: Maker-Checker Boundary**
- Dual auth enforced at command execution (designate/settle), not globally at table insert
- See Section 4.1 for implementation

**Lock 5: Audit Completeness**
- Extended audit events (see Section 4.4)
- Every action logged with full context
- Immutable audit trail

### 4.4 Audit Requirements (Lock 5: Audit Completeness)

Every mutation **MUST** log:

| Event Type | Logged Data |
|------------|-------------|
| `treasury.fx_contract.created` | Contract details, creator ID, counterparty |
| `treasury.fx_contract.amended` | Amendment details, before/after diff, amended by |
| `treasury.fx_contract.cancelled` | Cancellation reason, cancelled by |
| `treasury.fx_contract.hedge_designated` | Hedge designation, effectiveness test result, designation dossier version, approvers |
| `treasury.fx_contract.hedge_amended` | Amendment to designation, new dossier version, amended by |
| `treasury.fx_contract.hedge_de_designated` | De-designation reason, de-designated by, effectiveness ratio at de-designation |
| `treasury.fx_contract.revalued` | MTM value, unrealized gain/loss, valuation source snapshot, pricing variance |
| `treasury.fx_contract.effectiveness_tested` | Effectiveness ratio, test result, policy threshold, method |
| `treasury.fx_contract.settled` | Settlement details, final amounts, settlement method (deliverable/NDF), OCI release method |
| `treasury.fx_contract.oci_released` | OCI release method, amount, target account (P&L or basis adjustment) |
| `treasury.fx_contract.pricing_variance` | Internal vs external rate variance, threshold exceeded |

---

## 5. GL Impact

**GL Posting:** This cell **DOES** create journal entries via GL-03.

**Revaluation Entry (Cash Flow Hedge):**
```
Dr. Hedge Asset/Liability          $10,000
    Cr. OCI (FX Hedge Reserve)                $10,000
```

**Settlement Entry:**
```
Dr. Cash                            $100,000
    Cr. Hedge Asset/Liability                 $90,000
    Cr. FX Gain/Loss                          $10,000
```

**OCI Release Entry:**
```
Dr. OCI (FX Hedge Reserve)           $10,000
    Cr. FX Gain/Loss                          $10,000
```

---

## 6. Data Model

### 6.1 Counterparty Master Entity: `treasury_counterparties`

```typescript
interface TreasuryCounterparty {
  id: string;
  tenant_id: string;
  counterparty_code: string;            // Generated: CP-2024-001
  counterparty_name: string;
  counterparty_type: 'bank' | 'broker' | 'other';
  
  // ISDA Agreement
  isda_agreement_reference?: string;   // ISDA master agreement reference
  isda_date?: Date;
  netting_set_id?: string;             // Netting set for close-out netting
  
  // Settlement Instructions
  settlement_accounts: Array<{
    currency: string;
    bank_account_id: string;            // FK to TR-01
    account_number: string;
    swift_code?: string;
  }>;
  
  // Limits & Approvals
  credit_limit: Money;
  current_exposure: Money;
  approval_required: boolean;
  approved_by?: string;
  approved_at?: Date;
  
  // Status
  status: 'active' | 'suspended' | 'inactive';
  
  // Audit
  created_by: string;
  created_at: Date;
  updated_by?: string;
  updated_at?: Date;
}
```

### 6.2 Primary Entity: `treasury_fx_contracts`

```typescript
interface FXContract {
  // ═══════════════════════════════════════════════════════════
  // IDENTITY
  // ═══════════════════════════════════════════════════════════
  id: string;
  tenant_id: string;
  contract_number: string;            // Generated: FX-2024-001
  contract_type: 'buy' | 'sell';
  
  // ═══════════════════════════════════════════════════════════
  // CONTRACT TERMS
  // ═══════════════════════════════════════════════════════════
  base_currency: string;
  quote_currency: string;
  notional_amount: Money;
  forward_rate: number;
  spot_rate: number;                  // At contract date
  maturity_date: Date;
  settlement_date: Date;
  settlement_method: 'deliverable' | 'ndf';
  counterparty_id: string;             // FK to treasury_counterparties
  
  // ═══════════════════════════════════════════════════════════
  // HEDGE DESIGNATION
  // ═══════════════════════════════════════════════════════════
  hedge_type?: 'cash_flow' | 'fair_value' | 'net_investment';
  designation_dossier_id?: string;   // FK to treasury_hedge_designations
  effectiveness_test_method?: 'dollar_offset' | 'regression' | 'critical_terms';
  
  // ═══════════════════════════════════════════════════════════
  // VALUATION
  // ═══════════════════════════════════════════════════════════
  current_forward_rate?: number;
  fair_value?: Money;                 // MTM value
  unrealized_gain_loss?: Money;
  effectiveness_ratio?: number;       // Latest effectiveness test
  valuation_source?: {
    internal_rate: number;
    external_rate: number;
    pricing_source: string;
    variance: number;
    valuation_date: Date;
  };
  
  // ═══════════════════════════════════════════════════════════
  // GL MAPPING
  // ═══════════════════════════════════════════════════════════
  hedge_account_code: string;         // Asset/Liability account
  oci_account_code?: string;          // OCI account (cash flow hedge)
  pnl_account_code: string;           // P&L account
  cash_account_code_base?: string;    // Cash account (base currency) - for deliverable
  cash_account_code_quote: string;    // Cash account (quote currency)
  
  // ═══════════════════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════════════════
  status: 'draft' | 'designated' | 'active' | 'de_designated' | 'settled' | 'rejected' | 'cancelled';
  designated_at?: Date;
  settled_at?: Date;
  
  // ═══════════════════════════════════════════════════════════
  // AUDIT TRAIL
  // ═══════════════════════════════════════════════════════════
  created_by: string;
  created_at: Date;
  designated_by?: string;
  approver1_id?: string;              // Dual authorization
  approver2_id?: string;               // Dual authorization
  settled_by?: string;
  version: number;
}
```

### 6.3 Hedge Designation Dossier Entity: `treasury_hedge_designations`

```typescript
interface HedgeDesignationDossier {
  id: string;
  tenant_id: string;
  contract_id: string;                 // FK to treasury_fx_contracts
  version: number;                     // Incremented on amendments
  is_current: boolean;                 // Is this the current designation?
  
  // Designation Details
  hedge_type: 'cash_flow' | 'fair_value' | 'net_investment';
  hedged_item: HedgedItemLink;         // Typed link (JSONB)
  hedge_ratio: number;
  effectiveness_test_method: 'dollar_offset' | 'regression' | 'critical_terms';
  effectiveness_threshold: { min: number; max: number }; // Policy threshold
  
  // IFRS 9 Documentation
  risk_management_objective: string;
  hedging_strategy: string;
  hedged_item_description: string;
  hedge_instrument_description: string;
  economic_relationship: string;
  sources_of_ineffectiveness: string;
  
  // Effectiveness Test Results
  prospective_test_result: EffectivenessTestResult; // JSONB
  retrospective_test_results: Array<{
    test_date: Date;
    result: EffectivenessTestResult;
  }>; // JSONB array
  
  // OCI Release Method
  oci_release_method: 'recycle_to_pnl' | 'basis_adjustment' | 'none';
  
  // Authorization
  designated_by: string;
  approver1_id: string;
  approver2_id: string;
  designated_at: Date;
  
  // Immutability
  is_immutable: boolean;                // Once DESIGNATED, cannot be modified
  superseded_by_version?: number;      // If amended, new version created
  amended_by?: string;
  amended_at?: Date;
  
  // Audit
  created_at: Date;
  version: number;
}
```

### 6.4 Settlement Entity: `treasury_fx_settlements`

```typescript
interface FXSettlement {
  id: string;
  tenant_id: string;
  contract_id: string;                 // FK to treasury_fx_contracts
  settlement_date: Date;
  settlement_method: 'deliverable' | 'ndf';
  
  // Settlement Rates
  contracted_rate: number;
  actual_settlement_rate: number;      // For deliverable
  fixing_rate?: number;                 // For NDF
  
  // Amounts
  base_currency_amount: Money;
  quote_currency_amount: Money;
  settlement_difference: Money;
  
  // GL Posting
  settlement_journal_entry_id: string; // FK to GL-02
  oci_release_journal_entry_id?: string; // FK to GL-02 (if applicable)
  
  // Authorization
  settled_by: string;
  approver1_id: string;                // Dual authorization
  approver2_id: string;                 // Dual authorization
  
  // Idempotency
  idempotency_key: string;
  
  // Status
  status: 'pending' | 'settled' | 'failed';
  
  // Audit
  created_at: Date;
  settled_at?: Date;
}
```

---

## 7. API Design

### 7.1 Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/treasury/counterparties` | List counterparties | `treasury.counterparty.view` |
| POST | `/api/treasury/counterparties` | Create counterparty | `treasury.counterparty.create` |
| GET | `/api/treasury/counterparties/:id` | Get counterparty details | `treasury.counterparty.view` |
| GET | `/api/treasury/fx-contracts` | List contracts | `treasury.fx_contract.view` |
| POST | `/api/treasury/fx-contracts` | Create contract | `treasury.fx_contract.create` |
| GET | `/api/treasury/fx-contracts/:id` | Get contract details | `treasury.fx_contract.view` |
| PATCH | `/api/treasury/fx-contracts/:id` | Amend contract | `treasury.fx_contract.update` |
| POST | `/api/treasury/fx-contracts/:id/designate` | Designate hedge | `treasury.fx_contract.designate` + dual auth |
| POST | `/api/treasury/fx-contracts/:id/amend-designation` | Amend designation (creates new version) | `treasury.fx_contract.designate` + dual auth |
| POST | `/api/treasury/fx-contracts/:id/de-designate` | De-designate hedge | `treasury.fx_contract.designate` + dual auth |
| GET | `/api/treasury/fx-contracts/:id/designation-dossier` | Get designation dossier | `treasury.fx_contract.view` |
| POST | `/api/treasury/fx-contracts/:id/revalue` | Revalue contract | `treasury.fx_contract.revalue` |
| POST | `/api/treasury/fx-contracts/:id/test-effectiveness` | Test effectiveness | `treasury.fx_contract.test` |
| POST | `/api/treasury/fx-contracts/:id/settle` | Settle contract | `treasury.fx_contract.settle` + dual auth |

---

## 8. Dependencies

| Dependency | Type | Purpose |
|------------|------|---------|
| **TR-01** | Upstream | Bank accounts (for counterparty settlement accounts) |
| **K_FX** | Kernel | FX rate service (spot, forward rates, external pricing sources) |
| **GL-03** | Downstream | Journal entry posting (revaluations, settlements, OCI releases) |
| **K_TIME** | Kernel | Fiscal period validation (Lock 1: Period Lock) |
| **K_POLICY** | Kernel | Effectiveness threshold policy, OCI release method policy |
| **K_AUTH** | Kernel | Dual authorization enforcement (Lock 4: Maker-Checker Boundary) |
| **K_LOG** | Kernel | Audit trail (Lock 5: Audit Completeness) |

---

## 9. Test Requirements

### 9.1 Unit Tests
- `FXHedgingService.test.ts` — Contract CRUD, hedge designation, MTM calculation
- `EffectivenessTestService.test.ts` — Effectiveness testing logic

### 9.2 Control Tests
- `DualAuth.test.ts` — Two distinct approvers required
- `IFRS9Compliance.test.ts` — Hedge documentation and effectiveness requirements
- `Audit.test.ts` — Audit event coverage

### 9.3 Integration Tests
- `fx-hedging-cell.integration.test.ts` — Full workflow end-to-end

---

---

## 10. Critical Fixes Applied (P0 & P1)

This PRD has been updated to address all critical P0 (must fix) and P1 (should add) issues identified during review:

### ✅ P0 Fixes (High Risk - Accounting Correctness)

1. **✅ IFRS 9 Effectiveness Logic (IAS 39 → IFRS 9)**
   - Removed hardcoded 80-125% as IFRS 9 requirement
   - Made quantitative tests (dollar-offset/regression) **internal policy thresholds**, not IFRS 9 requirements
   - Added economic relationship and credit risk assessment (IFRS 9 requirements)
   - Aligned qualifying criteria to IFRS 9 documentation requirements

2. **✅ Critical Terms Test Logic Bug**
   - Fixed object truthiness bug: `if (!Object.values(criticalTermsMatch).every(Boolean))`
   - Fixed milliseconds vs days: Convert `Math.abs(date1 - date2)` from ms to days
   - Proper validation of each critical term individually

3. **✅ Settlement Math / Journal (Deliverable vs NDF)**
   - Added `settlement_method: 'deliverable' | 'ndf'`
   - **Deliverable:** Two legs (base currency received + quote currency paid at forward rate) + unwind derivative
   - **NDF:** Single cash settlement (difference between contracted and fixing rate)
   - Corrected conceptual understanding: Spot drives fair value, forward rate drives cash flows

4. **✅ Dual-Authorization DB Constraint (DRAFT Records)**
   - Made constraint **conditional on status** (only enforced when status IN `designated/active/settled`)
   - Moved dual auth check to **command execution boundary** (Lock 4: Maker-Checker Boundary)
   - DRAFT records do NOT require dual authorization

### ✅ P1 Fixes (Must-Have Gaps)

5. **✅ Hedged Item Linkage (Typed Structure)**
   - Replaced `hedgedItem: string` with typed `HedgedItemLink` structure
   - Includes: `hedgedObjectType`, `hedgedObjectId`, `exposureCurrency`, `exposureAmount`, `exposureTiming`, `probabilityAssessment`, `designationDateSnapshot`
   - Essential for IFRS 9 documentation and audit

6. **✅ Designation Dossier Immutability**
   - Added `treasury_hedge_designations` entity (immutable designation package)
   - Once DESIGNATED, designation record is immutable (Lock 2)
   - Changes create new version (old version remains immutable)
   - Includes full IFRS 9 documentation, effectiveness test results, OCI release method

7. **✅ OCI Release Rules (Complete)**
   - Added `oci_release_method: 'recycle_to_pnl' | 'basis_adjustment' | 'none'`
   - Tied to hedged item type (forecast transactions → basis adjustment, recognized assets → recycle to P&L)
   - Net investment hedges: OCI remains until disposal

8. **✅ Valuation Model (Independent Pricing Control)**
   - Added independent pricing source validation
   - Compare internal K_FX rate to external source, flag variances > 1%
   - Added bid/ask/mid selection based on contract type
   - Added discounting conventions for longer-dated contracts
   - Store valuation source snapshot for audit

9. **✅ Counterparty Master Data**
   - Added `treasury_counterparties` master entity
   - Includes: ISDA agreement reference, netting sets, settlement instructions, bank accounts, credit limits, approvals
   - Replaced `counterparty: string` with `counterparty_id: string` (FK)

### ✅ The 5 Control Locks

**Lock 1: Period Lock**
- Block revalue/settle if K_TIME says period closed
- Require reversal workflow for closed periods

**Lock 2: Designation Dossier Immutability**
- Once DESIGNATED, designation record is immutable
- Changes create new version (old version remains immutable)

**Lock 3: Idempotent Posting**
- Every `FX_REVALUATION/FX_SETTLEMENT/FX_OCI_RELEASE` has unique posting key
- Format: `FX_{TYPE}-{contractId}-{date}-{sequence}`
- Prevents duplicate postings

**Lock 4: Maker-Checker Boundary**
- Dual auth enforced at command execution (designate/settle), not globally at table insert
- DRAFT records do NOT require dual authorization

**Lock 5: Audit Completeness**
- Extended audit events: amendments, cancellations, de-designations, OCI method, valuation source snapshot
- Immutable audit trail

---

**Status:** ✅ PRD Locked — All Critical Issues Resolved  
**Next Steps:** Create ARCHITECTURE-BRIEF.md and begin implementation

---

**Last Updated:** December 2025  
**Maintainer:** Finance Cell Team  
**Review Status:** ✅ Critical Issues Addressed
