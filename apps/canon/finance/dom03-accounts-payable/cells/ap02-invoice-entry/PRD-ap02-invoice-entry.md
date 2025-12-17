# AP-02: Supplier Invoice Entry Cell — Product Requirements Document

> **🟢 [ACTIVE]** — Enterprise Certified  
> **Cell Code:** AP-02  
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
| **Cell Code** | AP-02 |
| **Cell Name** | Supplier Invoice Entry |
| **Molecule** | Accounts Payable (dom03-accounts-payable) |
| **Version** | 1.0.0 |
| **Status** | 🟢 ACTIVE |
| **Location** | `apps/canon/finance/dom03-accounts-payable/cells/ap02-invoice-entry/` |
| **Author** | Finance Cell Team |
| **Last Updated** | 2025-12-16 |
| **Quality Bar** | Enterprise Certified / ICFR-Ready / Audit-Ready |

---

## 1. Executive Summary

The Supplier Invoice Entry Cell (AP-02) recognizes liabilities per accrual basis (incurred, not paid). It captures invoices, enforces duplicate detection, and produces a **deterministic posting path** into GL-03 (Posting Engine). The invoice state machine gates downstream processes (AP-03 matching, AP-04 approval, AP-05 payment).

### 1.1 Problem Statement

| Issue | Evidence | Impact |
|-------|----------|--------|
| **Duplicate Invoices** | Same invoice paid multiple times | Financial loss, audit findings |
| **Period Cutoff Violations** | Invoices posted to closed periods | Financial statement errors |
| **Missing GL Posting** | Invoices not posted to GL | Reconciliation failures |
| **No Traceability** | Cannot trace from GL to source invoice | Audit trail broken |

### 1.2 Solution

A governed invoice entry system with:
- **Duplicate Detection:** Vendor + invoice number + amount/date tolerance
- **Period Cutoff Enforcement:** Blocking validation via K_TIME
- **Deterministic Posting:** Invoice → Journal lines (predictable, reproducible)
- **Immutable Ledger:** No update/delete after posted (correction via reversal)
- **Full Traceability:** Invoice → Journal → GL → Financial Statements

---

## 2. Purpose & Outcomes

### 2.1 Objective

Recognize liabilities per accrual basis (incurred, not paid).

### 2.2 Outcomes

| Outcome | Success Criteria |
|---------|------------------|
| **Invoice produces a deterministic posting path into GL-03** | Every approved invoice has `journal_header_id` (FK to `finance.journal_headers`) |
| **Duplicate invoices are blocked** | Unique constraint: `(tenant_id, vendor_id, invoice_number, invoice_date)` |
| **Period cutoff is enforced** | Posting blocked if period closed (K_TIME validation) |
| **Immutable ledger after posting** | Database trigger prevents updates/deletes to posted invoices |

---

## 3. Scope

### 3.1 In-Scope

| Feature | Description | Priority |
|---------|-------------|----------|
| **Invoice Capture** | Header + lines, tax, currency, attachments | P0 |
| **Duplicate Detection** | Vendor + invoice no + amount/date tolerance | P0 |
| **Invoice State Machine** | `draft → submitted → matched? → approved → posted → paid/closed` | P0 |
| **Posting Request to GL-03** | Blocking call to GL Posting Engine | P0 |
| **Period Cutoff Validation** | K_TIME check before posting | P0 |
| **Vendor Validation** | FK to approved vendor (AP-01) | P0 |

### 3.2 Out-of-Scope

| Feature | Reason | Target |
|---------|--------|--------|
| **OCR Scanning** | External dependency, complex | v2.0.0 |
| **Complex Landed-Cost Allocation** | Requires procurement integration | v1.2.0 |
| **Multi-Currency FX** | K_FX integration (future) | v1.1.0 |
| **Invoice Approval Workflow** | Handled by AP-04 | — |
| **3-Way Matching** | Handled by AP-03 | — |

---

