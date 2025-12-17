# PRD: TR-01 Bank Master

> **Cell Code:** TR-01  
> **Domain:** Treasury (DOM-06)  
> **Status:** 🟡 Design Phase — Awaiting User Review  
> **Created:** 2025-12-17  
> **Author:** AI-BOS Architecture Team

---

## 0. Executive Summary

The **Bank Master** cell is the **registry of authorized bank accounts** used for cash management. It defines which bank accounts exist, their GL linkages, and controls which users can initiate/approve transactions for each account.

**Why This Cell Exists:** Without centralized bank account governance, unauthorized accounts could be used for payments (fraud risk), GL account mappings would be inconsistent, and bank reconciliation would be impossible.

**AIS Justification (Romney & Steinbart):**  
The Bank Master is a **critical master file** in the Treasury Cycle. It enforces **Authorization Control** (only approved banks) and **Custody of Assets** (cash held in verified institutions).

**COSO Mapping:**  
- **Control Activity:** Master data control — prevents payments to unauthorized bank accounts
- **Assertion:** Existence — ensures bank accounts are real and verified

---

## 1. Business Justification

### 1.1 Problem Statement

**Current Pain Points:**
- ❌ No centralized registry of authorized bank accounts
- ❌ Payments going to unverified accounts (fraud risk)
- ❌ Inconsistent GL account mapping (cash accounts)
- ❌ Missing bank account metadata (SWIFT, IBAN, routing numbers)
- ❌ No audit trail for bank account changes

### 1.2 Success Criteria

| # | Metric | Target | Measurement |
|---|--------|--------|-------------|
| 1 | **Authorized Bank Enforcement** | 100% | All payments require link to approved bank account |
| 2 | **GL Mapping Accuracy** | 100% | Every bank account mapped to exactly one GL cash account |
| 3 | **Bank Detail Validation** | 100% | IBAN, SWIFT, routing numbers validated before approval |
| 4 | **Audit Trail** | 100% | Every bank account change logged |
| 5 | **Duplicate Detection** | 100% | No duplicate bank accounts (same account number) |

---

## 2. Scope Definition

### 2.1 IN SCOPE

✅ **Bank Account Master Data Management**
- Create bank accounts with full metadata
- Update bank account details (with approval)
- Deactivate/reactivate bank accounts
- Link bank accounts to GL cash accounts

✅ **Bank Account Types**
- Checking (operating account)
- Savings (reserve account)
- Payroll (dedicated payroll)
- Lockbox (customer payments)
- Sweep (auto-transfer to main account)
- Imprest (petty cash fund with bank backing)

✅ **Bank Details**
- Bank name, branch, address
- Account number
- Currency (single-currency per account)
- SWIFT code, IBAN, routing number, sort code
- Account holder name (legal entity)

✅ **Access Control**
- Define which users can view/initiate/approve transactions per bank account
- Multi-level approval for high-value transactions
- Segregation of duties (payer ≠ approver)

✅ **Bank Account Verification**
- Micro-deposit verification
- Bank statement upload for proof
- External verification service integration (e.g., Plaid, Yodlee)

### 2.2 OUT OF SCOPE

❌ **Bank Reconciliation Logic** — That's TR-05
❌ **Cash Pooling/Sweep Logic** — That's TR-02
❌ **Payments Execution** — That's AP-05 (AP) and customer receipts (AR)
❌ **FX Hedging** — That's TR-03
❌ **Credit Card Accounts** — Future cell

---

## 3. Functional Requirements

### 3.1 Bank Account Lifecycle State Machine

