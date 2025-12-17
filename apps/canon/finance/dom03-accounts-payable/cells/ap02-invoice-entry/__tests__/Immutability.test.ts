/**
 * Immutability Control Tests
 * 
 * AP02-C03: No update/delete after posted
 * 
 * Tests that invoices cannot be modified after they are posted to GL.
 * This is a CONTROL TEST per CONT_07 requirements.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InvoiceService } from '../InvoiceService';
import { InvoiceStateMachine } from '../InvoiceStateMachine';
import { MemoryInvoiceRepository } from '@aibos/kernel-adapters';
import {
  createTestActor,
  createTestInvoiceInput,
  createMockVendorPort,
  createMockAuditPort,
} from './setup';
import { InvoiceNotInDraftError, InvalidInvoiceStatusError } from '../errors';

describe('AP02-C03: Immutability Control', () => {
  let invoiceService: InvoiceService;
  let invoiceRepo: MemoryInvoiceRepository;
  let vendorPort: ReturnType<typeof createMockVendorPort>;
  let auditPort: ReturnType<typeof createMockAuditPort>;

  const testTenantId = '00000000-0000-0000-0000-000000000001';
  const testVendorId = '00000000-0000-0000-0000-000000000010';

  beforeEach(() => {
    invoiceRepo = new MemoryInvoiceRepository();
    vendorPort = createMockVendorPort();
    auditPort = createMockAuditPort();

    vendorPort.addApprovedVendor(testVendorId, 'V001', 'Test Vendor');

    invoiceService = new InvoiceService(invoiceRepo, vendorPort, auditPort);
  });

  describe('State Machine Immutability Checks', () => {
    it('should identify posted as immutable', () => {
      expect(InvoiceStateMachine.isImmutable('posted')).toBe(true);
    });

    it('should identify paid as immutable', () => {
      expect(InvoiceStateMachine.isImmutable('paid')).toBe(true);
    });

    it('should identify closed as immutable', () => {
      expect(InvoiceStateMachine.isImmutable('closed')).toBe(true);
    });

    it('should identify voided as immutable', () => {
      expect(InvoiceStateMachine.isImmutable('voided')).toBe(true);
    });

    it('should not identify draft as immutable', () => {
      expect(InvoiceStateMachine.isImmutable('draft')).toBe(false);
    });

    it('should not identify approved as immutable', () => {
      expect(InvoiceStateMachine.isImmutable('approved')).toBe(false);
    });
  });

  describe('Service-Level Immutability Enforcement', () => {
    it('should prevent update on submitted invoice', async () => {
      const actor = createTestActor({ tenantId: testTenantId });
      const input = createTestInvoiceInput({ vendorId: testVendorId });

      const invoice = await invoiceService.create(input, actor);
      await invoiceService.submit(invoice.id, actor, invoice.version);

      const submittedInvoice = await invoiceRepo.findById(invoice.id, actor.tenantId);

      await expect(
        invoiceService.update(
          invoice.id,
          { reference: 'Updated' },
          actor,
          submittedInvoice!.version
        )
      ).rejects.toThrow(InvoiceNotInDraftError);
    });

    it('should prevent update on posted invoice', async () => {
      const actor = createTestActor({ tenantId: testTenantId });
      const input = createTestInvoiceInput({ vendorId: testVendorId });

      const invoice = await invoiceService.create(input, actor);

      // Manually set to posted status
      await invoiceRepo.withTransaction(async (txContext) => {
        await invoiceRepo.updateStatus(invoice.id, {
          tenantId: actor.tenantId,
          status: 'posted',
          postedAt: new Date(),
        }, txContext);
      });

      const postedInvoice = await invoiceRepo.findById(invoice.id, actor.tenantId);

      await expect(
        invoiceService.update(
          invoice.id,
          { reference: 'Updated' },
          actor,
          postedInvoice!.version
        )
      ).rejects.toThrow(InvoiceNotInDraftError);
    });

    it('should allow update on draft invoice', async () => {
      const actor = createTestActor({ tenantId: testTenantId });
      const input = createTestInvoiceInput({ vendorId: testVendorId });

      const invoice = await invoiceService.create(input, actor);

      const updated = await invoiceService.update(
        invoice.id,
        { reference: 'Updated Reference' },
        actor,
        invoice.version
      );

      expect(updated.reference).toBe('Updated Reference');
    });
  });

  describe('State Transition Immutability', () => {
    it('should not allow submit from posted status', async () => {
      const actor = createTestActor({ tenantId: testTenantId });
      const input = createTestInvoiceInput({ vendorId: testVendorId });

      const invoice = await invoiceService.create(input, actor);

      // Manually set to posted
      await invoiceRepo.withTransaction(async (txContext) => {
        await invoiceRepo.updateStatus(invoice.id, {
          tenantId: actor.tenantId,
          status: 'posted',
        }, txContext);
      });

      const postedInvoice = await invoiceRepo.findById(invoice.id, actor.tenantId);

      // Submit should fail from posted status
      await expect(
        invoiceService.submit(invoice.id, actor, postedInvoice!.version)
      ).rejects.toThrow(InvalidInvoiceStatusError);
    });

    it('should not allow transitions from closed status', () => {
      expect(InvoiceStateMachine.canTransition('closed', 'submit')).toBe(false);
      expect(InvoiceStateMachine.canTransition('closed', 'void')).toBe(false);
      expect(InvoiceStateMachine.canTransition('closed', 'post')).toBe(false);
    });

    it('should not allow transitions from voided status', () => {
      expect(InvoiceStateMachine.canTransition('voided', 'submit')).toBe(false);
      expect(InvoiceStateMachine.canTransition('voided', 'approve')).toBe(false);
      expect(InvoiceStateMachine.canTransition('voided', 'post')).toBe(false);
    });
  });

  describe('Terminal State Detection', () => {
    it('should identify closed as terminal', () => {
      expect(InvoiceStateMachine.isTerminal('closed')).toBe(true);
    });

    it('should identify voided as terminal', () => {
      expect(InvoiceStateMachine.isTerminal('voided')).toBe(true);
    });

    it('should not identify posted as terminal (can still be paid)', () => {
      expect(InvoiceStateMachine.isTerminal('posted')).toBe(false);
    });

    it('should return empty actions for terminal states', () => {
      expect(InvoiceStateMachine.getAvailableActions('closed')).toHaveLength(0);
      expect(InvoiceStateMachine.getAvailableActions('voided')).toHaveLength(0);
    });
  });
});
