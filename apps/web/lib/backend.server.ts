/**
 * Backend Server Client - BFF Internal Client
 * 
 * This file is ONLY used server-side (Next.js API routes / Server Components).
 * It is NEVER bundled to the browser.
 * 
 * @see PRD_BFF_01_NEXTJS_BFF.md
 */

import 'server-only';
import { cookies } from 'next/headers';

// Backend service URLs (server-side only, no NEXT_PUBLIC_ prefix)
const METADATA_STUDIO_URL = process.env.METADATA_STUDIO_URL || 'http://localhost:8787';
const KERNEL_URL = process.env.KERNEL_URL || 'http://localhost:3001';

// Auth configuration
const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'kernel-jwt';
const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID || 'default';

/**
 * JWT Payload structure from Kernel
 */
interface JWTPayload {
  sub: string;      // user_id
  tid: string;      // tenant_id
  sid: string;      // session_id
  email: string;
  iat: number;
  exp: number;
}

/**
 * Service types for routing
 */
export type BackendService = 'metadata-studio' | 'kernel';

/**
 * Options for backend fetch
 */
export interface BackendFetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  revalidate?: number | false;
  tags?: string[];
}

/**
 * Get the base URL for a backend service
 */
function getServiceUrl(service: BackendService): string {
  switch (service) {
    case 'metadata-studio':
      return METADATA_STUDIO_URL;
    case 'kernel':
      return KERNEL_URL;
    default:
      throw new Error(`Unknown service: ${service}`);
  }
}

/**
 * Decode JWT payload (without verification - verification is done by backend)
 * We only decode to extract tenant/user info for headers
 */
function decodeJWTPayload(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    return payload as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Get auth context from cookies or environment
 * 
 * Auth Strategy:
 * 1. Check for JWT in httpOnly cookie (production)
 * 2. Check for dev overrides via env vars (development)
 * 3. Fall back to defaults (development only)
 */
async function getAuthContext(): Promise<{
  tenantId: string;
  userId: string;
  accessToken?: string;
  role?: string;
}> {
  try {
    // 1. Try to get JWT from cookie
    const cookieStore = await cookies();
    const jwtCookie = cookieStore.get(AUTH_COOKIE_NAME);

    if (jwtCookie?.value) {
      const payload = decodeJWTPayload(jwtCookie.value);
      if (payload) {
        console.log(`[BFF Auth] JWT found for user ${payload.sub} in tenant ${payload.tid}`);
        return {
          tenantId: payload.tid,
          userId: payload.sub,
          accessToken: jwtCookie.value,
        };
      }
    }

    // 2. Development fallback: check for tenant override in env
    const devTenantId = process.env.DEV_TENANT_ID;
    const devUserId = process.env.DEV_USER_ID;

    if (devTenantId && devUserId) {
      console.log(`[BFF Auth] Using dev overrides: tenant=${devTenantId}, user=${devUserId}`);
      return {
        tenantId: devTenantId,
        userId: devUserId,
        role: process.env.DEV_USER_ROLE || 'metadata_steward',
      };
    }

    // 3. Default for development (no auth)
    console.log('[BFF Auth] No auth found, using defaults');
    return {
      tenantId: DEFAULT_TENANT_ID,
      userId: 'system',
      role: 'metadata_steward',
    };
  } catch (error) {
    console.warn('[BFF Auth] Error getting auth context:', error);
    return {
      tenantId: DEFAULT_TENANT_ID,
      userId: 'anonymous',
      role: 'user',
    };
  }
}

/**
 * Fetch from backend service with auth injection
 * 
 * @param service - The backend service to call
 * @param path - The API path (e.g., '/api/meta/fields')
 * @param options - Fetch options
 * @returns Parsed JSON response
 */
export async function backendFetch<T>(
  service: BackendService,
  path: string,
  options: BackendFetchOptions = {},
): Promise<T> {
  const baseUrl = getServiceUrl(service);
  const url = `${baseUrl}${path}`;

  // Get auth context
  const auth = await getAuthContext();

  // Build headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-Tenant-Id': auth.tenantId,
    'X-User-Id': auth.userId,
    ...(auth.role && { 'X-Role': auth.role }),
    ...(auth.accessToken && { 'Authorization': `Bearer ${auth.accessToken}` }),
    ...(options.headers as Record<string, string>),
  };

  // Build fetch options
  const fetchOptions: RequestInit = {
    method: options.method || 'GET',
    headers,
    ...(options.body !== undefined && { body: JSON.stringify(options.body) }),
  };

  // Add Next.js caching options
  if (options.revalidate !== undefined) {
    (fetchOptions as any).next = {
      revalidate: options.revalidate,
      ...(options.tags && { tags: options.tags }),
    };
  }

  try {
    console.log(`[BFF] ${fetchOptions.method} ${url}`);

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      console.error(`[BFF] Error ${response.status}:`, errorBody);
      throw new BackendError(
        errorBody.error || `Backend error: ${response.status}`,
        response.status,
        errorBody,
      );
    }

    return response.json() as Promise<T>;
  } catch (error) {
    if (error instanceof BackendError) {
      throw error;
    }

    console.error(`[BFF] Network error calling ${service}:`, error);
    throw new BackendError(
      `Failed to connect to ${service}`,
      503,
      { originalError: error instanceof Error ? error.message : 'Unknown error' },
    );
  }
}

