/**
 * Tenant Domain Model
 * 
 * Pure data type representing a tenant in the system.
 * No behavior, no side effects - just shape.
 */

export type TenantStatus = "ACTIVE" | "SUSPENDED";

export type Tenant = {
  id: string;
  name: string;
  status: TenantStatus;
  created_at: string; // ISO 8601
};