```
┌─────────────────────────────────────────────────────────────┐
│              BANK ACCOUNT LIFECYCLE                          │
│                                                              │
│   DRAFT ──► VERIFICATION ──► ACTIVE ──► INACTIVE            │
│      │           │              │                            │
│      │           │              └──► SUSPENDED (temp block)  │
│      │           │                      │                    │
│      │           │                      └──► ACTIVE          │
│      │           └──► REJECTED                               │
│      │                                                       │
│      └──► CANCELLED                                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

| State | Description | Can Transact? | Transitions |
|-------|-------------|:-------------:|-------------|
| **DRAFT** | New account, pending verification | ❌ No | → VERIFICATION, → CANCELLED |
| **VERIFICATION** | Micro-deposit verification in progress | ❌ No | → ACTIVE (verified), → REJECTED (failed) |
| **ACTIVE** | Live, available for transactions | ✅ Yes | → INACTIVE, → SUSPENDED |
| **SUSPENDED** | Temporarily blocked | ❌ No | → ACTIVE (reactivate) |
| **INACTIVE** | Permanently closed | ❌ No | None (terminal) |
| **REJECTED** | Failed verification | ❌ No | → DRAFT (retry) |
| **CANCELLED** | Withdrawn before activation | ❌ No | None (terminal) |

### 3.2 Core Operations

#### 3.2.1 Create Bank Account

**Input:**
```typescript
{
  companyId: string;
  bankName: string;
  branchName?: string;
  bankAddress: string;
  
  accountNumber: string;         // Encrypted at rest
  accountName: string;           // Legal entity name
  accountType: 'checking' | 'savings' | 'payroll' | 'lockbox' | 'sweep' | 'imprest';
  currency: string;              // ISO 4217
  
  // International identifiers
  swiftCode?: string;            // For international wires
  iban?: string;                 // European standard
  routingNumber?: string;        // US ACH/wire
  sortCode?: string;             // UK standard
  
  // GL Mapping
  glAccountCode: string;         // Must be asset account type 'Cash'
  
  // Access Control
  authorizedViewers: string[];   // User IDs who can view balance
  authorizedInitiators: string[]; // Who can create transactions
  authorizedApprovers: string[]; // Who can approve transactions
  
  // Limits
  dailyTransactionLimit?: Money;
  singleTransactionLimit?: Money;
  
  // Metadata
  purpose?: string;              // "Operating account for SG entity"
  tags?: string[];
}
```

**Validations:**
- Account number must be unique within company
- GL account must exist (GL-01), be active, and be type = 'asset' (cash account)
- Currency must match GL account currency (if GL account is single-currency)
- SWIFT/IBAN/routing number format validation
- SoD: Initiators ∩ Approvers = ∅ (no overlap)

**Business Rules:**
- Checking accounts require daily transaction limit
- Payroll accounts can only be used for payroll transactions
- Lockbox accounts are receive-only (no outbound payments)

**Output:**
- Created bank account (status: DRAFT)
- Verification process initiated
- Audit event: `treasury.bank.created`

#### 3.2.2 Verify Bank Account (Micro-Deposit)

**Process:**
1. System sends micro-deposits to bank account ($0.01, $0.02)
2. User confirms amounts received (via bank statement)
3. If amounts match, account status → ACTIVE
4. If amounts don't match after 3 attempts, status → REJECTED

**Input:**
```typescript
{
  bankAccountId: string;
  microDepositAmount1: Money;
  microDepositAmount2: Money;
  verifiedBy: string;
}
```

**Validations:**
- Amounts must match system-generated micro-deposits
- Verification must occur within 5 business days

**Output:**
- Bank account status → ACTIVE (if verified)
- Audit event: `treasury.bank.verified`

**Alternative Verification Methods:**
- Upload bank statement (manual review)
- Plaid/Yodlee instant verification (API integration)

#### 3.2.3 Update Bank Account

**Input:**
```typescript
{
  bankAccountId: string;
  updates: {
    bankName?: string;
    branchName?: string;
    bankAddress?: string;
    accountName?: string;
    // Note: accountNumber, SWIFT, IBAN are IMMUTABLE
    glAccountCode?: string;      // Requires Controller approval
    authorizedViewers?: string[];
    authorizedInitiators?: string[];
    authorizedApprovers?: string[];
    dailyTransactionLimit?: Money;
    singleTransactionLimit?: Money;
  };
  approvedBy?: string;           // Required for critical fields
}
```

**Approval Required For:**
- `glAccountCode` change (Controller approval)
- `authorizedApprovers` change (CFO approval)
- Transaction limit increase (Controller approval)

**Immutable Fields (Cannot Change):**
- `accountNumber`, `swiftCode`, `iban`, `routingNumber` (if wrong, deactivate and create new)

**Output:**
- Updated bank account
- Audit event: `treasury.bank.updated`

#### 3.2.4 Deactivate Bank Account

**Input:**
```typescript
{
  bankAccountId: string;
  deactivationDate: Date;
  reason: string;
  replacementBankAccountId?: string;  // For migration
}
```

**Validations:**
- Account must be ACTIVE or SUSPENDED
- Cannot deactivate if account has pending transactions
- Cannot deactivate if account is sole operating account for company

**Output:**
- Account status → INACTIVE
- All pending transactions cancelled or reassigned
- Audit event: `treasury.bank.deactivated`

#### 3.2.5 Validate Bank Account (for Payment)

**Input:**
```typescript
{
  bankAccountId: string;
  transactionType: 'inbound' | 'outbound';
  transactionAmount: Money;
  initiatedBy: string;
}
```

**Validation Logic:**
```typescript
1. Bank account exists?
2. Bank account is ACTIVE?
3. User authorized for this transaction type?
4. Transaction amount within limits?
5. Currency matches?
6. Account type allows this transaction? (e.g., lockbox = inbound only)
```

**Output:**
```typescript
{
  valid: boolean;
  accountDetails?: {
    accountNumber: string;       // Masked: XXXX1234
    accountName: string;
    bankName: string;
    currency: string;
    glAccountCode: string;
  };
  errorCode?: string;
  errorMessage?: string;
}
```

---

## 4. Control Points

### 4.1 Segregation of Duties (SoD)

| Action | Creator | Approver | Treasury Manager | CFO |
|--------|:-------:|:--------:|:----------------:|:---:|
| Create Bank Account | ✅ | ❌ | ✅ | ❌ |
| Verify Bank Account | ❌ | ✅ | ✅ | ❌ |
| Update Critical Fields | ❌ | ✅ | ✅ | ✅ (for approvers) |
| Deactivate Bank Account | ❌ | ✅ | ✅ | ✅ |
| Initiate Payment | ✅ (if authorized) | ❌ | ✅ | ❌ |
| Approve Payment | ❌ Cannot be initiator | ✅ (if authorized) | ✅ | ✅ |

**Database Constraint:**
```sql
-- Authorized initiators and approvers cannot overlap
CREATE FUNCTION check_bank_account_sod() RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM unnest(NEW.authorized_initiators) AS initiator
    WHERE initiator = ANY(NEW.authorized_approvers)
  ) THEN
    RAISE EXCEPTION 'SoD Violation: User cannot be both initiator and approver';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bank_account_sod
