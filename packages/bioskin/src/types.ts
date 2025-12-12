// ============================================================================
// BIOSKIN: Shared Types
// ============================================================================
// Centralized type definitions for BioSkin components
// 🛡️ GOVERNANCE: Exported types ensure type safety across BioSkin
// ============================================================================

import type { MetadataField } from '@/kernel'
import type { z } from 'zod'

// ============================================================================
// CORE TYPES
// ============================================================================

export type BioIntent = 'view' | 'edit'

/**
 * Extended MetadataField with BioSkin-specific properties
 * Extends Kernel MetadataField with UI-specific metadata
 */
export interface ExtendedMetadataField extends MetadataField {
  /** Hide field from rendering */
  hidden?: boolean
  /** Field is required (shows required indicator) */
  required?: boolean
  /** Field ordering (lower numbers appear first) */
  order?: number
  /** Field is read-only (cannot be edited) */
  readOnly?: boolean
  /** Field group name (for sectioned layouts) */
  group?: string
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Field-level error message
 * Key: field technical_name, Value: error message
 */
export type FieldErrors = Record<string, string>

// ============================================================================
// GENERIC SCHEMA TYPES
// ============================================================================

/**
 * Generic BioObject props with Zod schema support
 * TSchema must be a ZodObject
 */
export interface BioObjectPropsWithSchema<TSchema extends z.ZodObject<any>> {
  /** Zod schema for validation */
  schema: TSchema
  /** Initial data (must match schema type) */
  data: z.infer<TSchema>
  /** Field metadata from Kernel */
  fields: ExtendedMetadataField[]
  /** Render mode */
  intent?: BioIntent
  /** Submit handler (called with validated data) */
  onSubmit?: (data: z.infer<TSchema>) => void | Promise<void>
  /** Cancel handler */
  onCancel?: () => void
  /** Optional grouping metadata */
  groupBy?: string
  /** Loading state (shows skeleton) */
  isLoading?: boolean
  /** Additional className */
  className?: string
}

/**
 * BioObject props without schema (backward compatible)
 * For cases where schema validation is not needed
 */
export interface BioObjectPropsWithoutSchema {
  /** Array of field metadata from Kernel */
  schema: ExtendedMetadataField[]
  /** Record data (object with field values) */
  data: Record<string, unknown>
  /** Render mode */
  intent?: BioIntent
  /** Callback when any field changes */
  onChange?: (fieldName: string, value: unknown) => void
  /** Optional grouping metadata */
  groupBy?: string
  /** Loading state (shows skeleton) */
  isLoading?: boolean
  /** Additional className */
  className?: string
}

/**
 * Union type: BioObject accepts either schema-based or simple props
 */
export type BioObjectProps<
  TSchema extends z.ZodObject<any> = z.ZodObject<any>,
> = BioObjectPropsWithSchema<TSchema> | BioObjectPropsWithoutSchema
