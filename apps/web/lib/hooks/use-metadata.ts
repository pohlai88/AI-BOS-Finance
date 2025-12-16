'use client';

/**
 * React Hooks for Metadata Studio API
 * 
 * These hooks provide type-safe data fetching with SWR for:
 * - Caching & Deduplication
 * - Automatic Revalidation
 * - Optimistic Updates
 * - Error Handling
 */

import useSWR, { SWRConfiguration, mutate } from 'swr';
import useSWRMutation from 'swr/mutation';
import bffClient, {
  type GovernanceDashboardResponse,
  type RiskRadarResponse,
  type HealthScanResponse,
  type MetadataFieldsResponse,
  type MetadataFieldDto,
  type EntityTreeResponse,
  type EntityDto,
  type PrismComparisonResponse,
  type CreateMetadataFieldInput,
  type CreateEntityInput,
} from '../bff-client';

// =============================================================================
// SWR Configuration Defaults
// =============================================================================

const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 2000,
  errorRetryCount: 3,
};

// =============================================================================
// Governance Hooks (META_01, META_04, META_06)
// =============================================================================

/**
 * Fetch governance dashboard data
 * Used by: META_01 Schema Governance Control Center
 */
export function useGovernanceDashboard(config?: SWRConfiguration) {
  return useSWR<GovernanceDashboardResponse>(
    '/api/meta/governance/dashboard',
    () => bffClient.getGovernanceDashboard(),
    { ...defaultConfig, refreshInterval: 30000, ...config },
  );
}

/**
 * Fetch risk radar data
 * Used by: META_04 Risk Radar
 */
export function useRiskRadar(config?: SWRConfiguration) {
  return useSWR<RiskRadarResponse>(
    '/api/meta/governance/risks',
    () => bffClient.getRiskRadar(),
    { ...defaultConfig, refreshInterval: 30000, ...config },
  );
}

/**
 * Fetch health scan data
 * Used by: META_06 Health Scan
 */
export function useHealthScan(config?: SWRConfiguration) {
  return useSWR<HealthScanResponse>(
    '/api/meta/governance/health',
    () => bffClient.getHealthScan(),
    { ...defaultConfig, refreshInterval: 60000, ...config },
  );
}

// =============================================================================
// Fields Hooks (META_02, META_03)
// =============================================================================

export interface UseFieldsParams {
  page?: number;
  limit?: number;
  q?: string;
  domain?: string;
  tier?: string;
  status?: string;
  entity_urn?: string;
}

/**
 * Fetch metadata fields list
 * Used by: META_02 God View
 */
export function useFields(params?: UseFieldsParams, config?: SWRConfiguration) {
  const queryParams = params
    ? Object.fromEntries(
      Object.entries(params)
        .filter(([_, v]) => v !== undefined && v !== '')
        .map(([k, v]) => [k, String(v)]),
    )
    : undefined;

  const key = queryParams
    ? `/api/meta/fields?${new URLSearchParams(queryParams).toString()}`
    : '/api/meta/fields';

  return useSWR<MetadataFieldsResponse>(
    key,
    () => bffClient.getFields(queryParams),
    { ...defaultConfig, ...config },
  );
}

/**
 * Fetch single field by ID
 */
export function useField(id: string | null, config?: SWRConfiguration) {
  return useSWR<MetadataFieldDto>(
    id ? `/api/meta/fields/${id}` : null,
    () => bffClient.getField(id!),
    { ...defaultConfig, ...config },
  );
}

/**
 * Fetch field mappings (system bindings)
 * Used by: META_03 Prism Comparator
 */
export function useFieldMappings(canonicalKey: string | null, config?: SWRConfiguration) {
  return useSWR<PrismComparisonResponse>(
    canonicalKey ? `/api/meta/fields/${canonicalKey}/mappings` : null,
    () => bffClient.getFieldMappings(canonicalKey!),
    { ...defaultConfig, ...config },
  );
}

/**
 * Mutation hook for creating a field
 */
export function useCreateField() {
  return useSWRMutation(
    '/api/meta/fields',
    async (_: string, { arg }: { arg: CreateMetadataFieldInput }) => {
      const result = await bffClient.createField(arg);
      // Invalidate fields list cache
      mutate((key) => typeof key === 'string' && key.startsWith('/api/meta/fields'));
      return result;
    },
  );
}

// =============================================================================
// Entities Hooks (META_05)
// =============================================================================

/**
 * Fetch entity tree (hierarchy)
 * Used by: META_05 Canon Matrix
 */
export function useEntityTree(config?: SWRConfiguration) {
  return useSWR<EntityTreeResponse>(
    '/api/meta/entities/tree',
    () => bffClient.getEntityTree(),
    { ...defaultConfig, refreshInterval: 60000, ...config },
  );
}

export interface UseEntitiesParams {
  domain?: string;
  module?: string;
  entity_type?: string;
}

/**
 * Fetch entities list
 */
export function useEntities(params?: UseEntitiesParams, config?: SWRConfiguration) {
  const queryParams = params
    ? Object.fromEntries(
      Object.entries(params)
        .filter(([_, v]) => v !== undefined && v !== '')
        .map(([k, v]) => [k, String(v)]),
    )
    : undefined;

  const key = queryParams
    ? `/api/meta/entities?${new URLSearchParams(queryParams).toString()}`
    : '/api/meta/entities';

  return useSWR<{ data: EntityDto[]; total: number }>(
    key,
    () => bffClient.getEntities(queryParams),
    { ...defaultConfig, ...config },
  );
}

