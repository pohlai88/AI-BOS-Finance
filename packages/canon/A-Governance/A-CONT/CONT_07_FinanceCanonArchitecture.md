> **🟢 [CERTIFIED]** — Enterprise Architecture Constitution  
> **Canon Code:** CONT_07  
> **Version:** 4.0.0 (Implementation Proven)  
> **Created:** 2025-12-16  
> **Updated:** 2025-12-17  
> **Plane:** A — Governance (Contract)  
> **Binding Scope:** AI-BOS Finance Canon — All Molecules and Cells  
> **Authority:** Financial Operations Architecture Standard  
> **Derives From:** CONT_00 (Constitution), AIS Theory (Romney & Steinbart), COSO Framework  
> **Compliance Alignment:** COSO, SOX/ICFR, SOC 1/2, ISO 27001, NIST SP 800-53, PCAOB AS 2201

---

# Finance Canon Architecture Standard v4.0.0

> **"The Auditable Financial Truth Engine"**  
> A Governance-First Financial Operations Engine designed for **ICFR-style scrutiny** and **audit readiness**.

---

## 0. Executive Summary

AI-BOS Finance Canon is the **auditable financial truth engine** for multi-entity organizations. It provides:

- **Deterministic posting** — Source document → Journal lines (predictable, reproducible)
- **Subledger reconciliation** — AP/AR tie to GL, GL ties to Bank
- **Period governance** — State machine: Open → Soft Close → Hard Close (with policy-gated Controlled Reopen)
- **Drilldown traceability** — Financial Statement → TB → Journal → Source Document → Evidence

**Core Rule:** Every Cell ships with **controls + evidence + drilldown** (not "logging theater").

### 0.1 Success Metrics (Non-Negotiable KPIs)

| Metric | Target | Measurement |
|:-------|:-------|:------------|
| **Unbalanced Journals** | 0 | Posting Engine constraint |
| **Drilldown Coverage** | 100% | Every statement line traces to source evidence |
| **Period Close Artifacts** | Complete | TB snapshot + lock events + checklist completion |
| **SoD Violations** | 0 | Maker ≠ Checker enforcement |
| **Audit Event Coverage** | 100% | Every mutation logged with who/what/when/why |

---

## 📋 Document Control

| Property | Value |
|----------|-------|
| **Canon Code** | CONT_07 |
| **Version** | 4.0.0 |
| **Status** | 🟢 CERTIFIED — IMPLEMENTATION PROVEN |
| **Classification** | Canon Architecture — Finance Domain |
| **Author** | AI-BOS Architecture Team |
| **Last Updated** | 2025-12-17 |
| **Supersedes** | CONT_07 v3.0.0 |
| **Quality Bar** | Fortune 500 / ICFR-Ready / Audit-Ready / Battle-Tested in Production |

### Version History

| Version | Date | Change |
|:--------|:-----|:-------|
| **4.0.0** | 2025-12-17 | **Implementation Proven:** Locked patterns from AP/AR production implementation (10 cells completed), Quality Gate Protocol (Two-Document Rule), Canvas/Lively Layer architecture standardized, Agent Parallelization Protocol added |
| **3.0.0** | 2025-12-16 | **Enterprise Certification:** 5 critical fixes (K_NOTIFY formalized, Period Close model, Audit reliability), 4 finishing appendices (Control Matrix, Event Taxonomy, Money Governance, Posting Invariants) |
| 2.1.1 | 2025-12-16 | Critical Fix: Immutable Ledger enforcement changed from `RULE` to `TRIGGER` with `RAISE EXCEPTION` |
| 2.1.0 | 2025-12-16 | Added Executive Summary, Success Metrics, Finance Nucleus (7 services), Cell Contract (8-point), Control Matrix |
| 2.0.0 | 2025-12-16 | Major revision: Full enterprise standard, Kernel contracts, Type governance, Intercompany |
| 1.0.0 | 2025-12-16 | Initial Finance Canon contract |

---

## 1. Purpose & Scope

### 1.1 Academic Foundation: The "Three Evidence Anchors"

To justify the decomposition into **Kernel**, **Molecules**, and **Cells**, we rely on three non-negotiable "Evidence Anchors" from Accounting Theory and Systems Design:

| Architectural Layer | Concept | Evidence / Reasoning |
|:--------------------|:--------|:---------------------|
| **Kernel** | **The Consistency Principle** | **GAAP/IFRS Requirement:** Accounting methods (currency, fiscal periods, COA) must be applied consistently over time. **Reasoning:** Centralizing these policies in the Kernel ensures no individual "Cell" can violate global accounting rules. |
| **Molecules** (Clusters) | **The Transaction Cycle** | **AIS Standard (Romney & Steinbart):** Business activities are grouped into cycles (Revenue, Expenditure, GL) because they share common data (vendors, customers) and risks. **Reasoning:** Grouping cells into Molecules (P2P, O2C) minimizes data coupling and keeps boundaries clean. |
| **Cells** (Atomic Units) | **Segregation of Duties (SoD)** | **COSO Internal Control Framework:** The authorization of a transaction (Payment Request) must be separate from the custody of assets (Payment Execution). **Reasoning:** Breaking processes into atomic "Cells" allows us to enforce strict permissions (e.g., User A can access the *Invoice Cell*, but only User B can access the *Payment Cell*). |

### 1.2 The "Canon" Definition

The **Finance Canon** is not a monolithic ERP. It is a **Federation of Cells** that:

1. Share a common **Kernel** (Time, Identity, Audit)
2. Speak a common **Language** (Debits, Credits, URNs)
3. Respect strict **Boundaries** (AP cannot touch AR tables)
4. Produce **Immutable Evidence** (every transaction is auditable)

### 1.3 Core Philosophy

> **"Observability First, Action Second."**  
> **"Protect. Correct. React."**

The Finance Canon is designed with these **non-negotiable principles**:

| Principle | Description | Enforcement |
|-----------|-------------|-------------|
| **Audit Trail is Mandatory** | Every financial transaction produces immutable evidence | `kernel.audit_events` — no exceptions |
| **Segregation of Duties** | No single user can both authorize and execute | Maker ≠ Checker — database constraint |
| **Period Cutoff is Absolute** | Closed periods reject all postings | Kernel Fiscal Calendar — blocking |
| **Double-Entry is Inviolable** | Sum(Debits) = Sum(Credits), always | Posting Engine — database trigger |
| **Money is Not a Float** | Financial amounts use BigInt/Decimal | Type system — compile-time safety |

### 1.4 Target Audience & Accountability

| Role | Accountability | AIS Concern |
|:-----|:---------------|:------------|
| **Architect** | System Integrity | **Coupling:** Ensure Cells are loosely coupled but highly cohesive |
| **CFO** | Financial Control | **Internal Controls:** Ensure SoD is architecturally impossible to bypass |
| **Auditor** | Evidence | **Traceability:** From Financial Statement → TB → Journal → Source Doc |
| **Controller** | Accuracy | **Cutoff:** Transactions in correct period, correct classification |
| **Engineer** | Implementation | **Type Safety:** Money is not a `number`; it is a `Decimal` with Currency |

---

## 2. The Finance Kernel (The "Laws of Physics")

> **Role:** The immutable rules engine. If the Kernel says "Period Closed," no Cell can post.

### 2.1 Finance Nucleus Services (Cross-Cutting Concerns)

These **8 services** are mandatory and reused across all Finance Molecules:

| # | Service | Symbol | AIS Justification | API Endpoint | Reliability |
|:--|:--------|:-------|:------------------|:-------------|:------------|
| 1 | **Fiscal Calendar & Period Control** | `K_TIME` | **Periodicity Assumption:** Open/close windows, controlled reopen | `GET /kernel/fiscal/status` | **Blocking** |
| 2 | **COA Governor** | `K_COA` | **Classification Assertion:** Prevents "Unknown Account" errors | `GET /kernel/coa/validate` | **Blocking** |
| 3 | **Multi-Currency Engine** | `K_FX` | **IAS 21:** Rates, effective dating, revaluation | `GET /kernel/fx/rate` | **Blocking** |
| 4 | **Audit Trail** | `K_LOG` | **Completeness Assertion:** Immutable evidence trail | `POST /kernel/audit/emit` | **Transactional** ⚠️ |
| 5 | **Identity & Authorization** | `K_AUTH` | **Authorization Control:** JWT, RBAC, SoD enforcement | `GET /kernel/auth/verify` | **Blocking** |
| 6 | **Finance Policy Engine** | `K_POLICY` | **Approval Rules:** Tolerances, limits, lock rules | `GET /kernel/policy/evaluate` | **Blocking** |
| 7 | **Document Numbering** | `K_SEQ` | **Completeness:** Per entity/series, gap detection | `POST /kernel/sequence/next` | **Blocking** |
| 8 | **Domain Event Bus** | `K_NOTIFY` | **Integration:** Cross-cell coordination, downstream triggers | `POST /kernel/events/publish` | **Async (Outbox)** |

#### 2.1.1 Service Reliability Model

| Reliability | Meaning | Failure Mode | Use Cases |
|:------------|:--------|:-------------|:----------|
| **Blocking** | Call must succeed before business transaction commits | Reject transaction if service unavailable | K_TIME, K_COA, K_AUTH, K_FX, K_POLICY, K_SEQ |
| **Transactional** | Audit record must be committed **atomically** with business transaction | Same DB transaction (or fail entire operation) | K_LOG |
| **Async (Outbox)** | Guaranteed delivery via outbox pattern; eventual consistency OK | Retry with exponential backoff | K_NOTIFY |

> **⚠️ Critical:** `K_LOG` (Audit Trail) is **NOT** fire-and-forget. Audit events **MUST** be committed in the same database transaction as the business event. This ensures audit completeness even if the application crashes immediately after the business commit.

### 2.2 Kernel vs. Finance Canon Boundary

| Kernel Owns (Control Plane) | Finance Canon Owns (Domain Plane) |
|:----------------------------|:----------------------------------|
| Identity, tenant, auth primitives | Posting rules & deterministic posting engine |
| Policy enforcement primitives | Fiscal/period controls (locks, reopen governance) |
| Global telemetry + correlation IDs | Finance workflows (approvals, maker-checker) |
| Baseline audit envelope | Reconciliation & tie-out rules |
| — | Finance drilldown graph + reporting |

### 2.2 Kernel Interaction Model

