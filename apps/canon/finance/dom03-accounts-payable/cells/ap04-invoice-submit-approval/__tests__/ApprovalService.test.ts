/**
 * ApprovalService Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ApprovalService } from '../ApprovalService';
import { MemoryApprovalRepository } from '@aibos/kernel-adapters';
import {
  createTestActor,
  createTestInvoice,
  createMockInvoicePort,
  createMockPolicyPort,
  createMockAuditPort,
} from './setup';
import {
  InvoiceNotFoundForApprovalError,
  InvoiceNotMatchedError,
  AlreadyApprovedError,
  NotPendingApprovalError,
} from '../errors';

describe('ApprovalService', () => {
  let approvalService: ApprovalService;
  let approvalRepo: MemoryApprovalRepository;
  let invoicePort: ReturnType<typeof createMockInvoicePort>;
  let policyPort: ReturnType<typeof createMockPolicyPort>;
  let auditPort: ReturnType<typeof createMockAuditPort>;

  const testTenantId = '00000000-0000-0000-0000-000000000001';
  const creatorUserId = '00000000-0000-0000-0000-000000000002';
  const approverUserId = '00000000-0000-0000-0000-000000000003';

  beforeEach(() => {
    approvalRepo = new MemoryApprovalRepository();
    invoicePort = createMockInvoicePort();
    policyPort = createMockPolicyPort();
    auditPort = createMockAuditPort();

    approvalService = new ApprovalService(
      approvalRepo,
      invoicePort,
      policyPort,
      auditPort
    );
  });

  describe('Request Approval', () => {
    it('should create approval route for matched invoice', async () => {
      const actor = createTestActor({ tenantId: testTenantId });
      const invoice = createTestInvoice({
        tenantId: testTenantId,
        matchStatus: 'passed',
      });
      invoicePort.addInvoice(invoice);

      const route = await approvalService.requestApproval(invoice.id, actor);

      expect(route).toBeDefined();
      expect(route.invoiceId).toBe(invoice.id);
      expect(route.totalLevels).toBe(1);
    });

    it('should throw if invoice not matched', async () => {
      const actor = createTestActor({ tenantId: testTenantId });
      const invoice = createTestInvoice({
        tenantId: testTenantId,
        matchStatus: 'exception',
      });
      invoicePort.addInvoice(invoice);

      await expect(
        approvalService.requestApproval(invoice.id, actor)
      ).rejects.toThrow(InvoiceNotMatchedError);
    });

    it('should throw if invoice not found', async () => {
      const actor = createTestActor({ tenantId: testTenantId });

      await expect(
        approvalService.requestApproval('non-existent-id', actor)
      ).rejects.toThrow(InvoiceNotFoundForApprovalError);
    });
  });

  describe('Approve', () => {
    it('should approve invoice at level 1', async () => {
      const requester = createTestActor({ userId: creatorUserId, tenantId: testTenantId });
      const approver = createTestActor({ userId: approverUserId, tenantId: testTenantId });
      
      const invoice = createTestInvoice({
        tenantId: testTenantId,
        createdBy: creatorUserId,
        matchStatus: 'passed',
      });
      invoicePort.addInvoice(invoice);

      await approvalService.requestApproval(invoice.id, requester);

      const approval = await approvalService.approve(
        invoice.id,
        { comments: 'Looks good' },
        approver
      );

      expect(approval.decision).toBe('approved');
      expect(approval.comments).toBe('Looks good');
      expect(approval.actionedAt).toBeDefined();
    });

    it('should not allow double approval', async () => {
      const requester = createTestActor({ userId: creatorUserId, tenantId: testTenantId });
      const approver = createTestActor({ userId: approverUserId, tenantId: testTenantId });
      
      const invoice = createTestInvoice({
        tenantId: testTenantId,
        createdBy: creatorUserId,
        matchStatus: 'passed',
      });
      invoicePort.addInvoice(invoice);

      await approvalService.requestApproval(invoice.id, requester);
      await approvalService.approve(invoice.id, {}, approver);

      await expect(
        approvalService.approve(invoice.id, {}, approver)
      ).rejects.toThrow(AlreadyApprovedError);
    });
  });

  describe('Reject', () => {
    it('should reject invoice', async () => {
      const requester = createTestActor({ userId: creatorUserId, tenantId: testTenantId });
      const approver = createTestActor({ userId: approverUserId, tenantId: testTenantId });
      
      const invoice = createTestInvoice({
        tenantId: testTenantId,
        createdBy: creatorUserId,
        matchStatus: 'passed',
      });
      invoicePort.addInvoice(invoice);

      await approvalService.requestApproval(invoice.id, requester);

      const rejection = await approvalService.reject(
        invoice.id,
        { reason: 'Invalid documentation' },
        approver
      );

      expect(rejection.decision).toBe('rejected');
      expect(rejection.comments).toBe('Invalid documentation');
    });
  });

  describe('Get Inbox', () => {
    it('should return pending approvals for user', async () => {
      const actor = createTestActor({ tenantId: testTenantId });
      const invoice = createTestInvoice({
        tenantId: testTenantId,
        matchStatus: 'passed',
      });
      invoicePort.addInvoice(invoice);

      await approvalService.requestApproval(invoice.id, actor);

      const inbox = await approvalService.getInbox(actor);

      expect(inbox.items.length).toBe(1);
      expect(inbox.items[0].invoiceId).toBe(invoice.id);
    });
  });

  describe('Get Approval History', () => {
    it('should return approval history for invoice', async () => {
      const requester = createTestActor({ userId: creatorUserId, tenantId: testTenantId });
      const approver = createTestActor({ userId: approverUserId, tenantId: testTenantId });
      
      const invoice = createTestInvoice({
        tenantId: testTenantId,
        createdBy: creatorUserId,
        matchStatus: 'passed',
      });
      invoicePort.addInvoice(invoice);

      await approvalService.requestApproval(invoice.id, requester);
      await approvalService.approve(invoice.id, { comments: 'Approved' }, approver);

      const history = await approvalService.getApprovalHistory(invoice.id, approver);

      expect(history.length).toBe(1);
      expect(history[0].decision).toBe('approved');
    });
  });
});
