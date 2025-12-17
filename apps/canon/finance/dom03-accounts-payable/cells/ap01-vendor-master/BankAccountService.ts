/**
 * Bank Account Service
 * 
 * AP-01 Vendor Master Cell - Bank account management with change control.
 * 
 * Responsibilities:
 * - Add bank accounts to vendors
 * - Request bank account changes
 * - Approve bank account changes (SoD enforcement)
 * - Detect duplicate bank accounts
 * - Emit transactional audit events
 */

import type {
  VendorRepositoryPort,
  VendorBankAccount,
  CreateBankAccountInput as RepoCreateInput,
  RequestBankAccountChangeInput as RepoRequestInput,
  ApproveBankAccountChangeInput as RepoApproveInput,
  TransactionContext,
  PolicyPort,
  AuditPort,
  AuditEvent,
} from '@aibos/kernel-core';
import type { ActorContext } from '@aibos/canon-governance';
import {
  VendorNotFoundError,
  BankAccountNotFoundError,
  ConcurrencyConflictError,
  SoDViolationError,
  DuplicateBankAccountError,
  InvalidBankAccountChangeRequestError,
  BankAccountChangeNotPendingError,
} from './errors';

// ============================================================================
// 1. TYPES
// ============================================================================

export interface CreateBankAccountInput {
  vendorId: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  routingNumber?: string;
  swiftCode?: string;
  iban?: string;
  currency: string;
  isPrimary?: boolean;
}

export interface RequestBankAccountChangeInput {
  bankAccountId: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  routingNumber?: string;
  swiftCode?: string;
  iban?: string;
  currency?: string;
}

export interface ApproveBankAccountChangeInput {
  bankAccountId: string;
}

// ============================================================================
// 2. VALIDATION
// ============================================================================

function validateCurrency(currency: string): void {
  if (currency.length !== 3) {
    throw new Error(`Invalid currency code: ${currency}. Must be ISO 4217 (3 letters)`);
  }
}

function validateAccountNumber(accountNumber: string): void {
  if (!accountNumber || accountNumber.trim().length < 4) {
    throw new Error('Account number must be at least 4 characters');
  }
}

// ============================================================================
// 3. SERVICE
// ============================================================================

/**
 * BankAccountService - Manages vendor bank accounts with change control
 */
export class BankAccountService {
  constructor(
    private vendorRepo: VendorRepositoryPort,
    private auditPort: AuditPort,
    private policyPort: PolicyPort
  ) { }

  /**
   * Add bank account to vendor
   * 
   * @param input - Bank account creation data
   * @param actor - Who is adding the account
   * @returns Created bank account
   */
  async addBankAccount(
    input: CreateBankAccountInput,
    actor: ActorContext
  ): Promise<VendorBankAccount> {
    // 1. Validate input
    validateCurrency(input.currency);
    validateAccountNumber(input.accountNumber);

    // 2. Verify vendor exists and is approved
    const vendor = await this.vendorRepo.findById(input.vendorId, actor.tenantId);
    if (!vendor) {
      throw new VendorNotFoundError(input.vendorId);
    }

    // 3. Begin transaction
    return this.vendorRepo.withTransaction(async (txContext) => {
      // 4. Check for duplicate bank account
      const duplicateVendorIds = await this.vendorRepo.detectDuplicateBankAccounts(
        input.accountNumber,
        input.routingNumber,
        actor.tenantId,
        input.vendorId
      );

      if (duplicateVendorIds.length > 0) {
        throw new DuplicateBankAccountError(input.accountNumber);
      }

      // 5. Create bank account
      const repoInput: RepoCreateInput = {
        vendorId: input.vendorId,
        tenantId: actor.tenantId,
        bankName: input.bankName,
        accountNumber: input.accountNumber,
        accountName: input.accountName,
        routingNumber: input.routingNumber,
        swiftCode: input.swiftCode,
        iban: input.iban,
        currency: input.currency,
        isPrimary: input.isPrimary || false,
        createdBy: actor.userId,
      };

      const bankAccount = await this.vendorRepo.addBankAccount(repoInput, txContext);

      // 6. Emit audit
      const auditEvent: AuditEvent = {
        eventType: 'finance.ap.vendor.bank_account.added',
        entityId: bankAccount.id,
        entityUrn: `urn:finance:vendor:${input.vendorId}`,
        actor: {
          userId: actor.userId,
          tenantId: actor.tenantId,
        },
        action: 'create',
        payload: {
          vendorId: input.vendorId,
          bankName: bankAccount.bankName,
          accountNumber: bankAccount.accountNumber,
        },
        correlationId: txContext.correlationId,
        timestamp: new Date(),
      };

      await this.auditPort.emitTransactional(auditEvent, txContext);

      return bankAccount;
    });
  }