BEFORE INSERT OR UPDATE ON treasury_bank_accounts
FOR EACH ROW EXECUTE FUNCTION check_bank_account_sod();
```

### 4.2 Authorization Matrix

| Role | Can Create | Can Approve | Can Deactivate | Can Update Limits |
|------|:----------:|:-----------:|:--------------:|:-----------------:|
| Treasury Officer | ✅ | ❌ | ❌ | ❌ |
| Treasury Manager | ✅ | ✅ | ❌ | ✅ |
| Controller | ✅ | ✅ | ✅ | ✅ |
| CFO | ✅ | ✅ | ✅ | ✅ |

### 4.3 Audit Requirements

Every mutation (CREATE/UPDATE/DELETE) **MUST** log:

| Event Type | Logged Data |
|------------|-------------|
| `treasury.bank.created` | Bank account details (account number masked), creator ID |
| `treasury.bank.verified` | Verification method, verifier ID, timestamp |
| `treasury.bank.updated` | Before/after diff (JSON patch), updater ID, approver ID |
| `treasury.bank.deactivated` | Deactivation reason, deactivator ID, replacement account |
| `treasury.bank.access_granted` | User ID, access type (viewer/initiator/approver) |
| `treasury.bank.access_revoked` | User ID, revoked access type |

---

## 5. GL Impact

**GL Posting:** This cell **DOES NOT** create journal entries itself.

**However, it provides:**
- **GL Account Mapping:** Bank account → Cash GL account
- **Reconciliation Link:** TR-05 (Bank Reconciliation) uses this mapping

**Required by:**
- **AP-05 (Payment Execution):** Validates payment bank account
- **AR-03 (Receipt Processing):** Validates receipt bank account
- **TR-05 (Bank Reconciliation):** Links bank statement to GL account

**Data Flow:**
```
TR-01 (Bank Master) ──► AP-05 (Payment) ──► GL-03 (Posting)
                    │
                    └──► AR-03 (Receipt) ──► GL-03 (Posting)
                    │
                    └──► TR-05 (Reconciliation)
