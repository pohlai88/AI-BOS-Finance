/**
 * Finance URN (Uniform Resource Name)
 * 
 * Provides type-safe URN generation for finance domain entities.
 * URNs are used for:
 * - Audit trail entity identification
 * - Cross-system entity references
 * - Event payload entity identification
 * 
 * Format: urn:finance:{entity-type}:{entity-id}
 * Example: urn:finance:payment:550e8400-e29b-41d4-a716-446655440000
 */

// ============================================================================
// 1. TYPES
// ============================================================================

/**
 * Finance entity types
 */
export type FinanceEntityType =
  | 'payment'
  | 'invoice'
  | 'vendor'
  | 'journal'
  | 'journal-line'
  | 'account'
  | 'cost-center'
  | 'tax-code'
  | 'bank-account'
  | 'approval'
  | 'period';

/**
 * URN namespace for finance domain
 */
const FINANCE_NAMESPACE = 'urn:finance';

/**
 * Parsed URN components
 */
export interface ParsedURN {
  namespace: string;
  domain: string;
  entityType: FinanceEntityType;
  entityId: string;
}

// ============================================================================
// 2. ERRORS
// ============================================================================

export class InvalidURNError extends Error {
  constructor(urn: string, reason: string) {
    super(`Invalid URN "${urn}": ${reason}`);
    this.name = 'InvalidURNError';
  }
}

// ============================================================================
// 3. URN GENERATION
// ============================================================================

/**
 * Generate a URN for a finance entity
 * 
 * @param entityType - Type of the entity
 * @param entityId - Unique identifier (UUID)
 * @returns URN string
 * 
 * @example
 * ```typescript
 * const urn = FinanceURN.create('payment', '550e8400-e29b-41d4-a716-446655440000');
 * // Result: 'urn:finance:payment:550e8400-e29b-41d4-a716-446655440000'
 * ```
 */
export function createFinanceURN(entityType: FinanceEntityType, entityId: string): string {
  if (!entityId || entityId.trim() === '') {
    throw new InvalidURNError('', 'Entity ID cannot be empty');
  }
  return `${FINANCE_NAMESPACE}:${entityType}:${entityId}`;
}

/**
 * Parse a URN into its components
 * 
 * @param urn - URN string to parse
 * @returns Parsed URN components
 * @throws InvalidURNError if URN format is invalid
 */
export function parseFinanceURN(urn: string): ParsedURN {
  const parts = urn.split(':');

  if (parts.length !== 4) {
    throw new InvalidURNError(urn, 'Expected format urn:finance:{type}:{id}');
  }

  const [namespace, domain, entityType, entityId] = parts;

  if (namespace !== 'urn') {
    throw new InvalidURNError(urn, 'Must start with "urn:"');
  }

  if (domain !== 'finance') {
    throw new InvalidURNError(urn, 'Domain must be "finance"');
  }

  // Validate entity type
  const validTypes: FinanceEntityType[] = [
    'payment', 'invoice', 'vendor', 'journal', 'journal-line',
    'account', 'cost-center', 'tax-code', 'bank-account', 'approval', 'period',
  ];

  if (!validTypes.includes(entityType as FinanceEntityType)) {
    throw new InvalidURNError(urn, `Invalid entity type "${entityType}"`);
  }

  return {
    namespace,
    domain,
    entityType: entityType as FinanceEntityType,
    entityId,
  };
}

/**
 * Check if a string is a valid finance URN
 */
export function isValidFinanceURN(urn: string): boolean {
  try {
    parseFinanceURN(urn);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract entity ID from a URN
 */
export function extractEntityId(urn: string): string {
  const parsed = parseFinanceURN(urn);
  return parsed.entityId;
}

/**
 * Extract entity type from a URN
 */
export function extractEntityType(urn: string): FinanceEntityType {
  const parsed = parseFinanceURN(urn);
  return parsed.entityType;
}

// ============================================================================
// 4. CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Create a payment URN
 */
export function paymentURN(paymentId: string): string {
  return createFinanceURN('payment', paymentId);
}

/**
 * Create an invoice URN
 */
export function invoiceURN(invoiceId: string): string {
  return createFinanceURN('invoice', invoiceId);
}

/**
 * Create a vendor URN
 */
export function vendorURN(vendorId: string): string {
  return createFinanceURN('vendor', vendorId);
}

/**
 * Create a journal URN
 */
export function journalURN(journalId: string): string {
  return createFinanceURN('journal', journalId);
}

/**
 * Create a journal line URN
 */
export function journalLineURN(lineId: string): string {
  return createFinanceURN('journal-line', lineId);
}

/**
 * Create an account URN
 */
export function accountURN(accountId: string): string {
  return createFinanceURN('account', accountId);
}

/**
 * Create an approval URN
 */
export function approvalURN(approvalId: string): string {
  return createFinanceURN('approval', approvalId);
}

// ============================================================================
// 5. FINANCE URN CLASS
// ============================================================================

/**
 * FinanceURN utility class
 * 
 * Provides static methods for URN operations.
 */
export class FinanceURN {
  static create = createFinanceURN;
  static parse = parseFinanceURN;
  static isValid = isValidFinanceURN;
  static extractId = extractEntityId;
  static extractType = extractEntityType;

  // Entity-specific creators
  static payment = paymentURN;
  static invoice = invoiceURN;
  static vendor = vendorURN;
  static journal = journalURN;
  static journalLine = journalLineURN;
  static account = accountURN;
  static approval = approvalURN;
}

// ============================================================================
// 6. EXPORTS
// ============================================================================

export default FinanceURN;
