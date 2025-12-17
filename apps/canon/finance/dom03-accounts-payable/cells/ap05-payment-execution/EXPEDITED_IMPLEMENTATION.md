# 🚀 Expedited Implementation Guide - AP-05 Payment Cell

**Goal:** Complete Phase 5d (Integration Tests) and Phase 5e (OpenAPI Spec) using Next.js 16 best practices

**Time Estimate:** 2-3 hours total

---

## 📋 Quick Status Check

✅ **Completed:**
- Phase 1-4: All core functionality
- Phase 5a-c: Audit, Outbox, BFF wiring
- Phase 5f: Error boundaries + Toast (via Next.js 16 improvements)

🚧 **Remaining:**
- Phase 5d: Integration Tests (1-2 hours)
- Phase 5e: OpenAPI Spec (0.5-1 hour)

---

## 🎯 Phase 5d: Integration Tests (Expedited)

### Strategy: Use Existing Docker Compose Pattern

**Why:** Your project already uses Docker Compose for Postgres. This is faster than setting up testcontainers and aligns with your CI/CD patterns.

### Step 1: Create Test Setup Helper

**File:** `apps/canon/finance/dom03-accounts-payable/cells/payment-execution/__tests__/integration/setup.ts`

```typescript
/**
 * Integration Test Setup
 * 
 * Uses existing Docker Compose Postgres (port 5433)
 * Fast setup - no testcontainers overhead
 */

import { Pool } from 'pg';
import { execSync } from 'child_process';

const DATABASE_URL = process.env.DATABASE_URL || 
  'postgresql://aibos:aibos_password@localhost:5433/aibos_local';

let pool: Pool | null = null;

export async function setupTestDatabase(): Promise<Pool> {
  if (pool) return pool;

  pool = new Pool({
    connectionString: DATABASE_URL,
    max: 5,
  });

  // Run migrations
  try {
    execSync('pnpm --filter @aibos/db migrate', { 
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL }
    });
  } catch (error) {
    console.warn('Migration failed (may already be applied):', error);
  }

  return pool;
}

export async function cleanupTestDatabase(pool: Pool): Promise<void> {
  // Clean up test data (keep schema)
  await pool.query('TRUNCATE finance.payments, finance.payment_approvals, kernel.audit_events CASCADE');
  await pool.end();
  pool = null;
}

export function getTestPool(): Pool {
  if (!pool) throw new Error('Database not initialized. Call setupTestDatabase() first.');
  return pool;
}
```

### Step 2: Create Integration Test Suite

**File:** `apps/canon/finance/dom03-accounts-payable/cells/payment-execution/__tests__/integration/payment-cell.integration.test.ts`

