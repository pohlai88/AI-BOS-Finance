# AP-03: 3-Way Match & Controls Engine Cell — Product Requirements Document

> **🟢 [ACTIVE]** — Enterprise Certified  
> **Cell Code:** AP-03  
> **Version:** 1.0.0  
> **Certified Date:** 2025-12-16  
> **Plane:** C — Data & Logic (Cell)  
> **Binding Scope:** Accounts Payable Molecule  
> **Authority:** CONT_07 (Finance Canon Architecture)  
> **Derives From:** CONT_07, CONT_10 (BioSkin Architecture)

---

## 📋 Document Control

| Property | Value |
|----------|-------|
| **Cell Code** | AP-03 |
| **Cell Name** | 3-Way Match & Controls Engine |
| **Molecule** | Accounts Payable (dom03-accounts-payable) |
| **Version** | 1.0.0 |
| **Status** | 🟢 ACTIVE |
| **Location** | `apps/canon/finance/dom03-accounts-payable/cells/ap03-3way-engine/` |
| **Author** | Finance Cell Team |
| **Last Updated** | 2025-12-16 |
| **Quality Bar** | Enterprise Certified / ICFR-Ready / Audit-Ready |

---

## 1. Executive Summary

The 3-Way Match & Controls Engine Cell (AP-03) prevents paying for undelivered/unauthorized items using validity assertions (PO/GRN matching). It supports **1-Way, 2-Way, and 3-Way** match modes, configurable via K_POLICY (policy engine) so the mode is a governed business rule, not hardcoded coupling.

### 1.1 Problem Statement

| Issue | Evidence | Impact |
|-------|----------|--------|
| **Paying for Undelivered Goods** | Invoice paid without GRN | Financial loss, inventory discrepancies |
| **Price/Qty Mismatches** | Invoice differs from PO | Overpayment, fraud risk |
| **No Match Evidence** | Cannot prove goods received | Audit findings, compliance failure |
| **Hardcoded Match Rules** | Match mode not configurable | Inflexible, cannot adapt to business needs |

### 1.2 Solution

A configurable match engine with:
- **1-Way Match:** Invoice-only validation (vendor, duplicates, math, tax)
- **2-Way Match:** PO ↔ Invoice (price/qty tolerance)
- **3-Way Match:** PO ↔ GRN ↔ Invoice (qty received must support billed qty)
- **Policy-Driven Configuration:** Match mode from K_POLICY (tenant/vendor/category overrides)
- **Exception Queue:** Failed matches route to exception workflow
- **Immutable Match Results:** Match records immutable once invoice posted

---

## 2. Purpose & Outcomes

### 2.1 Objective

Prevent paying for undelivered/unauthorized items using validity assertions (PO/GRN matching).

### 2.2 Outcomes

| Outcome | Success Criteria |
|---------|------------------|
| **Produce a Match Result that gates AP-04 approval and AP-05 payment** | Match status (`passed`, `exception`, `skipped`) stored in `ap.invoices.match_status` |
| **Match mode is configurable per tenant/vendor/category** | K_POLICY provides match mode configuration |
| **Overrides require separate approval (SoD)** | Override creates approval workflow (AP-04) |
| **All match results are immutable once invoice posted** | Database trigger prevents updates to posted match results |

---

## 3. Scope

### 3.1 In-Scope

| Feature | Description | Priority |
|---------|-------------|----------|
| **Match Evaluation Service** | Evaluate invoice against PO/GRN | P0 |
| **Exception Queue** | Failed matches route to exception workflow | P0 |
| **Tolerance Rules** | Price %, qty %, amount variance | P0 |
| **Evidence Linkage** | PO/GRN refs + attachments | P0 |
| **Policy-Driven Configuration** | Match mode from K_POLICY | P0 |
| **Override Workflow** | Override requires elevated approval | P0 |

### 3.2 Out-of-Scope

| Feature | Reason | Target |
|---------|--------|--------|
| **Building Procurement Canon** | PO/GRN systems may be external initially | v2.0.0 |
| **Real-Time PO/GRN Sync** | External dependency | v1.1.0 |
| **Advanced Tolerance Rules** | Complex business logic | v1.2.0 |
| **Match History Analytics** | Reporting feature | v1.3.0 |

---

## 4. Match Modes

### 4.1 Mode Definitions

