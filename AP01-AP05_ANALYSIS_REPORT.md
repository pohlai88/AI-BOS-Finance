# AP01-AP05 Implementation Gap Analysis

**Date:** 2025-01-XX  
**Scope:** Backend implementation gaps (excluding frontend UI)  
**Based on:** PRD documents for AP-01 through AP-05

---

## Executive Summary

This analysis identifies missing components for AP-01 through AP-05 based on their Product Requirements Documents. **Frontend UI is explicitly excluded** from this analysis.

### Overall Status

| Cell | Core Services | BFF Routes | Tests | Ports/Adapters | Integration | Overall |
|------|--------------|------------|-------|----------------|-------------|---------|
| **AP-01** | ✅ 100% | ✅ 100% | ⚠️ 0% | ⚠️ Partial | ⚠️ Partial | ~70% |
| **AP-02** | ✅ 100% | ✅ 100% | ✅ 100% | ⚠️ Partial | ⚠️ Partial | ~85% |
| **AP-03** | ✅ 100% | ✅ 100% | ⚠️ Partial | ⚠️ Partial | ❌ Missing | ~60% |
| **AP-04** | ✅ 100% | ✅ 100% | ⚠️ Partial | ⚠️ Partial | ❌ Missing | ~60% |
| **AP-05** | ✅ 100% | ✅ 100% | ⚠️ 95% | ✅ 100% | ⚠️ Partial | ~95% |

---

## AP-01: Vendor Master Cell

### ✅ Completed

- Core services (VendorService, ApprovalService, BankAccountService)
- State machine (VendorStateMachine)
- BFF routes (14 routes complete)
- Database migrations (105, 106)
- Ports defined (VendorRepositoryPort)
- SQL adapter (vendorRepo.sql.ts)
- Memory adapter (vendorRepo.memory.ts)

### ⚠️ Missing Components

#### 1. **Tests** (Critical - 0% Complete)
- ❌ `VendorService.test.ts` - Unit tests for vendor CRUD
- ❌ `ApprovalService.test.ts` - Unit tests for approval workflow
- ❌ `BankAccountService.test.ts` - Unit tests for bank account management
- ❌ `VendorStateMachine.test.ts` - State machine validation tests
- ❌ `SoD.test.ts` - Segregation of Duties control tests
- ❌ `Audit.test.ts` - 100% audit coverage tests
- ❌ `Immutability.test.ts` - Immutability enforcement tests
- ❌ `vendor-cell.integration.test.ts` - Database integration tests

**Impact:** Cannot validate correctness, controls, or integration

#### 2. **K_SEQ Integration** (Medium Priority)
- ❌ SequencePort implementation for vendor code generation
- ⚠️ Currently using database function `finance.generate_vendor_number()` but PRD requires K_SEQ integration
- **Required:** Vendor code generation via Kernel Sequence service

**Impact:** Vendor codes not generated through governed Kernel service

#### 3. **Risk Flagging Background Job** (Low Priority)
- ❌ Duplicate bank account detection background job
- ❌ Blacklist checking service
- ❌ High-risk category flagging
- **PRD Requirement:** `duplicate_bank_account_flag`, `is_blacklisted`, `high_risk_category_flag`

**Impact:** Risk flags not automatically updated

---

## AP-02: Invoice Entry Cell

### ✅ Completed

- Core services (InvoiceService, PostingService, DuplicateDetectionService)
- State machine (InvoiceStateMachine)
- BFF routes (all endpoints)
- Database migrations (110, 111)
- Ports defined (InvoiceRepositoryPort)
- SQL adapter (invoiceRepo.sql.ts)
- Memory adapter (invoiceRepo.memory.ts)
- Tests (unit, control, integration)

### ⚠️ Missing Components

#### 1. **GL-03 Posting Integration** (Critical)
- ⚠️ GLPostingPort interface exists but **SQL adapter missing**
- ⚠️ Only memory adapter exists (`glPosting.memory.ts`)
- ❌ SQL adapter for GL posting (`glPosting.sql.ts`)
- ❌ Database migration for `finance.journal_headers` and `finance.journal_lines` tables
- **PRD Requirement:** "Invoice produces a deterministic posting path into GL-03"

**Impact:** Cannot post invoices to General Ledger in production