```

---

## 6. Data Model

### 6.1 Primary Entity: `treasury_bank_accounts`

```typescript
interface BankAccount {
  // ═══════════════════════════════════════════════════════════
  // IDENTITY
  // ═══════════════════════════════════════════════════════════
  id: string;
  tenant_id: string;
  company_id: string;
  
  // ═══════════════════════════════════════════════════════════
  // BANK INFORMATION
  // ═══════════════════════════════════════════════════════════
  bank_name: string;
  branch_name?: string;
  bank_address: string;
  
  // ═══════════════════════════════════════════════════════════
  // ACCOUNT DETAILS (ENCRYPTED)
  // ═══════════════════════════════════════════════════════════
  account_number_encrypted: string;  // AES-256 encrypted
  account_number_masked: string;     // XXXX1234 for display
  account_number_hash: string;       // ⚠️ P0 FIX: SHA-256 hash for uniqueness (not encrypted value)
  account_name: string;              // Legal entity name
  account_type: BankAccountType;
  currency: string;
  
  // ═══════════════════════════════════════════════════════════
  // INTERNATIONAL IDENTIFIERS
  // ═══════════════════════════════════════════════════════════
  swift_code?: string;
  iban?: string;
  routing_number?: string;
  sort_code?: string;
  
  // ═══════════════════════════════════════════════════════════
  // GL MAPPING
  // ═══════════════════════════════════════════════════════════
  gl_account_code: string;           // FK to GL-01
  gl_account_name: string;           // Denormalized
  
  // ═══════════════════════════════════════════════════════════
  // ACCESS CONTROL
  // ═══════════════════════════════════════════════════════════
  authorized_viewers: string[];       // User IDs
  authorized_initiators: string[];    // User IDs (cannot overlap with approvers)
  authorized_approvers: string[];     // User IDs
  
  // ═══════════════════════════════════════════════════════════
  // LIMITS
  // ═══════════════════════════════════════════════════════════
  daily_transaction_limit?: Money;
  single_transaction_limit?: Money;
  
  // ═══════════════════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════════════════
  status: BankAccountStatus;
  effective_date?: Date;
  deactivation_date?: Date;
  deactivation_reason?: string;
  replacement_bank_account_id?: string;
  
  // ═══════════════════════════════════════════════════════════
  // VERIFICATION (⚠️ P0 FIX: Added state tracking)
  // ═══════════════════════════════════════════════════════════
  verification_method?: 'micro_deposit' | 'bank_statement' | 'plaid' | 'yodlee';
  verification_attempt_count: number;        // Max 3 attempts
  verification_expires_at?: Date;            // 5 business days from initiation
  verification_microdeposit_1?: number;      // Encrypted in DB
  verification_microdeposit_2?: number;      // Encrypted in DB
  verification_microdeposit_hash?: string;   // SHA-256 for tamper detection
  last_verification_attempt_at?: Date;
  verified_at?: Date;
  verified_by?: string;
  rejection_reason?: string;                 // If verification failed
  
  // ═══════════════════════════════════════════════════════════
  // METADATA
  // ═══════════════════════════════════════════════════════════
  purpose?: string;
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
  version: number;
}
```

### 6.2 Enums

```typescript
enum BankAccountType {
  CHECKING = 'checking',
  SAVINGS = 'savings',
  PAYROLL = 'payroll',
  LOCKBOX = 'lockbox',
  SWEEP = 'sweep',
  IMPREST = 'imprest'
}

enum BankAccountStatus {
  DRAFT = 'draft',
  VERIFICATION = 'verification',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}