| Mode | Validation | Use Case |
|------|------------|----------|
| **1-Way** | Invoice-only (vendor, duplicates, math, tax) | Low-risk vendors, recurring services |
| **2-Way** | PO ↔ Invoice (price/qty tolerance) | Standard procurement |
| **3-Way** | PO ↔ GRN ↔ Invoice (qty received must support billed qty) | High-risk vendors, inventory items |

### 4.2 Configuration Dimensions

| Dimension | Source | Example |
|-----------|--------|---------|
| **Tenant Default Mode** | K_POLICY | `tenant_123.match_mode = '3-way'` |
| **Per Vendor Override** | K_POLICY | `vendor_456.match_mode = '2-way'` |
| **Per Category/GL Account Override** | K_POLICY | `category_services.match_mode = '1-way'` |
| **Threshold/Tolerance Tables** | K_POLICY | `price_tolerance = 5%`, `qty_tolerance = 2%` |

### 4.3 Match Flow

```
┌─────────────┐
│   Invoice   │ ← From AP-02 (submitted)
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ Get Match Mode  │ ← K_POLICY (tenant/vendor/category)
│ (1/2/3-way)     │
└──────┬──────────┘
       │
       ├─→ 1-Way: Validate invoice only
       ├─→ 2-Way: Fetch PO, compare price/qty
       └─→ 3-Way: Fetch PO + GRN, compare qty received
       │
       ▼
┌─────────────────┐
│ Match Result    │
│ - passed        │ → AP-04 approval
│ - exception     │ → Exception queue
│ - skipped       │ → AP-04 approval (no match required)
└─────────────────┘
```

---