/**
 * Fetch single entity by URN
 */
export function useEntity(urn: string | null, config?: SWRConfiguration) {
  return useSWR<EntityDto>(
    urn ? `/api/meta/entities/${urn}` : null,
    () => bffClient.getEntity(urn!),
    { ...defaultConfig, ...config },
  );
}

/**
 * Mutation hook for creating an entity
 */
export function useCreateEntity() {
  return useSWRMutation(
    '/api/meta/entities',
    async (_: string, { arg }: { arg: CreateEntityInput }) => {
      const result = await bffClient.createEntity(arg);
      // Invalidate entities cache
      mutate((key) => typeof key === 'string' && key.startsWith('/api/meta/entities'));
      return result;
    },
  );
}

// =============================================================================
// Standard Packs Hooks
// =============================================================================

export interface UseStandardPacksParams {
  category?: string;
  tier?: string;
  q?: string;
}

/**
 * Fetch standard packs list
 */
export function useStandardPacks(params?: UseStandardPacksParams, config?: SWRConfiguration) {
  const queryParams = params
    ? Object.fromEntries(
      Object.entries(params)
        .filter(([_, v]) => v !== undefined && v !== '')
        .map(([k, v]) => [k, String(v)]),
    )
    : undefined;

  const key = queryParams
    ? `/api/meta/standard-packs?${new URLSearchParams(queryParams).toString()}`
    : '/api/meta/standard-packs';

  return useSWR(
    key,
    async () => {
      const response = await fetch(key);
      if (!response.ok) throw new Error('Failed to fetch standard packs');
      return response.json();
    },
    { ...defaultConfig, revalidateOnMount: true, ...config },
  );
}

// =============================================================================
// Violations Hooks
// =============================================================================

export interface UseViolationsParams {
  status?: 'open' | 'resolved' | 'ignored';
  severity?: 'critical' | 'high' | 'medium' | 'low';
  code?: string;
  page?: number;
  limit?: number;
}

/**
 * Fetch violations list
 */
export function useViolations(params?: UseViolationsParams, config?: SWRConfiguration) {
  const queryParams = params
    ? Object.fromEntries(
      Object.entries(params)
        .filter(([_, v]) => v !== undefined && v !== '')
        .map(([k, v]) => [k, String(v)]),
    )
    : undefined;

  const key = queryParams
    ? `/api/meta/violations?${new URLSearchParams(queryParams).toString()}`
    : '/api/meta/violations';

  return useSWR(
    key,
    async () => {
      const response = await fetch(key);
      if (!response.ok) throw new Error('Failed to fetch violations');
      return response.json();
    },
    { ...defaultConfig, refreshInterval: 30000, ...config },
  );
}

// =============================================================================
// Lineage Hooks (Active Intelligence)
// =============================================================================

export interface UseLineageGraphParams {
  direction?: 'upstream' | 'downstream' | 'both';
  depth?: number;
}

/**
 * Fetch lineage graph for a specific node URN
 * Used by: Lineage Canvas, META_03 Detail View
 */
export function useLineageGraph(
  urn: string | null,
  params?: UseLineageGraphParams,
  config?: SWRConfiguration
) {
  const queryParams = new URLSearchParams();
  if (params?.direction) queryParams.set('direction', params.direction);
  if (params?.depth) queryParams.set('depth', String(params.depth));
  const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : '';

  const key = urn ? `/api/meta/lineage/graph/${encodeURIComponent(urn)}${queryStr}` : null;

  return useSWR(
    key,
    async () => {
      if (!key) return null;
      const response = await fetch(key);
      if (!response.ok) throw new Error('Failed to fetch lineage graph');
      return response.json();
    },
    { ...defaultConfig, ...config }
  );
}

/**
 * Fetch all lineage nodes
 */
export function useLineageNodes(config?: SWRConfiguration) {
  return useSWR(
    '/api/meta/lineage',
    async () => {
      const response = await fetch('/api/meta/lineage');
      if (!response.ok) throw new Error('Failed to fetch lineage nodes');
      return response.json();
    },
    { ...defaultConfig, ...config }
  );
}

/**
 * Perform impact analysis for a proposed change
 */
export function useImpactAnalysis() {
  return useSWRMutation(
    '/api/meta/lineage/impact',
    async (
      _,
      { arg }: { arg: { urn: string; changeType: string; description?: string } }
    ) => {
      const response = await fetch('/api/meta/lineage/impact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(arg),
      });
      if (!response.ok) throw new Error('Failed to perform impact analysis');
      return response.json();
    }
  );
}

// =============================================================================
// Cache Invalidation Utilities
// =============================================================================

/**
 * Invalidate all metadata-related caches
 */
export function invalidateMetadataCache() {
  mutate((key) => typeof key === 'string' && key.includes('/api/meta/'));
}

/**
 * Invalidate specific cache keys
 */
export function invalidateCache(pattern: string) {
  mutate((key) => typeof key === 'string' && key.includes(pattern));
}
