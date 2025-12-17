# AR-01: Customer Master Cell — Product Requirements Document

> **🟢 [ACTIVE]** — IMMORTAL-Grade Certified  
> **Cell Code:** AR-01  
> **Version:** 1.1.0  
> **Certified Date:** 2025-12-17  
> **Plane:** C — Data & Logic (Cell)  
> **Binding Scope:** Accounts Receivable Molecule  
> **Authority:** CONT_07 (Finance Canon Architecture)  
> **Derives From:** CONT_07, CONT_10 (BioSkin Architecture)

## 🔥 IMMORTAL-Grade Enhancements (v1.1.0)

| Enhancement | Pattern | Description |
|-------------|---------|-------------|
| **Transactional Audit** | P1 | Audit outbox pattern for at-least-once delivery |
| **Tenant Isolation** | P1 | Composite FKs for addresses/contacts/credit_history |
| **Complete Immutability** | P1 | ALL fields blocked for archived customers (not just status) |
| **Privileged SoD** | P1 | SoD enforcement on suspend/reactivate/archive actions |

---

## 📋 Document Control

| Property | Value |
|----------|-------|
| **Cell Code** | AR-01 |
| **Cell Name** | Customer Master |
| **Molecule** | Accounts Receivable (dom04-accounts-receivable) |
| **Version** | 1.1.0 |
| **Status** | 🟢 ACTIVE (IMMORTAL-Grade) |
| **Location** | `apps/canon/finance/dom04-accounts-receivable/cells/ar01-customer-master/` |
| **Author** | Finance Cell Team |
| **Last Updated** | 2025-12-17 |
| **Quality Bar** | IMMORTAL-Grade / ICFR-Ready / Audit-Ready |

---

## 1. Executive Summary

The Customer Master Cell (AR-01) provides an **approved-customer registry** to prevent phantom customers and protect revenue recognition (medium fraud risk). It enforces **Segregation of Duties (SoD)** between customer creation (Maker) and customer approval (Checker), ensuring that only validated customers can receive invoices and credit.

### 1.1 Problem Statement

| Issue | Evidence | Impact |
|-------|----------|--------|
| **Phantom Customers** | Invoices to non-existent customers | Revenue fraud, bad debt exposure |
| **Unauthorized Credit Limits** | Credit limit changes without approval | Bad debt risk, cash flow impact |
| **No SoD Enforcement** | Same user creates and approves customers | Internal control violation |
| **Missing Audit Trail** | Customer changes not tracked | Compliance failure |

### 1.2 Solution

A governed customer registry with:
- **State Machine:** `draft → submitted → approved → suspended → archived`
- **SoD Enforcement:** Maker ≠ Checker (database constraint)
- **Credit Limit Change Control:** Separate approval workflow for credit limit changes
- **Immutable Audit Trail:** Every mutation logged in `kernel.audit_events`
- **Risk Flagging:** Credit risk scoring, payment history, collection status

---

## 2. Purpose & Outcomes

### 2.1 Objective

Provide an **approved-customer registry** to prevent phantom customers and protect revenue recognition (medium fraud risk).

### 2.2 Outcomes

| Outcome | Success Criteria |
|---------|------------------|
| **Invoices/credit notes cannot proceed unless customer is valid/approved** | FK constraint + trigger validation: `ar.invoices.customer_id` → `ar.customers.id` with trigger enforcing `status = 'approved'` |
| **Customer changes are auditable** | 100% audit event coverage for all mutations (see Event Taxonomy below) |
| **SoD is architecturally enforced** | Database constraint: `approved_by != created_by` for all privileged actions |
| **Credit limit changes require separate approval** | Credit limit change requests create separate approval workflow |

---

## 3. Scope

### 3.1 In-Scope

| Feature | Description | Priority |
|---------|-------------|----------|
| **Customer Onboarding** | Create/update customer profile (legal name, tax ID, registration) | P0 |
| **Billing Address Management** | Multiple billing addresses per customer | P0 |
| **Contact Management** | Primary and secondary contacts (name, email, phone) | P0 |
| **Credit Limit Management** | Set/change credit limits with controlled change process | P0 |
| **Payment Terms Configuration** | Payment terms (Net 30, Net 60, 2/10 Net 30, etc.) | P0 |
| **Customer Status Lifecycle** | `draft → submitted → approved → suspended → archived` | P0 |
| **Customer Segmentation** | Category classification (Enterprise, SMB, Retail, Wholesale) | P1 |
| **Payment Method Preferences** | Preferred payment methods (Check, Wire, ACH, Card) | P1 |
| **Customer Risk Flags** | Credit risk scoring, payment history, collection status | P1 |
| **Dunning Configuration** | Customer-specific dunning rules and schedules | P2 |
| **SoD Enforcement** | Maker ≠ Checker (database constraint) | P0 |
| **Audit Trail** | Every mutation → `kernel.audit_events` | P0 |

### 3.2 Out-of-Scope (Phase Later)

