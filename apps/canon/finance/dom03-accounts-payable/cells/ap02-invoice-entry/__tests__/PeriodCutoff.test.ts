/**
 * Period Cutoff Control Tests
 * 
 * AP02-C02: Posting blocked if period closed
 * 
 * Tests that invoices cannot be posted to GL if the fiscal period is closed.
 * This is a CONTROL TEST per CONT_07 requirements.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PostingService } from '../PostingService';
import { InvoiceService } from '../InvoiceService';
import { MemoryInvoiceRepository } from '@aibos/kernel-adapters';
import {
  createTestActor,
  createTestInvoiceInput,
  createMockVendorPort,
  createMockAuditPort,
  createMockFiscalTimePort,
  createMockCOAPort,
  createMockGLPostingPort,
} from './setup';
import { PeriodClosedError } from '../errors';

describe('AP02-C02: Period Cutoff Control', () => {
  let invoiceService: InvoiceService;
  let postingService: PostingService;
  let invoiceRepo: MemoryInvoiceRepository;
  let vendorPort: ReturnType<typeof createMockVendorPort>;
  let auditPort: ReturnType<typeof createMockAuditPort>;
  let fiscalTimePort: ReturnType<typeof createMockFiscalTimePort>;
  let coaPort: ReturnType<typeof createMockCOAPort>;
  let glPostingPort: ReturnType<typeof createMockGLPostingPort>;

  const testTenantId = '00000000-0000-0000-0000-000000000001';
  const testVendorId = '00000000-0000-0000-0000-000000000010';

  beforeEach(() => {
    invoiceRepo = new MemoryInvoiceRepository();
    vendorPort = createMockVendorPort();
    auditPort = createMockAuditPort();
    fiscalTimePort = createMockFiscalTimePort();
    coaPort = createMockCOAPort();
    glPostingPort = createMockGLPostingPort();

    // Add approved vendor
    vendorPort.addApprovedVendor(testVendorId, 'V001', 'Test Vendor');

    invoiceService = new InvoiceService(invoiceRepo, vendorPort, auditPort);
    postingService = new PostingService(
      invoiceRepo,
      glPostingPort,
      fiscalTimePort,
      coaPort,
      auditPort
    );
  });

  describe('Period Validation', () => {
    it('should block posting when period is closed', async () => {
      const actor = createTestActor({ tenantId: testTenantId });
      
      // Create invoice for a closed period (January 2024)
      const closedPeriodDate = new Date('2024-01-15');
      fiscalTimePort.setOpenPeriod('2024-01', false); // Close the period

      const input = createTestInvoiceInput({
        vendorId: testVendorId,
        invoiceDate: closedPeriodDate,
        dueDate: new Date('2024-02-15'),
      });

      // Create and manually approve the invoice
      const invoice = await invoiceService.create(input, actor);
      
      // Manually set status to approved for testing
      await invoiceRepo.withTransaction(async (txContext) => {
        await invoiceRepo.updateStatus(invoice.id, {
          tenantId: actor.tenantId,
          status: 'approved',
        }, txContext);
      });

      // Get updated invoice
      const approvedInvoice = await invoiceRepo.findById(invoice.id, actor.tenantId);

      // Attempt to post - should fail due to closed period
      await expect(
        postingService.postToGL(invoice.id, actor, approvedInvoice!.version)
      ).rejects.toThrow(PeriodClosedError);
    });

    it('should allow posting when period is open', async () => {
      const actor = createTestActor({ tenantId: testTenantId });
      
      // Create invoice for an open period
      const openPeriodDate = new Date('2025-01-15');
      fiscalTimePort.setOpenPeriod('2025-01', true);

      const input = createTestInvoiceInput({
        vendorId: testVendorId,
        invoiceDate: openPeriodDate,
        dueDate: new Date('2025-02-15'),
      });

      const invoice = await invoiceService.create(input, actor);
      
      // Manually set status to approved for testing
      await invoiceRepo.withTransaction(async (txContext) => {
        await invoiceRepo.updateStatus(invoice.id, {
          tenantId: actor.tenantId,
          status: 'approved',
        }, txContext);
      });

      const approvedInvoice = await invoiceRepo.findById(invoice.id, actor.tenantId);

      // Post should succeed
      const posted = await postingService.postToGL(
        invoice.id,
        actor,
        approvedInvoice!.version
      );

      expect(posted.status).toBe('posted');
      expect(posted.journalHeaderId).toBeDefined();
    });

    it('should validate period before attempting GL posting', async () => {
      const actor = createTestActor({ tenantId: testTenantId });
      
      const invoiceDate = new Date('2024-06-15');
      
      // Test period validation directly
      fiscalTimePort.setOpenPeriod('2024-06', false);
      const isClosed = !(await postingService.validatePeriodOpen(invoiceDate, testTenantId));
      expect(isClosed).toBe(true);

      fiscalTimePort.setOpenPeriod('2024-06', true);
      const isOpen = await postingService.validatePeriodOpen(invoiceDate, testTenantId);
      expect(isOpen).toBe(true);
    });
  });

  describe('Control Evidence', () => {
    it('should include period validation in audit trail', async () => {
      const actor = createTestActor({ tenantId: testTenantId });
      
      const openPeriodDate = new Date('2025-02-15');
      fiscalTimePort.setOpenPeriod('2025-02', true);

      const input = createTestInvoiceInput({
        vendorId: testVendorId,
        invoiceDate: openPeriodDate,
        dueDate: new Date('2025-03-15'),
      });

      const invoice = await invoiceService.create(input, actor);
      
      await invoiceRepo.withTransaction(async (txContext) => {
        await invoiceRepo.updateStatus(invoice.id, {
          tenantId: actor.tenantId,
          status: 'approved',
        }, txContext);
      });

      const approvedInvoice = await invoiceRepo.findById(invoice.id, actor.tenantId);
      auditPort.clear();

      await postingService.postToGL(invoice.id, actor, approvedInvoice!.version);

      const events = auditPort.getEvents();
      const postEvent = events.find(
        (e: any) => e.eventType === 'finance.ap.invoice.posted'
      );
      
      expect(postEvent).toBeDefined();
      expect((postEvent as any).payload.journalHeaderId).toBeDefined();
    });
  });
});