```
┌─────────────────────────────────────────────────────────────────┐
│                         KERNEL (The Law)                         │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ K_TIME       │  │ K_COA        │  │ K_LOG        │           │
│  │ Fiscal Clock │  │ COA Registry │  │ Audit Logger │           │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘           │
│         │                 │                 │                    │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌──────┴───────┐           │
│  │ K_FX         │  │ K_AUTH       │  │ K_NOTIFY     │           │
│  │ FX Rates     │  │ Identity     │  │ Events       │           │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘           │
│         │                 │                 │                    │
├─────────┼─────────────────┼─────────────────┼────────────────────┤
│         ▼                 ▼                 ▼                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   ANY FINANCE CELL                        │   │
│  │                                                           │   │
│  │  Step 1: Check Period Open?       (K_TIME — Blocking)     │   │
│  │  Step 2: Validate Account?        (K_COA — Blocking)      │   │
│  │  Step 3: Check Permissions?       (K_AUTH — Blocking)     │   │
│  │  Step 4: Execute Business Logic   (Domain)                │   │
│  │  Step 5: Emit Audit Event         (K_LOG — TRANSACTIONAL) │   │
│  │  Step 6: COMMIT Transaction       (Atomic: Business+Audit)│   │
│  │  Step 7: Publish Domain Event     (K_NOTIFY — Async/Outbox│   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Kernel Service Contracts

```typescript
// K_TIME: Fiscal Calendar Service
interface FiscalCalendarPort {
  // Check if a date falls in an open period
  isPeriodOpen(tenantId: string, date: Date): Promise<PeriodStatus>;
  
  // Get current fiscal context
  getFiscalContext(tenantId: string): Promise<FiscalContext>;
  
  // Lock a period (admin only)
  closePeriod(tenantId: string, periodId: string): Promise<void>;
}

interface PeriodStatus {
  period_id: string;
  period_name: string;      // 'FY2025-P12'
  is_open: boolean;
  close_date?: Date;
  can_post: boolean;        // Final determination
  reason?: string;          // If blocked, why?
}

// K_COA: Chart of Accounts Governor
interface COAGovernorPort {
  // Validate account exists and is postable
  validateAccount(tenantId: string, accountCode: string): Promise<AccountValidation>;
  
  // Get account metadata for GL posting
  getAccountMeta(tenantId: string, accountCode: string): Promise<AccountMeta>;
}

interface AccountValidation {
  valid: boolean;
  account_id?: string;
  account_type?: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  is_postable: boolean;
  error?: string;
}

// K_LOG: Audit Trail Service (TRANSACTIONAL — NOT fire-and-forget)
interface AuditTrailPort {
  /**
   * Emit an audit event WITHIN THE SAME DB TRANSACTION as the business event.
   * 
   * ⚠️ CRITICAL: Audit is NOT optional. If audit insert fails, the entire
   * business transaction MUST roll back. This ensures audit completeness.
   * 
   * Implementation: Use the same Postgres transaction context as the caller.
   */
  emitTransactional(event: AuditEvent, txContext: TransactionContext): Promise<void>;
  
  // Query audit trail (for compliance)
  query(filter: AuditQuery): Promise<AuditEvent[]>;
}

interface TransactionContext {
  tx: PostgresTransaction;  // The active Postgres transaction
  correlation_id: string;   // Request trace ID
}

interface AuditEvent {
  event_type: string;           // 'payment.created', 'payment.approved'
  actor_id: string;             // User who performed action
  tenant_id: string;
  target_type: string;          // 'payment', 'invoice', 'journal'
  target_id: string;
  action: 'create' | 'update' | 'delete' | 'approve' | 'reject';
  payload: Record<string, unknown>;  // Before/After state
  correlation_id: string;       // Request trace ID
  ip_address?: string;
  user_agent?: string;
  timestamp: Date;
}
```

---

## 3. Molecule Decomposition (The "Organs")

We decompose the domain into **4 Molecules** based on the standard **AIS Transaction Cycles**.

### 3.1 Overview Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     FINANCE CANON                                │
│                   (Bounded Context)                              │
│                                                                  │
│         ┌─────────────────────────────────────────────┐         │
│         │          GENERAL LEDGER (R2R)               │         │
│         │         "The Source of Truth"               │         │
│         │                                             │         │
│         │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │         │
│         │  │GL-01│ │GL-02│ │GL-03│ │GL-04│ │GL-05│  │         │
│         │  │ COA │ │ JE  │ │Post │ │Close│ │ TB  │  │         │
│         │  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘  │         │
│         └───────────────────────▲───────────────────┘         │
│                                 │                               │
│              ┌──────────────────┼──────────────────┐            │
│              │                  │                  │            │
│   ┌──────────┴─────────┐ ┌──────┴──────┐ ┌────────┴────────┐   │
│   │  ACCOUNTS PAYABLE  │ │  ACCOUNTS   │ │    TREASURY     │   │
│   │  (P2P - Cash Out)  │ │ RECEIVABLE  │ │ (Cash Mgmt)     │   │
│   │                    │ │ (O2C - In)  │ │                 │   │
│   │ ┌────┐┌────┐┌────┐ │ │ ┌────┐┌────┐│ │ ┌────┐┌────┐   │   │
│   │ │AP01││AP02││AP05│ │ │ │AR01││AR02││ │ │TR01││TR05│   │   │
│   │ │Vend││Inv ││Pay │ │ │ │Cust││Sale││ │ │Bank││Reco│   │   │
│   │ └────┘└────┘└────┘ │ │ └────┘└────┘│ │ └────┘└────┘   │   │
│   └────────────────────┘ └─────────────┘ └─────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

    ═══════════════════════════════════════════════════════════
                         DATA FLOW LEGEND
    ═══════════════════════════════════════════════════════════
    
    AP Invoice → AP Payment → GL Posting (Dr Expense, Cr Cash)
    AR Invoice → AR Receipt  → GL Posting (Dr Cash, Cr Revenue)
    Bank Stmt  → Reconciliation → GL Adjustments
```

---

### 3.2 Molecule: General Ledger (R2R — Record to Report)

> **Objective:** The "Source of Truth" for financial position.  
> **AIS Cycle:** General Ledger & Reporting System.

#### 3.2.1 Cell Inventory

| Cell | Code | Purpose | AIS Justification | Status |
|:-----|:-----|:--------|:------------------|:-------|
| **Chart of Accounts** | GL-01 | Master definition of financial dimensions | **Classification Assertion:** Enforces consistent categorization | ⬜ Planned |
| **Journal Entry** | GL-02 | Manual interface for adjusting entries | **The Journalizing Process:** Fundamental mechanism of double-entry | ⬜ Planned |
| **Posting Engine** | GL-03 | The **ONLY** writer to `ledger_lines` | **Processing Integrity:** Gatekeeper ensuring balanced entries | ⬜ Planned |
| **Period Close** | GL-04 | Lock mechanism for fiscal integrity | **Cutoff Assertion:** Technical enforcement of period boundaries | ⬜ Planned |
| **Trial Balance** | GL-05 | Proof of ledger accuracy | **Mathematical Accuracy:** Prerequisite for financial statements | ⬜ Planned |

#### 3.2.2 GL Non-Negotiables

| Rule | Enforcement | Consequence |
|:-----|:------------|:------------|
| **GL entries are IMMUTABLE** | `TRIGGER` on `DELETE/UPDATE` | Raise exception |
| **Period Close follows State Machine** | See Period Governance Model below | Policy-gated transitions |
| **Balanced entries required** | Trigger: `SUM(debit) = SUM(credit)` | Reject unbalanced |
| **Source document required** | FK to `source_document_id` | Cannot post orphan entries |

#### 3.2.3 Period Governance Model (Authoritative Definition)

> **Policy:** Periods follow a one-way state machine with a **controlled exception path** for reopening.

```
                    ┌──────────────────────────────────────────────┐
                    │         PERIOD STATE MACHINE                  │
                    │                                              │
                    │   OPEN ────► SOFT_CLOSE ────► HARD_CLOSE     │
                    │     │            │                │          │
                    │     │            │                │          │
                    │     └──── Normal Posting ────────┘          │
                    │                  │                           │
                    │                  │ (EXCEPTION PATH)          │
                    │                  ▼                           │
                    │            CONTROLLED_REOPEN                 │
                    │            (Policy-Gated)                    │
                    └──────────────────────────────────────────────┘
```

| State | Posting Allowed? | Transition Rules | Evidence Required |
|:------|:-----------------|:-----------------|:------------------|
| **OPEN** | ✅ Yes | → SOFT_CLOSE (Controller initiates) | None |
| **SOFT_CLOSE** | ⚠️ Adjusting entries only | → HARD_CLOSE (Controller + CFO approval) | TB Snapshot, Checklist |
| **HARD_CLOSE** | ❌ No | → CONTROLLED_REOPEN (CFO + Auditor approval, reason required) | Reopen Request |
| **CONTROLLED_REOPEN** | ⚠️ Correction entries only | → HARD_CLOSE (automatic after correction) | Correction JE, Reclose Checklist |

**Key Distinction:**
- **"Period Close is irreversible"** = You cannot undo the close event (audit trail preserved)
- **"Controlled Reopen"** = You can *transition* to a temporary reopen state for corrections (but the close event is never deleted)

**Evidence Artifacts per Transition:**

| Transition | Required Evidence | Retention |
|:-----------|:------------------|:----------|
| OPEN → SOFT_CLOSE | Preliminary TB, Outstanding items list | 7 years |
| SOFT_CLOSE → HARD_CLOSE | Final TB snapshot (hash), Close checklist (signed), Reconciliation evidence | 7 years |
| HARD_CLOSE → CONTROLLED_REOPEN | Reopen request (business justification), CFO approval, Auditor notification | 7 years |
| CONTROLLED_REOPEN → HARD_CLOSE | Correction JE references, Updated TB snapshot, Re-close checklist | 7 years |

#### 3.2.3 GL Posting Engine Contract

```typescript
interface GLPostingPort {
  // Post a journal entry (atomic transaction)
  post(entry: JournalEntry): Promise<PostingResult>;
  
  // Validate before posting (dry run)
  validate(entry: JournalEntry): Promise<ValidationResult>;
  
  // Reverse a posted entry (creates reversal + new entry)
  reverse(entryId: string, reason: string): Promise<ReversalResult>;
}

interface JournalEntry {
  tenant_id: string;
  company_id: string;
  entry_date: Date;
  reference: string;              // 'AP-INV-2024-001'
  description: string;
  source_type: 'payment' | 'invoice' | 'manual' | 'revaluation';
  source_id: string;              // UUID of source document
  lines: JournalLine[];
  posted_by: string;
  correlation_id: string;
}

interface JournalLine {
  account_code: string;           // '1000' (Cash)
  debit_amount?: MoneyAmount;
  credit_amount?: MoneyAmount;
  cost_center?: string;
  department?: string;
  project?: string;
  memo?: string;
}

interface MoneyAmount {
  amount: string;                 // '10000.00' (String, not float!)
  currency: string;               // 'USD' (ISO 4217)
}
```

