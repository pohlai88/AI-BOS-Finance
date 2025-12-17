# PRD: GL-01 Chart of Accounts

> **Cell Code:** GL-01  
> **Domain:** General Ledger (DOM-05)  
> **Status:** 🟡 Design Phase — Awaiting User Review  
> **Created:** 2025-12-17  
> **Author:** AI-BOS Architecture Team

---

## 0. Executive Summary

The **Chart of Accounts (COA)** cell is the **foundational classification system** for all financial transactions. It defines the valid accounts that can be debited or credited in journal entries, ensuring consistent categorization across all entities and subsidiaries.

**Why This Cell Exists:** Without a governed COA, every cell could post to random account codes, making financial statements meaningless. The COA is the **single source of truth** for account validity.

**AIS Justification (Romney & Steinbart):**  
The Chart of Accounts is a **master file** in the AIS, providing the classification framework for all transaction processing. It enforces the **Classification Assertion** (GAAP/IFRS) that ensures transactions are recorded in the appropriate financial statement category.

**COSO Mapping:**  
- **Control Activity:** Master data control — prevents posting to non-existent accounts
- **Assertion:** Classification — ensures accurate financial statement presentation

---

## 1. Business Justification

### 1.1 Problem Statement

**Current Pain Points:**
- ❌ No centralized governance of account codes
- ❌ Cells might post to non-existent accounts (ghost accounts)
- ❌ Different entities using inconsistent account numbering
- ❌ No enforcement of account type (asset vs. liability)
- ❌ Retired accounts still being used in new transactions

### 1.2 Success Criteria

| # | Metric | Target | Measurement |
|---|--------|--------|-------------|
| 1 | **Invalid Account Rejections** | 100% | All attempts to post to invalid accounts are blocked |
| 2 | **Account Type Enforcement** | 100% | Debit/Credit rules enforced by account type |
| 3 | **Multi-Entity Support** | ✅ | Same account code works across all entities with translation |
| 4 | **Inactive Account Protection** | 0 postings | No journal entries to retired accounts |
| 5 | **Audit Trail** | 100% | Every account change (create/update/deactivate) logged |

---

## 2. Scope Definition

### 2.1 IN SCOPE

✅ **Account Master Data Management**
- Create accounts with structured metadata (type, category, normal balance)
- Update account descriptions and classifications
- Deactivate/reactivate accounts
- Multi-entity account mapping (same account code, entity-specific labels)

✅ **Account Validation Service**
- Validate account exists before posting
- Validate account is active/postable
- Validate account type (asset/liability/equity/revenue/expense)
- Validate normal balance side (debit/credit)

✅ **Account Hierarchy**
- Parent-child relationships (e.g., 1000 Cash has children 1001 Petty Cash, 1002 Bank USD)
- Rollup logic for financial statements
- Multi-level nesting (up to 5 levels)

✅ **Account Attributes**
- Account code (string, configurable format)
- Account name (multilingual support)
- Account type (5 standard types: asset/liability/equity/revenue/expense)
- Normal balance (debit/credit)
- Postable flag (summary accounts non-postable)
- Currency (if account is single-currency constrained)
- Cost center / Department / Project dimensions (optional)

✅ **Multi-Entity Support** (DOM-05 Consolidation Requirement)
- Group-level canonical COA (holding company)
- Entity-level local COA (subsidiaries)
- Mapping table for consolidation translation
- Effective-dated mappings for reorganizations

### 2.2 OUT OF SCOPE

❌ **Journal Entry Creation** — That's GL-02
❌ **Posting Engine Logic** — That's GL-03
❌ **Financial Reporting** — That's GL-05 (Trial Balance) and separate reporting domain
❌ **Budget Management** — Future cell
❌ **Account Reconciliation** — Treasury domain

---

## 3. Functional Requirements

### 3.1 Account Lifecycle State Machine

