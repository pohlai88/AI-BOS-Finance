/**
 * IAM Contracts (Build 3.1)
 * 
 * Schema-first definition for Identity & Access Management.
 * These schemas are used at the API boundary only.
 */

import { z } from "zod";

// ============================================================================
// USER SCHEMAS
// ============================================================================

export const IamUserCreateSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(255),
}).strict();

export const IamListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
}).strict();

// ============================================================================
// ROLE SCHEMAS
// ============================================================================

export const IamRoleCreateSchema = z.object({
  name: z.string().min(1).max(255),
}).strict();

export const IamRoleAssignSchema = z.object({
  user_id: z.string().uuid(),
}).strict();

// ============================================================================
// AUTH SCHEMAS (Build 3.2)
// ============================================================================

export const IamSetPasswordSchema = z.object({
  user_id: z.string().uuid(),
  password: z.string().min(8).max(255),
}).strict();

export const IamLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
}).strict();

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type IamUserCreateSchema = z.infer<typeof IamUserCreateSchema>;
export type IamListQuerySchema = z.infer<typeof IamListQuerySchema>;
export type IamRoleCreateSchema = z.infer<typeof IamRoleCreateSchema>;
export type IamRoleAssignSchema = z.infer<typeof IamRoleAssignSchema>;
export type IamSetPasswordSchema = z.infer<typeof IamSetPasswordSchema>;
export type IamLoginSchema = z.infer<typeof IamLoginSchema>;
