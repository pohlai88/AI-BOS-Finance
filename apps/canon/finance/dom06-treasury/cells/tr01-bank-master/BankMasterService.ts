/**
 * TR-01 Bank Master - Service Implementation
 * 
 * Domain service for bank account master data management.
 * Implements lifecycle, verification, and SoD enforcement.
 * 
 * @module TR-01
 */

import type {
  BankAccount,
  BankAccountStatus,
  CreateBankAccountInput,
  UpdateBankAccountInput,
  BankAccountFilter,
  BankAccountRepositoryPort,
  AuditPort,
  ActorContext,
} from './types';
import { BankMasterError, BankMasterErrorCode } from './errors';

// =============================================================================
// State Machine
// =============================================================================

const VALID_TRANSITIONS: Record<BankAccountStatus, BankAccountStatus[]> = {
  draft: ['verification', 'cancelled'],
  verification: ['active', 'rejected'],
  active: ['suspended', 'inactive'],
  suspended: ['active', 'inactive'],
  rejected: ['draft'],
  inactive: [],    // Terminal
  cancelled: [],   // Terminal
};

function canTransition(from: BankAccountStatus, to: BankAccountStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// =============================================================================
// Validation Helpers
// =============================================================================

function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length <= 4) return '****';
  return '*'.repeat(accountNumber.length - 4) + accountNumber.slice(-4);
}

function validateIBAN(iban: string): boolean {
  // Basic IBAN format check (country code + check digits + BBAN)
  const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,30}$/;
  return ibanRegex.test(iban.replace(/\s/g, '').toUpperCase());
}

function validateSWIFT(swift: string): boolean {
  // SWIFT/BIC format: 8 or 11 alphanumeric characters
  const swiftRegex = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
  return swiftRegex.test(swift.toUpperCase());
}

function validateRoutingNumber(routing: string): boolean {
  // US ABA routing number: 9 digits
  const routingRegex = /^[0-9]{9}$/;
  return routingRegex.test(routing);
}

// =============================================================================
// Service Implementation
// =============================================================================

export interface BankMasterServiceDeps {
  repository: BankAccountRepositoryPort;
  audit: AuditPort;
}

export class BankMasterService {
  private readonly repository: BankAccountRepositoryPort;
  private readonly audit: AuditPort;

