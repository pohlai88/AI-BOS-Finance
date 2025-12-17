/**
 * AR-01 Customer Master - Customer Repository Port
 * 
 * Port interface for customer data persistence.
 * Follows hexagonal architecture pattern.
 * 
 * @module AR-01
 */

// =============================================================================
// Types
// =============================================================================

export type CustomerStatus = 'draft' | 'submitted' | 'approved' | 'suspended' | 'archived';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type PaymentHistoryFlag = 'GOOD' | 'WARNING' | 'POOR';
export type CollectionStatus = 'CURRENT' | 'OVERDUE' | 'COLLECTION';
export type AddressType = 'billing' | 'shipping' | 'both';
export type ContactType = 'billing' | 'accounts' | 'general' | 'executive';
export type CreditChangeStatus = 'pending_approval' | 'approved' | 'rejected';

/**
 * Customer entity
 */
export interface Customer {
  id: string;
  tenantId: string;
  customerCode: string;
  legalName: string;
  displayName?: string | null;
  taxId?: string | null;
  registrationNumber?: string | null;
  country: string;
  currencyPreference: string;
  customerCategory?: string | null;
  status: CustomerStatus;
  riskLevel: RiskLevel;
  creditLimit: number;
  currentBalance: number;
  availableCredit: number;
  defaultPaymentTerms: number;
  creditRiskScore?: number | null;
  paymentHistoryFlag?: PaymentHistoryFlag | null;
  collectionStatus?: CollectionStatus | null;
  lastBalanceUpdatedAt?: Date | null;
  lastReconciledAt?: Date | null;
  createdBy: string;
  createdAt: Date;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  version: number;
  updatedAt: Date;
}

/**
 * Customer address entity
 */
export interface CustomerAddress {
  id: string;
  customerId: string;
  tenantId: string;
  addressType: AddressType;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  stateProvince?: string | null;
  postalCode?: string | null;
  country: string;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

/**
 * Customer contact entity
 */
export interface CustomerContact {
  id: string;
  customerId: string;
  tenantId: string;
  contactType: ContactType;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  title?: string | null;
  isPrimary: boolean;
  isActive: boolean;
  receivesInvoices: boolean;
  receivesStatements: boolean;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

/**
 * Customer credit history entity
 */
export interface CustomerCreditHistory {
  id: string;
  customerId: string;
  tenantId: string;
  oldCreditLimit?: number | null;
  newCreditLimit: number;
  changeReason: string;
  changeRequestStatus?: CreditChangeStatus | null;
  changeRequestedBy?: string | null;
  changeRequestedAt?: Date | null;
  changeApprovedBy?: string | null;
  changeApprovedAt?: Date | null;
  createdBy: string;
  createdAt: Date;
  version: number;
  updatedAt: Date;
}

/**
 * Create customer input
 */
export interface CreateCustomerData {
  tenantId: string;
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
  createdBy: string;
}

/**
 * Update customer input
 */
export interface UpdateCustomerData {
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
  status?: CustomerStatus;
  approvedBy?: string;
  approvedAt?: Date;
  creditRiskScore?: number;
  paymentHistoryFlag?: PaymentHistoryFlag;
  collectionStatus?: CollectionStatus;
  currentBalance?: number;
  lastBalanceUpdatedAt?: Date;
}

/**
 * Customer list filter
 */
export interface CustomerFilter {
  status?: CustomerStatus | CustomerStatus[];
  customerCategory?: string;
  riskLevel?: RiskLevel;
  collectionStatus?: CollectionStatus;
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Create address input
 */
export interface CreateAddressData {
  customerId: string;
  tenantId: string;
  addressType: AddressType;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateProvince?: string;
  postalCode?: string;
  country: string;
  isPrimary?: boolean;
}

/**
 * Create contact input
 */
export interface CreateContactData {
  customerId: string;
  tenantId: string;
  contactType: ContactType;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  title?: string;
  isPrimary?: boolean;
  receivesInvoices?: boolean;
  receivesStatements?: boolean;
}

/**
 * Create credit history input
 */
export interface CreateCreditHistoryData {
  customerId: string;
  tenantId: string;
  oldCreditLimit?: number;
  newCreditLimit: number;
  changeReason: string;
  changeRequestStatus?: CreditChangeStatus;
  changeRequestedBy?: string;
  createdBy: string;
}

/**
 * Transaction context for transactional operations
 */
export interface TransactionContext {
  client?: unknown;
}

// =============================================================================
// Port Interface
// =============================================================================

/**
 * Customer Repository Port
 * 
 * Port interface for customer data persistence operations.
 */
export interface CustomerRepositoryPort {
  // -------------------------------------------------------------------------
  // Customer CRUD
  // -------------------------------------------------------------------------
  