```
┌─────────────────────────────────────────────────────────────┐
│                  ACCOUNT LIFECYCLE                           │
│                                                              │
│   DRAFT ──┬──► ACTIVE ──┬──► INACTIVE ──► ARCHIVED          │
│           │             │                                    │
│           │             └──► SUSPENDED (temporary block)     │
│           │                      │                           │
│           │                      └──► ACTIVE (reactivated)   │
│           │                                                  │
│           └──► REJECTED (failed approval)                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

| State | Description | Can Post? | Transitions |
|-------|-------------|-----------|-------------|
| **DRAFT** | New account, pending approval | ❌ No | → ACTIVE (approve), → REJECTED (reject) |
| **ACTIVE** | Live, available for posting | ✅ Yes | → INACTIVE (deactivate), → SUSPENDED (block) |
| **SUSPENDED** | Temporarily blocked | ❌ No | → ACTIVE (reactivate) |
| **INACTIVE** | Permanently retired | ❌ No | → ARCHIVED (after retention period) |
| **ARCHIVED** | Historical only | ❌ No | None (terminal state) |
| **REJECTED** | Failed approval | ❌ No | → DRAFT (edit & resubmit) |

### 3.2 Core Operations

#### 3.2.1 Create Account

**Input:**
```typescript
{
  companyId: string;
  accountCode: string;        // "1000", "4100", etc.
  accountName: string;        // "Cash", "Revenue - Sales"
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  normalBalance: 'debit' | 'credit';
  parentAccountCode?: string;  // For hierarchy
  isPostable: boolean;         // false for summary accounts
  currency?: string;           // ISO 4217 (optional, null = all currencies)
  costCenterRequired?: boolean;
  departmentRequired?: boolean;
  description?: string;
  tags?: string[];
}
```

**Validations:**
- Account code must be unique within company
- Account code format per company policy (e.g., 4 digits, alphanumeric)
- Account type must be one of 5 standard types
- Normal balance must match account type rules
- Parent account (if specified) must exist and be same type
- If parent specified, parent cannot be postable (must be summary)

**Business Rules:**
- Summary accounts (has children) → `isPostable = false`
- Leaf accounts (no children) → `isPostable = true`
- Normal balance enforcement:
  - Asset → Debit
  - Liability → Credit
  - Equity → Credit
  - Revenue → Credit
  - Expense → Debit

**Output:**
- Created account (status: DRAFT)
- Audit event: `gl.account.created`

#### 3.2.2 Approve Account

**Requires:** SoD enforcement (approver ≠ creator)

**Input:**
```typescript
{
  accountId: string;
  approvalNotes?: string;
  effectiveDate: Date;  // When account becomes active
}
```

**Validations:**
- Account must be in DRAFT or REJECTED status
- Approver cannot be the creator (SoD)
- Effective date cannot be in the past

**Output:**
- Account status → ACTIVE (on effective date)
- Audit event: `gl.account.approved`

#### 3.2.3 Update Account

**Input:**
```typescript
{
  accountId: string;
  updates: {
    accountName?: string;
    description?: string;
    tags?: string[];
    // Note: accountCode, accountType, normalBalance are IMMUTABLE
  };
}
```

**Validations:**
- Cannot change `accountCode`, `accountType`, `normalBalance` (immutable)
- Cannot update ARCHIVED accounts
- If account has transactions, only description/tags can change

**Output:**
- Updated account
- Audit event: `gl.account.updated`

#### 3.2.4 Deactivate Account

**Input:**
```typescript
{
  accountId: string;
  deactivationDate: Date;
  reason: string;
  replacementAccountCode?: string;  // For migration
}
```

**Validations:**
- Account must be ACTIVE
- Cannot deactivate if account has open balances (balance ≠ 0)
- Cannot deactivate if account has children (must deactivate children first)
- Deactivation date cannot be before last posting date

**Output:**
- Account status → INACTIVE
- Audit event: `gl.account.deactivated`

#### 3.2.5 Validate Account (for Posting)

**Input:**
```typescript
{
  accountCode: string;
  companyId: string;
  postingDate: Date;
}
```

**Validation Logic:**
```typescript
1. Account exists in company?
2. Account is ACTIVE status?
3. Account is postable (isPostable = true)?
4. Posting date >= account effective date?
5. Posting date < account deactivation date (if deactivated)?
```

**Output:**
```typescript
{
  valid: boolean;
  accountId?: string;
  accountType?: AccountType;
  normalBalance?: 'debit' | 'credit';
  errorCode?: string;
  errorMessage?: string;
}
```

---

## 4. Control Points

### 4.1 Segregation of Duties (SoD)

| Action | Creator | Approver | Notes |
|--------|---------|----------|-------|
| Create Account | ✅ GL Officer | ❌ Cannot approve own | Maker role |
| Approve Account | ❌ Cannot be creator | ✅ GL Manager/Controller | Checker role |
| Update Account | ✅ GL Officer | ⚠️ Approval required for critical fields | — |
| Deactivate Account | ❌ Restricted | ✅ Controller/CFO only | High risk |

**Database Constraint:**
```sql
-- SoD: Approver cannot be creator
CHECK (approved_by IS NULL OR approved_by <> created_by)
```

### 4.2 Approval Limits

No monetary limits (not a financial transaction), but role-based:

| Role | Can Create | Can Approve | Can Deactivate |
|------|------------|-------------|----------------|
| GL Officer | ✅ | ❌ | ❌ |
| GL Manager | ✅ | ✅ | ❌ |
| Controller | ✅ | ✅ | ✅ |
| CFO | ✅ | ✅ | ✅ |

### 4.3 Period Cutoff

**Rule:** Accounts can be created/approved/updated anytime (master data not period-locked).

**Exception:** Deactivation date must respect period boundaries (cannot deactivate mid-period if transactions exist).

### 4.4 Audit Requirements

Every mutation (CREATE/UPDATE/DELETE) **MUST** log:

| Event Type | Logged Data |
|------------|-------------|
| `gl.account.created` | Full account payload, creator ID, timestamp |
| `gl.account.approved` | Account ID, approver ID, approval date, effective date |
| `gl.account.updated` | Before/after diff (JSON patch), updater ID |
| `gl.account.deactivated` | Account ID, deactivation date, reason, deactivator ID |
| `gl.account.reactivated` | Account ID, reactivation date, reason, reactivator ID |

---

## 5. GL Impact

**GL Posting:** This cell **DOES NOT** create journal entries itself.

**However, it is REQUIRED by:**
- **GL-03 (Posting Engine):** Validates account codes before posting
- **AP/AR Cells:** Validate accounts during invoice/payment creation

**Dependency Chain:**
```
GL-01 (COA) ──► GL-02 (Journal Entry) ──► GL-03 (Posting Engine)
           │
           └──► AP Cells (for validation)
           └──► AR Cells (for validation)