#### 2. **K_COA Integration** (High Priority)
- ❌ COAPort implementation for Chart of Accounts validation
- ❌ Account code validation before posting
- **PRD Requirement:** "COA Validation: Account codes must exist"

**Impact:** Cannot validate account codes before posting

#### 3. **K_SEQ Integration** (Medium Priority)
- ❌ SequencePort implementation for invoice number generation
- ⚠️ Currently using vendor invoice number, but PRD mentions internal invoice number generation
- **PRD Requirement:** Invoice number generation via K_SEQ

**Impact:** Internal invoice numbers not generated through Kernel service

#### 4. **VendorPort Integration** (Medium Priority)
- ⚠️ Vendor validation exists but may need explicit VendorPort interface
- **PRD Requirement:** "Vendor Validation: FK to approved vendor (AP-01)"

**Impact:** Vendor validation may not be properly abstracted

---

## AP-03: 3-Way Match & Controls Engine Cell

### ✅ Completed

- Core services (MatchService, OverrideService, ExceptionService)
- BFF routes (all endpoints)
- Database migration (120)
- Ports defined (MatchingRepositoryPort)
- Memory adapter (matchingRepo.memory.ts)
- Basic tests (MatchService.test.ts, SoD.test.ts)

### ⚠️ Missing Components

#### 1. **SQL Adapter for Matching Repository** (Critical)
- ❌ SQL adapter (`matchingRepo.sql.ts`) - only memory adapter exists
- **Impact:** Cannot persist match results in production database

#### 2. **PurchaseOrderPort Implementation** (Critical)
- ❌ PurchaseOrderPort interface definition
- ❌ Adapter for fetching PO data (external or internal)
- ❌ Mock adapter for testing
- **PRD Requirement:** "Fetch PO data (external or internal)"

**Impact:** 2-way and 3-way matching cannot function

#### 3. **GoodsReceiptPort Implementation** (Critical)
- ❌ GoodsReceiptPort interface definition
- ❌ Adapter for fetching GRN data (external or internal)
- ❌ Mock adapter for testing
- **PRD Requirement:** "Fetch GRN data (external or internal)"

**Impact:** 3-way matching cannot function

#### 4. **K_POLICY Integration for Match Mode** (High Priority)
- ⚠️ PolicyPort exists but match mode configuration not fully implemented
- ❌ Policy-driven match mode selection (tenant/vendor/category overrides)
- ❌ Tolerance rules from K_POLICY
- **PRD Requirement:** "Match mode is configurable per tenant/vendor/category"

**Impact:** Match mode is hardcoded, not policy-driven

#### 5. **ToleranceService Implementation** (High Priority)
- ⚠️ Tolerance rules mentioned but not fully implemented
- ❌ Price tolerance evaluation (±5%)
- ❌ Quantity tolerance evaluation (±2%)
- ❌ Amount tolerance evaluation (±$100)
- **PRD Requirement:** "Tolerance Rules: Price %, qty %, amount variance"

**Impact:** Tolerance rules not configurable or evaluated

#### 6. **Integration Tests** (High Priority)
- ❌ `3-Way Match` integration test
- ❌ `Override Workflow` integration test
- ❌ `Policy Configuration` integration test
- ❌ `Immutability` integration test

**Impact:** Cannot validate end-to-end matching workflow

---

## AP-04: Invoice Approval Workflow Cell

### ✅ Completed

- Core service (ApprovalService)
- BFF routes (all endpoints)
- Database migration (130)
- Ports defined (ApprovalRepositoryPort)
- Memory adapter (approvalRepo.memory.ts)
- Basic tests (ApprovalService.test.ts, SoD.test.ts)

### ⚠️ Missing Components

#### 1. **SQL Adapter for Approval Repository** (Critical)
- ❌ SQL adapter (`approvalRepo.sql.ts`) - only memory adapter exists
- **Impact:** Cannot persist approval records in production database

#### 2. **RoutingService Implementation** (Critical)
- ❌ RoutingService class for computing approval routes
- ❌ Amount-based escalation logic
- ❌ Department/project routing logic
- ❌ Policy-driven routing from K_POLICY
- **PRD Requirement:** "Approval Routing Rules: Thresholds, departments, projects (K_POLICY)"

**Impact:** Approval routing is not implemented

#### 3. **DelegationService Implementation** (High Priority)
- ❌ DelegationService class
- ❌ Temporary delegation management
- ❌ Re-approval on change logic
- **PRD Requirement:** "Delegation: Temporary delegation, re-approval on change"

