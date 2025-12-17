# GL-01 Chart of Accounts — Architecture Brief

> **Cell Code:** GL-01  
> **Domain:** General Ledger (DOM-05)  
> **Status:** 🟢 **READY FOR IMPLEMENTATION**  
> **Date:** 2025-12-17

---

## 1. Purpose

GL-01 manages the **Chart of Accounts (COA)** — the master list of all financial accounts used for recording transactions. It is the **foundation** of the entire GL system.

---

## 2. Key Responsibilities

| Responsibility | Description |
|---------------|-------------|
| **Account Registry** | Maintain master list of all GL accounts |
| **Hierarchy Management** | Parent-child relationships, tree structure |
| **Account Validation** | Validate postable, active, correct type |
| **Classification** | Asset/Liability/Equity/Revenue/Expense |
| **Multi-Entity Mapping** | Group-level canonical COA to local accounts |

---

## 3. Dependencies

### Kernel Services Used

| Service | Port | Purpose |
|---------|------|---------|
| K_SEQ | `SequencePort` | Account code generation |
| K_LOG | `AuditPort` | Audit trail |
| K_AUTH | `PolicyPort` | Approval workflow |
| K_CACHE | Redis | Account lookup caching |

### Upstream Dependencies

None — GL-01 is a foundational cell.

### Downstream Consumers

| Consumer | Usage |
|----------|-------|
| GL-02 Journal Entry | Validate accounts are postable |
| GL-03 Posting Engine | Validate accounts before posting |
| AP/AR Cells | Account lookup for invoices/payments |

---

## 4. Data Model Summary

### Primary Entity: `Account`

```typescript
interface Account {
  id: string;
  tenantId: string;
  companyId: string;
  accountCode: string;        // e.g., "1010-00"
  accountName: string;
  accountType: AccountType;   // ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
  normalBalance: 'DEBIT' | 'CREDIT';
  parentAccountId?: string;
  path: string;               // ltree path for hierarchy
  level: number;
  isPostable: boolean;        // Only leaf accounts
  status: AccountStatus;
  effectiveDate: Date;
  currency?: string;
  createdBy: string;
  approvedBy?: string;
  version: number;
}
```

### Supporting Entities

- `AccountChangeRequest` — Pending changes requiring approval
- `GroupChartOfAccount` — Canonical group-level COA
- `GroupAccountMapping` — Local account → Group account mapping

---

## 5. Key Business Rules

| Rule | Enforcement | CONT_07 Reference |
|------|-------------|------------------|
| Parent accounts cannot be postable | DB Trigger | Appendix H |
| Accounts with children cannot be postable | DB Trigger | Appendix H |
| SoD: Approver ≠ Creator | DB Constraint | Section 2.1 |
| Cannot deactivate if balance ≠ 0 | Service validation | PRD Section 4.4 |
| Hierarchy changes require approval | Change request workflow | PRD Section 12 |

---

## 6. State Machine

```
DRAFT → PENDING_APPROVAL → ACTIVE → INACTIVE
                ↓
             REJECTED
```

| Transition | Trigger | Approval Required |
|------------|---------|:-----------------:|
| DRAFT → PENDING_APPROVAL | User submits | No |
| PENDING_APPROVAL → ACTIVE | Controller approves | Yes |
| PENDING_APPROVAL → REJECTED | Controller rejects | Yes |
| ACTIVE → INACTIVE | Deactivation request | Yes (if posted) |

---

## 7. API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/gl/accounts` | Create account (draft) |
| POST | `/gl/accounts/:id/submit` | Submit for approval |
| POST | `/gl/accounts/:id/approve` | Approve account |
| POST | `/gl/accounts/:id/reject` | Reject account |
| GET | `/gl/accounts` | List/search accounts |
| GET | `/gl/accounts/:id` | Get account details |
| GET | `/gl/accounts/tree` | Get hierarchy tree |
| PUT | `/gl/accounts/:id` | Update account (requires change request for critical fields) |
| POST | `/gl/accounts/:id/deactivate` | Deactivate account |

---

## 8. Integration Points

### With GL-02 (Journal Entry)

```typescript
// GL-02 calls GL-01 to validate accounts
const validation = await coaService.validateAccount(accountCode, tenantId, companyId);
if (!validation.isValid) {
  throw new Error(validation.errorMessage);
}
```

### With GL-03 (Posting Engine)

```typescript
// GL-03 validates all accounts before posting
const accountValidations = await coaService.validateAccountsBatch(accountCodes, tenantId, companyId);
```

---

## 9. Non-Functional Requirements

| Requirement | Target | Measurement |
|-------------|--------|-------------|
| Account lookup latency | < 50ms (cached) | P99 |
| Bulk import throughput | 1000 accounts/minute | With validation |
| Cache hit rate | > 95% | After warm-up |
| Hierarchy tree query | < 200ms | Full tree |

---

## 10. File Structure

```
gl01-chart-of-accounts/
├── __tests__/
│   └── AccountService.test.ts
├── ARCHITECTURE-BRIEF.md         ← This file
├── ARCHITECTURE-REVIEW.md        ← Quality gate review
├── DashboardService.ts           ← COA dashboard metrics
├── errors.ts                     ← Error factory
├── index.ts                      ← Barrel exports
├── AccountService.ts             ← Main domain service
└── PRD-gl01-chart-of-accounts.md ← Requirements
```

---

## 11. Implementation Checklist

- [ ] Create `errors.ts` — Error factory
- [ ] Create `AccountService.ts` — Domain service
- [ ] Create `DashboardService.ts` — Dashboard metrics
- [ ] Create `index.ts` — Barrel exports
- [ ] Create `ARCHITECTURE-REVIEW.md` — Quality gate
- [ ] Create `__tests__/AccountService.test.ts` — Unit tests
- [ ] Add port to `@aibos/kernel-core` (if not using COAPort)
- [ ] Add SQL adapter to `@aibos/kernel-adapters`

---

**📅 Date:** 2025-12-17  
**👤 Author:** AI-BOS Architecture Team
