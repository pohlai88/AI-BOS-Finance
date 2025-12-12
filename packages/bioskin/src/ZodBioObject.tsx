// ============================================================================
// BIOSKIN: ZodBioObject - The Living Cell
// ============================================================================
// Renders UI directly from Zod schemas (DNA → UI)
// This is the "Cell" that self-assembles from schema definitions
// 🛡️ GOVERNANCE: Only uses BioObject (which uses atoms)
// ============================================================================

'use client'

import React, { useState, useCallback } from 'react'
import { z } from 'zod'
import { BioObject } from './BioObject'
import { introspectZodSchema } from './ZodSchemaIntrospector'
import type { ExtendedMetadataField } from './types'
import type { BioIntent } from './types'

// ============================================================================
// TYPES
// ============================================================================

export interface ZodBioObjectProps<TSchema extends z.ZodObject<any>> {
  /** Zod schema (the DNA) */
  schema: TSchema
  /** Data to display/edit (must match schema type) */
  data: z.infer<TSchema>
  /** Render mode */
  intent?: BioIntent
  /** Submit handler (called with validated data) */
  onSubmit?: (data: z.infer<TSchema>) => void | Promise<void>
  /** Cancel handler */
  onCancel?: () => void
  /** Optional grouping field name */
  groupBy?: string
  /** Loading state */
  isLoading?: boolean
  /** Additional className */
  className?: string
  /** Introspection options */
  introspectionOptions?: {
    businessTermMap?: Record<string, string>
    descriptionMap?: Record<string, string>
    requiredFields?: string[]
    hiddenFields?: string[]
    fieldOrder?: Record<string, number>
    fieldGroups?: Record<string, string>
  }
}

// ============================================================================
// ZOD BIO OBJECT - The Living Cell
// ============================================================================

/**
 * ZodBioObject - Renders UI directly from Zod schemas
 * 
 * This is the "living cell" that self-assembles from DNA (Zod schemas).
 * Feed it a schema and data, and it grows the appropriate UI automatically.
 * 
 * @example
 * ```tsx
 * const UserSchema = z.object({
 *   name: z.string().min(3),
 *   email: z.string().email(),
 *   status: z.enum(['active', 'inactive']),
 *   age: z.number().min(18),
 * })
 * 
 * <ZodBioObject
 *   schema={UserSchema}
 *   data={{ name: 'John', email: 'john@example.com', status: 'active', age: 30 }}
 *   intent="edit"
 *   onSubmit={handleSubmit}
 * />
 * ```
 */
export function ZodBioObject<TSchema extends z.ZodObject<any>>({
  schema,
  data,
  intent = 'view',
  onSubmit,
  onCancel,
  groupBy,
  isLoading = false,
  className,
  introspectionOptions = {},
}: ZodBioObjectProps<TSchema>) {
  // Introspect the Zod schema to get field metadata
  const fields = React.useMemo(() => {
    try {
      return introspectZodSchema(schema, introspectionOptions)
    } catch (error) {
      // Graceful error handling for schema introspection failures
      if (process.env.NODE_ENV === 'development') {
        console.error('Schema introspection failed:', error)
      }
      // Return empty array to prevent crash
      return []
    }
  }, [schema, introspectionOptions])

  // Use BioObject with schema-based validation
  return (
    <BioObject
      schema={schema}
      data={data}
      fields={fields}
      intent={intent}
      onSubmit={onSubmit}
      onCancel={onCancel}
      groupBy={groupBy}
      isLoading={isLoading}
      className={className}
    />
  )
}

// ============================================================================
// CONVENIENCE: ZodBioList (for table rendering)
// ============================================================================

import { BioList } from './BioList'

export interface ZodBioListProps<TSchema extends z.ZodObject<any>> {
  /** Zod schema (the DNA) */
  schema: TSchema
  /** Array of records to display */
  data: z.infer<TSchema>[]
  /** Row click handler */
  onRowClick?: (record: z.infer<TSchema>) => void
  /** Row key field (defaults to 'id') */
  rowKey?: string
  /** Loading state */
  isLoading?: boolean
  /** Additional className */
  className?: string
  /** Introspection options */
  introspectionOptions?: {
    businessTermMap?: Record<string, string>
    descriptionMap?: Record<string, string>
    hiddenFields?: string[]
    fieldOrder?: Record<string, number>
  }
  /** Custom cell renderers - Escape hatch for custom columns (e.g., action buttons) */
  customRenderers?: {
    [fieldName: string]: (value: unknown, record: z.infer<TSchema>) => React.ReactNode
  }
}

/**
 * ZodBioList - Renders a table directly from Zod schemas
 * 
 * @example
 * ```tsx
 * const UserSchema = z.object({
 *   id: z.string(),
 *   name: z.string(),
 *   email: z.string().email(),
 *   status: z.enum(['active', 'inactive']),
 * })
 * 
 * <ZodBioList
 *   schema={UserSchema}
 *   data={users}
 *   onRowClick={(user) => console.log('Clicked:', user)}
 * />
 * ```
 */
export function ZodBioList<TSchema extends z.ZodObject<any>>({
  schema,
  data,
  onRowClick,
  rowKey = 'id',
  isLoading = false,
  className,
  introspectionOptions = {},
  customRenderers,
}: ZodBioListProps<TSchema>) {
  // Introspect the Zod schema to get field metadata
  const fields = React.useMemo(() => {
    try {
      return introspectZodSchema(schema, introspectionOptions)
    } catch (error) {
      // Graceful error handling for schema introspection failures
      if (process.env.NODE_ENV === 'development') {
        console.error('Schema introspection failed:', error)
      }
      // Return empty array to prevent crash
      return []
    }
  }, [schema, introspectionOptions])

  // Convert customRenderers to BioList format (with proper typing)
  const bioListCustomRenderers = React.useMemo(() => {
    if (!customRenderers) return undefined

    return Object.fromEntries(
      Object.entries(customRenderers).map(([fieldName, renderer]) => [
        fieldName,
        (value: unknown, record: Record<string, unknown>) =>
          renderer(value, record as z.infer<TSchema>)
      ])
    )
  }, [customRenderers])

  // Use BioList with introspected fields
  return (
    <BioList
      schema={fields}
      data={data as Record<string, unknown>[]}
      onRowClick={onRowClick ? (record) => onRowClick(record as z.infer<TSchema>) : undefined}
      rowKey={rowKey}
      isLoading={isLoading}
      className={className}
      customRenderers={bioListCustomRenderers}
    />
  )
}