/**
 * Custom error class for backend errors
 */
export class BackendError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'BackendError';
  }
}

// =============================================================================
// CONVENIENCE METHODS FOR METADATA-STUDIO
// =============================================================================

/**
 * Metadata Studio API client (server-side only)
 */
export const metadataStudio = {
  /**
   * GET /api/meta/governance/dashboard
   */
  getGovernanceDashboard: () =>
    backendFetch('metadata-studio', '/api/meta/governance/dashboard', {
      revalidate: 30,
      tags: ['governance-dashboard'],
    }),

  /**
   * GET /api/meta/governance/risks
   */
  getRiskRadar: () =>
    backendFetch('metadata-studio', '/api/meta/governance/risks', {
      revalidate: 30,
      tags: ['risk-radar'],
    }),

  /**
   * GET /api/meta/governance/health
   */
  getHealthScan: () =>
    backendFetch('metadata-studio', '/api/meta/governance/health', {
      revalidate: 60,
      tags: ['health-scan'],
    }),

  /**
   * GET /api/meta/fields
   */
  getFields: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return backendFetch('metadata-studio', `/api/meta/fields${query}`, {
      revalidate: 30,
      tags: ['metadata-fields'],
    });
  },

  /**
   * GET /api/meta/fields/:id
   */
  getField: (id: string) =>
    backendFetch('metadata-studio', `/api/meta/fields/${encodeURIComponent(id)}`, {
      revalidate: 60,
      tags: ['metadata-field', `field-${id}`],
    }),

  /**
   * POST /api/meta/fields
   */
  createField: (data: unknown) =>
    backendFetch('metadata-studio', '/api/meta/fields', {
      method: 'POST',
      body: data,
    }),

  /**
   * GET /api/meta/fields/:key/mappings
   */
  getFieldMappings: (canonicalKey: string) =>
    backendFetch('metadata-studio', `/api/meta/fields/${encodeURIComponent(canonicalKey)}/mappings`, {
      revalidate: 60,
      tags: ['field-mappings', `mappings-${canonicalKey}`],
    }),

  /**
   * GET /api/meta/entities/tree
   */
  getEntityTree: () =>
    backendFetch('metadata-studio', '/api/meta/entities/tree', {
      revalidate: 60,
      tags: ['entity-tree'],
    }),

  /**
   * GET /api/meta/entities
   */
  getEntities: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return backendFetch('metadata-studio', `/api/meta/entities${query}`, {
      revalidate: 60,
      tags: ['entities'],
    });
  },

  /**
   * GET /api/meta/entities/:urn
   */
  getEntity: (urn: string) =>
    backendFetch('metadata-studio', `/api/meta/entities/${encodeURIComponent(urn)}`, {
      revalidate: 60,
      tags: ['entity', `entity-${urn}`],
    }),

  /**
   * POST /api/meta/entities
   */
  createEntity: (data: unknown) =>
    backendFetch('metadata-studio', '/api/meta/entities', {
      method: 'POST',
      body: data,
    }),

  // =========================================================================
  // Standard Packs
  // =========================================================================

  /**
   * GET /api/meta/standard-packs
   */
  getStandardPacks: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return backendFetch('metadata-studio', `/api/meta/standard-packs${query}`, {
      revalidate: 300, // Cache for 5 minutes (rarely changes)
      tags: ['standard-packs'],
    });
  },

  /**
   * GET /api/meta/standard-packs/:packId
   */
  getStandardPack: (packId: string) =>
    backendFetch('metadata-studio', `/api/meta/standard-packs/${encodeURIComponent(packId)}`, {
      revalidate: 300,
      tags: ['standard-pack', `pack-${packId}`],
    }),

  // =========================================================================
  // Violations & Remediation
  // =========================================================================

  /**
   * GET /api/meta/violations
   */
  getViolations: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return backendFetch('metadata-studio', `/api/meta/violations${query}`, {
      revalidate: 30,
      tags: ['violations'],
    });
  },

  /**
   * GET /api/meta/remediations
   */
  getRemediations: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return backendFetch('metadata-studio', `/api/meta/remediations${query}`, {
      revalidate: 30,
      tags: ['remediations'],
    });
  },

  /**
   * POST /api/meta/remediations/:id/approve
   */
  approveRemediation: (id: string, comment?: string) =>
    backendFetch('metadata-studio', `/api/meta/remediations/${id}/approve`, {
      method: 'POST',
      body: { comment },
    }),

  /**
   * POST /api/meta/remediations/:id/reject
   */
  rejectRemediation: (id: string, comment: string) =>
    backendFetch('metadata-studio', `/api/meta/remediations/${id}/reject`, {
      method: 'POST',
      body: { comment },
    }),

  // =========================================================================
  // Lineage & Impact Analysis
  // =========================================================================

  /**
   * GET /api/meta/lineage
   */
  getLineageNodes: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return backendFetch('metadata-studio', `/api/meta/lineage${query}`, {
      revalidate: 60,
      tags: ['lineage-nodes'],
    });
  },

  /**
   * GET /api/meta/lineage/graph/:urn
   */
  getLineageGraph: (urn: string, options?: { direction?: string; depth?: string }) => {
    const query = new URLSearchParams();
    if (options?.direction) query.set('direction', options.direction);
    if (options?.depth) query.set('depth', options.depth);
    const queryStr = query.toString() ? `?${query.toString()}` : '';
    return backendFetch(
      'metadata-studio',
      `/api/meta/lineage/graph/${encodeURIComponent(urn)}${queryStr}`,
      {
        revalidate: 60,
        tags: ['lineage-graph', `lineage-${urn}`],
      }
    );
  },

  /**
   * POST /api/meta/lineage/impact
   */
  analyzeImpact: (data: { urn: string; changeType: string; description?: string }) =>
    backendFetch('metadata-studio', '/api/meta/lineage/impact', {
      method: 'POST',
      body: data,
    }),

  /**
   * POST /api/meta/lineage/nodes
   */
  createLineageNode: (data: unknown) =>
    backendFetch('metadata-studio', '/api/meta/lineage/nodes', {
      method: 'POST',
      body: data,
    }),

  /**
   * POST /api/meta/lineage/edges
   */
  createLineageEdge: (data: unknown) =>
    backendFetch('metadata-studio', '/api/meta/lineage/edges', {
      method: 'POST',
      body: data,
    }),
};

// =============================================================================
// CONVENIENCE METHODS FOR KERNEL
// =============================================================================

/**
 * Kernel API client (server-side only)
 */
export const kernel = {
  /**
   * GET /health
   */
  checkHealth: () =>
    backendFetch('kernel', '/health', { revalidate: false }),

  /**
   * GET /health/db
   */
  checkDatabaseHealth: () =>
    backendFetch('kernel', '/health/db', { revalidate: false }),
};
