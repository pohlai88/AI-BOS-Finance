# AP-01: Vendor Master Cell — Product Requirements Document

> **🟢 [ACTIVE]** — Enterprise Certified  
> **Cell Code:** AP-01  
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
| **Cell Code** | AP-01 |
| **Cell Name** | Vendor Master |
| **Molecule** | Accounts Payable (dom03-accounts-payable) |
| **Version** | 1.0.0 |
| **Status** | 🟢 ACTIVE |
| **Location** | `apps/canon/finance/dom03-accounts-payable/cells/ap01-vendor-master/` |
| **Author** | Finance Cell Team |
| **Last Updated** | 2025-12-16 |
| **Quality Bar** | Enterprise Certified / ICFR-Ready / Audit-Ready |

---

## 1. Executive Summary

The Vendor Master Cell (AP-01) provides an **approved-vendor registry** to prevent phantom vendors and protect cash outflows (high fraud risk). It enforces **Segregation of Duties (SoD)** between vendor creation (Maker) and vendor approval (Checker), ensuring that only validated vendors can receive payments.

### 1.1 Problem Statement

| Issue | Evidence | Impact |
|-------|----------|--------|
| **Phantom Vendors** | Payments to non-existent vendors | Financial fraud, cash loss |
| **Unauthorized Changes** | Bank account changes without approval | Payment routing to wrong accounts |
| **No SoD Enforcement** | Same user creates and approves vendors | Internal control violation |
| **Missing Audit Trail** | Vendor changes not tracked | Compliance failure |

### 1.2 Solution

A governed vendor registry with:
- **State Machine:** `draft → submitted → approved → suspended → archived`
- **SoD Enforcement:** Maker ≠ Checker (database constraint)
- **Bank Account Change Control:** Separate approval workflow for bank changes
- **Immutable Audit Trail:** Every mutation logged in `kernel.audit_events`
- **Risk Flagging:** Duplicate bank accounts, blacklisted vendors, high-risk categories

---

## 2. Purpose & Outcomes

### 2.1 Objective

Provide an **approved-vendor registry** to prevent phantom vendors and protect cash outflows (high fraud risk).

### 2.2 Outcomes

| Outcome | Success Criteria |
|---------|------------------|
| **Payments/invoices cannot proceed unless vendor is valid/approved** | Hard FK constraint: `finance.payments.vendor_id` → `ap.vendors.id` WHERE `status = 'approved'` |
| **Vendor changes are auditable** | 100% audit event coverage for all mutations |
| **SoD is architecturally enforced** | Database constraint: `approver_id != created_by` |
| **Bank account changes require separate approval** | Bank change requests create separate approval workflow |

---

## 3. Scope

### 3.1 In-Scope

| Feature | Description | Priority |
|---------|-------------|----------|
| **Vendor Onboarding** | Create/update vendor profile | P0 |
| **Bank Account Management** | Add/change bank accounts with controlled change process | P0 |
| **Vendor Status Lifecycle** | `draft → submitted → approved → suspended → archived` | P0 |
| **Vendor Risk Flags** | Duplicate bank account detection, blacklist check, high-risk category | P1 |
| **SoD Enforcement** | Maker ≠ Checker (database constraint) | P0 |
| **Audit Trail** | Every mutation → `kernel.audit_events` | P0 |

### 3.2 Out-of-Scope (Phase Later)

| Feature | Reason | Target |
|---------|--------|--------|
| **Vendor Portal** | Self-service onboarding | v2.0.0 |
| **Vendor Self-Service** | External vendor access | v2.0.0 |
| **Sanctions Screening Integrations** | External dependency | v1.1.0 |
| **Credit Limit Management** | Requires credit risk module | v1.2.0 |
| **Vendor Performance Scoring** | Analytics feature | v1.3.0 |

---

## 4. State Machine