```

---

## 6. Data Model

### 6.1 Primary Entity: `gl_chart_of_accounts`

```typescript
interface ChartOfAccount {
  // ═══════════════════════════════════════════════════════════
  // IDENTITY
  // ═══════════════════════════════════════════════════════════
  id: string;                      // UUID
  tenant_id: string;               // Multi-tenancy
  company_id: string;              // Legal entity
  
  // ═══════════════════════════════════════════════════════════
  // ACCOUNT CLASSIFICATION
  // ═══════════════════════════════════════════════════════════
  account_code: string;            // "1000", "4100", etc.
  account_name: string;            // "Cash", "Revenue - Sales"
  account_type: AccountType;       // asset/liability/equity/revenue/expense
  normal_balance: 'debit' | 'credit';
  
  // ═══════════════════════════════════════════════════════════
  // HIERARCHY
  // ═══════════════════════════════════════════════════════════
  parent_account_id?: string;      // FK to parent account
  level: number;                   // 1-5 (depth in hierarchy)
  path: string;                    // Materialized path: "1000.1001.1002"
  is_postable: boolean;            // false = summary account
  
  // ═══════════════════════════════════════════════════════════
  // CONSTRAINTS
  // ═══════════════════════════════════════════════════════════
  currency?: string;               // ISO 4217 (null = all currencies)
  cost_center_required: boolean;
  department_required: boolean;
  project_required: boolean;
  
  // ═══════════════════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════════════════
  status: AccountStatus;           // DRAFT/ACTIVE/INACTIVE/SUSPENDED/ARCHIVED
  effective_date?: Date;           // When account becomes active
  deactivation_date?: Date;
  deactivation_reason?: string;
  replacement_account_id?: string; // For migration
  
  // ═══════════════════════════════════════════════════════════
  // METADATA
  // ═══════════════════════════════════════════════════════════
  description?: string;
  tags: string[];
  
  // ═══════════════════════════════════════════════════════════
  // AUDIT TRAIL
  // ═══════════════════════════════════════════════════════════
  created_by: string;
  created_at: Date;
  updated_by?: string;
  updated_at?: Date;
  approved_by?: string;
  approved_at?: Date;
  version: number;                 // Optimistic locking
}
```

### 6.2 Enums

```typescript
enum AccountType {
  ASSET = 'asset',
  LIABILITY = 'liability',
  EQUITY = 'equity',
  REVENUE = 'revenue',
  EXPENSE = 'expense'
}

enum AccountStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  ARCHIVED = 'archived',
  REJECTED = 'rejected'
}
```

### 6.3 Indexes

```sql
CREATE INDEX idx_coa_company_code ON gl_chart_of_accounts(company_id, account_code);
CREATE INDEX idx_coa_parent ON gl_chart_of_accounts(parent_account_id);
CREATE INDEX idx_coa_status ON gl_chart_of_accounts(status) WHERE status = 'ACTIVE';
CREATE INDEX idx_coa_path ON gl_chart_of_accounts USING GIST(path);
```

### 6.4 Constraints

```sql
-- Unique account code per company
ALTER TABLE gl_chart_of_accounts 
ADD CONSTRAINT uq_coa_company_code UNIQUE (company_id, account_code);

-- SoD: Approver cannot be creator
ALTER TABLE gl_chart_of_accounts
ADD CONSTRAINT chk_sod_approver 
CHECK (approved_by IS NULL OR approved_by <> created_by);

