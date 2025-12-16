// ============================================================================
// METADATA API TYPES - UI-Driven Development Contract
// ============================================================================
// This file defines the exact shape of data the META_01-08 pages need.
// Backend routes MUST conform to these types. Frontend can rely on them.
// ============================================================================

// -----------------------------------------------------------------------------
// 1. CORE ENUMS & PRIMITIVES
// -----------------------------------------------------------------------------

export type GovernanceTier = 'tier1' | 'tier2' | 'tier3' | 'tier4' | 'tier5';
export type MetadataStatus = 'draft' | 'active' | 'deprecated';
export type EntityType = 'table' | 'view' | 'api' | 'screen' | 'concept';
export type ViolationSeverity = 'critical' | 'high' | 'medium' | 'low';
export type SystemHealthStatus = 'healthy' | 'warning' | 'critical';

// -----------------------------------------------------------------------------
// 2. CORE DATA TRANSFER OBJECTS (DTOs)
// -----------------------------------------------------------------------------

/**
 * MetadataFieldDto - Single field/column definition
 * Used by: META_02 God View, META_03 Prism
 */
export interface MetadataFieldDto {
  id: string;
  tenant_id: string;
  canonical_key: string;      // 'finance.journal_entries.amount'
  entity_urn: string;         // 'finance.journal_entries'
  label: string;              // 'Amount'
  description?: string;
  data_type: string;          // 'DECIMAL(18,2)', 'VARCHAR(255)', etc.
  format?: string;
  tier: GovernanceTier;
  domain: string;
  module: string;
  status: MetadataStatus;
  standard_pack_id?: string;
  pii_flag?: boolean;
  owner_id?: string;
  created_at: string;
  updated_at: string;
}

/**
 * EntityDto - Entity (table/view/api) definition
 * Used by: META_05 Canon Matrix
 */
export interface EntityDto {
  id: string;
  tenant_id: string;
  entity_urn: string;         // 'finance.journal_entries'
  entity_name: string;        // 'journal_entries'
  entity_type: EntityType;
  domain: string;
  module: string;
  description?: string;
  owner_id?: string;
  field_count?: number;       // Computed: count of fields in this entity
  created_at: string;
  updated_at: string;
}

/**
 * StandardPackDto - Governance standard pack
 * Used by: META_06 Health Scan
 */
export interface StandardPackDto {
  id: string;
  pack_id: string;            // 'MFRS_15', 'SOC2_IAM'
  pack_name: string;
  description?: string;
  category: string;           // 'finance', 'security', 'privacy'
  standard_body: string;      // 'MASB', 'AICPA', 'ISO'
  tier: GovernanceTier;
  field_count?: number;       // Computed: fields anchored to this pack
}

/**
 * ViolationDto - GRCD violation record
 * Used by: META_01, META_04 Risk Radar
 */
export interface ViolationDto {
  id: string;
  violation_code: string;     // 'GRCD-11', 'GRCD-12'
  target_key: string;         // canonical_key or entity_urn
  severity: ViolationSeverity;
  message: string;
  detected_at: string;
  status: 'open' | 'resolved' | 'ignored';
  impacted_systems?: number;
  downstream_tables?: number;
}

/**
 * SystemBindingDto - Connected system status
 * Used by: META_01 Schema Governance
 */
export interface SystemBindingDto {
  id: string;
  system_name: string;        // 'SAP ERP', 'Salesforce'
  system_type: string;        // 'erp', 'crm', 'dw'
  status: SystemHealthStatus;
  schema_count: number;
  validated_count: number;
  drift_count: number;
  compliance_percent: number;
  last_sync: string;
  sample_tables?: string[];
}

// -----------------------------------------------------------------------------
// 3. PAGE-SPECIFIC RESPONSE TYPES
// -----------------------------------------------------------------------------

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    has_more: boolean;
  };
}

/**
 * META_01: Schema Governance Control Center
 * GET /api/meta/governance/dashboard
 */
export interface GovernanceDashboardResponse {
  stats: {
    total_fields: number;
    active_fields: number;
    draft_fields: number;
    deprecated_fields: number;
    violation_count: number;
    health_score: number;     // 0-100
  };
  systems: SystemBindingDto[];
  recent_violations: ViolationDto[];
  recent_events: {
    id: string;
    time: string;
    system: string;
    event: string;
    severity: ViolationSeverity | 'info';
    table?: string;
  }[];
}

/**
 * META_02: God View (Registry)
 * GET /api/meta/fields
 */
export type MetadataFieldsResponse = PaginatedResponse<MetadataFieldDto>;

