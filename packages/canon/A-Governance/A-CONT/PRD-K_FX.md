# K_FX — Multi-Currency Kernel Service PRD

> **🟢 [ACTIVE]** — Enterprise Certified  
> **Service Code:** K_FX  
> **Version:** 1.0.0  
> **Certified Date:** 2025-12-17  
> **Plane:** C — Kernel Services  
> **Authority:** CONT_07 (Finance Canon Architecture)  
> **Derives From:** CONT_02, CONT_07

---

## 📋 Document Control

| Property | Value |
|----------|-------|
| **Service Code** | K_FX |
| **Service Name** | Foreign Exchange (Multi-Currency) |
| **Type** | Kernel Service |
| **Version** | 1.0.0 |
| **Status** | 🟢 ACTIVE |
| **Location** | `packages/kernel-core/src/ports/fxPort.ts` |
| **Author** | Finance Cell Team |
| **Last Updated** | 2025-12-17 |
| **Quality Bar** | Enterprise Certified / ICFR-Ready / Audit-Ready |

---

## 1. Executive Summary

K_FX is the **Multi-Currency Kernel Service** that enables AR, AP, and GL modules to process transactions in multiple currencies while maintaining a single functional (reporting) currency for financial statements. It provides:

- **FX Rate Management**: Import, lock, and govern exchange rates
- **Currency Conversion**: Convert amounts with locked rate references for audit trail
- **Period-End Revaluation**: Calculate and post unrealized FX gains/losses
- **Rate Governance**: Period lock discipline prevents backdated silent rate changes

### 1.1 Problem Statement

| Issue | Evidence | Impact |
|-------|----------|--------|
| **International Customers** | AR invoices in foreign currencies | Revenue mis-stated in reporting currency |
| **Multi-Currency Vendors** | AP invoices in EUR, GBP, JPY | Expense mis-stated in reporting currency |
| **FX Rate Drift** | Rates changed after posting | Audit trail broken, restatement risk |
| **Unrealized FX G/L** | Open AR/AP balances not revalued | Balance sheet mis-stated |
| **No Rate Governance** | Anyone can modify rates anytime | Period close integrity violated |

### 1.2 Solution

A governed multi-currency service with:
- **Transaction Currency + Functional Currency**: Store both currencies on each transaction
- **Locked Rate References**: Each posting stores `rate_id` FK for immutable audit trail
- **Period Lock Discipline**: Rates cannot be modified after period close (same as K_TIME)
- **Unrealized Revaluation**: Calculate FX gain/loss on open balances at period end
- **Realized Revaluation**: Calculate FX gain/loss at settlement time

---

## 2. Data Model

### 2.1 Core Tables

