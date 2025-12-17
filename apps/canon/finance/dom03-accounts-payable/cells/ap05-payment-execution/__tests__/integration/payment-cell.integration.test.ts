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
import { PaymentService } from '../../PaymentService';
import { ApprovalService } from '../../ApprovalService';
import { ExecutionService } from '../../ExecutionService';
import {
  SqlPaymentRepository,
  createMemoryFiscalTimeAdapter,
  createMemoryPolicyAdapter,
  createMemoryGLPostingAdapter,
  setPeriodStatus,
  clearPeriods,
  SqlAuditRepo,
  SqlEventBus,
} from '@aibos/kernel-adapters';
import type { ActorContext } from '@aibos/canon-governance';

describe('AP-05 Payment Cell Integration Tests', () => {
  let pool: Pool;
  let tenantId: string;
  let companyId: string;
  let paymentService: PaymentService;
  let approvalService: ApprovalService;
  let executionService: ExecutionService;
  let creatorActor: ActorContext;
  let approverActor: ActorContext;

  beforeAll(async () => {
    pool = await setupTestDatabase();
    tenantId = randomUUID();
    companyId = randomUUID();

    // Create test tenant (required for foreign key constraint)
    await pool.query(
      'INSERT INTO kernel.tenants (id, name, status) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING',
      [tenantId, 'Test Tenant', 'active']
    );

    // Create SQL adapters
    const paymentRepo = new SqlPaymentRepository(pool);
    const auditPort = new SqlAuditRepo(pool);
    const eventBus = new SqlEventBus(pool);
    const fiscalTimePort = createMemoryFiscalTimeAdapter();
    const policyPort = createMemoryPolicyAdapter();
    const glPostingPort = createMemoryGLPostingAdapter();

    // Initialize services
    paymentService = new PaymentService(
      paymentRepo,
      auditPort,
      fiscalTimePort,
      eventBus
    );

    approvalService = new ApprovalService(
      paymentRepo,
      auditPort,
      policyPort,
      eventBus
    );

    executionService = new ExecutionService(
      paymentRepo,
      auditPort,
      eventBus,
      glPostingPort
    );

    // Create test actors
    creatorActor = {
      userId: randomUUID(),
      tenantId,
      companyId,
      sessionId: randomUUID(),
      type: 'user' as const,
      roles: ['ap_maker'],
    };

    approverActor = {
      userId: randomUUID(), // Different user for SoD
      tenantId,
      companyId,
      sessionId: randomUUID(),
      type: 'user' as const,
      roles: ['ap_approver'],
    };

    // Set up open period for testing
    const today = new Date();
    const periodId = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    setPeriodStatus(tenantId, periodId, 'OPEN');
  });

  afterAll(async () => {
    await cleanupTestDatabase(pool);
  });

  beforeEach(async () => {
    // Clean test data before each test (but keep tenant)
    await pool.query(`
      TRUNCATE 
        finance.payments, 
        finance.payment_approvals, 
        kernel.audit_events,
        finance.payment_outbox
      CASCADE
    `);
    clearPeriods();

    // Re-setup open period
    const today = new Date();
    const periodId = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    setPeriodStatus(tenantId, periodId, 'OPEN');
  });

  // ============================================================================
  // TEST 1: SoD Violations = 0
  // ============================================================================
  describe('SoD Enforcement', () => {
    it('test_creator_cannot_approve_own_payment', async () => {
      // Create payment
      const payment = await paymentService.create(
        {
          vendorId: randomUUID(),
          vendorName: 'Test Vendor',
          amount: '1000.00',
          currency: 'USD',
          paymentDate: new Date(),
          sourceDocumentId: randomUUID(),
          sourceDocumentType: 'invoice',
        },
        creatorActor,
        randomUUID()
      );

      // Submit for approval
      await executionService.submit(payment.id, creatorActor, payment.version);

      // Refresh payment to get updated version
      const updated = await pool.query(
        'SELECT * FROM finance.payments WHERE id = $1',
        [payment.id]
      );
      const currentVersion = updated.rows[0].version;

      // Try to approve own payment (should fail)
      await expect(
        approvalService.approve(payment.id, creatorActor, currentVersion)
      ).rejects.toThrow(/SoD|Segregation of Duties/i);
    });

    it('allows different user to approve', async () => {
      const payment = await paymentService.create(
        {
          vendorId: randomUUID(),
          vendorName: 'Test Vendor',
          amount: '1000.00',
          currency: 'USD',
          paymentDate: new Date(),
          sourceDocumentId: randomUUID(),
          sourceDocumentType: 'invoice',
        },
        creatorActor,
        randomUUID()
      );

      await executionService.submit(payment.id, creatorActor, payment.version);

      const updated = await pool.query(
        'SELECT * FROM finance.payments WHERE id = $1',
        [payment.id]
      );
      const currentVersion = updated.rows[0].version;

      // Different user can approve
      const result = await approvalService.approve(
        payment.id,
        approverActor,
        currentVersion
      );

      expect(result.success).toBe(true);
      expect(result.payment.status).toBe('approved');
    });
  });

  // ============================================================================
  // TEST 2: Concurrency Conflicts Handled = 100%
  // ============================================================================
  describe('Concurrency Control', () => {
    it('test_stale_version_returns_409', async () => {
      const payment = await paymentService.create(
        {
          vendorId: randomUUID(),
          vendorName: 'Test Vendor',
          amount: '1000.00',
          currency: 'USD',
          paymentDate: new Date(),
          sourceDocumentId: randomUUID(),
          sourceDocumentType: 'invoice',
        },
        creatorActor,
        randomUUID()
      );

      await executionService.submit(payment.id, creatorActor, payment.version);

      const updated = await pool.query(
        'SELECT * FROM finance.payments WHERE id = $1',
        [payment.id]
      );
      const currentVersion = updated.rows[0].version;

      // Simulate concurrent update (version mismatch)
      await expect(
        approvalService.approve(payment.id, approverActor, currentVersion - 1) // Stale version
      ).rejects.toThrow(/Payment was modified|ConcurrencyConflict|version mismatch/i);
    });
  });

  // ============================================================================
  // TEST 3: Idempotent Creates = 100%
  // ============================================================================
  describe('Idempotency', () => {
    it('test_duplicate_key_returns_original', async () => {
      const idempotencyKey = randomUUID();

      const payment1 = await paymentService.create(
        {
          vendorId: randomUUID(),
          vendorName: 'Test Vendor',
          amount: '1000.00',
          currency: 'USD',
          paymentDate: new Date(),
        },
        creatorActor,
        idempotencyKey
      );

      // Duplicate create with same key
      const payment2 = await paymentService.create(
        {
          vendorId: randomUUID(),
          vendorName: 'Different Vendor',
          amount: '2000.00',
          currency: 'USD',
          paymentDate: new Date(),
        },
        creatorActor,
        idempotencyKey
      );

      expect(payment2.id).toBe(payment1.id); // Same payment returned
      expect(payment2.amount).toBe(payment1.amount); // Original data preserved
    });
  });

  // ============================================================================
  // TEST 4: Period Lock Enforcement = 100%
  // ============================================================================
  describe('Period Lock', () => {
    it('test_closed_period_payment_rejected', async () => {
      const closedDate = new Date('2020-01-01'); // Past closed period
      const periodId = '2020-01';
      setPeriodStatus(tenantId, periodId, 'HARD_CLOSE');

      await expect(
        paymentService.create(
          {
            vendorId: randomUUID(),
            vendorName: 'Test Vendor',
            amount: '1000.00',
            currency: 'USD',
            paymentDate: closedDate,
          },
          creatorActor,
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
      const payment = await paymentService.create(
        {
          vendorId: randomUUID(),
          vendorName: 'Test Vendor',
          amount: '1000.00',
          currency: 'USD',
          paymentDate: new Date(),
          sourceDocumentId: randomUUID(),
          sourceDocumentType: 'invoice',
        },
        creatorActor,
        randomUUID()
      );

      // Check audit event exists
      const auditResult = await pool.query(
        `SELECT * FROM kernel.audit_events 
         WHERE resource_id = $1 AND action = 'finance.ap.payment.created'`,
        [payment.id]
      );

      expect(auditResult.rows).toHaveLength(1);
      expect(auditResult.rows[0].actor_id).toBe(creatorActor.userId);

      // Submit and check audit
      await executionService.submit(payment.id, creatorActor, payment.version);

      const submitAudit = await pool.query(
        `SELECT * FROM kernel.audit_events 
         WHERE resource_id = $1 AND action = 'finance.ap.payment.submitted'`,
        [payment.id]
      );

      expect(submitAudit.rows).toHaveLength(1);
    });
  });

  // ============================================================================
  // TEST 6: Money Precision = 0.0001
  // ============================================================================
  describe('Money Precision', () => {
    it('test_money_addition_preserves_precision', async () => {
      const payment = await paymentService.create(
        {
          vendorId: randomUUID(),
          vendorName: 'Test Vendor',
          amount: '1234.5678', // 4 decimal places
          currency: 'USD',
          paymentDate: new Date(),
          sourceDocumentId: randomUUID(),
          sourceDocumentType: 'invoice',
        },
        creatorActor,
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
      const payment = await paymentService.create(
        {
          vendorId: randomUUID(),
          vendorName: 'Test Vendor',
          amount: '1000.00',
          currency: 'USD',
          paymentDate: new Date(),
          sourceDocumentId: randomUUID(),
          sourceDocumentType: 'invoice',
        },
        creatorActor,
        randomUUID()
      );

      // Submit and approve
      await executionService.submit(payment.id, creatorActor, payment.version);
      const updated = await pool.query(
        'SELECT * FROM finance.payments WHERE id = $1',
        [payment.id]
      );
      await approvalService.approve(payment.id, approverActor, updated.rows[0].version);

      // Try to update approved payment (should fail via trigger)
      await expect(
        pool.query('UPDATE finance.payments SET amount = $1 WHERE id = $2', [
          '2000.00',
          payment.id,
        ])
      ).rejects.toThrow(/immutable|restrict_violation/i);
    });
  });
});