```
┌─────────┐
│  draft  │ ← Created by Maker
└────┬────┘
     │ submit()
     ▼
┌─────────────┐
│  submitted  │ ← Waiting for Checker approval
└────┬────────┘
     │ approve()
     ▼
┌──────────┐
│ approved │ ← Can receive payments/invoices
└────┬─────┘
     │ suspend()
     ▼
┌──────────┐
│suspended │ ← Blocked from payments/invoices
└────┬─────┘
     │ reactivate() → approved
     │ archive()
     ▼
┌──────────┐
│ archived │ ← Historical record (read-only)
└──────────┘
```

### 4.1 States

| Status | Description | Immutable? | Terminal? | Can Receive Payments? |
|--------|-------------|------------|-----------|----------------------|
| `draft` | Vendor being prepared | No | No | ❌ No |
| `submitted` | Waiting for approval | No | No | ❌ No |
| `approved` | Validated and active | No | No | ✅ Yes |
| `suspended` | Temporarily blocked | No | No | ❌ No |
| `archived` | Historical record | **Yes** | **Yes** | ❌ No |

### 4.2 Actions

| Action | From State | To State | Actor | SoD Required? |
|--------|-----------|----------|-------|---------------|
| `submit` | `draft` | `submitted` | Maker | No |
| `approve` | `submitted` | `approved` | Checker | **Yes** (Maker ≠ Checker) |
| `reject` | `submitted` | `draft` | Checker | **Yes** |
| `suspend` | `approved` | `suspended` | Checker | **Yes** |
| `reactivate` | `suspended` | `approved` | Checker | **Yes** |
| `archive` | `approved` or `suspended` | `archived` | Admin | **Yes** |

---