```sql
-- finance.fx_rates
CREATE TABLE IF NOT EXISTS finance.fx_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  
  -- Currency Pair
  from_currency VARCHAR(3) NOT NULL,  -- ISO 4217 (e.g., 'EUR')
  to_currency VARCHAR(3) NOT NULL,    -- ISO 4217 (e.g., 'USD')
  
  -- Rate
  rate DECIMAL(20, 10) NOT NULL,       -- e.g., 1.0850000000
  inverse_rate DECIMAL(20, 10) NOT NULL, -- Auto-calculated: 1/rate
  rate_type VARCHAR(20) NOT NULL DEFAULT 'SPOT' CHECK (rate_type IN (
    'SPOT', 'AVERAGE', 'CLOSING', 'CONTRACTED'
  )),
  
  -- Validity
  effective_date DATE NOT NULL,
  expiry_date DATE,
  
  -- Source & Audit
  source VARCHAR(20) NOT NULL CHECK (source IN (
    'MANUAL', 'ECB', 'OPENEXCHANGE', 'BLOOMBERG', 'REUTERS', 'CUSTOM_API'
  )),
  source_reference_id VARCHAR(100),
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Period Lock
  locked_for_period VARCHAR(7),  -- e.g., '2025-01'
  locked_by UUID,
  locked_at TIMESTAMPTZ,
  
  -- Audit
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT uq_fx_rate_pair_date_type UNIQUE (tenant_id, from_currency, to_currency, effective_date, rate_type),
  CONSTRAINT chk_rate_positive CHECK (rate > 0),
  CONSTRAINT chk_expiry_after_effective CHECK (expiry_date IS NULL OR expiry_date >= effective_date)
);

-- Trigger: Prevent modification of locked rates
CREATE OR REPLACE FUNCTION finance.fn_prevent_locked_rate_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.locked_for_period IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot modify FX rate (%) - rate is locked for period %', OLD.id, OLD.locked_for_period;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_locked_rate_update
  BEFORE UPDATE OR DELETE ON finance.fx_rates
  FOR EACH ROW
  WHEN (OLD.locked_for_period IS NOT NULL)
  EXECUTE FUNCTION finance.fn_prevent_locked_rate_update();

-- Trigger: Auto-calculate inverse rate
CREATE OR REPLACE FUNCTION finance.fn_calculate_inverse_rate()
RETURNS TRIGGER AS $$
BEGIN
  NEW.inverse_rate := 1.0 / NEW.rate;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_inverse_rate
  BEFORE INSERT OR UPDATE OF rate ON finance.fx_rates
  FOR EACH ROW
  EXECUTE FUNCTION finance.fn_calculate_inverse_rate();

-- finance.fx_currency_config (Company currency settings)
CREATE TABLE IF NOT EXISTS finance.fx_currency_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES finance.companies(id),
  
  -- Currency Settings
  functional_currency VARCHAR(3) NOT NULL DEFAULT 'USD',  -- Reporting currency
  presentation_currency VARCHAR(3),                        -- Optional: different for reports
  
  -- Rounding
  default_rounding_method VARCHAR(10) DEFAULT 'HALF_UP' CHECK (default_rounding_method IN (
    'HALF_UP', 'HALF_EVEN', 'FLOOR', 'CEIL'
  )),
  
  -- Supported Transaction Currencies
  supported_currencies TEXT[] DEFAULT ARRAY['USD'],  -- e.g., ['USD', 'EUR', 'GBP']
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1,
  
  CONSTRAINT uq_company_currency_config UNIQUE (tenant_id, company_id)
);

-- finance.fx_revaluations (Period-end revaluation records)
CREATE TABLE IF NOT EXISTS finance.fx_revaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES finance.companies(id),
  
  -- Period
  revaluation_date DATE NOT NULL,
  period VARCHAR(7) NOT NULL,  -- e.g., '2025-01'
  
  -- Document Reference
  document_id UUID NOT NULL,
  document_type VARCHAR(20) NOT NULL CHECK (document_type IN (
    'AR_INVOICE', 'AR_RECEIPT', 'AP_INVOICE', 'AP_PAYMENT'
  )),
  
  -- Original Booking
  original_currency VARCHAR(3) NOT NULL,
  original_amount_cents BIGINT NOT NULL,
  original_rate DECIMAL(20, 10) NOT NULL,
  original_rate_id UUID REFERENCES finance.fx_rates(id),
  original_functional_cents BIGINT NOT NULL,
  
  -- Revaluation
  revaluation_rate DECIMAL(20, 10) NOT NULL,
  revaluation_rate_id UUID REFERENCES finance.fx_rates(id),
  revaluated_functional_cents BIGINT NOT NULL,
  
  -- FX Gain/Loss
  fx_gain_loss_cents BIGINT NOT NULL,  -- Positive = gain, negative = loss
  unrealized BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Posting
  journal_header_id UUID REFERENCES finance.journal_headers(id),
  posted_at TIMESTAMPTZ,
  posted_by UUID,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT uq_document_revaluation_period UNIQUE (tenant_id, document_id, period)
);

-- Indexes
CREATE INDEX idx_fx_rates_tenant_pair ON finance.fx_rates(tenant_id, from_currency, to_currency, effective_date);
CREATE INDEX idx_fx_rates_locked_period ON finance.fx_rates(tenant_id, locked_for_period) WHERE locked_for_period IS NOT NULL;
CREATE INDEX idx_fx_revaluations_document ON finance.fx_revaluations(document_id);
CREATE INDEX idx_fx_revaluations_period ON finance.fx_revaluations(tenant_id, company_id, period);
```

### 2.2 AR/AP Integration — Schema Changes

When K_FX is integrated, AR and AP tables add these columns:

```sql
-- Add to ar.invoices, ar.receipts, ap.invoices, finance.payments:

-- Transaction Currency (customer/vendor currency)
transaction_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
transaction_amount_cents BIGINT NOT NULL,  -- Amount in transaction currency

-- Functional Currency (reporting currency)
functional_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
functional_amount_cents BIGINT NOT NULL,   -- Amount in functional currency

-- FX Rate Reference (immutable audit trail)
fx_rate_id UUID REFERENCES finance.fx_rates(id),  -- Locked rate used
fx_rate DECIMAL(20, 10) NOT NULL,                  -- Rate snapshot at posting time

-- Example constraint
CONSTRAINT chk_functional_amount CHECK (
  functional_amount_cents = ROUND(transaction_amount_cents * fx_rate)
);
```

---

## 3. Controls & Evidence

### 3.1 Control Matrix (CONT_07 Format)

| Control ID | Assertion | Control | Evidence | Enforcement |
|:----------|:----------|:--------|:---------|:------------|
| **KFX-C01** | **Accuracy** | FX rates cannot be negative or zero | `chk_rate_positive` constraint | **DB Constraint** |
| **KFX-C02** | **Cutoff** | Locked rates cannot be modified | Trigger: `fn_prevent_locked_rate_update` | **DB Trigger** |
| **KFX-C03** | **Completeness** | Every multi-currency posting stores rate_id | FK: `fx_rate_id REFERENCES finance.fx_rates(id)` | **FK Constraint** |
| **KFX-C04** | **Accuracy** | Functional amount = transaction × rate | `chk_functional_amount` constraint | **DB Constraint** |
| **KFX-C05** | **Valuation** | Period-end revaluation calculates unrealized FX G/L | `finance.fx_revaluations` table | **Automated Process** |
| **KFX-C06** | **Authorization** | Rate lock requires K_TIME period close first | Service validation | **Service Logic** |
| **KFX-C07** | **Completeness** | Inverse rate auto-calculated | Trigger: `fn_calculate_inverse_rate` | **DB Trigger** |
| **KFX-C08** | **Accuracy** | Rate source tracked for audit | `source`, `source_reference_id`, `fetched_at` columns | **Data Model** |