```

### 6.3 Indexes

```sql
CREATE INDEX idx_bank_company ON treasury_bank_accounts(company_id);
CREATE INDEX idx_bank_status ON treasury_bank_accounts(status);
CREATE INDEX idx_bank_gl_account ON treasury_bank_accounts(gl_account_code);
```

### 6.4 Child Entity: `treasury_bank_account_change_requests` (⚠️ P0 FIX)

**Purpose:** All updates to protected fields must go through approval workflow.

```typescript
interface BankAccountChangeRequest {
  id: string;
  tenant_id: string;
  bank_account_id: string;
  
  change_type: 'gl_account_mapping' | 'authorized_approvers' | 'transaction_limits' | 'account_details';
  proposed_changes: Record<string, any>;  // JSON diff
  
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'applied';
  
  requested_by: string;
  requested_at: Date;
  
  approved_by?: string;
  approved_at?: Date;
  
  rejected_by?: string;
  rejected_at?: Date;
  rejection_reason?: string;
  
  applied_at?: Date;
  applied_by?: string;
}
```

### 6.5 Constraints

```sql
-- ⚠️ P0 FIX: Account uniqueness via HASH (not encrypted value)
ALTER TABLE treasury_bank_accounts 
ADD CONSTRAINT uq_bank_account_hash 
UNIQUE (company_id, account_number_hash);

-- GL account must be cash type
ALTER TABLE treasury_bank_accounts
ADD CONSTRAINT fk_bank_gl_account FOREIGN KEY (gl_account_code) 
REFERENCES gl_chart_of_accounts(account_code);

-- ⚠️ P0 FIX: Max 3 verification attempts
ALTER TABLE treasury_bank_accounts
ADD CONSTRAINT chk_bank_verification_max_attempts
CHECK (verification_attempt_count <= 3);