---

### 3.3 Molecule: Accounts Payable (P2P — Procure to Pay)

> **Objective:** Control cash outflows.  
> **AIS Cycle:** Expenditure Cycle.  
> **Risk Profile:** HIGH — Fraud exposure (fake vendors, duplicate payments).

#### 3.3.1 Cell Inventory

| Cell | Code | Purpose | AIS Justification | Status | Contract |
|:-----|:-----|:--------|:------------------|:-------|:---------|
| **Vendor Master** | AP-01 | Management of payee data | **Anti-Fraud Control:** Separation from invoice processing | ⬜ Planned | — |
| **Supplier Invoice** | AP-02 | Recognition of liability | **Accrual Basis:** Record when incurred, not when paid | ⬜ Planned | — |
| **3-Way Match** | AP-03 | PO ↔ GRN ↔ Invoice | **Validity Assertion:** Prevent payment for undelivered goods | ⬜ Planned | — |
| **Invoice Approval** | AP-04 | Multi-level authorization | **Authorization Control:** Amount-based escalation | ⬜ Planned | — |
| **Payment Execution** | AP-05 | Cash-out event | **Custody of Assets:** Maker-Checker for cash movements | 🟡 MVP | **CONT_04** |
| **AP Aging** | AP-06 | Liability tracking | **Valuation Assertion:** Accurate liability recognition | ⬜ Planned | — |

#### 3.3.2 AP Non-Negotiables

| Rule | Enforcement | COSO Mapping |
|:-----|:------------|:-------------|
| **Maker ≠ Checker** | `approver_id !== created_by` (DB constraint) | Authorization vs Execution |
| **Payment to unapproved vendor FORBIDDEN** | FK to `vendors` where `status = 'approved'` | Master Data Control |
| **Every payment links to invoice** | FK to `invoices` (non-nullable) | Completeness Assertion |
| **Every payment produces GL entry** | Posting Engine call (sync, blocking) | Double-Entry Requirement |

#### 3.3.3 AP Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                 ACCOUNTS PAYABLE FLOW                            │
│                                                                  │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐       │
│  │ AP-01   │    │ AP-02   │    │ AP-04   │    │ AP-05   │       │
│  │ Vendor  │───►│ Invoice │───►│ Approve │───►│ Payment │       │
│  │ Master  │    │ Entry   │    │ Workflow│    │ Execute │       │
│  └─────────┘    └────┬────┘    └─────────┘    └────┬────┘       │
│                      │                              │            │
│                      ▼                              ▼            │
│              ┌───────────────────────────────────────────┐       │
│              │              GL-03: POSTING ENGINE         │       │
│              │                                            │       │
│              │  Invoice:  Dr Expense    Cr AP Payable    │       │
│              │  Payment:  Dr AP Payable Cr Cash          │       │
│              └───────────────────────────────────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Governing Cell Contract:** [CONT_04_PaymentHubArchitecture.md](./CONT_04_PaymentHubArchitecture.md)

---

### 3.4 Molecule: Accounts Receivable (O2C — Order to Cash)

> **Objective:** Recognize revenue and collect cash.  
> **AIS Cycle:** Revenue Cycle.  
> **Risk Profile:** MEDIUM — Revenue leakage, bad debt exposure.

#### 3.4.1 Cell Inventory

| Cell | Code | Purpose | AIS Justification | Status |
|:-----|:-----|:--------|:------------------|:-------|
| **Customer Master** | AR-01 | Management of payer data | **Anti-Kickback Control:** Separate from invoicing | ⬜ Planned |
| **Sales Invoice** | AR-02 | Revenue recognition trigger | **IFRS 15 Compliance:** Performance obligation basis | ⬜ Planned |
| **Receipt Allocation** | AR-03 | Matching cash-in to invoices | **Completeness Assertion:** All receipts applied | ⬜ Planned |
| **Credit Note** | AR-04 | Returns & allowances | **Distinct Approval:** Prevent revenue manipulation | ⬜ Planned |
| **AR Aging** | AR-05 | Bad debt estimation | **Valuation Assertion:** Accurate receivables | ⬜ Planned |

#### 3.4.2 AR Non-Negotiables

| Rule | Enforcement | IFRS/GAAP Mapping |
|:-----|:------------|:------------------|
| **Revenue after performance obligation** | Business rule validation | IFRS 15 / ASC 606 |
| **Credit notes require separate approval** | Different permission: `ar.credit.approve` | Authorization Control |
| **Every invoice links to customer** | FK to `customers` (non-nullable) | Completeness Assertion |
| **Every receipt produces GL entry** | Posting Engine call (sync) | Double-Entry Requirement |

---

### 3.5 Molecule: Treasury (Cash Management)

> **Objective:** Optimize liquidity and manage risk.  
> **AIS Cycle:** Treasury & Cash Management.  
> **Risk Profile:** HIGH — Unauthorized fund movements.

#### 3.5.1 Cell Inventory

| Cell | Code | Purpose | AIS Justification | Status |
|:-----|:-----|:--------|:------------------|:-------|
| **Bank Master** | TR-01 | Registry of authorized bank accounts | **Asset Control:** Only approved banks for cash | ⬜ Planned |
| **Cash Pooling** | TR-02 | Intercompany sweep/fund logic | **Liquidity Optimization:** Centralized cash concentration | ⬜ Planned |
| **FX Hedging** | TR-03 | Forward contracts, hedging | **IAS 39/IFRS 9:** Currency risk management | ⬜ Planned |
| **Intercompany Settlement** | TR-04 | IC balance netting | **Elimination Control:** Consolidation accuracy | ⬜ Planned |
| **Bank Reconciliation** | TR-05 | GL ↔ Bank tie-out | **Existence Assertion:** Bank = GL | ⬜ Planned |

#### 3.5.2 Treasury Non-Negotiables

| Rule | Enforcement | Justification |
|:-----|:------------|:--------------|
| **Cash movements require bank confirmation** | Async reconciliation process | Existence Assertion |
| **IC balances must net to zero** | Validation trigger on close | Elimination Accuracy |
| **Every cash movement produces audit trail** | K_LOG emit (async) | Evidence Requirement |
| **FX gains/losses recognized per IAS 21** | Revaluation engine | Standard Compliance |

---

## 4. Cell Architecture Standard (The "Atoms")

Every Cell in the Finance Canon **MUST** adhere to the **Hexagonal Architecture** pattern to ensure testability and interchangeability.

### 4.1 The Standard Cell Shape

```
┌─────────────────────────────────────────────────────────────────┐
│                       STANDARD FINANCE CELL                      │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                      DOMAIN LAYER                           ││
│  │            (Pure Logic / Zod Schemas / Types)               ││
│  │                                                             ││
│  │  Rules:                                                     ││
│  │  ┌─────────────────────────────────────────────────────┐   ││
│  │  │ ❌ No DB imports (no Drizzle, no Prisma)            │   ││
│  │  │ ❌ No HTTP imports (no fetch, no axios)             │   ││
│  │  │ ❌ No Money as Float (use BigInt/Decimal)           │   ││
│  │  │ ✅ Pure functions only                               │   ││
│  │  │ ✅ Zod schemas for validation                        │   ││
│  │  │ ✅ Type-safe domain events                           │   ││
│  │  └─────────────────────────────────────────────────────┘   ││
│  │                                                             ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      ││
│  │  │   Entity     │  │ Value Object │  │Domain Service│      ││
│  │  │              │  │              │  │              │      ││
│  │  │ e.g. Payment │  │ e.g. Money   │  │e.g. Approval │      ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘      ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│  ┌───────────────────────────┼───────────────────────────┐      │
│  │                     PORTS LAYER                        │      │
│  │           (Interfaces / Abstract Classes)              │      │
│  │                                                        │      │
│  │  INBOUND (Driving)             OUTBOUND (Driven)       │      │
│  │  ┌──────────────┐              ┌──────────────┐        │      │
│  │  │ PaymentAPI   │              │ RepoPort     │        │      │
│  │  │              │              │ AuditPort    │        │      │
│  │  │ POST /create │              │ GLPostPort   │        │      │
│  │  │ POST /approve│              │ FXRatePort   │        │      │
│  │  │ GET /list    │              │ NotifyPort   │        │      │
│  │  └──────────────┘              └──────────────┘        │      │
│  └────────────────────────────────────────────────────────┘      │
│                              │                                   │
│  ┌───────────────────────────┼───────────────────────────┐      │
│  │                    ADAPTERS LAYER                      │      │
│  │              (Concrete Implementations)                │      │
│  │                                                        │      │
│  │  INBOUND                       OUTBOUND                │      │
│  │  ┌──────────────┐              ┌──────────────┐        │      │
│  │  │ Hono Router  │              │ PostgresRepo │        │      │
│  │  │ Next.js API  │              │ KernelAudit  │        │      │
│  │  │ gRPC Handler │              │ GLCellClient │        │      │
│  │  └──────────────┘              │ MockFXRate   │        │      │
│  │                                └──────────────┘        │      │
│  └────────────────────────────────────────────────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Mandatory Cell Interfaces

Every Cell **MUST** expose these standard operational endpoints:

| Method | Endpoint | Purpose | Response |
|:-------|:---------|:--------|:---------|
| `GET` | `/health` | **Liveness:** Is the cell running? | `{"status": "healthy"}` |
| `GET` | `/ready` | **Readiness:** Can it connect to DB and Kernel? | `{"ready": true, "dependencies": {...}}` |
| `GET` | `/metrics` | **Observability:** Prometheus metrics | `payment_count{status="approved"} 42` |
| `GET` | `/schema` | **Discovery:** OpenAPI/Swagger definition | OpenAPI 3.0 JSON |

### 4.3 Cell Health Model

```typescript
interface CellHealth {
  service: string;                    // 'cell-payment-hub'
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;                    // '1.0.0'
  uptime_seconds: number;
  
  // Internal components (in-process)
  components: {
    database: ComponentStatus;
    processor: ComponentStatus;
    validator: ComponentStatus;
  };
  
  // External dependencies (other services)
  dependencies: {
    kernel: DependencyStatus;
    fx_provider: DependencyStatus;
    bank_gateway: DependencyStatus;
    gl_cell: DependencyStatus;
  };
  