```typescript
/**
 * AP-05 Payment Cell Integration Tests
 * 
 * Tests all 7 enterprise controls with real PostgreSQL:
 * 1. SoD (Segregation of Duties)
 * 2. Concurrency Control
 * 3. Idempotency
 * 4. Period Lock
 * 5. Audit Completeness
 * 6. Money Precision
 * 7. Immutability
 * 
 * Run: pnpm test:integration (from apps/canon)
 * Requires: Docker Compose Postgres running (pnpm --filter @aibos/db db:up)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Pool } from 'pg';
import { randomUUID } from 'crypto';
import { setupTestDatabase, cleanupTestDatabase, getTestPool } from './setup';
import { PaymentService } from '../PaymentService';
import { ApprovalService } from '../ApprovalService';
import { ExecutionService } from '../ExecutionService';
// Import your real adapters and ports
// import { PgPaymentRepository } from '@aibos/kernel-adapters';
// import { PgAuditAdapter } from '@aibos/kernel-adapters';
// ... etc

describe('AP-05 Payment Cell Integration Tests', () => {
  let pool: Pool;
  let tenantId: string;
  let companyId: string;
  let paymentService: PaymentService;
  let approvalService: ApprovalService;
  let executionService: ExecutionService;

  beforeAll(async () => {
    pool = await setupTestDatabase();
    tenantId = randomUUID();
    companyId = randomUUID();

    // Initialize services with real adapters
    // paymentService = new PaymentService(...);
    // approvalService = new ApprovalService(...);
    // executionService = new ExecutionService(...);
  });

  afterAll(async () => {
    await cleanupTestDatabase(pool);
  });

  beforeEach(async () => {
    // Clean test data before each test
    await pool.query('TRUNCATE finance.payments, finance.payment_approvals, kernel.audit_events CASCADE');
  });

  // ============================================================================
  // TEST 1: SoD Violations = 0
  // ============================================================================
  describe('SoD Enforcement', () => {
    it('test_creator_cannot_approve_own_payment', async () => {
      const creatorId = randomUUID();
      const actor = { userId: creatorId, tenantId, companyId };

      // Create payment
      const payment = await paymentService.create(
        {
          vendorId: randomUUID(),
          vendorName: 'Test Vendor',
          amount: '1000.00',
          currency: 'USD',
          paymentDate: new Date(),
        },
        actor,
        randomUUID()
      );

      // Try to approve own payment (should fail)
      await expect(
        approvalService.approve(payment.id, actor, payment.version)
      ).rejects.toThrow(/SoD|Segregation of Duties/i);
    });
  });

  // ============================================================================
  // TEST 2: Concurrency Conflicts Handled = 100%
  // ============================================================================
  describe('Concurrency Control', () => {
    it('test_stale_version_returns_409', async () => {
      const actor = { userId: randomUUID(), tenantId, companyId };
      const approver = { userId: randomUUID(), tenantId, companyId };

      const payment = await paymentService.create(
        {
          vendorId: randomUUID(),
          vendorName: 'Test Vendor',
          amount: '1000.00',
          currency: 'USD',
          paymentDate: new Date(),
        },
        actor,
        randomUUID()
      );

      // Simulate concurrent update (version mismatch)
      await expect(
        approvalService.approve(payment.id, approver, payment.version - 1) // Stale version
      ).rejects.toThrow(/ConcurrencyConflict|version mismatch/i);
    });
  });

  // ============================================================================
  // TEST 3: Idempotent Creates = 100%
  // ============================================================================
  describe('Idempotency', () => {
    it('test_duplicate_key_returns_original', async () => {
      const actor = { userId: randomUUID(), tenantId, companyId };
      const idempotencyKey = randomUUID();

      const payment1 = await paymentService.create(
        {
          vendorId: randomUUID(),
          vendorName: 'Test Vendor',
          amount: '1000.00',
          currency: 'USD',
          paymentDate: new Date(),
        },
        actor,
        idempotencyKey
      );

      // Duplicate create with same key
      const payment2 = await paymentService.create(
        {
          vendorId: randomUUID(),
          vendorName: 'Test Vendor',
          amount: '1000.00',
          currency: 'USD',
          paymentDate: new Date(),
        },
        actor,
        idempotencyKey
      );

      expect(payment2.id).toBe(payment1.id); // Same payment returned
    });
  });

  // ============================================================================
  // TEST 4: Period Lock Enforcement = 100%
  // ============================================================================
  describe('Period Lock', () => {
    it('test_closed_period_payment_rejected', async () => {
      const actor = { userId: randomUUID(), tenantId, companyId };
      const closedDate = new Date('2020-01-01'); // Past closed period

      await expect(
        paymentService.create(
          {
            vendorId: randomUUID(),
            vendorName: 'Test Vendor',
            amount: '1000.00',
            currency: 'USD',
            paymentDate: closedDate,
          },
          actor,
          randomUUID()
        )
      ).rejects.toThrow(/PeriodClosed|period is closed/i);
    });
  });

  // ============================================================================
  // TEST 5: Audit Completeness = 100%
  // ============================================================================
  describe('Audit Completeness', () => {
    it('test_every_mutation_has_audit_event', async () => {
      const actor = { userId: randomUUID(), tenantId, companyId };
      const approver = { userId: randomUUID(), tenantId, companyId };

      const payment = await paymentService.create(
        {
          vendorId: randomUUID(),
          vendorName: 'Test Vendor',
          amount: '1000.00',
          currency: 'USD',
          paymentDate: new Date(),
        },
        actor,
        randomUUID()
      );

      // Check audit event exists
      const auditResult = await pool.query(
        `SELECT * FROM kernel.audit_events 
         WHERE entity_id = $1 AND event_type = 'finance.ap.payment.created'`,
        [payment.id]
      );

      expect(auditResult.rows).toHaveLength(1);
      expect(auditResult.rows[0].actor_id).toBe(actor.userId);
    });
  });

  // ============================================================================
  // TEST 6: Money Precision = 0.0001
  // ============================================================================
  describe('Money Precision', () => {
    it('test_money_addition_preserves_precision', async () => {
      const actor = { userId: randomUUID(), tenantId, companyId };

      // Create payment with precise amount
      const payment = await paymentService.create(
        {
          vendorId: randomUUID(),
          vendorName: 'Test Vendor',
          amount: '1234.5678', // 4 decimal places
          currency: 'USD',
          paymentDate: new Date(),
        },
        actor,
        randomUUID()
      );

      // Verify precision preserved in DB
      const result = await pool.query(
        'SELECT amount FROM finance.payments WHERE id = $1',
        [payment.id]
      );

      expect(result.rows[0].amount).toBe('1234.5678');
    });
  });

  // ============================================================================
  // TEST 7: Immutability = 100%
  // ============================================================================
  describe('Immutability', () => {
    it('test_approved_payment_update_throws', async () => {
      const actor = { userId: randomUUID(), tenantId, companyId };
      const approver = { userId: randomUUID(), tenantId, companyId };

      const payment = await paymentService.create(
        {
          vendorId: randomUUID(),
          vendorName: 'Test Vendor',
          amount: '1000.00',
          currency: 'USD',
          paymentDate: new Date(),
        },
        actor,
        randomUUID()
      );

      // Submit and approve
      await executionService.submit(payment.id, actor, payment.version);
      const updated = await pool.query('SELECT * FROM finance.payments WHERE id = $1', [payment.id]);
      await approvalService.approve(payment.id, approver, updated.rows[0].version);

      // Try to update approved payment (should fail via trigger)
      await expect(
        pool.query('UPDATE finance.payments SET amount = $1 WHERE id = $2', ['2000.00', payment.id])
      ).rejects.toThrow(/immutable|restrict_violation/i);
    });
  });
});
```

