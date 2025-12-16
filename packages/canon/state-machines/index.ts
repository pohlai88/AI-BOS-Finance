/**
 * Canon State Machines - Domain State Management
 * 
 * Exports:
 * - PaymentStateMachine: AP-05 payment lifecycle state machine
 */

export {
  PaymentStateMachine,
  IllegalStateTransitionError,
  TRANSITIONS,
  TERMINAL_STATES,
  IMMUTABLE_STATES,
  STATUS_METADATA,
  type PaymentStatus,
  type PaymentAction,
  type StateTransition,
  type StatusMetadata,
} from './PaymentStateMachine';