  // Last check timestamp
  checked_at: Date;
}

type ComponentStatus = 'healthy' | 'degraded' | 'unhealthy';
type DependencyStatus = 'available' | 'degraded' | 'unavailable';
```

### 4.4 Cell Dependency Classification

| Category | What It Means | Examples | Failure Mode |
|:---------|:--------------|:---------|:-------------|
| **Internal** | Owned by this Cell, in-process | Domain logic, validation, state machine | Cell restart |
| **External (Reliance)** | Other Cells/Services we call | FX Cell, GL Cell, Bank API | 503 + retry |
| **Output (Dependent)** | Who depends on our output | Reporting Cell, Dashboard, Alerts | Async notification |

### 4.5 The Cell Contract (Non-Negotiable Quality Bar)

Every Cell **MUST** ship with these 8 mandatory components:

| # | Component | Description | Artifact |
|:--|:----------|:------------|:---------|
| 1 | **Purpose & Business Outcome** | What problem does this Cell solve? | README.md |
| 2 | **Inputs/Outputs + Ledger Impact** | What data flows in/out? What GL entries? | API spec + posting rules |
| 3 | **Posting Model** | Accounts + dimensions + currency rules | Posting template |
| 4 | **Controls** | Maker/checker, limits, approvals, SoD | Control matrix |
| 5 | **Evidence Artifacts & Retention** | What audit evidence? How long kept? | Evidence catalog |
| 6 | **Dependencies** | Master data + upstream/downstream cells | Dependency diagram |
| 7 | **API Contract** | BFF validation + canonical DTOs | OpenAPI spec |
| 8 | **Test Suite** | Unit + integration + **control tests** | Test coverage report |

**Control Tests** are mandatory — they verify that controls work as designed:
- SoD enforcement (Maker ≠ Checker)
- Period lock enforcement
- Amount limit enforcement
- Audit event emission

---

## 5. Data Architecture & Governance

### 5.1 The "Immutable Ledger" Rule

> **Law:** `DELETE` and `UPDATE` are **FORBIDDEN** on financial transaction tables once posted.

| Rule | Implementation | Consequence |
|:-----|:---------------|:------------|
| **No DELETE** | PostgreSQL `TRIGGER` raises exception | Transaction fails with error |
| **No UPDATE** | PostgreSQL `TRIGGER` raises exception | Transaction fails with error |
| **Correction Method** | Post **Reversal Entry** (net zero) + **Correct Entry** | Audit trail preserved |

**⚠️ Critical Implementation Note:**

Do NOT use `DO INSTEAD NOTHING` rules — they silently ignore the operation and return success. The application must receive an explicit error (HTTP 500/409) to prevent data integrity confusion.

```sql
-- ═══════════════════════════════════════════════════════════════════
-- IMMUTABLE LEDGER ENFORCEMENT (Correct Implementation)
-- ═══════════════════════════════════════════════════════════════════

-- 1. Create a function to raise the error (loud failure)
CREATE OR REPLACE FUNCTION finance.prevent_modification() 
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Finance Ledger is Immutable: DELETE/UPDATE forbidden on %', TG_TABLE_NAME
        USING HINT = 'To correct an error, post a Reversal Entry followed by a Correct Entry.',
              ERRCODE = 'restrict_violation';
END;
$$ LANGUAGE plpgsql;

-- 2. Apply as BEFORE TRIGGER on journal_lines (the immutable table)
CREATE TRIGGER trg_immutable_journal_lines
BEFORE DELETE OR UPDATE ON finance.journal_lines
FOR EACH ROW EXECUTE FUNCTION finance.prevent_modification();

-- 3. Apply to journal_headers (also immutable once posted)
CREATE TRIGGER trg_immutable_journal_headers
BEFORE DELETE OR UPDATE ON finance.journal_headers
FOR EACH ROW 
WHEN (OLD.status = 'posted')  -- Only protect posted entries
EXECUTE FUNCTION finance.prevent_modification();

-- 4. Apply to audit_events (always immutable)
CREATE TRIGGER trg_immutable_audit_events
BEFORE DELETE OR UPDATE ON kernel.audit_events
FOR EACH ROW EXECUTE FUNCTION finance.prevent_modification();
```

**Why TRIGGER over RULE:**
- `RULE` with `DO INSTEAD NOTHING` = Silent success (dangerous)
- `TRIGGER` with `RAISE EXCEPTION` = Loud failure (correct)

### 5.2 Schema Segregation

To enforce **Bounded Contexts**, data is isolated at the schema level:

```sql
-- ═══════════════════════════════════════════════════════════════════
-- KERNEL SCHEMA (Cross-Cutting Concerns)
-- ═══════════════════════════════════════════════════════════════════
CREATE SCHEMA kernel;

CREATE TABLE kernel.tenants (...);
CREATE TABLE kernel.users (...);
CREATE TABLE kernel.roles (...);
CREATE TABLE kernel.audit_events (...);          -- Immutable
CREATE TABLE kernel.fiscal_calendar (...);

-- ═══════════════════════════════════════════════════════════════════
-- FINANCE SCHEMA (GL Core)
-- ═══════════════════════════════════════════════════════════════════
CREATE SCHEMA finance;

CREATE TABLE finance.companies (...);
CREATE TABLE finance.chart_of_accounts (...);
CREATE TABLE finance.journal_headers (...);       -- The "Truth"
CREATE TABLE finance.journal_lines (...);         -- Immutable Details
CREATE TABLE finance.fiscal_periods (...);

-- ═══════════════════════════════════════════════════════════════════
-- AP SCHEMA (Accounts Payable)
-- ═══════════════════════════════════════════════════════════════════
CREATE SCHEMA ap;

CREATE TABLE ap.vendors (...);
CREATE TABLE ap.invoices (...);                   -- Links to journal_headers
CREATE TABLE ap.payments (...);                   -- Links to journal_headers
CREATE TABLE ap.payment_approvals (...);

-- ═══════════════════════════════════════════════════════════════════
-- AR SCHEMA (Accounts Receivable)
-- ═══════════════════════════════════════════════════════════════════
CREATE SCHEMA ar;

CREATE TABLE ar.customers (...);
CREATE TABLE ar.invoices (...);                   -- Links to journal_headers
CREATE TABLE ar.receipts (...);
```

### 5.3 Type Governance (Zod Schemas)

Financial primitives **MUST** be standardized in `@ai-bos/shared`:

```typescript
import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════
// THE SINGLE SOURCE OF TRUTH FOR MONEY
// ═══════════════════════════════════════════════════════════════════
export const MoneySchema = z.object({
  // String to prevent floating-point errors (0.1 + 0.2 !== 0.3)
  amount: z.string().regex(/^-?\d+(\.\d{1,4})?$/, 'Invalid money format'),
  currency: z.string().length(3),  // ISO 4217 (USD, SGD, EUR)
});

export type Money = z.infer<typeof MoneySchema>;

// Helper to create Money (compile-time safety)
export function money(amount: string, currency: string): Money {
  return MoneySchema.parse({ amount, currency });
}

// ═══════════════════════════════════════════════════════════════════
// AUDIT CONTEXT (Required for every mutation)
// ═══════════════════════════════════════════════════════════════════
export const ActorContextSchema = z.object({
  user_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  session_id: z.string().uuid(),
  roles: z.array(z.string()),
  ip_address: z.string().ip().optional(),
  correlation_id: z.string().uuid(),
});

export type ActorContext = z.infer<typeof ActorContextSchema>;

// ═══════════════════════════════════════════════════════════════════
// FINANCIAL ENTITY IDENTIFIERS
// ═══════════════════════════════════════════════════════════════════
export const FinanceURNSchema = z.string().regex(
  /^urn:aibos:finance:(payment|invoice|journal|vendor|customer):[a-f0-9-]{36}$/,
  'Invalid Finance URN'
);

// Example: urn:aibos:finance:payment:550e8400-e29b-41d4-a716-446655440000
```

---

## 6. Multi-Entity & Intercompany

### 6.1 Tenant vs. Entity (Company)

| Concept | Definition | Example | Database |
|:--------|:-----------|:--------|:---------|
| **Tenant** | Highest-level container (corporate group) | "Acme Holdings Ltd" | `kernel.tenants` |
| **Entity (Company)** | Legal entity with Tax ID, Base Currency | "Acme Singapore Pte Ltd" | `finance.companies` |

```
┌─────────────────────────────────────────────────────────────────┐
│                    TENANT: "Acme Holdings Ltd"                    │
│                                                                  │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│   │   COMPANY A     │  │   COMPANY B     │  │   COMPANY C     │ │
│   │   (OpCo SG)     │  │   (OpCo MY)     │  │   (Treasury)    │ │
│   │                 │  │                 │  │                 │ │
│   │ Base: SGD       │  │ Base: MYR       │  │ Base: USD       │ │
│   │ Tax ID: SG-123  │  │ Tax ID: MY-456  │  │ Tax ID: US-789  │ │
│   │ CoA: SG-GAAP    │  │ CoA: MY-GAAP    │  │ CoA: Group      │ │
│   └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
│            │                    │                    │          │
│            └────────────────────┼────────────────────┘          │
│                                 │                               │
│                    ┌────────────┴────────────┐                  │
│                    │  INTERCOMPANY LEDGER     │                  │
│                    │  (Elimination on Close)  │                  │
│                    └─────────────────────────┘                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Intercompany Architecture

When **Entity A** pays for **Entity B**, the system **automatically** generates balanced entries:

```
Scenario: Entity A (Singapore) pays $10,000 expense on behalf of Entity B (Malaysia)

═══════════════════════════════════════════════════════════════════
ENTITY A BOOKS (Payer)
═══════════════════════════════════════════════════════════════════
Dr: Intercompany Receivable (from B)  SGD 10,000
Cr: Cash                               SGD 10,000

═══════════════════════════════════════════════════════════════════
ENTITY B BOOKS (Beneficiary)
═══════════════════════════════════════════════════════════════════
Dr: Expense                            MYR 33,000 (@ 3.3 FX rate)
Cr: Intercompany Payable (to A)        MYR 33,000

═══════════════════════════════════════════════════════════════════
CONSOLIDATION (On Period Close)
═══════════════════════════════════════════════════════════════════
IC Receivable (A) ← nets to zero → IC Payable (B)
```

### 6.3 Intercompany Settlement Types

| Type | Description | Frequency |
|:-----|:------------|:----------|
| **Real-Time** | Each IC transaction creates immediate booking | Per transaction |
| **Periodic Netting** | Net multiple IC transactions at period end | Monthly |
| **Cash Settlement** | Physical cash movement between entities | On demand |

