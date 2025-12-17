# ARCHITECTURE BRIEF: TR-01 Bank Master

> **Cell Code:** TR-01  
> **Domain:** Treasury (DOM-06)  
> **Version:** 1.0.0  
> **Last Updated:** 2025-12-18

---

## 📋 Overview

The **Bank Master** cell manages the registry of authorized bank accounts used for cash management across the organization.

### Purpose
- Centralized bank account governance
- GL account mapping for cash accounts
- Signatory and access control management
- Bank account verification workflow

---

## 🏗️ Architecture

### Component Structure

```
tr01-bank-master/
├── BankMasterService.ts      # Core business logic
├── DashboardService.ts       # Cell metrics & dashboard
├── types.ts                  # Type definitions
├── errors.ts                 # Domain-specific errors
├── index.ts                  # Barrel exports
├── ARCHITECTURE-BRIEF.md     # This file
└── PRD-tr01-bank-master.md   # Product requirements
```

### State Machine

```
DRAFT ──► VERIFICATION ──► ACTIVE ──► INACTIVE
  │            │              │
  │            │              └──► SUSPENDED ──► ACTIVE
  │            │
  │            └──► REJECTED ──► DRAFT
  │
  └──► CANCELLED
```

---

## 🔌 Ports (Dependencies)

| Port | Purpose | Implementation |
|------|---------|----------------|
| `BankAccountRepositoryPort` | Data persistence | SQL adapter |
| `AuditPort` | Event logging | K_LOG |
| `COAPort` | GL account validation | GL-01 |

---

## ✅ Control Framework

| Control | Implementation |
|---------|----------------|
| **SoD** | Verifier ≠ Creator |
| **Dual Authorization** | Verification workflow |
| **Audit Trail** | All state changes logged |
| **Optimistic Locking** | Version field |
| **Tenant Isolation** | RLS on database |

---

## 🔗 API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/treasury/bank-accounts` | List bank accounts |
| POST | `/api/treasury/bank-accounts` | Create bank account |
| GET | `/api/treasury/bank-accounts/:id` | Get by ID |
| PATCH | `/api/treasury/bank-accounts/:id` | Update bank account |
| POST | `/api/treasury/bank-accounts/:id/submit-verification` | Submit for verification |
| POST | `/api/treasury/bank-accounts/:id/verify` | Complete verification |
| POST | `/api/treasury/bank-accounts/:id/suspend` | Suspend account |
| POST | `/api/treasury/bank-accounts/:id/reactivate` | Reactivate account |

---

## 📊 Database Schema

**Table:** `tr_bank_accounts`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tenant_id | UUID | Tenant isolation |
| company_id | UUID | Company reference |
| bank_name | VARCHAR | Bank name |
| account_number | VARCHAR | Encrypted |
| account_type | ENUM | checking, savings, etc. |
| currency | VARCHAR(3) | ISO 4217 |
| swift_code | VARCHAR(11) | SWIFT/BIC |
| iban | VARCHAR(34) | IBAN |
| gl_account_code | VARCHAR | GL cash account |
| status | ENUM | Lifecycle state |
| version | INTEGER | Optimistic locking |

---

## 🧪 Testing Strategy

1. **Unit Tests:** BankMasterService methods
2. **Integration Tests:** Database operations
3. **E2E Tests:** API route flows
4. **SoD Tests:** Verify creator ≠ verifier enforcement

---

## 📚 Related Documents

- [PRD-tr01-bank-master.md](./PRD-tr01-bank-master.md)
- [170_tr_bank_master.sql](../../../../db/migrations/finance/170_tr_bank_master.sql)

---

**Maintainer:** Finance Cell Team
