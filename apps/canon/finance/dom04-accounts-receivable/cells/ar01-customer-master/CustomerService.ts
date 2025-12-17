/**
 * AR-01 Customer Master - Customer Service
 * 
 * Domain service for customer management operations.
 * Implements business logic, state machine, and SoD enforcement.
 * 
 * @module AR-01
 */

import {
  Customer,
  CustomerAddress,
  CustomerContact,
  CustomerCreditHistory,
  CustomerRepositoryPort,
  CustomerFilter,
  CreateCustomerData,
  UpdateCustomerData,
  CreateAddressData,
  CreateContactData,
  CustomerStatus,
  RiskLevel,
} from '@aibos/kernel-core';
import { CustomerCellError } from './errors';

// =============================================================================
// Types
// =============================================================================

export interface ActorContext {
  tenantId: string;
  userId: string;
  permissions?: string[];
}

export interface SequencePort {
  nextSequence(tenantId: string, sequenceType: string): Promise<string>;
}

export interface AuditOutboxPort {
  writeEvent(
    tenantId: string,
    eventType: string,
    aggregateId: string,
    aggregateType: string,
    payload: Record<string, unknown>
  ): Promise<void>;
}

export interface PolicyPort {
  evaluate(
    tenantId: string,
    policyCode: string,
    context: Record<string, unknown>
  ): Promise<{ allowed: boolean; reason?: string }>;
}

// =============================================================================
// State Machine
// =============================================================================

const VALID_TRANSITIONS: Record<CustomerStatus, CustomerStatus[]> = {
  draft: ['submitted'],
  submitted: ['approved', 'draft'], // reject → draft
  approved: ['suspended', 'archived'],
  suspended: ['approved', 'archived'], // reactivate → approved
  archived: [], // Terminal state - no transitions allowed
};