## 5. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  BFF Layer (Next.js API Routes)                                 │
│  /api/ap/match/*                                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Cell Services                                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────────────────┐│
│  │MatchService  │ │ToleranceService│ │ExceptionService        ││
│  └──────────────┘ └──────────────┘ └─────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Ports (Interfaces)                                              │
│  MatchRepositoryPort, PurchaseOrderPort, GoodsReceiptPort        │
│  PolicyPort (K_POLICY), AuditPort (K_LOG)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Adapters                                                        │
│  ┌───────────────────┐ ┌────────────────┐                       │
│  │ SQL (Production)  │ │ Memory (Test)  │                       │
│  │ External ERP      │ │ Mock PO/GRN    │                       │
│  └───────────────────┘ └────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
```

### 5.1 Hexagonal Architecture

| Layer | Component | Responsibility |
|-------|-----------|----------------|
| **Inbound** | API Routes | HTTP endpoints, request validation |
| **Domain** | MatchService | Match evaluation logic |
| **Domain** | ToleranceService | Tolerance rule evaluation |
| **Domain** | ExceptionService | Exception queue management |
| **Outbound** | MatchRepositoryPort | Persist match results |
| **Outbound** | PurchaseOrderPort | Fetch PO data (external or internal) |
| **Outbound** | GoodsReceiptPort | Fetch GRN data (external or internal) |
| **Outbound** | PolicyPort (K_POLICY) | Get match mode, tolerance rules |
| **Outbound** | AuditPort (K_LOG) | Immutable audit trail |

---

## 6. Data Model

### 6.1 Core Tables

```sql
-- ap.match_results
CREATE TABLE IF NOT EXISTS ap.match_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES ap.invoices(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  
  -- Match Configuration
  match_mode VARCHAR(10) NOT NULL CHECK (match_mode IN ('1-way', '2-way', '3-way')),
  match_policy_source VARCHAR(50),  -- 'tenant', 'vendor', 'category'
  
  -- Match Status
  status VARCHAR(20) NOT NULL CHECK (status IN ('passed', 'exception', 'skipped')),
  
  -- Evidence Links
  purchase_order_id VARCHAR(100),  -- External PO reference
  goods_receipt_id VARCHAR(100),  -- External GRN reference
  
  -- Tolerance Results
  price_variance_percent DECIMAL(5, 2),
  qty_variance_percent DECIMAL(5, 2),
  amount_variance_cents BIGINT,
  within_tolerance BOOLEAN,
  
  -- Exception Details
  exception_reason TEXT,
  exception_code VARCHAR(50),
  
  -- Override
  is_overridden BOOLEAN DEFAULT FALSE,
  override_approved_by UUID,
  override_approved_at TIMESTAMPTZ,
  override_reason TEXT,
  
  -- Audit
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  evaluated_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT chk_sod_override CHECK (
    (is_overridden = TRUE AND override_approved_by IS NOT NULL AND 
     override_approved_by != created_by) OR
    (is_overridden = FALSE)
  )
);

-- ap.match_exceptions
CREATE TABLE IF NOT EXISTS ap.match_exceptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_result_id UUID NOT NULL REFERENCES ap.match_results(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  
  -- Exception Details
  exception_type VARCHAR(50) NOT NULL,  -- 'price_mismatch', 'qty_mismatch', 'missing_grn', etc.
  severity VARCHAR(20) DEFAULT 'medium',  -- 'low', 'medium', 'high'
  message TEXT NOT NULL,
  
  -- Resolution
  resolution_status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'resolved', 'overridden'
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT chk_resolution CHECK (
    (resolution_status IN ('resolved', 'overridden') AND resolved_by IS NOT NULL) OR
    (resolution_status = 'pending')
  )
);

-- Indexes
CREATE INDEX idx_match_results_invoice ON ap.match_results(invoice_id);
CREATE INDEX idx_match_results_status ON ap.match_results(tenant_id, status);
CREATE INDEX idx_match_exceptions_match ON ap.match_exceptions(match_result_id);
CREATE INDEX idx_match_exceptions_status ON ap.match_exceptions(tenant_id, resolution_status);
```

### 6.2 Tolerance Rules

| Rule | Default | Configurable | Source |
|------|---------|--------------|--------|
| **Price Tolerance** | ±5% | ✅ Yes | K_POLICY |
| **Quantity Tolerance** | ±2% | ✅ Yes | K_POLICY |
| **Amount Tolerance** | ±$100 | ✅ Yes | K_POLICY |

---

## 7. Ports & APIs (Hexagonal)

### 7.1 Inbound Ports (API Endpoints)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/ap/match/evaluate` | Evaluate invoice match | `ap.match.evaluate` |
| `GET` | `/api/ap/match/{invoice_id}` | Get match result | `ap.match.read` |
| `POST` | `/api/ap/match/{invoice_id}/override` | Override match result | `ap.match.override` |
| `GET` | `/api/ap/match/exceptions` | List exception queue | `ap.match.read` |
| `POST` | `/api/ap/match/exceptions/{id}/resolve` | Resolve exception | `ap.match.resolve` |

### 7.2 Outbound Ports

| Port | Service | Purpose | Reliability |
|------|---------|---------|-------------|
| `MatchRepositoryPort` | SQL Adapter | Persist match results | Blocking |
| `PurchaseOrderPort` | External/Internal | Fetch PO data | Blocking (degraded if unavailable) |
| `GoodsReceiptPort` | External/Internal | Fetch GRN data | Blocking (degraded if unavailable) |
| `PolicyPort` (K_POLICY) | Kernel | Get match mode, tolerance rules | Blocking |
| `AuditPort` (K_LOG) | Kernel | Immutable audit trail | **Transactional** ⚠️ |

---

## 8. Controls & Evidence

### 8.1 Control Matrix (CONT_07 Format)

| Control ID | Assertion | Control | Evidence | Enforcement |
|:----------|:----------|:--------|:---------|:------------|
| **AP03-C01** | **Validity** | If mode = 3-way, invoice cannot reach "Approved" unless GRN supports qty within tolerance | Match status = 'passed' required for approval | **State Machine Gate** |
| **AP03-C02** | **Authorization** | Override path requires policy-gated permission + audit event | `chk_sod_override` constraint, audit event | **DB Constraint + Audit** |
| **AP03-C03** | **Completeness** | All match results are immutable once invoice posted | Database trigger prevents updates | **DB Trigger** |
| **AP03-C04** | **Completeness** | All match evaluations emit audit events | `kernel.audit_events` coverage = 100% | **Transactional Audit** |
| **AP03-C05** | **Accuracy** | Match mode configuration from K_POLICY (governed, not hardcoded) | Policy source tracked in `match_policy_source` | **Policy-Driven** |

### 8.2 Evidence Artifacts

| Artifact | Location | Retention | Purpose |
|----------|----------|-----------|---------|
| **Match Result** | `ap.match_results` | 7 years | Match evidence |
| **Match Exceptions** | `ap.match_exceptions` | 7 years | Exception evidence |
| **Audit Events** | `kernel.audit_events` | 7 years | Compliance trail |
| **Override Approvals** | `kernel.audit_events` (filtered) | 7 years | SoD evidence |

---

## 9. UI/UX (BioSkin Architecture)

### 9.1 Component Requirements (CONT_10)

| Component | Type | Schema-Driven? | Location |
|-----------|------|----------------|----------|
| **MatchResultView** | `BioObject` | ✅ Yes | `apps/web/src/features/match/components/MatchResultView.tsx` |
| **ExceptionQueue** | `BioTable` | ✅ Yes | `apps/web/src/features/match/components/ExceptionQueue.tsx` |
| **OverrideForm** | `BioForm` | ✅ Yes | `apps/web/src/features/match/components/OverrideForm.tsx` |

### 9.2 Schema Definition

```typescript
// packages/schemas/src/match.schema.ts
import { z } from 'zod';

export const MatchResultSchema = z.object({
  id: z.string().uuid().optional(),
  invoice_id: z.string().uuid(),
  match_mode: z.enum(['1-way', '2-way', '3-way']),
  status: z.enum(['passed', 'exception', 'skipped']),
  purchase_order_id: z.string().optional(),
  goods_receipt_id: z.string().optional(),
  price_variance_percent: z.number().optional(),
  qty_variance_percent: z.number().optional(),
  within_tolerance: z.boolean(),
  exception_reason: z.string().optional(),
  is_overridden: z.boolean().default(false),
});

export type MatchResult = z.infer<typeof MatchResultSchema>;
```

---

## 10. Acceptance Criteria

### 10.1 Functional Requirements

| ID | Requirement | Test |
|:---|:------------|:-----|
| **AC-01** | If mode = 3-way, invoice cannot reach "Approved" unless GRN supports qty within tolerance | Match status = 'passed' required |
| **AC-02** | Override path requires policy-gated permission + audit event | Override creates approval workflow |
| **AC-03** | `/ready` reports dependency status (PO/GRN ports available/degraded) | Health check endpoint |
| **AC-04** | Match mode configuration from K_POLICY (not hardcoded) | Policy source tracked |
| **AC-05** | All match results immutable once invoice posted | Database trigger prevents updates |
| **AC-06** | Tolerance rules configurable per tenant/vendor/category | K_POLICY provides configuration |

### 10.2 Non-Functional Requirements

| ID | Requirement | Target |
|:---|:------------|:------|
| **NFR-01** | Match evaluation latency | < 500ms |
| **NFR-02** | External PO/GRN fetch timeout | < 2s |
| **NFR-03** | Test coverage | ≥ 90% |

---

## 11. Testing Requirements

### 11.1 Unit Tests

| Component | Test Coverage | Files |
|-----------|---------------|-------|
| `MatchService` | Match evaluation logic | `__tests__/MatchService.test.ts` |
| `ToleranceService` | Tolerance rule evaluation | `__tests__/ToleranceService.test.ts` |
| `ExceptionService` | Exception queue management | `__tests__/ExceptionService.test.ts` |

### 11.2 Integration Tests

| Test | Description | File |
|------|-------------|------|
| **3-Way Match** | GRN qty must support invoice qty | `__tests__/integration/ThreeWayMatch.test.ts` |
| **Override Workflow** | Override requires approval | `__tests__/integration/Override.test.ts` |
| **Policy Configuration** | Match mode from K_POLICY | `__tests__/integration/PolicyConfig.test.ts` |
| **Immutability** | Posted match results cannot be updated | `__tests__/integration/Immutability.test.ts` |

---

## 12. Implementation Optimization Notes

> **📌 Optimization Learnings from AP-01 Implementation**  
> Apply these optimizations during AP-03 implementation to avoid performance issues.

### 12.1 Database Query Optimizations

#### ✅ **List Query Optimization (CRITICAL)**
**Pattern:** Use window function `COUNT(*) OVER()` instead of separate COUNT query.

**Before (Two Queries):**
```typescript
const countResult = await pool.query(`SELECT COUNT(*) FROM ...`);
const dataResult = await pool.query(`SELECT * FROM ... LIMIT ...`);
```

**After (Single Query):**
```typescript
const result = await pool.query(`
  SELECT *, COUNT(*) OVER() as total
  FROM ap.match_results 
  WHERE ... 
  ORDER BY ... 
  LIMIT ... OFFSET ...
`);
const total = result.rows[0]?.total || 0;
```

**Impact:** 50% reduction in database round-trips, ~20-30ms faster.

#### ✅ **Composite Indexes for Match Queries**
Add composite indexes for common match query patterns:
```sql
-- For invoice_id + match_status (most common query)
CREATE INDEX idx_match_results_invoice_status 
  ON ap.match_results(invoice_id, match_status);

-- For exception queue queries
CREATE INDEX idx_match_results_tenant_exceptions 
  ON ap.match_results(tenant_id, created_at DESC) 
  WHERE match_status = 'exception';
```

#### ✅ **Partial Indexes for Status Filters**
```sql
-- For pending matches
CREATE INDEX idx_match_results_tenant_pending 
  ON ap.match_results(tenant_id, created_at ASC) 
  WHERE match_status = 'pending';

-- For failed matches (exception queue)
CREATE INDEX idx_match_results_tenant_failed 
  ON ap.match_results(tenant_id, created_at DESC) 
  WHERE match_status = 'failed';
```

### 12.2 Error Handling Best Practices

#### ✅ **Use Domain-Specific Errors**
**Pattern:** Replace generic `Error` with domain-specific error classes.

**Before:**
```typescript
if (result.rows.length === 0) {
  throw new Error(`Match result not found: ${id}`);
}
```

**After:**
```typescript
import { MatchResultNotFoundError } from './errors';

if (result.rows.length === 0) {
  throw new MatchResultNotFoundError(id);
}
```

**Impact:** Better API error messages, proper HTTP status codes.

### 12.3 Performance Considerations for Match Engine

#### ⚠️ **Batch Match Processing**
For bulk invoice matching, consider batch processing:
```typescript
// Process matches in batches to avoid memory issues
async function processBatch(invoiceIds: string[], batchSize = 100) {
  for (let i = 0; i < invoiceIds.length; i += batchSize) {
    const batch = invoiceIds.slice(i, i + batchSize);
    await Promise.all(batch.map(id => matchInvoice(id)));
  }
}
```

#### ⚠️ **Cache PO/GRN Data**
Cache frequently accessed PO and GRN data:
```typescript
// Cache PO data for 5 minutes (read-heavy)
const cacheKey = `po:${poId}:${tenantId}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);
```

### 12.4 Database Statistics

#### ✅ **Set Statistics Targets**
```sql
ALTER TABLE ap.match_results ALTER COLUMN tenant_id SET STATISTICS 1000;
ALTER TABLE ap.match_results ALTER COLUMN match_status SET STATISTICS 500;
ALTER TABLE ap.match_results ALTER COLUMN invoice_id SET STATISTICS 500;

ANALYZE ap.match_results;
```

### 12.5 Reference Implementation

See AP-01 optimized implementation:
- **SQL Adapter:** `packages/kernel-adapters/src/sql/vendorRepo.sql.ts` (list query optimization)
- **Migration:** `apps/db/migrations/finance/105_create_vendors.sql` (indexes)
- **Audit Report:** `apps/canon/finance/dom03-accounts-payable/cells/ap01-vendor-master/AUDIT_OPTIMIZATION_REPORT.md`

---

## 13. Related Documents

| Document | Purpose | Location |
|----------|---------|----------|
| **CONT_07** | Finance Canon Architecture | `packages/canon/A-Governance/A-CONT/CONT_07_FinanceCanonArchitecture.md` |
| **CONT_10** | BioSkin Architecture | `packages/canon/A-Governance/A-CONT/CONT_10_BioSkinArchitecture.md` |
| **AP-02 PRD** | Invoice Entry (upstream) | `apps/canon/finance/dom03-accounts-payable/cells/ap02-invoice-entry/PRD-ap02-invoice-entry.md` |
| **AP-04 PRD** | Invoice Approval (downstream) | `apps/canon/finance/dom03-accounts-payable/cells/ap04-invoice-submit-approval/PRD-ap04-invoice-submit-approval.md` |

---

**Status:** ✅ Ready for Implementation  
**Next Step:** Create service implementations following hexagonal architecture

---

**Last Updated:** 2025-12-16  
**Maintainer:** Finance Cell Team  
**Review Cycle:** Quarterly