-- ⚠️  REMOVED INCORRECT CONSTRAINT:
-- The constraint `CHECK (parent_account_id IS NULL OR is_postable = false)` 
-- would force ALL child accounts to be non-postable, which is wrong.
-- Instead, we enforce "accounts WITH children are non-postable" via trigger.
-- See Section 14.7 for trigger implementation.
```

---

## 7. Dependencies

### 7.1 Kernel Services Required

| Service | Usage | Criticality |
|---------|-------|-------------|
| **K_AUTH** | Identity, role verification for SoD | 🔴 Blocking |
| **K_LOG** | Audit trail for all mutations | 🔴 Blocking |
| **K_POLICY** | Approval rules, role checks | 🔴 Blocking |
| **K_CACHE** (Redis) | Account lookup caching, validation performance | 🟡 Performance |
| **K_TIME** | Period close interaction, posting date validation | 🔴 Blocking |
| **K_SEQ** | (Not used — accounts use manual codes) | — |

### 7.2 Upstream Dependencies

None (GL-01 is foundational, no upstream cells).

### 7.3 Downstream Dependencies (Who depends on GL-01?)

| Cell | Dependency | Failure Mode |
|------|------------|--------------|
| **GL-02** (Journal Entry) | Validates account codes | Cannot create journals |
| **GL-03** (Posting Engine) | Validates postable status | Cannot post |
| **AP Cells** | Validates expense accounts | Cannot create invoices |
| **AR Cells** | Validates revenue accounts | Cannot create sales invoices |

---

## 8. Non-Functional Requirements

### 8.1 Performance

| Operation | Target | Measurement |
|-----------|--------|-------------|
| **Account Validation** | < 50ms | 99th percentile |
| **Account Lookup** | < 20ms | Cached in Redis |
| **Account Creation** | < 500ms | End-to-end |
| **Hierarchy Query** | < 100ms | Materialized path optimization |

### 8.2 Security

- **Encryption at Rest:** Yes (for PII in account names/descriptions)
- **Encryption in Transit:** TLS 1.3
- **Data Residency:** Per company jurisdiction
- **Access Control:** RBAC with SoD enforcement

### 8.3 Scalability

- **Expected Volume:** ~1,000 accounts per company
- **Max Hierarchy Depth:** 5 levels
- **Max Accounts per Tenant:** 50,000 (across all companies)

### 8.4 Availability

- **Uptime SLA:** 99.9% (3 nines)
- **RPO (Recovery Point Objective):** 5 minutes
- **RTO (Recovery Time Objective):** 1 hour

---

## 9. Edge Cases & Error Scenarios

| # | Scenario | Expected Behavior |
|---|----------|------------------|
| 1 | **Attempt to post to DRAFT account** | Reject with `ACCOUNT_NOT_ACTIVE` |
| 2 | **Attempt to post to summary account** | Reject with `ACCOUNT_NOT_POSTABLE` |
| 3 | **Deactivate account with non-zero balance** | Reject with `ACCOUNT_HAS_BALANCE` |
| 4 | **Approve own account creation** | Reject with `SOD_VIOLATION` |
| 5 | **Circular hierarchy (A → B → A)** | Reject with `CIRCULAR_REFERENCE` |
| 6 | **Account code format mismatch** | Reject with `INVALID_ACCOUNT_FORMAT` |
| 7 | **Deactivate parent with active children** | Reject with `HAS_ACTIVE_CHILDREN` |
| 8 | **Concurrent update (version mismatch)** | Reject with `VERSION_CONFLICT` (409) |
| 9 | **Account code already exists** | Reject with `DUPLICATE_ACCOUNT_CODE` |
| 10 | **Invalid normal balance for account type** | Reject with `INVALID_NORMAL_BALANCE` |

---

## 10. Test Strategy

### 10.1 Unit Tests

- [ ] Create account with valid data
- [ ] Create account with invalid account code format
- [ ] Approve account (happy path)
- [ ] Approve own account (SoD violation)
- [ ] Update account name/description
- [ ] Attempt to update immutable fields (accountCode, accountType)
- [ ] Deactivate account with zero balance
- [ ] Deactivate account with non-zero balance (reject)
- [ ] Validate account for posting (active, postable)
- [ ] Validate account for posting (inactive → reject)
- [ ] Validate account for posting (summary → reject)
- [ ] Create hierarchy (parent-child)
- [ ] Circular hierarchy detection

### 10.2 SoD Tests

- [ ] `test_creator_cannot_approve_own_account()`
- [ ] `test_different_user_can_approve()`
- [ ] `test_database_constraint_enforces_sod()`

### 10.3 Integration Tests

- [ ] Create account + approve + validate for posting
- [ ] Create hierarchy + query rollup
- [ ] Deactivate account + verify posting blocked
- [ ] Multi-company account isolation
- [ ] Concurrency: Two users update same account (version conflict)

### 10.4 Control Tests (Audit)

- [ ] `test_audit_event_emitted_on_create()`
- [ ] `test_audit_event_emitted_on_approve()`
- [ ] `test_audit_event_emitted_on_deactivate()`

---

## 11. Success Metrics (Post-Implementation)

| Metric | Target | How Measured |
|--------|--------|--------------|
| **Account Validation Latency** | < 50ms | Prometheus `coa_validation_duration_ms` |
| **SoD Violations Blocked** | 100% | Count of `SOD_VIOLATION` errors |
| **Invalid Account Rejections** | 100% | Count of posting attempts to invalid accounts |
| **Audit Event Coverage** | 100% | Every mutation has corresponding audit event |
| **Dashboard Health Score** | > 90 | Based on open approvals, suspended accounts |

---

## 12. Missing Core Interfaces (P0/P1 Additions)

### 12.1 Query & Search APIs (P0)

#### 12.1.1 List Accounts (Paginated)

**Input:**
```typescript
{
  companyId: string;
  status?: AccountStatus[];       // Filter by status (default: ACTIVE only)
  accountType?: AccountType[];    // Filter by type
  searchTerm?: string;            // Search in code/name/description
  tags?: string[];                // Filter by tags
  parentAccountCode?: string;     // Filter by parent (children only)
  pageSize?: number;              // Default 50, max 1000
  pageToken?: string;             // Cursor for pagination
  sortBy?: 'code' | 'name' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}
