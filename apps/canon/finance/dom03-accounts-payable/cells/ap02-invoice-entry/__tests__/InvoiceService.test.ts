/**
 * InvoiceService Unit Tests
 * 
 * Unit tests for InvoiceService using Vitest in Node environment.
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
import {
  VendorNotApprovedError,
  InvoiceLinesRequiredError,
  DueDateBeforeInvoiceDateError,
} from '../errors';

describe('InvoiceService - Unit Tests', () => {
  let invoiceService: InvoiceService;
  let invoiceRepo: MemoryInvoiceRepository;
  let vendorPort: ReturnType<typeof createMockVendorPort>;
  let auditPort: ReturnType<typeof createMockAuditPort>;

  const testTenantId = '00000000-0000-0000-0000-000000000001';
  const testVendorId = '00000000-0000-0000-0000-000000000010';

  beforeEach(() => {
    // Setup fresh instances for each test
    invoiceRepo = new MemoryInvoiceRepository();
    vendorPort = createMockVendorPort();
    auditPort = createMockAuditPort();

    invoiceService = new InvoiceService(
      invoiceRepo,
      vendorPort,
      auditPort
    );

    // Add an approved vendor
    vendorPort.addApprovedVendor(testVendorId, 'V001', 'Test Vendor Inc.');
  });

  describe('Invoice Creation', () => {
    it('should create an invoice with valid data', async () => {
      const actor = createTestActor({ tenantId: testTenantId });
      const input = createTestInvoiceInput({
        vendorId: testVendorId,
      });

      const result = await invoiceService.create(input, actor);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.status).toBe('draft');
      expect(result.invoiceNumber).toBe(input.invoiceNumber);
      expect(result.vendorId).toBe(testVendorId);
      expect(result.lines).toHaveLength(1);
    });

    it('should calculate totals from lines', async () => {
      const actor = createTestActor({ tenantId: testTenantId });
      const input = createTestInvoiceInput({
        vendorId: testVendorId,
        lines: [
          { description: 'Item 1', quantity: 2, unitPriceCents: 5000, debitAccountCode: '5100' },
          { description: 'Item 2', quantity: 1, unitPriceCents: 3000, debitAccountCode: '5100' },
        ],
      });

      const result = await invoiceService.create(input, actor);

      // 2 * 5000 + 1 * 3000 = 13000
      expect(result.subtotalCents).toBe(13000);
      expect(result.totalAmountCents).toBe(13000);
    });

    it('should reject invoice if vendor is not approved', async () => {
      const actor = createTestActor({ tenantId: testTenantId });
      const input = createTestInvoiceInput({
        vendorId: 'non-approved-vendor-id',
      });

      await expect(invoiceService.create(input, actor))
        .rejects.toThrow(VendorNotApprovedError);
    });

    it('should reject invoice with no lines', async () => {
      const actor = createTestActor({ tenantId: testTenantId });
      const input = createTestInvoiceInput({
        vendorId: testVendorId,
        lines: [],
      });

      await expect(invoiceService.create(input, actor))
        .rejects.toThrow(InvoiceLinesRequiredError);
    });

    it('should reject invoice with due date before invoice date', async () => {
      const actor = createTestActor({ tenantId: testTenantId });
      const invoiceDate = new Date('2025-01-15');
      const dueDate = new Date('2025-01-01'); // Before invoice date

      const input = createTestInvoiceInput({
        vendorId: testVendorId,
        invoiceDate,
        dueDate,
      });

      await expect(invoiceService.create(input, actor))
        .rejects.toThrow(DueDateBeforeInvoiceDateError);
    });

    it('should emit audit event on creation', async () => {
      const actor = createTestActor({ tenantId: testTenantId });
      const input = createTestInvoiceInput({
        vendorId: testVendorId,
      });

      await invoiceService.create(input, actor);

      const events = auditPort.getEvents();
      expect(events).toHaveLength(1);
      expect((events[0] as any).eventType).toBe('finance.ap.invoice.created');
    });
  });

  describe('Invoice Retrieval', () => {
    it('should get invoice by ID', async () => {
      const actor = createTestActor({ tenantId: testTenantId });
      const input = createTestInvoiceInput({ vendorId: testVendorId });
      const created = await invoiceService.create(input, actor);

      const result = await invoiceService.getById(created.id, actor);

      expect(result).toBeDefined();
      expect(result?.id).toBe(created.id);
    });

    it('should return null for non-existent invoice', async () => {
      const actor = createTestActor({ tenantId: testTenantId });

      const result = await invoiceService.getById('non-existent-id', actor);

      expect(result).toBeNull();
    });

    it('should get invoice with lines', async () => {
      const actor = createTestActor({ tenantId: testTenantId });
      const input = createTestInvoiceInput({
        vendorId: testVendorId,
        lines: [
          { description: 'Item 1', quantity: 1, unitPriceCents: 5000, debitAccountCode: '5100' },
          { description: 'Item 2', quantity: 2, unitPriceCents: 3000, debitAccountCode: '5100' },
        ],
      });
      const created = await invoiceService.create(input, actor);

      const result = await invoiceService.getByIdWithLines(created.id, actor);

      expect(result).toBeDefined();
      expect(result?.lines).toHaveLength(2);
      expect(result?.lines[0].lineNumber).toBe(1);
      expect(result?.lines[1].lineNumber).toBe(2);
    });
  });

  describe('Invoice Listing', () => {
    it('should list invoices for tenant', async () => {
      const actor = createTestActor({ tenantId: testTenantId });
      
      // Create multiple invoices
      await invoiceService.create(createTestInvoiceInput({ vendorId: testVendorId }), actor);
      await invoiceService.create(createTestInvoiceInput({ vendorId: testVendorId }), actor);
      await invoiceService.create(createTestInvoiceInput({ vendorId: testVendorId }), actor);

      const result = await invoiceService.list({}, actor);

      expect(result.invoices).toHaveLength(3);
      expect(result.total).toBe(3);
    });

    it('should filter by status', async () => {
      const actor = createTestActor({ tenantId: testTenantId });
      
      // Create invoices
      const inv1 = await invoiceService.create(createTestInvoiceInput({ vendorId: testVendorId }), actor);
      await invoiceService.create(createTestInvoiceInput({ vendorId: testVendorId }), actor);
      
      // Submit one
      await invoiceService.submit(inv1.id, actor, inv1.version);

      const draftResult = await invoiceService.list({ status: 'draft' }, actor);
      const submittedResult = await invoiceService.list({ status: 'submitted' }, actor);

      expect(draftResult.invoices).toHaveLength(1);
      expect(submittedResult.invoices).toHaveLength(1);
    });

    it('should paginate results', async () => {
      const actor = createTestActor({ tenantId: testTenantId });
      
      // Create 5 invoices
      for (let i = 0; i < 5; i++) {
        await invoiceService.create(createTestInvoiceInput({ vendorId: testVendorId }), actor);
      }

      const result = await invoiceService.list({ limit: 2, offset: 0 }, actor);

      expect(result.invoices).toHaveLength(2);
      expect(result.total).toBe(5);
    });
  });

  describe('Invoice Submission', () => {
    it('should submit draft invoice', async () => {
      const actor = createTestActor({ tenantId: testTenantId });
      const input = createTestInvoiceInput({ vendorId: testVendorId });
      const created = await invoiceService.create(input, actor);

      const result = await invoiceService.submit(created.id, actor, created.version);

      expect(result.status).toBe('submitted');
      expect(result.submittedBy).toBe(actor.userId);
      expect(result.submittedAt).toBeDefined();
    });

    it('should emit audit event on submission', async () => {
      const actor = createTestActor({ tenantId: testTenantId });
      const input = createTestInvoiceInput({ vendorId: testVendorId });
      const created = await invoiceService.create(input, actor);

      auditPort.clear();
      await invoiceService.submit(created.id, actor, created.version);

      const events = auditPort.getEvents();
      expect(events).toHaveLength(1);
      expect((events[0] as any).eventType).toBe('finance.ap.invoice.submitted');
    });
  });

  describe('Invoice Update', () => {
    it('should update draft invoice', async () => {
      const actor = createTestActor({ tenantId: testTenantId });
      const input = createTestInvoiceInput({ vendorId: testVendorId });
      const created = await invoiceService.create(input, actor);

      const updated = await invoiceService.update(
        created.id,
        { reference: 'Updated Reference' },
        actor,
        created.version
      );

      expect(updated.reference).toBe('Updated Reference');
      expect(updated.version).toBe(created.version + 1);
    });

    it('should update invoice lines', async () => {
      const actor = createTestActor({ tenantId: testTenantId });
      const input = createTestInvoiceInput({ vendorId: testVendorId });
      const created = await invoiceService.create(input, actor);

      const updated = await invoiceService.update(
        created.id,
        {
          lines: [
            { description: 'New Item', quantity: 3, unitPriceCents: 7500, debitAccountCode: '5100' },
          ],
        },
        actor,
        created.version
      );

      expect(updated.lines).toHaveLength(1);
      expect(updated.lines[0].description).toBe('New Item');
      expect(updated.subtotalCents).toBe(22500); // 3 * 7500
    });
  });
});