---

## 7. Development Roadmap (Audit-First Strategy)

We prioritize build order based on **Risk Management** and **Dependency Chains**.

### 7.1 Phase 1: The "Spine" (GL Anchor)

> **Why:** You cannot post anything without a Chart of Accounts and a Fiscal Calendar.

| Deliverable | Code | Effort | Dependency |
|:------------|:-----|:-------|:-----------|
| Kernel (Fiscal/Audit) | K_TIME, K_LOG | 3 days | None |
| Chart of Accounts | GL-01 | 2 days | Kernel |
| Posting Engine (simple) | GL-03 | 3 days | GL-01 |
| Trial Balance | GL-05 | 1 day | GL-03 |

**Exit Criteria:**
- [ ] Can create a Chart of Accounts
- [ ] Can post a manual journal entry
- [ ] Trial Balance shows balanced books

### 7.2 Phase 2: The "Bleeding" (AP Control) — **CURRENT PRIORITY**

> **Why:** Cash outflows are the highest risk for fraud and error.

| Deliverable | Code | Effort | Dependency |
|:------------|:-----|:-------|:-----------|
| Vendor Master | AP-01 | 2 days | Kernel |
| Payment Hub | AP-05 | 5 days | GL-03, AP-01 |
| Invoice Entry | AP-02 | 3 days | AP-01, GL-03 |

**Exit Criteria:**
- [x] Payment Hub architecture defined (CONT_04)
- [ ] Can create a payment with Maker-Checker
- [ ] Every payment creates a GL posting

### 7.3 Phase 3: The "Feeding" (AR & Treasury)

> **Why:** Needed to close the loop on cash.

| Deliverable | Code | Effort | Dependency |
|:------------|:-----|:-------|:-----------|
| Customer Master | AR-01 | 2 days | Kernel |
| Sales Invoice | AR-02 | 3 days | AR-01, GL-03 |
| Bank Reconciliation | TR-05 | 3 days | GL-03 |

**Exit Criteria:**
- [ ] Can issue a sales invoice
- [ ] Can record a receipt
- [ ] Bank Reconciliation ties to GL

---

## 8. Security & Compliance

### 8.1 Authorization Matrix (RBAC)

| Permission Scope | Maker (Entry) | Checker (Approve) | Admin (Config) | Auditor (Read) |
|:-----------------|:-------------:|:-----------------:|:--------------:|:--------------:|
| `finance.payment.create` | ✅ | ❌ | ❌ | ❌ |
| `finance.payment.approve` | ❌ | ✅ | ❌ | ❌ |
| `finance.period.close` | ❌ | ❌ | ✅ | ❌ |
| `finance.gl.post` | ✅ | ❌ | ❌ | ❌ |
| `finance.gl.view` | ✅ | ✅ | ✅ | ✅ |
| `finance.audit.view` | ❌ | ❌ | ❌ | ✅ |

### 8.2 Segregation of Duties (SoD) Matrix

| Control | Implementation | COSO Mapping |
|:--------|:---------------|:-------------|
| **Maker ≠ Checker** | DB constraint: `approver_id <> created_by` | Authorization vs Execution |
| **Vendor Creator ≠ Payer** | Different permissions required | Master Data vs Transactions |
| **GL Poster ≠ Period Closer** | Different permissions required | Recording vs Supervision |
| **Invoice Creator ≠ Approver** | Different permissions required | Initiation vs Authorization |

### 8.3 Audit Requirements

Every **Mutation** (Create/Update/Delete) **MUST** log:

| Field | Purpose | Example |
|:------|:--------|:--------|
| **Who** | User ID & IP address | `user_id: "abc-123", ip: "192.168.1.1"` |
| **When** | UTC Timestamp | `2025-12-16T10:30:00Z` |
| **What** | Previous State vs New State (JSON Diff) | `{"status": {"old": "pending", "new": "approved"}}` |
| **Why** | Reason Code or Approval ID | `approval_id: "xyz-789"` |
| **Where** | Correlation ID (request trace) | `correlation_id: "req-456"` |

---

## 9. Compliance & Accounting Standards

### 9.1 Applicable Standards

| Standard | Application | Implementation |
|:---------|:------------|:---------------|
| **GAAP** | US Accounting Principles | Period close, revenue recognition, matching |
| **IFRS** | International Standards | IAS 21 (FX), IFRS 15 (Revenue), IFRS 9 (Financial Instruments) |
| **COSO** | Internal Control Framework | Segregation of Duties enforcement |
| **SOX** | Sarbanes-Oxley | Audit trail, access controls, change management |
| **ISO 27001** | Information Security | Data protection, access logging |

### 9.2 AIS Theory Implementation

| AIS Concept | Source | Implementation |
|:------------|:-------|:---------------|
| **Transaction Cycles** | Romney & Steinbart | Molecules (P2P, O2C, R2R) |
| **Segregation of Duties** | COSO Framework | Cells with atomic permissions |
| **Master Data Management** | AIS Best Practice | Separate master data cells (Vendor, Customer) |
| **Audit Trail** | GAAP Requirement | Kernel audit service — immutable |
| **Authorization Hierarchy** | Internal Control Design | Amount-based approval thresholds |

---

## 10. Related Contracts

| Contract | Purpose | Relationship |
|:---------|:--------|:-------------|
| **CONT_00** | Constitution | Supreme law — this contract derives from it |
| **CONT_01** | Canon Identity | Naming conventions for Cells |
| **CONT_02** | Kernel Architecture | Control Plane integration |
| **CONT_03** | Database Architecture | Schema governance |
| **CONT_04** | Payment Hub Architecture | Cell-level specification for AP-05 |
| **CONT_05** | Naming & Structure | File organization |
| **CONT_06** | Schema & Type Governance | Type definitions |

---

## 11. Appendix A: Complete Cell Registry

### 11.1 Cell Inventory

| Code | Name | Molecule | Status | Contract | Priority |
|:-----|:-----|:---------|:-------|:---------|:---------|
| GL-01 | Chart of Accounts | General Ledger | ⬜ Planned | — | P1 |
| GL-02 | Journal Entry | General Ledger | ⬜ Planned | — | P1 |
| GL-03 | Posting Engine | General Ledger | ⬜ Planned | — | P1 |
| GL-04 | Period Close | General Ledger | ⬜ Planned | — | P2 |
| GL-05 | Trial Balance | General Ledger | ⬜ Planned | — | P1 |
| AP-01 | Vendor Master | Accounts Payable | ⬜ Planned | — | P2 |
| AP-02 | Supplier Invoice | Accounts Payable | ⬜ Planned | — | P2 |
| AP-03 | 3-Way Match | Accounts Payable | ⬜ Planned | — | P3 |
| AP-04 | Invoice Approval | Accounts Payable | ⬜ Planned | — | P3 |
| **AP-05** | **Payment Execution** | **Accounts Payable** | **🟡 MVP** | **CONT_04** | **P0** |
| AP-06 | AP Aging | Accounts Payable | ⬜ Planned | — | P3 |
| AR-01 | Customer Master | Accounts Receivable | ⬜ Planned | — | P3 |
| AR-02 | Sales Invoice | Accounts Receivable | ⬜ Planned | — | P3 |
| AR-03 | Receipt Processing | Accounts Receivable | ⬜ Planned | — | P3 |
| AR-04 | Credit Note | Accounts Receivable | ⬜ Planned | — | P4 |
| AR-05 | AR Aging | Accounts Receivable | ⬜ Planned | — | P4 |
| TR-01 | Bank Account | Treasury | ⬜ Planned | — | P3 |
| TR-02 | Cash Pooling | Treasury | ⬜ Planned | — | P4 |
| TR-03 | FX Hedging | Treasury | ⬜ Planned | — | P4 |
| TR-04 | Intercompany Settlement | Treasury | ⬜ Planned | — | P4 |
| TR-05 | Bank Reconciliation | Treasury | ⬜ Planned | — | P3 |

### 11.2 Priority Legend

| Priority | Phase | Description | Justification |
|:---------|:------|:------------|:--------------|
| **P0** | Now | AP-05 (Payment Hub) | CFO Priority — Cash Out Control |
| **P1** | Phase 1 | GL-01, GL-02, GL-03, GL-05 | Ledger Anchor — Required for posting |
| **P2** | Phase 2 | AP-01, AP-02, GL-04 | Complete AP Cycle |
| **P3** | Phase 3 | AR-01, AR-02, TR-01, TR-05 | Cash In & Reconciliation |
| **P4** | Phase 4 | Remaining cells | Full functionality |

---

## 12. Appendix B: Glossary

| Term | Definition |
|:-----|:-----------|
| **Canon** | A bounded context representing a business domain (Finance, HRM, CRM) |
| **Molecule** | A cluster of related Cells representing a transaction cycle (P2P, O2C) |
| **Cell** | An atomic unit of business logic with strict boundaries |
| **Port** | An interface that defines how a Cell communicates with the outside world |
| **Adapter** | A concrete implementation of a Port (PostgresAdapter, MockAdapter) |
| **Kernel** | The control plane providing cross-cutting concerns (auth, audit, time) |
| **SoD** | Segregation of Duties — no single person controls an entire transaction |
| **Maker-Checker** | Two-person rule — one creates, another approves |
| **GL Posting** | The act of recording a balanced journal entry in the ledger |
| **Cutoff** | Ensuring transactions are recorded in the correct fiscal period |

---

## 13. Certification & Ratification

This contract is **CERTIFIED** as the Enterprise Architecture Constitution for the Finance Canon.

| Property | Value |
|:---------|:------|
| **Certification Authority** | AI-BOS Architecture Team |
| **Certification Date** | 2025-12-16 |
| **Status** | 🟢 CERTIFIED |
| **Quality Gate** | Fortune 500 / ICFR-Compatible / Audit-Ready |
| **Next Review** | After AP Molecule MVP completion |

### 13.1 What "Certified" Means

This document has passed enterprise review with **5 critical corrections** and **4 finishing appendices**:

**Critical Corrections Applied:**
1. ✅ `K_NOTIFY` formalized as 8th Kernel service
2. ✅ Period Close governance model defined (state machine with Controlled Reopen)
3. ✅ Audit reliability model clarified (Transactional, not Async fire-and-forget)
4. ✅ Immutable ledger uses `TRIGGER` with `RAISE EXCEPTION` (not silent `RULE`)
5. ✅ Version/contract integrity verified (header = footer = title)

