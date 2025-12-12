/**
 * @aibos/schemas - Kernel API Contract Types
 * 
 * TypeScript types and Zod schemas for Kernel API requests/responses.
 * These define the contract between Kernel (apps/kernel) and consumers (apps/web, orchestras).
 * 
 * @see PRD_KERNEL_01_AIBOS_KERNEL.md Section 4 (API Contract)
 */

import { z } from 'zod';
import type { MdmGlobalMetadata, MdmEntityCatalog, MdmLineageNode, MdmLineageEdge } from './metadata.js';

// ============================================================================
// METADATA DOMAIN - Request/Response Types
// ============================================================================

/**
 * GET /metadata/fields/search
 * Constitution Service: metadata.fields.search(query, filters)
 */
export const MetadataSearchRequestSchema = z.object({
  q: z.string().optional(), // Search query
  domain: z.string().optional(),
  entity_group: z.string().optional(),
  canon_status: z.string().optional(),
  classification: z.string().optional(),
  criticality: z.string().optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
});

export type MetadataSearchRequest = z.infer<typeof MetadataSearchRequestSchema>;

export const MetadataSearchResponseSchema = z.object({
  results: z.array(z.any()), // MdmGlobalMetadata[]
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
});

export type MetadataSearchResponse = z.infer<typeof MetadataSearchResponseSchema>;

/**
 * GET /metadata/fields/{dict_id}
 * Constitution Service: metadata.fields.describe(id)
 */
export const MetadataFieldResponseSchema = z.object({
  // Full MdmGlobalMetadata object
}).passthrough(); // Use MdmGlobalMetadataSchema

export type MetadataFieldResponse = MdmGlobalMetadata;

/**
 * GET /metadata/context/field/{dict_id}
 * Silent Killer Frontend: Complete field context for sidebar
 */
export const FieldContextResponseSchema = z.object({
  field: z.any(), // MdmGlobalMetadata
  owner: z.object({
    name: z.string(),
    email: z.string().optional(),
    role: z.string().optional(),
  }).optional(),
  lineage_summary: z.object({
    upstream_count: z.number().int().nonnegative(),
    downstream_count: z.number().int().nonnegative(),
    critical_paths: z.array(z.string()).default([]),
  }).optional(),
  ai_suggestions: z.array(z.object({
    type: z.enum(['mapping', 'quality', 'compliance', 'optimization']),
    message: z.string(),
    confidence: z.number().min(0).max(1),
  })).default([]),
  quality_signals: z.object({
    completeness_score: z.number().min(0).max(1),
    freshness: z.string().optional(), // ISO date
    anomalies: z.array(z.string()).default([]),
  }).optional(),
});

export type FieldContextResponse = z.infer<typeof FieldContextResponseSchema>;

/**
 * GET /metadata/context/entity/{entity_id}
 * Silent Killer Frontend: Entity-level context for screen rendering
 */
export const EntityContextResponseSchema = z.object({
  entity: z.any(), // MdmEntityCatalog
  fields: z.array(z.any()).default([]), // MdmGlobalMetadata[]
  mappings: z.array(z.any()).default([]), // MdmMetadataMapping[]
  quality_signals: z.object({
    overall_score: z.number().min(0).max(1),
    field_coverage: z.number().min(0).max(1),
    mapping_coverage: z.number().min(0).max(1),
  }).optional(),
  compliance_status: z.object({
    standards: z.array(z.string()).default([]), // e.g., ["MFRS", "IFRS", "GDPR"]
    control_status: z.record(z.enum(['compliant', 'non-compliant', 'unknown'])).optional(),
  }).optional(),
});

export type EntityContextResponse = z.infer<typeof EntityContextResponseSchema>;

// ============================================================================
// LINEAGE DOMAIN - Request/Response Types
// ============================================================================

/**
 * GET /lineage/graphForNode
 * Constitution Service: lineage.graphForNode(node_id, depth, direction)
 */
export const LineageGraphRequestSchema = z.object({
  node_id: z.string().min(1),
  depth: z.number().int().positive().max(10).default(3),
  direction: z.enum(['upstream', 'downstream', 'both']).default('both'),
});

