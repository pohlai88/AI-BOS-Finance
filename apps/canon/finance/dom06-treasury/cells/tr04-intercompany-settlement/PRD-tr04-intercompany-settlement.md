# PRD: TR-04 Intercompany Settlement

> **Cell Code:** TR-04  
> **Domain:** Treasury (DOM06)  
> **Status:** 📋 Planned  
> **Priority:** P3 (Phase 3)

---

## 📋 Overview

**Intercompany Settlement** manages netting of intercompany balances for consolidated reporting and efficient cash settlement.

### AIS Justification
- **Cycle:** Treasury Operations / Consolidation
- **Assertion:** Intercompany Elimination
- **Control Objective:** Accurate IC balance netting for consolidation

---

## 🎯 Scope

### In Scope
- [ ] IC balance reconciliation
- [ ] Netting calculation
- [ ] Settlement instruction generation
- [ ] Elimination entry creation
- [ ] IC loan tracking
- [ ] Transfer pricing compliance

### Out of Scope
- Full consolidation (separate module)
- Minority interest calculations
- Investment in subsidiary accounting

---

## 🔗 Dependencies

| Dependency | Type | Purpose |
|------------|------|---------|
| AR-02 Sales Invoice | Upstream | IC receivables |
| AP-02 Invoice Entry | Upstream | IC payables |
| GL-03 Posting Engine | Downstream | Elimination entries |
| K_TIME | Kernel | Period cutoff |
| K_LOG | Kernel | Audit trail |

---

## 📊 Key Features (Planned)

### 1. IC Balance Management
- IC account identification
- Automatic pairing (AR ↔ AP)
- Variance detection
- Dispute resolution workflow

### 2. Netting Process
- Multilateral netting calculation
- Settlement currency selection
- Net payment instructions
- Elimination journal entries

### 3. Reporting & Compliance
- IC aging report
- Arm's length documentation
- Elimination matrix
- Period-end IC confirmation

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
