/**
 * AP-02 Invoice Entry Cell Integration Tests
 * 
 * Real database tests for the invoice cell.
 * 
 * @file apps/canon/finance/dom03-accounts-payable/cells/ap02-invoice-entry/__tests__/integration/invoice-cell.integration.test.ts
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { Pool } from 'pg';
import {
  getTestPool,
  closeTestPool,
  cleanupTestData,
  insertTestVendor,
  createIntegrationTestActor,
  createIntegrationTestInvoiceInput,
  TEST_TENANT_ID,
  TEST_COMPANY_ID,
  TEST_VENDOR_ID,
} from './setup';
import { SqlInvoiceRepository } from '@aibos/kernel-adapters';
import { InvoiceService, DuplicateDetectionService } from '../../';
import type { InvoiceRepositoryPort, AuditPort, AuditEvent, InvoiceTransactionContext } from '@aibos/kernel-core';
import type { VendorValidationPort } from '../../';

// ============================================================================
// TEST SETUP
// ============================================================================

let pool: Pool;
let invoiceRepo: InvoiceRepositoryPort;
let invoiceService: InvoiceService;
let duplicateService: DuplicateDetectionService;

// Mock audit adapter that logs events
class IntegrationAuditAdapter implements AuditPort {
  private events: AuditEvent[] = [];

  async append(): Promise<void> {}

  async emitTransactional(event: AuditEvent, _txContext: InvoiceTransactionContext): Promise<void> {
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

// Mock vendor validation that always approves TEST_VENDOR_ID
class IntegrationVendorAdapter implements VendorValidationPort {
  async isVendorApproved(vendorId: string, _tenantId: string): Promise<boolean> {
    return vendorId === TEST_VENDOR_ID;
  }

  async getVendorInfo(vendorId: string, _tenantId: string): Promise<{ code: string; name: string } | null> {
    if (vendorId === TEST_VENDOR_ID) {
      return { code: 'TEST-VENDOR', name: 'Test Vendor Inc' };
    }
    return null;
  }
}

describe('AP-02 Invoice Cell Integration Tests', () => {
  beforeAll(async () => {
    pool = await getTestPool();
    invoiceRepo = new SqlInvoiceRepository(pool);
    
    const auditPort = new IntegrationAuditAdapter();
    const vendorPort = new IntegrationVendorAdapter();
    
    invoiceService = new InvoiceService(invoiceRepo, vendorPort, auditPort);
    duplicateService = new DuplicateDetectionService(invoiceRepo, auditPort);

    // Ensure test vendor exists
    await insertTestVendor(pool);
  });

  afterAll(async () => {
    await closeTestPool();
  });

  beforeEach(async () => {
    await cleanupTestData(pool);
  });

  // ============================================================================
  // INVOICE CREATION TESTS
  // ============================================================================

  describe('Invoice Creation', () => {
    it('should create invoice with lines in database', async () => {
      const actor = createIntegrationTestActor();
      const input = createIntegrationTestInvoiceInput({
        lines: [
          { description: 'Line 1', quantity: 2, unitPriceCents: 5000, debitAccountCode: '5100' },
          { description: 'Line 2', quantity: 1, unitPriceCents: 10000, debitAccountCode: '5200' },
        ],
      });

      const invoice = await invoiceService.create({
        companyId: TEST_COMPANY_ID,
        invoiceNumber: input.invoiceNumber!,
        invoiceDate: input.invoiceDate!,
        dueDate: input.dueDate!,
        vendorId: input.vendorId!,
        currency: input.currency!,
        lines: input.lines!.map((l, i) => ({
          description: l.description!,
          quantity: l.quantity!,
          unitPriceCents: l.unitPriceCents!,
          debitAccountCode: l.debitAccountCode!,
        })),
      }, actor);

      expect(invoice.id).toBeDefined();
      expect(invoice.status).toBe('draft');
      expect(invoice.subtotalCents).toBe(20000); // 2*5000 + 1*10000
      expect(invoice.totalAmountCents).toBe(20000);

      // Verify in database
      const found = await invoiceRepo.findById(invoice.id, TEST_TENANT_ID);
      expect(found).toBeDefined();
      expect(found!.invoiceNumber).toBe(input.invoiceNumber);
    });

    it('should calculate totals correctly', async () => {
      const actor = createIntegrationTestActor();
      const input = createIntegrationTestInvoiceInput({
        lines: [
          { description: 'Item A', quantity: 3, unitPriceCents: 1500, debitAccountCode: '5100' },
          { description: 'Item B', quantity: 2.5, unitPriceCents: 2000, debitAccountCode: '5100' },
        ],
        taxAmountCents: 950,
      });

      const invoice = await invoiceService.create({
        companyId: TEST_COMPANY_ID,
        invoiceNumber: input.invoiceNumber!,
        invoiceDate: input.invoiceDate!,
        dueDate: input.dueDate!,
        vendorId: input.vendorId!,
        currency: input.currency!,
        taxAmountCents: 950,
        lines: input.lines!.map((l) => ({
          description: l.description!,
          quantity: l.quantity!,
          unitPriceCents: l.unitPriceCents!,
          debitAccountCode: l.debitAccountCode!,
        })),
      }, actor);

      // 3*1500 + 2.5*2000 = 4500 + 5000 = 9500
      expect(invoice.subtotalCents).toBe(9500);
      // 9500 + 950 tax = 10450
      expect(invoice.totalAmountCents).toBe(10450);
    });
  });

  // ============================================================================
  // INVOICE LIFECYCLE TESTS
  // ============================================================================

  describe('Invoice Lifecycle', () => {
    it('should submit invoice (draft -> submitted)', async () => {
      const actor = createIntegrationTestActor();
      const input = createIntegrationTestInvoiceInput();

      const invoice = await invoiceService.create({
        companyId: TEST_COMPANY_ID,
        invoiceNumber: input.invoiceNumber!,
        invoiceDate: input.invoiceDate!,
        dueDate: input.dueDate!,
        vendorId: input.vendorId!,
        currency: input.currency!,
        lines: input.lines!.map((l) => ({
          description: l.description!,
          quantity: l.quantity!,
          unitPriceCents: l.unitPriceCents!,
          debitAccountCode: l.debitAccountCode!,
        })),
      }, actor);

      expect(invoice.status).toBe('draft');

      const submitted = await invoiceService.submit(invoice.id, actor, invoice.version);

      expect(submitted.status).toBe('submitted');
      expect(submitted.submittedAt).toBeDefined();
      expect(submitted.submittedBy).toBe(actor.userId);
    });

    it('should void approved invoice', async () => {
      const actor = createIntegrationTestActor();
      const input = createIntegrationTestInvoiceInput();

      const invoice = await invoiceService.create({
        companyId: TEST_COMPANY_ID,
        invoiceNumber: input.invoiceNumber!,
        invoiceDate: input.invoiceDate!,
        dueDate: input.dueDate!,
        vendorId: input.vendorId!,
        currency: input.currency!,
        lines: input.lines!.map((l) => ({
          description: l.description!,
          quantity: l.quantity!,
          unitPriceCents: l.unitPriceCents!,
          debitAccountCode: l.debitAccountCode!,
        })),
      }, actor);

      // Manually set to approved status
      await invoiceRepo.withTransaction(async (txContext) => {
        await invoiceRepo.updateStatus(invoice.id, {
          tenantId: actor.tenantId,
          status: 'approved',
        }, txContext);
      });

      const approved = await invoiceRepo.findById(invoice.id, TEST_TENANT_ID);

      const voided = await invoiceService.void(
        invoice.id,
        'Duplicate invoice - voiding',
        actor,
        approved!.version
      );

      expect(voided.status).toBe('voided');
    });
  });

  // ============================================================================
  // DUPLICATE DETECTION TESTS
  // ============================================================================

  describe('Duplicate Detection', () => {
    it('should detect exact duplicate invoice', async () => {
      const actor = createIntegrationTestActor();
      const invoiceDate = new Date('2025-03-15');

      // Create first invoice
      await invoiceService.create({
        companyId: TEST_COMPANY_ID,
        invoiceNumber: 'DUP-001',
        invoiceDate,
        dueDate: new Date('2025-04-15'),
        vendorId: TEST_VENDOR_ID,
        currency: 'USD',
        lines: [{ description: 'Test', quantity: 1, unitPriceCents: 10000, debitAccountCode: '5100' }],
      }, actor);

      // Check for duplicate
      const result = await duplicateService.checkDuplicate({
        vendorId: TEST_VENDOR_ID,
        invoiceNumber: 'DUP-001',
        invoiceDate,
        totalAmountCents: 10000,
      }, actor);

      expect(result.isDuplicate).toBe(true);
      expect(result.matchType).toBe('exact');
    });
  });

  // ============================================================================
  // LISTING & QUERYING TESTS
  // ============================================================================

  describe('Invoice Listing', () => {
    it('should list invoices with filters', async () => {
      const actor = createIntegrationTestActor();

      // Create multiple invoices
      for (let i = 1; i <= 3; i++) {
        await invoiceService.create({
          companyId: TEST_COMPANY_ID,
          invoiceNumber: `LIST-${i}`,
          invoiceDate: new Date('2025-01-15'),
          dueDate: new Date('2025-02-15'),
          vendorId: TEST_VENDOR_ID,
          currency: 'USD',
          lines: [{ description: `Item ${i}`, quantity: 1, unitPriceCents: 10000 * i, debitAccountCode: '5100' }],
        }, actor);
      }

      const result = await invoiceService.list({
        status: 'draft',
        limit: 10,
        offset: 0,
      }, actor);

      expect(result.invoices.length).toBe(3);
      expect(result.total).toBe(3);
    });

    it('should filter by vendor', async () => {
      const actor = createIntegrationTestActor();

      await invoiceService.create({
        companyId: TEST_COMPANY_ID,
        invoiceNumber: 'VENDOR-FILTER-1',
        invoiceDate: new Date('2025-01-15'),
        dueDate: new Date('2025-02-15'),
        vendorId: TEST_VENDOR_ID,
        currency: 'USD',
        lines: [{ description: 'Test', quantity: 1, unitPriceCents: 10000, debitAccountCode: '5100' }],
      }, actor);

      const result = await invoiceService.list({
        vendorId: TEST_VENDOR_ID,
        limit: 10,
      }, actor);

      expect(result.invoices.every((inv) => inv.vendorId === TEST_VENDOR_ID)).toBe(true);
    });
  });
});
