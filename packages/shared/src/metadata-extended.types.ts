// ============================================================================
// METADATA EXTENDED TYPES - Lineage, Impact, KPIs, Search
// ============================================================================
// Derived from .tempo feature modules (GRCD v4.1.0 Compliant)
// These are additive features that don't conflict with existing schema.
// ============================================================================

import { z } from 'zod';

// =============================================================================
// 1. LINEAGE TYPES
// =============================================================================

// -----------------------------------------------------------------------------
// Lineage Node Types
// -----------------------------------------------------------------------------
export const LineageNodeTypeEnum = z.enum([
  'field',
  'entity',
  'kpi',
  'report',
  'transformation',
  'source',
]);

export type LineageNodeType = z.infer<typeof LineageNodeTypeEnum>;

// -----------------------------------------------------------------------------
// Lineage Edge Types
// -----------------------------------------------------------------------------
export const LineageEdgeTypeEnum = z.enum([
  'produces',
  'consumes',
  'derived_from',
  'transforms',
  'references',
]);

export type LineageEdgeType = z.infer<typeof LineageEdgeTypeEnum>;

// -----------------------------------------------------------------------------
// Lineage Node Schema
// -----------------------------------------------------------------------------
export const ZLineageNode = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  urn: z.string().min(1),
  nodeType: LineageNodeTypeEnum,
  entityId: z.string().uuid().nullable(),
  entityType: z.string().nullable(),
  label: z.string().nullable(),
  description: z.string().nullable(),
  metadata: z.record(z.any()).default({}),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type LineageNode = z.infer<typeof ZLineageNode>;

export const ZCreateLineageNode = ZLineageNode.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateLineageNode = z.infer<typeof ZCreateLineageNode>;

// -----------------------------------------------------------------------------
// Lineage Edge Schema
// -----------------------------------------------------------------------------
export const ZLineageEdge = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  sourceUrn: z.string().min(1),
  targetUrn: z.string().min(1),
  edgeType: LineageEdgeTypeEnum,
  transformation: z.string().nullable(),
  metadata: z.record(z.any()).default({}),
  createdAt: z.string(),
});

export type LineageEdge = z.infer<typeof ZLineageEdge>;

export const ZCreateLineageEdge = ZLineageEdge.omit({
  id: true,
  createdAt: true,
});

export type CreateLineageEdge = z.infer<typeof ZCreateLineageEdge>;

// -----------------------------------------------------------------------------
// Lineage Graph Response
// -----------------------------------------------------------------------------
export const ZLineageGraph = z.object({
  nodes: z.array(ZLineageNode),
  edges: z.array(ZLineageEdge),
});

export type LineageGraph = z.infer<typeof ZLineageGraph>;

// -----------------------------------------------------------------------------
// Lineage Traversal Options
// -----------------------------------------------------------------------------
export interface LineageTraversalOptions {
  direction: 'upstream' | 'downstream' | 'both';
  depth?: number;
  edgeTypes?: LineageEdgeType[];
  nodeTypes?: LineageNodeType[];
}

// =============================================================================
// 2. IMPACT ANALYSIS TYPES
// =============================================================================

// -----------------------------------------------------------------------------
// Impact Types
// -----------------------------------------------------------------------------
export const ImpactTypeEnum = z.enum(['breaks', 'degrades', 'warns', 'safe']);

export type ImpactType = z.infer<typeof ImpactTypeEnum>;

// -----------------------------------------------------------------------------
// Change Types
// -----------------------------------------------------------------------------
export const ChangeTypeEnum = z.enum([
  'field_update',
  'field_delete',
  'sot_change',
  'kpi_change',
  'tier_change',
  'entity_delete',
  'schema_change',
]);

export type ChangeType = z.infer<typeof ChangeTypeEnum>;

// -----------------------------------------------------------------------------
// Affected Asset
// -----------------------------------------------------------------------------
export const ZAffectedAsset = z.object({
  urn: z.string(),
  type: LineageNodeTypeEnum,
  impactType: ImpactTypeEnum,
  reason: z.string(),
  distance: z.number().int().min(0),
  governanceTier: z.string().optional(),
  affectedUsers: z.number().int().min(0).optional(),
  affectedWorkflows: z.array(z.string()).optional(),
  estimatedDowntime: z.string().optional(),
  metadata: z.record(z.any()).default({}),
});

export type AffectedAsset = z.infer<typeof ZAffectedAsset>;

// -----------------------------------------------------------------------------
// Impact Report
// -----------------------------------------------------------------------------
export const ZImpactReport = z.object({
  sourceChange: z.object({
    urn: z.string(),
    entityType: z.string(),
    changeType: ChangeTypeEnum,
    description: z.string(),
  }),
  totalAffected: z.number().int().min(0),
  criticalImpacts: z.array(ZAffectedAsset),
  warnings: z.array(ZAffectedAsset),
  safeChanges: z.array(ZAffectedAsset),
  riskScore: z.number().min(0).max(100),
  recommendation: z.enum(['proceed', 'review', 'block']),
  estimatedImpact: z.object({
    users: z.number().int().min(0),
    workflows: z.number().int().min(0),
    revenue: z.string().optional(),
  }),
  blastRadius: z.object({
    direct: z.number().int().min(0),
    indirect: z.number().int().min(0),
    maxDepth: z.number().int().min(0),
  }),
  createdAt: z.string(),
});

