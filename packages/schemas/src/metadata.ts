/**
 * @aibos/schemas - Metadata Schema Definitions
 * 
 * Zod schemas for the Global Metadata Registry & Lineage OS.
 * These schemas define the "DNA" - the shared types between Kernel and Web.
 * 
 * @see PRD_KERNEL_01_AIBOS_KERNEL.md
 * @see apps/web/src/types/metadata.ts (source of truth for interface definitions)
 */

import { z } from 'zod';

// ============================================================================
// ENUMS
// ============================================================================

export const CanonStatusSchema = z.enum([
  'LOCKED',
  'PENDING',
  'DRAFT',
  'UNTRUSTED',
  'CONFLICT',
  'ACTIVE',      // From Constitution
  'DEPRECATED',  // From Constitution
  'ARCHIVED',    // From Constitution
]);

export const ClassificationSchema = z.enum([
  'PUBLIC',
  'INTERNAL',
  'CONFIDENTIAL',
  'RESTRICTED',
]);

export const CriticalitySchema = z.enum([
  'CRITICAL',
  'HIGH',
  'MEDIUM',
  'LOW',
]);

export const DataTypeBizSchema = z.enum([
  'TEXT',
  'NUMBER',
  'MONEY',
  'DATE',
  'BOOLEAN',
  'ENUM',
  'ARRAY',
  'OBJECT',
]);

export const EntityTypeSchema = z.enum([
  'table',
  'view',
  'api',
  'screen',
  'report',
  'master',
  'transactional',
  'reference',
]);

export const NodeTypeSchema = z.enum([
  'field',
  'entity',
  'table',
  'cell',
  'job',
  'api',
  'report',
]);

export const RelationshipTypeSchema = z.enum([
  'depends_on',
  'produces',
  'transforms',
  'read',
  'write',
]);

// ============================================================================
// MDM_GLOBAL_METADATA Schema
// ============================================================================

/**
 * Global Metadata Registry Schema
 * Maps to mdm_global_metadata table
 */
export const MdmGlobalMetadataSchema = z.object({
  dict_id: z.string().min(1), // e.g., "DS-8821"
  business_term: z.string().min(1), // e.g., "Purchase Orders"
  technical_name: z.string().min(1), // e.g., "purchase_orders_main"
  version: z.string().min(1), // e.g., "2.1.0"
  
  // Classification
  domain: z.string().optional(), // e.g., "Finance"
  entity_group: z.string().optional(), // e.g., "Transactional"
  tags: z.array(z.string()).default([]),
  
  // Status
  canon_status: CanonStatusSchema,
  classification: ClassificationSchema.optional(),
  criticality: CriticalitySchema.optional(),
  
  // Ownership
  data_owner: z.string().optional(),
  data_steward: z.string().optional(),
  
  // Business Semantics
  definition_short: z.string().optional(),
  definition_full: z.string().optional(),
  calculation_logic: z.string().optional(),
  source_of_truth: z.string().optional(),
  synonyms: z.array(z.string()).default([]),
  
  // Technical Shape
  data_type_biz: DataTypeBizSchema.optional(),
  data_type_tech: z.string().optional(), // e.g., "VARCHAR(255)"
  precision: z.string().optional(), // e.g., "DECIMAL(18,2)"
  nullability: z.boolean().default(false),
  format_pattern: z.string().optional(),
  valid_values: z.array(z.string()).optional(),
  
  // Behavior
  example_values: z.array(z.string()).default([]),
  edge_cases: z.array(z.string()).default([]),
  default_behaviour: z.string().optional(),
  default_interpretation: z.string().optional(),
  
  // Relationships
  upstream_src: z.string().optional(),
  downstream_use: z.array(z.string()).default([]),
  related_terms: z.array(z.string()).default([]),
  
  // Governance
  compliance_tags: z.array(z.string()).default([]),
  approval_required: z.boolean().default(false),
  last_certified: z.string().optional(), // ISO date
  recertification_due: z.string().optional(), // ISO date
  
  // Risk & Quality
  errors_if_wrong: z.string().optional(),
  common_misuses: z.array(z.string()).default([]),
  
  // Metadata
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  created_by: z.string().optional(),
  updated_by: z.string().optional(),
});

export type MdmGlobalMetadata = z.infer<typeof MdmGlobalMetadataSchema>;

// ============================================================================
// MDM_ENTITY_CATALOG Schema
// ============================================================================

export const MdmEntityCatalogSchema = z.object({
  entity_id: z.string().min(1), // e.g., "ORG_001"
  entity_name: z.string().min(1),
  entity_type: EntityTypeSchema,
  system: z.string().optional(), // e.g., "ERP core", "submodule", "external"
  tenant_scope: z.string().optional(),
  criticality: CriticalitySchema.optional(),
  lifecycle_status: z.enum(['draft', 'active', 'deprecated']).optional(),
  domain: z.string().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type MdmEntityCatalog = z.infer<typeof MdmEntityCatalogSchema>;

// ============================================================================
// MDM_METADATA_MAPPING Schema
// ============================================================================

export const MdmMetadataMappingSchema = z.object({
  mapping_id: z.string().min(1),
  local_system: z.string().min(1), // e.g., "SAP_ERP_PROD"
  local_entity: z.string().min(1), // e.g., "purchase_orders"
  local_field: z.string().min(1), // e.g., "po_id"
  canonical_metadata_id: z.string().min(1), // References mdm_global_metadata.dict_id
  mapping_source: z.enum(['manual', 'ai-suggested']).optional(),
  approval_status: z.enum(['pending', 'approved', 'rejected']).optional(),
  confidence_score: z.number().min(0).max(1).optional(), // 0.00-1.00
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type MdmMetadataMapping = z.infer<typeof MdmMetadataMappingSchema>;

// ============================================================================
// MDM_LINEAGE_NODES Schema
// ============================================================================

export const MdmLineageNodeSchema = z.object({
  node_id: z.string().min(1),
  node_type: NodeTypeSchema,
  node_name: z.string().min(1),
  system: z.string().optional(),
  domain: z.string().optional(),
  criticality: CriticalitySchema.optional(),
  metadata: z.record(z.unknown()).optional(), // JSONB flexible metadata
  created_at: z.string().datetime().optional(),
});

export type MdmLineageNode = z.infer<typeof MdmLineageNodeSchema>;

// ============================================================================
// MDM_LINEAGE_EDGES Schema
// ============================================================================

export const MdmLineageEdgeSchema = z.object({
  edge_id: z.string().min(1),
  from_node_id: z.string().min(1), // References mdm_lineage_nodes.node_id
  to_node_id: z.string().min(1), // References mdm_lineage_nodes.node_id
  relationship: RelationshipTypeSchema,
  frequency: z.string().optional(), // e.g., "daily", "real-time"
  last_observed_at: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(), // JSONB flexible metadata
  created_at: z.string().datetime().optional(),
});

export type MdmLineageEdge = z.infer<typeof MdmLineageEdgeSchema>;

// ============================================================================
// MDM_NAMING_POLICY Schema
// ============================================================================

export const MdmNamingPolicySchema = z.object({
  policy_id: z.string().min(1),
  tier: z.number().int().min(0).max(3), // Autonomy tier (0-3)
  allowed_actions: z.array(z.enum(['read', 'write', 'delete', 'export'])).default([]),
  constraints: z.record(z.unknown()).optional(), // JSONB flexible constraints
  created_at: z.string().datetime().optional(),
});

export type MdmNamingPolicy = z.infer<typeof MdmNamingPolicySchema>;
