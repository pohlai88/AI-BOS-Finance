/**
 * AR-05 AR Aging & Collection Cell — Barrel Export
 * 
 * Exports all public APIs for the AR Aging & Collection Cell.
 * 
 * @module AR-05
 */

// Domain Service
export { AgingService } from './AgingService';
export type {
  ActorContext,
  AuditOutboxPort,
  CustomerPort,
} from './AgingService';

// Domain Errors
export {
  AgingCellError,
  AgingErrorCode,
  snapshotNotFoundError,
  customerNotFoundError,
  invoiceNotFoundError,
  actionNotFoundError,
  invalidDateRangeError,
  snapshotInProgressError,
  futureDateNotAllowedError,
  versionConflictError,
} from './errors';
export type { AgingErrorCodeType } from './errors';
