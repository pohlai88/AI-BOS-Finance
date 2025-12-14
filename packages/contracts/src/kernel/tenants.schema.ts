/**
 * Kernel Tenant Contracts
 * 
 * Schema-first definition for tenant management.
 * These schemas enforce input validation and output contracts.
 */

import { z } from "zod";

// ============================================================================
// REQUEST SCHEMAS
// ============================================================================

export const TenantCreateRequest = z.object({
  name: z.string().min(2).max(120),
});

// ============================================================================
// RESPONSE / DTO SCHEMAS
// ============================================================================

export const TenantDTO = z.object({
  id: z.string().uuid(),
  name: z.string(),
  status: z.enum(["ACTIVE", "SUSPENDED"]).default("ACTIVE"),
  created_at: z.string(), // ISO 8601
});

export const TenantListResponse = z.object({
  items: z.array(TenantDTO),
});

// ============================================================================
// TYPE EXPORTS (inferred from schemas)
// ============================================================================

export type TenantCreateRequest = z.infer<typeof TenantCreateRequest>;
export type TenantDTO = z.infer<typeof TenantDTO>;
export type TenantListResponse = z.infer<typeof TenantListResponse>;

