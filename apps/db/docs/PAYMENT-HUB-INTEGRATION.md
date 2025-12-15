# Payment Hub Integration Requirements

> **Purpose:** Define the security and architectural requirements for integrating the Payment Hub Cell with the AI-BOS Data Fabric.

---

## 🎯 Objective

Connect the Payment Hub Cell to the database layer while maintaining:
1. **Role Boundaries** - No cross-schema access
2. **Tenant Isolation** - Strict tenant_id enforcement
3. **Journal Integrity** - Double-entry constraint compliance
4. **Immutability** - POSTED transactions cannot be modified

---

## 🏗️ Architecture Requirements

### 1. Database Role Assignment

The Payment Hub MUST connect using a finance-scoped role:

```sql
-- Payment Hub connects as this role
CREATE ROLE aibos_payment_hub_role NOLOGIN;

-- Grant ONLY finance schema access
GRANT USAGE ON SCHEMA finance TO aibos_payment_hub_role;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA finance TO aibos_payment_hub_role;

-- DENY kernel schema access (except via views)
REVOKE ALL ON SCHEMA kernel FROM aibos_payment_hub_role;

-- Allow config read for approval matrices
GRANT USAGE ON SCHEMA config TO aibos_payment_hub_role;
GRANT SELECT ON ALL TABLES IN SCHEMA config TO aibos_payment_hub_role;
```

**Verification:**
```sql
-- This MUST fail with permission denied
SET ROLE aibos_payment_hub_role;
SELECT * FROM kernel.users;  -- ❌ Permission denied
```

### 2. Tenant Context Propagation

The Payment Hub MUST pass tenant context through the TenantDb layer:

```typescript
import { createTenantDb, TenantContext } from '@aibos/db/lib/tenant-db';

// Payment Hub receives context from authenticated session
const ctx: TenantContext = {
  tenantId: session.tenantId,      // From JWT/session
  userId: session.userId,          // For audit trail
  correlationId: req.correlationId // For distributed tracing
};

// All queries use TenantDb
const tenantDb = createTenantDb(pool);

// ✅ Correct: Uses tenant context
const companies = await tenantDb.select(ctx, 'finance.companies', ['id', 'name']);

// ❌ Forbidden: Direct pool.query bypasses isolation
const companies = await pool.query('SELECT * FROM finance.companies');
```

### 3. Journal Creation Flow

The Payment Hub MUST follow the proper journal creation sequence:

```typescript
// Step 1: Create DRAFT journal entry
const journal = await tenantDb.insert(ctx, 'finance.journal_entries', {
  id: crypto.randomUUID(),
  company_id: payment.companyId,
  reference: `PAY-${payment.id}`,
  description: `Payment to ${payment.beneficiaryName}`,
  posting_date: payment.valueDate,
  status: 'DRAFT',  // MUST start as DRAFT
  created_by: ctx.userId,
});

// Step 2: Add BALANCED journal lines
await tenantDb.insert(ctx, 'finance.journal_lines', {
  id: crypto.randomUUID(),
  journal_entry_id: journal.id,
  account_id: payment.debitAccountId,
  direction: 'DEBIT',
  amount_cents: payment.amountCents,
  currency: payment.currency,
});

await tenantDb.insert(ctx, 'finance.journal_lines', {
  id: crypto.randomUUID(),
  journal_entry_id: journal.id,
  account_id: payment.creditAccountId,
  direction: 'CREDIT',
  amount_cents: payment.amountCents,  // MUST equal DEBIT
  currency: payment.currency,
});

// Step 3: Post the journal (triggers double-entry validation)
await tenantDb.update(ctx, 'finance.journal_entries', journal.id, {
  status: 'POSTED',
  posted_at: new Date().toISOString(),
});
```

### 4. User/Tenant Context Reading

The Payment Hub MUST NOT query `kernel.users` directly. Use approved patterns:

```typescript
// ❌ FORBIDDEN: Direct kernel access
const user = await pool.query('SELECT * FROM kernel.users WHERE id = $1', [userId]);

// ✅ ALLOWED: Receive context from Kernel API/Gateway
interface AuthenticatedSession {
  tenantId: string;
  userId: string;
  permissions: string[];
}

// ✅ ALLOWED: Read-only view (if created)
const userInfo = await tenantDb.selectGlobal(
  'kernel.v_user_context',  // View that Finance role can access
  ['user_id', 'tenant_id', 'display_name'],
  { user_id: ctx.userId }
);
```

