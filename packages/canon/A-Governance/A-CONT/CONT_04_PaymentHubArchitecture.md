> **🟡 [DRAFT]** — Pending Certification  
> **Canon Code:** CONT_04  
> **Version:** 0.1.0  
> **Created:** 2025-12-15  
> **Plane:** A — Governance (Contract)  
> **Binding Scope:** Payment Hub Cell & Treasury Operations  
> **Authority:** Payment Processing, Multi-Company Treasury, & Approval Workflow Standard

---

# Payment Hub Cell Architecture Standard v0.1.0

> **cell-payment-hub** — The Central Payment Processing Cell for AI-BOS Finance

---

## 1. Purpose & Scope

### 1.1 Purpose

The Payment Hub Cell is the **atomic unit** responsible for:

1. **Payment Processing** — Vendor payments, intercompany settlements, treasury transfers
2. **Multi-Company Approval** — Configurable approval chains per company/amount/type
3. **Multi-Company Treasury** — Centralized cash pooling and fund management
4. **Currency Management** — Multi-currency payments with FX conversion

### 1.2 Target Audience

| Role | Interest |
|------|----------|
| **CTO** | Architecture integrity, Cell boundaries, scalability |
| **CFO** | Approval controls, audit trail, cash visibility |
| **Controller** | GL integration, intercompany reconciliation |
| **Ground Staff** | Payment entry, approval workflow, status tracking |

### 1.3 Core Philosophy

> **"The Payment Hub is a Cell, not a System."**

The Payment Hub:
- Does ONE thing: orchestrate payment lifecycle
- Trusts the Kernel for identity and authorization
- Relies on other Cells for specialized functions (FX, GL, Bank)
- Produces evidence (audit trail) for every action

---

## 2. Cell Architecture (Hexagonal Boundaries)