```

**Output:**
```typescript
{
  accounts: ChartOfAccount[];
  nextPageToken?: string;
  totalCount: number;
}
```

#### 12.1.2 Get Account Hierarchy Tree

**Input:**
```typescript
{
  companyId: string;
  rootAccountCode?: string;       // Default: all root accounts
  maxDepth?: number;              // Default: 5
  includeInactive?: boolean;      // Default: false
}
```

**Output:**
```typescript
{
  tree: AccountTreeNode[];
}

interface AccountTreeNode {
  account: ChartOfAccount;
  children: AccountTreeNode[];
  depth: number;
  hasChildren: boolean;
}
```

#### 12.1.3 Search Accounts (Full-Text)

**Input:**
```typescript
{
  companyId: string;
  query: string;                  // Full-text search
  filters?: {
    accountType?: AccountType[];
    status?: AccountStatus[];
    tags?: string[];
  };
  limit?: number;                 // Default 20
}
```

**Output:**
```typescript
{
  results: Array<{
    account: ChartOfAccount;
    score: number;                // Relevance score
    matchedFields: string[];      // 'code' | 'name' | 'description'
  }>;
}
```

#### 12.1.4 Export COA

**Input:**
```typescript
{
  companyId: string;
  format: 'csv' | 'xlsx' | 'json';
  includeHierarchy: boolean;
  includeInactive: boolean;
}
```

**Output:**
- Download URL (S3 pre-signed URL)
- Expiration: 1 hour

---

### 12.2 Bulk Operations & Template Management (P0)

#### 12.2.1 Bulk Import COA

**Process:**
1. Upload CSV/XLSX file
2. Validation & dry-run (report errors without committing)
3. Confirm import (create accounts in DRAFT status)
4. Approval workflow (bulk approve or individual)

**Input:**
```typescript
{
  companyId: string;
  file: File;                     // CSV/XLSX
  importMode: 'append' | 'replace' | 'merge';
  dryRun: boolean;                // true = validation only
}
```

**CSV Format:**
```csv
account_code,account_name,account_type,normal_balance,parent_code,is_postable,currency,description,tags
1000,Cash,asset,debit,,false,USD,Cash accounts,"banking;liquid"
1001,Petty Cash,asset,debit,1000,true,USD,Office petty cash,"cash;office"
```

**Validation Rules:**
- Account codes must be unique
- Parent codes must exist (or be in same import batch)
- Account type + normal balance must be consistent
- Circular references detected

**Output (Dry Run):**
```typescript
{
  valid: boolean;
  totalRows: number;
  validRows: number;
  errors: Array<{
    row: number;
    field: string;
    error: string;
    value: string;
  }>;
  warnings: Array<{
    row: number;
    message: string;
  }>;
}
```

**Output (Actual Import):**
```typescript
{
  importId: string;
  accountsCreated: number;
  accountsUpdated: number;
  accountsSkipped: number;
  status: 'completed' | 'partial' | 'failed';
}
```

#### 12.2.2 COA Templates

**Pre-Built Templates:**
- US GAAP Small Business (200 accounts)
- US GAAP Enterprise (1000+ accounts)
- IFRS Manufacturing (500 accounts)
- IFRS Services (300 accounts)
- Industry-specific (Retail, SaaS, Healthcare)

**Template Application:**
```typescript
{
  companyId: string;
  templateId: string;
  customizations?: {
    accountCodePrefix?: string;   // e.g., "1" → "100" for numbering
    currency?: string;             // Default currency
    language?: string;             // Account names in specific language
  };
}
```

#### 12.2.3 Migration from Legacy COA

**Scenario:** Company switching from old system

**Input:**
```typescript
{
  companyId: string;
  legacyCoaFile: File;
  mappingRules: Array<{
    legacyAccountCode: string;
    newAccountCode: string;
    effectiveDate: Date;
  }>;
}
```

**Process:**
1. Import new COA
2. Create account mappings
3. Mark legacy accounts as INACTIVE with `replacement_account_id`
4. Gradual cutover period (both COAs active)
5. Archive legacy COA after all transactions migrated

---

### 12.3 Multi-Entity Mapping (P0)

**Data Model:**

```typescript
// ═══════════════════════════════════════════════════════════
// GROUP-LEVEL CANONICAL COA (Holding Company)
// ═══════════════════════════════════════════════════════════
interface GroupChartOfAccount {
  id: string;
  tenant_id: string;
  group_id: string;               // Holding company ID
  group_account_code: string;     // "1000"
  group_account_name: string;     // "Cash"
  account_type: AccountType;
  normal_balance: 'debit' | 'credit';
  consolidation_rule: 'sum' | 'eliminate' | 'manual';
  status: AccountStatus;
  created_at: Date;
}

// ═══════════════════════════════════════════════════════════
// ENTITY-LEVEL LOCAL COA (Subsidiaries)
// ═══════════════════════════════════════════════════════════
// This is the existing `gl_chart_of_accounts` table

