/**
 * Entity Transformer Tests
 * 
 * Tests the transformation of AP entities into canvas display data.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import {
  transformVendor,
  transformInvoice,
  transformMatch,
  transformApproval,
  transformPayment,
  transformEntity,
  calculateUrgency,
  calculatePriorityScore,
  STATUS_COLORS,
  CELL_COLORS,
  type VendorEntity,
  type InvoiceEntity,
  type MatchEntity,
  type ApprovalEntity,
  type PaymentEntity,
} from '../entityTransformers';

describe('Entity Transformers', () => {
  // =========================================================================
  // Urgency Calculation
  // =========================================================================
  
  describe('calculateUrgency', () => {
    it('returns normal for no due date', () => {
      expect(calculateUrgency(null)).toBe('normal');
      expect(calculateUrgency(undefined)).toBe('normal');
    });

    it('returns overdue for past dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(calculateUrgency(yesterday)).toBe('overdue');
    });

    it('returns critical for today', () => {
      const today = new Date();
      expect(calculateUrgency(today)).toBe('critical');
    });

    it('returns soon for within 3 days', () => {
      const twoDaysFromNow = new Date();
      twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
      expect(calculateUrgency(twoDaysFromNow)).toBe('soon');
    });

    it('returns normal for far future', () => {
      const nextMonth = new Date();
      nextMonth.setDate(nextMonth.getDate() + 30);
      expect(calculateUrgency(nextMonth)).toBe('normal');
    });

    it('handles string dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(calculateUrgency(yesterday.toISOString())).toBe('overdue');
    });
  });

  // =========================================================================
  // Priority Score Calculation
  // =========================================================================
  
  describe('calculatePriorityScore', () => {
    it('returns 0 for no factors', () => {
      expect(calculatePriorityScore({})).toBe(0);
    });

    it('adds points for high amounts', () => {
      expect(calculatePriorityScore({ amountCents: 100_000_00 })).toBe(30);
      expect(calculatePriorityScore({ amountCents: 50_000_00 })).toBe(25);
      expect(calculatePriorityScore({ amountCents: 10_000_00 })).toBe(15);
      expect(calculatePriorityScore({ amountCents: 1_000_00 })).toBe(5);
    });

    it('adds points for overdue items', () => {
      expect(calculatePriorityScore({ daysUntilDue: -5 })).toBe(25);
    });

    it('adds points for red flags', () => {
      expect(calculatePriorityScore({ hasRedFlag: true })).toBe(20);
    });

    it('adds points for urgent tags', () => {
      expect(calculatePriorityScore({ urgentTagCount: 2 })).toBe(10);
    });

    it('adds points for failed/exception status', () => {
      expect(calculatePriorityScore({ status: 'failed' })).toBe(15);
      expect(calculatePriorityScore({ status: 'exception' })).toBe(15);
    });

    it('caps at 100', () => {
      const maxFactors = {
        amountCents: 100_000_00,
        daysUntilDue: -5,
        hasRedFlag: true,
        urgentTagCount: 5,
        status: 'failed',
      };
      expect(calculatePriorityScore(maxFactors)).toBe(100);
    });

    it('combines multiple factors', () => {
      const factors = {
        amountCents: 50_000_00, // 25 points
        daysUntilDue: 1,       // 20 points
        hasRedFlag: true,      // 20 points
      };
      expect(calculatePriorityScore(factors)).toBe(65);
    });
  });

  // =========================================================================
  // Vendor Transformer
  // =========================================================================
  
  describe('transformVendor', () => {
    const mockVendor: VendorEntity = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      code: 'V001',
      legalName: 'Acme Corporation',
      displayName: 'Acme Corp',
      status: 'approved',
      riskLevel: 'MEDIUM',
      country: 'USA',
    };

    it('transforms vendor to display data', () => {
      const result = transformVendor(mockVendor);
      
      expect(result.displayData.entityType).toBe('vendor');
      expect(result.displayData.cellCode).toBe('AP-01');
      expect(result.displayData.title).toBe('V001');
      expect(result.displayData.subtitle).toBe('Acme Corp');
      expect(result.displayData.status).toBe('approved');
    });

    it('generates correct URN', () => {
      const result = transformVendor(mockVendor);
      expect(result.sourceRef).toBe('urn:aibos:ap:01:vendor:550e8400-e29b-41d4-a716-446655440001');
    });

    it('uses cell color for background', () => {
      const result = transformVendor(mockVendor);
      expect(result.style.backgroundColor).toBe(CELL_COLORS['01']);
    });

    it('sets critical urgency for high risk vendors', () => {
      const highRiskVendor = { ...mockVendor, riskLevel: 'HIGH' as const };
      const result = transformVendor(highRiskVendor);
      expect(result.displayData.urgency).toBe('critical');
    });

    it('increases priority for pending bank changes', () => {
      const vendorWithChanges = { ...mockVendor, hasPendingBankChanges: true };
      const result = transformVendor(vendorWithChanges);
      expect(result.priorityScore).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // Invoice Transformer
  // =========================================================================
  
  describe('transformInvoice', () => {
    const mockInvoice: InvoiceEntity = {
      id: '8f14e45f-ceea-46ed-a8b2-0ba60a3e01c3',
      invoiceNumber: 'INV-2024-0001',
      vendorId: 'vendor-1',
      vendorName: 'Acme Corp',
      totalAmountCents: 1500000, // $15,000
      currency: 'USD',
      status: 'pending_approval',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    };

    it('transforms invoice to display data', () => {
      const result = transformInvoice(mockInvoice);
      
      expect(result.displayData.entityType).toBe('invoice');
      expect(result.displayData.cellCode).toBe('AP-02');
      expect(result.displayData.title).toBe('INV-2024-0001');
      expect(result.displayData.subtitle).toBe('Acme Corp');
      expect(result.displayData.amount).toBe('15000.00');
      expect(result.displayData.currency).toBe('USD');
    });

    it('calculates urgency from due date', () => {
      const result = transformInvoice(mockInvoice);
      expect(result.displayData.urgency).toBe('soon');
    });

    it('sets pulse animation for overdue invoices', () => {
      const overdueInvoice = {
        ...mockInvoice,
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      };
      const result = transformInvoice(overdueInvoice);
      expect(result.style.pulse).toBe(true);
    });

    it('calculates priority based on amount and due date', () => {
      const result = transformInvoice(mockInvoice);
      expect(result.priorityScore).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // Match Transformer
  // =========================================================================
  
  describe('transformMatch', () => {
    const mockMatch: MatchEntity = {
      id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
      invoiceId: 'invoice-1',
      invoiceNumber: 'INV-2024-0001',
      vendorName: 'Acme Corp',
      status: 'passed',
      matchMode: '3_WAY',
    };

    it('transforms match to display data', () => {
      const result = transformMatch(mockMatch);
      
      expect(result.displayData.entityType).toBe('match');
      expect(result.displayData.cellCode).toBe('AP-03');
      expect(result.displayData.title).toContain('Match');
      expect(result.displayData.status).toBe('passed');
    });

    it('sets critical urgency for exceptions', () => {
      const exceptionMatch = { ...mockMatch, status: 'exception', exceptionReason: 'PRICE_VARIANCE' };
      const result = transformMatch(exceptionMatch);
      expect(result.displayData.urgency).toBe('critical');
      expect(result.style.pulse).toBe(true);
    });
  });

  // =========================================================================
  // Approval Transformer
  // =========================================================================
  
  describe('transformApproval', () => {
    const mockApproval: ApprovalEntity = {
      id: 'a87ff679-a2f3-4c94-a1f7-d1d8e0f21f7b',
      invoiceId: 'invoice-1',
      invoiceNumber: 'INV-2024-0001',
      vendorName: 'Acme Corp',
      approvalLevel: 2,
      totalLevels: 3,
      decision: 'pending',
      ageInDays: 5,
    };

    it('transforms approval to display data', () => {
      const result = transformApproval(mockApproval);
      
      expect(result.displayData.entityType).toBe('approval');
      expect(result.displayData.cellCode).toBe('AP-04');
      expect(result.displayData.subtitle).toBe('Level 2/3');
      expect(result.displayData.status).toBe('pending');
    });

    it('sets overdue urgency for old approvals', () => {
      const oldApproval = { ...mockApproval, ageInDays: 10 };
      const result = transformApproval(oldApproval);
      expect(result.displayData.urgency).toBe('overdue');
    });
  });

  // =========================================================================
  // Payment Transformer
  // =========================================================================
  
  describe('transformPayment', () => {
    const mockPayment: PaymentEntity = {
      id: 'e4d909c2-9022-4d1d-8b22-1f6d9c3f1c0a',
      paymentNumber: 'PAY-2024-0089',
      vendorId: 'vendor-1',
      vendorName: 'Acme Corp',
      amount: '45000.00',
      currency: 'USD',
      status: 'processing',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    };

    it('transforms payment to display data', () => {
      const result = transformPayment(mockPayment);
      
      expect(result.displayData.entityType).toBe('payment');
      expect(result.displayData.cellCode).toBe('AP-05');
      expect(result.displayData.title).toBe('PAY-2024-0089');
      expect(result.displayData.amount).toBe('45000.00');
    });

    it('sets pulse for failed payments', () => {
      const failedPayment = { ...mockPayment, status: 'failed' };
      const result = transformPayment(failedPayment);
      expect(result.style.pulse).toBe(true);
    });

    it('calculates high priority for large amounts', () => {
      const result = transformPayment(mockPayment);
      expect(result.priorityScore).toBeGreaterThan(15); // $45K should get 15+ points
    });
  });

  // =========================================================================
  // Generic Transformer
  // =========================================================================
  
  describe('transformEntity', () => {
    it('dispatches to correct transformer by cell code', () => {
      const vendor: VendorEntity = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        code: 'V001',
        legalName: 'Test Vendor',
        status: 'approved',
      };
      
      const result = transformEntity('01', vendor);
      expect(result.displayData.entityType).toBe('vendor');
    });

    it('throws for unknown cell code', () => {
      // @ts-expect-error - Testing runtime behavior
      expect(() => transformEntity('99', {})).toThrow();
    });
  });

  // =========================================================================
  // Status Colors
  // =========================================================================
  
  describe('STATUS_COLORS', () => {
    it('has colors for all vendor statuses', () => {
      expect(STATUS_COLORS.vendor.draft).toBeDefined();
      expect(STATUS_COLORS.vendor.approved).toBeDefined();
      expect(STATUS_COLORS.vendor.rejected).toBeDefined();
    });

    it('has colors for all invoice statuses', () => {
      expect(STATUS_COLORS.invoice.draft).toBeDefined();
      expect(STATUS_COLORS.invoice.submitted).toBeDefined();
      expect(STATUS_COLORS.invoice.paid).toBeDefined();
    });

    it('has colors for all payment statuses', () => {
      expect(STATUS_COLORS.payment.draft).toBeDefined();
      expect(STATUS_COLORS.payment.processing).toBeDefined();
      expect(STATUS_COLORS.payment.completed).toBeDefined();
      expect(STATUS_COLORS.payment.failed).toBeDefined();
    });
  });
});
