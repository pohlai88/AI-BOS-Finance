# PRD: TR-02 Cash Pooling

> **Cell Code:** TR-02  
> **Domain:** Treasury (DOM06)  
> **Status:** 📋 Planned  
> **Priority:** P3 (Phase 3)

---

## 📋 Overview

**Cash Pooling** manages intercompany cash concentration and sweeping operations to optimize group-wide liquidity.

### AIS Justification
- **Cycle:** Treasury Operations
- **Assertion:** Liquidity Management
- **Control Objective:** Optimal cash utilization across entities

---

## 🎯 Scope

### In Scope
- [ ] Physical pooling (actual fund movement)
- [ ] Notional pooling (interest optimization without movement)
- [ ] Automatic sweep rules
- [ ] Target balance maintenance
- [ ] Intercompany loan tracking
- [ ] Interest calculation and allocation

### Out of Scope
- FX conversion (handled by TR-03)
- Bank statement import (handled by TR-05)
- Manual cash transfers (handled by AP-05)

---

## 🔗 Dependencies

| Dependency | Type | Purpose |
|------------|------|---------|
| TR-01 Bank Master | Upstream | Source/target bank accounts |
| GL-03 Posting Engine | Downstream | Journal entries for sweeps |
| K_TIME | Kernel | Fiscal period validation |
| K_LOG | Kernel | Audit trail |

---

## 📊 Key Features (Planned)

### 1. Pool Configuration
- Master/participant account setup
- Sweep thresholds and target balances
- Frequency (daily, weekly, monthly)
- Priority ordering

### 2. Sweep Execution
- Automatic sweep initiation
- Balance check before sweep
- GL posting on completion
- Notification on failure

### 3. Interest Allocation
- Interest calculation per participant
- Arm's length rate compliance
- Automatic IC loan entries

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