// ═══════════════════════════════════════════════════════════
// MAPPING TABLE (Translation for Consolidation)
// ═══════════════════════════════════════════════════════════
interface GroupAccountMapping {
  id: string;
  tenant_id: string;
  group_account_id: string;       // FK to GroupChartOfAccount
  company_id: string;             // Subsidiary
  local_account_id: string;       // FK to gl_chart_of_accounts
  effective_from: Date;
  effective_to?: Date;            // For reorganizations
  mapping_ratio?: number;         // For split mappings (1.0 = 100%)
  created_by: string;
  created_at: Date;
}
```

**Use Cases:**
1. **Consolidation:** Roll up subsidiary accounts to group accounts
2. **Translation:** US subsidiary uses "1000 Cash", SG subsidiary uses "100-001 Cash", both map to group "G-1000"
3. **Reorganization:** Change mappings over time (M&A, divestitures)

**API: Create Mapping**
```typescript
{
  groupAccountCode: string;
  companyId: string;
  localAccountCode: string;
  effectiveFrom: Date;
  mappingRatio?: number;          // Default 1.0
}
```

---

### 12.4 Effective-Date Activation Model (P1)

**Decision:** Scheduled activation (background job)

**Implementation:**
1. Account approved with `effective_date` (e.g., 2025-01-01)
2. Account remains in `PENDING_ACTIVATION` status until effective date
3. Daily cron job (12:00 AM UTC) flips status to `ACTIVE`
4. Validation logic checks: `status = ACTIVE AND effective_date <= posting_date`

**Alternative (Validation-Based):**
- Status changes to `ACTIVE` immediately upon approval
- Posting validation checks: `posting_date >= effective_date`

**✅ Recommended:** Validation-based (simpler, no cron dependency)

**State Machine Update:**
```
DRAFT ──► APPROVED ──► ACTIVE (effective_date check at posting time)
```

---

### 12.5 Balance Source for Deactivation (P1)

**Rule:** Cannot deactivate account with non-zero balance

**Balance Calculation:**
```sql
SELECT 
  SUM(CASE WHEN debit_amount IS NOT NULL THEN debit_amount ELSE 0 END) -
  SUM(CASE WHEN credit_amount IS NOT NULL THEN credit_amount ELSE 0 END) AS net_balance
FROM gl_journal_lines jl
INNER JOIN gl_journal_entries je ON je.id = jl.journal_entry_id
WHERE jl.account_code = ?
  AND je.company_id = ?
  AND je.status = 'POSTED'
  AND je.entry_date <= ?;         -- As-of deactivation date
```

**Business Rule:**
- If `net_balance ≠ 0`, deactivation is **BLOCKED**
- User must post correcting entry to zero out account first
- Optional: Allow deactivation with automatic transfer to `replacement_account_id`

**Enhanced Deactivation API:**
```typescript
{
  accountId: string;
  deactivationDate: Date;
  reason: string;
  replacementAccountCode?: string;
  autoTransferBalance?: boolean;  // Create journal entry to transfer balance
}
```

---

### 12.6 Hierarchy Storage & Indexing (P1)

**Decision:** Materialized Path (using PostgreSQL `ltree`)

**Why `ltree`?**
- Efficient tree queries (ancestors, descendants, subtree)
- Native indexing support (GIST, BTREE)
- Simpler than closure table or nested sets

**Schema Update:**
```sql
-- Install extension
CREATE EXTENSION IF NOT EXISTS ltree;

-- Update column type
ALTER TABLE gl_chart_of_accounts
ALTER COLUMN path TYPE ltree USING path::ltree;

-- Index
CREATE INDEX idx_coa_path ON gl_chart_of_accounts USING GIST(path);
CREATE INDEX idx_coa_path_btree ON gl_chart_of_accounts USING BTREE(path);
```

**Path Format:**
```
1000             -- Root account
1000.1001        -- Child
1000.1001.1002   -- Grandchild
```

**Query Examples:**
```sql
-- Get all descendants of 1000
SELECT * FROM gl_chart_of_accounts WHERE path <@ '1000';

-- Get immediate children
SELECT * FROM gl_chart_of_accounts WHERE path ~ '1000.*{1}';

-- Get depth
SELECT nlevel(path) AS depth FROM gl_chart_of_accounts WHERE account_code = '1002';
```

**Maintenance Trigger:**
```sql
-- Auto-update path when parent changes
CREATE TRIGGER trg_coa_update_path
BEFORE INSERT OR UPDATE ON gl_chart_of_accounts
FOR EACH ROW EXECUTE FUNCTION update_account_path();
```

---

### 12.7 Postable Enforcement Trigger (P0 FIX)

**Problem:** The constraint `CHECK (parent_account_id IS NULL OR is_postable = false)` is **WRONG** — it forces all child accounts to be non-postable.

**Correct Rule:** Accounts **WITH children** cannot be postable.

**Implementation (Trigger):**
```sql
CREATE OR REPLACE FUNCTION enforce_postable_rule() RETURNS TRIGGER AS $$
BEGIN
  -- Check 1: If account has children, it cannot be postable
  IF NEW.is_postable = true THEN
    IF EXISTS (SELECT 1 FROM gl_chart_of_accounts WHERE parent_account_id = NEW.id) THEN
      RAISE EXCEPTION 'Account % has children and cannot be postable', NEW.account_code;
    END IF;
  END IF;
  
  -- Check 2: If parent exists, ensure parent is NOT postable
  IF NEW.parent_account_id IS NOT NULL THEN
    UPDATE gl_chart_of_accounts
    SET is_postable = false
    WHERE id = NEW.parent_account_id AND is_postable = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_postable