## 4. State Machine

```
┌─────────┐
│  draft  │ ← Created by Maker
└────┬────┘
     │ submit()
     ▼
┌─────────────┐
│  submitted  │ ← Ready for AP-03 matching
└────┬────────┘
     │ match() [if AP-03 enabled]
     ▼
┌─────────────┐
│   matched   │ ← AP-03 passed (or skipped)
└────┬────────┘
     │ approve() [AP-04]
     ▼
┌──────────┐
│ approved │ ← Ready for GL posting
└────┬─────┘
     │ post() [GL-03]
     ▼
┌─────────┐
│  posted │ ← Posted to GL (immutable)
└────┬────┘
     │ pay() [AP-05]
     ▼
┌─────────┐
│  paid   │ ← Payment executed
└────┬────┘
     │ close()
     ▼
┌─────────┐
│ closed  │ ← Terminal state
└─────────┘
```

### 4.1 States

| Status | Description | Immutable? | Terminal? | Can Post to GL? |
|--------|-------------|------------|-----------|-----------------|
| `draft` | Invoice being prepared | No | No | ❌ No |
| `submitted` | Ready for matching | No | No | ❌ No |
| `matched` | AP-03 passed (or skipped) | No | No | ❌ No |
| `approved` | AP-04 approved | No | No | ✅ Yes |
| `posted` | Posted to GL | **Yes** | No | — |
| `paid` | Payment executed (AP-05) | **Yes** | No | — |
| `closed` | Fully processed | **Yes** | **Yes** | — |
| `voided` | Reversed (correction path) | **Yes** | **Yes** | — |

### 4.2 Actions

| Action | From State | To State | Actor | Blocking Validation |
|--------|-----------|----------|-------|---------------------|
| `submit` | `draft` | `submitted` | Maker | Vendor approved, duplicate check |
| `match` | `submitted` | `matched` | System (AP-03) | Match result (pass/exception) |
| `approve` | `matched` | `approved` | Checker (AP-04) | SoD, approval rules |
| `post` | `approved` | `posted` | System (GL-03) | Period open, COA valid |
| `pay` | `posted` | `paid` | System (AP-05) | Payment execution |
| `close` | `paid` | `closed` | System | All lines reconciled |
| `void` | `approved` or `posted` | `voided` | Admin | Creates reversal journal |

---