-- SoD trigger (see section 4.1)
-- ⚠️ P0 FIX: Change request SoD
ALTER TABLE treasury_bank_account_change_requests
ADD CONSTRAINT chk_bank_change_sod
CHECK (approved_by IS NULL OR approved_by <> requested_by);
```

---

## 7. Dependencies

### 7.1 Kernel Services Required

| Service | Usage | Criticality |
|---------|-------|-------------|
| **K_AUTH** | Identity, role verification | 🔴 Blocking |
| **K_LOG** | Audit trail | 🔴 Blocking |
| **K_POLICY** | Approval rules | 🔴 Blocking |

### 7.2 Upstream Dependencies

| Cell | Dependency | Usage |
|------|------------|-------|
| **GL-01** (COA) | Validates GL cash accounts | Ensure bank account mapped to valid cash account |

### 7.3 Downstream Dependencies (Who depends on TR-01?)

| Cell | Usage |
|------|-------|
| **AP-05** (Payment Execution) | Validates payment bank account |
| **AR-03** (Receipt Processing) | Validates receipt bank account |
| **TR-05** (Bank Reconciliation) | Links bank statement to GL account |

---

## 8. Non-Functional Requirements

### 8.1 Performance

| Operation | Target | Measurement |
|-----------|--------|-------------|
| **Bank Account Validation** | < 50ms | P99 |
| **Account Creation** | < 500ms | End-to-end |
| **Account Lookup** | < 20ms | Cached in Redis |

### 8.2 Security

- **Encryption at Rest:** Account numbers (AES-256)
- **Encryption in Transit:** TLS 1.3
- **PCI DSS Compliance:** For payment card-linked accounts
- **Access Logging:** Every account access logged

### 8.3 Scalability

- **Expected Volume:** ~50 bank accounts per company
- **Max Accounts per Tenant:** 5,000 (across all companies)

### 8.4 Availability

- **Uptime SLA:** 99.9%
- **RPO:** 5 minutes
- **RTO:** 1 hour

---

## 9. Edge Cases & Error Scenarios

| # | Scenario | Expected Behavior |
|---|----------|------------------|
| 1 | **Attempt to create duplicate account number** | Reject with `DUPLICATE_ACCOUNT_NUMBER` |
| 2 | **Micro-deposit verification fails 3 times** | Status → REJECTED, require manual verification |
| 3 | **User in both initiators and approvers lists** | Reject with `SOD_VIOLATION` |
| 4 | **GL account is not cash type** | Reject with `INVALID_GL_ACCOUNT_TYPE` |
| 5 | **Deactivate sole operating account** | Reject with `CANNOT_DEACTIVATE_SOLE_ACCOUNT` |
| 6 | **Payment to inactive bank account** | Reject with `BANK_ACCOUNT_INACTIVE` |
| 7 | **Concurrent update (version mismatch)** | Reject with `VERSION_CONFLICT` (409) |
| 8 | **IBAN format invalid** | Reject with `INVALID_IBAN_FORMAT` |
| 9 | **User not in authorized list attempts transaction** | Reject with `UNAUTHORIZED_USER` |
| 10 | **Transaction exceeds daily limit** | Reject with `DAILY_LIMIT_EXCEEDED` |

---

## 10. Test Strategy

### 10.1 Unit Tests

- [ ] Create bank account with valid data
- [ ] Create bank account with invalid IBAN format
- [ ] Verify bank account (micro-deposit happy path)
- [ ] Verify bank account (failed verification)
- [ ] Update bank account details
- [ ] Update immutable fields (reject)
- [ ] Deactivate bank account
- [ ] Deactivate sole operating account (reject)
- [ ] Validate bank account for payment
- [ ] Validate bank account with unauthorized user (reject)
- [ ] Check SoD enforcement (initiator in approvers list)

### 10.2 SoD Tests

- [ ] `test_initiator_cannot_be_approver()`
- [ ] `test_database_constraint_enforces_sod()`

### 10.3 Integration Tests

- [ ] Create → Verify → Use in payment (AP-05)
- [ ] Link bank account to GL account (GL-01)
- [ ] Bank reconciliation (TR-05) uses bank account GL mapping
- [ ] Multi-company bank account isolation

### 10.4 Control Tests

- [ ] `test_audit_event_on_create()`
- [ ] `test_audit_event_on_verification()`
- [ ] `test_account_number_encryption()`

---

## 11. Success Metrics (Post-Implementation)

| Metric | Target | How Measured |
|--------|--------|--------------|
| **Unauthorized Bank Blocks** | 100% | Payments to non-ACTIVE accounts blocked |
| **SoD Violations Blocked** | 100% | Count of SoD errors |
| **GL Mapping Accuracy** | 100% | All bank accounts mapped to cash accounts |
| **Verification Success Rate** | > 95% | Micro-deposit verification success |
| **Dashboard Health Score** | > 90 | Based on active accounts, pending verifications |

---

## 11. Account Number Hash Computation (⚠️ P0 FIX)

### 11.1 Problem Statement

**Issue:** Encrypted account numbers use random IV/salt → ciphertext is not deterministic.

**Example Bug:**
```typescript
// Same account number, different encryptions:
encrypt("123456789", randomIV1) → "a1b2c3..."
encrypt("123456789", randomIV2) → "x9y8z7..."

// Unique constraint on encrypted value would allow duplicates!
```

**Solution:** Store deterministic hash for uniqueness checking.

### 11.2 Hash Algorithm

**Formula:**
```
account_number_hash = SHA-256(
  company_id || '||' || 
  UPPER(TRIM(bank_name)) || '||' || 
  NORMALIZE(account_number)
)
```

**Normalization:**
- Remove all non-digit characters: `"1234-5678"` → `"12345678"`
- Trim whitespace
- Uppercase (for bank name)

**Implementation:**
```typescript
function computeBankAccountHash(
  companyId: string,
  bankName: string,
  accountNumber: string
): string {
  const normalized = accountNumber.replace(/[^0-9]/g, '');
  const input = `${companyId}||${bankName.trim().toUpperCase()}||${normalized}`;
  return crypto.createHash('sha256').update(input).digest('hex');
}
```

**Database Function:**
```sql
CREATE FUNCTION compute_bank_account_hash(
  p_company_id UUID,
  p_bank_name TEXT,
  p_account_number TEXT
) RETURNS VARCHAR(64);
-- (See DB-GUARDRAILS.sql for full implementation)
```

### 11.3 Usage

**On Account Creation:**
```typescript
const accountNumberHash = computeBankAccountHash(
  input.companyId,
  input.bankName,
  input.accountNumber
);