BEFORE INSERT OR UPDATE ON gl_chart_of_accounts
FOR EACH ROW EXECUTE FUNCTION enforce_postable_rule();
```

**Alternative (Computed Column):**
```sql
-- Add computed column
ALTER TABLE gl_chart_of_accounts
ADD COLUMN has_children BOOLEAN GENERATED ALWAYS AS (
  EXISTS (SELECT 1 FROM gl_chart_of_accounts AS child WHERE child.parent_account_id = gl_chart_of_accounts.id)
) STORED;

-- Constraint
ALTER TABLE gl_chart_of_accounts
ADD CONSTRAINT chk_postable_no_children
CHECK (NOT (is_postable = true AND has_children = true));
```

---

### 12.8 Update Approval Workflow (P1)

**Critical Fields Requiring Approval:**
- `account_type` (IMMUTABLE — cannot change)
- `normal_balance` (IMMUTABLE — cannot change)
- `account_code` (IMMUTABLE — cannot change)
- `parent_account_id` (requires Controller approval)
- `is_postable` (requires Controller approval)
- `currency` (requires Manager approval)

**Non-Critical Fields (No Approval):**
- `account_name`
- `description`
- `tags`

**Workflow:**
```typescript
interface UpdateAccountRequest {
  accountId: string;
  updates: Partial<ChartOfAccount>;
}

// Backend logic
function processUpdate(request) {
  const criticalFieldsChanged = detectCriticalFieldChanges(request.updates);
  
  if (criticalFieldsChanged.includes('parent_account_id') || 
      criticalFieldsChanged.includes('is_postable')) {
    // Create pending change request
    createChangeRequest({
      accountId: request.accountId,
      changes: request.updates,
      requiresApprovalBy: 'controller',
      status: 'PENDING_APPROVAL'
    });
    return { status: 'PENDING_APPROVAL', changeRequestId: '...' };
  } else {
    // Apply immediately
    applyUpdate(request);
    return { status: 'APPLIED' };
  }
}
```

**Data Model (Change Requests):**
```typescript
interface AccountChangeRequest {
  id: string;
  account_id: string;
  proposed_changes: Partial<ChartOfAccount>;  // JSON diff
  requested_by: string;
  requested_at: Date;
  approved_by?: string;
  approved_at?: Date;
  rejected_by?: string;
  rejected_at?: Date;
  rejection_reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}
```

---

### 12.9 Period-Close Interaction (P1)

**Enhanced Rules:**

| Lifecycle Stage | COA Change Allowed? | Rule |
|-----------------|---------------------|------|
| **Before first posting** | ✅ All fields | No restrictions |
| **After first posting** | ⚠️ Limited | `account_type`, `normal_balance` **LOCKED** |
| **After period close** | ⚠️ Very limited | Hierarchy changes **BLOCKED** unless controlled reopen |
| **After reporting (10-K filed)** | ❌ Frozen | Only description/tags changeable |

**Implementation:**
```sql
-- Add tracking field
ALTER TABLE gl_chart_of_accounts
ADD COLUMN first_posting_date DATE;
ADD COLUMN is_frozen BOOLEAN DEFAULT false;

-- Update trigger (set first_posting_date on first journal entry)
CREATE TRIGGER trg_coa_first_posting
AFTER INSERT ON gl_journal_lines
FOR EACH ROW
EXECUTE FUNCTION mark_account_first_posting();

-- Validation function
CREATE FUNCTION validate_coa_change() RETURNS TRIGGER AS $$
BEGIN
  -- Block immutable fields after first posting
  IF OLD.first_posting_date IS NOT NULL THEN
    IF NEW.account_type <> OLD.account_type OR 
       NEW.normal_balance <> OLD.normal_balance THEN
      RAISE EXCEPTION 'Cannot change account_type or normal_balance after first posting';
    END IF;
  END IF;
  
  -- Block hierarchy changes after period close (check against K_TIME)
  IF OLD.parent_account_id <> NEW.parent_account_id THEN
    -- Call K_TIME to check if any period is closed
    -- If closed, require controlled reopen flag
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### 12.10 Cache Dependency & Invalidation (P1)

**Cache Service:** Redis (added to dependencies)

**Cache Strategy:**

| Cache Key | Data | TTL | Invalidation Trigger |
|-----------|------|-----|----------------------|
| `coa:{company_id}:active` | All active accounts | 1 hour | Any account approve/update/deactivate |
| `coa:{company_id}:{account_code}` | Single account | 24 hours | Specific account update |
| `coa:{company_id}:tree` | Full hierarchy | 1 hour | Any hierarchy change |

**Invalidation Logic:**
```typescript
async function invalidateCoaCache(companyId: string, accountCode?: string) {
  await redis.del(`coa:${companyId}:active`);
  await redis.del(`coa:${companyId}:tree`);
  if (accountCode) {
    await redis.del(`coa:${companyId}:${accountCode}`);
  }
}

// Call on mutations
accountService.on('account.updated', (event) => {
  invalidateCoaCache(event.companyId, event.accountCode);
});
```