**Enterprise Finishing Appendices:**
- **Appendix E:** Control & Evidence Matrix (per Cell template with AP-05 example)
- **Appendix F:** Finance Event Taxonomy (mandatory events, envelope schema)
- **Appendix G:** Money Governance (minor units, rounding, FX rate types)
- **Appendix H:** Posting Invariants (10 invariants beyond balanced)

### 13.2 Architectural Defensibility

When questioned "Why can't we just...?", point to:

| Question | Defense | Anchor |
|:---------|:--------|:-------|
| "Why can't I update payment status directly?" | SoD + Consistency | Anchor #1, #3 |
| "Why can't AP access AR tables?" | Bounded Contexts | Anchor #2 |
| "Why do we need source_document_id?" | Drilldown Traceability | Success Metric #2 |
| "Why can't we use floats for money?" | Type Safety | Appendix G |
| "Why can't we delete journal lines?" | Immutable Ledger | Section 5.1 |
| "Why is audit not async?" | Audit Completeness | Section 2.1.1 |
| "Can we reopen a closed period?" | Yes, with policy gate | Section 3.2.3 |

---

**End of Contract CONT_07 — Finance Canon Architecture v3.0.0**

---

**Certification Status:** 🟢 **CERTIFIED**

**Implementation Roadmap:**
1. ✅ CONT_07 v3.0.0 certified as Finance Canon Constitution
2. ✅ CONT_04 (Payment Hub) adopted as Cell reference implementation
3. 🔄 Begin Phase 1 (GL Anchor) — COA, Posting Engine, Trial Balance
4. ⏳ Phase 2 (AP Control) — Vendor Master, Payment Hub MVP
5. ⏳ CFO/CTO demo script validation
6. ⏳ Production deployment after MVP validation

---

## 14. Appendix C: Compliance Framework References

For external auditors and compliance teams, this architecture aligns with:

