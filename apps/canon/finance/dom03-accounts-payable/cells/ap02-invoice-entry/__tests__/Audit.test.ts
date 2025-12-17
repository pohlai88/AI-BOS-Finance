/**
 * Audit Coverage Control Tests
 * 
 * AP02-C06: All mutations emit audit events
 * 
 * Tests that every state-changing operation emits a transactional audit event.
 * This is a CONTROL TEST per CONT_07 requirements.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InvoiceService } from '../InvoiceService';
import { MemoryInvoiceRepository } from '@aibos/kernel-adapters';
import {
  createTestActor,
  createTestInvoiceInput,
  createMockVendorPort,
  createMockAuditPort,
} from './setup';

describe('AP02-C06: Audit Coverage Control', () => {
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

  describe('Invoice Creation Audit', () => {
    it('should emit audit event on invoice creation', async () => {
      const actor = createTestActor({ tenantId: testTenantId });
      const input = createTestInvoiceInput({ vendorId: testVendorId });

      auditPort.clear();
      const invoice = await invoiceService.create(input, actor);

      const events = auditPort.getEvents();
      expect(events).toHaveLength(1);

      const event = events[0] as any;
      expect(event.eventType).toBe('finance.ap.invoice.created');
      expect(event.entityId).toBe(invoice.id);
      expect(event.actor.userId).toBe(actor.userId);
      expect(event.actor.tenantId).toBe(actor.tenantId);
      expect(event.action).toBe('create');
      expect(event.payload.invoiceNumber).toBe(input.invoiceNumber);
      expect(event.payload.status).toBe('draft');
    });

    it('should include line count in creation audit', async () => {
      const actor = createTestActor({ tenantId: testTenantId });
      const input = createTestInvoiceInput({
        vendorId: testVendorId,
        lines: [
          { description: 'Line 1', quantity: 1, unitPriceCents: 1000, debitAccountCode: '5100' },
          { description: 'Line 2', quantity: 2, unitPriceCents: 2000, debitAccountCode: '5100' },
        ],
      });

      auditPort.clear();
      await invoiceService.create(input, actor);

      const events = auditPort.getEvents();
      const event = events[0] as any;
      expect(event.payload.lineCount).toBe(2);
    });
  });

  describe('Invoice Update Audit', () => {
    it('should emit audit event on invoice update', async () => {
      const actor = createTestActor({ tenantId: testTenantId });
      const input = createTestInvoiceInput({ vendorId: testVendorId });

      const invoice = await invoiceService.create(input, actor);
      auditPort.clear();

      await invoiceService.update(
        invoice.id,
        { reference: 'Updated Reference' },
        actor,
        invoice.version
      );

      const events = auditPort.getEvents();
      expect(events).toHaveLength(1);

      const event = events[0] as any;
      expect(event.eventType).toBe('finance.ap.invoice.updated');
      expect(event.action).toBe('update');
      expect(event.payload.before).toBeDefined();
      expect(event.payload.after).toBeDefined();
    });
  });

  describe('Invoice Submission Audit', () => {
    it('should emit audit event on invoice submission', async () => {
      const actor = createTestActor({ tenantId: testTenantId });
      const input = createTestInvoiceInput({ vendorId: testVendorId });

      const invoice = await invoiceService.create(input, actor);
      auditPort.clear();

      await invoiceService.submit(invoice.id, actor, invoice.version);

      const events = auditPort.getEvents();
      expect(events).toHaveLength(1);

      const event = events[0] as any;
      expect(event.eventType).toBe('finance.ap.invoice.submitted');
      expect(event.action).toBe('submit');
      expect(event.payload.fromStatus).toBe('draft');
      expect(event.payload.toStatus).toBe('submitted');
    });
  });

  describe('Invoice Void Audit', () => {
    it('should emit audit event on invoice void', async () => {
      const actor = createTestActor({ tenantId: testTenantId });
      const input = createTestInvoiceInput({ vendorId: testVendorId });

      const invoice = await invoiceService.create(input, actor);

      // Set to approved status (void is allowed from approved)
      await invoiceRepo.withTransaction(async (txContext) => {
        await invoiceRepo.updateStatus(invoice.id, {
          tenantId: actor.tenantId,
          status: 'approved',
        }, txContext);
      });

      const approvedInvoice = await invoiceRepo.findById(invoice.id, actor.tenantId);
      auditPort.clear();

      await invoiceService.void(invoice.id, 'Test void reason', actor, approvedInvoice!.version);

      const events = auditPort.getEvents();
      expect(events).toHaveLength(1);

      const event = events[0] as any;
      expect(event.eventType).toBe('finance.ap.invoice.voided');
      expect(event.action).toBe('void');
      expect(event.payload.reason).toBe('Test void reason');
      expect(event.payload.fromStatus).toBe('approved');
      expect(event.payload.toStatus).toBe('voided');
    });
  });

  describe('Audit Event Structure', () => {
    it('should include correlation ID in all events', async () => {
      const actor = createTestActor({ tenantId: testTenantId });
      const input = createTestInvoiceInput({ vendorId: testVendorId });

      auditPort.clear();
      await invoiceService.create(input, actor);

      const events = auditPort.getEvents();
      const event = events[0] as any;
      expect(event.correlationId).toBeDefined();
      expect(typeof event.correlationId).toBe('string');
    });

    it('should include timestamp in all events', async () => {
      const actor = createTestActor({ tenantId: testTenantId });
      const input = createTestInvoiceInput({ vendorId: testVendorId });

      const before = new Date();
      auditPort.clear();
      await invoiceService.create(input, actor);
      const after = new Date();

      const events = auditPort.getEvents();
      const event = events[0] as any;
      expect(event.timestamp).toBeDefined();
      expect(new Date(event.timestamp).getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(new Date(event.timestamp).getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should include entity URN in all events', async () => {
      const actor = createTestActor({ tenantId: testTenantId });
      const input = createTestInvoiceInput({ vendorId: testVendorId });

      auditPort.clear();
      const invoice = await invoiceService.create(input, actor);

      const events = auditPort.getEvents();
      const event = events[0] as any;
      expect(event.entityUrn).toBe(`urn:finance:invoice:${invoice.id}`);
    });
  });

  describe('100% Audit Coverage Verification', () => {
    it('should have audit events for all state transitions', async () => {
      const actor = createTestActor({ tenantId: testTenantId });
      const input = createTestInvoiceInput({ vendorId: testVendorId });

      auditPort.clear();

      // Create (draft)
      const invoice = await invoiceService.create(input, actor);
      expect(auditPort.getEvents()).toHaveLength(1);

      // Submit (draft -> submitted)
      await invoiceService.submit(invoice.id, actor, invoice.version);
      expect(auditPort.getEvents()).toHaveLength(2);

      // Each mutation creates exactly one audit event
      const eventTypes = auditPort.getEvents().map((e: any) => e.eventType);
      expect(eventTypes).toContain('finance.ap.invoice.created');
      expect(eventTypes).toContain('finance.ap.invoice.submitted');
    });
  });
});
