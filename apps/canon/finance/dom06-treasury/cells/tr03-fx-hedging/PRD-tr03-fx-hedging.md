# PRD: TR-03 FX Hedging

> **Cell Code:** TR-03  
> **Domain:** Treasury (DOM06)  
> **Status:** 📋 Planned  
> **Priority:** P3 (Phase 3)

---

## 📋 Overview

**FX Hedging** manages currency risk through forward contracts, options, and hedging strategies in compliance with IFRS 9.

### AIS Justification
- **Cycle:** Treasury Operations
- **Assertion:** Currency Risk Management
- **Control Objective:** Minimize FX exposure volatility

---

## 🎯 Scope

### In Scope
- [ ] Forward contract management
- [ ] Hedge designation (cash flow, fair value, net investment)
- [ ] Effectiveness testing
- [ ] Mark-to-market valuation
- [ ] Hedge documentation (IFRS 9 compliance)
- [ ] Settlement processing

### Out of Scope
- Spot FX transactions (handled by K_FX)
- Complex derivatives (swaps, options — future phase)
- Trading book (banking book only)

---

## 🔗 Dependencies

| Dependency | Type | Purpose |
|------------|------|---------|
| K_FX | Kernel | FX rate service |
| GL-03 Posting Engine | Downstream | Fair value adjustments, settlements |
| K_TIME | Kernel | Fiscal period validation |
| K_LOG | Kernel | Audit trail |

---

## 📊 Key Features (Planned)

### 1. Contract Management
- Forward contract entry
- Counterparty management
- Maturity tracking
- Settlement instructions

### 2. Hedge Accounting
- Hedge designation workflow
- Prospective effectiveness testing
- Retrospective effectiveness testing
- De-designation handling

### 3. Valuation & Reporting
- Daily MTM calculation
- OCI impact tracking
- Effectiveness ratio monitoring
- IFRS 9 disclosure reports

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

**Last Updated:** December 2025  
**Maintainer:** Finance Cell Team