### Step 3: Add Test Script

**Update:** `apps/canon/package.json`

```json
{
  "scripts": {
    "test:integration": "vitest run finance/dom03-accounts-payable/cells/payment-execution/__tests__/integration"
  }
}
```

---

## 🎯 Phase 5e: OpenAPI Spec (Expedited)

### Strategy: Manual Spec Generation (Fastest for Next.js 16)

**Why:** Next.js 16 doesn't have built-in OpenAPI generation. Manual spec is fastest and most accurate.

### Step 1: Create OpenAPI Spec

**File:** `apps/web/openapi/payments.yaml`

```yaml
openapi: 3.1.0
info:
  title: AP-05 Payment Execution API
  version: 1.0.0
  description: Enterprise payment execution with SoD, concurrency control, and idempotency

servers:
  - url: http://localhost:3000
    description: Local development

paths:
  /api/payments:
    post:
      summary: Create payment
      operationId: createPayment
      tags: [Payments]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreatePaymentInput'
      responses:
        '201':
          description: Payment created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Payment'
        '400':
          $ref: '#/components/responses/ValidationError'
        '409':
          $ref: '#/components/responses/ConcurrencyConflict'
      headers:
        X-Idempotency-Key:
          required: true
          schema:
            type: string
            format: uuid

  /api/payments/{id}:
    get:
      summary: Get payment by ID
      operationId: getPayment
      tags: [Payments]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Payment found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Payment'
        '404':
          $ref: '#/components/responses/NotFound'

  /api/payments/{id}/approve:
    post:
      summary: Approve payment
      operationId: approvePayment
      tags: [Payments]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ApprovalInput'
      responses:
        '200':
          description: Payment approved
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApprovalResult'
        '409':
          $ref: '#/components/responses/ConcurrencyConflict'
        '403':
          $ref: '#/components/responses/SoDViolation'
      headers:
        X-Idempotency-Key:
          required: true
          schema:
            type: string
            format: uuid

  # ... Add other endpoints (reject, submit, execute, complete, fail, retry)

components:
  schemas:
    CreatePaymentInput:
      type: object
      required: [vendorId, vendorName, amount, currency, paymentDate]
      properties:
        vendorId:
          type: string
          format: uuid
        vendorName:
          type: string
        amount:
          type: string
          pattern: '^\d+(\.\d{1,4})?$'
          description: Money as string (never float)
        currency:
          type: string
          default: USD
        paymentDate:
          type: string
          format: date
        dueDate:
          type: string
          format: date
        sourceDocumentId:
          type: string
          format: uuid
        sourceDocumentType:
          type: string
          enum: [invoice, tax, payroll]

    Payment:
      type: object
      properties:
        id:
          type: string
          format: uuid
        tenantId:
          type: string
          format: uuid
        companyId:
          type: string
          format: uuid
        paymentNumber:
          type: string
        vendorId:
          type: string
          format: uuid
        vendorName:
          type: string
        amount:
          type: string
        currency:
          type: string
        status:
          type: string
          enum: [draft, pending_approval, approved, rejected, processing, completed, failed]
        version:
          type: integer
        createdBy:
          type: string
          format: uuid
        createdAt:
          type: string
          format: date-time

    ApprovalInput:
      type: object
      required: [version]
      properties:
        version:
          type: integer
          description: Optimistic locking version
        comment:
          type: string

    ApprovalResult:
      type: object
      properties:
        success:
          type: boolean
        payment:
          $ref: '#/components/schemas/Payment'

  responses:
    ValidationError:
      description: Validation error
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                type: string
              code:
                type: string
                default: VALIDATION_ERROR

    ConcurrencyConflict:
      description: Version conflict
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                type: string
              code:
                type: string
                default: CONCURRENCY_CONFLICT

    SoDViolation:
      description: Segregation of Duties violation
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                type: string
              code:
                type: string
                default: SOD_VIOLATION

    NotFound:
      description: Resource not found
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                type: string
              code:
                type: string
                default: NOT_FOUND
```

