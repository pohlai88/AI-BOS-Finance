/**
 * GL-01 Chart of Accounts - Account Service
 * 
 * Domain service for chart of accounts operations.
 * Implements business logic, state machine, and SoD enforcement.
 * 
 * @module GL-01
 */

import {
  Account,
  AccountType,
  AccountStatus,
  AccountValidationResult,
  AccountSearchFilters,
  COAPort,
} from '@aibos/kernel-core';
import { AccountCellError, AccountErrorCode } from './errors';

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
// Repository Port
// =============================================================================

export interface CreateAccountData {
  tenantId: string;
  companyId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  normalBalance: 'DEBIT' | 'CREDIT';
  parentAccountId?: string;
  isPostable: boolean;
  currency?: string;
  description?: string;
  effectiveDate: Date;
  createdBy: string;
}

export interface UpdateAccountData {
  accountName?: string;
  description?: string;
  parentAccountId?: string;
  isPostable?: boolean;
  currency?: string;
  effectiveDate?: Date;
  updatedBy: string;
}

export interface AccountRepositoryPort {
  create(data: CreateAccountData, accountCode: string): Promise<Account>;
  getById(id: string, tenantId: string): Promise<Account | null>;
  getByCode(code: string, tenantId: string, companyId: string): Promise<Account | null>;
  list(tenantId: string, filter: AccountSearchFilters): Promise<{ data: Account[]; total: number }>;
  getHierarchy(tenantId: string, companyId: string, rootAccountId?: string): Promise<Account[]>;
  update(id: string, tenantId: string, data: UpdateAccountData, version: number): Promise<Account>;
  updateStatus(id: string, tenantId: string, status: AccountStatus, workflowData: Partial<Account>, version: number): Promise<Account>;
  existsByCode(code: string, tenantId: string, companyId: string): Promise<boolean>;
  hasChildren(accountId: string, tenantId: string): Promise<boolean>;
  getChildCount(accountId: string, tenantId: string): Promise<number>;
  getAccountBalance(accountCode: string, tenantId: string, companyId: string, asOfDate: Date): Promise<{ debit: string; credit: string; net: string }>;
}

// =============================================================================
// State Machine
// =============================================================================

const VALID_TRANSITIONS: Record<AccountStatus, AccountStatus[]> = {
  draft: ['pending_approval', 'cancelled'],
  pending_approval: ['active', 'rejected'],
  active: ['inactive'],
  rejected: ['draft'],
  inactive: ['active'],  // Reactivation
  cancelled: [],
};