  constructor(deps: BankMasterServiceDeps) {
    this.repository = deps.repository;
    this.audit = deps.audit;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CREATE BANK ACCOUNT
  // ═══════════════════════════════════════════════════════════════════════════

  async create(
    input: CreateBankAccountInput,
    actor: ActorContext
  ): Promise<BankAccount> {
    // 1. Check for duplicate account number
    const existing = await this.repository.findByAccountNumber(
      input.accountNumber,
      actor.tenantId
    );
    if (existing) {
      throw BankMasterError.duplicateAccountNumber(input.accountNumber);
    }

    // 2. Validate international identifiers
    if (input.iban && !validateIBAN(input.iban)) {
      throw new BankMasterError(
        BankMasterErrorCode.INVALID_IBAN,
        `Invalid IBAN format: ${input.iban}`,
        { iban: input.iban }
      );
    }

    if (input.swiftCode && !validateSWIFT(input.swiftCode)) {
      throw new BankMasterError(
        BankMasterErrorCode.INVALID_SWIFT_CODE,
        `Invalid SWIFT code format: ${input.swiftCode}`,
        { swiftCode: input.swiftCode }
      );
    }

    if (input.routingNumber && !validateRoutingNumber(input.routingNumber)) {
      throw new BankMasterError(
        BankMasterErrorCode.INVALID_ROUTING_NUMBER,
        `Invalid routing number format: ${input.routingNumber}`,
        { routingNumber: input.routingNumber }
      );
    }

    // 3. TODO: Validate GL account is a cash account
    // const glAccount = await this.coaService.getByCode(input.glAccountCode);
    // if (!glAccount || glAccount.subType !== 'CASH') {
    //   throw BankMasterError.glAccountNotCash(input.glAccountCode);
    // }

    // 4. Create bank account
    const bankAccount = await this.repository.create({
      tenantId: actor.tenantId,
      companyId: input.companyId,
      bankName: input.bankName,
      branchName: input.branchName,
      bankAddress: input.bankAddress,
      bankCountry: input.bankCountry,
      accountNumber: input.accountNumber,
      accountNumberLast4: input.accountNumber.slice(-4),
      accountName: input.accountName,
      accountType: input.accountType,
      currency: input.currency,
      swiftCode: input.swiftCode?.toUpperCase(),
      iban: input.iban?.replace(/\s/g, '').toUpperCase(),
      routingNumber: input.routingNumber,
      sortCode: input.sortCode,
      glAccountCode: input.glAccountCode,
      status: 'draft',
      verificationType: input.verificationType,
      createdBy: actor.userId,
      updatedBy: actor.userId,
    });

    // 5. Audit event
    await this.audit.emit({
      eventType: 'treasury.bank_account.created',
      aggregateId: bankAccount.id,
      aggregateType: 'BankAccount',
      tenantId: actor.tenantId,
      userId: actor.userId,
      payload: {
        bankName: bankAccount.bankName,
        accountType: bankAccount.accountType,
        currency: bankAccount.currency,
        accountNumberLast4: bankAccount.accountNumberLast4,
      },
    });

    return bankAccount;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GET BANK ACCOUNT
  // ═══════════════════════════════════════════════════════════════════════════

  async getById(id: string, actor: ActorContext): Promise<BankAccount | null> {
    const account = await this.repository.findById(id, actor.tenantId);
    if (account) {
      // Mask account number for security
      return {
        ...account,
        accountNumber: maskAccountNumber(account.accountNumber),
      };
    }
    return null;
  }

  async list(
    filter: BankAccountFilter,
    limit: number,
    offset: number,
    actor: ActorContext
  ): Promise<{ data: BankAccount[]; total: number }> {
    const result = await this.repository.findByFilter(
      { ...filter, tenantId: actor.tenantId },
      limit,
      offset
    );

    // Mask account numbers
    return {
      data: result.data.map((a) => ({
        ...a,
        accountNumber: maskAccountNumber(a.accountNumber),
      })),
      total: result.total,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SUBMIT FOR VERIFICATION
  // ═══════════════════════════════════════════════════════════════════════════

  async submitForVerification(
    id: string,
    actor: ActorContext
  ): Promise<BankAccount> {
    const account = await this.repository.findById(id, actor.tenantId);
    if (!account) {
      throw BankMasterError.accountNotFound(id);
    }

    if (!canTransition(account.status, 'verification')) {
      throw BankMasterError.invalidStateTransition(account.status, 'verification');
    }

    const updated = await this.repository.updateStatus(
      id,
      actor.tenantId,
      'verification',
      { updatedBy: actor.userId },
      account.version
    );

    await this.audit.emit({
      eventType: 'treasury.bank_account.submitted_for_verification',
      aggregateId: id,
      aggregateType: 'BankAccount',
      tenantId: actor.tenantId,
      userId: actor.userId,
      payload: { verificationType: account.verificationType },
    });

    return updated;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VERIFY (Complete Verification)
  // ═══════════════════════════════════════════════════════════════════════════

  async verify(
    id: string,
    verificationData: { microDepositAmounts?: [number, number] },
    actor: ActorContext
  ): Promise<BankAccount> {
    const account = await this.repository.findById(id, actor.tenantId);
    if (!account) {
      throw BankMasterError.accountNotFound(id);
    }

    if (account.status !== 'verification') {
      throw new BankMasterError(
        BankMasterErrorCode.NOT_PENDING_VERIFICATION,
        `Account ${id} is not pending verification (status: ${account.status})`,
        { currentStatus: account.status }
      );
    }

    // SoD: Verifier ≠ Creator
    if (account.createdBy === actor.userId) {
      throw BankMasterError.sodViolation(account.createdBy, actor.userId);
    }

    // TODO: Implement actual verification logic based on verificationType
    // For micro_deposit: validate amounts match
    // For statement_upload: validate document was uploaded
    // For external_service: check external API response

    const updated = await this.repository.updateStatus(
      id,
      actor.tenantId,
      'active',
      {
        verifiedAt: new Date(),
        verifiedBy: actor.userId,
        approvedBy: actor.userId,
        approvedAt: new Date(),
        updatedBy: actor.userId,
      },
      account.version
    );

    await this.audit.emit({
      eventType: 'treasury.bank_account.verified',
      aggregateId: id,
      aggregateType: 'BankAccount',
      tenantId: actor.tenantId,
      userId: actor.userId,
      payload: { verificationType: account.verificationType },
    });

    return updated;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REJECT VERIFICATION
  // ═══════════════════════════════════════════════════════════════════════════

  async reject(
    id: string,
    reason: string,
    actor: ActorContext
  ): Promise<BankAccount> {
    const account = await this.repository.findById(id, actor.tenantId);
    if (!account) {
      throw BankMasterError.accountNotFound(id);
    }

    if (account.status !== 'verification') {
      throw new BankMasterError(
        BankMasterErrorCode.NOT_PENDING_VERIFICATION,
        `Account ${id} is not pending verification`,
        { currentStatus: account.status }
      );
    }

    const updated = await this.repository.updateStatus(
      id,
      actor.tenantId,
      'rejected',
      {
        rejectedAt: new Date(),
        rejectedBy: actor.userId,
        rejectionReason: reason,
        updatedBy: actor.userId,
      },
      account.version
    );

    await this.audit.emit({
      eventType: 'treasury.bank_account.rejected',
      aggregateId: id,
      aggregateType: 'BankAccount',
      tenantId: actor.tenantId,
      userId: actor.userId,
      payload: { reason },
    });

    return updated;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SUSPEND / REACTIVATE
  // ═══════════════════════════════════════════════════════════════════════════

  async suspend(
    id: string,
    reason: string,
    actor: ActorContext
  ): Promise<BankAccount> {
    const account = await this.repository.findById(id, actor.tenantId);
    if (!account) {
      throw BankMasterError.accountNotFound(id);
    }

    if (account.status !== 'active') {
      throw new BankMasterError(
        BankMasterErrorCode.ACCOUNT_NOT_ACTIVE,
        `Account ${id} is not active (status: ${account.status})`,
        { currentStatus: account.status }
      );
    }

    const updated = await this.repository.updateStatus(
      id,
      actor.tenantId,
      'suspended',
      {
        suspendedAt: new Date(),
        suspendedBy: actor.userId,
        suspensionReason: reason,
        updatedBy: actor.userId,
      },
      account.version
    );

    await this.audit.emit({
      eventType: 'treasury.bank_account.suspended',
      aggregateId: id,
      aggregateType: 'BankAccount',
      tenantId: actor.tenantId,
      userId: actor.userId,
      payload: { reason },
    });

    return updated;
  }

  async reactivate(
    id: string,
    actor: ActorContext
  ): Promise<BankAccount> {
    const account = await this.repository.findById(id, actor.tenantId);
    if (!account) {
      throw BankMasterError.accountNotFound(id);
    }

    if (account.status !== 'suspended') {
      throw new BankMasterError(
        BankMasterErrorCode.INVALID_STATE_TRANSITION,
        `Account ${id} is not suspended (status: ${account.status})`,
        { currentStatus: account.status }
      );
    }

    const updated = await this.repository.updateStatus(
      id,
      actor.tenantId,
      'active',
      {
        suspendedAt: undefined,
        suspendedBy: undefined,
        suspensionReason: undefined,
        updatedBy: actor.userId,
      },
      account.version
    );

    await this.audit.emit({
      eventType: 'treasury.bank_account.reactivated',
      aggregateId: id,
      aggregateType: 'BankAccount',
      tenantId: actor.tenantId,
      userId: actor.userId,
      payload: {},
    });

    return updated;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DEACTIVATE (Close)
  // ═══════════════════════════════════════════════════════════════════════════

  async deactivate(
    id: string,
    actor: ActorContext
  ): Promise<BankAccount> {
    const account = await this.repository.findById(id, actor.tenantId);
    if (!account) {
      throw BankMasterError.accountNotFound(id);
    }

    if (!canTransition(account.status, 'inactive')) {
      throw BankMasterError.invalidStateTransition(account.status, 'inactive');
    }

    // TODO: Check for pending transactions on this account
    // TODO: Check for non-zero balance

    const updated = await this.repository.updateStatus(
      id,
      actor.tenantId,
      'inactive',
      { updatedBy: actor.userId },
      account.version
    );

    await this.audit.emit({
      eventType: 'treasury.bank_account.deactivated',
      aggregateId: id,
      aggregateType: 'BankAccount',
      tenantId: actor.tenantId,
      userId: actor.userId,
      payload: {},
    });

    return updated;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UPDATE BANK ACCOUNT
  // ═══════════════════════════════════════════════════════════════════════════

  async update(
    id: string,
    input: UpdateBankAccountInput,
    expectedVersion: number,
    actor: ActorContext
  ): Promise<BankAccount> {
    const account = await this.repository.findById(id, actor.tenantId);
    if (!account) {
      throw BankMasterError.accountNotFound(id);
    }

    // Can only update draft accounts freely; active accounts need approval workflow
    if (account.status !== 'draft') {
      // For non-draft, this would trigger a change request workflow
      // For now, allow updates but log it
    }

    // Validate updated fields
    if (input.iban && !validateIBAN(input.iban)) {
      throw new BankMasterError(
        BankMasterErrorCode.INVALID_IBAN,
        `Invalid IBAN format: ${input.iban}`,
        { iban: input.iban }
      );
    }

    if (input.swiftCode && !validateSWIFT(input.swiftCode)) {
      throw new BankMasterError(
        BankMasterErrorCode.INVALID_SWIFT_CODE,
        `Invalid SWIFT code format: ${input.swiftCode}`,
        { swiftCode: input.swiftCode }
      );
    }

    const updated = await this.repository.update(
      id,
      actor.tenantId,
      {
        ...input,
        swiftCode: input.swiftCode?.toUpperCase(),
        iban: input.iban?.replace(/\s/g, '').toUpperCase(),
        updatedBy: actor.userId,
        updatedAt: new Date(),
      },
      expectedVersion
    );

    await this.audit.emit({
      eventType: 'treasury.bank_account.updated',
      aggregateId: id,
      aggregateType: 'BankAccount',
      tenantId: actor.tenantId,
      userId: actor.userId,
      payload: { updatedFields: Object.keys(input) },
    });

    return updated;
  }
}

// =============================================================================
// Factory Function
// =============================================================================

export function createBankMasterService(
  deps: BankMasterServiceDeps
): BankMasterService {
  return new BankMasterService(deps);
}