**Impact:** Delegation feature not available

#### 4. **GL-03 Posting Integration on Final Approval** (High Priority)
- ⚠️ GLPostingPort interface exists but integration missing
- ❌ Trigger GL posting when final approval level is reached
- **PRD Requirement:** "On final approval: call GL-03 posting (blocking)"

**Impact:** Approved invoices do not automatically post to GL

#### 5. **K_POLICY Integration for Approval Rules** (High Priority)
- ⚠️ PolicyPort exists but approval rules not fully integrated
- ❌ Amount-based threshold rules from K_POLICY
- ❌ Department-based routing rules
- ❌ Project-based routing rules
- **PRD Requirement:** "Approval routing from K_POLICY (not hardcoded)"

**Impact:** Approval rules are hardcoded, not policy-driven

#### 6. **EventBusPort Integration** (Medium Priority)
- ⚠️ EventBusPort exists but domain events not published
- ❌ Publish `finance.ap.invoice.approved` event on final approval
- ❌ Outbox pattern for event publishing
- **PRD Requirement:** "Publish domain event (K_NOTIFY outbox)"

**Impact:** Downstream cells (AP-05) cannot react to approval events

#### 7. **Integration Tests** (High Priority)
- ❌ `Multi-Step Approval` integration test
- ❌ `Re-approval on Change` integration test
- ❌ `GL Posting Trigger` integration test
- ❌ `Immutability` integration test

**Impact:** Cannot validate end-to-end approval workflow

---

## AP-05: Payment Execution Cell

### ✅ Completed

- Core services (PaymentService, ApprovalService, ExecutionService, ExceptionService, WebhookService)
- State machine (PaymentStateMachine)
- BFF routes (all endpoints)
- Database migration (104)
- Ports defined (PaymentRepositoryPort, GLPostingPort, etc.)
- SQL adapter (paymentRepo.sql.ts)
- Memory adapter (paymentRepo.memory.ts)
- Most tests (SoD, Concurrency, Idempotency, Period Lock, Audit, Immutability, Money)

### ⚠️ Missing Components

#### 1. **Integration Test File** (Low Priority - Setup Ready)
- ⚠️ Integration test setup exists (`__tests__/integration/setup.ts`)
- ❌ Integration test file (`payment-cell.integration.test.ts`) not created
- **Status:** Template exists in `EXPEDITED_IMPLEMENTATION.md`

**Impact:** Cannot run full integration test suite

#### 2. **GL-03 SQL Adapter** (Medium Priority)
- ⚠️ GLPostingPort memory adapter exists
- ❌ SQL adapter for GL posting (`glPosting.sql.ts`)
- ❌ Database migration for `finance.journal_headers` and `finance.journal_lines`
- **PRD Requirement:** "GL posting on completion (journal_header_id populated)"

**Impact:** GL posting works in tests but not in production

#### 3. **EventBusPort SQL Adapter** (Medium Priority)
- ⚠️ EventBusPort interface exists
- ⚠️ Outbox table exists (`finance.payment_outbox`)
- ❌ OutboxDispatcher service implementation
- ❌ Event publishing worker/process
- **PRD Requirement:** "Publish domain events (outbox)"

**Impact:** Domain events not published to external systems

---

## Cross-Cutting Missing Components

### 1. **GL-03 Posting Engine** (Critical - Affects AP-02, AP-04, AP-05)

**Missing:**
- ❌ SQL adapter for GLPostingPort (`glPosting.sql.ts`)
- ❌ Database migrations for journal tables:
  - `finance.journal_headers`
  - `finance.journal_lines`
- ❌ Journal number generation logic
- ❌ Double-entry validation
- ❌ Period cutoff validation in GL posting

**Impact:** Multiple cells cannot post to General Ledger in production

**Priority:** 🔴 **CRITICAL**

### 2. **K_SEQ (Sequence Service)** (High Priority - Affects AP-01, AP-02)

**Missing:**
- ❌ SequencePort implementation
- ❌ SQL adapter for sequence generation
- ❌ Database sequences or sequence tables
- ❌ Vendor code generation via K_SEQ
- ❌ Invoice number generation via K_SEQ

**Impact:** Document numbers not generated through governed Kernel service

**Priority:** 🟡 **HIGH**

