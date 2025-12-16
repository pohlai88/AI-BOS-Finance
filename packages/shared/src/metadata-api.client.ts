// ============================================================================
// METADATA API CLIENT - Frontend Implementation
// ============================================================================
// This file provides a type-safe client for the META page routes.
// Import this in your React components to interact with the backend.
// ============================================================================

import type {
  MetadataApiClient,
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
} from './metadata-api.types';

// Default base URL - can be overridden
const DEFAULT_BASE_URL = '/api/meta';

/**
 * Configuration for the metadata API client
 */
export interface MetadataApiConfig {
  baseUrl?: string;
  headers?: Record<string, string>;
  onError?: (error: Error) => void;
}

/**
 * Create a type-safe metadata API client
 */
export function createMetadataApiClient(
  config: MetadataApiConfig = {},
): MetadataApiClient {
  const baseUrl = config.baseUrl || DEFAULT_BASE_URL;
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...config.headers,
  };

  async function request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${baseUrl}${path}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Request failed: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      if (config.onError && error instanceof Error) {
        config.onError(error);
      }
      throw error;
    }
  }

  return {
    // -------------------------------------------------------------------------
    // META_01: Governance Dashboard
    // -------------------------------------------------------------------------
    async getGovernanceDashboard(): Promise<GovernanceDashboardResponse> {
      return request<GovernanceDashboardResponse>('/governance/dashboard');
    },

    // -------------------------------------------------------------------------
    // META_02: God View
    // -------------------------------------------------------------------------
    async getFields(
      params: MetadataFieldsFilter = {},
    ): Promise<MetadataFieldsResponse> {
      const searchParams = new URLSearchParams();

      if (params.q) searchParams.set('q', params.q);
      if (params.domain) searchParams.set('domain', params.domain);
      if (params.module) searchParams.set('module', params.module);
      if (params.tier) searchParams.set('tier', params.tier);
      if (params.status) searchParams.set('status', params.status);
      if (params.entity_urn) searchParams.set('entity_urn', params.entity_urn);
      if (params.standard_pack_id)
        searchParams.set('standard_pack_id', params.standard_pack_id);
      if (params.page) searchParams.set('page', String(params.page));
      if (params.limit) searchParams.set('limit', String(params.limit));

      const query = searchParams.toString();
      return request<MetadataFieldsResponse>(`/fields${query ? `?${query}` : ''}`);
    },

    async getField(id: string): Promise<MetadataFieldDto> {
      return request<MetadataFieldDto>(`/fields/${encodeURIComponent(id)}`);
    },

    async createField(input: CreateMetadataFieldInput): Promise<MetadataFieldDto> {
      return request<MetadataFieldDto>('/fields', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    // -------------------------------------------------------------------------
    // META_03: Prism Comparator
    // -------------------------------------------------------------------------
    async getFieldMappings(canonicalKey: string): Promise<PrismComparisonResponse> {
      return request<PrismComparisonResponse>(
        `/fields/${encodeURIComponent(canonicalKey)}/mappings`,
      );
    },

    // -------------------------------------------------------------------------
    // META_04: Risk Radar
    // -------------------------------------------------------------------------
    async getRiskRadar(): Promise<RiskRadarResponse> {
      return request<RiskRadarResponse>('/governance/risks');
    },

    // -------------------------------------------------------------------------
    // META_05: Canon Matrix
    // -------------------------------------------------------------------------
    async getEntityTree(): Promise<EntityTreeResponse> {
      return request<EntityTreeResponse>('/entities/tree');
    },

    async getEntity(urn: string): Promise<EntityDto> {
      return request<EntityDto>(`/entities/${encodeURIComponent(urn)}`);
    },

    async createEntity(input: CreateEntityInput): Promise<EntityDto> {
      return request<EntityDto>('/entities', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    // -------------------------------------------------------------------------
    // META_06: Health Scan
    // -------------------------------------------------------------------------
    async getHealthScan(): Promise<HealthScanResponse> {
      return request<HealthScanResponse>('/governance/health');
    },
  };
}

/**
 * Default client instance for convenience
 */
export const metadataApi = createMetadataApiClient();

// Re-export types for convenience
export type {
  MetadataApiClient,
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
} from './metadata-api.types';
