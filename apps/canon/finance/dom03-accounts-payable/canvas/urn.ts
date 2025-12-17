/**
 * URN (Uniform Resource Name) Parser & Builder
 * 
 * Provides the "Magic Link" between canvas objects and AP entities.
 * 
 * Format: urn:aibos:ap:{cell}:{entity}:{uuid}
 * 
 * Examples:
 *   urn:aibos:ap:01:vendor:550e8400-e29b-41d4-a716-446655440001
 *   urn:aibos:ap:02:invoice:8f14e45f-ceea-46ed-a8b2-0ba60a3e01c3
 *   urn:aibos:ap:03:match:7c9e6679-7425-40de-944b-e07fc1f90ae7
 *   urn:aibos:ap:04:approval:a87ff679-a2f3-4c94-a1f7-d1d8e0f21f7b
 *   urn:aibos:ap:05:payment:e4d909c2-9022-4d1d-8b22-1f6d9c3f1c0a
 */

// ============================================================================
// 1. TYPES
// ============================================================================

/**
 * AP Cell codes
 */
export type APCellCode = '01' | '02' | '03' | '04' | '05';

/**
 * AP Entity types by cell
 */
export type APEntityType = 'vendor' | 'invoice' | 'match' | 'approval' | 'payment';

/**
 * Cell code to entity type mapping
 */
export const CELL_ENTITY_MAP: Record<APCellCode, APEntityType> = {
  '01': 'vendor',
  '02': 'invoice',
  '03': 'match',
  '04': 'approval',
  '05': 'payment',
} as const;

/**
 * Entity type to cell code mapping
 */
export const ENTITY_CELL_MAP: Record<APEntityType, APCellCode> = {
  vendor: '01',
  invoice: '02',
  match: '03',
  approval: '04',
  payment: '05',
} as const;

/**
 * Human-readable cell names
 */
export const CELL_NAMES: Record<APCellCode, string> = {
  '01': 'Vendor Master',
  '02': 'Invoice Entry',
  '03': '3-Way Match',
  '04': 'Invoice Approval',
  '05': 'Payment Execution',
} as const;

/**
 * Cell codes for display
 */
export const CELL_DISPLAY_CODES: Record<APCellCode, string> = {
  '01': 'AP-01',
  '02': 'AP-02',
  '03': 'AP-03',
  '04': 'AP-04',
  '05': 'AP-05',
} as const;

/**
 * Parsed URN structure
 */
export interface ParsedURN {
  /** Full URN string */
  urn: string;
  /** Namespace (always 'aibos') */
  namespace: 'aibos';
  /** Domain (always 'ap' for Accounts Payable) */
  domain: 'ap';
  /** Cell code (01-05) */
  cell: APCellCode;
  /** Entity type (vendor, invoice, etc.) */
  entityType: APEntityType;
  /** Entity UUID */
  entityId: string;
  /** Human-readable cell name */
  cellName: string;
  /** Display code (AP-01, AP-02, etc.) */
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

// ============================================================================
// 2. VALIDATION
// ============================================================================

/**
 * UUID v4 regex pattern
 */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Full URN regex pattern
 */
const URN_PATTERN = /^urn:aibos:ap:(0[1-5]):(vendor|invoice|match|approval|payment):([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

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
function validateCellEntityMatch(cell: APCellCode, entityType: APEntityType): boolean {
  return CELL_ENTITY_MAP[cell] === entityType;
}

// ============================================================================
// 3. PARSER
// ============================================================================

/**
 * Parse a URN string into its components
 * 
 * @param urn - The URN string to parse
 * @returns Parsed URN object
 * @throws URNParseError if the URN is invalid
 * 
 * @example
 * const parsed = parseURN('urn:aibos:ap:02:invoice:8f14e45f-ceea-46ed-a8b2-0ba60a3e01c3');
 * // { cell: '02', entityType: 'invoice', entityId: '8f14e45f-...' }
 */
export function parseURN(urn: string): ParsedURN {
  if (!urn || typeof urn !== 'string') {
    throw new URNParseError(String(urn), 'URN must be a non-empty string');
  }
  
  const trimmed = urn.trim().toLowerCase();
  const match = trimmed.match(URN_PATTERN);
  
  if (!match) {
    throw new URNParseError(urn, 'Does not match URN pattern (urn:aibos:ap:{cell}:{entity}:{uuid})');
  }
  
  const [, cellRaw, entityTypeRaw, entityId] = match;
  const cell = cellRaw as APCellCode;
  const entityType = entityTypeRaw as APEntityType;
  
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
    domain: 'ap',
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

// ============================================================================
// 4. BUILDER
// ============================================================================

/**
 * Build a URN string from components
 * 
 * @param cell - AP cell code (01-05)
 * @param entityId - Entity UUID
 * @returns URN string
 * 
 * @example
 * const urn = buildURN('02', '8f14e45f-ceea-46ed-a8b2-0ba60a3e01c3');
 * // 'urn:aibos:ap:02:invoice:8f14e45f-ceea-46ed-a8b2-0ba60a3e01c3'
 */
export function buildURN(cell: APCellCode, entityId: string): string {
  if (!isValidUUID(entityId)) {
    throw new Error(`Invalid entity ID: ${entityId}. Must be a valid UUID.`);
  }
  
  const entityType = CELL_ENTITY_MAP[cell];
  if (!entityType) {
    throw new Error(`Invalid cell code: ${cell}. Must be 01-05.`);
  }
  
  return `urn:aibos:ap:${cell}:${entityType}:${entityId.toLowerCase()}`;
}

/**
 * Build a URN from entity type and ID
 * 
 * @param entityType - Entity type (vendor, invoice, etc.)
 * @param entityId - Entity UUID
 * @returns URN string
 */
export function buildURNFromEntity(entityType: APEntityType, entityId: string): string {
  const cell = ENTITY_CELL_MAP[entityType];
  if (!cell) {
    throw new Error(`Invalid entity type: ${entityType}`);
  }
  return buildURN(cell, entityId);
}

// ============================================================================
// 5. HELPERS
// ============================================================================

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
export function extractCellCode(urn: string): APCellCode | null {
  const parsed = tryParseURN(urn);
  return parsed?.cell ?? null;
}

/**
 * Get the cell display code (AP-01, etc.) from a URN
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
export function groupURNsByCell(urns: string[]): Map<APCellCode, ParsedURN[]> {
  const grouped = new Map<APCellCode, ParsedURN[]>();
  
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
