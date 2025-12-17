/**
 * SoD Override Control Tests
 * 
 * AP03-C02: Override path requires policy-gated permission + audit event
 * 
 * Tests that match overrides enforce Separation of Duties.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MatchService } from '../MatchService';
import { OverrideService } from '../OverrideService';
import { MemoryMatchingRepository } from '@aibos/kernel-adapters';
import {
  createTestActor,
  createTestInvoice,
  createMockInvoicePort,
  createMockPOPort,
  createMockGRNPort,
  createMockPolicyPort,
  createMockAuditPort,
  createMockPermissionPort,
} from './setup';
import {
  OverrideSoDViolationError,
  OverrideNotAllowedError,
  OverrideAlreadyAppliedError,
} from '../errors';

describe('AP03-C02: SoD Override Control', () => {
  let matchService: MatchService;
  let overrideService: OverrideService;
  let matchRepo: MemoryMatchingRepository;
  let invoicePort: ReturnType<typeof createMockInvoicePort>;
  let poPort: ReturnType<typeof createMockPOPort>;
  let grnPort: ReturnType<typeof createMockGRNPort>;
  let policyPort: ReturnType<typeof createMockPolicyPort>;
  let auditPort: ReturnType<typeof createMockAuditPort>;
  let permissionPort: ReturnType<typeof createMockPermissionPort>;

  const testTenantId = '00000000-0000-0000-0000-000000000001';
  const creatorUserId = '00000000-0000-0000-0000-000000000002';
  const approverUserId = '00000000-0000-0000-0000-000000000003';

  beforeEach(() => {
    matchRepo = new MemoryMatchingRepository();
    invoicePort = createMockInvoicePort();
    poPort = createMockPOPort();
    grnPort = createMockGRNPort();
    policyPort = createMockPolicyPort('2-way'); // Force exception (missing PO)
    auditPort = createMockAuditPort();
    permissionPort = createMockPermissionPort(true);

    matchService = new MatchService(
      matchRepo,
      invoicePort,
      poPort,
      grnPort,
      policyPort,
      auditPort
    );

    overrideService = new OverrideService(
      matchRepo,
      invoicePort,
      permissionPort,
      auditPort
    );
  });

  describe('SoD Enforcement', () => {
    it('should reject override by same user who created match', async () => {
      const creator = createTestActor({ userId: creatorUserId, tenantId: testTenantId });

      // Create invoice that will fail match (no PO)
      const invoice = createTestInvoice({
        tenantId: testTenantId,
        status: 'submitted',
      });
      invoicePort.addInvoice(invoice);

      // Create match result (will be exception due to missing PO)
      const match = await matchService.evaluate(invoice.id, creator);
      expect(match.status).toBe('exception');

      // Same user tries to override
      await expect(
        overrideService.override(match.id, { reason: 'Self override' }, creator, match.version)
      ).rejects.toThrow(OverrideSoDViolationError);
    });

    it('should allow override by different user', async () => {
      const creator = createTestActor({ userId: creatorUserId, tenantId: testTenantId });
      const approver = createTestActor({ userId: approverUserId, tenantId: testTenantId });

      const invoice = createTestInvoice({
        tenantId: testTenantId,
        status: 'submitted',
      });
      invoicePort.addInvoice(invoice);

      const match = await matchService.evaluate(invoice.id, creator);
      expect(match.status).toBe('exception');

      // Different user overrides
      const overridden = await overrideService.override(
        match.id,
        { reason: 'Approved by manager' },
        approver,
        match.version
      );

      expect(overridden.isOverridden).toBe(true);
      expect(overridden.status).toBe('passed');
      expect(overridden.overrideApprovedBy).toBe(approverUserId);
    });
  });

  describe('Permission Check', () => {
    it('should reject override without permission', async () => {
      const creator = createTestActor({ userId: creatorUserId, tenantId: testTenantId });
      const approver = createTestActor({ userId: approverUserId, tenantId: testTenantId });

      // Create permission port that denies access
      const restrictedPermissionPort = createMockPermissionPort(false);

      const restrictedOverrideService = new OverrideService(
        matchRepo,
        invoicePort,
        restrictedPermissionPort,
        auditPort
      );

      const invoice = createTestInvoice({
        tenantId: testTenantId,
        status: 'submitted',
      });
      invoicePort.addInvoice(invoice);

      const match = await matchService.evaluate(invoice.id, creator);

      await expect(
        restrictedOverrideService.override(match.id, { reason: 'No permission' }, approver, match.version)
      ).rejects.toThrow(OverrideNotAllowedError);
    });
  });

  describe('Override Status Check', () => {
    it('should reject double override', async () => {
      const creator = createTestActor({ userId: creatorUserId, tenantId: testTenantId });
      const approver = createTestActor({ userId: approverUserId, tenantId: testTenantId });

      const invoice = createTestInvoice({
        tenantId: testTenantId,
        status: 'submitted',
      });
      invoicePort.addInvoice(invoice);

      const match = await matchService.evaluate(invoice.id, creator);

      // First override
      const overridden = await overrideService.override(
        match.id,
        { reason: 'First override' },
        approver,
        match.version
      );

      // Second override attempt
      await expect(
        overrideService.override(match.id, { reason: 'Second override' }, approver, overridden.version)
      ).rejects.toThrow(OverrideAlreadyAppliedError);
    });
  });

  describe('Audit Trail', () => {
    it('should emit audit event on override', async () => {
      const creator = createTestActor({ userId: creatorUserId, tenantId: testTenantId });
      const approver = createTestActor({ userId: approverUserId, tenantId: testTenantId });

      const invoice = createTestInvoice({
        tenantId: testTenantId,
        status: 'submitted',
      });
      invoicePort.addInvoice(invoice);

      const match = await matchService.evaluate(invoice.id, creator);
      auditPort.clear();

      await overrideService.override(
        match.id,
        { reason: 'Manager approved' },
        approver,
        match.version
      );

      const events = auditPort.getEvents();
      const overrideEvent = events.find((e: any) => e.eventType === 'finance.ap.match.overridden');

      expect(overrideEvent).toBeDefined();
      expect((overrideEvent as any).payload.reason).toBe('Manager approved');
      expect((overrideEvent as any).payload.createdBy).toBe(creatorUserId);
    });
  });
});
