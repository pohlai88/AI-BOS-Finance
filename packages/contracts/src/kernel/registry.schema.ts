/**
 * Kernel Registry Contracts
 * 
 * Schema-first definition for Service Registry (Canon registration + routing).
 * These schemas enforce input validation and output contracts.
 */

import { z } from "zod";

// ============================================================================
// CANON REGISTRY SCHEMAS
// ============================================================================

export const CanonCreateRequest = z.object({
  canon_key: z.string().min(2).max(64), // e.g. "HRM", "CRM"
  version: z.string().min(1).max(32), // e.g. "0.1.0"
  base_url: z.string().url(), // e.g. "http://localhost:4001"
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  capabilities: z.array(z.string()).default([]), // optional MVP
});

export const CanonDTO = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  canon_key: z.string(),
  version: z.string(),
  base_url: z.string().url(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  capabilities: z.array(z.string()),
  created_at: z.string(), // ISO 8601
});

export const CanonListResponse = z.object({
  items: z.array(CanonDTO),
});

// ============================================================================
// ROUTE REGISTRY SCHEMAS
// ============================================================================

export const RouteCreateRequest = z.object({
  route_prefix: z.string().min(1).max(128), // e.g. "/canon/hrm"
  canon_id: z.string().uuid(),
  required_permissions: z.array(z.string()).default([]), // Build 3.3: RBAC permissions required (empty = public)
});

export const RouteDTO = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  route_prefix: z.string(),
  canon_id: z.string().uuid(),
  required_permissions: z.array(z.string()), // Build 3.3: RBAC permissions required
  created_at: z.string(), // ISO 8601
});

export const RouteListResponse = z.object({
  items: z.array(RouteDTO),
});

// ============================================================================
// TYPE EXPORTS (inferred from schemas)
// ============================================================================

export type CanonCreateRequest = z.infer<typeof CanonCreateRequest>;
export type CanonDTO = z.infer<typeof CanonDTO>;
export type CanonListResponse = z.infer<typeof CanonListResponse>;

export type RouteCreateRequest = z.infer<typeof RouteCreateRequest>;
export type RouteDTO = z.infer<typeof RouteDTO>;
export type RouteListResponse = z.infer<typeof RouteListResponse>;