  /**
   * Create a new customer
   */
  create(
    data: CreateCustomerData,
    customerCode: string,
    ctx?: TransactionContext
  ): Promise<Customer>;
  
  /**
   * Get customer by ID
   */
  getById(
    id: string,
    tenantId: string,
    ctx?: TransactionContext
  ): Promise<Customer | null>;
  
  /**
   * Get customer by code
   */
  getByCode(
    customerCode: string,
    tenantId: string,
    ctx?: TransactionContext
  ): Promise<Customer | null>;
  
  /**
   * Update customer
   * Returns null if version mismatch (optimistic locking)
   */
  update(
    id: string,
    tenantId: string,
    data: UpdateCustomerData,
    expectedVersion: number,
    ctx?: TransactionContext
  ): Promise<Customer | null>;
  
  /**
   * List customers with filtering
   */
  list(
    tenantId: string,
    filter: CustomerFilter,
    ctx?: TransactionContext
  ): Promise<{ data: Customer[]; total: number }>;
  
  /**
   * Check if tax ID exists (for duplicate detection)
   */
  existsByTaxId(
    taxId: string,
    tenantId: string,
    excludeId?: string,
    ctx?: TransactionContext
  ): Promise<boolean>;
  
  // -------------------------------------------------------------------------
  // Addresses
  // -------------------------------------------------------------------------
  
  /**
   * Create customer address
   */
  createAddress(
    data: CreateAddressData,
    ctx?: TransactionContext
  ): Promise<CustomerAddress>;
  
  /**
   * Get addresses for customer
   */
  getAddresses(
    customerId: string,
    tenantId: string,
    ctx?: TransactionContext
  ): Promise<CustomerAddress[]>;
  
  /**
   * Update address
   */
  updateAddress(
    id: string,
    tenantId: string,
    data: Partial<CreateAddressData>,
    expectedVersion: number,
    ctx?: TransactionContext
  ): Promise<CustomerAddress | null>;
  
  /**
   * Delete address
   */
  deleteAddress(
    id: string,
    tenantId: string,
    ctx?: TransactionContext
  ): Promise<boolean>;
  
  // -------------------------------------------------------------------------
  // Contacts
  // -------------------------------------------------------------------------
  
  /**
   * Create customer contact
   */
  createContact(
    data: CreateContactData,
    ctx?: TransactionContext
  ): Promise<CustomerContact>;
  
  /**
   * Get contacts for customer
   */
  getContacts(
    customerId: string,
    tenantId: string,
    ctx?: TransactionContext
  ): Promise<CustomerContact[]>;
  
  /**
   * Update contact
   */
  updateContact(
    id: string,
    tenantId: string,
    data: Partial<CreateContactData>,
    expectedVersion: number,
    ctx?: TransactionContext
  ): Promise<CustomerContact | null>;
  
  /**
   * Delete contact
   */
  deleteContact(
    id: string,
    tenantId: string,
    ctx?: TransactionContext
  ): Promise<boolean>;
  
  // -------------------------------------------------------------------------
  // Credit History
  // -------------------------------------------------------------------------
  
  /**
   * Create credit history entry
   */
  createCreditHistory(
    data: CreateCreditHistoryData,
    ctx?: TransactionContext
  ): Promise<CustomerCreditHistory>;
  
  /**
   * Get credit history for customer
   */
  getCreditHistory(
    customerId: string,
    tenantId: string,
    ctx?: TransactionContext
  ): Promise<CustomerCreditHistory[]>;
  
  /**
   * Get pending credit change request
   */
  getPendingCreditChangeRequest(
    customerId: string,
    tenantId: string,
    ctx?: TransactionContext
  ): Promise<CustomerCreditHistory | null>;
  
  /**
   * Approve credit change request
   */
  approveCreditChangeRequest(
    id: string,
    tenantId: string,
    approvedBy: string,
    expectedVersion: number,
    ctx?: TransactionContext
  ): Promise<CustomerCreditHistory | null>;
  
  /**
   * Reject credit change request
   */
  rejectCreditChangeRequest(
    id: string,
    tenantId: string,
    rejectedBy: string,
    expectedVersion: number,
    ctx?: TransactionContext
  ): Promise<CustomerCreditHistory | null>;
  
  // -------------------------------------------------------------------------
  // Transaction Support
  // -------------------------------------------------------------------------
  
  /**
   * Begin a transaction
   */
  beginTransaction(): Promise<TransactionContext>;
  
  /**
   * Commit a transaction
   */
  commitTransaction(ctx: TransactionContext): Promise<void>;
  
  /**
   * Rollback a transaction
   */
  rollbackTransaction(ctx: TransactionContext): Promise<void>;
}

// =============================================================================
// Factory
// =============================================================================

export function createCustomerRepositoryPort(
  adapter: CustomerRepositoryPort
): CustomerRepositoryPort {
  return adapter;
}
