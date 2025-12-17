# PRD: TR-05 Bank Reconciliation

> **Cell Code:** TR-05  
> **Domain:** Treasury (DOM06)  
> **Status:** 📋 Planned  
> **Priority:** P3 (Phase 3)

---

## 📋 Overview

**Bank Reconciliation** matches GL bank account balances with bank statement balances, identifying and resolving timing differences.

### AIS Justification
- **Cycle:** Treasury Operations
- **Assertion:** Existence, Completeness, Accuracy
- **Control Objective:** GL ↔ Bank balance tie-out

---

## 🎯 Scope

### In Scope
- [ ] Bank statement import (MT940, BAI2, CSV)
- [ ] Automatic matching rules
- [ ] Manual matching interface
- [ ] Reconciling item management
- [ ] Outstanding check tracking
- [ ] Deposit in transit tracking
- [ ] Period-end reconciliation report

### Out of Scope
- Bank statement fetching (external integration)
- Payment initiation (handled by AP-05)
- Cash forecasting (future module)

---

## 🔗 Dependencies

| Dependency | Type | Purpose |
|------------|------|---------|
| TR-01 Bank Master | Upstream | Bank account configuration |
| GL-05 Trial Balance | Upstream | GL bank balances |
| GL-03 Posting Engine | Downstream | Adjustment entries |
| K_TIME | Kernel | Period cutoff |
| K_LOG | Kernel | Audit trail |

---

## 📊 Key Features (Planned)

### 1. Statement Import
- Multiple format support (MT940, BAI2, CSV)
- Duplicate detection
- Statement history retention
- Import validation rules

### 2. Matching Engine
- Automatic matching algorithms:
  - Exact match (amount + reference)
  - Fuzzy match (amount + date proximity)
  - Many-to-one matching
  - One-to-many matching
- Confidence scoring
- Manual override with approval

### 3. Reconciliation Workflow
- Reconciling item categories:
  - Deposits in transit
  - Outstanding checks
  - Bank errors
  - Book errors
  - Bank charges
  - Interest
- Aging of unreconciled items
- Escalation for stale items

### 4. Reporting
- Daily reconciliation status
- Period-end reconciliation statement
- Variance analysis report
- Outstanding item aging

---

## ⏳ Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| PRD | 📋 Planned | This document |
| ARCHITECTURE-BRIEF | ⬜ Not Started | |
| Service Layer | ⬜ Not Started | |
| Database Schema | ⬜ Not Started | |
| API Routes | ⬜ Not Started | |
| Tests | ⬜ Not Started | |

---

## 🎨 UI Mockup (Planned)

```
┌──────────────────────────────────────────────────────────────────────┐
│  BANK RECONCILIATION — HSBC Operating Account — Nov 2024             │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  GL Balance (Nov 30):           $2,450,000.00                        │
│  + Deposits in Transit:            $125,000.00                       │
│  - Outstanding Checks:            ($85,000.00)                       │
│  +/- Other Reconciling Items:       $1,200.00                        │
│  ─────────────────────────────────────────────                       │
│  Adjusted GL Balance:           $2,491,200.00                        │
│                                                                      │
│  Bank Statement Balance:        $2,491,200.00                        │
│  ─────────────────────────────────────────────                       │
│  Difference:                            $0.00  ✅ RECONCILED         │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│  UNMATCHED ITEMS (5)                                          [Match]│
├──────────────────────────────────────────────────────────────────────┤
│  Bank Statement Items          │  GL Transactions                    │
│  ─────────────────────────────│───────────────────────────────────── │
│  ☐ DEP 11/28 $50,000.00       │  ☐ JE-2024-1234 $50,000.00          │
│  ☐ CHK 11/25 ($15,000.00)     │  ☐ PMT-2024-567 ($15,000.00)        │
│  ☐ FEE 11/30 ($45.00)         │  (No match found)                   │
└──────────────────────────────────────────────────────────────────────┘
```

---

**Last Updated:** December 2025  
**Maintainer:** Finance Cell Team
