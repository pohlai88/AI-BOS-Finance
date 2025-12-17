/**
 * Duplicate Detection Control Tests
 * 
 * AP02-C05: Duplicate invoice rule blocks second entry
 * 
 * Tests that duplicate invoices are detected and blocked/flagged.
 * This is a CONTROL TEST per CONT_07 requirements.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InvoiceService } from '../InvoiceService';
import { DuplicateDetectionService } from '../DuplicateDetectionService';
import { MemoryInvoiceRepository } from '@aibos/kernel-adapters';
import {
  createTestActor,
  createTestInvoiceInput,
  createMockVendorPort,
  createMockAuditPort,
} from './setup';
import { DuplicateInvoiceError } from '../errors';

describe('AP02-C05: Duplicate Detection Control', () => {
  let invoiceService: InvoiceService;
  let duplicateService: DuplicateDetectionService;
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
    duplicateService = new DuplicateDetectionService(invoiceRepo, auditPort);
  });

  describe('Exact Duplicate Detection', () => {
    it('should block exact duplicate (same vendor + number + date)', async () => {
      const actor = createTestActor({ tenantId: testTenantId });
      const invoiceDate = new Date('2025-01-15');
      const dueDate = new Date('2025-02-15');

      const input = createTestInvoiceInput({
        vendorId: testVendorId,
        invoiceNumber: 'INV-001',
        invoiceDate,
        dueDate,
      });

      // Create first invoice
      await invoiceService.create(input, actor);

      // Attempt to create duplicate
      await expect(invoiceService.create(input, actor)).rejects.toThrow(DuplicateInvoiceError);
    });

    it('should allow same invoice number for different vendors', async () => {
      const actor = createTestActor({ tenantId: testTenantId });
      const otherVendorId = '00000000-0000-0000-0000-000000000020';
      vendorPort.addApprovedVendor(otherVendorId, 'V002', 'Other Vendor');

      const invoiceDate = new Date('2025-01-15');
      const dueDate = new Date('2025-02-15');

      // Create invoice for first vendor
      await invoiceService.create(
        createTestInvoiceInput({
          vendorId: testVendorId,
          invoiceNumber: 'INV-001',
          invoiceDate,
          dueDate,
        }),
        actor
      );

      // Create invoice with same number for different vendor - should succeed
      const invoice2 = await invoiceService.create(
        createTestInvoiceInput({
          vendorId: otherVendorId,
          invoiceNumber: 'INV-001',
          invoiceDate,
          dueDate,
        }),
        actor
      );

      expect(invoice2).toBeDefined();
      expect(invoice2.vendorId).toBe(otherVendorId);
    });

    it('should allow same invoice number for different dates', async () => {
      const actor = createTestActor({ tenantId: testTenantId });

      // Create first invoice
      await invoiceService.create(
        createTestInvoiceInput({
          vendorId: testVendorId,
          invoiceNumber: 'INV-001',
          invoiceDate: new Date('2025-01-15'),
          dueDate: new Date('2025-02-15'),
        }),
        actor
      );

      // Create invoice with same number but different date - should succeed
      // (Different date means it's a different invoice period)
      const invoice2 = await invoiceService.create(
        createTestInvoiceInput({
          vendorId: testVendorId,
          invoiceNumber: 'INV-001',
          invoiceDate: new Date('2025-02-15'), // Different date
          dueDate: new Date('2025-03-15'),
        }),
        actor
      );

      expect(invoice2).toBeDefined();
    });
  });

  describe('Potential Duplicate Detection', () => {
    it('should flag potential duplicate (same vendor + number, different date)', async () => {
      const actor = createTestActor({ tenantId: testTenantId });

      // Create first invoice
      const first = await invoiceService.create(
        createTestInvoiceInput({
          vendorId: testVendorId,
          invoiceNumber: 'INV-002',
          invoiceDate: new Date('2025-01-15'),
          dueDate: new Date('2025-02-15'),
        }),
        actor
      );

      // Create potential duplicate with different date
      const second = await invoiceService.create(
        createTestInvoiceInput({
          vendorId: testVendorId,
          invoiceNumber: 'INV-002',
          invoiceDate: new Date('2025-01-20'), // Different date
          dueDate: new Date('2025-02-20'),
        }),
        actor
      );

      // Re-fetch the invoice to get the updated duplicate flag
      // (markAsDuplicate is called during create but the returned object
      // is created before the flag is set)
      const refetched = await invoiceService.getById(second.id, actor);

      // Second invoice should be flagged as potential duplicate
      expect(refetched?.duplicateFlag).toBe(true);
      expect(refetched?.duplicateOfInvoiceId).toBe(first.id);
    });
  });

  describe('Duplicate Check Service', () => {
    it('should detect exact duplicate via service', async () => {
      const actor = createTestActor({ tenantId: testTenantId });
      const invoiceDate = new Date('2025-01-15');

      // Create first invoice
      await invoiceService.create(
        createTestInvoiceInput({
          vendorId: testVendorId,
          invoiceNumber: 'INV-003',
          invoiceDate,
          dueDate: new Date('2025-02-15'),
        }),
        actor
      );

      // Create duplicate service with blockOnExactDuplicate: false
      // so it returns a result instead of throwing
      const nonBlockingDuplicateService = new DuplicateDetectionService(
        invoiceRepo,
        auditPort,
        { blockOnExactDuplicate: false }
      );

      // Check for duplicate
      const result = await nonBlockingDuplicateService.checkDuplicate(
        {
          vendorId: testVendorId,
          invoiceNumber: 'INV-003',
          invoiceDate,
          totalAmountCents: 10000,
        },
        actor
      );

      expect(result.isDuplicate).toBe(true);
      expect(result.severity).toBe('error');
      expect(result.matchType).toBe('exact');
    });

    it('should return no duplicate for new invoice', async () => {
      const actor = createTestActor({ tenantId: testTenantId });

      const result = await duplicateService.checkDuplicate(
        {
          vendorId: testVendorId,
          invoiceNumber: 'NEW-INVOICE',
          invoiceDate: new Date('2025-01-15'),
          totalAmountCents: 10000,
        },
        actor
      );

      expect(result.isDuplicate).toBe(false);
      expect(result.severity).toBe('none');
    });
  });

  describe('Duplicate Analysis', () => {
    it('should provide detailed duplicate analysis', async () => {
      const actor = createTestActor({ tenantId: testTenantId });

      // Create multiple invoices for same vendor
      await invoiceService.create(
        createTestInvoiceInput({
          vendorId: testVendorId,
          invoiceNumber: 'INV-100',
          invoiceDate: new Date('2025-01-10'),
          dueDate: new Date('2025-02-10'),
        }),
        actor
      );

      await invoiceService.create(
        createTestInvoiceInput({
          vendorId: testVendorId,
          invoiceNumber: 'INV-101',
          invoiceDate: new Date('2025-01-15'),
          dueDate: new Date('2025-02-15'),
        }),
        actor
      );

      // Analyze duplicates for a potential new invoice
      const analysis = await duplicateService.analyzeDuplicates(
        {
          vendorId: testVendorId,
          invoiceNumber: 'INV-100',
          invoiceDate: new Date('2025-01-10'),
          totalAmountCents: 10000,
        },
        actor
      );

      expect(analysis.exactMatches).toHaveLength(1);
      expect(analysis.analysis).toContain('exact duplicate');
    });
  });

  describe('Duplicate Flagging', () => {
    it('should mark invoice as duplicate', async () => {
      const actor = createTestActor({ tenantId: testTenantId });

      const first = await invoiceService.create(
        createTestInvoiceInput({
          vendorId: testVendorId,
          invoiceNumber: 'INV-200',
          invoiceDate: new Date('2025-01-15'),
          dueDate: new Date('2025-02-15'),
        }),
        actor
      );

      const second = await invoiceService.create(
        createTestInvoiceInput({
          vendorId: testVendorId,
          invoiceNumber: 'INV-201',
          invoiceDate: new Date('2025-01-20'),
          dueDate: new Date('2025-02-20'),
        }),
        actor
      );

      // Manually mark as duplicate
      const flagged = await duplicateService.markAsDuplicate(second.id, first.id, actor);

      expect(flagged.duplicateFlag).toBe(true);
      expect(flagged.duplicateOfInvoiceId).toBe(first.id);
    });

    it('should emit audit event when marking as duplicate', async () => {
      const actor = createTestActor({ tenantId: testTenantId });

      const first = await invoiceService.create(
        createTestInvoiceInput({ vendorId: testVendorId }),
        actor
      );

      const second = await invoiceService.create(
        createTestInvoiceInput({
          vendorId: testVendorId,
          invoiceNumber: 'DIFFERENT-NUMBER',
          invoiceDate: new Date('2025-02-15'),
          dueDate: new Date('2025-03-15'),
        }),
        actor
      );

      auditPort.clear();
      await duplicateService.markAsDuplicate(second.id, first.id, actor);

      const events = auditPort.getEvents();
      expect(events).toHaveLength(1);

      const event = events[0] as any;
      expect(event.eventType).toBe('finance.ap.invoice.duplicate_flagged');
      expect(event.payload.duplicateOfId).toBe(first.id);
    });
  });
});