### 3. **K_COA (Chart of Accounts)** (High Priority - Affects AP-02)

**Missing:**
- ❌ COAPort interface definition
- ❌ COA adapter implementation
- ❌ Account code validation
- ❌ Account hierarchy support

**Impact:** Cannot validate account codes before posting

**Priority:** 🟡 **HIGH**

### 4. **K_POLICY Integration** (High Priority - Affects AP-03, AP-04)

**Missing:**
- ⚠️ PolicyPort interface exists but not fully utilized
- ❌ Match mode configuration from K_POLICY (AP-03)
- ❌ Tolerance rules from K_POLICY (AP-03)
- ❌ Approval routing rules from K_POLICY (AP-04)
- ❌ Policy-driven configuration (not hardcoded)

**Impact:** Business rules are hardcoded, not configurable

**Priority:** 🟡 **HIGH**

### 5. **External Procurement Integration** (Medium Priority - Affects AP-03)

**Missing:**
- ❌ PurchaseOrderPort interface and adapters
- ❌ GoodsReceiptPort interface and adapters
- ❌ External ERP integration adapters
- ❌ Mock adapters for testing

**Impact:** 2-way and 3-way matching cannot function without PO/GRN data

**Priority:** 🟢 **MEDIUM** (can use mocks for MVP)

---

## Priority Summary

### 🔴 Critical (Blocks Production)

1. **GL-03 SQL Adapter** - Required for AP-02, AP-04, AP-05
2. **AP-01 Tests** - Cannot validate vendor master controls
3. **AP-03 SQL Adapter** - Cannot persist match results
4. **AP-04 SQL Adapter** - Cannot persist approval records
5. **AP-03 PurchaseOrderPort & GoodsReceiptPort** - Matching cannot function

### 🟡 High Priority (Required for Full Functionality)

6. **K_SEQ Integration** - Document number generation
7. **K_COA Integration** - Account validation
8. **K_POLICY Integration** - Policy-driven configuration
9. **AP-04 RoutingService** - Approval routing logic
10. **AP-03 ToleranceService** - Tolerance rule evaluation
11. **AP-04 DelegationService** - Delegation feature
12. **Integration Tests** - End-to-end validation

### 🟢 Medium Priority (Nice-to-Have)

13. **AP-05 Integration Test File** - Complete test coverage
14. **AP-05 EventBusPort SQL Adapter** - Event publishing
15. **AP-01 Risk Flagging Jobs** - Automated risk detection

---

## Recommendations

### Immediate Actions (Week 1)

1. **Create GL-03 SQL Adapter**
   - Implement `glPosting.sql.ts`
   - Create journal table migrations
   - Wire up to AP-02, AP-04, AP-05

2. **Create Missing SQL Adapters**
   - `matchingRepo.sql.ts` (AP-03)
   - `approvalRepo.sql.ts` (AP-04)

3. **Implement PurchaseOrderPort & GoodsReceiptPort**
   - Create interfaces
   - Create mock adapters for testing
   - Create placeholder adapters for external integration

### Short-Term Actions (Week 2-3)

4. **Implement K_SEQ Integration**
   - Create SequencePort interface
   - Create SQL adapter
   - Wire up to AP-01, AP-02

5. **Implement K_COA Integration**
   - Create COAPort interface
   - Create adapter
   - Wire up to AP-02

6. **Implement AP-04 RoutingService**
   - Compute approval routes from K_POLICY
   - Implement amount-based escalation
   - Implement department/project routing

### Medium-Term Actions (Week 4+)

7. **Complete Test Coverage**
   - AP-01 tests (8 test files)
   - AP-03 integration tests
   - AP-04 integration tests
   - AP-05 integration test file

8. **K_POLICY Integration**
   - Match mode configuration
   - Tolerance rules
   - Approval routing rules

9. **Additional Services**
   - AP-03 ToleranceService
   - AP-04 DelegationService
   - AP-01 Risk Flagging Jobs

---

## Notes

- **Frontend UI is explicitly excluded** from this analysis
- All cells have **core business logic complete**
- All cells have **BFF routes complete**
- Main gaps are in **adapters, integrations, and tests**
- **GL-03 posting** is the most critical missing piece affecting multiple cells

---

**Last Updated:** 2025-01-XX  
**Author:** Implementation Analysis  
**Review:** Architecture Team