### 2.1 The Cell Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    PAYMENT HUB CELL                              │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    DOMAIN CORE                           │    │
│  │          (Pure Business Logic — No I/O)                  │    │
│  │                                                          │    │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │    │
│  │  │ PaymentEntity│ │ApprovalRules │ │ FXCalculator │     │    │
│  │  └──────────────┘ └──────────────┘ └──────────────┘     │    │
│  │  ┌──────────────┐ ┌──────────────┐                      │    │
│  │  │IntercoSettler│ │TreasuryPool  │                      │    │
│  │  └──────────────┘ └──────────────┘                      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│  ┌───────────────────────────┼───────────────────────────┐      │
│  │                     PORTS (Interfaces)                 │      │
│  │                                                        │      │
│  │  INBOUND (Driven)              OUTBOUND (Driving)      │      │
│  │  ┌──────────────┐              ┌──────────────┐        │      │
│  │  │ /payments/*  │              │PaymentRepoPort│       │      │
│  │  │ /approvals/* │              │FXRatePort     │       │      │
│  │  │ /treasury/*  │              │BankGatewayPort│       │      │
│  │  │ /interco/*   │              │GLPostingPort  │       │      │
│  │  └──────────────┘              │AuditPort      │       │      │
│  │                                │NotificationPort│      │      │
│  │                                └──────────────┘        │      │
│  └────────────────────────────────────────────────────────┘      │
│                              │                                   │
│  ┌───────────────────────────┼───────────────────────────┐      │
│  │                    ADAPTERS (Implementations)          │      │
│  │                                                        │      │
│  │  INBOUND                       OUTBOUND                │      │
│  │  ┌──────────────┐              ┌──────────────┐        │      │
│  │  │ Express HTTP │              │ PostgresRepo │        │      │
│  │  │ (API Routes) │              │ FXRateAPI    │        │      │
│  │  └──────────────┘              │ BankAPIStub  │        │      │
│  │                                │ GLCellClient │        │      │
│  │                                │ KernelAudit  │        │      │
│  │                                └──────────────┘        │      │
│  └────────────────────────────────────────────────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Dependency Classification

| Category | What It Means | Examples | Failure Mode |
|----------|---------------|----------|--------------|
| **Internal** | Owned by this Cell, in-process | Domain logic, validation, state | Cell restart |
| **External (Reliance)** | Other Cells/Services we call | FX Cell, GL Cell, Bank API | 503 + retry |
| **Output (Dependent)** | Who depends on our output | Reporting Cell, Dashboard, Alerts | Async notification |

### 2.3 Cell Health Model

```typescript
interface PaymentHubHealth {
  service: 'cell-payment-hub';
  status: 'healthy' | 'degraded' | 'unhealthy';
  
  // Internal cells (in-process dependencies)
  cells: {
    database: CellStatus;      // Can we read/write payments?
    processor: CellStatus;     // Is business logic available?
    validator: CellStatus;     // Can we validate payments?
  };
  
  // External dependencies (other services)
  dependencies: {
    kernel: DependencyStatus;      // Can we reach the Kernel?
    fxRateProvider: DependencyStatus;  // Can we get FX rates?
    bankGateway: DependencyStatus;     // Can we send to bank?
    glCell: DependencyStatus;          // Can we post to GL?
  };
}

type CellStatus = 'healthy' | 'degraded' | 'unhealthy';
type DependencyStatus = 'available' | 'degraded' | 'unavailable';
```

---

## 3. Multi-Company Structure

### 3.1 Entity Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                    TENANT (Corporate Group)                      │
│                    Example: "Acme Holdings Ltd"                  │
│                                                                  │
│   ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│   │   COMPANY A     │ │   COMPANY B     │ │   COMPANY C     │   │
│   │   (OpCo SG)     │ │   (OpCo MY)     │ │   (Treasury)    │   │
│   │                 │ │                 │ │                 │   │
│   │ Base: SGD       │ │ Base: MYR       │ │ Base: USD       │   │
│   │ CoA: SG-GAAP    │ │ CoA: MY-GAAP    │ │ CoA: Group      │   │
│   └────────┬────────┘ └────────┬────────┘ └────────┬────────┘   │
│            │                   │                   │             │
│            │     Intercompany  │                   │             │
│            │◄──────────────────┤                   │             │
│            │     Settlements   │                   │             │
│            │                   │                   │             │
│            └───────────────────┼───────────────────┘             │
│                                │                                 │
│                    Treasury Pooling (Cash Concentration)         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Company Configuration

```typescript
interface Company {
  id: string;           // UUID
  tenant_id: string;    // Parent tenant
  code: string;         // 'ACME-SG', 'ACME-MY', 'ACME-TREASURY'
  name: string;         // 'Acme Singapore Pte Ltd'
  type: CompanyType;    // 'operating' | 'holding' | 'treasury'
  base_currency: string; // 'SGD', 'MYR', 'USD'
  
  // Treasury configuration
  treasury_center_id?: string;  // Which company manages our cash?
  pool_participation: boolean;  // Do we participate in cash pooling?
  
  // Approval configuration (per company)
  approval_config: ApprovalConfig;
  
  // Status
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

type CompanyType = 'operating' | 'holding' | 'treasury' | 'dormant';
```

---

## 4. Multi-Company Approval Workflow

### 4.1 Approval Philosophy

> **"Four-Eyes Principle with Role Segregation"**

- **Maker** — Creates payment request
- **Checker** — Reviews and approves (cannot be the same as Maker)
- **Approver L1/L2/L3** — Higher authority based on amount/type

### 4.2 Approval Matrix Model

```typescript
interface ApprovalMatrix {
  id: string;
  tenant_id: string;
  company_id: string;
  
  // What triggers this rule?
  payment_type: PaymentType;      // 'vendor' | 'intercompany' | 'treasury' | 'payroll'
  min_amount: number;             // Threshold start
  max_amount: number | null;      // Threshold end (null = unlimited)
  currency: string;               // 'SGD', '*' for any
  
  // How many approvals needed?
  required_approvals: number;
  
  // Who can approve at each level?
  approval_levels: ApprovalLevel[];
  
  // Special rules
  requires_cfo: boolean;          // Always requires CFO signature?
  requires_dual_signature: boolean; // Needs 2 people at same level?
  weekend_allowed: boolean;       // Can approve on weekends?
  
  // Status
  active: boolean;
  created_at: Date;
}

interface ApprovalLevel {
  level: number;                  // 1, 2, 3
  approver_roles: string[];       // ['finance.approver.l1']
  approver_users?: string[];      // Specific users (override roles)
  sla_hours: number;              // Expected turnaround
  escalation_after_hours?: number; // Auto-escalate if not actioned
}

type PaymentType = 'vendor' | 'intercompany' | 'treasury' | 'payroll' | 'tax';
```

### 4.3 Approval State Machine

```
┌─────────────┐
│   DRAFT     │ ─────────────────────────────────────────┐
└──────┬──────┘                                          │
       │ submit()                                        │
       ▼                                                 │
┌─────────────┐                                          │
│  PENDING    │ ◄────────────────────────────┐          │
│  APPROVAL   │                               │          │
└──────┬──────┘                               │          │
       │                                      │          │
       ├── approve() ──► [Check: All levels done?]      │
       │                        │                        │
       │                 Yes    │    No                  │
       │                  │     │     │                  │
       │                  ▼     │     └──────────────────┘
       │           ┌──────────────┐
       │           │   APPROVED   │
       │           └──────┬───────┘
       │                  │ process()
       │                  ▼
       │           ┌──────────────┐
       │           │  PROCESSING  │
       │           └──────┬───────┘
       │                  │
       │                  ├── success() ──► ┌────────────┐
       │                  │                 │ COMPLETED  │
       │                  │                 └────────────┘
       │                  │
       │                  └── fail() ──────► ┌────────────┐
       │                                     │   FAILED   │
       │                                     └────────────┘
       │
       └── reject() ──────────────────────► ┌────────────┐
                                            │  REJECTED  │
                                            └────────────┘
```

### 4.4 Approval Example (Multi-Company)

```
Scenario: Company A (SG) pays Vendor $50,000 SGD

Approval Matrix for Company A:
- < $10,000: 1 approval (L1 Finance Officer)
- $10,000 - $50,000: 2 approvals (L1 + L2 Finance Manager)
- > $50,000: 3 approvals (L1 + L2 + CFO)

This payment ($50,000) requires:
1. Finance Officer (L1) ✓
2. Finance Manager (L2) ✓
3. CFO (L3) — PENDING

State: PENDING_APPROVAL (waiting for CFO)
```

---

## 5. Multi-Company Treasury

### 5.1 Cash Pooling Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    TREASURY CENTER (Company C)                   │
│                    Master Account: USD                           │
│                                                                  │
│   ┌────────────────────────────────────────────────────────┐    │
│   │              NOTIONAL POOL (Zero Balancing)             │    │
│   │                                                          │    │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │    │
│   │  │ Company A    │  │ Company B    │  │ Company C    │  │    │
│   │  │ SGD Account  │  │ MYR Account  │  │ USD Account  │  │    │
│   │  │              │  │              │  │ (Master)     │  │    │
│   │  │ Balance: +50K│  │ Balance: -30K│  │ Balance: +80K│  │    │
│   │  │              │  │              │  │              │  │    │
│   │  │ ◄── Sweep ──►│  │ ◄── Fund ───►│  │              │  │    │
│   │  └──────────────┘  └──────────────┘  └──────────────┘  │    │
│   │                                                          │    │
│   │  Pool Total: +100K (Net position)                        │    │
│   │                                                          │    │
│   └────────────────────────────────────────────────────────┘    │
│                                                                  │
│   Daily Operations:                                              │
│   1. Sweep: Move excess from OpCos → Treasury                   │
│   2. Fund: Move deficit to OpCos ← Treasury                     │
│   3. Intercompany Loan: Create I/C receivable/payable           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Treasury Operations

| Operation | Description | GL Impact |
|-----------|-------------|-----------|
| **Sweep** | Move excess cash to Treasury | Dr: I/C Receivable (OpCo), Cr: Cash (OpCo) |
| **Fund** | Provide cash from Treasury | Dr: Cash (OpCo), Cr: I/C Payable (OpCo) |
| **Pool Interest** | Allocate interest on pool | Based on daily balances |
| **Netting** | Settle I/C balances | Reduce gross I/C positions |

### 5.3 Treasury Configuration

```typescript
interface TreasuryConfig {
  id: string;
  tenant_id: string;
  treasury_company_id: string;  // Which company is the Treasury Center?
  
  // Pooling configuration
  pooling_type: 'notional' | 'physical' | 'hybrid';
  sweep_threshold: number;      // Min balance to trigger sweep
  fund_threshold: number;       // Min balance before funding
  
  // Intercompany loan terms
  ic_interest_rate: number;     // e.g., 0.05 = 5%
  ic_interest_calc: 'daily' | 'monthly';
  
  // Currencies managed
  managed_currencies: string[]; // ['SGD', 'MYR', 'USD']
  base_currency: string;        // Reporting currency
  
  // Automation
  auto_sweep: boolean;
  auto_fund: boolean;
  sweep_time: string;           // '18:00' (daily sweep time)
}
```

---

## 6. Currency & FX Management

### 6.1 Multi-Currency Payment Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    PAYMENT: $10,000 USD                          │
│                    From: Company A (Base: SGD)                   │
│                    To: US Vendor                                 │
│                                                                  │
│   Step 1: Create Payment                                         │
│   ┌────────────────────────────────────────────────────────┐    │
│   │ Payment Amount: USD 10,000                              │    │
│   │ Company Base Currency: SGD                              │    │
│   │ FX Rate (USD/SGD): 1.35                                 │    │
│   │ Functional Amount: SGD 13,500                           │    │
│   └────────────────────────────────────────────────────────┘    │
│                                                                  │
│   Step 2: Book FX                                                │
│   ┌────────────────────────────────────────────────────────┐    │
│   │ Option A: Spot Rate (Market rate at execution)          │    │
│   │ Option B: Forward Rate (Pre-booked hedge)               │    │
│   │ Option C: Internal Rate (Treasury provided)             │    │
│   └────────────────────────────────────────────────────────┘    │
│                                                                  │
│   Step 3: GL Posting                                             │
│   ┌────────────────────────────────────────────────────────┐    │
│   │ Dr: Vendor Payable (USD 10,000 / SGD 13,500)           │    │
│   │ Cr: Bank USD (USD 10,000)                               │    │
│   │ Dr/Cr: FX Gain/Loss (if rate differs from booking)     │    │
│   └────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 FX Rate Source Hierarchy

| Priority | Source | Use Case |
|----------|--------|----------|
| 1 | Contracted Rate | Pre-agreed rate with bank/vendor |
| 2 | Treasury Rate | Internal rate from Treasury Center |
| 3 | Market Rate | Real-time rate from FX provider |
| 4 | Fallback Rate | Yesterday's closing rate |

### 6.3 FX Rate Port Interface

```typescript
interface FXRatePort {
  // Get current rate
  getRate(from: string, to: string, date?: Date): Promise<FXRate>;
  
  // Get historical rates (for reporting)
  getHistoricalRates(from: string, to: string, startDate: Date, endDate: Date): Promise<FXRate[]>;
  
  // Book a rate (lock in for future payment)
  bookRate(from: string, to: string, amount: number, valueDate: Date): Promise<BookedRate>;
}

interface FXRate {
  from_currency: string;
  to_currency: string;
  rate: number;
  source: 'contracted' | 'treasury' | 'market' | 'fallback';
  timestamp: Date;
  valid_until: Date;
}
```

---

## 7. Integration Points (Cell Boundaries)

### 7.1 Inbound (What We Receive)

| Endpoint | Source | Payload | Response |
|----------|--------|---------|----------|
| `POST /payments` | UI/API | PaymentRequest | PaymentResponse |
| `POST /payments/:id/approve` | Approver | ApprovalDecision | ApprovalResult |
| `POST /payments/:id/execute` | Scheduler/Manual | ExecutionRequest | ExecutionResult |
| `GET /payments` | UI/Reports | Query params | PaymentList |
| `POST /treasury/sweep` | Scheduler | SweepRequest | SweepResult |
| `POST /interco/settle` | Manual/Scheduler | SettlementRequest | SettlementResult |

### 7.2 Outbound (What We Call)

| Dependency | Port | Adapter | Fallback |
|------------|------|---------|----------|
| **Database** | PaymentRepoPort | PostgresAdapter | N/A (critical) |
| **FX Rates** | FXRatePort | ExternalFXAdapter | Fallback rates |
| **Bank Gateway** | BankGatewayPort | SwiftAdapter / WiseAdapter | Queue for retry |
| **GL Posting** | GLPostingPort | GLCellClient | Queue for later |
| **Audit** | AuditPort | KernelAuditClient | Local log + queue |
| **Notifications** | NotificationPort | EmailAdapter / SlackAdapter | Best effort |

### 7.3 Events Published (What Others Depend On)

| Event | When | Subscribers |
|-------|------|-------------|
| `payment.created` | New payment submitted | Dashboard, Notifications |
| `payment.approved` | Approval completed | Dashboard, Scheduler |
| `payment.executed` | Bank transfer sent | GL Cell, Notifications |
| `payment.completed` | Bank confirmed | Dashboard, Reports |
| `payment.failed` | Execution failed | Alerts, Retry Handler |
| `treasury.sweep.completed` | Daily sweep done | Reports, I/C Reconciliation |
| `interco.settled` | I/C settlement done | Both companies' GL |

---

## 8. Data Model

### 8.1 Core Entities

```sql
-- Companies (per tenant)
CREATE TABLE finance.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  code VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('operating', 'holding', 'treasury', 'dormant')),
  base_currency CHAR(3) NOT NULL,
  treasury_center_id UUID REFERENCES finance.companies(id),
  pool_participation BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, code)
);

-- Payments
CREATE TABLE finance.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES finance.companies(id),
  
  -- Payment details
  payment_type VARCHAR(20) NOT NULL,  -- 'vendor', 'intercompany', 'treasury', 'payroll'
  reference VARCHAR(50) NOT NULL,
  description TEXT,
  
  -- Amounts
  amount DECIMAL(18,2) NOT NULL,
  currency CHAR(3) NOT NULL,
  fx_rate DECIMAL(18,8),
  functional_amount DECIMAL(18,2),  -- In company base currency
  
  -- Beneficiary
  beneficiary_type VARCHAR(20) NOT NULL,  -- 'vendor', 'employee', 'company'
  beneficiary_id UUID,
  beneficiary_name VARCHAR(255) NOT NULL,
  beneficiary_bank_account VARCHAR(50),
  
  -- For intercompany
  counterparty_company_id UUID REFERENCES finance.companies(id),
  
  -- Scheduling
  value_date DATE NOT NULL,
  payment_method VARCHAR(20),  -- 'wire', 'ach', 'check', 'internal'
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  current_approval_level INTEGER DEFAULT 0,
  required_approval_levels INTEGER NOT NULL,
  
  -- Audit
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_status CHECK (status IN (
    'draft', 'pending_approval', 'approved', 'processing', 
    'completed', 'failed', 'rejected', 'cancelled'
  ))
);

-- Payment Approvals
CREATE TABLE finance.payment_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES finance.payments(id),
  
  -- Approval details
  level INTEGER NOT NULL,
  approver_id UUID NOT NULL,
  decision VARCHAR(20) NOT NULL,  -- 'approved', 'rejected'
  comments TEXT,
  
  -- Timing
  requested_at TIMESTAMPTZ NOT NULL,
  actioned_at TIMESTAMPTZ DEFAULT NOW(),
  sla_hours INTEGER,
  
  CONSTRAINT valid_decision CHECK (decision IN ('approved', 'rejected'))
);

-- Approval Matrices
CREATE TABLE finance.approval_matrices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES finance.companies(id),
  
  -- Matching criteria
  payment_type VARCHAR(20) NOT NULL,
  min_amount DECIMAL(18,2) NOT NULL,
  max_amount DECIMAL(18,2),
  currency CHAR(3) DEFAULT '*',
  
  -- Approval requirements
  required_approvals INTEGER NOT NULL DEFAULT 1,
  approval_levels JSONB NOT NULL,  -- Array of {level, roles, sla_hours}
  
  -- Special rules
  requires_cfo BOOLEAN DEFAULT FALSE,
  requires_dual_signature BOOLEAN DEFAULT FALSE,
  weekend_allowed BOOLEAN DEFAULT TRUE,
  
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FX Rates
CREATE TABLE finance.fx_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  from_currency CHAR(3) NOT NULL,
  to_currency CHAR(3) NOT NULL,
  rate DECIMAL(18,8) NOT NULL,
  
  source VARCHAR(20) NOT NULL,  -- 'market', 'treasury', 'contracted'
  effective_date DATE NOT NULL,
  expiry_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (tenant_id, from_currency, to_currency, effective_date, source)
);

-- Intercompany Settlements
CREATE TABLE finance.intercompany_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  from_company_id UUID NOT NULL REFERENCES finance.companies(id),
  to_company_id UUID NOT NULL REFERENCES finance.companies(id),
  
  amount DECIMAL(18,2) NOT NULL,
  currency CHAR(3) NOT NULL,
  
  -- Related payments
  payment_ids UUID[] NOT NULL,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  settled_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Treasury Pool Balances (Daily snapshot)
CREATE TABLE finance.treasury_pool_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  balance_date DATE NOT NULL,
  
  company_id UUID NOT NULL REFERENCES finance.companies(id),
  currency CHAR(3) NOT NULL,
  
  opening_balance DECIMAL(18,2) NOT NULL,
  sweep_amount DECIMAL(18,2) DEFAULT 0,
  fund_amount DECIMAL(18,2) DEFAULT 0,
  closing_balance DECIMAL(18,2) NOT NULL,
  
  pool_position DECIMAL(18,2),  -- Net position in pool
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (tenant_id, company_id, currency, balance_date)
);
```

---

## 9. API Specification

### 9.1 Payment Endpoints

```yaml
# Create Payment
POST /payments
Authorization: Bearer {jwt}
x-tenant-id: {tenant_id}
x-correlation-id: {correlation_id}

Request:
{
  "company_id": "uuid",
  "payment_type": "vendor",
  "reference": "INV-2024-001",
  "amount": 10000.00,
  "currency": "SGD",
  "beneficiary_name": "Acme Supplies",
  "beneficiary_bank_account": "1234567890",
  "value_date": "2024-12-20",
  "description": "Office supplies Q4"
}

Response:
{
  "id": "uuid",
  "status": "pending_approval",
  "required_approval_levels": 2,
  "current_approval_level": 0,
  "created_at": "2024-12-15T10:00:00Z"
}

# Approve Payment
POST /payments/{id}/approve
Authorization: Bearer {jwt}

Request:
{
  "decision": "approved",
  "comments": "Verified invoice and PO match"
}

Response:
{
  "payment_id": "uuid",
  "approval_id": "uuid",
  "status": "pending_approval",  // or "approved" if final
  "current_approval_level": 1,
  "remaining_approvals": 1
}
```

### 9.2 Treasury Endpoints

```yaml
# Execute Daily Sweep
POST /treasury/sweep
Authorization: Bearer {jwt} (requires: treasury.sweep.execute)

Request:
{
  "sweep_date": "2024-12-15",
  "companies": ["uuid-a", "uuid-b"]  // Optional: specific companies
}

Response:
{
  "sweep_id": "uuid",
  "sweep_date": "2024-12-15",
  "movements": [
    {
      "company_id": "uuid-a",
      "amount": 50000.00,
      "currency": "SGD",
      "direction": "to_treasury"
    }
  ],
  "total_swept": 50000.00
}
```

---

## 10. MVP Scope

### 10.1 Phase 1: Foundation (5 days)

| Item | Priority | Effort |
|------|----------|--------|
| Company management (CRUD) | P0 | 1 day |
| Payment creation & status | P0 | 2 days |
| Basic approval workflow (single level) | P0 | 2 days |

### 10.2 Phase 2: Multi-Company (5 days)

| Item | Priority | Effort |
|------|----------|--------|
| Multi-level approval matrix | P0 | 2 days |
| Intercompany payments | P0 | 2 days |
| Basic treasury sweep | P1 | 1 day |

### 10.3 Phase 3: Production Ready (5 days)

| Item | Priority | Effort |
|------|----------|--------|
| FX rate integration | P1 | 2 days |
| GL posting integration | P1 | 2 days |
| Reporting views | P2 | 1 day |

### 10.4 Deferred to v1.1.0

- Bank gateway integration (Swift/SEPA)
- Physical cash pooling
- Hedge booking
- Payment scheduling automation
- Mobile approval app

---

## 11. Testing Strategy

### 11.1 Critical Test Scenarios

| Scenario | Expected Outcome |
|----------|------------------|
| Payment < L1 threshold | 1 approval required |
| Payment > L2 threshold | 2 approvals required |
| Same user creates & approves | Rejected (Maker ≠ Checker) |
| Intercompany payment | Both companies get GL entry |
| Payment in foreign currency | FX rate applied correctly |
| Approver not in role | 403 Forbidden |
| Cell database unavailable | 503 + retry mechanism |

### 11.2 Chaos Testing

```bash
# Break database cell
POST /chaos/fail/database

# Verify graceful degradation
POST /payments  # Should return 503

# Recover
POST /chaos/recover/database
```

---

## 12. Security Considerations

### 12.1 Required Permissions

| Action | Permission |
|--------|------------|
| Create payment | `finance.payment.create` |
| Approve L1 | `finance.payment.approve.l1` |
| Approve L2 | `finance.payment.approve.l2` |
| Approve L3 (CFO) | `finance.payment.approve.l3` |
| Execute treasury sweep | `treasury.sweep.execute` |
| View all payments | `finance.payment.read` |
| Cancel payment | `finance.payment.cancel` |

### 12.2 Segregation of Duties

- **Maker ≠ Checker**: Same user cannot create and approve
- **Amount Limits**: Higher amounts require senior approval
- **Intercompany**: Requires approval from both companies (optionally)

---

**End of Contract CONT_04 v0.1.0**

---

**Next Steps:**
1. Review and certify this document with CFO/Controller
2. Create `PRD-PAYMENT-HUB-MVP.md` with sprint breakdown
3. Implement Phase 1 (Foundation) first
