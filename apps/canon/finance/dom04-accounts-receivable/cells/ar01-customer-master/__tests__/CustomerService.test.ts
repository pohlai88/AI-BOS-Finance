/**
 * AR-01 Customer Master - CustomerService Unit Tests
 * 
 * Tests for domain service logic including:
 * - State machine transitions
 * - SoD enforcement
 * - Optimistic locking
 * - Error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CustomerService, ActorContext, SequencePort, AuditOutboxPort, PolicyPort } from '../CustomerService';
import { CustomerCellError } from '../errors';
import type { Customer, CustomerRepositoryPort } from '@aibos/kernel-core';

// =============================================================================
// Mock Setup
// =============================================================================

function createMockCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: 'cust-001',
    tenantId: 'tenant-001',
    customerCode: 'CUS-000001',
    legalName: 'Acme Corp',
    displayName: 'Acme',
    taxId: '123456789',
    registrationNumber: null,
    country: 'USA',
    currencyPreference: 'USD',
    customerCategory: 'Enterprise',
    status: 'draft',
    riskLevel: 'LOW',
    creditLimit: 50000,
    currentBalance: 0,
    availableCredit: 50000,
    defaultPaymentTerms: 30,
    creditRiskScore: null,
    paymentHistoryFlag: null,
    collectionStatus: 'CURRENT',
    lastBalanceUpdatedAt: null,
    lastReconciledAt: null,
    createdBy: 'user-creator',
    createdAt: new Date(),
    approvedBy: null,
    approvedAt: null,
    version: 1,
    updatedAt: new Date(),
    ...overrides,
  };
}

function createMockRepo(): CustomerRepositoryPort {
  return {
    create: vi.fn(),
    getById: vi.fn(),
    getByCode: vi.fn(),
    update: vi.fn(),
    list: vi.fn(),
    existsByTaxId: vi.fn(),
    createAddress: vi.fn(),
    getAddresses: vi.fn(),
    updateAddress: vi.fn(),
    deleteAddress: vi.fn(),
    createContact: vi.fn(),
    getContacts: vi.fn(),
    updateContact: vi.fn(),
    deleteContact: vi.fn(),
    createCreditHistory: vi.fn(),
    getCreditHistory: vi.fn(),
    getPendingCreditChangeRequest: vi.fn(),
    approveCreditChangeRequest: vi.fn(),
    rejectCreditChangeRequest: vi.fn(),
    beginTransaction: vi.fn(),
    commitTransaction: vi.fn(),
    rollbackTransaction: vi.fn(),
  };
}

function createMockSequence(): SequencePort {
  return {
    nextSequence: vi.fn().mockResolvedValue('CUS-000001'),
  };
}

function createMockAudit(): AuditOutboxPort {
  return {
    writeEvent: vi.fn().mockResolvedValue(undefined),
  };
}

function createMockPolicy(): PolicyPort {
  return {
    evaluate: vi.fn().mockResolvedValue({ allowed: true }),
  };
}

const creatorActor: ActorContext = {
  tenantId: 'tenant-001',
  userId: 'user-creator',
  permissions: ['ar.customer.create'],
};

const approverActor: ActorContext = {
  tenantId: 'tenant-001',
  userId: 'user-approver',
  permissions: ['ar.customer.approve'],
};

// =============================================================================
// Tests
// =============================================================================

describe('CustomerService', () => {
  let repo: CustomerRepositoryPort;
  let sequence: SequencePort;
  let audit: AuditOutboxPort;
  let policy: PolicyPort;
  let service: CustomerService;

  beforeEach(() => {
    repo = createMockRepo();
    sequence = createMockSequence();
    audit = createMockAudit();
    policy = createMockPolicy();
    service = new CustomerService(repo, sequence, audit, policy);
  });

  // ---------------------------------------------------------------------------
  // Create Customer
  // ---------------------------------------------------------------------------

  describe('create', () => {
    it('should create a customer in draft status', async () => {
      const mockCustomer = createMockCustomer();
      vi.mocked(repo.existsByTaxId).mockResolvedValue(false);
      vi.mocked(repo.create).mockResolvedValue(mockCustomer);

      const result = await service.create(
        {
          legalName: 'Acme Corp',
          country: 'USA',
          currencyPreference: 'USD',
        },
        creatorActor
      );

      expect(result.status).toBe('draft');
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-001',
          legalName: 'Acme Corp',
          createdBy: 'user-creator',
        }),
        'CUS-000001'
      );
      expect(audit.writeEvent).toHaveBeenCalledWith(
        'tenant-001',
        'CUSTOMER_CREATED',
        'cust-001',
        'Customer',
        expect.any(Object)
      );
    });

    it('should reject duplicate tax ID', async () => {
      vi.mocked(repo.existsByTaxId).mockResolvedValue(true);

      await expect(
        service.create(
          { legalName: 'Acme Corp', country: 'USA', taxId: '123456789' },
          creatorActor
        )
      ).rejects.toThrow(CustomerCellError);

      try {
        await service.create(
          { legalName: 'Acme Corp', country: 'USA', taxId: '123456789' },
          creatorActor
        );
      } catch (error) {
        expect((error as CustomerCellError).code).toBe('DUPLICATE_TAX_ID');
      }
    });
  });

  // ---------------------------------------------------------------------------
  // State Machine: Submit
  // ---------------------------------------------------------------------------

  describe('submit', () => {
    it('should submit draft customer', async () => {
      const draftCustomer = createMockCustomer({ status: 'draft' });
      const submittedCustomer = createMockCustomer({ status: 'submitted', version: 2 });

      vi.mocked(repo.getById).mockResolvedValue(draftCustomer);
      vi.mocked(repo.update).mockResolvedValue(submittedCustomer);

      const result = await service.submit('cust-001', { version: 1 }, creatorActor);

      expect(result.status).toBe('submitted');
      expect(repo.update).toHaveBeenCalledWith(
        'cust-001',
        'tenant-001',
        { status: 'submitted' },
        1
      );
    });

    it('should reject submit from approved status', async () => {
      const approvedCustomer = createMockCustomer({ status: 'approved' });
      vi.mocked(repo.getById).mockResolvedValue(approvedCustomer);

      await expect(
        service.submit('cust-001', { version: 1 }, creatorActor)
      ).rejects.toThrow(CustomerCellError);

      try {
        await service.submit('cust-001', { version: 1 }, creatorActor);
      } catch (error) {
        expect((error as CustomerCellError).code).toBe('INVALID_STATE_TRANSITION');
      }
    });
  });

  // ---------------------------------------------------------------------------
  // State Machine: Approve (with SoD)
  // ---------------------------------------------------------------------------

  describe('approve', () => {
    it('should approve submitted customer', async () => {
      const submittedCustomer = createMockCustomer({ status: 'submitted' });
      const approvedCustomer = createMockCustomer({
        status: 'approved',
        approvedBy: 'user-approver',
        approvedAt: new Date(),
        version: 2,
      });

      vi.mocked(repo.getById).mockResolvedValue(submittedCustomer);
      vi.mocked(repo.update).mockResolvedValue(approvedCustomer);

      const result = await service.approve(
        'cust-001',
        { version: 1, comments: 'Approved' },
        approverActor
      );

      expect(result.status).toBe('approved');
      expect(result.approvedBy).toBe('user-approver');
    });

    it('should enforce SoD: creator cannot approve', async () => {
      const submittedCustomer = createMockCustomer({
        status: 'submitted',
        createdBy: 'user-creator',
      });

      vi.mocked(repo.getById).mockResolvedValue(submittedCustomer);

      await expect(
        service.approve('cust-001', { version: 1 }, creatorActor)
      ).rejects.toThrow(CustomerCellError);

      try {
        await service.approve('cust-001', { version: 1 }, creatorActor);
      } catch (error) {
        expect((error as CustomerCellError).code).toBe('SOD_VIOLATION');
        expect((error as CustomerCellError).message).toContain('Segregation of Duties');
      }
    });

    it('should reject approve from draft status', async () => {
      const draftCustomer = createMockCustomer({ status: 'draft' });
      vi.mocked(repo.getById).mockResolvedValue(draftCustomer);

      await expect(
        service.approve('cust-001', { version: 1 }, approverActor)
      ).rejects.toThrow(CustomerCellError);

      try {
        await service.approve('cust-001', { version: 1 }, approverActor);
      } catch (error) {
        expect((error as CustomerCellError).code).toBe('INVALID_STATE_TRANSITION');
      }
    });
  });

  // ---------------------------------------------------------------------------
  // State Machine: Reject (with SoD)
  // ---------------------------------------------------------------------------

  describe('reject', () => {
    it('should reject submitted customer back to draft', async () => {
      const submittedCustomer = createMockCustomer({ status: 'submitted' });
      const draftCustomer = createMockCustomer({ status: 'draft', version: 2 });

      vi.mocked(repo.getById).mockResolvedValue(submittedCustomer);
      vi.mocked(repo.update).mockResolvedValue(draftCustomer);

      const result = await service.reject(
        'cust-001',
        { version: 1, reason: 'Incomplete information' },
        approverActor
      );

      expect(result.status).toBe('draft');
    });

    it('should enforce SoD: creator cannot reject', async () => {
      const submittedCustomer = createMockCustomer({
        status: 'submitted',
        createdBy: 'user-creator',
      });

      vi.mocked(repo.getById).mockResolvedValue(submittedCustomer);

      await expect(
        service.reject('cust-001', { version: 1, reason: 'Test' }, creatorActor)
      ).rejects.toThrow(CustomerCellError);

      try {
        await service.reject('cust-001', { version: 1, reason: 'Test' }, creatorActor);
      } catch (error) {
        expect((error as CustomerCellError).code).toBe('SOD_VIOLATION');
      }
    });
  });

  // ---------------------------------------------------------------------------
  // State Machine: Suspend (with SoD)
  // ---------------------------------------------------------------------------

  describe('suspend', () => {
    it('should suspend approved customer', async () => {
      const approvedCustomer = createMockCustomer({ status: 'approved' });
      const suspendedCustomer = createMockCustomer({ status: 'suspended', version: 2 });

      vi.mocked(repo.getById).mockResolvedValue(approvedCustomer);
      vi.mocked(repo.update).mockResolvedValue(suspendedCustomer);

      const result = await service.suspend(
        'cust-001',
        { version: 1, reason: 'Overdue payments' },
        approverActor
      );

      expect(result.status).toBe('suspended');
    });

    it('should enforce SoD: creator cannot suspend', async () => {
      const approvedCustomer = createMockCustomer({
        status: 'approved',
        createdBy: 'user-creator',
      });

      vi.mocked(repo.getById).mockResolvedValue(approvedCustomer);

      await expect(
        service.suspend('cust-001', { version: 1, reason: 'Test' }, creatorActor)
      ).rejects.toThrow(CustomerCellError);

      try {
        await service.suspend('cust-001', { version: 1, reason: 'Test' }, creatorActor);
      } catch (error) {
        expect((error as CustomerCellError).code).toBe('SOD_VIOLATION');
      }
    });
  });

  // ---------------------------------------------------------------------------
  // State Machine: Archive (Terminal State)
  // ---------------------------------------------------------------------------

  describe('archive', () => {
    it('should archive approved customer', async () => {
      const approvedCustomer = createMockCustomer({ status: 'approved' });
      const archivedCustomer = createMockCustomer({ status: 'archived', version: 2 });

      vi.mocked(repo.getById).mockResolvedValue(approvedCustomer);
      vi.mocked(repo.update).mockResolvedValue(archivedCustomer);

      const result = await service.archive('cust-001', { version: 1 }, approverActor);

      expect(result.status).toBe('archived');
    });

    it('should archive suspended customer', async () => {
      const suspendedCustomer = createMockCustomer({ status: 'suspended' });
      const archivedCustomer = createMockCustomer({ status: 'archived', version: 2 });

      vi.mocked(repo.getById).mockResolvedValue(suspendedCustomer);
      vi.mocked(repo.update).mockResolvedValue(archivedCustomer);

      const result = await service.archive('cust-001', { version: 1 }, approverActor);

      expect(result.status).toBe('archived');
    });

    it('should reject archive from draft status', async () => {
      const draftCustomer = createMockCustomer({ status: 'draft' });
      vi.mocked(repo.getById).mockResolvedValue(draftCustomer);

      await expect(
        service.archive('cust-001', { version: 1 }, approverActor)
      ).rejects.toThrow(CustomerCellError);

      try {
        await service.archive('cust-001', { version: 1 }, approverActor);
      } catch (error) {
        expect((error as CustomerCellError).code).toBe('INVALID_STATE_TRANSITION');
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Optimistic Locking
  // ---------------------------------------------------------------------------

  describe('optimistic locking', () => {
    it('should detect version conflict', async () => {
      const customer = createMockCustomer({ status: 'draft' });
      vi.mocked(repo.getById).mockResolvedValue(customer);
      vi.mocked(repo.update).mockResolvedValue(null); // Version mismatch

      await expect(
        service.update(
          'cust-001',
          { legalName: 'Updated Name', version: 0 },
          creatorActor
        )
      ).rejects.toThrow(CustomerCellError);

      try {
        await service.update(
          'cust-001',
          { legalName: 'Updated Name', version: 0 },
          creatorActor
        );
      } catch (error) {
        expect((error as CustomerCellError).code).toBe('VERSION_CONFLICT');
        expect((error as CustomerCellError).message).toContain('modified by another user');
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Update (Draft Only)
  // ---------------------------------------------------------------------------

  describe('update', () => {
    it('should update draft customer', async () => {
      const draftCustomer = createMockCustomer({ status: 'draft' });
      const updatedCustomer = createMockCustomer({
        status: 'draft',
        legalName: 'Updated Acme Corp',
        version: 2,
      });

      vi.mocked(repo.getById).mockResolvedValue(draftCustomer);
      vi.mocked(repo.existsByTaxId).mockResolvedValue(false);
      vi.mocked(repo.update).mockResolvedValue(updatedCustomer);

      const result = await service.update(
        'cust-001',
        { legalName: 'Updated Acme Corp', version: 1 },
        creatorActor
      );

      expect(result.legalName).toBe('Updated Acme Corp');
    });

    it('should reject update for approved customer', async () => {
      const approvedCustomer = createMockCustomer({ status: 'approved' });
      vi.mocked(repo.getById).mockResolvedValue(approvedCustomer);

      await expect(
        service.update(
          'cust-001',
          { legalName: 'Updated Name', version: 1 },
          creatorActor
        )
      ).rejects.toThrow(CustomerCellError);

      try {
        await service.update(
          'cust-001',
          { legalName: 'Updated Name', version: 1 },
          creatorActor
        );
      } catch (error) {
        expect((error as CustomerCellError).code).toBe('INVALID_STATE');
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Not Found
  // ---------------------------------------------------------------------------

  describe('getById', () => {
    it('should return null for non-existent customer', async () => {
      vi.mocked(repo.getById).mockResolvedValue(null);

      const result = await service.getById('non-existent', creatorActor);

      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Credit Limit Change
  // ---------------------------------------------------------------------------

  describe('requestCreditLimitChange', () => {
    it('should create credit limit change request', async () => {
      const customer = createMockCustomer({ status: 'approved' });
      const creditHistory = {
        id: 'history-001',
        customerId: 'cust-001',
        tenantId: 'tenant-001',
        oldCreditLimit: 50000,
        newCreditLimit: 100000,
        changeReason: 'Good payment history',
        changeRequestStatus: 'pending_approval' as const,
        changeRequestedBy: 'user-creator',
        changeRequestedAt: new Date(),
        changeApprovedBy: null,
        changeApprovedAt: null,
        createdBy: 'user-creator',
        createdAt: new Date(),
        version: 1,
        updatedAt: new Date(),
      };

      vi.mocked(repo.getById).mockResolvedValue(customer);
      vi.mocked(repo.getPendingCreditChangeRequest).mockResolvedValue(null);
      vi.mocked(repo.createCreditHistory).mockResolvedValue(creditHistory);

      const result = await service.requestCreditLimitChange(
        'cust-001',
        { newCreditLimit: 100000, reason: 'Good payment history', version: 1 },
        creatorActor
      );

      expect(result.changeRequestStatus).toBe('pending_approval');
      expect(result.newCreditLimit).toBe(100000);
    });

    it('should reject if pending request exists', async () => {
      const customer = createMockCustomer({ status: 'approved' });
      const pendingRequest = {
        id: 'history-001',
        customerId: 'cust-001',
        tenantId: 'tenant-001',
        oldCreditLimit: 50000,
        newCreditLimit: 75000,
        changeReason: 'Previous request',
        changeRequestStatus: 'pending_approval' as const,
        changeRequestedBy: 'user-other',
        changeRequestedAt: new Date(),
        changeApprovedBy: null,
        changeApprovedAt: null,
        createdBy: 'user-other',
        createdAt: new Date(),
        version: 1,
        updatedAt: new Date(),
      };

      vi.mocked(repo.getById).mockResolvedValue(customer);
      vi.mocked(repo.getPendingCreditChangeRequest).mockResolvedValue(pendingRequest);

      await expect(
        service.requestCreditLimitChange(
          'cust-001',
          { newCreditLimit: 100000, reason: 'New request', version: 1 },
          creatorActor
        )
      ).rejects.toThrow(CustomerCellError);

      try {
        await service.requestCreditLimitChange(
          'cust-001',
          { newCreditLimit: 100000, reason: 'New request', version: 1 },
          creatorActor
        );
      } catch (error) {
        expect((error as CustomerCellError).code).toBe('PENDING_CREDIT_CHANGE');
      }
    });
  });
});