export type LineageGraphRequest = z.infer<typeof LineageGraphRequestSchema>;

export const LineageGraphResponseSchema = z.object({
  nodes: z.array(z.any()), // MdmLineageNode[]
  edges: z.array(z.any()), // MdmLineageEdge[]
  root_node_id: z.string(),
  depth: z.number().int().nonnegative(),
  direction: z.enum(['upstream', 'downstream', 'both']),
});

export type LineageGraphResponse = z.infer<typeof LineageGraphResponseSchema>;

/**
 * GET /lineage/impactReport
 * Constitution Service: lineage.impactReport(node_id)
 */
export const LineageImpactResponseSchema = z.object({
  node_id: z.string(),
  node_name: z.string(),
  impact_level: z.enum(['critical', 'high', 'medium', 'low']),
  upstream_impact: z.object({
    count: z.number().int().nonnegative(),
    critical_paths: z.array(z.string()).default([]),
  }),
  downstream_impact: z.object({
    count: z.number().int().nonnegative(),
    critical_paths: z.array(z.string()).default([]),
  }),
  affected_systems: z.array(z.string()).default([]),
  risk_assessment: z.string().optional(),
});

export type LineageImpactResponse = z.infer<typeof LineageImpactResponseSchema>;

/**
 * POST /lineage/registerNode
 * Constitution Service: lineage.registerNode(node)
 */