---

## 4. Port Interface

See `packages/kernel-core/src/ports/fxPort.ts` for the full TypeScript interface.

### 4.1 Key Operations

| Method | Description | ICFR Control |
|--------|-------------|--------------|
| `getRate()` | Get FX rate for currency pair on date | — |
| `upsertRate()` | Create/update rate (fails if locked) | KFX-C02 |
| `lockRatesForPeriod()` | Lock rates after period close | KFX-C02, KFX-C06 |
| `convert()` | Convert amount with locked rate reference | KFX-C03, KFX-C04 |
| `calculateRevaluation()` | Calculate unrealized FX G/L | KFX-C05 |
| `postRevaluation()` | Post revaluation journal entries | KFX-C05 |

---

## 5. Integration with AR/AP

### 5.1 AR-02 Invoice Posting (Multi-Currency)

```typescript
// Before posting to GL, convert to functional currency
const conversion = await fxPort.convert(
  tenantId,
  invoice.totalAmountCents,
  invoice.transactionCurrency,      // e.g., 'EUR'
  functionalCurrency,               // e.g., 'USD'
  invoice.invoiceDate,
  { rateType: 'SPOT' }
);

// Store both amounts + rate reference
invoice.functionalAmountCents = conversion.targetAmount;
invoice.fxRateId = conversion.rateId;
invoice.fxRate = conversion.rate;

// Post to GL in functional currency
await glPostingPort.post({
  // ... debit AR (functional), credit Revenue (functional)
});
```

### 5.2 AR-03 Receipt Allocation (Realized FX G/L)

```typescript
// At settlement time, calculate realized FX gain/loss
const originalRate = invoice.fxRate;
const settlementRate = receipt.fxRate;

const originalFunctional = invoice.transactionAmountCents * originalRate;
const settlementFunctional = receipt.transactionAmountCents * settlementRate;

const realizedFxGainLoss = settlementFunctional - originalFunctional;

// Post FX gain/loss
if (realizedFxGainLoss !== 0) {
  await glPostingPort.post({
    // Debit/Credit FX Gain/Loss account
  });
}
```

### 5.3 Period-End Revaluation

```typescript
// At month-end, revalue all open AR/AP balances
const revaluations = await fxPort.calculateRevaluation(
  tenantId,
  companyId,
  monthEndDate,
  'AR_INVOICE'
);

// Post unrealized FX gain/loss
const journalId = await fxPort.postRevaluation(
  tenantId,
  companyId,
  monthEndDate,
  revaluations,
  userId
);

// Lock rates for the period
await fxPort.lockRatesForPeriod(tenantId, '2025-01', userId);
```

---

## 6. Rate Sources

### 6.1 Supported Sources

| Source | API | Update Frequency | Cost |
|--------|-----|------------------|------|
| **Manual** | — | As needed | Free |
| **ECB** | `exchangeratesapi.io` | Daily | Free/Paid |
| **OpenExchangeRates** | `openexchangerates.org` | Hourly | Paid |
| **Bloomberg** | Enterprise API | Real-time | Enterprise |
| **Reuters/Refinitiv** | Enterprise API | Real-time | Enterprise |

### 6.2 Rate Import Flow

```
┌────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  External API  │────▶│  Rate Adapter   │────▶│  finance.fx_rates│
│  (ECB, etc.)   │     │  (Scheduled)    │     │  (Immutable after│
└────────────────┘     └─────────────────┘     │  period lock)   │
                                               └─────────────────┘
```

---

## 7. Roadmap

| Phase | Features | Target |
|-------|----------|--------|
| **v1.0.0** | Core rate management, conversion, period lock | Q1 2026 |
| **v1.1.0** | Unrealized FX revaluation automation | Q1 2026 |
| **v1.2.0** | Rate import adapters (ECB, OpenExchange) | Q2 2026 |
| **v2.0.0** | Hedging/contracted rates, triangulation | Q3 2026 |

---

## 8. Acceptance Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| **AC-01** | FX rate stored with 10 decimal precision | Schema: `DECIMAL(20, 10)` |
| **AC-02** | Locked rates cannot be modified | Integration test: trigger exception |
| **AC-03** | Conversion result includes rate_id FK | Unit test: ConversionResult shape |
| **AC-04** | Revaluation calculates correct FX G/L | Unit test: known rate scenarios |
| **AC-05** | Rate source + timestamp tracked | Schema: `source`, `fetched_at` columns |
| **AC-06** | Inverse rate auto-calculated | Unit test: insert rate, verify inverse |

---

**Last Updated:** 2025-12-17  
**Next Review:** Q1 2026  
**Maintainer:** Finance Kernel Team
