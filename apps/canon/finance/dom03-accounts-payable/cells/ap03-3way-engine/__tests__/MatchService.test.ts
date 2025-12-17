/**
 * MatchService Unit Tests
 * 
 * Tests for AP-03 match evaluation logic.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MatchService } from '../MatchService';
import { MemoryMatchingRepository } from '@aibos/kernel-adapters';
import {
  createTestActor,
  createTestInvoice,
  createTestPO,
  createTestGRN,
  createMockInvoicePort,
  createMockPOPort,
  createMockGRNPort,
  createMockPolicyPort,
  createMockAuditPort,
} from './setup';
import {
  InvoiceNotFoundForMatchError,
  InvoiceNotSubmittedError,
  MatchAlreadyExistsError,
} from '../errors';

describe('MatchService', () => {
  let matchService: MatchService;
  let matchRepo: MemoryMatchingRepository;
  let invoicePort: ReturnType<typeof createMockInvoicePort>;
  let poPort: ReturnType<typeof createMockPOPort>;
  let grnPort: ReturnType<typeof createMockGRNPort>;
  let policyPort: ReturnType<typeof createMockPolicyPort>;
  let auditPort: ReturnType<typeof createMockAuditPort>;

  const testTenantId = '00000000-0000-0000-0000-000000000001';
  const testVendorId = '00000000-0000-0000-0000-000000000010';

  beforeEach(() => {
    matchRepo = new MemoryMatchingRepository();
    invoicePort = createMockInvoicePort();
    poPort = createMockPOPort();
    grnPort = createMockGRNPort();
    policyPort = createMockPolicyPort('3-way');
    auditPort = createMockAuditPort();

    matchService = new MatchService(
      matchRepo,
      invoicePort,
      poPort,
      grnPort,
      policyPort,
      auditPort
    );
  });

  describe('1-Way Match', () => {
    it('should pass 1-way match for any submitted invoice', async () => {
      const actor = createTestActor({ tenantId: testTenantId });
      policyPort.setVendorMode(testVendorId, '1-way');

      const invoice = createTestInvoice({
        tenantId: testTenantId,
        vendorId: testVendorId,
        status: 'submitted',
      });
      invoicePort.addInvoice(invoice);

      const result = await matchService.evaluate(invoice.id, actor);

      expect(result.status).toBe('passed');
      expect(result.matchMode).toBe('1-way');
      expect(result.withinTolerance).toBe(true);
    });
  });

  describe('2-Way Match', () => {
    it('should pass 2-way match when PO matches invoice', async () => {
      const actor = createTestActor({ tenantId: testTenantId });
      policyPort.setVendorMode(testVendorId, '2-way');

      const po = createTestPO({
        poNumber: 'PO-001',
        vendorId: testVendorId,
        totalCents: 10000,
        lines: [{ lineNumber: 1, description: 'Item', quantity: 1, unitPriceCents: 10000, totalCents: 10000 }],
      });
      poPort.addOrder(po);

      const invoice = createTestInvoice({
        tenantId: testTenantId,
        vendorId: testVendorId,
        status: 'submitted',
        poNumber: 'PO-001',
        totalAmountCents: 10000,
        lines: [{ lineNumber: 1, description: 'Item', quantity: 1, unitPriceCents: 10000, lineAmountCents: 10000 }],
      });
      invoicePort.addInvoice(invoice);

      const result = await matchService.evaluate(invoice.id, actor);

      expect(result.status).toBe('passed');
      expect(result.matchMode).toBe('2-way');
    });

    it('should fail 2-way match when PO is missing', async () => {
      const actor = createTestActor({ tenantId: testTenantId });
      policyPort.setVendorMode(testVendorId, '2-way');

      const invoice = createTestInvoice({
        tenantId: testTenantId,
        vendorId: testVendorId,
        status: 'submitted',
        // No PO number
      });
      invoicePort.addInvoice(invoice);

      const result = await matchService.evaluate(invoice.id, actor);

      expect(result.status).toBe('exception');
      expect(result.exceptionCode).toBe('missing_po');
    });
  });

  describe('3-Way Match', () => {
    it('should pass 3-way match when PO and GRN support invoice', async () => {
      const actor = createTestActor({ tenantId: testTenantId });

      const po = createTestPO({
        poNumber: 'PO-002',
        vendorId: testVendorId,
        totalCents: 10000,
      });
      poPort.addOrder(po);

      const grn = createTestGRN({
        grnNumber: 'GRN-001',
        poNumber: 'PO-002',
        lines: [{ lineNumber: 1, poLineNumber: 1, receivedQty: 1, receivedAt: new Date() }],
      });
      grnPort.addReceipt('PO-002', grn);

      const invoice = createTestInvoice({
        tenantId: testTenantId,
        vendorId: testVendorId,
        status: 'submitted',
        poNumber: 'PO-002',
        totalAmountCents: 10000,
      });
      invoicePort.addInvoice(invoice);

      const result = await matchService.evaluate(invoice.id, actor);

      expect(result.status).toBe('passed');
      expect(result.matchMode).toBe('3-way');
    });

    it('should fail 3-way match when GRN qty is insufficient', async () => {
      const actor = createTestActor({ tenantId: testTenantId });

      const po = createTestPO({
        poNumber: 'PO-003',
        vendorId: testVendorId,
        totalCents: 20000, // 2 items
        lines: [{ lineNumber: 1, description: 'Item', quantity: 2, unitPriceCents: 10000, totalCents: 20000 }],
      });
      poPort.addOrder(po);

      // Only 1 received
      const grn = createTestGRN({
        grnNumber: 'GRN-002',
        poNumber: 'PO-003',
        lines: [{ lineNumber: 1, poLineNumber: 1, receivedQty: 1, receivedAt: new Date() }],
      });
      grnPort.addReceipt('PO-003', grn);

      const invoice = createTestInvoice({
        tenantId: testTenantId,
        vendorId: testVendorId,
        status: 'submitted',
        poNumber: 'PO-003',
        totalAmountCents: 20000,
        lines: [{ lineNumber: 1, description: 'Item', quantity: 2, unitPriceCents: 10000, lineAmountCents: 20000 }],
      });
      invoicePort.addInvoice(invoice);

      const result = await matchService.evaluate(invoice.id, actor);

      expect(result.status).toBe('exception');
      expect(result.exceptionCode).toBe('insufficient_receipt');
    });
  });

  describe('Error Handling', () => {
    it('should throw when invoice not found', async () => {
      const actor = createTestActor({ tenantId: testTenantId });

      await expect(
        matchService.evaluate('non-existent-id', actor)
      ).rejects.toThrow(InvoiceNotFoundForMatchError);
    });

    it('should throw when invoice not in submitted status', async () => {
      const actor = createTestActor({ tenantId: testTenantId });

      const invoice = createTestInvoice({
        tenantId: testTenantId,
        status: 'draft', // Not submitted
      });
      invoicePort.addInvoice(invoice);

      await expect(
        matchService.evaluate(invoice.id, actor)
      ).rejects.toThrow(InvoiceNotSubmittedError);
    });

    it('should throw when match already exists', async () => {
      const actor = createTestActor({ tenantId: testTenantId });
      policyPort.setVendorMode(testVendorId, '1-way');

      const invoice = createTestInvoice({
        tenantId: testTenantId,
        vendorId: testVendorId,
        status: 'submitted',
      });
      invoicePort.addInvoice(invoice);

      // First evaluation
      await matchService.evaluate(invoice.id, actor);

      // Second evaluation should fail
      await expect(
        matchService.evaluate(invoice.id, actor)
      ).rejects.toThrow(MatchAlreadyExistsError);
    });
  });

  describe('Audit Events', () => {
    it('should emit audit event on successful evaluation', async () => {
      const actor = createTestActor({ tenantId: testTenantId });
      policyPort.setVendorMode(testVendorId, '1-way');

      const invoice = createTestInvoice({
        tenantId: testTenantId,
        vendorId: testVendorId,
        status: 'submitted',
      });
      invoicePort.addInvoice(invoice);

      auditPort.clear();
      await matchService.evaluate(invoice.id, actor);

      const events = auditPort.getEvents();
      expect(events).toHaveLength(1);
      expect((events[0] as any).eventType).toBe('finance.ap.match.evaluated');
    });
  });
});
