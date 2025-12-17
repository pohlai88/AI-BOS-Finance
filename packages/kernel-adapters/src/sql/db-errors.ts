/**
 * Database Error Handler
 * 
 * Maps PostgreSQL errors to domain-specific errors.
 * 
 * @file packages/kernel-adapters/src/sql/db-errors.ts
 */

// ============================================================================
// ERROR CODES
// ============================================================================

/**
 * PostgreSQL error codes we handle specially
 */
export const PG_ERROR_CODES = {
  // Constraint violations
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  CHECK_VIOLATION: '23514',
  NOT_NULL_VIOLATION: '23502',

  // Custom application errors (raised by triggers)
  SOD_VIOLATION: 'P0002',
  IMMUTABILITY_VIOLATION: 'P0003',
  DECISION_CHANGE_VIOLATION: 'P0004',
  POSTED_MATCH_UPDATE: 'P0001',

  // Serialization/concurrency
  SERIALIZATION_FAILURE: '40001',
  DEADLOCK_DETECTED: '40P01',

  // Connection issues
  CONNECTION_EXCEPTION: '08000',
  CONNECTION_FAILURE: '08006',
} as const;

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface DatabaseError extends Error {
  code?: string;
  detail?: string;
  constraint?: string;
  table?: string;
  column?: string;
}

export interface ParsedDbError {
  type: 'unique' | 'foreign_key' | 'check' | 'sod' | 'immutability' | 'concurrency' | 'connection' | 'unknown';
  message: string;
  originalError: DatabaseError;
  constraint?: string;
  table?: string;
}

// ============================================================================
// ERROR PARSER
// ============================================================================

/**
 * Parse a PostgreSQL error into a structured format
 */
export function parseDatabaseError(error: unknown): ParsedDbError {
  const dbError = error as DatabaseError;
  const code = dbError.code || '';

  // Unique constraint violation
  if (code === PG_ERROR_CODES.UNIQUE_VIOLATION) {
    return {
      type: 'unique',
      message: `Duplicate value: ${dbError.detail || dbError.message}`,
      originalError: dbError,
      constraint: dbError.constraint,
      table: dbError.table,
    };
  }

  // Foreign key violation
  if (code === PG_ERROR_CODES.FOREIGN_KEY_VIOLATION) {
    return {
      type: 'foreign_key',
      message: `Referenced record not found: ${dbError.detail || dbError.message}`,
      originalError: dbError,
      constraint: dbError.constraint,
      table: dbError.table,
    };
  }

  // Check constraint violation
  if (code === PG_ERROR_CODES.CHECK_VIOLATION) {
    return {
      type: 'check',
      message: `Validation failed: ${dbError.constraint || dbError.message}`,
      originalError: dbError,
      constraint: dbError.constraint,
      table: dbError.table,
    };
  }

  // SoD violation (our custom code)
  if (code === PG_ERROR_CODES.SOD_VIOLATION) {
    return {
      type: 'sod',
      message: 'Segregation of Duties violation: Cannot approve own action',
      originalError: dbError,
    };
  }

  // Immutability violation
  if (code === PG_ERROR_CODES.IMMUTABILITY_VIOLATION || code === PG_ERROR_CODES.POSTED_MATCH_UPDATE) {
    return {
      type: 'immutability',
      message: 'Record is immutable and cannot be modified',
      originalError: dbError,
    };
  }

  // Concurrency issues
  if (code === PG_ERROR_CODES.SERIALIZATION_FAILURE || code === PG_ERROR_CODES.DEADLOCK_DETECTED) {
    return {
      type: 'concurrency',
      message: 'Concurrent modification detected. Please retry.',
      originalError: dbError,
    };
  }

  // Connection issues
  if (code.startsWith('08')) {
    return {
      type: 'connection',
      message: 'Database connection error. Please try again.',
      originalError: dbError,
    };
  }

  // Unknown error
  return {
    type: 'unknown',
    message: dbError.message || 'An unexpected database error occurred',
    originalError: dbError,
  };
}

/**
 * Check if error is a specific type
 */
export function isDuplicateError(error: unknown): boolean {
  const dbError = error as DatabaseError;
  return dbError.code === PG_ERROR_CODES.UNIQUE_VIOLATION;
}

export function isSoDError(error: unknown): boolean {
  const dbError = error as DatabaseError;
  return dbError.code === PG_ERROR_CODES.SOD_VIOLATION;
}

export function isImmutabilityError(error: unknown): boolean {
  const dbError = error as DatabaseError;
  return dbError.code === PG_ERROR_CODES.IMMUTABILITY_VIOLATION ||
         dbError.code === PG_ERROR_CODES.POSTED_MATCH_UPDATE;
}

export function isConcurrencyError(error: unknown): boolean {
  const dbError = error as DatabaseError;
  return dbError.code === PG_ERROR_CODES.SERIALIZATION_FAILURE ||
         dbError.code === PG_ERROR_CODES.DEADLOCK_DETECTED;
}

export function isConnectionError(error: unknown): boolean {
  const dbError = error as DatabaseError;
  return dbError.code?.startsWith('08') ?? false;
}

/**
 * Wrap a database operation with error parsing
 */
export async function withDbErrorHandling<T>(
  operation: () => Promise<T>,
  errorMapper?: (parsed: ParsedDbError) => Error
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const parsed = parseDatabaseError(error);

    if (errorMapper) {
      throw errorMapper(parsed);
    }

    // Re-throw with enhanced message
    const enhancedError = new Error(parsed.message);
    (enhancedError as any).originalError = parsed.originalError;
    (enhancedError as any).type = parsed.type;
    throw enhancedError;
  }
}
