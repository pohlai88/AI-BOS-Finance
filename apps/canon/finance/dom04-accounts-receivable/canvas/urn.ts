/**
 * URN (Uniform Resource Name) Parser & Builder
 * 
 * Provides the "Magic Link" between canvas objects and AR entities.
 * 
 * Format: urn:aibos:ar:{cell}:{entity}:{uuid}
 * 
 * Examples:
 *   urn:aibos:ar:01:customer:550e8400-e29b-41d4-a716-446655440001
 *   urn:aibos:ar:02:invoice:8f14e45f-ceea-46ed-a8b2-0ba60a3e01c3
 *   urn:aibos:ar:03:receipt:7c9e6679-7425-40de-944b-e07fc1f90ae7
 *   urn:aibos:ar:04:creditnote:a87ff679-a2f3-4c94-a1f7-d1d8e0f21f7b
 *   urn:aibos:ar:05:aging:e4d909c2-9022-4d1d-8b22-1f6d9c3f1c0a
 * 
 * @module AR-Canvas
 */

// =============================================================================
// 1. TYPES
// =============================================================================

/**
 * AR Cell codes
 */
export type ARCellCode = '01' | '02' | '03' | '04' | '05';

/**
 * AR Entity types by cell
 */
export type AREntityType = 'customer' | 'invoice' | 'receipt' | 'creditnote' | 'aging';

/**
 * Cell code to entity type mapping
 */
export const CELL_ENTITY_MAP: Record<ARCellCode, AREntityType> = {
  '01': 'customer',
  '02': 'invoice',
  '03': 'receipt',
  '04': 'creditnote',
  '05': 'aging',
} as const;

/**
 * Entity type to cell code mapping
 */
export const ENTITY_CELL_MAP: Record<AREntityType, ARCellCode> = {
  customer: '01',
  invoice: '02',
  receipt: '03',
  creditnote: '04',
  aging: '05',
} as const;

/**
 * Human-readable cell names
 */
export const CELL_NAMES: Record<ARCellCode, string> = {
  '01': 'Customer Master',
  '02': 'Sales Invoice',
  '03': 'Receipt Processing',
  '04': 'Credit Note',
  '05': 'AR Aging & Collection',
} as const;

/**
 * Cell codes for display
 */
export const CELL_DISPLAY_CODES: Record<ARCellCode, string> = {
  '01': 'AR-01',
  '02': 'AR-02',
  '03': 'AR-03',
  '04': 'AR-04',
  '05': 'AR-05',
} as const;

/**
 * Parsed URN structure
 */
export interface ParsedURN {
  /** Full URN string */
  urn: string;
  /** Namespace (always 'aibos') */
  namespace: 'aibos';
  /** Domain (always 'ar' for Accounts Receivable) */
  domain: 'ar';
  /** Cell code (01-05) */
  cell: ARCellCode;
  /** Entity type (customer, invoice, etc.) */
  entityType: AREntityType;
  /** Entity UUID */
  entityId: string;
  /** Human-readable cell name */
  cellName: string;
  /** Display code (AR-01, AR-02, etc.) */
  cellDisplayCode: string;
}

/**
 * URN parsing error
 */
export class URNParseError extends Error {
  readonly code = 'URN_PARSE_ERROR';

  constructor(
    public readonly input: string,
    public readonly reason: string
  ) {
    super(`Invalid URN "${input}": ${reason}`);
    this.name = 'URNParseError';
  }
}

// =============================================================================
// 2. VALIDATION
// =============================================================================

/**
 * UUID v4 regex pattern
 */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Full URN regex pattern for AR domain
 */
