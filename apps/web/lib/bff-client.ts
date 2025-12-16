/**
 * BFF Client - Browser-Safe API Client
 * 
 * This client is safe to use in browser (Client Components).
 * It only calls Next.js BFF routes (/api/meta/*), NEVER backend services directly.
 * 
 * Benefits:
 * - Backend URLs hidden from browser
 * - Auth handled server-side automatically
 * - Same-origin requests (no CORS)
 * - Type-safe with @ai-bos/shared types
 * 
 * @see PRD_BFF_01_NEXTJS_BFF.md
 */

import type {
  GovernanceDashboardResponse,
  MetadataFieldsResponse,
  MetadataFieldDto,
  MetadataFieldsFilter,
  CreateMetadataFieldInput,
  PrismComparisonResponse,
  RiskRadarResponse,
  EntityTreeResponse,
  EntityDto,
  CreateEntityInput,
  HealthScanResponse,
} from '@ai-bos/shared';

// BFF base path (relative to same origin)
const BFF_BASE = '/api/meta';

/**
 * Error class for BFF errors
 */
export class BffError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'BffError';
  }
}

/**
 * Base fetch wrapper for BFF calls
 */
async function bffFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${BFF_BASE}${path}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new BffError(
        data.error || `Request failed: ${response.status}`,
        response.status,
        data.details,
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof BffError) {
      throw error;
    }

    // Network error
    throw new BffError(
      error instanceof Error ? error.message : 'Network error',
      0,
    );
  }
}

// =============================================================================
// GOVERNANCE (META_01, META_04, META_06)
// =============================================================================

/**
 * Get governance dashboard data (META_01)
 */
export async function getGovernanceDashboard(): Promise<GovernanceDashboardResponse> {
  return bffFetch<GovernanceDashboardResponse>('/governance/dashboard');
}

/**
 * Get risk radar data (META_04)
 */
export async function getRiskRadar(): Promise<RiskRadarResponse> {
  return bffFetch<RiskRadarResponse>('/governance/risks');
}

/**
 * Get health scan data (META_06)
 */
export async function getHealthScan(): Promise<HealthScanResponse> {
  return bffFetch<HealthScanResponse>('/governance/health');
}

// =============================================================================
// FIELDS (META_02, META_03)
// =============================================================================

/**
 * Get paginated list of metadata fields (META_02 God View)
 */
export async function getFields(
  params?: MetadataFieldsFilter,
): Promise<MetadataFieldsResponse> {
  const searchParams = new URLSearchParams();

  if (params) {
    if (params.q) searchParams.set('q', params.q);
    if (params.domain) searchParams.set('domain', params.domain);
    if (params.module) searchParams.set('module', params.module);
    if (params.tier) searchParams.set('tier', params.tier);
    if (params.status) searchParams.set('status', params.status);
    if (params.entity_urn) searchParams.set('entity_urn', params.entity_urn);
    if (params.standard_pack_id) searchParams.set('standard_pack_id', params.standard_pack_id);
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
  }

  const query = searchParams.toString();
  return bffFetch<MetadataFieldsResponse>(`/fields${query ? `?${query}` : ''}`);
}

/**
 * Get a single field by ID
 */
export async function getField(id: string): Promise<MetadataFieldDto> {
  return bffFetch<MetadataFieldDto>(`/fields/${encodeURIComponent(id)}`);
}

/**
 * Create a new metadata field
 */
export async function createField(
  input: CreateMetadataFieldInput,
): Promise<MetadataFieldDto> {
  return bffFetch<MetadataFieldDto>('/fields', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/**
 * Get field mappings across systems (META_03 Prism)
 */
export async function getFieldMappings(
  canonicalKey: string,
): Promise<PrismComparisonResponse> {
  return bffFetch<PrismComparisonResponse>(
    `/fields/${encodeURIComponent(canonicalKey)}/mappings`,
  );
}

// =============================================================================
// ENTITIES (META_05)
// =============================================================================

/**
 * Get entity tree (META_05 Canon Matrix)
 */
export async function getEntityTree(): Promise<EntityTreeResponse> {
  return bffFetch<EntityTreeResponse>('/entities/tree');
}

/**
 * Get list of entities
 */
export async function getEntities(
  params?: { domain?: string; module?: string; q?: string },
): Promise<{ data: EntityDto[]; total: number }> {
  const searchParams = new URLSearchParams();

  if (params) {
    if (params.domain) searchParams.set('domain', params.domain);
    if (params.module) searchParams.set('module', params.module);
    if (params.q) searchParams.set('q', params.q);
  }

  const query = searchParams.toString();
  return bffFetch<{ data: EntityDto[]; total: number }>(
    `/entities${query ? `?${query}` : ''}`,
  );
}

/**
 * Get a single entity by URN
 */
export async function getEntity(urn: string): Promise<EntityDto> {
  return bffFetch<EntityDto>(`/entities/${encodeURIComponent(urn)}`);
}

/**
 * Create a new entity
 */
export async function createEntity(input: CreateEntityInput): Promise<EntityDto> {
  return bffFetch<EntityDto>('/entities', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// =============================================================================
// EXPORT CLIENT OBJECT
// =============================================================================

/**
 * BFF Client - Use this in Client Components
 * 
 * @example
 * ```tsx
 * 'use client';
 * import { bffClient } from '@/lib/bff-client';
 * 
 * const fields = await bffClient.getFields({ domain: 'finance' });
 * ```
 */
export const bffClient = {
  // Governance
  getGovernanceDashboard,
  getRiskRadar,
  getHealthScan,

  // Fields
  getFields,
  getField,
  createField,
  getFieldMappings,

  // Entities
  getEntityTree,
  getEntities,
  getEntity,
  createEntity,
};

export default bffClient;

// Re-export types for convenience
export type {
  GovernanceDashboardResponse,
  MetadataFieldsResponse,
  MetadataFieldDto,
  MetadataFieldsFilter,
  CreateMetadataFieldInput,
  PrismComparisonResponse,
  RiskRadarResponse,
  EntityTreeResponse,
  EntityDto,
  CreateEntityInput,
  HealthScanResponse,
} from '@ai-bos/shared';