| Feature | Reason | Target |
|---------|--------|--------|
| **Customer Portal** | Self-service access | v2.0.0 |
| **Customer Self-Service** | External customer access | v2.0.0 |
| **Credit Bureau Integration** | External dependency | v1.1.0 |
| **Advanced Credit Scoring** | Requires ML/analytics module | v1.2.0 |
| **Customer Performance Analytics** | Analytics feature | v1.3.0 |

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
│ approved │ ← Can receive invoices/credit
└────┬─────┘
     │ suspend()
     ▼
┌──────────┐
│suspended │ ← Blocked from invoices/credit
└────┬─────┘
     │ reactivate() → approved
     │ archive()
     ▼
┌──────────┐
│ archived │ ← Historical record (read-only)
└──────────┘
```

### 4.1 States

| Status | Description | Immutable? | Terminal? | Can Receive Invoices? |
|--------|-------------|------------|-----------|----------------------|
| `draft` | Customer being prepared | No | No | ❌ No |
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
│  /api/ar/customers/*                                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Cell Services                                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────────────────┐│
│  │CustomerService│ │ApprovalService│ │CreditLimitService       ││
│  └──────────────┘ └──────────────┘ └─────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Ports (Interfaces)                                              │
│  CustomerRepositoryPort, AuditPort, PolicyPort, AuthPort        │
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
| **Domain** | CustomerService | Business logic, state transitions |
| **Domain** | ApprovalService | SoD enforcement, approval workflow |
| **Domain** | CreditLimitService | Credit limit change control |
| **Outbound** | CustomerRepositoryPort | Data persistence |
| **Outbound** | AuditPort (K_LOG) | Immutable audit trail |
| **Outbound** | PolicyPort (K_POLICY) | Approval rules, credit policies |
| **Outbound** | AuthPort (K_AUTH) | Permission checks |
| **Outbound** | SequencePort (K_SEQ) | Customer code generation |

---

## 6. Data Model

### 6.1 Core Tables

```sql
-- ar.customers
CREATE TABLE IF NOT EXISTS ar.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  
  -- Identification
  customer_code VARCHAR(50) NOT NULL,  -- Generated by K_SEQ
  legal_name TEXT NOT NULL,
  display_name TEXT,
  tax_id VARCHAR(50),
  registration_number VARCHAR(50),
  
  -- Classification
  country VARCHAR(3) NOT NULL,  -- ISO 3166-1 alpha-3
  currency_preference VARCHAR(3) NOT NULL DEFAULT 'USD',  -- ISO 4217
  customer_category VARCHAR(50),
  risk_level VARCHAR(20) DEFAULT 'LOW',  -- LOW, MEDIUM, HIGH
  
  -- Status Machine
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'submitted', 'approved', 'suspended', 'archived'
  )),
  
  -- Credit & Payment Terms
  credit_limit NUMERIC(19,4) DEFAULT 0,  -- Maximum credit allowed
  current_balance NUMERIC(19,4) DEFAULT 0,  -- Current AR balance (updated by posting engine)
  available_credit NUMERIC(19,4) GENERATED ALWAYS AS (credit_limit - current_balance) STORED,
  default_payment_terms INTEGER DEFAULT 30,  -- Days (Net 30, Net 60, etc.)
  
  -- Ledger Reconciliation (to detect drift)
  last_balance_updated_at TIMESTAMPTZ,  -- Last posting engine update
  last_reconciled_at TIMESTAMPTZ,  -- Last manual reconciliation
  
  -- Risk Flags
  credit_risk_score INTEGER DEFAULT 0,  -- 0-100 (higher = riskier)
  payment_history_flag VARCHAR(20),  -- GOOD, WARNING, POOR
  collection_status VARCHAR(20),  -- CURRENT, OVERDUE, COLLECTION
  
  -- Audit
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  version INTEGER DEFAULT 1,  -- Optimistic locking
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT uq_customer_code_tenant UNIQUE (tenant_id, customer_code),
  CONSTRAINT uq_customer_tax_id_tenant UNIQUE (tenant_id, tax_id) WHERE tax_id IS NOT NULL,
  CONSTRAINT chk_credit_limit_positive CHECK (credit_limit >= 0),
  CONSTRAINT chk_available_credit_non_negative CHECK (available_credit >= 0),
  
  -- ✅ IMMORTAL v1.1.0: Tenant isolation for composite FK references
  CONSTRAINT uq_customer_tenant_id UNIQUE (tenant_id, id),
  
  -- SoD Constraint: Approver must be different from creator (for approval action)
  CONSTRAINT chk_sod_approval CHECK (
    (status = 'approved' AND approved_by IS NOT NULL AND approved_by != created_by) OR
    (status != 'approved')
  ),
  
  -- Tenant Isolation: Ensure tenant_id matches for integrity
  CONSTRAINT chk_tenant_company_match CHECK (
    company_id IS NULL OR 
    EXISTS (SELECT 1 FROM finance.companies WHERE id = company_id AND tenant_id = ar.customers.tenant_id)
  )
);