### Step 2: Add Swagger UI Route (Optional)

**File:** `apps/web/app/api/docs/route.ts`

```typescript
/**
 * Swagger UI for Payment API
 * 
 * @improvement Next.js 16 Route Handler for API docs
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const specPath = path.join(process.cwd(), 'openapi', 'payments.yaml');
  const spec = fs.readFileSync(specPath, 'utf-8');
  
  // Return Swagger UI HTML or redirect to Swagger Editor
  return NextResponse.json({ 
    message: 'OpenAPI spec available at /openapi/payments.yaml',
    swaggerEditor: 'https://editor.swagger.io/?url=http://localhost:3000/openapi/payments.yaml'
  });
}
```

---

## ✅ Quick Implementation Checklist

### Phase 5d (Integration Tests) - 1-2 hours
- [ ] Create `__tests__/integration/setup.ts`
- [ ] Create `__tests__/integration/payment-cell.integration.test.ts`
- [ ] Add test script to `package.json`
- [ ] Run: `pnpm --filter @aibos/db db:up` (start Postgres)
- [ ] Run: `pnpm test:integration`
- [ ] Verify all 7 enterprise controls pass

### Phase 5e (OpenAPI Spec) - 0.5-1 hour
- [ ] Create `openapi/payments.yaml`
- [ ] Document all 10 endpoints
- [ ] Add request/response schemas
- [ ] Add error responses
- [ ] (Optional) Add Swagger UI route

### Update Plan
- [ ] Mark phase5-error-boundaries as completed
- [ ] Mark phase5-integration-tests as completed
- [ ] Mark phase5-api-docs as completed

---

## 🚀 Execution Commands

```bash
# 1. Start Postgres (if not running)
pnpm --filter @aibos/db db:up

# 2. Run integration tests
pnpm --filter @aibos/canon test:integration

# 3. View OpenAPI spec
cat apps/web/openapi/payments.yaml

# 4. (Optional) View in Swagger Editor
# Open: https://editor.swagger.io/
# Paste: apps/web/openapi/payments.yaml
```

---

## 📊 Success Criteria

| Metric | Target | Test |
|--------|--------|------|
| Integration Tests | 7/7 pass | All enterprise controls validated |
| OpenAPI Coverage | 100% | All 10 endpoints documented |
| Test Speed | < 30s | Fast execution with Docker Compose |

---

## 🎯 Next Steps After Completion

1. **CI/CD Integration:** Add integration tests to GitHub Actions
2. **API Client Generation:** Use OpenAPI spec to generate TypeScript client
3. **Documentation:** Publish OpenAPI spec to API docs portal

---

**Estimated Total Time:** 2-3 hours  
**Priority:** HIGH (Required for production readiness)