**Updated Dependencies:**
```typescript
| Service | Usage | Criticality |
|---------|-------|-------------|
| **K_CACHE** (Redis) | Account lookup caching | 🟡 Performance |
```

---

### 12.11 Missing Test Coverage (P2)

**Add to Section 10 (Test Strategy):**

#### 10.5 Hierarchy & Postable Tests
- [ ] `test_parent_with_children_cannot_be_postable()`
- [ ] `test_child_account_can_be_postable()`
- [ ] `test_postable_trigger_updates_parent_on_child_creation()`
- [ ] `test_ltree_path_auto_updates_on_parent_change()`

#### 10.6 Effective-Date Tests
- [ ] `test_cannot_post_before_effective_date()`
- [ ] `test_can_post_on_or_after_effective_date()`

#### 10.7 Multi-Entity Mapping Tests
- [ ] `test_create_group_to_local_account_mapping()`
- [ ] `test_consolidation_rollup_with_mappings()`
- [ ] `test_mapping_effective_date_logic()`

#### 10.8 Balance Check Tests
- [ ] `test_deactivation_blocked_when_balance_nonzero()`
- [ ] `test_deactivation_with_auto_transfer_to_replacement()`

#### 10.9 Cache Invalidation Tests
- [ ] `test_cache_invalidated_on_account_update()`
- [ ] `test_cache_hit_for_active_account_lookup()`

#### 10.10 Period-Close Interaction Tests
- [ ] `test_cannot_change_account_type_after_first_posting()`
- [ ] `test_cannot_change_hierarchy_after_period_close()`

#### 10.11 Authorization & RLS Tests
- [ ] `test_tenant_isolation_enforced()`
- [ ] `test_company_isolation_enforced()`
- [ ] `test_user_cannot_access_other_tenant_accounts()`

---

## 13. Open Questions (for User Review)

1. **Account Code Format:** Should it be numeric (e.g., `1000`) or alphanumeric (e.g., `CASH-USD-01`)? Or company-configurable with validation regex?
2. **Multi-Currency Accounts:** Should we support currency-specific accounts (e.g., `1000-USD`, `1000-SGD`) or allow one account to handle multiple currencies?
3. **Effective-Date Model:** Prefer validation-based (status=ACTIVE immediately, check at posting) or scheduled-based (cron job flips status on effective date)?
4. **Deactivation with Balance:** Allow auto-transfer to replacement account, or require manual journal entry first?
5. **Historical Queries:** Do we need to query "what was the COA structure on 2024-01-01"? (Time travel queries via temporal tables?)
6. **Multi-Entity Consolidation:** Should group-level COA be mandatory for all tenants, or optional (only for holding companies)?
7. **Bulk Import Approval:** Should bulk-imported accounts require individual approval, batch approval, or auto-approve if from template?
8. **Hierarchy Depth:** Is 5 levels sufficient, or do we need deeper nesting (e.g., 10 levels for complex organizations)?

---

## 14. Document Control

| Property | Value |
|----------|-------|
| **Cell Code** | GL-01 |
| **PRD Version** | 1.1 (Major Revision) |
| **Status** | 🟡 Awaiting User Review |
| **Author** | AI-BOS Architecture Team |
| **Created** | 2025-12-17 |
| **Last Updated** | 2025-12-17 |
| **Quality Gate** | 1 of 2 (PRD Review) |

### Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| **1.0** | 2025-12-17 | Initial draft | AI-BOS Team |
| **1.1** | 2025-12-17 | **P0/P1 Corrections:** Fixed wrong postable constraint, added missing List/Search/Tree APIs, added multi-entity mapping design, defined effective-date activation model, specified balance source for deactivation, chose `ltree` for hierarchy, added postable enforcement trigger, defined update approval workflow, enhanced period-close interaction, added cache invalidation plan, expanded test coverage | AI-BOS Team |

### P0/P1 Issues Addressed in v1.1

✅ **P0 Must-Fix:**
1. Fixed wrong DB constraint for summary accounts (trigger-based enforcement)
2. Fixed SoD field name mismatch (`approved_by` aligned)
3. Removed "custom account types" promise (5 standard only)
4. Added List/Search/Tree APIs with pagination
5. Added bulk import + COA templates + migration flow
6. Designed multi-entity mapping tables (`GroupChartOfAccount`, `GroupAccountMapping`)

✅ **P1 Data & Lifecycle:**
7. Defined effective-date activation model (validation-based recommended)
8. Specified balance source for deactivation (computed from `gl_journal_lines`)
9. Chose `ltree` for hierarchy storage with indexing strategy
10. Defined update approval workflow (critical vs. non-critical fields)
11. Enhanced period-close interaction (progressive field locking)
12. Added cache dependency + invalidation plan (Redis)

✅ **P2 Tests:**
13. Added comprehensive test coverage for all new features

---

**🔴 USER ACTION REQUIRED:**  
Please review this **REVISED** PRD (v1.1) against the Quality Gate Checklist (Appendix J in CONT_07).  
All P0/P1 gaps have been addressed.  
**Approve** this design to proceed to Architecture Review, or **Provide Feedback** for further revision.
