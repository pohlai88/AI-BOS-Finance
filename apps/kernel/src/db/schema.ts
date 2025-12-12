/**
 * Drizzle ORM Schema Definitions
 * 
 * Maps Postgres tables to TypeScript types for the Kernel.
 * These schemas mirror the Zod definitions in @aibos/schemas.
 * 
 * @see packages/schemas/src/metadata.ts
 * @see PRD_KERNEL_01_AIBOS_KERNEL.md Section 3.2 (Database Schema)
 */

import { pgTable, varchar, text, boolean, timestamp, jsonb, integer, pgEnum } from 'drizzle-orm/pg-core';

// ============================================================================
// ENUMS
// ============================================================================

export const canonStatusEnum = pgEnum('canon_status', [
  'LOCKED',
  'PENDING',
  'DRAFT',
  'UNTRUSTED',
  'CONFLICT',
  'ACTIVE',
  'DEPRECATED',
  'ARCHIVED',
]);

export const classificationEnum = pgEnum('classification', [
  'PUBLIC',
  'INTERNAL',
  'CONFIDENTIAL',
  'RESTRICTED',
]);

export const criticalityEnum = pgEnum('criticality', [
  'CRITICAL',
  'HIGH',
  'MEDIUM',
  'LOW',
]);

export const dataTypeBizEnum = pgEnum('data_type_biz', [
  'TEXT',
  'NUMBER',
  'MONEY',
  'DATE',
  'BOOLEAN',
  'ENUM',
  'ARRAY',
  'OBJECT',
]);

export const entityTypeEnum = pgEnum('entity_type', [
  'table',
  'view',
  'api',
  'screen',
  'report',
  'master',
  'transactional',
  'reference',
]);

export const nodeTypeEnum = pgEnum('node_type', [
  'field',
  'entity',
  'table',
  'cell',
  'job',
  'api',
  'report',
]);

export const relationshipTypeEnum = pgEnum('relationship_type', [
  'depends_on',
  'produces',
  'transforms',
  'read',
  'write',
]);

export const mappingSourceEnum = pgEnum('mapping_source', [
  'manual',
  'ai-suggested',
]);

export const approvalStatusEnum = pgEnum('approval_status', [
  'pending',
  'approved',
  'rejected',
]);

export const lifecycleStatusEnum = pgEnum('lifecycle_status', [
  'draft',
  'active',
  'deprecated',
]);

// ============================================================================
// MDM_GLOBAL_METADATA Table
// ============================================================================

/**
 * Global Metadata Registry
 * Stores definitions of every field, entity, and concept.
 */
export const mdmGlobalMetadata = pgTable('mdm_global_metadata', {
  // Identity
  dictId: varchar('dict_id', { length: 50 }).primaryKey(), // e.g., "DS-8821"
  businessTerm: varchar('business_term', { length: 255 }).notNull(), // e.g., "Purchase Orders"
  technicalName: varchar('technical_name', { length: 255 }).notNull(), // e.g., "purchase_orders_main"
  version: varchar('version', { length: 20 }).notNull(), // e.g., "2.1.0"
  
  // Classification
  domain: varchar('domain', { length: 100 }),
  entityGroup: varchar('entity_group', { length: 100 }),
  tags: jsonb('tags').$type<string[]>().default([]),
  
  // Status
  canonStatus: canonStatusEnum('canon_status').notNull(),
  classification: classificationEnum('classification'),
  criticality: criticalityEnum('criticality'),
  
  // Ownership
  dataOwner: varchar('data_owner', { length: 255 }),
  dataSteward: varchar('data_steward', { length: 255 }),
  
  // Business Semantics
  definitionShort: text('definition_short'),
  definitionFull: text('definition_full'),
  calculationLogic: text('calculation_logic'),
  sourceOfTruth: varchar('source_of_truth', { length: 255 }),
  synonyms: jsonb('synonyms').$type<string[]>().default([]),
  
  // Technical Shape
  dataTypeBiz: dataTypeBizEnum('data_type_biz'),
  dataTypeTech: varchar('data_type_tech', { length: 50 }), // e.g., "VARCHAR(255)"
  precision: varchar('precision', { length: 50 }), // e.g., "DECIMAL(18,2)"
  nullability: boolean('nullability').default(false),
  formatPattern: varchar('format_pattern', { length: 255 }),
  validValues: jsonb('valid_values').$type<string[]>(),
  
  // Behavior
  exampleValues: jsonb('example_values').$type<string[]>().default([]),
  edgeCases: jsonb('edge_cases').$type<string[]>().default([]),
  defaultBehaviour: text('default_behaviour'),
  defaultInterpretation: text('default_interpretation'),
  
  // Relationships
  upstreamSrc: varchar('upstream_src', { length: 255 }),
  downstreamUse: jsonb('downstream_use').$type<string[]>().default([]),
  relatedTerms: jsonb('related_terms').$type<string[]>().default([]),
  
  // Governance
  complianceTags: jsonb('compliance_tags').$type<string[]>().default([]),
  approvalRequired: boolean('approval_required').default(false),
  lastCertified: timestamp('last_certified'),
  recertificationDue: timestamp('recertification_due'),
  
  // Risk & Quality
  errorsIfWrong: text('errors_if_wrong'),
  commonMisuses: jsonb('common_misuses').$type<string[]>().default([]),
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: varchar('created_by', { length: 255 }),
  updatedBy: varchar('updated_by', { length: 255 }),
});

