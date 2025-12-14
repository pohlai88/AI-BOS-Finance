/**
 * Auth Domain Models (Build 3.2)
 * 
 * Pure data types for authentication and session management.
 * 
 * Anti-Gravity: These are DOMAIN models, not contracts.
 * They live in kernel-core and are framework-agnostic.
 */

export type KernelCredential = {
  tenant_id: string;
  user_id: string;
  password_hash: string;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
};

export type KernelSession = {
  session_id: string;
  tenant_id: string;
  user_id: string;
  expires_at: string; // ISO 8601
  created_at: string; // ISO 8601
  revoked_at?: string; // ISO 8601 (optional, null if not revoked)
};
