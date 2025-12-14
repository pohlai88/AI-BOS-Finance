/**
 * Registry Domain Models
 * 
 * Pure data types for Canon Registry and Route Registry.
 * No behavior, no side effects - just shape.
 */

export type CanonStatus = "ACTIVE" | "INACTIVE";

export type Canon = {
  id: string;
  tenant_id: string;
  canon_key: string;
  version: string;
  base_url: string;
  status: CanonStatus;
  capabilities: string[];
  created_at: string; // ISO 8601
};

export type RouteMapping = {
  id: string;
  tenant_id: string;
  route_prefix: string; // normalized, always starts with "/"
  canon_id: string;
  created_at: string; // ISO 8601
};

