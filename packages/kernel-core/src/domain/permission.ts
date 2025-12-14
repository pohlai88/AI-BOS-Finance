/**
 * Permission Domain Models (Build 3.3)
 * 
 * Pure data types for RBAC permission system.
 * 
 * Anti-Gravity: These are DOMAIN models, not contracts.
 * They live in kernel-core and are framework-agnostic.
 */

export type KernelPermission = {
  permission_code: string;
  description: string;
  created_at: string; // ISO 8601
};

export type KernelRolePermission = {
  tenant_id: string;
  role_id: string;
  permission_code: string;
  created_at: string; // ISO 8601
};

/**
 * Permission code convention:
 * kernel.<domain>.<resource>.<action>
 * 
 * Examples:
 * - kernel.iam.user.create
 * - kernel.iam.user.list
 * - kernel.audit.read
 * - kernel.gateway.proxy.invoke
 */
