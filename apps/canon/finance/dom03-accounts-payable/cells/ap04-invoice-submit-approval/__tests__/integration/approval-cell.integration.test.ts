/**
 * AP-04 Invoice Approval Workflow Integration Tests
 * 
 * Real database tests for the approval workflow cell.
 * 
 * @file apps/canon/finance/dom03-accounts-payable/cells/ap04-invoice-submit-approval/__tests__/integration/approval-cell.integration.test.ts
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { Pool } from 'pg';
import {
  getTestPool,
  closeTestPool,
  cleanupTestData,
  insertTestVendor,
  insertTestInvoice,
  insertTestApprovalRoute,
  createIntegrationTestActor,
  createApproverActor,
  TEST_TENANT_ID,
  TEST_USER_ID,
  TEST_APPROVER_ID,
  TEST_APPROVER_L2_ID,
} from './setup';
import { SqlApprovalRepository } from '@aibos/kernel-adapters';
import { ApprovalService } from '../../';
import type { ApprovalRepositoryPort, AuditPort, AuditEvent } from '@aibos/kernel-core';
import type { ApprovalTransactionContext } from '../../ApprovalTypes';

// ============================================================================
// TEST SETUP
// ============================================================================

let pool: Pool;
let approvalRepo: ApprovalRepositoryPort;
let approvalService: ApprovalService;

// Mock audit adapter
class IntegrationAuditAdapter implements AuditPort {
  private events: AuditEvent[] = [];

  async append(): Promise<void> {}

  async emitTransactional(event: AuditEvent, _txContext: ApprovalTransactionContext): Promise<void> {
    this.events.push(event);
    console.log('[AUDIT]', event.eventType, event.entityId);
  }

  async query() {
    return { events: this.events, total: this.events.length };
  }

  getEvents(): AuditEvent[] {
    return [...this.events];
  }

  clear(): void {
    this.events = [];
  }
}

// Mock invoice port
class IntegrationInvoicePort {
  private invoices = new Map<string, { id: string; status: string; totalAmountCents: number; createdBy: string }>();

  async getInvoiceForApproval(invoiceId: string, _tenantId: string) {
    return this.invoices.get(invoiceId) || null;
  }

  async updateInvoiceApprovalStatus(invoiceId: string, status: string): Promise<void> {
    const invoice = this.invoices.get(invoiceId);
    if (invoice) {
      invoice.status = status;
    }
  }

  addInvoice(invoice: { id: string; status: string; totalAmountCents: number; createdBy: string }): void {
    this.invoices.set(invoice.id, invoice);
  }

  clear(): void {
    this.invoices.clear();
  }
}

// Mock GL posting port
class IntegrationGLPort {
  async postInvoice(_invoiceId: string, _txContext: ApprovalTransactionContext): Promise<{ journalHeaderId: string }> {
    return { journalHeaderId: 'JE-TEST-001' };
  }
}

// Mock policy port for approval routing
class IntegrationPolicyPort {
  async getApprovalRoute(_tenantId: string, _companyId: string, amountCents: number) {
    // Simple routing: < 10000 = 1 level, >= 10000 = 2 levels
    return {
      requiredLevels: amountCents < 1000000 ? 1 : 2,
      approvers: [
        { level: 1, userId: TEST_APPROVER_ID, role: 'ap-approver-l1' },
        { level: 2, userId: TEST_APPROVER_L2_ID, role: 'ap-approver-l2' },
      ],
    };
  }
}

const auditPort = new IntegrationAuditAdapter();
const invoicePort = new IntegrationInvoicePort();
const glPort = new IntegrationGLPort();
const policyPort = new IntegrationPolicyPort();

describe('AP-04 Invoice Approval Workflow Integration Tests', () => {
  beforeAll(async () => {
    pool = await getTestPool();
    approvalRepo = new SqlApprovalRepository(pool);
    
    // @ts-expect-error - Using mock ports for testing
    approvalService = new ApprovalService(
      approvalRepo,
      invoicePort,
      glPort,
      policyPort,
      auditPort
    );

    // Ensure test vendor exists
    await insertTestVendor(pool);
    
    // Create default approval route
    await insertTestApprovalRoute(pool);
  });

  afterAll(async () => {
    await closeTestPool();
  });

  beforeEach(async () => {
    await cleanupTestData(pool);
    auditPort.clear();
    invoicePort.clear();
  });

  // ============================================================================
  // SUBMIT FOR APPROVAL TESTS
  // ============================================================================

  describe('Submit for Approval', () => {
    it('should submit invoice for approval', async () => {
      const actor = createIntegrationTestActor();
      const invoiceId = await insertTestInvoice(pool, {
        status: 'matched',
        totalAmountCents: 50000,
      });

      invoicePort.addInvoice({
        id: invoiceId,
        status: 'matched',
        totalAmountCents: 50000,
        createdBy: TEST_USER_ID,
      });

      const result = await approvalService.submitForApproval(invoiceId, actor);

      expect(result).toBeDefined();
      expect(result.invoiceId).toBe(invoiceId);
      expect(result.status).toBe('pending_approval');
      expect(result.currentLevel).toBe(1);
    });

    it('should determine approval route based on amount', async () => {
      const actor = createIntegrationTestActor();
      const invoiceId = await insertTestInvoice(pool, {
        status: 'matched',
        totalAmountCents: 2000000, // High value = 2 levels
      });

      invoicePort.addInvoice({
        id: invoiceId,
        status: 'matched',
        totalAmountCents: 2000000,
        createdBy: TEST_USER_ID,
      });

      const result = await approvalService.submitForApproval(invoiceId, actor);

      expect(result).toBeDefined();
      expect(result.requiredLevels).toBe(2);
    });
  });

  // ============================================================================
  // APPROVAL FLOW TESTS
  // ============================================================================

  describe('Approval Flow', () => {
    it('should approve invoice (single level)', async () => {
      const submitter = createIntegrationTestActor();
      const approver = createApproverActor(1);
      
      const invoiceId = await insertTestInvoice(pool, {
        status: 'matched',
        totalAmountCents: 50000,
      });

      invoicePort.addInvoice({
        id: invoiceId,
        status: 'matched',
        totalAmountCents: 50000,
        createdBy: TEST_USER_ID,
      });

      // Submit for approval
      await approvalService.submitForApproval(invoiceId, submitter);

      // Approve
      const result = await approvalService.approve(invoiceId, 'Approved', approver);

      expect(result).toBeDefined();
      expect(result.status).toBe('approved');
      expect(result.approvedBy).toBe(TEST_APPROVER_ID);
    });

    it('should enforce SoD - creator cannot approve own invoice', async () => {
      const creator = createIntegrationTestActor({ userId: TEST_USER_ID });
      
      const invoiceId = await insertTestInvoice(pool, {
        status: 'matched',
        totalAmountCents: 50000,
      });

      invoicePort.addInvoice({
        id: invoiceId,
        status: 'matched',
        totalAmountCents: 50000,
        createdBy: TEST_USER_ID,
      });

      // Submit for approval
      await approvalService.submitForApproval(invoiceId, creator);

      // Attempt to approve own invoice - should fail
      await expect(
        approvalService.approve(invoiceId, 'Self approval', creator)
      ).rejects.toThrow(/cannot approve/i);
    });

    it('should handle multi-level approval', async () => {
      const submitter = createIntegrationTestActor();
      const approverL1 = createApproverActor(1);
      const approverL2 = createApproverActor(2);
      
      const invoiceId = await insertTestInvoice(pool, {
        status: 'matched',
        totalAmountCents: 2000000, // High value = 2 levels
      });

      invoicePort.addInvoice({
        id: invoiceId,
        status: 'matched',
        totalAmountCents: 2000000,
        createdBy: TEST_USER_ID,
      });

      // Submit for approval
      await approvalService.submitForApproval(invoiceId, submitter);

      // Level 1 approval
      const afterL1 = await approvalService.approve(invoiceId, 'L1 OK', approverL1);
      expect(afterL1.status).toBe('pending_approval');
      expect(afterL1.currentLevel).toBe(2);

      // Level 2 approval (final)
      const afterL2 = await approvalService.approve(invoiceId, 'L2 OK', approverL2);
      expect(afterL2.status).toBe('approved');
    });
  });

  // ============================================================================
  // REJECTION TESTS
  // ============================================================================

  describe('Rejection Flow', () => {
    it('should reject invoice', async () => {
      const submitter = createIntegrationTestActor();
      const approver = createApproverActor(1);
      
      const invoiceId = await insertTestInvoice(pool, {
        status: 'matched',
        totalAmountCents: 50000,
      });

      invoicePort.addInvoice({
        id: invoiceId,
        status: 'matched',
        totalAmountCents: 50000,
        createdBy: TEST_USER_ID,
      });

      // Submit for approval
      await approvalService.submitForApproval(invoiceId, submitter);

      // Reject
      const result = await approvalService.reject(
        invoiceId, 
        'Missing documentation', 
        approver
      );

      expect(result).toBeDefined();
      expect(result.status).toBe('rejected');
      expect(result.rejectedBy).toBe(TEST_APPROVER_ID);
      expect(result.rejectionReason).toBe('Missing documentation');
    });

    it('should enforce SoD - creator cannot reject own invoice', async () => {
      const creator = createIntegrationTestActor({ userId: TEST_USER_ID });
      
      const invoiceId = await insertTestInvoice(pool, {
        status: 'matched',
        totalAmountCents: 50000,
      });

      invoicePort.addInvoice({
        id: invoiceId,
        status: 'matched',
        totalAmountCents: 50000,
        createdBy: TEST_USER_ID,
      });

      await approvalService.submitForApproval(invoiceId, creator);

      // Attempt to reject own invoice - should fail
      await expect(
        approvalService.reject(invoiceId, 'Self rejection', creator)
      ).rejects.toThrow(/cannot reject/i);
    });
  });

  // ============================================================================
  // APPROVAL INBOX TESTS
  // ============================================================================

  describe('Approval Inbox', () => {
    it('should list pending approvals for user', async () => {
      const submitter = createIntegrationTestActor();
      const approver = createApproverActor(1);
      
      // Create multiple invoices pending approval
      for (let i = 0; i < 3; i++) {
        const invoiceId = await insertTestInvoice(pool, {
          status: 'matched',
          totalAmountCents: 50000,
          invoiceNumber: `INV-INBOX-${i}`,
        });

        invoicePort.addInvoice({
          id: invoiceId,
          status: 'matched',
          totalAmountCents: 50000,
          createdBy: TEST_USER_ID,
        });

        await approvalService.submitForApproval(invoiceId, submitter);
      }

      // Get inbox
      const inbox = await approvalService.getApprovalInbox(approver);

      expect(inbox).toBeDefined();
      expect(Array.isArray(inbox)).toBe(true);
      expect(inbox.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ============================================================================
  // APPROVAL HISTORY TESTS
  // ============================================================================

  describe('Approval History', () => {
    it('should maintain approval history', async () => {
      const submitter = createIntegrationTestActor();
      const approver = createApproverActor(1);
      
      const invoiceId = await insertTestInvoice(pool, {
        status: 'matched',
        totalAmountCents: 50000,
      });

      invoicePort.addInvoice({
        id: invoiceId,
        status: 'matched',
        totalAmountCents: 50000,
        createdBy: TEST_USER_ID,
      });

      // Submit and approve
      await approvalService.submitForApproval(invoiceId, submitter);
      await approvalService.approve(invoiceId, 'Approved', approver);

      // Get history
      const history = await approvalService.getApprovalHistory(invoiceId, submitter);

      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // IMMUTABILITY TESTS
  // ============================================================================

  describe('Immutability', () => {
    it('should not allow modification of approval records', async () => {
      const submitter = createIntegrationTestActor();
      const approver = createApproverActor(1);
      
      const invoiceId = await insertTestInvoice(pool, {
        status: 'matched',
        totalAmountCents: 50000,
      });

      invoicePort.addInvoice({
        id: invoiceId,
        status: 'matched',
        totalAmountCents: 50000,
        createdBy: TEST_USER_ID,
      });

      await approvalService.submitForApproval(invoiceId, submitter);
      await approvalService.approve(invoiceId, 'Approved', approver);

      // Attempt to approve again - should fail
      await expect(
        approvalService.approve(invoiceId, 'Double approval', approver)
      ).rejects.toThrow();
    });
  });

  // ============================================================================
  // AUDIT TRAIL TESTS
  // ============================================================================

  describe('Audit Trail', () => {
    it('should emit audit events for all actions', async () => {
      const submitter = createIntegrationTestActor();
      const approver = createApproverActor(1);
      
      const invoiceId = await insertTestInvoice(pool, {
        status: 'matched',
        totalAmountCents: 50000,
      });

      invoicePort.addInvoice({
        id: invoiceId,
        status: 'matched',
        totalAmountCents: 50000,
        createdBy: TEST_USER_ID,
      });

      auditPort.clear();
      
      await approvalService.submitForApproval(invoiceId, submitter);
      await approvalService.approve(invoiceId, 'Approved', approver);

      const events = auditPort.getEvents();
      
      // Should have at least 2 events: submit + approve
      expect(events.length).toBeGreaterThanOrEqual(2);
      
      // Verify event types
      const eventTypes = events.map(e => e.eventType);
      expect(eventTypes).toContain('ap.invoice.submitted_for_approval');
      expect(eventTypes).toContain('ap.invoice.approved');
    });
  });
});