export type MdmGlobalMetadataTable = typeof mdmGlobalMetadata.$inferSelect;
export type NewMdmGlobalMetadata = typeof mdmGlobalMetadata.$inferInsert;

// ============================================================================
// MDM_ENTITY_CATALOG Table
// ============================================================================

/**
 * Entity Catalog
 * Maintains authoritative list of all business entities.
 */
export const mdmEntityCatalog = pgTable('mdm_entity_catalog', {
  entityId: varchar('entity_id', { length: 50 }).primaryKey(), // e.g., "ORG_001"
  entityName: varchar('entity_name', { length: 255 }).notNull(),
  entityType: entityTypeEnum('entity_type').notNull(),
  system: varchar('system', { length: 255 }), // e.g., "ERP core", "submodule", "external"
  tenantScope: varchar('tenant_scope', { length: 255 }),
  criticality: criticalityEnum('criticality'),
  lifecycleStatus: lifecycleStatusEnum('lifecycle_status'),
  domain: varchar('domain', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type MdmEntityCatalogTable = typeof mdmEntityCatalog.$inferSelect;
export type NewMdmEntityCatalog = typeof mdmEntityCatalog.$inferInsert;

// ============================================================================
// MDM_METADATA_MAPPING Table
// ============================================================================

/**
 * Metadata Mappings
 * Maps local system fields to canonical metadata definitions.
 */
export const mdmMetadataMapping = pgTable('mdm_metadata_mapping', {
  mappingId: varchar('mapping_id', { length: 50 }).primaryKey(),
  localSystem: varchar('local_system', { length: 255 }).notNull(), // e.g., "SAP_ERP_PROD"
  localEntity: varchar('local_entity', { length: 255 }).notNull(), // e.g., "purchase_orders"
  localField: varchar('local_field', { length: 255 }).notNull(), // e.g., "po_id"
  canonicalMetadataId: varchar('canonical_metadata_id', { length: 50 }).notNull(), // References mdm_global_metadata.dict_id
  mappingSource: mappingSourceEnum('mapping_source'),
  approvalStatus: approvalStatusEnum('approval_status'),
  confidenceScore: integer('confidence_score'), // 0-100 (stored as integer, divide by 100 for 0.00-1.00)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type MdmMetadataMappingTable = typeof mdmMetadataMapping.$inferSelect;
export type NewMdmMetadataMapping = typeof mdmMetadataMapping.$inferInsert;

// ============================================================================
// MDM_LINEAGE_NODES Table
// ============================================================================

/**
 * Lineage Nodes
 * Represents fields, entities, tables, cells, jobs, APIs, reports in the lineage graph.
 */
export const mdmLineageNodes = pgTable('mdm_lineage_nodes', {
  nodeId: varchar('node_id', { length: 50 }).primaryKey(),
  nodeType: nodeTypeEnum('node_type').notNull(),
  nodeName: varchar('node_name', { length: 255 }).notNull(),
  system: varchar('system', { length: 255 }),
  domain: varchar('domain', { length: 100 }),
  criticality: criticalityEnum('criticality'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(), // JSONB flexible metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type MdmLineageNodeTable = typeof mdmLineageNodes.$inferSelect;
export type NewMdmLineageNode = typeof mdmLineageNodes.$inferInsert;

// ============================================================================
// MDM_LINEAGE_EDGES Table
// ============================================================================

/**
 * Lineage Edges
 * Represents relationships between nodes in the lineage graph.
 */
export const mdmLineageEdges = pgTable('mdm_lineage_edges', {
  edgeId: varchar('edge_id', { length: 50 }).primaryKey(),
  fromNodeId: varchar('from_node_id', { length: 50 }).notNull().references(() => mdmLineageNodes.nodeId),
  toNodeId: varchar('to_node_id', { length: 50 }).notNull().references(() => mdmLineageNodes.nodeId),
  relationship: relationshipTypeEnum('relationship').notNull(),
  frequency: varchar('frequency', { length: 50 }), // e.g., "daily", "real-time"
  lastObservedAt: timestamp('last_observed_at'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(), // JSONB flexible metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type MdmLineageEdgeTable = typeof mdmLineageEdges.$inferSelect;
export type NewMdmLineageEdge = typeof mdmLineageEdges.$inferInsert;

// ============================================================================
// MDM_NAMING_POLICY Table
// ============================================================================

/**
 * Naming Policy
 * Defines autonomy tiers and their allowed actions.
 */
export const mdmNamingPolicy = pgTable('mdm_naming_policy', {
  policyId: varchar('policy_id', { length: 50 }).primaryKey(),
  tier: integer('tier').notNull(), // Autonomy tier (0-3)
  allowedActions: jsonb('allowed_actions').$type<Array<'read' | 'write' | 'delete' | 'export'>>().default([]),
  constraints: jsonb('constraints').$type<Record<string, unknown>>(), // JSONB flexible constraints
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type MdmNamingPolicyTable = typeof mdmNamingPolicy.$inferSelect;
export type NewMdmNamingPolicy = typeof mdmNamingPolicy.$inferInsert;