  /**
   * Request bank account change
   * 
   * @param input - Change request data
   * @param actor - Who is requesting the change
   * @param expectedVersion - Expected version (optimistic locking)
   * @returns Updated bank account
   */
  async requestBankAccountChange(
    input: RequestBankAccountChangeInput,
    actor: ActorContext,
    expectedVersion: number
  ): Promise<VendorBankAccount> {
    return this.vendorRepo.withTransaction(async (txContext) => {
      // 1. Fetch bank account
      const bankAccount = await this.vendorRepo.findBankAccountByIdForUpdate(
        input.bankAccountId,
        actor.tenantId,
        txContext
      );

      if (!bankAccount) {
        throw new BankAccountNotFoundError(input.bankAccountId);
      }

      // 2. Version check
      if (bankAccount.version !== expectedVersion) {
        throw new ConcurrencyConflictError(expectedVersion, bankAccount.version);
      }

      // 3. Check if change is already pending
      if (bankAccount.changeRequestStatus === 'pending_approval') {
        throw new InvalidBankAccountChangeRequestError('Change request already pending approval');
      }

      // 4. Validate updates
      if (input.currency) validateCurrency(input.currency);
      if (input.accountNumber) validateAccountNumber(input.accountNumber);

      // 5. Check for duplicate if account number is changing
      if (input.accountNumber && input.accountNumber !== bankAccount.accountNumber) {
        const duplicateVendorIds = await this.vendorRepo.detectDuplicateBankAccounts(
          input.accountNumber,
          input.routingNumber || bankAccount.routingNumber,
          actor.tenantId,
          bankAccount.vendorId
        );

        if (duplicateVendorIds.length > 0) {
          throw new DuplicateBankAccountError(input.accountNumber);
        }
      }

      // 6. Request change
      const repoInput: RepoRequestInput = {
        bankAccountId: input.bankAccountId,
        tenantId: actor.tenantId,
        bankName: input.bankName,
        accountNumber: input.accountNumber,
        accountName: input.accountName,
        routingNumber: input.routingNumber,
        swiftCode: input.swiftCode,
        iban: input.iban,
        currency: input.currency,
        requestedBy: actor.userId,
      };

      const updated = await this.vendorRepo.requestBankAccountChange(repoInput, txContext);

      // 6. Emit audit
      const auditEvent: AuditEvent = {
        eventType: 'finance.ap.vendor.bank_account.change_requested',
        entityId: bankAccount.id,
        entityUrn: `urn:finance:vendor:${bankAccount.vendorId}`,
        actor: {
          userId: actor.userId,
          tenantId: actor.tenantId,
        },
        action: 'update',
        payload: {
          bankAccountId: bankAccount.id,
          changeRequestStatus: 'pending_approval',
        },
        correlationId: txContext.correlationId,
        timestamp: new Date(),
      };

      await this.auditPort.emitTransactional(auditEvent, txContext);

      return updated;
    });
  }

  /**
   * Approve bank account change
   * 
   * @param input - Approval data
   * @param actor - Who is approving
   * @param expectedVersion - Expected version (optimistic locking)
   * @returns Updated bank account
   */
  async approveBankAccountChange(
    input: ApproveBankAccountChangeInput,
    actor: ActorContext,
    expectedVersion: number
  ): Promise<VendorBankAccount> {
    return this.vendorRepo.withTransaction(async (txContext) => {
      // 1. Fetch bank account
      const bankAccount = await this.vendorRepo.findBankAccountByIdForUpdate(
        input.bankAccountId,
        actor.tenantId,
        txContext
      );

      if (!bankAccount) {
        throw new BankAccountNotFoundError(input.bankAccountId);
      }

      // 2. Version check
      if (bankAccount.version !== expectedVersion) {
        throw new ConcurrencyConflictError(expectedVersion, bankAccount.version);
      }

      // 3. Check if change is pending
      if (bankAccount.changeRequestStatus !== 'pending_approval') {
        throw new BankAccountChangeNotPendingError(bankAccount.changeRequestStatus);
      }

      // 4. SoD check (Requester cannot be Approver)
      if (bankAccount.changeRequestedBy === actor.userId) {
        throw new SoDViolationError(
          `Approver (${actor.userId}) cannot be the same as requester (${bankAccount.changeRequestedBy})`
        );
      }

      // 5. Approve change
      // Note: Permission checks are done in BFF layer, not in service
      const repoInput: RepoApproveInput = {
        bankAccountId: input.bankAccountId,
        tenantId: actor.tenantId,
        approvedBy: actor.userId,
        approvedAt: new Date(),
      };

      const updated = await this.vendorRepo.approveBankAccountChange(repoInput, txContext);

      // 6. Emit audit
      const auditEvent: AuditEvent = {
        eventType: 'finance.ap.vendor.bank_account.change_approved',
        entityId: bankAccount.id,
        entityUrn: `urn:finance:vendor:${bankAccount.vendorId}`,
        actor: {
          userId: actor.userId,
          tenantId: actor.tenantId,
        },
        action: 'approve',
        payload: {
          bankAccountId: bankAccount.id,
          changeRequestedBy: bankAccount.changeRequestedBy,
          changeApprovedBy: actor.userId,
        },
        correlationId: txContext.correlationId,
        timestamp: new Date(),
      };

      await this.auditPort.emitTransactional(auditEvent, txContext);

      return updated;
    });
  }

  /**
   * List bank accounts for a vendor
   * 
   * @param vendorId - Vendor ID
   * @param actor - Actor context
   * @returns Bank accounts
   */
  async listBankAccounts(
    vendorId: string,
    actor: ActorContext
  ): Promise<VendorBankAccount[]> {
    return this.vendorRepo.listBankAccounts(vendorId, actor.tenantId);
  }

  /**
   * Get bank account by ID
   * 
   * @param bankAccountId - Bank account ID
   * @param actor - Actor context
   * @returns Bank account or null
   */
  async getBankAccountById(
    bankAccountId: string,
    actor: ActorContext
  ): Promise<VendorBankAccount | null> {
    return this.vendorRepo.findBankAccountById(bankAccountId, actor.tenantId);
  }

  /**
   * Detect duplicate bank accounts
   * 
   * @param accountNumber - Account number
   * @param routingNumber - Routing number (optional)
   * @param actor - Actor context
   * @param excludeVendorId - Exclude this vendor from check
   * @returns Array of vendor IDs with duplicate accounts
   */
  async detectDuplicateBankAccounts(
    accountNumber: string,
    routingNumber: string | undefined,
    actor: ActorContext,
    excludeVendorId?: string
  ): Promise<string[]> {
    return this.vendorRepo.detectDuplicateBankAccounts(
      accountNumber,
      routingNumber,
      actor.tenantId,
      excludeVendorId
    );
  }
}
