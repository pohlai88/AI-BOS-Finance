// ============================================================================
// BIOSKIN: Zod Schema Introspector - The RNA Translator
// ============================================================================
// Translates Zod DNA (Schemas) → ExtendedMetadataField (Kernel-compatible)
// This is the "RNA" that bridges Zod schemas to BioSkin components
// 🛡️ GOVERNANCE: Pure TypeScript utility (no UI dependencies)
// ============================================================================

import { z } from 'zod'
import type { ExtendedMetadataField } from './types'
import type { MetadataType } from '@/modules/metadata/kernel'

// Re-export for convenience
export type { ExtendedMetadataField, MetadataType }

// ============================================================================
// TYPES
// ============================================================================

interface IntrospectionOptions {
  /** Field name to use as business term (defaults to technical_name) */
  businessTermMap?: Record<string, string>
  /** Field descriptions (from Zod .describe() or manual) */
  descriptionMap?: Record<string, string>
  /** Mark fields as required */
  requiredFields?: string[]
  /** Mark fields as hidden */
  hiddenFields?: string[]
  /** Field ordering */
  fieldOrder?: Record<string, number>
  /** Field groups */
  fieldGroups?: Record<string, string>
}

// ============================================================================
// ZOD SCHEMA INTROSPECTOR
// ============================================================================

/**
 * Introspects a Zod schema and converts it to ExtendedMetadataField[]
 * This is the "RNA" that translates DNA (Zod) to Proteins (UI Components)
 */
export function introspectZodSchema(
  schema: z.ZodObject<any>,
  options: IntrospectionOptions = {}
): ExtendedMetadataField[] {
  const {
    businessTermMap = {},
    descriptionMap = {},
    requiredFields = [],
    hiddenFields = [],
    fieldOrder = {},
    fieldGroups = {},
  } = options

  const shape = schema.shape
  const fields: ExtendedMetadataField[] = []

  for (const [key, zodSchema] of Object.entries(shape)) {
    // Skip hidden fields
    if (hiddenFields.includes(key)) continue

    // Introspect the Zod schema
    const fieldMeta = introspectZodField(key, zodSchema as z.ZodTypeAny, {
      businessTerm: businessTermMap[key] || formatBusinessTerm(key),
      description:
        descriptionMap[key] || getZodDescription(zodSchema as z.ZodTypeAny),
      required:
        requiredFields.includes(key) || isRequired(zodSchema as z.ZodTypeAny),
      order: fieldOrder[key],
      group: fieldGroups[key],
    })

    fields.push(fieldMeta)
  }

  return fields
}

// ============================================================================
// FIELD INTROSPECTION
// ============================================================================

function introspectZodField(
  technicalName: string,
  zodSchema: z.ZodTypeAny,
  metadata: {
    businessTerm: string
    description?: string
    required?: boolean
    order?: number
    group?: string
  }
): ExtendedMetadataField {
  const def = zodSchema._def

  // Determine data type from Zod schema type
  const dataType = inferDataType(zodSchema)

  // Build base field metadata
  const field: ExtendedMetadataField = {
    technical_name: technicalName,
    business_term: metadata.businessTerm,
    data_type: dataType,
    description: metadata.description,
    required: metadata.required ?? false,
    order: metadata.order,
    group: metadata.group,
    hidden: false,
    readOnly: false,
  }

  // Add type-specific metadata
  if (def.typeName === 'ZodEnum') {
    // Enum fields - check if it's a status enum
    const enumValues = def.values as string[]
    const isStatusEnum = isStatusField(enumValues, technicalName)

    if (isStatusEnum) {
      field.data_type = 'status'
    }
  } else if (def.typeName === 'ZodString') {
    // String refinements
    if (hasRefinement(zodSchema, 'email')) {
      // Could add email-specific UI hints
    }
    if (hasRefinement(zodSchema, 'url')) {
      // Could add URL-specific UI hints
    }
  } else if (def.typeName === 'ZodNumber') {
    // Number refinements
    if (hasRefinement(zodSchema, 'min') || hasRefinement(zodSchema, 'max')) {
      // Could add min/max hints
    }
  } else if (def.typeName === 'ZodBoolean') {
    field.data_type = 'boolean'
  } else if (def.typeName === 'ZodDate') {
    field.data_type = 'datetime'
  } else if (def.typeName === 'ZodObject') {
    // Nested objects - mark as JSON for now (could recurse)
    field.data_type = 'json'
  }

  return field
}

