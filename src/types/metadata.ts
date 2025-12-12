// ============================================================================
// NEXUSCANON METADATA TYPE SYSTEM
// Forensic-grade data dictionary schema
// ============================================================================

export type CanonStatus =
  | 'LOCKED'
  | 'PENDING'
  | 'DRAFT'
  | 'UNTRUSTED'
  | 'CONFLICT'
export type Classification =
  | 'PUBLIC'
  | 'INTERNAL'
  | 'CONFIDENTIAL'
  | 'RESTRICTED'
export type Criticality = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
export type DataTypeBiz =
  | 'TEXT'
  | 'NUMBER'
  | 'MONEY'
  | 'DATE'
  | 'BOOLEAN'
  | 'ENUM'
  | 'ARRAY'
  | 'OBJECT'

/**
 * Core Metadata Record
 * Represents a single entry in the Data Dictionary
 */
export interface MetadataRecord {
  // === IDENTITY ===
  dict_id: string // Unique identifier (e.g., "DS-8821")
  business_term: string // Human-readable name (e.g., "Purchase Orders")
  technical_name: string // System name (e.g., "purchase_orders_main")
  version: string // Version number (e.g., "2.1.0")

  // === CLASSIFICATION ===
  domain: string // Business domain (e.g., "Finance", "Operations")
  entity_group: string // Entity category (e.g., "Transactional", "Master Data")
  tags: string[] // Searchable tags

  // === STATUS ===
  canon_status: CanonStatus // Canon lock state
  classification: Classification // Data sensitivity
  criticality: Criticality // Business impact

  // === OWNERSHIP ===
  data_owner: string // Business owner (e.g., "Alice Chen")
  data_steward: string // Technical steward (e.g., "Bob Smith")

  // === BUSINESS SEMANTICS ===
  definition_short: string // One-line description
  definition_full: string // Complete definition
  calculation_logic?: string // Formula or logic (if computed)
  source_of_truth: string // Authoritative system (e.g., "SAP ERP")
  synonyms: string[] // Alternative names

  // === TECHNICAL SHAPE ===
  data_type_biz: DataTypeBiz // Business-friendly type
  data_type_tech: string // Technical type (e.g., "VARCHAR(255)")
  precision?: string // For numeric types (e.g., "DECIMAL(18,2)")
  nullability: boolean // Can be null?
  format_pattern?: string // Regex or format (e.g., "^\d{4}-\d{2}-\d{2}$")
  valid_values?: string[] // Enumeration values

  // === BEHAVIOR ===
  example_values: string[] // Sample data
  edge_cases: string[] // Known edge cases
  default_behaviour: string // What happens by default
  default_interpretation: string // How to interpret missing/null values

  // === RELATIONSHIPS ===
  upstream_src: string // Source system/table
  downstream_use: string[] // Where this data is used
  related_terms: string[] // Related metadata IDs

  // === GOVERNANCE ===
  compliance_tags: string[] // Regulatory requirements (e.g., "SOX", "GDPR")
  approval_required: boolean // Needs approval for changes?
  last_certified: string // ISO date (e.g., "2024-12-01")
  recertification_due?: string // ISO date

  // === RISK & QUALITY ===
  errors_if_wrong: string // Impact description
  common_misuses: string[] // Known anti-patterns

  // === METADATA ===
  created_at: string // ISO timestamp
  updated_at: string // ISO timestamp
  created_by: string // User ID
  updated_by: string // User ID
}

/**
 * Audit Trail Entry
 * Tracks all changes to metadata records
 */
export interface AuditEntry {
  timestamp: string // ISO timestamp
  actor: string // User who made the change
  action: string // Type of change (e.g., "Updated schema")
  summary: string // Human-readable description
  fields_changed?: string[] // List of modified fields
  dict_id: string // Reference to metadata record
}

/**
 * Search Filter State
 * Used in God View for filtering metadata
 */
export interface MetadataFilters {
  query?: string // Free-text search
  domain?: string // Filter by domain
  entity_group?: string // Filter by entity group
  canon_status?: CanonStatus // Filter by status
  data_owner?: string // Filter by owner
  classification?: Classification // Filter by classification
  criticality?: Criticality // Filter by criticality
  tags?: string[] // Filter by tags
}

/**
 * Table State
 * Manages sorting, pagination, column visibility
 */
export interface TableState {
  sortBy?: string // Column to sort by
  sortOrder?: 'asc' | 'desc' // Sort direction
  page: number // Current page (0-indexed)
  pageSize: number // Rows per page
  selectedIds: string[] // Selected row IDs
  visibleColumns: string[] // Columns to display
}