| Framework | Application | Reference |
|:----------|:------------|:----------|
| **COSO Internal Control** | Control design & evaluation | [coso.org/guidance-on-ic](https://www.coso.org/guidance-on-ic) |
| **PCAOB AS 2201** | Audit of ICFR | [pcaobus.org/AS2201](https://pcaobus.org/oversight/standards/auditing-standards/details/AS2201) |
| **SOX 404** | Annual control evaluation | ICFR requirements |
| **SOC 1 / SOC 2** | Trust Services Criteria | [aicpa-cima.com/soc-1](https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-1) |
| **ISO/IEC 27001** | Information Security Management | [iso.org/27001](https://www.iso.org/standard/27001) |
| **NIST SP 800-53 Rev 5** | Security & Privacy Controls | [csrc.nist.gov/800-53](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final) |
| **OWASP ASVS** | Application Security Verification | [owasp.org/asvs](https://owasp.org/www-project-application-security-verification-standard/) |
| **APQC R2R** | Record-to-Report Process Framing | [apqc.org/r2r](https://www.apqc.org/resource-library/resource-listing/record-report-process-and-internal-controls) |

---

## 15. Appendix D: Definition of Done (Release Gate)

A Cell release is **"Done"** only if:

| # | Criterion | Verification |
|:--|:----------|:-------------|
| 1 | Types registered in `@ai-bos/shared` | CI check |
| 2 | BFF validates all I/O (schema-first) | Zod parsing on every endpoint |
| 3 | Invariants enforced (balance, immutability, locks) | Control tests pass |
| 4 | Audit events emitted + queryable | Integration test |
| 5 | Drilldown works end-to-end | E2E test: Statement → Source |
| 6 | Tests pass: unit + integration + **control tests** | 100% green |
| 7 | Ops runbook updated | Monitoring, backup/restore |
| 8 | Cell Contract checklist complete (8 points) | PR review gate |

**Control Tests** are first-class citizens:
- `test_sod_maker_cannot_approve_own_payment()`
- `test_period_lock_rejects_posting()`
- `test_immutable_ledger_rejects_delete()`
- `test_audit_event_emitted_on_mutation()`

---

## 16. Appendix E: Control & Evidence Matrix (Per Cell Template)

Every Cell **MUST** document its controls using this matrix format. This is the artifact that external auditors will test.

### 16.1 Control Matrix Template

| # | Control Objective | Risk Addressed | Control Activity | Test Procedure | Evidence Artifact | Retention |
|:--|:------------------|:---------------|:-----------------|:---------------|:------------------|:----------|
| 1 | Authorization | Unauthorized transaction | Maker ≠ Checker | Attempt self-approval, verify rejection | Approval event log | 7 years |
| 2 | Completeness | Missing audit trail | Transactional audit emit | Verify every mutation has audit event | `kernel.audit_events` | 7 years |
| 3 | Accuracy | Calculation error | Amount validation | Boundary tests for limits | Validation logs | 7 years |
| 4 | Cutoff | Period manipulation | Period lock enforcement | Post to closed period, verify rejection | Period state log | 7 years |
| 5 | Existence | Phantom vendor | Master data FK | Create payment to non-existent vendor | Constraint violation | 7 years |
| 6 | SoD | Fraud | Role separation | Same user create + approve, verify block | RBAC audit log | 7 years |

### 16.2 Control Objective Categories (COSO-Aligned)

| Category | Description | Typical Controls |
|:---------|:------------|:-----------------|
| **Authorization** | Only approved persons can initiate/approve | Maker-Checker, approval limits, role gates |
| **Completeness** | All valid transactions are recorded | Sequence gap detection, batch controls |
| **Accuracy** | Transactions are recorded correctly | Validation rules, calculation checks |
| **Existence/Occurrence** | Recorded transactions actually occurred | Master data FKs, confirmation workflows |
| **Cutoff** | Transactions are in correct period | Period lock, posting date validation |
| **SoD** | No single person controls entire process | Role separation, different permission sets |
| **Change Management** | Changes are authorized and tracked | Config versioning, approval workflows |
| **Monitoring** | Controls are operating effectively | Dashboards, exception reports, control tests |

### 16.3 Example: AP-05 Payment Execution Control Matrix

| # | Control Objective | Risk | Control Activity | Test | Evidence | Retention |
|:--|:------------------|:-----|:-----------------|:-----|:---------|:----------|
| AP05-C1 | Authorization | Unauthorized payment | Maker ≠ Checker (DB constraint) | `test_creator_cannot_approve()` | Approval chain events | 7 years |
| AP05-C2 | Authorization | Over-limit payment | Amount-based approval tiers | `test_amount_triggers_level()` | Threshold evaluation log | 7 years |
| AP05-C3 | Existence | Payment to phantom vendor | FK to `vendors` where `status = 'approved'` | `test_unapproved_vendor_blocked()` | Constraint violation | 7 years |
| AP05-C4 | Completeness | Missing GL entry | Sync call to Posting Engine | `test_payment_creates_gl()` | Journal entry reference | 7 years |
| AP05-C5 | Accuracy | Duplicate payment | Invoice reference + unique constraint | `test_duplicate_payment_blocked()` | Validation error log | 7 years |
| AP05-C6 | Cutoff | Payment in closed period | K_TIME check before processing | `test_closed_period_rejected()` | Period status response | 7 years |
| AP05-C7 | SoD | Bank detail tampering | Vendor bank change requires separate approval | `test_bank_change_approval_required()` | Bank change audit | 7 years |
| AP05-C8 | Audit | No evidence trail | Transactional audit emit | `test_audit_event_on_payment()` | `kernel.audit_events` | 7 years |

---

## 17. Appendix F: Finance Event Taxonomy

All Cells **MUST** emit domain events using this standardized taxonomy. This enables downstream integration, alerting, and audit querying.

### 17.1 Event Naming Convention

```
<canon>.<molecule>.<cell>.<action>

Examples:
  finance.ap.payment.created
  finance.ap.payment.approved
  finance.ap.payment.rejected
  finance.gl.journal.posted
  finance.gl.period.closed
```

### 17.2 Mandatory Event Set (Per Transaction Type)

| Transaction Type | Required Events | Trigger Point |
|:-----------------|:----------------|:--------------|
| **Payment** | `created`, `submitted`, `approved`, `rejected`, `executed`, `cancelled` | State machine transitions |
| **Invoice** | `created`, `validated`, `approved`, `posted`, `voided` | Workflow transitions |
| **Journal Entry** | `created`, `validated`, `posted`, `reversed` | Posting engine steps |
| **Period** | `opened`, `soft_closed`, `hard_closed`, `reopened` | Period state machine |
| **Master Data** | `created`, `updated`, `deactivated`, `reactivated` | CRUD operations |

### 17.3 Event Envelope (Mandatory Fields)

```typescript
interface FinanceEvent {
  // ═══════════════════════════════════════════════════════════════
  // ENVELOPE (Mandatory for all events)
  // ═══════════════════════════════════════════════════════════════
  event_id: string;           // UUID — unique event identifier
  event_type: string;         // 'finance.ap.payment.approved'
  event_version: string;      // 'v1' — schema version for consumers
  timestamp: string;          // ISO 8601 UTC: '2025-12-16T10:30:00.000Z'
  correlation_id: string;     // Request trace ID (from K_AUTH)
  causation_id?: string;      // ID of event that caused this event
  
  // ═══════════════════════════════════════════════════════════════
  // ACTOR (Who did this?)
  // ═══════════════════════════════════════════════════════════════
  actor: {
    user_id: string;          // UUID
    tenant_id: string;        // UUID
    session_id: string;       // UUID
    ip_address?: string;      // For fraud detection
  };
  
  // ═══════════════════════════════════════════════════════════════
  // TARGET (What was affected?)
  // ═══════════════════════════════════════════════════════════════
  target: {
    entity_type: string;      // 'payment', 'invoice', 'journal'
    entity_id: string;        // UUID
    entity_urn: string;       // 'urn:aibos:finance:payment:abc-123'
  };
  
  // ═══════════════════════════════════════════════════════════════
  // PAYLOAD (What changed?)
  // ═══════════════════════════════════════════════════════════════
  payload: {
    action: string;           // 'created', 'approved', 'posted'
    before?: object;          // Previous state (for updates)
    after: object;            // New state
    delta?: object;           // Changed fields only
  };
  
  // ═══════════════════════════════════════════════════════════════
  // CONTEXT (Business context)
  // ═══════════════════════════════════════════════════════════════
  context: {
    company_id: string;       // Legal entity
    fiscal_period?: string;   // 'FY2025-P12'
    source_document?: string; // 'INV-2024-001234'
  };
}
```

### 17.4 Correlation Rules

| Rule | Description | Implementation |
|:-----|:------------|:---------------|
| **Correlation ID propagation** | Same `correlation_id` across entire request chain | Pass via HTTP header `X-Correlation-Id` |
| **Causation chaining** | Event B caused by Event A references A's `event_id` | `causation_id = parent.event_id` |
| **Entity URN consistency** | Same entity always has same URN | Deterministic: `urn:aibos:finance:<type>:<uuid>` |
| **Idempotency key** | Retried operations produce same `event_id` | Hash of (entity_id + action + timestamp_minute) |

---

## 18. Appendix G: Money Governance

Financial amounts **MUST** follow these strict rules to prevent rounding errors, FX losses, and audit discrepancies.

### 18.1 Minor Units (No Floating Point)

| Currency | Minor Unit | Storage | Example |
|:---------|:-----------|:--------|:--------|
| USD | cent (1/100) | `BIGINT` (cents) | $100.50 → `10050` |
| JPY | yen (no decimals) | `BIGINT` | ¥1000 → `1000` |
| BHD | fils (1/1000) | `BIGINT` (fils) | 1.234 BHD → `1234` |
| **Generic** | String decimal | `NUMERIC(19,4)` | "100.5000" |

**Rule:** Never store money as `FLOAT` or `DOUBLE`. Use `BIGINT` (minor units) or `NUMERIC/DECIMAL`.

### 18.2 String Representation (API Layer)

```typescript
// ✅ CORRECT: Money as string
const payment = {
  amount: "10000.00",  // String — no precision loss
  currency: "USD"
};

// ❌ WRONG: Money as number
const payment = {
  amount: 10000.00,    // Float — 0.1 + 0.2 !== 0.3
  currency: "USD"
};
```

### 18.3 Rounding Policy

| Context | Rounding Mode | Justification |
|:--------|:--------------|:--------------|
| **Tax calculation** | HALF_UP | Standard commercial rounding |
| **FX conversion** | HALF_EVEN (Banker's) | Reduces systematic bias |
| **Allocation (splits)** | Last-penny adjustment | Ensures sum = original |
| **Display** | Currency-specific decimals | USD: 2, JPY: 0, BHD: 3 |

**Allocation Example:**
```
Split $100.00 three ways:
  Share 1: $33.33
  Share 2: $33.33
  Share 3: $33.34  ← "Penny catcher" gets remainder
  Total:   $100.00 ✓
```

### 18.4 FX Rate Types

| Type | Definition | Use Case | Source |
|:-----|:-----------|:---------|:-------|
| **Spot Rate** | Current market rate | Real-time transactions | K_FX live feed |
| **Period Average** | Average for fiscal period | Revenue/expense translation | K_FX calculated |
| **Closing Rate** | Rate at period end | Balance sheet items | K_FX snapshot |
| **Historical Rate** | Rate at transaction date | Equity, fixed assets | K_FX lookup |
| **Contracted Rate** | Agreed hedge rate | Hedged transactions | Treasury Cell |

### 18.5 Valuation Precision

| Measure | Precision | Example |
|:--------|:----------|:--------|
| **Transaction amounts** | 4 decimal places | 10000.1234 |
| **FX rates** | 6 decimal places | 1.234567 |
| **Percentages (tax, discount)** | 4 decimal places | 7.2500% |
| **Calculated results** | Round to transaction precision before storing | 10000.12 |

---

## 19. Appendix H: Posting Invariants (Beyond Balanced)

The Posting Engine (GL-03) **MUST** enforce these invariants. Violation of any invariant **MUST** reject the posting.

### 19.1 Invariant Catalog

| # | Invariant | Description | Enforcement | Test |
|:--|:----------|:------------|:------------|:-----|
| **INV-01** | **Balanced** | `SUM(debits) = SUM(credits)` per currency | DB Trigger | `test_unbalanced_journal_rejected()` |
| **INV-02** | **Idempotent** | Same source_id + source_type = same journal (no duplicates) | Unique constraint | `test_duplicate_post_blocked()` |
| **INV-03** | **Atomic** | All lines commit or none (ACID) | Single DB transaction | `test_partial_post_rolls_back()` |
| **INV-04** | **Audited** | Audit event in same transaction | Transactional K_LOG | `test_audit_committed_with_journal()` |
| **INV-05** | **Period-Valid** | Posting date within open period | K_TIME check | `test_closed_period_post_rejected()` |
| **INV-06** | **Account-Valid** | All account codes exist and are postable | K_COA check | `test_invalid_account_rejected()` |
| **INV-07** | **Source-Linked** | Every journal has `source_document_id` | NOT NULL FK | `test_orphan_journal_rejected()` |
| **INV-08** | **Reversal-Only** | Corrections via reversal + new entry (no UPDATE) | Immutable trigger | `test_journal_update_rejected()` |
| **INV-09** | **Cutoff-Enforced** | Posting date cannot exceed current system date | Business rule | `test_future_date_rejected()` |
| **INV-10** | **Currency-Consistent** | All lines in entry use same functional currency OR have FX rate | Validation | `test_mixed_currency_requires_fx()` |

### 19.2 Reversal Pattern (The Only Correction Method)

```
Original Entry (Posted — IMMUTABLE):
  DR  Expense         $1,000
  CR  Cash            $1,000
  
Problem: Should have been $1,200

═══════════════════════════════════════════════════════════════
STEP 1: Post Reversal Entry (nets original to zero)
═══════════════════════════════════════════════════════════════
  DR  Cash            $1,000
  CR  Expense         $1,000
  Reason: "Reversal of JE-001234 — incorrect amount"
  Links to: JE-001234 (original)

═══════════════════════════════════════════════════════════════
STEP 2: Post Correct Entry (the intended transaction)
═══════════════════════════════════════════════════════════════
  DR  Expense         $1,200
  CR  Cash            $1,200
  Reason: "Correction — correct amount per invoice"
  Links to: JE-001234 (original), JE-001235 (reversal)
```

**Audit Trail Preserved:**
- Original entry remains visible
- Reversal entry shows who/when/why
- Correct entry links to both
- Drilldown shows full correction history

### 19.3 Cutoff Enforcement at Posting Boundary

```typescript
async function postJournalEntry(entry: JournalEntry): Promise<PostingResult> {
  // ════════════════════════════════════════════════════════════
  // CUTOFF GATE (Must pass before any posting logic)
  // ════════════════════════════════════════════════════════════
  const periodStatus = await K_TIME.isPeriodOpen(entry.tenant_id, entry.entry_date);
  
  if (!periodStatus.can_post) {
    throw new CutoffViolationError({
      period: periodStatus.period_name,
      reason: periodStatus.reason,
      entry_date: entry.entry_date,
      suggestion: "Contact Controller for period adjustment"
    });
  }
  
  // Continue with posting...
}
```

---

## 20. Appendix I: Locked Implementation Patterns (MANDATORY)

> **Status:** 🔒 **LOCKED** — These patterns are proven in production (AP & AR domains) and **MUST** be followed by all future cells.

### Pattern 1: Cell File Structure

Every cell **MUST** have these files (non-negotiable):

```
cells/{cell-code}-{cell-name}/
├── __tests__/                    # Test suite (MANDATORY)
│   ├── {Service}.test.ts         # Unit tests
│   ├── SoD.test.ts               # Segregation of Duties tests (if applicable)
│   ├── integration/              # Integration tests with DB
│   │   ├── {cell}.integration.test.ts
│   │   └── setup.ts
│   └── setup.ts                  # Test configuration
├── {Service}Service.ts           # Main domain service (MANDATORY)
├── DashboardService.ts           # Cell-level metrics & health (MANDATORY)
├── errors.ts                     # Error codes, HTTP status, factory helpers (MANDATORY)
├── index.ts                      # Barrel exports (MANDATORY)
├── ARCHITECTURE-BRIEF.md         # Technical overview (MANDATORY)
├── ARCHITECTURE-REVIEW.md        # Quality assessment (MANDATORY)
└── PRD-{cell-code}-{name}.md     # Product Requirements (MANDATORY)
```

### Pattern 2: Service Class Structure

All service classes **MUST** follow this section order:

```typescript
// ============================================================================
// 1. IMPORTS
// ============================================================================

// ============================================================================
// 2. TYPES & INTERFACES
// ============================================================================

// ============================================================================
// 3. CONSTANTS (State machines, validation rules)
// ============================================================================

// ============================================================================
// 4. STATE MACHINE (if stateful entity)
// ============================================================================
export const VALID_TRANSITIONS = { ... };
export function canTransition(from, to): boolean { ... }

// ============================================================================
// 5. REPOSITORY PORT
// ============================================================================

// ============================================================================
// 6. AUDIT OUTBOX PORT
// ============================================================================

// ============================================================================
// 7. GL POSTING PORT (if creates journal entries)
// ============================================================================

// ============================================================================
// 8. SERVICE CLASS
// ============================================================================
export class {Entity}Service {
  constructor(...ports) {}

  // ---------------------------------------------------------------------------
  // CREATE OPERATIONS
  // ---------------------------------------------------------------------------
  async create(...): Promise<{Entity}> { ... }

  // ---------------------------------------------------------------------------
  // READ OPERATIONS
  // ---------------------------------------------------------------------------
  async findById(...): Promise<{Entity} | null> { ... }

  // ---------------------------------------------------------------------------
  // UPDATE OPERATIONS
  // ---------------------------------------------------------------------------
  async update(...): Promise<{Entity}> { ... }

  // ---------------------------------------------------------------------------
  // APPROVAL/REJECTION OPERATIONS (SoD enforcement)
  // ---------------------------------------------------------------------------
  async approve(...): Promise<void> { ... }
  async reject(...): Promise<void> { ... }

  // ---------------------------------------------------------------------------
  // POSTING OPERATIONS (GL integration)
  // ---------------------------------------------------------------------------
  async post(...): Promise<void> { ... }

  // ---------------------------------------------------------------------------
  // QUERY/UTILITY OPERATIONS
  // ---------------------------------------------------------------------------
  async list(...): Promise<{Entity}[]> { ... }
}

// ============================================================================
// 9. FACTORY FUNCTION
// ============================================================================
export function create{Entity}Service(...): {Entity}Service { ... }
```

### Pattern 3: Error Handling Standard

Every `errors.ts` file **MUST** have:

```typescript
// ============================================================================
// 1. ERROR CODES (Enum)
// ============================================================================
export const {Entity}ErrorCode = {
  NOT_FOUND: '{ENT}_NOT_FOUND',
  INVALID_STATUS: '{ENT}_INVALID_STATUS',
  // ... domain-specific codes
} as const;

// ============================================================================
// 2. HTTP STATUS MAPPING
// ============================================================================
export const ERROR_HTTP_STATUS: Record<string, number> = {
  [{Entity}ErrorCode.NOT_FOUND]: 404,
  [{Entity}ErrorCode.INVALID_STATUS]: 400,
  // ... complete mapping
};

// ============================================================================
// 3. ERROR CLASS
// ============================================================================
export class {Entity}CellError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly httpStatus: number,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = '{Entity}CellError';
  }
}

// ============================================================================
// 4. ERROR FACTORY HELPERS (one per error code)
// ============================================================================
export function notFoundError(id: string): {Entity}CellError { ... }
export function invalidStatusError(...): {Entity}CellError { ... }
// ... one factory per error code
```

### Pattern 4: Dashboard Service Standard

Every cell **MUST** have a `DashboardService.ts`:

```typescript
export interface {Cell}DashboardMetrics {
  cellCode: '{CELL-XX}';
  cellName: 'Cell Name';
  healthScore: number;                    // 0-100
  healthStatus: 'healthy' | 'warning' | 'critical';
  openItems: {
    total: number;
    // ... work queue metrics
  };
  // ... domain-specific metrics
  controlHealth: {
    lastAuditCheck: Date;
    issuesFound: number;
    // ... control-specific metrics
  };
  asOf: Date;
}

export interface {Cell}DashboardSummary {
  cellCode: string;
  cellName: string;
  healthScore: number;
  openItems: number;
  // ... summary for cluster aggregation
}

export class {Cell}DashboardService {
  constructor(private repo: RepositoryPort) {}

  async getMetrics(tenantId: string): Promise<{Cell}DashboardMetrics> {
    // Calculate health score, open items, control health
  }

  async getSummary(tenantId: string): Promise<{Cell}DashboardSummary> {
    // Lightweight summary for cluster dashboard
  }
}
```

### Pattern 5: Cluster/Manager Dashboard Standard

Every molecule **MUST** have a `{Domain}ManagerDashboardService.ts`:

```typescript
export interface {Domain}ManagerDashboardMetrics {
  domainCode: 'DOM-XX';
  domainName: 'Domain Name';
  clusterHealth: ClusterHealthMetrics;
  lifecycleMetrics: {...};               // P2P or O2C specific
  controlHealth: AggregatedControlHealth;
  cells: CellSummary[];                  // Aggregated from cell dashboards
  generatedAt: Date;
}
```

### Pattern 6: Canvas/Lively Layer Standard

Every molecule **SHOULD** have a `canvas/` directory:

```
{domain}/canvas/
├── urn.ts                    # URN parser/builder: urn:aibos:{domain}:{cell}:{entity}:{uuid}
├── entityTransformers.ts     # Transform entities to CanvasDisplayData
├── CanvasObjectService.ts    # CRUD for canvas objects
├── ZoneTriggerService.ts     # Workflow zone automation
├── PreFlightService.ts       # Acknowledgment gate
├── EventBroadcaster.ts       # WebSocket pub/sub
├── WebSocketTypes.ts         # Message types & topics
└── index.ts                  # Barrel exports
```

---

## 21. Appendix J: Quality Gate Protocol (CRITICAL CONTROL POINT)

> **🚨 MANDATORY:** No cell implementation can begin without passing these gates.

### The Two-Document Rule

```
┌─────────────────────────────────────────────────────────────┐
│                    QUALITY GATE WORKFLOW                     │
│                                                              │
│  Step 1: Agent creates PRD-{cell-code}-{name}.md            │
│          ↓                                                   │
│  Step 2: 🔴 USER REVIEW REQUIRED                            │
│          ↓                                                   │
│  🔴 STOP: If rejected → Agent redrafts PRD (GOTO Step 1)    │
│  🟢 PASS: If approved → Continue to Step 3                  │
│          ↓                                                   │
│  Step 3: Agent creates ARCHITECTURE-REVIEW.md               │
│          ↓                                                   │
│  Step 4: 🔴 USER REVIEW REQUIRED                            │
│          ↓                                                   │
│  🔴 STOP: If rejected → Agent redesigns (GOTO Step 3)       │
│  🟢 PASS: If approved → Implementation authorized           │
│          ↓                                                   │
│  Step 5: Agent implements service + tests + dashboard       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Quality Gate 1: PRD Review Checklist

User must verify:

| # | Criterion | Description | Pass |
|---|-----------|-------------|------|
| 1 | **Business Justification** | Clear "why" this cell exists (AIS/COSO mapping) | ⬜ |
| 2 | **Scope Definition** | What's IN and what's OUT | ⬜ |
| 3 | **State Machine** | If stateful, state diagram with transitions | ⬜ |
| 4 | **Control Points** | SoD, approval limits, period cutoff | ⬜ |
| 5 | **GL Impact** | What journal entries are created? | ⬜ |
| 6 | **Data Model** | Key entities, relationships, foreign keys | ⬜ |
| 7 | **Dependencies** | What kernel services / other cells needed? | ⬜ |
| 8 | **Success Metrics** | How do we know it works? | ⬜ |
| 9 | **Non-Functional Requirements** | Performance, security, audit | ⬜ |
| 10 | **Edge Cases** | What could go wrong? Error scenarios | ⬜ |

### Quality Gate 2: Architecture Review Checklist

User must verify:

| # | Criterion | Description | Pass |
|---|-----------|-------------|------|
| 1 | **Hexagonal Architecture** | Clear separation: Domain / Ports / Adapters | ⬜ |
| 2 | **Port Definitions** | TypeScript interfaces for all external deps | ⬜ |
| 3 | **Service Methods** | Signature for every operation | ⬜ |
| 4 | **Error Taxonomy** | All error codes defined | ⬜ |
| 5 | **Type Safety** | No `any`, Money as string/BigInt | ⬜ |
| 6 | **Audit Events** | List of all events emitted | ⬜ |
| 7 | **Transaction Boundaries** | What's in one DB transaction? | ⬜ |
| 8 | **Concurrency Strategy** | Optimistic locking? Version field? | ⬜ |
| 9 | **Dashboard Metrics** | What KPIs? Health score calculation? | ⬜ |
| 10 | **Test Strategy** | Unit, SoD, Integration test plan | ⬜ |

### Rejection Process

If user rejects:

1. User provides **specific feedback** (not just "redo")
2. Agent addresses **each point** in feedback
3. Agent resubmits for review
4. Process repeats until approval

---

## 22. Appendix K: Agent Parallelization Protocol

> **Purpose:** Enable multiple agents to work simultaneously on different cells without conflicts.

### Work Stream Assignment

| Stream | Scope | Agent | Dependencies |
|--------|-------|-------|--------------|
| **GL Cells** | GL-01 through GL-05 | Agent 1 | None (new domain) |
| **TR Cells** | TR-01 through TR-05 | Agent 2 | GL-03 (for posting) |
| **AR Tests** | AR-02 through AR-05 tests | Agent 3 | AR services exist |
| **Frontend AP** | AP Lively Layer UI | Agent 4 | AP backend complete |
| **Frontend AR** | AR Lively Layer UI | Agent 5 | AR backend complete |

### Cell Creation Workflow (Per Agent)

```markdown
## Cell: {CELL-CODE} {Cell Name}

### Phase 1: Design (Quality Gate 1)
- [ ] Create PRD-{cell-code}-{name}.md
- [ ] Submit to user
- [ ] 🔴 WAIT for user approval
- [ ] If rejected: address feedback, resubmit

### Phase 2: Architecture (Quality Gate 2)
- [ ] Create ARCHITECTURE-REVIEW.md
- [ ] Submit to user
- [ ] 🔴 WAIT for user approval
- [ ] If rejected: redesign, resubmit

### Phase 3: Implementation (After both gates pass)
- [ ] Create {Service}Service.ts (follow Pattern 2)
- [ ] Create errors.ts (follow Pattern 3)
- [ ] Create DashboardService.ts (follow Pattern 4)
- [ ] Create index.ts (barrel exports)
- [ ] Create __tests__/{Service}.test.ts
- [ ] Create __tests__/SoD.test.ts (if applicable)
- [ ] Create __tests__/setup.ts
- [ ] ✅ Tests must pass (automated gate)
```

---

## 23. Document Integrity Verification

This section exists to enable automated verification that the document is internally consistent.

### 23.1 Version Checksum

| Location | Expected Value |
|:---------|:---------------|
| Header `Version` | 4.0.0 |
| Document Control `Version` | 4.0.0 |
| Title `v4.0.0` | 4.0.0 |
| Footer Contract Reference | v4.0.0 |

### 23.2 Cross-Reference Integrity

| Reference | Expected Target |
|:----------|:----------------|
| CONT_00 | Constitution — exists |
| CONT_04 | Payment Hub Architecture — exists |
| Section 2.1 Service Count | 8 services |
| Appendix A Cell Count | 20 cells (10 implemented) |
| Appendix E Control Matrix | Template + AP-05 example |
| Appendix I | Locked Implementation Patterns (6 patterns) |
| Appendix J | Quality Gate Protocol |
| Appendix K | Agent Parallelization Protocol |

### 23.3 Certification Seal

```
╔═══════════════════════════════════════════════════════════════════════╗
║                                                                         ║
║   CONT_07 — Finance Canon Architecture Standard                        ║
║   Version: 4.0.0 (Implementation Proven)                               ║
║   Status:  🟢 CERTIFIED — BATTLE-TESTED                                 ║
║                                                                         ║
║   Certification Authority: AI-BOS Architecture Team                    ║
║   Certification Date: 2025-12-17                                       ║
║                                                                         ║
║   This document has passed production validation and is approved for:  ║
║   • Production implementation (AP & AR proven)                         ║
║   • External auditor review                                            ║
║   • Team onboarding and training                                       ║
║   • Agent parallelization (Quality Gate Protocol enforced)             ║
║                                                                         ║
║   Implementation Achievements (v4.0.0):                                ║
║   ✅ 10 cells implemented & tested (AP01-AP05, AR01-AR05)               ║
║   ✅ Canvas/Lively Layer architecture (AP & AR complete)                ║
║   ✅ Dashboard services (cell + cluster level)                          ║
║   ✅ Quality Gate Protocol (Two-Document Rule)                          ║
║   ✅ Locked patterns from production implementation                     ║
║   ✅ Agent Parallelization Protocol established                         ║
║                                                                         ║
╚═══════════════════════════════════════════════════════════════════════╝
```