function canTransition(from: CustomerStatus, to: CustomerStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// =============================================================================
// Service Implementation
// =============================================================================

export class CustomerService {
  constructor(
    private readonly customerRepo: CustomerRepositoryPort,
    private readonly sequencePort: SequencePort,
    private readonly auditPort: AuditOutboxPort,
    private readonly policyPort: PolicyPort
  ) {}

  // ---------------------------------------------------------------------------
  // Create Customer (draft)
  // ---------------------------------------------------------------------------

  async create(
    input: {
      legalName: string;
      displayName?: string;
      taxId?: string;
      registrationNumber?: string;
      country: string;
      currencyPreference?: string;
      customerCategory?: string;
      riskLevel?: RiskLevel;
      creditLimit?: number;
      defaultPaymentTerms?: number;
    },
    actor: ActorContext
  ): Promise<Customer> {
    // Check for duplicate tax ID
    if (input.taxId) {
      const exists = await this.customerRepo.existsByTaxId(
        input.taxId,
        actor.tenantId
      );
      if (exists) {
        throw new CustomerCellError(
          'DUPLICATE_TAX_ID',
          `Customer with tax ID ${input.taxId} already exists`,
          { taxId: input.taxId }
        );
      }
    }

    // Generate customer code
    const customerCode = await this.sequencePort.nextSequence(
      actor.tenantId,
      'CUSTOMER'
    );

    // Create customer
    const createData: CreateCustomerData = {
      tenantId: actor.tenantId,
      legalName: input.legalName,
      displayName: input.displayName,
      taxId: input.taxId,
      registrationNumber: input.registrationNumber,
      country: input.country,
      currencyPreference: input.currencyPreference ?? 'USD',
      customerCategory: input.customerCategory,
      riskLevel: input.riskLevel ?? 'LOW',
      creditLimit: input.creditLimit ?? 0,
      defaultPaymentTerms: input.defaultPaymentTerms ?? 30,
      createdBy: actor.userId,
    };

    const customer = await this.customerRepo.create(createData, customerCode);

    // Emit audit event
    await this.auditPort.writeEvent(
      actor.tenantId,
      'CUSTOMER_CREATED',
      customer.id,
      'Customer',
      {
        customerCode: customer.customerCode,
        legalName: customer.legalName,
        createdBy: actor.userId,
      }
    );

    return customer;
  }

  // ---------------------------------------------------------------------------
  // Get Customer
  // ---------------------------------------------------------------------------

  async getById(id: string, actor: ActorContext): Promise<Customer | null> {
    return this.customerRepo.getById(id, actor.tenantId);
  }

  async getByCode(
    customerCode: string,
    actor: ActorContext
  ): Promise<Customer | null> {
    return this.customerRepo.getByCode(customerCode, actor.tenantId);
  }

  // ---------------------------------------------------------------------------
  // List Customers
  // ---------------------------------------------------------------------------

  async list(
    filter: CustomerFilter,
    actor: ActorContext
  ): Promise<{ data: Customer[]; total: number }> {
    return this.customerRepo.list(actor.tenantId, filter);
  }

  // ---------------------------------------------------------------------------
  // Update Customer (draft only)
  // ---------------------------------------------------------------------------

  async update(
    id: string,
    input: {
      legalName?: string;
      displayName?: string;
      taxId?: string;
      registrationNumber?: string;
      country?: string;
      currencyPreference?: string;
      customerCategory?: string;
      riskLevel?: RiskLevel;
      creditLimit?: number;
      defaultPaymentTerms?: number;
      version: number;
    },
    actor: ActorContext
  ): Promise<Customer> {
    const customer = await this.getOrThrow(id, actor);

    // Can only update in draft status
    if (customer.status !== 'draft') {
      throw new CustomerCellError(
        'INVALID_STATE',
        `Cannot update customer in ${customer.status} status`,
        { customerId: id, currentStatus: customer.status }
      );
    }

    // Check for duplicate tax ID if changing
    if (input.taxId && input.taxId !== customer.taxId) {
      const exists = await this.customerRepo.existsByTaxId(
        input.taxId,
        actor.tenantId,
        id
      );
      if (exists) {
        throw new CustomerCellError(
          'DUPLICATE_TAX_ID',
          `Customer with tax ID ${input.taxId} already exists`,
          { taxId: input.taxId }
        );
      }
    }

    const updateData: UpdateCustomerData = {
      legalName: input.legalName,
      displayName: input.displayName,
      taxId: input.taxId,
      registrationNumber: input.registrationNumber,
      country: input.country,
      currencyPreference: input.currencyPreference,
      customerCategory: input.customerCategory,
      riskLevel: input.riskLevel,
      creditLimit: input.creditLimit,
      defaultPaymentTerms: input.defaultPaymentTerms,
    };

    const updated = await this.customerRepo.update(
      id,
      actor.tenantId,
      updateData,
      input.version
    );

    if (!updated) {
      throw new CustomerCellError(
        'VERSION_CONFLICT',
        'Customer was modified by another user. Please refresh and try again.',
        { customerId: id, expectedVersion: input.version }
      );
    }

    // Emit audit event
    await this.auditPort.writeEvent(
      actor.tenantId,
      'CUSTOMER_UPDATED',
      customer.id,
      'Customer',
      {
        customerCode: customer.customerCode,
        changes: updateData,
        updatedBy: actor.userId,
      }
    );

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Submit for Approval
  // ---------------------------------------------------------------------------

  async submit(
    id: string,
    input: { version: number },
    actor: ActorContext
  ): Promise<Customer> {
    const customer = await this.getOrThrow(id, actor);

    if (!canTransition(customer.status, 'submitted')) {
      throw new CustomerCellError(
        'INVALID_STATE_TRANSITION',
        `Cannot submit customer from ${customer.status} status`,
        { customerId: id, currentStatus: customer.status, targetStatus: 'submitted' }
      );
    }

    const updated = await this.customerRepo.update(
      id,
      actor.tenantId,
      { status: 'submitted' },
      input.version
    );

    if (!updated) {
      throw new CustomerCellError(
        'VERSION_CONFLICT',
        'Customer was modified by another user. Please refresh and try again.',
        { customerId: id, expectedVersion: input.version }
      );
    }

    await this.auditPort.writeEvent(
      actor.tenantId,
      'CUSTOMER_SUBMITTED',
      customer.id,
      'Customer',
      {
        customerCode: customer.customerCode,
        submittedBy: actor.userId,
      }
    );

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Approve Customer (SoD: approver ≠ creator)
  // ---------------------------------------------------------------------------

  async approve(
    id: string,
    input: { version: number; comments?: string },
    actor: ActorContext
  ): Promise<Customer> {
    const customer = await this.getOrThrow(id, actor);

    // Validate state transition
    if (!canTransition(customer.status, 'approved')) {
      throw new CustomerCellError(
        'INVALID_STATE_TRANSITION',
        `Cannot approve customer from ${customer.status} status`,
        { customerId: id, currentStatus: customer.status, targetStatus: 'approved' }
      );
    }

    // Enforce SoD: approver ≠ creator
    if (customer.createdBy === actor.userId) {
      throw new CustomerCellError(
        'SOD_VIOLATION',
        'Cannot approve your own customer (Segregation of Duties)',
        { customerId: id, createdBy: customer.createdBy, approverId: actor.userId }
      );
    }

    const updated = await this.customerRepo.update(
      id,
      actor.tenantId,
      {
        status: 'approved',
        approvedBy: actor.userId,
        approvedAt: new Date(),
      },
      input.version
    );

    if (!updated) {
      throw new CustomerCellError(
        'VERSION_CONFLICT',
        'Customer was modified by another user. Please refresh and try again.',
        { customerId: id, expectedVersion: input.version }
      );
    }

    await this.auditPort.writeEvent(
      actor.tenantId,
      'CUSTOMER_APPROVED',
      customer.id,
      'Customer',
      {
        customerCode: customer.customerCode,
        approvedBy: actor.userId,
        comments: input.comments,
      }
    );

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Reject Customer (SoD: rejector ≠ creator)
  // ---------------------------------------------------------------------------

  async reject(
    id: string,
    input: { version: number; reason: string },
    actor: ActorContext
  ): Promise<Customer> {
    const customer = await this.getOrThrow(id, actor);

    if (customer.status !== 'submitted') {
      throw new CustomerCellError(
        'INVALID_STATE_TRANSITION',
        `Cannot reject customer from ${customer.status} status`,
        { customerId: id, currentStatus: customer.status, targetStatus: 'draft' }
      );
    }

    // Enforce SoD: rejector ≠ creator
    if (customer.createdBy === actor.userId) {
      throw new CustomerCellError(
        'SOD_VIOLATION',
        'Cannot reject your own customer (Segregation of Duties)',
        { customerId: id, createdBy: customer.createdBy, rejectorId: actor.userId }
      );
    }

    const updated = await this.customerRepo.update(
      id,
      actor.tenantId,
      { status: 'draft' },
      input.version
    );

    if (!updated) {
      throw new CustomerCellError(
        'VERSION_CONFLICT',
        'Customer was modified by another user. Please refresh and try again.',
        { customerId: id, expectedVersion: input.version }
      );
    }

    await this.auditPort.writeEvent(
      actor.tenantId,
      'CUSTOMER_REJECTED',
      customer.id,
      'Customer',
      {
        customerCode: customer.customerCode,
        rejectedBy: actor.userId,
        reason: input.reason,
      }
    );

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Suspend Customer (SoD: suspender ≠ creator)
  // ---------------------------------------------------------------------------

  async suspend(
    id: string,
    input: { version: number; reason: string },
    actor: ActorContext
  ): Promise<Customer> {
    const customer = await this.getOrThrow(id, actor);

    if (!canTransition(customer.status, 'suspended')) {
      throw new CustomerCellError(
        'INVALID_STATE_TRANSITION',
        `Cannot suspend customer from ${customer.status} status`,
        { customerId: id, currentStatus: customer.status, targetStatus: 'suspended' }
      );
    }

    // Enforce SoD: suspender ≠ creator
    if (customer.createdBy === actor.userId) {
      throw new CustomerCellError(
        'SOD_VIOLATION',
        'Cannot suspend your own customer (Segregation of Duties)',
        { customerId: id, createdBy: customer.createdBy, suspenderId: actor.userId }
      );
    }

    const updated = await this.customerRepo.update(
      id,
      actor.tenantId,
      { status: 'suspended' },
      input.version
    );

    if (!updated) {
      throw new CustomerCellError(
        'VERSION_CONFLICT',
        'Customer was modified by another user. Please refresh and try again.',
        { customerId: id, expectedVersion: input.version }
      );
    }

    await this.auditPort.writeEvent(
      actor.tenantId,
      'CUSTOMER_SUSPENDED',
      customer.id,
      'Customer',
      {
        customerCode: customer.customerCode,
        suspendedBy: actor.userId,
        reason: input.reason,
      }
    );

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Reactivate Customer (SoD: reactivator ≠ creator)
  // ---------------------------------------------------------------------------

  async reactivate(
    id: string,
    input: { version: number },
    actor: ActorContext
  ): Promise<Customer> {
    const customer = await this.getOrThrow(id, actor);

    if (customer.status !== 'suspended') {
      throw new CustomerCellError(
        'INVALID_STATE_TRANSITION',
        `Cannot reactivate customer from ${customer.status} status`,
        { customerId: id, currentStatus: customer.status, targetStatus: 'approved' }
      );
    }

    // Enforce SoD: reactivator ≠ creator
    if (customer.createdBy === actor.userId) {
      throw new CustomerCellError(
        'SOD_VIOLATION',
        'Cannot reactivate your own customer (Segregation of Duties)',
        { customerId: id, createdBy: customer.createdBy, reactivatorId: actor.userId }
      );
    }

    const updated = await this.customerRepo.update(
      id,
      actor.tenantId,
      { status: 'approved' },
      input.version
    );

    if (!updated) {
      throw new CustomerCellError(
        'VERSION_CONFLICT',
        'Customer was modified by another user. Please refresh and try again.',
        { customerId: id, expectedVersion: input.version }
      );
    }

    await this.auditPort.writeEvent(
      actor.tenantId,
      'CUSTOMER_REACTIVATED',
      customer.id,
      'Customer',
      {
        customerCode: customer.customerCode,
        reactivatedBy: actor.userId,
      }
    );

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Archive Customer (SoD: archiver ≠ creator)
  // ---------------------------------------------------------------------------

  async archive(
    id: string,
    input: { version: number },
    actor: ActorContext
  ): Promise<Customer> {
    const customer = await this.getOrThrow(id, actor);

    if (!canTransition(customer.status, 'archived')) {
      throw new CustomerCellError(
        'INVALID_STATE_TRANSITION',
        `Cannot archive customer from ${customer.status} status`,
        { customerId: id, currentStatus: customer.status, targetStatus: 'archived' }
      );
    }

    // Enforce SoD: archiver ≠ creator
    if (customer.createdBy === actor.userId) {
      throw new CustomerCellError(
        'SOD_VIOLATION',
        'Cannot archive your own customer (Segregation of Duties)',
        { customerId: id, createdBy: customer.createdBy, archiverId: actor.userId }
      );
    }

    const updated = await this.customerRepo.update(
      id,
      actor.tenantId,
      { status: 'archived' },
      input.version
    );

    if (!updated) {
      throw new CustomerCellError(
        'VERSION_CONFLICT',
        'Customer was modified by another user. Please refresh and try again.',
        { customerId: id, expectedVersion: input.version }
      );
    }

    await this.auditPort.writeEvent(
      actor.tenantId,
      'CUSTOMER_ARCHIVED',
      customer.id,
      'Customer',
      {
        customerCode: customer.customerCode,
        archivedBy: actor.userId,
      }
    );

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Credit Limit Change Request
  // ---------------------------------------------------------------------------

  async requestCreditLimitChange(
    id: string,
    input: { newCreditLimit: number; reason: string; version: number },
    actor: ActorContext
  ): Promise<CustomerCreditHistory> {
    const customer = await this.getOrThrow(id, actor);

    // Check for pending request
    const pending = await this.customerRepo.getPendingCreditChangeRequest(
      id,
      actor.tenantId
    );
    if (pending) {
      throw new CustomerCellError(
        'PENDING_CREDIT_CHANGE',
        'A credit limit change request is already pending',
        { customerId: id, pendingRequestId: pending.id }
      );
    }

    const history = await this.customerRepo.createCreditHistory({
      customerId: id,
      tenantId: actor.tenantId,
      oldCreditLimit: customer.creditLimit,
      newCreditLimit: input.newCreditLimit,
      changeReason: input.reason,
      changeRequestStatus: 'pending_approval',
      changeRequestedBy: actor.userId,
      createdBy: actor.userId,
    });

    await this.auditPort.writeEvent(
      actor.tenantId,
      'CREDIT_LIMIT_CHANGE_REQUESTED',
      customer.id,
      'Customer',
      {
        customerCode: customer.customerCode,
        oldLimit: customer.creditLimit,
        newLimit: input.newCreditLimit,
        reason: input.reason,
        requestedBy: actor.userId,
      }
    );

    return history;
  }

  // ---------------------------------------------------------------------------
  // Approve Credit Limit Change (SoD: approver ≠ requester)
  // ---------------------------------------------------------------------------

  async approveCreditLimitChange(
    customerId: string,
    input: { changeRequestId: string; version: number; comments?: string },
    actor: ActorContext
  ): Promise<Customer> {
    const customer = await this.getOrThrow(customerId, actor);

    const pending = await this.customerRepo.getPendingCreditChangeRequest(
      customerId,
      actor.tenantId
    );

    if (!pending || pending.id !== input.changeRequestId) {
      throw new CustomerCellError(
        'CREDIT_CHANGE_NOT_FOUND',
        'Credit limit change request not found or already processed',
        { customerId, changeRequestId: input.changeRequestId }
      );
    }

    // Enforce SoD: approver ≠ requester
    if (pending.changeRequestedBy === actor.userId) {
      throw new CustomerCellError(
        'SOD_VIOLATION',
        'Cannot approve your own credit limit change request (Segregation of Duties)',
        { customerId, requestedBy: pending.changeRequestedBy, approverId: actor.userId }
      );
    }

    // Approve the credit history entry
    await this.customerRepo.approveCreditChangeRequest(
      pending.id,
      actor.tenantId,
      actor.userId,
      pending.version
    );

    // Update the customer credit limit
    const updated = await this.customerRepo.update(
      customerId,
      actor.tenantId,
      { creditLimit: pending.newCreditLimit },
      input.version
    );

    if (!updated) {
      throw new CustomerCellError(
        'VERSION_CONFLICT',
        'Customer was modified by another user. Please refresh and try again.',
        { customerId, expectedVersion: input.version }
      );
    }

    await this.auditPort.writeEvent(
      actor.tenantId,
      'CREDIT_LIMIT_CHANGE_APPROVED',
      customer.id,
      'Customer',
      {
        customerCode: customer.customerCode,
        oldLimit: pending.oldCreditLimit,
        newLimit: pending.newCreditLimit,
        approvedBy: actor.userId,
        comments: input.comments,
      }
    );

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Addresses
  // ---------------------------------------------------------------------------

  async addAddress(
    customerId: string,
    input: CreateAddressData,
    actor: ActorContext
  ): Promise<CustomerAddress> {
    await this.getOrThrow(customerId, actor);
    
    const address = await this.customerRepo.createAddress({
      ...input,
      customerId,
      tenantId: actor.tenantId,
    });

    await this.auditPort.writeEvent(
      actor.tenantId,
      'CUSTOMER_ADDRESS_ADDED',
      customerId,
      'Customer',
      {
        addressId: address.id,
        addressType: input.addressType,
        addedBy: actor.userId,
      }
    );

    return address;
  }

  async getAddresses(
    customerId: string,
    actor: ActorContext
  ): Promise<CustomerAddress[]> {
    await this.getOrThrow(customerId, actor);
    return this.customerRepo.getAddresses(customerId, actor.tenantId);
  }

  // ---------------------------------------------------------------------------
  // Contacts
  // ---------------------------------------------------------------------------

  async addContact(
    customerId: string,
    input: CreateContactData,
    actor: ActorContext
  ): Promise<CustomerContact> {
    await this.getOrThrow(customerId, actor);
    
    const contact = await this.customerRepo.createContact({
      ...input,
      customerId,
      tenantId: actor.tenantId,
    });

    await this.auditPort.writeEvent(
      actor.tenantId,
      'CUSTOMER_CONTACT_ADDED',
      customerId,
      'Customer',
      {
        contactId: contact.id,
        contactType: input.contactType,
        addedBy: actor.userId,
      }
    );

    return contact;
  }

  async getContacts(
    customerId: string,
    actor: ActorContext
  ): Promise<CustomerContact[]> {
    await this.getOrThrow(customerId, actor);
    return this.customerRepo.getContacts(customerId, actor.tenantId);
  }

  // ---------------------------------------------------------------------------
  // Credit History
  // ---------------------------------------------------------------------------

  async getCreditHistory(
    customerId: string,
    actor: ActorContext
  ): Promise<CustomerCreditHistory[]> {
    await this.getOrThrow(customerId, actor);
    return this.customerRepo.getCreditHistory(customerId, actor.tenantId);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private async getOrThrow(id: string, actor: ActorContext): Promise<Customer> {
    const customer = await this.customerRepo.getById(id, actor.tenantId);
    if (!customer) {
      throw new CustomerCellError(
        'CUSTOMER_NOT_FOUND',
        `Customer not found: ${id}`,
        { customerId: id }
      );
    }
    return customer;
  }
}