-- Trigger: Enforce approved-customer-only for invoices/credit notes
CREATE OR REPLACE FUNCTION ar.fn_validate_approved_customer()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM ar.customers 
    WHERE id = NEW.customer_id AND status = 'approved'
  ) THEN
    RAISE EXCEPTION 'Cannot create transaction for customer (%) - customer must be approved (current status: %)',
      NEW.customer_id,
      (SELECT status FROM ar.customers WHERE id = NEW.customer_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ✅ IMMORTAL v1.1.0: Complete immutability trigger (blocks ALL fields for archived)
CREATE OR REPLACE FUNCTION ar.fn_prevent_archived_customer_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Archived is completely immutable (terminal state)
  IF OLD.status = 'archived' THEN
    RAISE EXCEPTION 'Cannot modify archived customer (%) - archived status is terminal and completely immutable. No field changes allowed.', OLD.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_archived_update
  BEFORE UPDATE ON ar.customers
  FOR EACH ROW
  WHEN (OLD.status = 'archived')
  EXECUTE FUNCTION ar.fn_prevent_archived_customer_update();

-- Trigger: Audit privileged actions (SoD enforcement beyond approval)
CREATE OR REPLACE FUNCTION ar.fn_audit_privileged_customer_action()
RETURNS TRIGGER AS $$
BEGIN
  -- For suspend/reactivate/archive actions, enforce SoD
  IF NEW.status IN ('suspended', 'archived') AND OLD.status != NEW.status THEN
    IF NEW.updated_by = NEW.created_by THEN
      RAISE EXCEPTION 'SoD violation: Cannot perform privileged action on own customer (customer: %, action: % → %, actor: %)',
        NEW.id, OLD.status, NEW.status, NEW.updated_by;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_privileged_action
  BEFORE UPDATE ON ar.customers
  FOR EACH ROW
  WHEN (NEW.status IN ('approved', 'suspended', 'archived') AND OLD.status != NEW.status)
  EXECUTE FUNCTION ar.fn_audit_privileged_customer_action();

-- ar.customer_credit_history
CREATE TABLE IF NOT EXISTS ar.customer_credit_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- Credit Limit Change
  old_credit_limit NUMERIC(19,4),
  new_credit_limit NUMERIC(19,4) NOT NULL,
  change_reason TEXT NOT NULL,
  
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
  CONSTRAINT chk_sod_credit_change CHECK (
    (change_request_status = 'approved' AND change_approved_by IS NOT NULL AND 
     change_approved_by != change_requested_by) OR
    (change_request_status != 'approved')
  ),
  
  -- ✅ IMMORTAL v1.1.0: Composite FK for tenant isolation
  CONSTRAINT fk_credit_history_customer_tenant FOREIGN KEY (tenant_id, customer_id)
    REFERENCES ar.customers(tenant_id, id) ON DELETE CASCADE
);

-- ar.customer_addresses (Billing/Shipping addresses)
CREATE TABLE IF NOT EXISTS ar.customer_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL,
  tenant_id UUID NOT NULL,  -- Must match customer's tenant_id
  
  -- Address Details
  address_type VARCHAR(20) NOT NULL CHECK (address_type IN ('billing', 'shipping', 'both')),
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city VARCHAR(100) NOT NULL,
  state_province VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(3) NOT NULL,  -- ISO 3166-1 alpha-3
  
  -- Flags
  is_primary BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1,
  
  -- Constraints
  CONSTRAINT uq_customer_primary_address UNIQUE (customer_id, address_type, is_primary) 
    WHERE is_primary = TRUE,
  
  -- ✅ IMMORTAL v1.1.0: Composite FK for tenant isolation (replaces CHECK constraint)
  CONSTRAINT fk_address_customer_tenant FOREIGN KEY (tenant_id, customer_id)
    REFERENCES ar.customers(tenant_id, id) ON DELETE CASCADE
);