/**
 * META_02: Filters for God View
 */
export interface MetadataFieldsFilter {
  q?: string;                 // Full-text search
  domain?: string;
  module?: string;
  tier?: GovernanceTier;
  status?: MetadataStatus;
  entity_urn?: string;
  standard_pack_id?: string;
  page?: number;
  limit?: number;
}

/**
 * META_03: Prism Comparator (Field Mappings)
 * GET /api/meta/mappings
 */
export interface FieldMappingDto {
  id: string;
  canonical_key: string;
  local_system: string;
  local_entity: string;
  local_field: string;
  local_type: string;
  transformation?: string;
  notes?: string;
}

export interface PrismComparisonResponse {
  canonical_key: string;
  canonical_field: MetadataFieldDto;
  mappings: FieldMappingDto[];
}

/**
 * META_04: Risk Radar
 * GET /api/meta/risks
 */
export interface RiskCategory {
  id: string;
  title: string;              // 'SOX Compliance', 'GAAP/IFRS Violations'
  severity: ViolationSeverity;
  issue_count: number;
  issues: ViolationDto[];
}

export interface RiskRadarResponse {
  summary: {
    total_issues: number;
    active_issues: number;
    critical_count: number;
    remediated_count: number;
  };
  categories: RiskCategory[];
}

/**
 * META_05: Canon Matrix (Entity Hierarchy)
 * GET /api/meta/entities/tree
 */
export interface EntityTreeNode extends EntityDto {
  children?: EntityTreeNode[];
  level: number;              // 0=domain, 1=module, 2=entity
}

export interface EntityTreeResponse {
  nodes: EntityDto[];         // Flat list, frontend builds tree
  stats: {
    domain_count: number;
    entity_count: number;
    field_count: number;
  };
}

/**
 * META_06: Health Scan
 * GET /api/meta/health
 */
export interface HealthModuleDto {
  id: string;
  name: string;               // 'IFRS Compliance', 'Data Privacy'
  standard_pack_id?: string;
  score: number;              // 0-100
  status: 'governed' | 'watch' | 'exposed';
  issue_count: number;
  issues: {
    id: string;
    title: string;
    severity: ViolationSeverity;
  }[];
}

export interface HealthScanResponse {
  overall_score: number;
  trend: number;              // e.g., +12 (vs last period)
  modules: HealthModuleDto[];
  summary: {
    governed_count: number;
    watch_count: number;
    exposed_count: number;
    critical_issues: number;
  };
}

// -----------------------------------------------------------------------------
// 4. MUTATION TYPES (POST/PUT/PATCH)
// -----------------------------------------------------------------------------

/**
 * Create/Update a metadata field (Lite Mode)
 * POST /api/meta/fields
 */
export interface CreateMetadataFieldInput {
  entity_urn: string;
  field_name: string;         // Will be combined: entity_urn.field_name → canonical_key
  label: string;
  description?: string;
  data_type: string;
  format?: string;
  tier?: GovernanceTier;      // Defaults to 'tier3' in Lite Mode
  domain?: string;            // Inferred from entity_urn if not provided
  module?: string;
  standard_pack_id?: string;  // Required for tier1/tier2
}

/**
 * Create an entity
 * POST /api/meta/entities
 */
export interface CreateEntityInput {
  entity_urn: string;
  entity_name: string;
  entity_type: EntityType;
  domain: string;
  module: string;
  description?: string;
}

// -----------------------------------------------------------------------------
// 5. API CLIENT INTERFACE (for frontend consumption)
// -----------------------------------------------------------------------------

/**
 * Type-safe API client interface
 * Frontend implements this, backend routes must match
 */
export interface MetadataApiClient {
  // META_01: Governance Dashboard
  getGovernanceDashboard(): Promise<GovernanceDashboardResponse>;

  // META_02: God View
  getFields(params?: MetadataFieldsFilter): Promise<MetadataFieldsResponse>;
  getField(id: string): Promise<MetadataFieldDto>;
  createField(input: CreateMetadataFieldInput): Promise<MetadataFieldDto>;

  // META_03: Prism Comparator
  getFieldMappings(canonicalKey: string): Promise<PrismComparisonResponse>;

  // META_04: Risk Radar
  getRiskRadar(): Promise<RiskRadarResponse>;

  // META_05: Canon Matrix
  getEntityTree(): Promise<EntityTreeResponse>;
  getEntity(urn: string): Promise<EntityDto>;
  createEntity(input: CreateEntityInput): Promise<EntityDto>;

  // META_06: Health Scan
  getHealthScan(): Promise<HealthScanResponse>;
}
