/**
 * Kernel API Client - The Nervous System
 * 
 * Type-safe client for communicating with the AIBOS Kernel (apps/kernel).
 * Uses shared types from @aibos/schemas to guarantee type safety between Frontend and Backend.
 * 
 * @see PRD_KERNEL_01_AIBOS_KERNEL.md
 * @see packages/schemas/src/kernel.ts
 */

import type {
  MetadataSearchRequest,
  MetadataSearchResponse,
  MetadataFieldResponse,
  FieldContextResponse,
  EntityContextResponse,
  LineageGraphRequest,
  LineageGraphResponse,
} from '@aibos/schemas/kernel';

/**
 * Get Kernel API base URL from environment
 * Falls back to localhost:3001 in development
 */
function getKernelUrl(): string {
  if (typeof window !== 'undefined') {
    // Client-side: Use NEXT_PUBLIC_KERNEL_URL
    return process.env.NEXT_PUBLIC_KERNEL_URL || 'http://localhost:3001';
  }
  // Server-side: Use same fallback
  return process.env.NEXT_PUBLIC_KERNEL_URL || 'http://localhost:3001';
}

/**
 * Base fetch wrapper with error handling and Next.js caching
 */
async function kernelFetch<T>(
  endpoint: string,
  options?: RequestInit & {
    next?: { revalidate?: number | false }
  }
): Promise<T> {
  const baseUrl = getKernelUrl();
  const url = `${baseUrl}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      next: {
        // Cache for 60 seconds by default, or use provided revalidate
        revalidate: options?.next?.revalidate ?? 60,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Kernel API error (${response.status}): ${errorText || response.statusText}`
      );
    }

    return response.json() as Promise<T>;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to connect to Kernel: ${error.message}`);
    }
    throw new Error('Failed to connect to Kernel: Unknown error');
  }
}

// ============================================================================
// METADATA DOMAIN - Field & Entity Operations
// ============================================================================

/**
 * Search metadata fields
 * GET /metadata/fields/search
 */
export async function searchMetadataFields(
  request: MetadataSearchRequest
): Promise<MetadataSearchResponse> {
  const params = new URLSearchParams();

  if (request.q) params.append('q', request.q);
  if (request.domain) params.append('domain', request.domain);
  if (request.entity_group) params.append('entity_group', request.entity_group);
  if (request.canon_status) params.append('canon_status', request.canon_status);
  if (request.classification) params.append('classification', request.classification);
  if (request.criticality) params.append('criticality', request.criticality);
  params.append('limit', String(request.limit || 20));
  params.append('offset', String(request.offset || 0));

  return kernelFetch<MetadataSearchResponse>(
    `/metadata/fields/search?${params.toString()}`
  );
}

/**
 * Get metadata field by ID
 * GET /metadata/fields/{dict_id}
 */
export async function getMetadataField(
  dictId: string
): Promise<MetadataFieldResponse> {
  return kernelFetch<MetadataFieldResponse>(`/metadata/fields/${dictId}`);
}

/**
 * Get complete field context for sidebar (Silent Killer Frontend)
 * GET /metadata/context/field/{dict_id}
 */
export async function getFieldContext(
  dictId: string
): Promise<FieldContextResponse> {
  return kernelFetch<FieldContextResponse>(`/metadata/context/field/${dictId}`);
}

/**
 * Get entity context for screen rendering
 * GET /metadata/context/entity/{entity_id}
 */
export async function getEntityContext(
  entityId: string
): Promise<EntityContextResponse> {
  return kernelFetch<EntityContextResponse>(`/metadata/context/entity/${entityId}`);
}

/**
 * List all entities in catalog
 * GET /metadata/entities
 */
export async function listEntities(options?: {
  domain?: string;
  type?: string;
}): Promise<{ entities: unknown[]; total: number }> {
  const params = new URLSearchParams();
  if (options?.domain) params.append('domain', options.domain);
  if (options?.type) params.append('type', options.type);

  const query = params.toString();
  return kernelFetch<{ entities: unknown[]; total: number }>(
    `/metadata/entities${query ? `?${query}` : ''}`
  );
}

/**
 * Get all fields for an entity
 * GET /metadata/entities/{entity_id}/fields
 */
export async function getEntityFields(
  entityId: string
): Promise<{ entity_id: string; fields: unknown[] }> {
  return kernelFetch<{ entity_id: string; fields: unknown[] }>(
    `/metadata/entities/${entityId}/fields`
  );
}

/**
 * Lookup mapping for a local field
 * GET /metadata/mappings/lookup
 */
export async function lookupMapping(
  field: string,
  system?: string
): Promise<{ mapping: unknown | null }> {
  const params = new URLSearchParams();
  params.append('field', field);
  if (system) params.append('system', system);

  return kernelFetch<{ mapping: unknown | null }>(
    `/metadata/mappings/lookup?${params.toString()}`
  );
}

/**
 * Suggest mappings for local fields
 * POST /metadata/mappings/suggest
 */
export async function suggestMappings(
  localFields: string[]
): Promise<{ suggestions: unknown[] }> {
  return kernelFetch<{ suggestions: unknown[] }>('/metadata/mappings/suggest', {
    method: 'POST',
    body: JSON.stringify({ local_fields: localFields }),
  });
}

// ============================================================================
// LINEAGE DOMAIN - Graph & Impact Operations
// ============================================================================

/**
 * Get lineage graph for a node
 * GET /lineage/graphForNode
 */
export async function getLineageGraph(
  request: LineageGraphRequest
): Promise<LineageGraphResponse> {
  const params = new URLSearchParams();
  params.append('node_id', request.node_id);
  params.append('depth', String(request.depth || 3));
  params.append('direction', request.direction || 'both');

  return kernelFetch<LineageGraphResponse>(
    `/lineage/graphForNode?${params.toString()}`
  );
}

/**
 * Get impact report for a node
 * GET /lineage/impactReport
 */
export async function getImpactReport(
  nodeId: string
): Promise<{
  node_id: string;
  node_name: string;
  impact_level: 'critical' | 'high' | 'medium' | 'low';
  upstream_impact: { count: number; critical_paths: string[] };
  downstream_impact: { count: number; critical_paths: string[] };
  affected_systems: string[];
  risk_assessment?: string;
}> {
  const params = new URLSearchParams();
  params.append('node_id', nodeId);

  return kernelFetch(`/lineage/impactReport?${params.toString()}`);
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * Check Kernel health
 * GET /health
 */
export async function checkKernelHealth(): Promise<{
  status: string;
  service: string;
  uptime?: number;
}> {
  return kernelFetch('/health');
}

/**
 * Check Kernel database health
 * GET /health/db
 */
export async function checkKernelDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  service: string;
  database: 'connected' | 'disconnected';
  latency?: string;
  error?: string;
}> {
  return kernelFetch('/health/db');
}

// ============================================================================
// EXPORT DEFAULT CLIENT OBJECT
// ============================================================================

export const kernelClient = {
  // Metadata
  searchMetadataFields,
  getMetadataField,
  getFieldContext,
  getEntityContext,
  listEntities,
  getEntityFields,
  lookupMapping,
  suggestMappings,

  // Lineage
  getLineageGraph,
  getImpactReport,

  // Health
  checkKernelHealth,
  checkKernelDatabaseHealth,
};

export default kernelClient;
