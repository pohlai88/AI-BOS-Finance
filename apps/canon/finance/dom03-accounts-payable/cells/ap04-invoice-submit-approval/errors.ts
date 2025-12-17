/**
 * AP-04: Invoice Approval Workflow — Domain Errors
 * 
 * Custom error classes for approval workflow.
 * Each error maps to appropriate HTTP status codes for BFF layer.
 */

// ============================================================================
// BASE ERROR
// ============================================================================

export abstract class ApprovalCellError extends Error {
  abstract readonly code: string;
  abstract readonly httpStatus: number;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace?.(this, this.constructor);
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code,
      name: this.name,
    };
  }
}

export function isApprovalCellError(error: unknown): error is ApprovalCellError {
  return error instanceof ApprovalCellError;
}

// ============================================================================
// NOT FOUND ERRORS
// ============================================================================

export class ApprovalNotFoundError extends ApprovalCellError {
  readonly code = 'APPROVAL_NOT_FOUND';
  readonly httpStatus = 404;

  constructor(approvalId: string) {
    super(`Approval record not found: ${approvalId}`);
  }
}

export class ApprovalRouteNotFoundError extends ApprovalCellError {
  readonly code = 'APPROVAL_ROUTE_NOT_FOUND';
  readonly httpStatus = 404;

  constructor(invoiceId: string) {
    super(`No approval route found for invoice: ${invoiceId}`);
  }
}

export class InvoiceNotFoundForApprovalError extends ApprovalCellError {
  readonly code = 'INVOICE_NOT_FOUND_FOR_APPROVAL';
  readonly httpStatus = 404;

  constructor(invoiceId: string) {
    super(`Invoice not found for approval: ${invoiceId}`);
  }
}

// ============================================================================
// SOD ERRORS
// ============================================================================

export class SoDViolationError extends ApprovalCellError {
  readonly code = 'SOD_VIOLATION';
  readonly httpStatus = 403;

  constructor(invoiceCreator: string, approverId: string) {
    super(
      `SoD violation: Invoice creator (${invoiceCreator}) cannot approve their own invoice. ` +
      `Attempted by: ${approverId}`
    );
  }
}

export class CannotApproveOwnInvoiceError extends ApprovalCellError {
  readonly code = 'CANNOT_APPROVE_OWN_INVOICE';
  readonly httpStatus = 403;

  constructor(userId: string) {
    super(`User ${userId} cannot approve their own invoice (Maker ≠ Checker)`);
  }
}

// ============================================================================
// AUTHORIZATION ERRORS
// ============================================================================

export class NotAuthorizedToApproveError extends ApprovalCellError {
  readonly code = 'NOT_AUTHORIZED_TO_APPROVE';
  readonly httpStatus = 403;

  constructor(userId: string, requiredRole: string) {
    super(
      `User ${userId} is not authorized to approve. Required role: ${requiredRole}`
    );
  }
}

export class ApprovalLevelMismatchError extends ApprovalCellError {
  readonly code = 'APPROVAL_LEVEL_MISMATCH';
  readonly httpStatus = 422;

  constructor(expectedLevel: number, actualLevel: number) {
    super(
      `Approval level mismatch: expected level ${expectedLevel}, got ${actualLevel}`
    );
  }
}

export class NotPendingApprovalError extends ApprovalCellError {
  readonly code = 'NOT_PENDING_APPROVAL';
  readonly httpStatus = 422;

  constructor(invoiceId: string, currentStatus: string) {
    super(
      `Invoice ${invoiceId} is not pending approval. Current status: ${currentStatus}`
    );
  }
}

// ============================================================================
// STATE ERRORS
// ============================================================================

export class InvoiceNotMatchedError extends ApprovalCellError {
  readonly code = 'INVOICE_NOT_MATCHED';
  readonly httpStatus = 422;

  constructor(invoiceId: string, matchStatus: string) {
    super(
      `Invoice ${invoiceId} has not passed matching. Match status: ${matchStatus}`
    );
  }
}

export class AlreadyApprovedError extends ApprovalCellError {
  readonly code = 'ALREADY_APPROVED';
  readonly httpStatus = 409;

  constructor(invoiceId: string) {
    super(`Invoice ${invoiceId} has already been fully approved`);
  }
}

export class AlreadyRejectedError extends ApprovalCellError {
  readonly code = 'ALREADY_REJECTED';
  readonly httpStatus = 409;

  constructor(invoiceId: string) {
    super(`Invoice ${invoiceId} has already been rejected`);
  }
}

export class ApprovalAlreadyActionedError extends ApprovalCellError {
  readonly code = 'APPROVAL_ALREADY_ACTIONED';
  readonly httpStatus = 409;

  constructor(approvalId: string) {
    super(`Approval ${approvalId} has already been actioned`);
  }
}

// ============================================================================
// IMMUTABILITY ERRORS
// ============================================================================

export class ApprovalImmutableError extends ApprovalCellError {
  readonly code = 'APPROVAL_IMMUTABLE';
  readonly httpStatus = 422;

  constructor(approvalId: string, reason: string) {
    super(`Approval ${approvalId} is immutable: ${reason}`);
  }
}

export class ApprovalChainImmutableError extends ApprovalCellError {
  readonly code = 'APPROVAL_CHAIN_IMMUTABLE';
  readonly httpStatus = 422;

  constructor(invoiceId: string) {
    super(`Approval chain for invoice ${invoiceId} is immutable and cannot be modified`);
  }
}

// ============================================================================
// DELEGATION ERRORS
// ============================================================================

export class DelegationNotFoundError extends ApprovalCellError {
  readonly code = 'DELEGATION_NOT_FOUND';
  readonly httpStatus = 404;

  constructor(delegationId: string) {
    super(`Delegation not found: ${delegationId}`);
  }
}

export class DelegationExpiredError extends ApprovalCellError {
  readonly code = 'DELEGATION_EXPIRED';
  readonly httpStatus = 422;

  constructor(delegationId: string) {
    super(`Delegation ${delegationId} has expired`);
  }
}

export class InvalidDelegationError extends ApprovalCellError {
  readonly code = 'INVALID_DELEGATION';
  readonly httpStatus = 422;

  constructor(reason: string) {
    super(`Invalid delegation: ${reason}`);
  }
}

// ============================================================================
// ROUTING ERRORS
// ============================================================================

export class RoutingConfigurationError extends ApprovalCellError {
  readonly code = 'ROUTING_CONFIGURATION_ERROR';
  readonly httpStatus = 500;

  constructor(message: string) {
    super(`Routing configuration error: ${message}`);
  }
}

export class NoApproversConfiguredError extends ApprovalCellError {
  readonly code = 'NO_APPROVERS_CONFIGURED';
  readonly httpStatus = 500;

  constructor(tenantId: string, level: number) {
    super(`No approvers configured for tenant ${tenantId} at level ${level}`);
  }
}