export type ImpactReport = z.infer<typeof ZImpactReport>;

// -----------------------------------------------------------------------------
// Impact Analysis Request
// -----------------------------------------------------------------------------
export interface ImpactAnalysisRequest {
  urn: string;
  changeType: ChangeType;
  description?: string;
  options?: {
    maxDepth?: number;
    includeUpstream?: boolean;
    includeDownstream?: boolean;
    filterByTier?: string[];
  };
}

// =============================================================================
// 3. COMPOSITE KPI TYPES
// =============================================================================

// -----------------------------------------------------------------------------
// KPI Component (Numerator/Denominator)
// -----------------------------------------------------------------------------
export const ZKPIComponent = z.object({
  fieldId: z.string().uuid(),
  expression: z.string().nullable(),
  standardPackId: z.string().uuid().nullable(),
  description: z.string().nullable(),
});

export type KPIComponent = z.infer<typeof ZKPIComponent>;

// -----------------------------------------------------------------------------
// Composite KPI
// -----------------------------------------------------------------------------
export const ZCompositeKPI = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  canonicalKey: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable(),
  numerator: ZKPIComponent,
  denominator: ZKPIComponent,
  governanceTier: z.string(),
  standardPackId: z.string().uuid().nullable(),
  ownerId: z.string().uuid().nullable(),
  stewardId: z.string().uuid().nullable(),
  entityUrn: z.string().nullable(),
  domain: z.string().nullable(),
  tags: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  isDeprecated: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CompositeKPI = z.infer<typeof ZCompositeKPI>;

export const ZCreateCompositeKPI = ZCompositeKPI.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateCompositeKPI = z.infer<typeof ZCreateCompositeKPI>;

// -----------------------------------------------------------------------------
// KPI Validation Result
// -----------------------------------------------------------------------------
export const ZKPIValidationResult = z.object({
  isValid: z.boolean(),
  violations: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  numeratorValidation: z.object({
    hasField: z.boolean(),
    hasStandardPack: z.boolean(),
    hasLineage: z.boolean().optional(),
  }),
  denominatorValidation: z.object({
    hasField: z.boolean(),
    hasStandardPack: z.boolean(),
    hasLineage: z.boolean().optional(),
  }),
});

export type KPIValidationResult = z.infer<typeof ZKPIValidationResult>;

// =============================================================================
// 4. SEARCH TYPES
// =============================================================================

// -----------------------------------------------------------------------------
// Search Filters
// -----------------------------------------------------------------------------
export const ZSearchFilters = z.object({
  domain: z.string().optional(),
  governanceTier: z.string().optional(),
  standardPackId: z.string().uuid().optional(),
  standardPackName: z.string().optional(),
  owner: z.string().optional(),
  steward: z.string().optional(),
  entityType: z
    .enum([
      'field',
      'entity',
      'kpi',
      'standard_pack',
    ])
    .optional(),
  hasLineage: z.boolean().optional(),
  createdAfter: z.string().optional(),
  createdBefore: z.string().optional(),
});

export type SearchFilters = z.infer<typeof ZSearchFilters>;

// -----------------------------------------------------------------------------
// Search Result Item
// -----------------------------------------------------------------------------
export const ZSearchResultItem = z.object({
  id: z.string().uuid(),
  entityType: z.enum(['field', 'entity', 'kpi', 'standard_pack']),
  canonicalKey: z.string().min(1),
  label: z.string().min(1),
  description: z.string().nullable(),
  domain: z.string().nullable(),
  governanceTier: z.string().nullable(),
  standardPackId: z.string().uuid().nullable(),
  standardPackName: z.string().nullable(),
  owner: z.string().nullable(),
  steward: z.string().nullable(),
  entityUrn: z.string().nullable(),
  relevanceScore: z.number().min(0).max(1),
  matchedFields: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type SearchResultItem = z.infer<typeof ZSearchResultItem>;

// -----------------------------------------------------------------------------
// Search Results Response
// -----------------------------------------------------------------------------
export interface SearchResults {
  query: string;
  filters: SearchFilters;
  totalResults: number;
  results: SearchResultItem[];
  facets: {
    byEntityType: Record<string, number>;
    byGovernanceTier: Record<string, number>;
    byDomain: Record<string, number>;
    byStandardPack: Record<string, number>;
  };
  executionTimeMs: number;
}

// -----------------------------------------------------------------------------
// Search Options
// -----------------------------------------------------------------------------
export interface SearchOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'relevance' | 'createdAt' | 'updatedAt' | 'label';
  sortOrder?: 'asc' | 'desc';
  includeInactive?: boolean;
  minRelevanceScore?: number;
}

// =============================================================================
// 5. BUSINESS TERM TYPES (Glossary)
// =============================================================================

export const ZBusinessTerm = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  canonicalKey: z.string().min(1),
  label: z.string().min(1),
  description: z.string().nullable(),
  domain: z.string().nullable(),
  module: z.string().nullable(),
  synonyms: z.array(z.string()).default([]),
  governanceTier: z.string().default('tier3'),
  standardPackId: z.string().uuid().nullable(),
  entityUrn: z.string().nullable(),
  ownerId: z.string().uuid().nullable(),
  stewardId: z.string().uuid().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type BusinessTerm = z.infer<typeof ZBusinessTerm>;

export const ZCreateBusinessTerm = ZBusinessTerm.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateBusinessTerm = z.infer<typeof ZCreateBusinessTerm>;