export const LineageRegisterNodeRequestSchema = z.object({
  node_id: z.string().min(1),
  node_type: z.enum(['field', 'entity', 'table', 'cell', 'job', 'api', 'report']),
  node_name: z.string().min(1),
  system: z.string().optional(),
  domain: z.string().optional(),
  criticality: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type LineageRegisterNodeRequest = z.infer<typeof LineageRegisterNodeRequestSchema>;

/**
 * POST /lineage/registerEdge
 * Constitution Service: lineage.registerEdge(edge)
 */
export const LineageRegisterEdgeRequestSchema = z.object({
  from_node_id: z.string().min(1),
  to_node_id: z.string().min(1),
  relationship: z.enum(['depends_on', 'produces', 'transforms', 'read', 'write']),
  frequency: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type LineageRegisterEdgeRequest = z.infer<typeof LineageRegisterEdgeRequestSchema>;

// ============================================================================
// POLICY DOMAIN - Request/Response Types
// ============================================================================

/**
 * POST /policy/dataAccess/check
 * Constitution Service: policy.dataAccess.check(actor, resource, intent)
 */
export const PolicyCheckRequestSchema = z.object({
  actor: z.object({
    type: z.enum(['user', 'cell', 'orchestra', 'agent']),
    id: z.string().min(1),
    orchestra_name: z.string().optional(),
    tier: z.number().int().min(0).max(3).optional(), // REQUIRED for orchestras
  }),
  action: z.enum(['read', 'write', 'delete', 'export']),
  resource: z.object({
    type: z.enum(['field', 'entity', 'table', 'api', 'screen']),
    id: z.string().min(1),
  }),
  intent: z.string().optional(), // Human-readable intent for audit
  context: z.record(z.unknown()).optional(),
});

export type PolicyCheckRequest = z.infer<typeof PolicyCheckRequestSchema>;

export const PolicyCheckResponseSchema = z.object({
  allowed: z.boolean(),
  reason: z.string().optional(),
  constraints: z.object({
    max_rows: z.number().int().positive().optional(),
    allowed_columns: z.array(z.string()).optional(),
    time_window: z.object({
      start: z.string().datetime(),
      end: z.string().datetime(),
    }).optional(),
  }).optional(),
  tier_limit: z.number().int().min(0).max(3).optional(), // If rejected due to tier
});

export type PolicyCheckResponse = z.infer<typeof PolicyCheckResponseSchema>;

/**
 * POST /policy/changeRequest/create
 * Constitution Service: policy.changeRequest.create(entity, proposed_change)
 */
export const ChangeRequestCreateRequestSchema = z.object({
  entity_id: z.string().min(1),
  entity_type: z.enum(['field', 'entity', 'table', 'schema', 'policy']),
  change_type: z.enum(['create', 'update', 'delete', 'migrate']),
  proposed_change: z.record(z.unknown()), // Flexible change payload
  rationale: z.string().optional(),
  impact_assessment: z.string().optional(),
  requested_by: z.string().min(1), // User ID
});

export type ChangeRequestCreateRequest = z.infer<typeof ChangeRequestCreateRequestSchema>;

export const ChangeRequestCreateResponseSchema = z.object({
  change_request_id: z.string(),
  status: z.enum(['pending', 'approved', 'rejected']),
  requires_approval: z.boolean(),
  approvers: z.array(z.string()).default([]),
  estimated_impact: z.enum(['critical', 'high', 'medium', 'low']).optional(),
});

export type ChangeRequestCreateResponse = z.infer<typeof ChangeRequestCreateResponseSchema>;

/**
 * GET /policy/controlStatus/list
 * Constitution Service: policy.controlStatus.list(standard, scope)
 */
export const ControlStatusListRequestSchema = z.object({
  standard: z.enum(['MFRS', 'IFRS', 'GDPR', 'PDPA', 'SOC2', 'ISO']).optional(),
  scope: z.string().optional(), // e.g., "Finance", "HR"
});

export type ControlStatusListRequest = z.infer<typeof ControlStatusListRequestSchema>;

export const ControlStatusListResponseSchema = z.object({
  controls: z.array(z.object({
    control_id: z.string(),
    standard: z.string(),
    name: z.string(),
    status: z.enum(['compliant', 'non-compliant', 'unknown', 'not-applicable']),
    mapped_entities: z.array(z.string()).default([]),
    last_verified: z.string().datetime().optional(),
  })),
  coverage: z.object({
    total_controls: z.number().int().nonnegative(),
    compliant: z.number().int().nonnegative(),
    non_compliant: z.number().int().nonnegative(),
    unknown: z.number().int().nonnegative(),
  }),
});

export type ControlStatusListResponse = z.infer<typeof ControlStatusListResponseSchema>;

// ============================================================================
// EVENTS DOMAIN - Request/Response Types
// ============================================================================

/**
 * POST /events/emit
 * Motor Cortex: Event orchestration
 */
export const EventEmitRequestSchema = z.object({
  event_type: z.string().min(1), // e.g., "invoice.created"
  source: z.object({
    cell_id: z.string().min(1),
    user_id: z.string().optional(),
  }),
  payload: z.record(z.unknown()), // Flexible event payload
  metadata: z.object({
    correlation_id: z.string().optional(),
    trace_id: z.string().optional(),
  }).optional(),
});

export type EventEmitRequest = z.infer<typeof EventEmitRequestSchema>;

export const EventEmitResponseSchema = z.object({
  event_id: z.string(),
  status: z.enum(['accepted', 'rejected']),
  validation_errors: z.array(z.string()).optional(),
  routed_to: z.array(z.string()).default([]), // Cell IDs that will receive this event
  queued_at: z.string().datetime().optional(),
});

export type EventEmitResponse = z.infer<typeof EventEmitResponseSchema>;

// ============================================================================
// ORCHESTRAS DOMAIN
// ============================================================================

/**
 * POST /orchestras/validate
 * Validates orchestra manifest against Kernel policies
 */
export const OrchestraValidateRequestSchema = z.object({
  manifest: z.object({
    name: z.string().min(1),
    domain: z.string().optional(),
    conductor: z.object({
      id: z.string().min(1),
      model: z.string().optional(),
      role: z.string().optional(),
    }).optional(),
    agents: z.array(z.object({
      id: z.string().min(1),
      role: z.string().optional(),
      tools: z.array(z.string()).default([]),
      max_autonomy_tier: z.number().int().min(0).max(3),
    })).default([]),
    policies: z.record(z.unknown()).optional(),
  }),
});

export type OrchestraValidateRequest = z.infer<typeof OrchestraValidateRequestSchema>;

export const OrchestraValidateResponseSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  tier_restrictions: z.array(z.object({
    agent_id: z.string(),
    requested_tier: z.number().int(),
    allowed_tier: z.number().int(),
    reason: z.string(),
  })).default([]),
});

export type OrchestraValidateResponse = z.infer<typeof OrchestraValidateResponseSchema>;