await bankAccountRepo.create({
  ...input,
  accountNumberEncrypted: encrypt(input.accountNumber),
  accountNumberMasked: maskAccountNumber(input.accountNumber),
  accountNumberHash,  // ← Used for uniqueness check
});
```

**Uniqueness Check:**
```sql
-- This constraint uses the hash (deterministic)
CREATE UNIQUE INDEX uq_bank_account_hash 
ON treasury_bank_accounts(company_id, account_number_hash);
```

---

## 12. Protected Field Update Workflow (⚠️ P0 FIX)

### 11.1 Change Request Process

**Critical Fields Requiring Approval:**
- `gl_account_code` (Controller approval required)
- `authorized_approvers` (CFO approval required)
- `daily_transaction_limit` (Controller approval for increases)
- `single_transaction_limit` (Controller approval for increases)

**Immutable Fields (Cannot Change):**
- `account_number`, `swift_code`, `iban`, `routing_number`, `sort_code`
- If these are wrong → deactivate account and create new one

**Non-Critical Fields (Direct Update):**
- `bank_name`, `branch_name`, `bank_address` (metadata corrections)
- `purpose`, `tags` (descriptive fields)

### 11.2 Update Process

```typescript
async function updateBankAccount(
  bankAccountId: string,
  updates: Partial<BankAccount>,
  actor: ActorContext
): Promise<BankAccount | ChangeRequest> {
  const criticalFields = ['gl_account_code', 'authorized_approvers', 'daily_transaction_limit'];
  const changedCritical = Object.keys(updates).some(k => criticalFields.includes(k));
  
  if (changedCritical) {
    // Create change request (requires approval)
    const changeRequest = await createChangeRequest({
      bankAccountId,
      changeType: determineChangeType(updates),
      proposedChanges: updates,
      requestedBy: actor.userId,
      status: 'draft',
    });
    
    return { type: 'change_request', id: changeRequest.id };
  } else {
    // Direct update (non-critical fields)
    return await bankAccountRepo.update(bankAccountId, updates);
  }
}
```

### 11.3 Apply Approved Change

**After CFO/Controller approval:**

```sql
-- Call DB function to apply changes atomically
SELECT apply_bank_account_change_request('change-request-uuid');

-- Function validates:
-- 1. Change request status = 'approved'
-- 2. Applies JSONB changes to bank account
-- 3. Marks change request as 'applied'
-- 4. Emits audit event
```

---

## 13. Open Questions (for User Review)

1. **Verification Method:** Should we support instant verification (Plaid/Yodlee) in addition to micro-deposits?
2. **Multi-Currency Accounts:** Should we allow one bank account to handle multiple currencies, or enforce single-currency per account?
3. **Virtual Accounts:** Should we support virtual account numbers (sub-accounts under one master account)?
4. **External Integration:** Do we need to integrate with banking APIs for real-time balance checking?
5. **Joint Accounts:** Should we support multi-company joint accounts (e.g., Treasury pooling)?
6. **Change Request Auto-Approval:** Should low-risk changes (e.g., tag updates) auto-approve, or all changes require human approval?
7. **Hash Algorithm:** Is SHA-256 sufficient, or should we use bcrypt/argon2 for hash computation?

---

## 14. Document Control

| Property | Value |
|----------|-------|
| **Cell Code** | TR-01 |
| **PRD Version** | 1.0 |
| **Status** | 🟡 Awaiting User Review |
| **Author** | AI-BOS Architecture Team |
| **Created** | 2025-12-17 |
| **Quality Gate** | 1 of 2 (PRD Review) |

---

**🔴 USER ACTION REQUIRED:**  
Please review this PRD against the Quality Gate Checklist (Appendix J in CONT_07).  
**Approve** this design to proceed to Architecture Review, or **Provide Feedback** for revision.