// ============================================================================
// TYPE INFERENCE
// ============================================================================

function inferDataType(zodSchema: z.ZodTypeAny): MetadataType {
  const def = zodSchema._def

  switch (def.typeName) {
    case 'ZodString':
      // Check for email/url refinements
      if (hasRefinement(zodSchema, 'email')) return 'text'
      if (hasRefinement(zodSchema, 'url')) return 'text'
      return 'text'

    case 'ZodNumber':
      // Check for currency patterns (could be enhanced)
      return 'number'

    case 'ZodBoolean':
      return 'boolean'

    case 'ZodDate':
      return 'datetime'

    case 'ZodEnum':
      // Check if it's a status enum
      const enumValues = def.values as string[]
      if (isStatusField(enumValues, '')) {
        return 'status'
      }
      return 'text' // Enum as text for now

    case 'ZodObject':
      return 'json'

    case 'ZodArray':
      return 'json' // Arrays as JSON for now

    case 'ZodOptional':
    case 'ZodNullable':
    case 'ZodDefault':
      // Unwrap and recurse
      return inferDataType(def.innerType || def.type)

    default:
      return 'text'
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function formatBusinessTerm(technicalName: string): string {
  // Convert snake_case or camelCase to Title Case
  return technicalName
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function getZodDescription(zodSchema: z.ZodTypeAny): string | undefined {
  const def = zodSchema._def
  if (def.description) return def.description

  // Check unwrapped schemas
  if (def.typeName === 'ZodOptional' || def.typeName === 'ZodNullable') {
    return getZodDescription(def.innerType || def.type)
  }

  return undefined
}

function isRequired(zodSchema: z.ZodTypeAny): boolean {
  const def = zodSchema._def

  // Optional fields are not required
  if (def.typeName === 'ZodOptional') return false

  // Nullable fields are not required
  if (def.typeName === 'ZodNullable') return false

  // Default fields are not required (they have a default)
  if (def.typeName === 'ZodDefault') return false

  return true
}

function hasRefinement(
  zodSchema: z.ZodTypeAny,
  refinementName: string
): boolean {
  const def = zodSchema._def

  // Check refinements
  if (def.checks) {
    return def.checks.some((check: any) => check.kind === refinementName)
  }

  // Check unwrapped schemas
  if (def.typeName === 'ZodOptional' || def.typeName === 'ZodNullable') {
    return hasRefinement(def.innerType || def.type, refinementName)
  }

  return false
}

function isStatusField(enumValues: string[], fieldName: string): boolean {
  const statusKeywords = ['status', 'state', 'stage', 'phase']
  const statusValues = [
    'pending',
    'approved',
    'rejected',
    'active',
    'inactive',
    'draft',
    'published',
    'archived',
    'locked',
    'unlocked',
    'success',
    'error',
    'warning',
    'info',
    'paid',
    'unpaid',
  ]

  const lowerFieldName = fieldName.toLowerCase()
  const hasStatusKeyword = statusKeywords.some((keyword) =>
    lowerFieldName.includes(keyword)
  )
  const hasStatusValues = enumValues.some((val) =>
    statusValues.includes(val.toLowerCase())
  )

  return hasStatusKeyword || hasStatusValues
}

// ============================================================================
// CONVENIENCE: Create Zod Schema with Metadata
// ============================================================================

/**
 * Helper to create a Zod schema with BioSkin metadata
 * This allows you to embed UI hints directly in your Zod schemas
 */
export function createBioSchema<T extends z.ZodRawShape>(
  shape: T,
  metadata?: {
    businessTerms?: Record<keyof T, string>
    descriptions?: Record<keyof T, string>
    groups?: Record<keyof T, string>
    order?: Record<keyof T, number>
  }
) {
  const schema = z.object(shape)

  // Store metadata in a custom property (for later retrieval)
  if (metadata) {
    ; (schema as any).__bioMetadata = metadata
  }

  return schema
}
