/**
 * AR-01 Customer Master Cell — Barrel Export
 * 
 * Exports all public APIs for the Customer Master Cell.
 * 
 * @module AR-01
 */

// Domain Service
export { CustomerService } from './CustomerService';
export type {
  ActorContext,
  SequencePort,
  AuditOutboxPort,
  PolicyPort,
} from './CustomerService';

// Domain Errors
export {
  CustomerCellError,
  CustomerErrorCode,
  customerNotFoundError,
  invalidStateTransitionError,
  sodViolationError,
  versionConflictError,
  duplicateTaxIdError,
  archivedImmutableError,
  pendingCreditChangeError,
} from './errors';
export type { CustomerErrorCodeType } from './errors';