function canTransition(from: AccountStatus, to: AccountStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// =============================================================================
// Service Implementation
// =============================================================================

export class AccountService {
  constructor(
    private readonly accountRepo: AccountRepositoryPort,
    private readonly sequencePort: SequencePort,
    private readonly auditPort: AuditOutboxPort,
    private readonly policyPort: PolicyPort
  ) {}

  // ---------------------------------------------------------------------------
  // Create Account (draft)
  // ---------------------------------------------------------------------------

  async create(
    input: {
      companyId: string;
      accountCode?: string;
      accountName: string;
      accountType: AccountType;
      normalBalance: 'DEBIT' | 'CREDIT';
      parentAccountId?: string;
      isPostable: boolean;
      currency?: string;
      description?: string;
      effectiveDate: Date;
    },
    actor: ActorContext
  ): Promise<Account> {
    // Validate account code format (if provided)
    const accountCode = input.accountCode || await this.sequencePort.nextSequence(
      actor.tenantId,
      'ACCOUNT'
    );

    if (!this.isValidAccountCodeFormat(accountCode)) {
      throw new AccountCellError(
        AccountErrorCode.INVALID_ACCOUNT_CODE,
        `Invalid account code format: ${accountCode}`,
        { accountCode }
      );
    }

    // Check for duplicate
    const exists = await this.accountRepo.existsByCode(
      accountCode,
      actor.tenantId,
      input.companyId
    );
    if (exists) {
      throw new AccountCellError(
        AccountErrorCode.DUPLICATE_ACCOUNT_CODE,
        `Account code ${accountCode} already exists`,
        { accountCode, companyId: input.companyId }
      );
    }

    // Validate parent if provided
    if (input.parentAccountId) {
      const parent = await this.accountRepo.getById(input.parentAccountId, actor.tenantId);
      if (!parent) {
        throw new AccountCellError(
          AccountErrorCode.PARENT_NOT_FOUND,
          `Parent account not found: ${input.parentAccountId}`,
          { parentAccountId: input.parentAccountId }
        );
      }
      if (parent.isPostable) {
        throw new AccountCellError(
          AccountErrorCode.PARENT_IS_POSTABLE,
          `Cannot add child to postable account: ${parent.accountCode}`,
          { parentAccountCode: parent.accountCode }
        );
      }
    }

    // Create account
    const createData: CreateAccountData = {
      tenantId: actor.tenantId,
      companyId: input.companyId,
      accountCode,
      accountName: input.accountName,
      accountType: input.accountType,
      normalBalance: input.normalBalance,
      parentAccountId: input.parentAccountId,
      isPostable: input.isPostable,
      currency: input.currency,
      description: input.description,
      effectiveDate: input.effectiveDate,
      createdBy: actor.userId,
    };

    const account = await this.accountRepo.create(createData, accountCode);

    // Emit audit event
    await this.auditPort.writeEvent(
      actor.tenantId,
      'ACCOUNT_CREATED',
      account.id,
      'Account',
      {
        accountCode: account.accountCode,
        accountName: account.accountName,
        accountType: account.accountType,
        createdBy: actor.userId,
      }
    );

    return account;
  }

  // ---------------------------------------------------------------------------
  // Get Account
  // ---------------------------------------------------------------------------

  async getById(id: string, actor: ActorContext): Promise<Account | null> {
    return this.accountRepo.getById(id, actor.tenantId);
  }

  async getByCode(
    accountCode: string,
    companyId: string,
    actor: ActorContext
  ): Promise<Account | null> {
    return this.accountRepo.getByCode(accountCode, actor.tenantId, companyId);
  }

  // ---------------------------------------------------------------------------
  // List Accounts
  // ---------------------------------------------------------------------------

  async list(
    filter: AccountSearchFilters,
    actor: ActorContext
  ): Promise<{ data: Account[]; total: number }> {
    return this.accountRepo.list(actor.tenantId, filter);
  }

  // ---------------------------------------------------------------------------
  // Get Hierarchy
  // ---------------------------------------------------------------------------

  async getHierarchy(
    companyId: string,
    rootAccountId: string | undefined,
    actor: ActorContext
  ): Promise<Account[]> {
    return this.accountRepo.getHierarchy(actor.tenantId, companyId, rootAccountId);
  }

  // ---------------------------------------------------------------------------
  // Submit for Approval
  // ---------------------------------------------------------------------------

  async submitForApproval(
    id: string,
    actor: ActorContext
  ): Promise<Account> {
    const account = await this.accountRepo.getById(id, actor.tenantId);
    if (!account) {
      throw new AccountCellError(
        AccountErrorCode.ACCOUNT_NOT_FOUND,
        `Account not found: ${id}`,
        { accountId: id }
      );
    }

    if (!canTransition(account.status, 'pending_approval')) {
      throw new AccountCellError(
        AccountErrorCode.INVALID_STATE_TRANSITION,
        `Cannot submit account in ${account.status} status`,
        { accountId: id, currentStatus: account.status, targetStatus: 'pending_approval' }
      );
    }

    const updated = await this.accountRepo.updateStatus(
      id,
      actor.tenantId,
      'pending_approval',
      { updatedBy: actor.userId, updatedAt: new Date() },
      account.version
    );

    await this.auditPort.writeEvent(
      actor.tenantId,
      'ACCOUNT_SUBMITTED',
      account.id,
      'Account',
      { accountCode: account.accountCode, submittedBy: actor.userId }
    );

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Approve Account (SoD enforced)
  // ---------------------------------------------------------------------------

  async approve(
    id: string,
    actor: ActorContext
  ): Promise<Account> {
    const account = await this.accountRepo.getById(id, actor.tenantId);
    if (!account) {
      throw new AccountCellError(
        AccountErrorCode.ACCOUNT_NOT_FOUND,
        `Account not found: ${id}`,
        { accountId: id }
      );
    }

    if (account.status !== 'pending_approval') {
      throw new AccountCellError(
        AccountErrorCode.NOT_PENDING_APPROVAL,
        `Account ${id} is not pending approval (status: ${account.status})`,
        { accountId: id, currentStatus: account.status }
      );
    }

    // SoD: Approver ≠ Creator
    if (account.createdBy === actor.userId) {
      throw new AccountCellError(
        AccountErrorCode.SOD_VIOLATION,
        'Cannot approve your own account (Segregation of Duties)',
        { accountId: id, createdBy: account.createdBy, actorId: actor.userId }
      );
    }

    const updated = await this.accountRepo.updateStatus(
      id,
      actor.tenantId,
      'active',
      {
        approvedBy: actor.userId,
        approvedAt: new Date(),
        updatedBy: actor.userId,
        updatedAt: new Date(),
      },
      account.version
    );

    await this.auditPort.writeEvent(
      actor.tenantId,
      'ACCOUNT_APPROVED',
      account.id,
      'Account',
      { accountCode: account.accountCode, approvedBy: actor.userId }
    );

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Reject Account
  // ---------------------------------------------------------------------------

  async reject(
    id: string,
    reason: string,
    actor: ActorContext
  ): Promise<Account> {
    const account = await this.accountRepo.getById(id, actor.tenantId);
    if (!account) {
      throw new AccountCellError(
        AccountErrorCode.ACCOUNT_NOT_FOUND,
        `Account not found: ${id}`,
        { accountId: id }
      );
    }

    if (account.status !== 'pending_approval') {
      throw new AccountCellError(
        AccountErrorCode.NOT_PENDING_APPROVAL,
        `Account ${id} is not pending approval`,
        { accountId: id, currentStatus: account.status }
      );
    }

    const updated = await this.accountRepo.updateStatus(
      id,
      actor.tenantId,
      'rejected',
      {
        rejectedBy: actor.userId,
        rejectedAt: new Date(),
        rejectionReason: reason,
        updatedBy: actor.userId,
        updatedAt: new Date(),
      },
      account.version
    );

    await this.auditPort.writeEvent(
      actor.tenantId,
      'ACCOUNT_REJECTED',
      account.id,
      'Account',
      { accountCode: account.accountCode, rejectedBy: actor.userId, reason }
    );

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Deactivate Account
  // ---------------------------------------------------------------------------

  async deactivate(
    id: string,
    replacementAccountId: string | undefined,
    actor: ActorContext
  ): Promise<Account> {
    const account = await this.accountRepo.getById(id, actor.tenantId);
    if (!account) {
      throw new AccountCellError(
        AccountErrorCode.ACCOUNT_NOT_FOUND,
        `Account not found: ${id}`,
        { accountId: id }
      );
    }

    if (account.status !== 'active') {
      throw new AccountCellError(
        AccountErrorCode.INVALID_STATUS,
        `Account ${id} is not active (status: ${account.status})`,
        { accountId: id, currentStatus: account.status }
      );
    }

    // Check for children
    const childCount = await this.accountRepo.getChildCount(id, actor.tenantId);
    if (childCount > 0) {
      throw new AccountCellError(
        AccountErrorCode.ACCOUNT_HAS_ACTIVE_CHILDREN,
        `Account has ${childCount} active children`,
        { accountId: id, childCount }
      );
    }

    // Check for open balance
    const balance = await this.accountRepo.getAccountBalance(
      account.accountCode,
      actor.tenantId,
      account.companyId,
      new Date()
    );
    if (parseFloat(balance.net) !== 0) {
      if (!replacementAccountId) {
        throw new AccountCellError(
          AccountErrorCode.REPLACEMENT_REQUIRED,
          `Replacement account required to deactivate account with balance: ${balance.net}`,
          { accountId: id, balance: balance.net }
        );
      }
    }

    const updated = await this.accountRepo.updateStatus(
      id,
      actor.tenantId,
      'inactive',
      { updatedBy: actor.userId, updatedAt: new Date() },
      account.version
    );

    await this.auditPort.writeEvent(
      actor.tenantId,
      'ACCOUNT_DEACTIVATED',
      account.id,
      'Account',
      { accountCode: account.accountCode, deactivatedBy: actor.userId, replacementAccountId }
    );

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Validate Account (for GL-02/GL-03)
  // ---------------------------------------------------------------------------

  async validateAccount(
    accountCode: string,
    companyId: string,
    actor: ActorContext
  ): Promise<AccountValidationResult> {
    const account = await this.accountRepo.getByCode(accountCode, actor.tenantId, companyId);

    if (!account) {
      return {
        isValid: false,
        errorCode: 'ACCOUNT_NOT_FOUND',
        errorMessage: `Account '${accountCode}' not found`,
      };
    }

    if (account.status !== 'active') {
      return {
        isValid: false,
        account,
        errorCode: 'ACCOUNT_INACTIVE',
        errorMessage: `Account '${accountCode}' is not active (status: ${account.status})`,
      };
    }

    if (!account.isPostable) {
      return {
        isValid: false,
        account,
        errorCode: 'ACCOUNT_NOT_POSTABLE',
        errorMessage: `Account '${accountCode}' is a summary account (not postable)`,
      };
    }

    return { isValid: true, account };
  }

  // ---------------------------------------------------------------------------
  // Utility Methods
  // ---------------------------------------------------------------------------

  private isValidAccountCodeFormat(code: string): boolean {
    // Format: NNNN-NN or NNNN-NN-NN or custom alphanumeric
    return /^[A-Z0-9]{2,10}(-[A-Z0-9]{2,10})*$/.test(code);
  }
}

// =============================================================================
// Factory Function
// =============================================================================

export function createAccountService(
  accountRepo: AccountRepositoryPort,
  sequencePort: SequencePort,
  auditPort: AuditOutboxPort,
  policyPort: PolicyPort
): AccountService {
  return new AccountService(accountRepo, sequencePort, auditPort, policyPort);
}
