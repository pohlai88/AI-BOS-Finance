/**
 * IAM Domain Models
 * 
 * Pure data types representing users, roles, and role assignments.
 * No behavior, no side effects - just shape.
 * 
 * Anti-Gravity: These are DOMAIN models, not contracts.
 * They live in kernel-core and are framework-agnostic.
 */

export type KernelUserStatus = "ACTIVE" | "DISABLED";

export type KernelUser = {
  user_id: string;
  tenant_id: string;
  email: string;
  name: string;
  status: KernelUserStatus;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
};

export type KernelRole = {
  role_id: string;
  tenant_id: string;
  name: string;
  created_at: string; // ISO 8601
};

export type KernelUserRole = {
  tenant_id: string;
  user_id: string;
  role_id: string;
  created_at: string; // ISO 8601
};