## 5. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  BFF Layer (Next.js API Routes)                                 │
│  /api/ap/vendors/*                                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Cell Services                                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────────────────┐│
│  │VendorService │ │ApprovalService│ │BankAccountService       ││
│  └──────────────┘ └──────────────┘ └─────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Ports (Interfaces)                                              │
│  VendorRepositoryPort, AuditPort, PolicyPort, AuthPort          │
│  SequencePort (K_SEQ)                                           │
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
| **Domain** | VendorService | Business logic, state transitions |
| **Domain** | ApprovalService | SoD enforcement, approval workflow |
| **Domain** | BankAccountService | Bank account change control |
| **Outbound** | VendorRepositoryPort | Data persistence |
| **Outbound** | AuditPort (K_LOG) | Immutable audit trail |
| **Outbound** | PolicyPort (K_POLICY) | Approval rules, risk policies |
| **Outbound** | AuthPort (K_AUTH) | Permission checks |
| **Outbound** | SequencePort (K_SEQ) | Vendor code generation |

---

## 6. Data Model

### 6.1 Core Tables

```sql
-- ap.vendors
CREATE TABLE IF NOT EXISTS ap.vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  
  -- Identification
  vendor_code VARCHAR(50) NOT NULL,  -- Generated by K_SEQ
  legal_name TEXT NOT NULL,
  display_name TEXT,
  tax_id VARCHAR(50),
  registration_number VARCHAR(50),
  
  -- Classification
  country VARCHAR(3) NOT NULL,  -- ISO 3166-1 alpha-3
  currency_preference VARCHAR(3) NOT NULL DEFAULT 'USD',  -- ISO 4217
  vendor_category VARCHAR(50),
  risk_level VARCHAR(20) DEFAULT 'LOW',  -- LOW, MEDIUM, HIGH
  
  -- Status Machine
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'submitted', 'approved', 'suspended', 'archived'
  )),
  
  -- Payment Terms
  default_payment_terms INTEGER DEFAULT 30,  -- Days
  default_bank_account_id UUID REFERENCES ap.vendor_bank_accounts(id),
  
  -- Risk Flags
  is_blacklisted BOOLEAN DEFAULT FALSE,
  duplicate_bank_account_flag BOOLEAN DEFAULT FALSE,
  high_risk_category_flag BOOLEAN DEFAULT FALSE,
  
  -- Audit
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  version INTEGER DEFAULT 1,  -- Optimistic locking
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT uq_vendor_code_tenant UNIQUE (tenant_id, vendor_code),
  CONSTRAINT uq_vendor_tax_id_tenant UNIQUE (tenant_id, tax_id) WHERE tax_id IS NOT NULL,
  
  -- SoD Constraint: Approver must be different from creator
  CONSTRAINT chk_sod_approval CHECK (
    (status = 'approved' AND approved_by IS NOT NULL AND approved_by != created_by) OR
    (status != 'approved')
  )
);

-- ap.vendor_bank_accounts
CREATE TABLE IF NOT EXISTS ap.vendor_bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES ap.vendors(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  
  -- Bank Details
  bank_name TEXT NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  account_name TEXT NOT NULL,
  routing_number VARCHAR(50),  -- US/Canada
  swift_code VARCHAR(11),  -- International
  iban VARCHAR(34),  -- International
  currency VARCHAR(3) NOT NULL,
  
  -- Status
  is_primary BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Change Control
  change_request_status VARCHAR(20),  -- NULL, 'pending_approval', 'approved', 'rejected'
  change_requested_by UUID,
  change_requested_at TIMESTAMPTZ,
  change_approved_by UUID,
  change_approved_at TIMESTAMPTZ,
  
  -- Audit
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT uq_bank_account UNIQUE (tenant_id, account_number, routing_number) 
    WHERE account_number IS NOT NULL AND routing_number IS NOT NULL,
  CONSTRAINT chk_sod_bank_change CHECK (
    (change_request_status = 'approved' AND change_approved_by IS NOT NULL AND 
     change_approved_by != change_requested_by) OR
    (change_request_status != 'approved')
  )
);

-- Indexes
CREATE INDEX idx_vendors_tenant_status ON ap.vendors(tenant_id, status);
CREATE INDEX idx_vendors_tax_id ON ap.vendors(tenant_id, tax_id) WHERE tax_id IS NOT NULL;
CREATE INDEX idx_vendor_bank_accounts_vendor ON ap.vendor_bank_accounts(vendor_id);
CREATE INDEX idx_vendor_bank_accounts_tenant ON ap.vendor_bank_accounts(tenant_id);
```

### 6.2 Key Fields

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `vendor_code` | VARCHAR(50) | Unique vendor identifier | Generated by K_SEQ |
| `legal_name` | TEXT | Legal entity name | Required, min 2 chars |
| `tax_id` | VARCHAR(50) | Tax identification number | Optional, unique per tenant |
| `status` | VARCHAR(20) | Vendor status | Enum: draft, submitted, approved, suspended, archived |
| `risk_level` | VARCHAR(20) | Risk classification | LOW, MEDIUM, HIGH |
| `default_payment_terms` | INTEGER | Payment terms in days | Default: 30 |

---

## 7. Ports & APIs (Hexagonal)

### 7.1 Inbound Ports (API Endpoints)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/ap/vendors` | Create vendor (draft) | `ap.vendor.create` |
| `GET` | `/api/ap/vendors` | List vendors (filtered) | `ap.vendor.read` |
| `GET` | `/api/ap/vendors/{id}` | Get vendor details | `ap.vendor.read` |
| `PUT` | `/api/ap/vendors/{id}` | Update vendor (draft only) | `ap.vendor.update` |
| `POST` | `/api/ap/vendors/{id}/submit` | Submit for approval | `ap.vendor.submit` |
| `POST` | `/api/ap/vendors/{id}/approve` | Approve vendor | `ap.vendor.approve` |
| `POST` | `/api/ap/vendors/{id}/reject` | Reject vendor | `ap.vendor.approve` |
| `POST` | `/api/ap/vendors/{id}/suspend` | Suspend vendor | `ap.vendor.approve` |
| `POST` | `/api/ap/vendors/{id}/reactivate` | Reactivate vendor | `ap.vendor.approve` |
| `POST` | `/api/ap/vendors/{id}/archive` | Archive vendor | `ap.vendor.archive` |
| `POST` | `/api/ap/vendors/{id}/bank-accounts` | Add bank account | `ap.vendor.update` |
| `POST` | `/api/ap/vendors/{id}/bank-accounts/{bankId}/change-request` | Request bank change | `ap.vendor.update` |
| `POST` | `/api/ap/vendors/{id}/bank-accounts/{bankId}/approve-change` | Approve bank change | `ap.vendor.approve` |

### 7.2 Outbound Ports

| Port | Service | Purpose | Reliability |
|------|---------|---------|-------------|
| `VendorRepositoryPort` | SQL Adapter | Persist vendor data | Blocking |
| `AuditPort` (K_LOG) | Kernel | Emit audit events | **Transactional** ⚠️ |
| `PolicyPort` (K_POLICY) | Kernel | Evaluate approval rules, risk policies | Blocking |
| `AuthPort` (K_AUTH) | Kernel | Verify permissions, SoD checks | Blocking |
| `SequencePort` (K_SEQ) | Kernel | Generate vendor codes | Blocking |

---

## 8. Controls & Evidence

### 8.1 Control Matrix (CONT_07 Format)

| Control ID | Assertion | Control | Evidence | Enforcement |
|:----------|:----------|:--------|:---------|:------------|
| **AP01-C01** | **Existence/Occurrence** | Payments/invoices FK must reference approved vendor | `finance.payments.vendor_id` → `ap.vendors.id` WHERE `status = 'approved'` | **FK Constraint** |
| **AP01-C02** | **Authorization** | SoD: Vendor creation ≠ Vendor approval | `approver_id != created_by` | **DB Constraint** |
| **AP01-C03** | **Authorization** | Bank account changes require separate approval | `change_request_status` workflow | **State Machine** |
| **AP01-C04** | **Completeness** | All vendor mutations emit audit events | `kernel.audit_events` coverage = 100% | **Transactional Audit** |
| **AP01-C05** | **Accuracy** | Duplicate bank accounts detected | `duplicate_bank_account_flag` | **Background Job** |
| **AP01-C06** | **Authorization** | Cannot approve own vendor | `chk_sod_approval` constraint | **DB Constraint** |
| **AP01-C07** | **Completeness** | Vendor code uniqueness per tenant | `uq_vendor_code_tenant` constraint | **Unique Constraint** |

### 8.2 Evidence Artifacts

| Artifact | Location | Retention | Purpose |
|----------|----------|-----------|---------|
| **Vendor Record** | `ap.vendors` | 7 years | Master data |
| **Bank Account Record** | `ap.vendor_bank_accounts` | 7 years | Payment routing |
| **Audit Events** | `kernel.audit_events` | 7 years | Compliance trail |
| **Approval History** | `kernel.audit_events` (filtered) | 7 years | SoD evidence |

---

## 9. UI/UX (BioSkin Architecture)

### 9.1 Component Requirements (CONT_10)

| Component | Type | Schema-Driven? | Location |
|-----------|------|----------------|----------|
| **VendorForm** | `BioForm` | ✅ Yes | `apps/web/src/features/vendor/components/VendorForm.tsx` |
| **VendorTable** | `BioTable` | ✅ Yes | `apps/web/src/features/vendor/components/VendorTable.tsx` |
| **VendorDetail** | `BioObject` | ✅ Yes | `apps/web/src/features/vendor/components/VendorDetail.tsx` |
| **BankAccountForm** | `BioForm` | ✅ Yes | `apps/web/src/features/vendor/components/BankAccountForm.tsx` |
| **ApprovalQueue** | `BioTable` | ✅ Yes | `apps/web/src/features/vendor/components/ApprovalQueue.tsx` |

### 9.2 Schema Definition

```typescript
// packages/schemas/src/vendor.schema.ts
import { z } from 'zod';

export const VendorSchema = z.object({
  id: z.string().uuid().optional(),
  vendor_code: z.string().describe('Vendor code (auto-generated)'),
  legal_name: z.string().min(2).describe('Legal entity name'),
  display_name: z.string().optional().describe('Display name'),
  tax_id: z.string().optional().describe('Tax identification number'),
  country: z.string().length(3).describe('ISO 3166-1 alpha-3 country code'),
  currency_preference: z.string().length(3).default('USD').describe('Default currency'),
  vendor_category: z.string().optional().describe('Vendor category'),
  risk_level: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('LOW'),
  default_payment_terms: z.number().int().positive().default(30),
  status: z.enum(['draft', 'submitted', 'approved', 'suspended', 'archived']).default('draft'),
});

export type Vendor = z.infer<typeof VendorSchema>;
```

### 9.3 Design Tokens (CONT_10)

| Element | Token | Usage |
|---------|-------|-------|
| **Card Background** | `bg-surface-card` | Vendor detail cards |
| **Primary Text** | `text-text-primary` | Vendor names, labels |
| **Status Badge** | `text-status-*` | Status indicators (approved, suspended) |
| **Border** | `border-default` | Card borders, form fields |
| **Spacing** | `p-layout-md` | Card padding, form spacing |

---

## 10. Acceptance Criteria

### 10.1 Functional Requirements

| ID | Requirement | Test |
|:---|:------------|:-----|
| **AC-01** | Cannot create invoice/payment to vendor.status != approved | Hard FK constraint fails |
| **AC-02** | All mutations emit transactional audit events | Coverage = 100% |
| **AC-03** | Maker cannot approve own vendor | `chk_sod_approval` constraint fails |
| **AC-04** | Bank account changes require separate approval | `change_request_status` workflow enforced |
| **AC-05** | Duplicate bank accounts detected | `duplicate_bank_account_flag` set |
| **AC-06** | Vendor code uniqueness per tenant | `uq_vendor_code_tenant` constraint enforced |
| **AC-07** | `/health`, `/ready`, `/metrics`, `/schema` implemented | Infrastructure endpoints |

### 10.2 Non-Functional Requirements

| ID | Requirement | Target |
|:---|:------------|:------|
| **NFR-01** | API response time (p95) | < 200ms |
| **NFR-02** | Database query performance | < 50ms (indexed queries) |
| **NFR-03** | Audit event emission | Same transaction (atomic) |
| **NFR-04** | Test coverage | ≥ 90% |

---

## 11. Testing Requirements

### 11.1 Unit Tests

| Component | Test Coverage | Files |
|-----------|---------------|-------|
| `VendorService` | State transitions, validation | `__tests__/VendorService.test.ts` |
| `ApprovalService` | SoD enforcement, approval workflow | `__tests__/ApprovalService.test.ts` |
| `BankAccountService` | Change control, duplicate detection | `__tests__/BankAccountService.test.ts` |

### 11.2 Integration Tests

| Test | Description | File |
|------|-------------|------|
| **SoD Enforcement** | Creator cannot approve own vendor | `__tests__/integration/SoD.test.ts` |
| **Audit Completeness** | Every mutation creates audit event | `__tests__/integration/Audit.test.ts` |
| **Bank Change Workflow** | Bank change requires approval | `__tests__/integration/BankChange.test.ts` |
| **FK Constraint** | Payments blocked for non-approved vendors | `__tests__/integration/FKConstraint.test.ts` |

---

## 12. Related Documents

| Document | Purpose | Location |
|----------|---------|----------|
| **CONT_07** | Finance Canon Architecture | `packages/canon/A-Governance/A-CONT/CONT_07_FinanceCanonArchitecture.md` |
| **CONT_10** | BioSkin Architecture | `packages/canon/A-Governance/A-CONT/CONT_10_BioSkinArchitecture.md` |
| **CONT_00** | Constitution | `packages/canon/A-Governance/A-CONT/CONT_00_Constitution.md` |
| **AP-02 PRD** | Invoice Entry (downstream) | `apps/canon/finance/dom03-accounts-payable/cells/ap02-invoice-entry/PRD-ap02-invoice-entry.md` |

---

**Status:** ✅ Ready for Implementation  
**Next Step:** Create service implementations following hexagonal architecture

---

**Last Updated:** 2025-12-16  
**Maintainer:** Finance Cell Team  
**Review Cycle:** Quarterly