## 5. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  BFF Layer (Next.js API Routes)                                 │
│  /api/ap/invoices/*                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Cell Services                                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────────────────┐│
│  │InvoiceService│ │PostingService│ │DuplicateDetectionService││
│  └──────────────┘ └──────────────┘ └─────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Ports (Interfaces)                                              │
│  InvoiceRepositoryPort, VendorPort, GLPostingPort, AuditPort    │
│  FiscalTimePort (K_TIME), COAPort (K_COA), SequencePort (K_SEQ)│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Adapters                                                        │
│  ┌───────────────────┐ ┌────────────────┐                       │
│  │ SQL (Production)  │ │ Memory (Test)  │                       │
│  └───────────────────┘ └────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
```

### 5.1 Hexagonal Architecture

| Layer | Component | Responsibility |
|-------|-----------|----------------|
| **Inbound** | API Routes | HTTP endpoints, request validation |
| **Domain** | InvoiceService | Invoice creation, state transitions |
| **Domain** | PostingService | GL posting orchestration |
| **Domain** | DuplicateDetectionService | Duplicate detection logic |
| **Outbound** | InvoiceRepositoryPort | Data persistence |
| **Outbound** | VendorPort | Validate vendor approved (AP-01) |
| **Outbound** | GLPostingPort | Post to GL-03 (blocking) |
| **Outbound** | FiscalTimePort (K_TIME) | Period cutoff validation |
| **Outbound** | COAPort (K_COA) | Chart of Accounts validation |
| **Outbound** | AuditPort (K_LOG) | Immutable audit trail |
| **Outbound** | SequencePort (K_SEQ) | Invoice number generation |

---

## 6. Data Model

### 6.1 Core Tables

```sql
-- ap.invoices
CREATE TABLE IF NOT EXISTS ap.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES finance.companies(id),
  
  -- Identification
  invoice_number VARCHAR(100) NOT NULL,  -- Vendor's invoice number
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  reference VARCHAR(100),  -- Internal reference
  
  -- Vendor Link
  vendor_id UUID NOT NULL REFERENCES ap.vendors(id),
  
  -- Amounts
  subtotal_cents BIGINT NOT NULL,  -- Before tax
  tax_amount_cents BIGINT NOT NULL DEFAULT 0,
  total_amount_cents BIGINT NOT NULL,  -- subtotal + tax
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  
  -- Status Machine
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'submitted', 'matched', 'approved', 'posted', 'paid', 'closed', 'voided'
  )),
  
  -- Matching (AP-03)
  match_status VARCHAR(20),  -- 'passed', 'exception', 'skipped'
  match_result_id UUID,  -- Link to AP-03 match result
  
  -- GL Posting
  journal_header_id UUID REFERENCES finance.journal_headers(id),
  posted_at TIMESTAMPTZ,
  posted_by UUID,
  
  -- Payment Link (AP-05)
  payment_id UUID REFERENCES finance.payments(id),
  
  -- Duplicate Detection
  duplicate_flag BOOLEAN DEFAULT FALSE,
  duplicate_of_invoice_id UUID REFERENCES ap.invoices(id),
  
  -- Audit
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_by UUID,
  submitted_at TIMESTAMPTZ,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  version INTEGER DEFAULT 1,  -- Optimistic locking
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT uq_invoice_vendor_number_date UNIQUE (tenant_id, vendor_id, invoice_number, invoice_date),
  CONSTRAINT chk_vendor_approved CHECK (
    EXISTS (SELECT 1 FROM ap.vendors WHERE id = vendor_id AND status = 'approved')
  ),
  CONSTRAINT chk_amounts_balance CHECK (total_amount_cents = subtotal_cents + tax_amount_cents),
  CONSTRAINT chk_due_after_invoice CHECK (due_date >= invoice_date)
);

-- ap.invoice_lines
CREATE TABLE IF NOT EXISTS ap.invoice_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES ap.invoices(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  
  -- Line Details
  line_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(15, 4) NOT NULL,
  unit_price_cents BIGINT NOT NULL,
  line_amount_cents BIGINT NOT NULL,  -- quantity * unit_price
  
  -- GL Posting
  debit_account_code VARCHAR(50) NOT NULL,  -- Expense/Asset account
  credit_account_code VARCHAR(50) NOT NULL DEFAULT '2000',  -- AP Payable (default)
  
  -- Classification
  cost_center VARCHAR(50),
  project_code VARCHAR(50),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1,
  
  -- Constraints
  CONSTRAINT uq_invoice_line_number UNIQUE (invoice_id, line_number),
  CONSTRAINT chk_line_amount CHECK (line_amount_cents = quantity * unit_price_cents)
);

-- Indexes
CREATE INDEX idx_invoices_tenant_status ON ap.invoices(tenant_id, status);
CREATE INDEX idx_invoices_vendor ON ap.invoices(vendor_id);
CREATE INDEX idx_invoices_journal ON ap.invoices(journal_header_id) WHERE journal_header_id IS NOT NULL;
CREATE INDEX idx_invoice_lines_invoice ON ap.invoice_lines(invoice_id);
```

### 6.2 Posting Rules (Deterministic)

| Rule | Description | Enforcement |
|------|-------------|-------------|
| **Double-Entry** | `Dr Expense/Asset, Cr AP Payable` | GL Posting Engine |
| **Period Cutoff** | Posting blocked if period closed | K_TIME validation |
| **COA Validation** | Account codes must exist | K_COA validation |
| **Amount Balance** | `total_amount = sum(line_amounts) + tax` | Database constraint |

---

## 7. Ports & APIs (Hexagonal)

### 7.1 Inbound Ports (API Endpoints)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/ap/invoices` | Create invoice (draft) | `ap.invoice.create` |
| `GET` | `/api/ap/invoices` | List invoices (filtered) | `ap.invoice.read` |
| `GET` | `/api/ap/invoices/{id}` | Get invoice details | `ap.invoice.read` |
| `PUT` | `/api/ap/invoices/{id}` | Update invoice (draft only) | `ap.invoice.update` |
| `POST` | `/api/ap/invoices/{id}/submit` | Submit invoice (locks key fields) | `ap.invoice.submit` |
| `POST` | `/api/ap/invoices/{id}/void` | Void invoice (creates reversal) | `ap.invoice.void` |

### 7.2 Outbound Ports

| Port | Service | Purpose | Reliability |
|------|---------|---------|-------------|
| `InvoiceRepositoryPort` | SQL Adapter | Persist invoice data | Blocking |
| `VendorPort` | AP-01 | Validate vendor approved | Blocking |
| `GLPostingPort` | GL-03 | Post journal entries | **Blocking** |
| `FiscalTimePort` (K_TIME) | Kernel | Period cutoff validation | Blocking |
| `COAPort` (K_COA) | Kernel | Chart of Accounts validation | Blocking |
| `AuditPort` (K_LOG) | Kernel | Immutable audit trail | **Transactional** ⚠️ |
| `SequencePort` (K_SEQ) | Kernel | Invoice number generation | Blocking |

---

## 8. Controls & Evidence

### 8.1 Control Matrix (CONT_07 Format)

| Control ID | Assertion | Control | Evidence | Enforcement |
|:----------|:----------|:--------|:---------|:------------|
| **AP02-C01** | **Completeness** | Invoice must link to approved vendor | `chk_vendor_approved` constraint | **FK Constraint** |
| **AP02-C02** | **Cutoff** | Posting blocked if period closed | K_TIME validation before posting | **Blocking Validation** |
| **AP02-C03** | **Immutable Ledger** | No update/delete after posted | Database trigger prevents mutations | **DB Trigger** |
| **AP02-C04** | **Completeness** | Approved invoice always has GL journal reference | `journal_header_id` NOT NULL after posting | **FK Constraint** |
| **AP02-C05** | **Accuracy** | Duplicate invoice rule blocks second entry | `uq_invoice_vendor_number_date` constraint | **Unique Constraint** |
| **AP02-C06** | **Completeness** | All mutations emit audit events | `kernel.audit_events` coverage = 100% | **Transactional Audit** |
| **AP02-C07** | **Accuracy** | Amounts balance: total = subtotal + tax | `chk_amounts_balance` constraint | **DB Constraint** |

### 8.2 Evidence Artifacts

| Artifact | Location | Retention | Purpose |
|----------|----------|-----------|---------|
| **Invoice Record** | `ap.invoices` | 7 years | Source document |
| **Invoice Lines** | `ap.invoice_lines` | 7 years | Line-item detail |
| **Journal Entry** | `finance.journal_headers` + `finance.journal_lines` | 7 years | GL posting evidence |
| **Audit Events** | `kernel.audit_events` | 7 years | Compliance trail |

---

## 9. UI/UX (BioSkin Architecture)

### 9.1 Component Requirements (CONT_10)

| Component | Type | Schema-Driven? | Location |
|-----------|------|----------------|----------|
| **InvoiceForm** | `BioForm` | ✅ Yes | `apps/web/src/features/invoice/components/InvoiceForm.tsx` |
| **InvoiceTable** | `BioTable` | ✅ Yes | `apps/web/src/features/invoice/components/InvoiceTable.tsx` |
| **InvoiceDetail** | `BioObject` | ✅ Yes | `apps/web/src/features/invoice/components/InvoiceDetail.tsx` |
| **InvoiceLineForm** | `BioForm` | ✅ Yes | `apps/web/src/features/invoice/components/InvoiceLineForm.tsx` |

### 9.2 Schema Definition

```typescript
// packages/schemas/src/invoice.schema.ts
import { z } from 'zod';

export const InvoiceSchema = z.object({
  id: z.string().uuid().optional(),
  invoice_number: z.string().min(1).describe('Vendor invoice number'),
  invoice_date: z.date().describe('Invoice date'),
  due_date: z.date().describe('Payment due date'),
  vendor_id: z.string().uuid().describe('Vendor UUID'),
  subtotal_cents: z.number().int().positive().describe('Subtotal (cents)'),
  tax_amount_cents: z.number().int().nonnegative().default(0),
  total_amount_cents: z.number().int().positive().describe('Total amount (cents)'),
  currency: z.string().length(3).default('USD'),
  status: z.enum(['draft', 'submitted', 'matched', 'approved', 'posted', 'paid', 'closed', 'voided']).default('draft'),
  lines: z.array(InvoiceLineSchema).min(1),
});

export const InvoiceLineSchema = z.object({
  line_number: z.number().int().positive(),
  description: z.string().min(1),
  quantity: z.number().positive(),
  unit_price_cents: z.number().int().positive(),
  line_amount_cents: z.number().int().positive(),
  debit_account_code: z.string().min(1).describe('Expense/Asset account'),
  credit_account_code: z.string().default('2000').describe('AP Payable account'),
});

export type Invoice = z.infer<typeof InvoiceSchema>;
```

---

## 10. Acceptance Criteria

### 10.1 Functional Requirements

| ID | Requirement | Test |
|:---|:------------|:-----|
| **AC-01** | Approved invoice always has a GL journal reference | `journal_header_id` NOT NULL after posting |
| **AC-02** | Duplicate invoice rule blocks second entry | Unique constraint violation |
| **AC-03** | Audit events emitted for every mutation | Coverage = 100% |
| **AC-04** | Posting blocked if period closed | K_TIME validation fails |
| **AC-05** | Cannot update/delete posted invoice | Database trigger raises exception |
| **AC-06** | Invoice must link to approved vendor | FK constraint fails for non-approved vendor |
| **AC-07** | Amounts balance: total = subtotal + tax | Constraint violation if mismatch |

### 10.2 Non-Functional Requirements

| ID | Requirement | Target |
|:---|:------------|:------|
| **NFR-01** | API response time (p95) | < 300ms |
| **NFR-02** | GL posting latency | < 500ms |
| **NFR-03** | Duplicate detection performance | < 100ms |
| **NFR-04** | Test coverage | ≥ 90% |

---

## 11. Testing Requirements

### 11.1 Unit Tests

| Component | Test Coverage | Files |
|-----------|---------------|-------|
| `InvoiceService` | State transitions, validation | `__tests__/InvoiceService.test.ts` |
| `PostingService` | GL posting orchestration | `__tests__/PostingService.test.ts` |
| `DuplicateDetectionService` | Duplicate detection logic | `__tests__/DuplicateDetectionService.test.ts` |

### 11.2 Integration Tests

| Test | Description | File |
|------|-------------|------|
| **Period Cutoff** | Posting blocked for closed period | `__tests__/integration/PeriodCutoff.test.ts` |
| **Duplicate Detection** | Duplicate invoice blocked | `__tests__/integration/DuplicateDetection.test.ts` |
| **GL Posting** | Invoice posts to GL correctly | `__tests__/integration/GLPosting.test.ts` |
| **Immutability** | Posted invoice cannot be updated | `__tests__/integration/Immutability.test.ts` |
| **Vendor Validation** | Non-approved vendor blocked | `__tests__/integration/VendorValidation.test.ts` |

---

## 12. Implementation Optimization Notes

> **📌 Optimization Learnings from AP-01 Implementation**  
> Apply these optimizations during AP-02 implementation to avoid performance issues.

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
  FROM ap.invoices 
  WHERE ... 
  ORDER BY ... 
  LIMIT ... OFFSET ...
`);
const total = result.rows[0]?.total || 0;
```

**Impact:** 50% reduction in database round-trips, ~20-30ms faster.

#### ✅ **Composite Indexes for Common Filters**
Add composite indexes for frequently combined filters:
```sql
-- For status + vendor_id (common in invoice lists)
CREATE INDEX idx_invoices_tenant_status_vendor 
  ON ap.invoices(tenant_id, status, vendor_id);

-- For status + period (period-based queries)
CREATE INDEX idx_invoices_tenant_status_period 
  ON ap.invoices(tenant_id, status, period_id);
```

#### ✅ **Partial Indexes for Status Filters**
Add partial indexes for status-filtered queries:
```sql
-- For pending invoices (most common query)
CREATE INDEX idx_invoices_tenant_pending 
  ON ap.invoices(tenant_id, created_at DESC) 
  WHERE status = 'pending_approval';

-- For draft invoices (user's own drafts)
CREATE INDEX idx_invoices_tenant_drafts 
  ON ap.invoices(tenant_id, created_by, created_at DESC) 
  WHERE status = 'draft';
```

### 12.2 Error Handling Best Practices

#### ✅ **Use Domain-Specific Errors**
**Pattern:** Replace generic `Error` with domain-specific error classes.

**Before:**
```typescript
if (result.rows.length === 0) {
  throw new Error(`Invoice not found: ${id}`);
}
```

**After:**
```typescript
import { InvoiceNotFoundError } from './errors';

if (result.rows.length === 0) {
  throw new InvoiceNotFoundError(id);
}
```

**Impact:** Better API error messages, proper HTTP status codes (404 vs 500).

### 12.3 Search Query Optimization

#### ⚠️ **Full-Text Search for Large Datasets**
For invoice search (invoice number, vendor name, description), consider full-text search:

```sql
-- Add search vector column
ALTER TABLE ap.invoices ADD COLUMN search_vector tsvector 
  GENERATED ALWAYS AS (
    to_tsvector('english', 
      invoice_number || ' ' || 
      COALESCE(vendor_name, '') || ' ' || 
      COALESCE(description, '')
    )
  ) STORED;

CREATE INDEX idx_invoices_search_vector 
  ON ap.invoices USING gin(search_vector);

-- Query with full-text search
WHERE search_vector @@ plainto_tsquery('english', $1)
```

**Impact:** 10-100x faster search queries for large datasets.

### 12.4 Database Statistics

#### ✅ **Set Statistics Targets**
```sql
ALTER TABLE ap.invoices ALTER COLUMN tenant_id SET STATISTICS 1000;
ALTER TABLE ap.invoices ALTER COLUMN status SET STATISTICS 500;
ALTER TABLE ap.invoices ALTER COLUMN vendor_id SET STATISTICS 500;

ANALYZE ap.invoices;
```

**Impact:** Better query plan selection by PostgreSQL.

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
| **AP-01 PRD** | Vendor Master (upstream) | `apps/canon/finance/dom03-accounts-payable/cells/ap01-vendor-master/PRD-ap01-vendor-master.md` |
| **AP-03 PRD** | 3-Way Engine (downstream) | `apps/canon/finance/dom03-accounts-payable/cells/ap03-3way-engine/PRD-ap03-3way-engine.md` |
| **AP-04 PRD** | Invoice Approval (downstream) | `apps/canon/finance/dom03-accounts-payable/cells/ap04-invoice-submit-approval/PRD-ap04-invoice-submit-approval.md` |

---

**Status:** ✅ Ready for Implementation  
**Next Step:** Create service implementations following hexagonal architecture

---

**Last Updated:** 2025-12-16  
**Maintainer:** Finance Cell Team  
**Review Cycle:** Quarterly