-- ar.customer_contacts (Contact persons)
CREATE TABLE IF NOT EXISTS ar.customer_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- Contact Details
  contact_type VARCHAR(20) NOT NULL CHECK (contact_type IN ('billing', 'accounts', 'general', 'executive')),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  title VARCHAR(100),
  
  -- Flags
  is_primary BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  receives_invoices BOOLEAN DEFAULT FALSE,
  receives_statements BOOLEAN DEFAULT FALSE,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1,
  
  -- ✅ IMMORTAL v1.1.0: Composite FK for tenant isolation (replaces CHECK constraint)
  CONSTRAINT fk_contact_customer_tenant FOREIGN KEY (tenant_id, customer_id)
    REFERENCES ar.customers(tenant_id, id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_customers_tenant_status ON ar.customers(tenant_id, status);
CREATE INDEX idx_customers_tax_id ON ar.customers(tenant_id, tax_id) WHERE tax_id IS NOT NULL;
CREATE INDEX idx_customers_credit_limit ON ar.customers(tenant_id, credit_limit) WHERE credit_limit > 0;
CREATE INDEX idx_customers_collection_status ON ar.customers(tenant_id, collection_status) WHERE collection_status != 'CURRENT';
CREATE INDEX idx_customer_credit_history_customer ON ar.customer_credit_history(customer_id);
CREATE INDEX idx_customer_credit_history_tenant ON ar.customer_credit_history(tenant_id);
CREATE INDEX idx_customer_addresses_customer ON ar.customer_addresses(customer_id);
CREATE INDEX idx_customer_contacts_customer ON ar.customer_contacts(customer_id);

-- ✅ IMMORTAL v1.1.0: Transactional Audit Outbox (at-least-once guarantee)
-- Events are written to outbox within the same transaction, then dispatched async
CREATE TABLE IF NOT EXISTS ar.customer_audit_outbox (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  
  -- Event Envelope
  event_type VARCHAR(100) NOT NULL,  -- 'CUSTOMER_CREATED', 'CUSTOMER_APPROVED', etc.
  event_payload JSONB NOT NULL,       -- Full event data
  aggregate_id UUID NOT NULL,         -- Customer ID
  aggregate_type VARCHAR(50) NOT NULL DEFAULT 'Customer',
  
  -- Dispatch State
  dispatched BOOLEAN DEFAULT FALSE,
  dispatched_at TIMESTAMPTZ,
  dispatch_attempts INTEGER DEFAULT 0,
  last_error TEXT,
  
  -- Ordering & Idempotency
  sequence_number BIGINT NOT NULL,  -- Monotonic per tenant
  correlation_id UUID,               -- For request tracing
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT uq_customer_outbox_sequence UNIQUE (tenant_id, sequence_number)
);

CREATE INDEX idx_customer_outbox_pending ON ar.customer_audit_outbox(tenant_id, dispatched, created_at)
  WHERE dispatched = FALSE;

-- Trigger: Auto-populate outbox on customer mutations
CREATE OR REPLACE FUNCTION ar.fn_customer_audit_outbox()
RETURNS TRIGGER AS $$
DECLARE
  next_seq BIGINT;
  event_type VARCHAR(100);
BEGIN
  -- Determine event type
  IF TG_OP = 'INSERT' THEN
    event_type := 'CUSTOMER_CREATED';
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      event_type := 'CUSTOMER_STATUS_CHANGED';
      IF NEW.status = 'submitted' THEN
        event_type := 'CUSTOMER_SUBMITTED';
      ELSIF NEW.status = 'approved' THEN
        event_type := 'CUSTOMER_APPROVED';
      ELSIF NEW.status = 'suspended' THEN
        event_type := 'CUSTOMER_SUSPENDED';
      ELSIF NEW.status = 'archived' THEN
        event_type := 'CUSTOMER_ARCHIVED';
      END IF;
    ELSIF OLD.credit_limit IS DISTINCT FROM NEW.credit_limit THEN
      event_type := 'CUSTOMER_CREDIT_LIMIT_CHANGED';
    ELSE
      event_type := 'CUSTOMER_UPDATED';
    END IF;
  END IF;
  
  -- Get next sequence number
  SELECT COALESCE(MAX(sequence_number), 0) + 1 INTO next_seq
  FROM ar.customer_audit_outbox
  WHERE tenant_id = NEW.tenant_id;
  
  -- Write to outbox (same transaction)
  INSERT INTO ar.customer_audit_outbox (
    tenant_id, event_type, event_payload, aggregate_id, sequence_number, correlation_id
  ) VALUES (
    NEW.tenant_id,
    event_type,
    jsonb_build_object(
      'customer_id', NEW.id,
      'customer_code', NEW.customer_code,
      'legal_name', NEW.legal_name,
      'status', NEW.status,
      'old_status', CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END,
      'credit_limit', NEW.credit_limit,
      'old_credit_limit', CASE WHEN TG_OP = 'UPDATE' THEN OLD.credit_limit ELSE NULL END,
      'actor', COALESCE(NEW.approved_by, NEW.created_by),
      'timestamp', NOW()
    ),
    NEW.id,
    next_seq,
    gen_random_uuid()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_customer_audit_outbox
  AFTER INSERT OR UPDATE ON ar.customers
  FOR EACH ROW
  EXECUTE FUNCTION ar.fn_customer_audit_outbox();

-- ✅ IMMORTAL v1.1.0: Tenant isolation trigger for child tables (belt-and-suspenders)
CREATE OR REPLACE FUNCTION ar.fn_validate_customer_child_tenant()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM ar.customers 
    WHERE id = NEW.customer_id AND tenant_id = NEW.tenant_id
  ) THEN
    RAISE EXCEPTION 'Tenant isolation violation: %.tenant_id (%) does not match customer tenant', 
      TG_TABLE_NAME, NEW.tenant_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_address_tenant
  BEFORE INSERT OR UPDATE ON ar.customer_addresses
  FOR EACH ROW
  EXECUTE FUNCTION ar.fn_validate_customer_child_tenant();

CREATE TRIGGER trg_validate_contact_tenant
  BEFORE INSERT OR UPDATE ON ar.customer_contacts
  FOR EACH ROW
  EXECUTE FUNCTION ar.fn_validate_customer_child_tenant();

CREATE TRIGGER trg_validate_credit_history_tenant
  BEFORE INSERT OR UPDATE ON ar.customer_credit_history
  FOR EACH ROW
  EXECUTE FUNCTION ar.fn_validate_customer_child_tenant();
```

### 6.2 Key Fields

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `customer_code` | VARCHAR(50) | Unique customer identifier | Generated by K_SEQ |
| `legal_name` | TEXT | Legal entity name | Required, min 2 chars |
| `tax_id` | VARCHAR(50) | Tax identification number | Optional, unique per tenant |
| `status` | VARCHAR(20) | Customer status | Enum: draft, submitted, approved, suspended, archived |
| `risk_level` | VARCHAR(20) | Risk classification | LOW, MEDIUM, HIGH |
| `credit_limit` | NUMERIC(19,4) | Maximum credit allowed | >= 0 |
| `current_balance` | NUMERIC(19,4) | Current AR balance | Updated by posting engine (GL-03) |
| `available_credit` | NUMERIC(19,4) | Available credit (computed) | credit_limit - current_balance |
| `default_payment_terms` | INTEGER | Payment terms in days | Default: 30 |
| `credit_risk_score` | INTEGER | Credit risk score (0-100) | Higher = riskier |
| `payment_history_flag` | VARCHAR(20) | Payment behavior | GOOD, WARNING, POOR |
| `collection_status` | VARCHAR(20) | Collection status | CURRENT, OVERDUE, COLLECTION |

### 6.3 Business Rules

| Rule ID | Rule | Enforcement | Impact |
|---------|------|-------------|--------|
| **BR-01** | Customer code must be unique per tenant | `uq_customer_code_tenant` constraint | Prevents duplicate customers |
| **BR-02** | Tax ID must be unique per tenant (if provided) | `uq_customer_tax_id_tenant` constraint | Prevents duplicate registrations |
| **BR-03** | Credit limit cannot be negative | `chk_credit_limit_positive` constraint | Data integrity |
| **BR-04** | Available credit cannot be negative | `chk_available_credit_non_negative` constraint | Prevents over-credit |
| **BR-05** | Approver must be different from creator | `chk_sod_approval` constraint | SoD enforcement |
| **BR-06** | Credit limit changes require approval | `change_request_status` workflow | Authorization control |
| **BR-07** | Suspended customers cannot receive new invoices | Application-level validation | Risk mitigation |
| **BR-08** | Archived customers are read-only | Trigger: `fn_prevent_archived_customer_update` | Data protection |
| **BR-09** | Current balance updated only by posting engine | `last_balance_updated_at` tracking | Ledger integrity |
| **BR-10** | Privileged actions (suspend/archive) require SoD | Trigger: `fn_audit_privileged_customer_action` | SoD enforcement |

---

## 7. Ports & APIs (Hexagonal)

### 7.1 Inbound Ports (API Endpoints)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/ar/customers` | Create customer (draft) | `ar.customer.create` |
| `GET` | `/api/ar/customers` | List customers (filtered) | `ar.customer.read` |
| `GET` | `/api/ar/customers/{id}` | Get customer details | `ar.customer.read` |
| `PUT` | `/api/ar/customers/{id}` | Update customer (draft only) | `ar.customer.update` |
| `POST` | `/api/ar/customers/{id}/submit` | Submit for approval | `ar.customer.submit` |
| `POST` | `/api/ar/customers/{id}/approve` | Approve customer | `ar.customer.approve` |
| `POST` | `/api/ar/customers/{id}/reject` | Reject customer | `ar.customer.approve` |
| `POST` | `/api/ar/customers/{id}/suspend` | Suspend customer | `ar.customer.approve` |
| `POST` | `/api/ar/customers/{id}/reactivate` | Reactivate customer | `ar.customer.approve` |
| `POST` | `/api/ar/customers/{id}/archive` | Archive customer | `ar.customer.archive` |
| `POST` | `/api/ar/customers/{id}/credit-limit/change-request` | Request credit limit change | `ar.customer.update` |
| `POST` | `/api/ar/customers/{id}/credit-limit/approve-change` | Approve credit limit change | `ar.customer.approve` |

### 7.2 Outbound Ports

| Port | Service | Purpose | Reliability |
|------|---------|---------|-------------|
| `CustomerRepositoryPort` | SQL Adapter | Persist customer data | Blocking |
| `AuditOutboxPort` (K_LOG) | Kernel | Write audit events to outbox | **Transactional (same TX)** ✅ |
| `AuditDispatcherPort` | Kernel | Async dispatch from outbox | **At-least-once** ✅ |
| `PolicyPort` (K_POLICY) | Kernel | Evaluate approval rules, credit policies | Blocking |
| `AuthPort` (K_AUTH) | Kernel | Verify permissions, SoD checks | Blocking |
| `SequencePort` (K_SEQ) | Kernel | Generate customer codes | Blocking |

> **IMMORTAL v1.1.0**: Audit events are now written to `ar.customer_audit_outbox` within the same database transaction (via trigger). A separate async dispatcher reads pending events and forwards them to `kernel.audit_events`, marking them as dispatched. This guarantees at-least-once delivery even if the application crashes after commit.

---

## 8. Controls & Evidence

### 8.1 Control Matrix (CONT_07 Format)

| Control ID | Assertion | Control | Evidence | Enforcement |
|:----------|:----------|:--------|:---------|:------------|
| **AR01-C01** | **Existence/Occurrence** | Invoices/credit notes FK must reference approved customer | FK + trigger: `ar.fn_validate_approved_customer()` | **FK + Trigger** |
| **AR01-C02** | **Authorization** | SoD: Customer creation ≠ Customer approval/suspension/archive | `approved_by != created_by` + trigger validation | **DB Constraint + Trigger** |
| **AR01-C03** | **Authorization** | Credit limit changes require separate approval | `change_request_status` workflow | **State Machine** |
| **AR01-C04** | **Completeness** | All customer mutations emit audit events | `ar.customer_audit_outbox` coverage = 100% | **Transactional Outbox** ✅ |
| **AR01-C05** | **Accuracy** | Credit limit cannot be negative | `chk_credit_limit_positive` constraint | **DB Constraint** |
| **AR01-C06** | **Authorization** | Cannot perform privileged actions on own customer | `chk_sod_approval` + trigger | **DB Constraint + Trigger** |
| **AR01-C07** | **Completeness** | Customer code uniqueness per tenant | `uq_customer_code_tenant` constraint | **Unique Constraint** |
| **AR01-C08** | **Valuation** | Available credit = credit_limit - current_balance | Computed column | **Generated Column** |
| **AR01-C09** | **Accuracy** | Current balance updated atomically by posting engine | `last_balance_updated_at` timestamp | **Posting Engine Contract** |
| **AR01-C10** | **Immutability** | Archived customers completely immutable | Trigger: `fn_prevent_archived_customer_update` blocks ALL fields | **DB Trigger** ✅ |
| **AR01-C11** | **Tenant Isolation** | Child tables reference same tenant as customer | Composite FK + trigger validation | **Composite FK + Trigger** ✅ |
| **AR01-C12** | **Authorization** | Privileged actions (suspend/archive) enforce SoD | Trigger: `fn_audit_privileged_customer_action` | **DB Trigger** ✅ |

### 8.2 Evidence Artifacts

| Artifact | Location | Retention | Purpose |
|----------|----------|-----------|---------|
| **Customer Record** | `ar.customers` | 7 years | Master data |
| **Credit History** | `ar.customer_credit_history` | 7 years | Credit limit changes |
| **Audit Events** | `kernel.audit_events` | 7 years | Compliance trail |
| **Approval History** | `kernel.audit_events` (filtered) | 7 years | SoD evidence |

---

## 9. UI/UX (BioSkin Architecture)

### 9.1 Component Requirements (CONT_10)

| Component | Type | Schema-Driven? | Location |
|-----------|------|----------------|----------|
| **CustomerForm** | `BioForm` | ✅ Yes | `apps/web/src/features/customer/components/CustomerForm.tsx` |
| **CustomerTable** | `BioTable` | ✅ Yes | `apps/web/src/features/customer/components/CustomerTable.tsx` |
| **CustomerDetail** | `BioObject` | ✅ Yes | `apps/web/src/features/customer/components/CustomerDetail.tsx` |
| **CreditLimitForm** | `BioForm` | ✅ Yes | `apps/web/src/features/customer/components/CreditLimitForm.tsx` |
| **ApprovalQueue** | `BioTable` | ✅ Yes | `apps/web/src/features/customer/components/ApprovalQueue.tsx` |

### 9.2 Schema Definition

```typescript
// packages/schemas/src/customer.schema.ts
import { z } from 'zod';

export const CustomerSchema = z.object({
  id: z.string().uuid().optional(),
  customer_code: z.string().describe('Customer code (auto-generated)'),
  legal_name: z.string().min(2).describe('Legal entity name'),
  display_name: z.string().optional().describe('Display name'),
  tax_id: z.string().optional().describe('Tax identification number'),
  country: z.string().length(3).describe('ISO 3166-1 alpha-3 country code'),
  currency_preference: z.string().length(3).default('USD').describe('Default currency'),
  customer_category: z.string().optional().describe('Customer category'),
  risk_level: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('LOW'),
  credit_limit: z.coerce.number().nonnegative().describe('Credit limit (NUMERIC(19,4))'),
  current_balance: z.coerce.number().default(0).describe('Current AR balance (read-only)'),
  available_credit: z.coerce.number().describe('Available credit (computed, read-only)'),
  default_payment_terms: z.number().int().positive().default(30),
  status: z.enum(['draft', 'submitted', 'approved', 'suspended', 'archived']).default('draft'),
});

export type Customer = z.infer<typeof CustomerSchema>;
```

### 9.3 Design Tokens (CONT_10)

| Element | Token | Usage |
|---------|-------|-------|
| **Card Background** | `bg-surface-card` | Customer detail cards |
| **Primary Text** | `text-text-primary` | Customer names, labels |
| **Status Badge** | `text-status-*` | Status indicators (approved, suspended) |
| **Credit Limit** | `text-amount-positive` | Available credit display |
| **Border** | `border-default` | Card borders, form fields |
| **Spacing** | `p-layout-md` | Card padding, form spacing |

### 9.4 Decision Explanations UI (UX Enhancement)

**Pattern:** When actions are disabled or blocked, show **reason** and **next action**.

| Scenario | Disabled Action | Reason Shown | Next Action Shown |
|----------|----------------|--------------|-------------------|
| **Cannot Create Invoice** | "Create Invoice" button disabled | "Customer status is 'draft' — must be 'approved'" | "Submit customer for approval" (link) |
| **Cannot Approve Own Customer** | "Approve" button disabled | "SoD violation: You created this customer" | "Assign to another approver" (action) |
| **Credit Limit Exceeded** | "Create Invoice" button disabled | "Customer credit limit exceeded ($50,000 / $50,000)" | "Request credit limit increase" (link) |
| **Cannot Modify Archived** | All edit fields disabled | "Customer is archived (immutable)" | "Contact administrator to reopen" |

**Implementation:**
- Use `BioTooltip` component for inline explanations
- Use `BioAlert` component for blocking warnings (e.g., credit limit exceeded)
- Include `next_action_url` in API responses for deep linking

---

## 10. Workflows & Integration

### 10.1 Customer Onboarding Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                 CUSTOMER ONBOARDING WORKFLOW                     │
│                                                                  │
│  1. MAKER (Sales Rep) creates customer                          │
│     └── Status: draft                                           │
│         ├── Capture: Legal name, tax ID, addresses              │
│         ├── Set: Credit limit, payment terms                    │
│         └── Add: Contacts, billing addresses                    │
│                                                                  │
│  2. MAKER submits for approval                                  │
│     └── Status: draft → submitted                               │
│         ├── Validate: Required fields complete                  │
│         ├── Check: Duplicate tax ID                             │
│         └── Emit: customer.submitted event                      │
│                                                                  │
│  3. CHECKER (Credit Manager) reviews                            │
│     └── Status: submitted → approved                            │
│         ├── Verify: Customer information                        │
│         ├── Assess: Credit risk                                 │
│         ├── Approve: Credit limit                               │
│         ├── Enforce: SoD (approver != creator)                  │
│         └── Emit: customer.approved event                       │
│                                                                  │
│  4. Customer ready for transactions                             │
│     └── Status: approved                                        │
│         ├── Can: Receive sales invoices (AR-02)                 │
│         ├── Can: Receive credit notes (AR-04)                   │
│         └── Monitor: Credit utilization                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 10.2 Credit Limit Change Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│               CREDIT LIMIT CHANGE WORKFLOW                       │
│                                                                  │
│  1. MAKER (Sales Rep) requests credit limit increase            │
│     └── Create credit limit change request                      │
│         ├── Current limit: $50,000                              │
│         ├── Requested limit: $100,000                           │
│         ├── Reason: "Increased order volume"                    │
│         └── Status: pending_approval                            │
│                                                                  │
│  2. CHECKER (Credit Manager) reviews                            │
│     └── Approve or reject change request                        │
│         ├── Review: Payment history                             │
│         ├── Check: Current balance                              │
│         ├── Assess: Risk factors                                │
│         ├── Enforce: SoD (approver != requester)                │
│         └── Update: Customer credit limit                       │
│                                                                  │
│  3. Audit trail preserved                                       │
│     └── customer_credit_history table                           │
│         ├── Old limit: $50,000                                  │
│         ├── New limit: $100,000                                 │
│         ├── Approved by: Credit Manager                         │
│         └── Timestamp: 2025-12-16T10:30:00Z                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 10.3 Audit Event Taxonomy

**Minimum Required Events** (for 100% audit coverage):

| Event Code | Trigger | Payload |
|------------|---------|---------|
| `customer.created` | Draft customer created | `{ customer_id, created_by, legal_name }` |
| `customer.updated` | Customer fields modified | `{ customer_id, updated_by, changed_fields }` |
| `customer.submitted` | Submitted for approval | `{ customer_id, submitted_by }` |
| `customer.approved` | Approved by Checker | `{ customer_id, approved_by, created_by }` |
| `customer.rejected` | Rejected by Checker | `{ customer_id, rejected_by, reason }` |
| `customer.suspended` | Suspended (risk flag) | `{ customer_id, suspended_by, reason }` |
| `customer.reactivated` | Reactivated from suspension | `{ customer_id, reactivated_by }` |
| `customer.archived` | Archived (terminal) | `{ customer_id, archived_by }` |
| `customer.credit_limit.requested` | Credit limit change requested | `{ customer_id, old_limit, new_limit, requested_by, reason }` |
| `customer.credit_limit.approved` | Credit limit change approved | `{ customer_id, old_limit, new_limit, approved_by, requested_by }` |
| `customer.credit_limit.rejected` | Credit limit change rejected | `{ customer_id, rejected_by, reason }` |
| `customer.address.created` | Address added | `{ customer_id, address_id, address_type }` |
| `customer.contact.created` | Contact added | `{ customer_id, contact_id, contact_type }` |

**SoD Audit Enforcement:**
- All events with `approved_by` / `suspended_by` / `archived_by` must include `created_by` for SoD verification
- Events are emitted **in the same transaction** as the mutation (transactional audit)

### 10.4 Dependencies

| Dependency | Type | Purpose | Impact |
|------------|------|---------|--------|
| **K_SEQ** | Kernel | Customer code generation | **Critical** — Cannot create customers |
| **K_LOG** | Kernel | Audit trail | **Critical** — Compliance requirement |
| **K_POLICY** | Kernel | Approval rules, credit policies | **High** — Business rule enforcement |
| **K_AUTH** | Kernel | Permission checks, SoD validation | **Critical** — Security |
| **AR-02** | Downstream | Sales invoices reference customers | **High** — FK constraint |
| **AR-04** | Downstream | Credit notes reference customers | **Medium** — FK constraint |

---

## 11. Acceptance Criteria

### 11.1 Functional Requirements

| ID | Requirement | Test |
|:---|:------------|:-----|
| **AC-01** | Cannot create invoice/credit note to customer.status != approved | Hard FK constraint fails |
| **AC-02** | All mutations emit transactional audit events | Coverage = 100% |
| **AC-03** | Maker cannot approve own customer | `chk_sod_approval` constraint fails |
| **AC-04** | Credit limit changes require separate approval | `change_request_status` workflow enforced |
| **AC-05** | Credit limit cannot be negative | `chk_credit_limit_positive` constraint enforced |
| **AC-06** | Customer code uniqueness per tenant | `uq_customer_code_tenant` constraint enforced |
| **AC-07** | Available credit = credit_limit - current_balance | Computed column verified |
| **AC-08** | `/health`, `/ready`, `/metrics`, `/schema` implemented | Infrastructure endpoints |

### 11.2 Non-Functional Requirements

| ID | Requirement | Target |
|:---|:------------|:------|
| **NFR-01** | API response time (p95) | < 200ms |
| **NFR-02** | Database query performance | < 50ms (indexed queries) |
| **NFR-03** | Audit event emission | Same transaction (atomic) |
| **NFR-04** | Test coverage | ≥ 90% |

---

## 12. Testing Requirements

### 12.1 Unit Tests

| Component | Test Coverage | Files |
|-----------|---------------|-------|
| `CustomerService` | State transitions, validation | `__tests__/CustomerService.test.ts` |
| `ApprovalService` | SoD enforcement, approval workflow | `__tests__/ApprovalService.test.ts` |
| `CreditLimitService` | Change control, credit validation | `__tests__/CreditLimitService.test.ts` |

### 12.2 Integration Tests

| Test | Description | File |
|------|-------------|------|
| **SoD Enforcement** | Creator cannot approve own customer | `__tests__/integration/SoD.test.ts` |
| **Audit Completeness** | Every mutation creates audit event | `__tests__/integration/Audit.test.ts` |
| **Credit Limit Change Workflow** | Credit limit change requires approval | `__tests__/integration/CreditLimitChange.test.ts` |
| **FK Constraint** | Invoices blocked for non-approved customers | `__tests__/integration/FKConstraint.test.ts` |

---

## 13. Related Documents

| Document | Purpose | Location |
|----------|---------|----------|
| **CONT_07** | Finance Canon Architecture | `packages/canon/A-Governance/A-CONT/CONT_07_FinanceCanonArchitecture.md` |
| **CONT_10** | BioSkin Architecture | `packages/canon/A-Governance/A-CONT/CONT_10_BioSkinArchitecture.md` |
| **CONT_00** | Constitution | `packages/canon/A-Governance/A-CONT/CONT_00_Constitution.md` |
| **AR-02 PRD** | Sales Invoice (downstream) | `apps/canon/finance/dom04-accounts-receivable/cells/ar02-sales-invoice/PRD-ar02-sales-invoice.md` |

---

**Status:** ✅ Ready for Implementation  
**Next Step:** Create service implementations following hexagonal architecture

---

**Last Updated:** 2025-12-16  
**Maintainer:** Finance Cell Team  
**Review Cycle:** Quarterly
