/**
 * Canon Primitives - Domain Value Objects
 * 
 * Exports:
 * - Money: Immutable monetary value object
 * - ActorContext: Authenticated user/system context
 * - FinanceURN: Uniform Resource Names for finance entities
 */

// Money Value Object
export {
  Money,
  InvalidMoneyError,
  CurrencyMismatchError,
  NegativeMoneyError,
  type CurrencyCode,
  type MoneyJSON,
} from './Money';

// Actor Context
export {
  createUserActor,
  createSystemActor,
  createServiceActor,
  createSchedulerActor,
  actorHasRole,
  actorHasAnyRole,
  actorHasAllRoles,
  isAutomatedActor,
  isHumanActor,
  type ActorContext,
  type ActorType,
} from './ActorContext';

// Finance URN
export {
  FinanceURN,
  createFinanceURN,
  parseFinanceURN,
  isValidFinanceURN,
  extractEntityId,
  extractEntityType,
  paymentURN,
  invoiceURN,
  vendorURN,
  journalURN,
  journalLineURN,
  accountURN,
  approvalURN,
  InvalidURNError,
  type FinanceEntityType,
  type ParsedURN,
} from './FinanceURN';
