/**
 * SoD Enforcement Tests
 * 
 * AP04-C01: Maker ≠ Checker enforced
 * 
 * Tests that invoice creators cannot approve their own invoices.
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
import { SoDViolationError } from '../errors';

describe('AP04-C01: SoD Enforcement', () => {
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

  describe('Cannot Approve Own Invoice', () => {
    it('should reject approval by invoice creator', async () => {
      const creator = createTestActor({ userId: creatorUserId, tenantId: testTenantId });
      
      const invoice = createTestInvoice({
        tenantId: testTenantId,
        createdBy: creatorUserId, // Creator is the same as approver
        matchStatus: 'passed',
      });
      invoicePort.addInvoice(invoice);

      // Request approval (system action, creates pending approval)
      await approvalService.requestApproval(invoice.id, creator);

      // Creator tries to approve their own invoice
      await expect(
        approvalService.approve(invoice.id, { comments: 'Self-approval attempt' }, creator)
      ).rejects.toThrow(SoDViolationError);
    });

    it('should allow approval by different user', async () => {
      const creator = createTestActor({ userId: creatorUserId, tenantId: testTenantId });
      const approver = createTestActor({ userId: approverUserId, tenantId: testTenantId });
      
      const invoice = createTestInvoice({
        tenantId: testTenantId,
        createdBy: creatorUserId,
        matchStatus: 'passed',
      });
      invoicePort.addInvoice(invoice);

      // Request approval
      await approvalService.requestApproval(invoice.id, creator);

      // Different user approves
      const approval = await approvalService.approve(
        invoice.id,
        { comments: 'Approved' },
        approver
      );

      expect(approval.decision).toBe('approved');
    });
  });

  describe('Cannot Reject Own Invoice', () => {
    it('should reject rejection by invoice creator', async () => {
      const creator = createTestActor({ userId: creatorUserId, tenantId: testTenantId });
      
      const invoice = createTestInvoice({
        tenantId: testTenantId,
        createdBy: creatorUserId,
        matchStatus: 'passed',
      });
      invoicePort.addInvoice(invoice);

      await approvalService.requestApproval(invoice.id, creator);

      await expect(
        approvalService.reject(invoice.id, { reason: 'Self-rejection attempt' }, creator)
      ).rejects.toThrow(SoDViolationError);
    });
  });

  describe('Audit Trail', () => {
    it('should emit audit event on approval', async () => {
      const creator = createTestActor({ userId: creatorUserId, tenantId: testTenantId });
      const approver = createTestActor({ userId: approverUserId, tenantId: testTenantId });
      
      const invoice = createTestInvoice({
        tenantId: testTenantId,
        createdBy: creatorUserId,
        matchStatus: 'passed',
      });
      invoicePort.addInvoice(invoice);

      await approvalService.requestApproval(invoice.id, creator);
      auditPort.clear();

      await approvalService.approve(invoice.id, { comments: 'Approved' }, approver);

      const events = auditPort.getEvents();
      const approveEvent = events.find((e: any) => e.eventType === 'finance.ap.approval.approved');
      
      expect(approveEvent).toBeDefined();
      expect((approveEvent as any).payload.invoiceId).toBe(invoice.id);
    });
  });
});