---

## 🔐 Security Checklist

| Requirement | Status | Verification |
|-------------|--------|--------------|
| Uses `aibos_payment_hub_role` or `aibos_finance_role` | ⬜ TODO | `SELECT current_role` in Payment Hub |
| Cannot SELECT from `kernel.*` tables | ⬜ TODO | Permission denied test |
| All queries use TenantDb | ⬜ TODO | Code review + lint rule |
| Tenant context from session, not query | ⬜ TODO | Architecture review |
| Journals created as DRAFT first | ⬜ TODO | Test: POST fails on unbalanced |
| No direct pool.query() in business logic | ⬜ TODO | Grep for `pool.query` |

---

## 🧪 Integration Tests Required

### Test 1: Role Boundary Enforcement
```typescript
it('should NOT access kernel.users from Payment Hub', async () => {
  await pool.query('SET ROLE aibos_payment_hub_role');
  await expect(
    pool.query('SELECT * FROM kernel.users LIMIT 1')
  ).rejects.toThrow('permission denied');
});
```

### Test 2: Cross-Tenant Isolation
```typescript
it('should NOT see other tenant payments', async () => {
  const tenantAPayments = await paymentHub.listPayments(tenantAContext);
  for (const payment of tenantAPayments) {
    expect(payment.tenant_id).toBe(TENANT_A);
  }
});
```

### Test 3: Double-Entry Enforcement
```typescript
it('should reject unbalanced journal on POST', async () => {
  const payment = await paymentHub.createPayment({
    ...validPayment,
    debitAmount: 1000,
    creditAmount: 500, // Unbalanced!
  });
  
  await expect(
    paymentHub.postPayment(payment.id)
  ).rejects.toThrow('balance');
});
```

### Test 4: Immutability Enforcement
```typescript
it('should NOT modify posted payment', async () => {
  const payment = await paymentHub.createAndPostPayment(validPayment);
  
  await expect(
    paymentHub.updatePayment(payment.id, { amount: 9999 })
  ).rejects.toThrow('Cannot modify POSTED');
});
```

---

## 📊 Demo Flow with Payment Hub

### Part 1: Kernel Trust (Current - 5 min)
1. Show `v_governance_summary` - All checks PASS
2. Show `v_tenant_health` - 2 tenants, healthy
3. Attempt cross-tenant query - BLOCKED
4. Attempt modify POSTED journal - BLOCKED

### Part 2: Payment Hub Integration (New - 5 min)
5. Create payment in Tenant A via Payment Hub
6. Show approval workflow (if implemented)
7. Payment posts → Journal entry created
8. Show `v_journal_integrity` updated in real-time
9. Attempt to modify the posted payment - BLOCKED

### Part 3: Attack Resistance (New - 3 min)
10. "What if Payment Hub is compromised?"
11. Show: Payment Hub role CANNOT access kernel.users
12. Show: Even with DB access, tenant isolation enforced

### Part 4: Evidence Export (2 min)
13. Run `pnpm demo:trust`
14. Attach JSON as "Audit Workpaper"

---

## 📁 Files to Create

| File | Purpose |
|------|---------|
| `migrations/kernel/017_payment_hub_role.sql` | Create role with restricted permissions |
| `migrations/kernel/018_user_context_view.sql` | View for Payment Hub to read user context |
| `tests/payment-hub-integration.test.ts` | Integration tests |
| `apps/payment-hub/lib/db-client.ts` | TenantDb wrapper for Payment Hub |

---

## ✅ Acceptance Criteria

- [ ] Payment Hub connects with finance-scoped role
- [ ] All Payment Hub DB calls go through TenantDb
- [ ] Cross-tenant query returns 0 results (not error)
- [ ] Unbalanced journal POST fails with clear error
- [ ] Posted payment modification fails with clear error
- [ ] Demo script runs end-to-end without errors

---

**Version:** 1.0.0  
**Last Updated:** 2025-12-15