const URN_PATTERN = /^urn:aibos:ar:(0[1-5]):(customer|invoice|receipt|creditnote|aging):([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

/**
 * Validate a UUID string
 */
export function isValidUUID(uuid: string): boolean {
  return UUID_PATTERN.test(uuid);
}

/**
 * Validate a URN string
 */
export function isValidURN(urn: string): boolean {
  return URN_PATTERN.test(urn);
}

/**
 * Validate that cell code matches entity type
 */
function validateCellEntityMatch(cell: ARCellCode, entityType: AREntityType): boolean {
  return CELL_ENTITY_MAP[cell] === entityType;
}

// =============================================================================
// 3. PARSER
// =============================================================================

/**
 * Parse a URN string into its components
 * 
 * @param urn - The URN string to parse
 * @returns Parsed URN object
 * @throws URNParseError if the URN is invalid
 * 
 * @example
 * const parsed = parseURN('urn:aibos:ar:02:invoice:8f14e45f-ceea-46ed-a8b2-0ba60a3e01c3');
 * // { cell: '02', entityType: 'invoice', entityId: '8f14e45f-...' }
 */
export function parseURN(urn: string): ParsedURN {
  if (!urn || typeof urn !== 'string') {
    throw new URNParseError(String(urn), 'URN must be a non-empty string');
  }

  const trimmed = urn.trim().toLowerCase();
  const match = trimmed.match(URN_PATTERN);

  if (!match) {
    throw new URNParseError(urn, 'Does not match URN pattern (urn:aibos:ar:{cell}:{entity}:{uuid})');
  }

  const [, cellRaw, entityTypeRaw, entityId] = match;
  const cell = cellRaw as ARCellCode;
  const entityType = entityTypeRaw as AREntityType;

  // Validate cell/entity consistency
  if (!validateCellEntityMatch(cell, entityType)) {
    throw new URNParseError(
      urn,
      `Cell ${cell} does not match entity type ${entityType}. Expected ${CELL_ENTITY_MAP[cell]}`
    );
  }

  return {
    urn: trimmed,
    namespace: 'aibos',
    domain: 'ar',
    cell,
    entityType,
    entityId,
    cellName: CELL_NAMES[cell],
    cellDisplayCode: CELL_DISPLAY_CODES[cell],
  };
}

/**
 * Try to parse a URN, returning null instead of throwing
 * 
 * @param urn - The URN string to parse
 * @returns Parsed URN object or null if invalid
 */
export function tryParseURN(urn: string): ParsedURN | null {
  try {
    return parseURN(urn);
  } catch {
    return null;
  }
}

// =============================================================================
// 4. BUILDER
// =============================================================================

/**
 * Build a URN string from components
 * 
 * @param cell - AR cell code (01-05)
 * @param entityId - Entity UUID
 * @returns URN string
 * 
 * @example
 * const urn = buildURN('02', '8f14e45f-ceea-46ed-a8b2-0ba60a3e01c3');
 * // 'urn:aibos:ar:02:invoice:8f14e45f-ceea-46ed-a8b2-0ba60a3e01c3'
 */
export function buildURN(cell: ARCellCode, entityId: string): string {
  if (!isValidUUID(entityId)) {
    throw new Error(`Invalid entity ID: ${entityId}. Must be a valid UUID.`);
  }

  const entityType = CELL_ENTITY_MAP[cell];
  if (!entityType) {
    throw new Error(`Invalid cell code: ${cell}. Must be 01-05.`);
  }

  return `urn:aibos:ar:${cell}:${entityType}:${entityId.toLowerCase()}`;
}

/**
 * Build a URN from entity type and ID
 * 
 * @param entityType - Entity type (customer, invoice, etc.)
 * @param entityId - Entity UUID
 * @returns URN string
 */
export function buildURNFromEntity(entityType: AREntityType, entityId: string): string {
  const cell = ENTITY_CELL_MAP[entityType];
  if (!cell) {
    throw new Error(`Invalid entity type: ${entityType}`);
  }
  return buildURN(cell, entityId);
}

// =============================================================================
// 5. HELPERS
// =============================================================================

/**
 * Extract entity ID from a URN
 * 
 * @param urn - The URN string
 * @returns Entity UUID or null if invalid
 */
export function extractEntityId(urn: string): string | null {
  const parsed = tryParseURN(urn);
  return parsed?.entityId ?? null;
}

/**
 * Extract cell code from a URN
 * 
 * @param urn - The URN string
 * @returns Cell code or null if invalid
 */
export function extractCellCode(urn: string): ARCellCode | null {
  const parsed = tryParseURN(urn);
  return parsed?.cell ?? null;
}

/**
 * Get the cell display code (AR-01, etc.) from a URN
 * 
 * @param urn - The URN string
 * @returns Display code or null if invalid
 */
export function getCellDisplayCode(urn: string): string | null {
  const parsed = tryParseURN(urn);
  return parsed?.cellDisplayCode ?? null;
}

/**
 * Check if two URNs refer to the same entity
 */
export function isSameEntity(urn1: string, urn2: string): boolean {
  const parsed1 = tryParseURN(urn1);
  const parsed2 = tryParseURN(urn2);

  if (!parsed1 || !parsed2) return false;

  return parsed1.cell === parsed2.cell &&
    parsed1.entityId === parsed2.entityId;
}

/**
 * Group URNs by cell code
 * 
 * @param urns - Array of URN strings
 * @returns Map of cell code to URNs
 */
export function groupURNsByCell(urns: string[]): Map<ARCellCode, ParsedURN[]> {
  const grouped = new Map<ARCellCode, ParsedURN[]>();

  for (const urn of urns) {
    const parsed = tryParseURN(urn);
    if (parsed) {
      const existing = grouped.get(parsed.cell) ?? [];
      existing.push(parsed);
      grouped.set(parsed.cell, existing);
    }
  }

  return grouped;
}
