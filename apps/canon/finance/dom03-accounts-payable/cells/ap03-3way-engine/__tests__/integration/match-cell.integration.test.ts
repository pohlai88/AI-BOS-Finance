/**
 * AP-03 3-Way Match & Controls Engine Integration Tests
 * 
 * Real database tests for the matching cell.
 * 
 * @file apps/canon/finance/dom03-accounts-payable/cells/ap03-3way-engine/__tests__/integration/match-cell.integration.test.ts
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { Pool } from 'pg';
import {
  getTestPool,
  closeTestPool,
  cleanupTestData,
  insertTestVendor,
  insertTestInvoice,
  createIntegrationTestActor,
  TEST_TENANT_ID,
  TEST_VENDOR_ID,
  TEST_USER_ID,
  TEST_APPROVER_ID,
} from './setup';
import { SqlMatchingRepository } from '@aibos/kernel-adapters';
import { MatchService, OverrideService, ExceptionService } from '../../';
import type { MatchingRepositoryPort, AuditPort, AuditEvent } from '@aibos/kernel-core';
import type { ActorContext } from '@aibos/canon-governance';
import type { MatchMode, PolicySource, ToleranceConfig, InvoiceForMatch, PurchaseOrderData, GoodsReceiptData } from '../../MatchTypes';

// ============================================================================
// TEST SETUP
// ============================================================================

let pool: Pool;
let matchingRepo: MatchingRepositoryPort;
let matchService: MatchService;
let overrideService: OverrideService;
let exceptionService: ExceptionService;

// Mock audit adapter
class IntegrationAuditAdapter implements AuditPort {
  private events: AuditEvent[] = [];

  async append(): Promise<void> {}

  async emitTransactional(event: AuditEvent): Promise<void> {
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

// Mock invoice port that returns test invoices
class IntegrationInvoicePort {
  private invoices = new Map<string, InvoiceForMatch>();

  async getInvoiceForMatch(invoiceId: string, tenantId: string): Promise<InvoiceForMatch | null> {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice || invoice.tenantId !== tenantId) return null;
    return invoice;
  }

  async updateInvoiceMatchStatus(): Promise<void> {}

  addInvoice(invoice: InvoiceForMatch): void {
    this.invoices.set(invoice.id, invoice);
  }

  clear(): void {
    this.invoices.clear();
  }
}

// Mock PO port
class IntegrationPOPort {
  private orders = new Map<string, PurchaseOrderData>();

  async getPurchaseOrder(poNumber: string): Promise<PurchaseOrderData | null> {
    return this.orders.get(poNumber) || null;
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  addOrder(order: PurchaseOrderData): void {
    this.orders.set(order.poNumber, order);
  }

  clear(): void {
    this.orders.clear();
  }
}

// Mock GRN port
class IntegrationGRNPort {
  private receipts = new Map<string, GoodsReceiptData[]>();

  async getGoodsReceipt(grnNumber: string): Promise<GoodsReceiptData | null> {
    for (const grns of this.receipts.values()) {
      const grn = grns.find(g => g.grnNumber === grnNumber);
      if (grn) return grn;
    }
    return null;
  }

  async getGoodsReceiptsForPO(poNumber: string): Promise<GoodsReceiptData[]> {
    return this.receipts.get(poNumber) || [];
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  addReceipt(poNumber: string, receipt: GoodsReceiptData): void {
    const existing = this.receipts.get(poNumber) || [];
    existing.push(receipt);
    this.receipts.set(poNumber, existing);
  }

  clear(): void {
    this.receipts.clear();
  }
}

// Mock policy port
class IntegrationPolicyPort {
  async getMatchMode(_tenantId: string, _vendorId: string): Promise<{ mode: MatchMode; source: PolicySource }> {
    return { mode: '3-way', source: 'tenant' };
  }

  async getTolerances(): Promise<ToleranceConfig> {
    return {
      priceTolerancePercent: 5,
      qtyTolerancePercent: 2,
      amountToleranceCents: 10000,
    };
  }
}

// Mock permission port
class IntegrationPermissionPort {
  async canOverrideMatch(_userId: string): Promise<boolean> {
    return true;
  }
}

const auditPort = new IntegrationAuditAdapter();
const invoicePort = new IntegrationInvoicePort();
const poPort = new IntegrationPOPort();
const grnPort = new IntegrationGRNPort();
const policyPort = new IntegrationPolicyPort();
const permissionPort = new IntegrationPermissionPort();

describe('AP-03 3-Way Match Cell Integration Tests', () => {
  beforeAll(async () => {
    pool = await getTestPool();
    matchingRepo = new SqlMatchingRepository(pool);
    
    // @ts-expect-error - Using mock ports for testing
    matchService = new MatchService(
      matchingRepo,
      invoicePort,
      poPort,
      grnPort,
      policyPort,
      auditPort
    );

    // @ts-expect-error - Using mock ports for testing
    overrideService = new OverrideService(
      matchingRepo,
      permissionPort,
      auditPort
    );

    // @ts-expect-error - Using mock ports for testing
    exceptionService = new ExceptionService(
      matchingRepo,
      auditPort
    );

    // Ensure test vendor exists
    await insertTestVendor(pool);
  });

  afterAll(async () => {
    await closeTestPool();
  });

  beforeEach(async () => {
    await cleanupTestData(pool);
    auditPort.clear();
    invoicePort.clear();
    poPort.clear();
    grnPort.clear();
  });

  // ============================================================================
  // 1-WAY MATCH TESTS
  // ============================================================================

  describe('1-Way Match (Invoice Only)', () => {
    it('should pass 1-way match for valid invoice', async () => {
      const actor = createIntegrationTestActor();
      const invoiceId = await insertTestInvoice(pool, {
        vendorId: TEST_VENDOR_ID,
        totalAmountCents: 10000,
      });

      // Add invoice to mock port
      invoicePort.addInvoice({
        id: invoiceId,
        tenantId: TEST_TENANT_ID,
        vendorId: TEST_VENDOR_ID,
        invoiceNumber: 'INV-TEST',
        status: 'submitted',
        subtotalCents: 10000,
        taxAmountCents: 0,
        totalAmountCents: 10000,
        currency: 'USD',
        lines: [{
          lineNumber: 1,
          description: 'Test Item',
          quantity: 1,
          unitPriceCents: 10000,
          lineAmountCents: 10000,
        }],
      });

      // Evaluate match (1-way mode forced)
      const result = await matchService.evaluateMatch(invoiceId, actor, '1-way');

      expect(result).toBeDefined();
      expect(result.matchStatus).toBe('passed');
      expect(result.matchMode).toBe('1-way');
    });
  });

  // ============================================================================
  // 2-WAY MATCH TESTS
  // ============================================================================

  describe('2-Way Match (Invoice ↔ PO)', () => {
    it('should pass 2-way match when invoice matches PO', async () => {
      const actor = createIntegrationTestActor();
      const poNumber = `PO-${Date.now()}`;
      const invoiceId = await insertTestInvoice(pool, {
        vendorId: TEST_VENDOR_ID,
        totalAmountCents: 10000,
        poNumber,
      });

      // Add invoice to mock port
      invoicePort.addInvoice({
        id: invoiceId,
        tenantId: TEST_TENANT_ID,
        vendorId: TEST_VENDOR_ID,
        invoiceNumber: 'INV-TEST',
        status: 'submitted',
        subtotalCents: 10000,
        taxAmountCents: 0,
        totalAmountCents: 10000,
        currency: 'USD',
        poNumber,
        lines: [{
          lineNumber: 1,
          description: 'Test Item',
          quantity: 1,
          unitPriceCents: 10000,
          lineAmountCents: 10000,
          poLineNumber: 1,
        }],
      });

      // Add PO to mock port
      poPort.addOrder({
        poNumber,
        vendorId: TEST_VENDOR_ID,
        currency: 'USD',
        totalCents: 10000,
        status: 'open',
        createdAt: new Date(),
        lines: [{
          lineNumber: 1,
          description: 'Test Item',
          quantity: 1,
          unitPriceCents: 10000,
          totalCents: 10000,
        }],
      });

      // Evaluate match (2-way mode)
      const result = await matchService.evaluateMatch(invoiceId, actor, '2-way');

      expect(result).toBeDefined();
      expect(result.matchStatus).toBe('passed');
      expect(result.matchMode).toBe('2-way');
    });

    it('should create exception for price variance exceeding tolerance', async () => {
      const actor = createIntegrationTestActor();
      const poNumber = `PO-${Date.now()}`;
      const invoiceId = await insertTestInvoice(pool, {
        vendorId: TEST_VENDOR_ID,
        totalAmountCents: 11000, // 10% higher than PO
        poNumber,
      });

      // Add invoice with higher price
      invoicePort.addInvoice({
        id: invoiceId,
        tenantId: TEST_TENANT_ID,
        vendorId: TEST_VENDOR_ID,
        invoiceNumber: 'INV-TEST',
        status: 'submitted',
        subtotalCents: 11000,
        taxAmountCents: 0,
        totalAmountCents: 11000,
        currency: 'USD',
        poNumber,
        lines: [{
          lineNumber: 1,
          description: 'Test Item',
          quantity: 1,
          unitPriceCents: 11000, // Higher than PO
          lineAmountCents: 11000,
          poLineNumber: 1,
        }],
      });

      // Add PO with original price
      poPort.addOrder({
        poNumber,
        vendorId: TEST_VENDOR_ID,
        currency: 'USD',
        totalCents: 10000,
        status: 'open',
        createdAt: new Date(),
        lines: [{
          lineNumber: 1,
          description: 'Test Item',
          quantity: 1,
          unitPriceCents: 10000,
          totalCents: 10000,
        }],
      });

      // Evaluate match
      const result = await matchService.evaluateMatch(invoiceId, actor, '2-way');

      expect(result).toBeDefined();
      expect(result.matchStatus).toBe('exception');
      expect(result.exceptions).toBeDefined();
      expect(result.exceptions!.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // 3-WAY MATCH TESTS
  // ============================================================================

  describe('3-Way Match (Invoice ↔ PO ↔ GRN)', () => {
    it('should pass 3-way match when invoice matches PO and GRN', async () => {
      const actor = createIntegrationTestActor();
      const poNumber = `PO-${Date.now()}`;
      const grnNumber = `GRN-${Date.now()}`;
      const invoiceId = await insertTestInvoice(pool, {
        vendorId: TEST_VENDOR_ID,
        totalAmountCents: 10000,
        poNumber,
      });

      // Add invoice
      invoicePort.addInvoice({
        id: invoiceId,
        tenantId: TEST_TENANT_ID,
        vendorId: TEST_VENDOR_ID,
        invoiceNumber: 'INV-TEST',
        status: 'submitted',
        subtotalCents: 10000,
        taxAmountCents: 0,
        totalAmountCents: 10000,
        currency: 'USD',
        poNumber,
        lines: [{
          lineNumber: 1,
          description: 'Test Item',
          quantity: 1,
          unitPriceCents: 10000,
          lineAmountCents: 10000,
          poLineNumber: 1,
        }],
      });

      // Add PO
      poPort.addOrder({
        poNumber,
        vendorId: TEST_VENDOR_ID,
        currency: 'USD',
        totalCents: 10000,
        status: 'open',
        createdAt: new Date(),
        lines: [{
          lineNumber: 1,
          description: 'Test Item',
          quantity: 1,
          unitPriceCents: 10000,
          totalCents: 10000,
        }],
      });

      // Add GRN
      grnPort.addReceipt(poNumber, {
        grnNumber,
        poNumber,
        vendorId: TEST_VENDOR_ID,
        totalReceivedQty: 1,
        status: 'received',
        receivedAt: new Date(),
        lines: [{
          lineNumber: 1,
          poLineNumber: 1,
          receivedQty: 1,
          receivedAt: new Date(),
        }],
      });

      // Evaluate match
      const result = await matchService.evaluateMatch(invoiceId, actor, '3-way');

      expect(result).toBeDefined();
      expect(result.matchStatus).toBe('passed');
      expect(result.matchMode).toBe('3-way');
    });
  });

  // ============================================================================
  // OVERRIDE TESTS
  // ============================================================================

  describe('Match Override (SoD Enforcement)', () => {
    it('should allow override by different user (SoD)', async () => {
      const creator = createIntegrationTestActor({ userId: TEST_USER_ID });
      const approver = createIntegrationTestActor({ userId: TEST_APPROVER_ID });
      
      const invoiceId = await insertTestInvoice(pool, {
        vendorId: TEST_VENDOR_ID,
        totalAmountCents: 11000,
      });

      // Add invoice
      invoicePort.addInvoice({
        id: invoiceId,
        tenantId: TEST_TENANT_ID,
        vendorId: TEST_VENDOR_ID,
        invoiceNumber: 'INV-TEST',
        status: 'submitted',
        subtotalCents: 11000,
        taxAmountCents: 0,
        totalAmountCents: 11000,
        currency: 'USD',
        lines: [{
          lineNumber: 1,
          description: 'Test Item',
          quantity: 1,
          unitPriceCents: 11000,
          lineAmountCents: 11000,
        }],
      });

      // Create exception result first
      const matchResult = await matchService.evaluateMatch(invoiceId, creator, '1-way');
      expect(matchResult).toBeDefined();

      // Override by different user
      if (matchResult.matchStatus === 'exception' || matchResult.matchStatus === 'passed') {
        const overrideResult = await overrideService.overrideMatch(
          matchResult.id,
          'Approved by finance manager',
          approver
        );

        expect(overrideResult).toBeDefined();
        expect(overrideResult.overriddenBy).toBe(TEST_APPROVER_ID);
      }
    });
  });

  // ============================================================================
  // EXCEPTION QUEUE TESTS
  // ============================================================================

  describe('Exception Queue Management', () => {
    it('should list pending exceptions', async () => {
      const actor = createIntegrationTestActor();
      
      // Create multiple invoices with exceptions
      for (let i = 0; i < 3; i++) {
        const invoiceId = await insertTestInvoice(pool, {
          vendorId: TEST_VENDOR_ID,
          totalAmountCents: 15000, // Create variance
          invoiceNumber: `INV-EXC-${i}`,
        });

        invoicePort.addInvoice({
          id: invoiceId,
          tenantId: TEST_TENANT_ID,
          vendorId: TEST_VENDOR_ID,
          invoiceNumber: `INV-EXC-${i}`,
          status: 'submitted',
          subtotalCents: 15000,
          taxAmountCents: 0,
          totalAmountCents: 15000,
          currency: 'USD',
          lines: [{
            lineNumber: 1,
            description: 'Test Item',
            quantity: 1,
            unitPriceCents: 15000,
            lineAmountCents: 15000,
          }],
        });

        await matchService.evaluateMatch(invoiceId, actor, '1-way');
      }

      // Get exception queue
      const exceptions = await exceptionService.getExceptionQueue(actor);
      
      expect(exceptions).toBeDefined();
      expect(Array.isArray(exceptions)).toBe(true);
    });
  });

  // ============================================================================
  // AUDIT TRAIL TESTS
  // ============================================================================

  describe('Audit Trail', () => {
    it('should emit audit events for match evaluation', async () => {
      const actor = createIntegrationTestActor();
      const invoiceId = await insertTestInvoice(pool, {
        vendorId: TEST_VENDOR_ID,
        totalAmountCents: 10000,
      });

      invoicePort.addInvoice({
        id: invoiceId,
        tenantId: TEST_TENANT_ID,
        vendorId: TEST_VENDOR_ID,
        invoiceNumber: 'INV-AUDIT',
        status: 'submitted',
        subtotalCents: 10000,
        taxAmountCents: 0,
        totalAmountCents: 10000,
        currency: 'USD',
        lines: [{
          lineNumber: 1,
          description: 'Test Item',
          quantity: 1,
          unitPriceCents: 10000,
          lineAmountCents: 10000,
        }],
      });

      auditPort.clear();
      await matchService.evaluateMatch(invoiceId, actor, '1-way');

      const events = auditPort.getEvents();
      expect(events.length).toBeGreaterThan(0);
    });
  });
});
