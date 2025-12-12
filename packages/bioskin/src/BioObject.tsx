// ============================================================================
// BIOSKIN: BioObject - Tissue Renderer
// ============================================================================
// Auto-renders a sectioned "details/form" layout from Kernel metadata
// 🛡️ GOVERNANCE: Only uses Surface, Txt, BioCell (which uses atoms)
// ============================================================================

'use client'

import React, { useState, useCallback } from 'react'
import { z } from 'zod'
import { Surface, Txt, Btn } from '@aibos/ui'
import { BioCell } from './BioCell'
import type {
  ExtendedMetadataField,
  BioIntent,
  FieldErrors,
  BioObjectPropsWithoutSchema,
  BioObjectPropsWithSchema,
} from './types'

// ============================================================================
// TYPE GUARDS
// ============================================================================

function hasSchema<TSchema extends z.ZodObject<any>>(
  props: BioObjectPropsWithSchema<TSchema> | BioObjectPropsWithoutSchema
): props is BioObjectPropsWithSchema<TSchema> {
  return (
    'schema' in props &&
    'fields' in props &&
    typeof props.schema === 'object' &&
    props.schema !== null &&
    '_def' in props.schema
  )
}

// ============================================================================
// BIO OBJECT - Tissue Renderer
// ============================================================================

export function BioObject<TSchema extends z.ZodObject<any> = z.ZodObject<any>>(
  props: BioObjectPropsWithSchema<TSchema> | BioObjectPropsWithoutSchema
) {
  // Handle schema-based props
  if (hasSchema(props)) {
    return <BioObjectWithSchema {...props} />
  }

  // Handle simple props (backward compatible)
  return <BioObjectSimple {...props} />
}

// ============================================================================
// SCHEMA-BASED BIO OBJECT (with validation)
// ============================================================================

function BioObjectWithSchema<TSchema extends z.ZodObject<any>>({
  schema,
  data,
  fields,
  intent = 'view',
  onSubmit,
  onCancel,
  groupBy,
  isLoading = false,
  className,
}: BioObjectPropsWithSchema<TSchema>) {
  const [draft, setDraft] = useState<z.infer<TSchema>>(data)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [dirty, setDirty] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Loading state: render skeleton
  if (isLoading) {
    return (
      <div className={`space-y-6 ${className || ''}`}>
        {[1, 2].map((groupIdx) => (
          <Surface key={groupIdx} variant="base" className="p-6">
            <div className="mb-4 h-6 w-48 animate-pulse rounded-action bg-surface-flat" />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {[1, 2, 3, 4].map((fieldIdx) => (
                <div key={fieldIdx} className="space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded-action bg-surface-flat" />
                  <div className="h-10 w-full animate-pulse rounded-action bg-surface-flat" />
                </div>
              ))}
            </div>
          </Surface>
        ))}
      </div>
    )
  }

  // Filter visible fields
  const visibleFields = fields.filter((field) => !field.hidden)

  // Group fields if groupBy is specified
  const groupedFields = groupBy
    ? groupFieldsByGroup(visibleFields, groupBy)
    : { default: visibleFields }

  // Handle field change
  const handleFieldChange = useCallback(
    (fieldName: string, value: unknown) => {
      setDraft((prev) => ({
        ...prev,
        [fieldName]: value,
      }))
      setDirty(true)
      // Clear error for this field when user starts typing
      if (errors[fieldName]) {
        setErrors((prev) => {
          const next = { ...prev }
          delete next[fieldName]
          return next
        })
      }
    },
    [errors]
  )

  // Validate whole object
  const validate = useCallback((): boolean => {
    const result = schema.safeParse(draft)
    if (!result.success) {
      const next: FieldErrors = {}
      for (const issue of result.error.issues) {
        const key = issue.path.join('.')
        next[key] = issue.message
      }
      setErrors(next)
      return false
    }
    setErrors({})
    return true
  }, [schema, draft])

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!validate()) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit?.(draft)
      setDirty(false)
    } catch (error) {
      // Handle server errors (map back to field errors)
      if (error && typeof error === 'object' && 'fieldErrors' in error) {
        setErrors(error.fieldErrors as FieldErrors)
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [draft, validate, onSubmit])

  // Handle cancel
  const handleCancel = useCallback(() => {
    setDraft(data)
    setErrors({})
    setDirty(false)
    onCancel?.()
  }, [data, onCancel])

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {Object.entries(groupedFields).map(([groupName, fields]) => (
        <BioObjectSection
          key={groupName}
          groupName={groupName === 'default' ? undefined : groupName}
          fields={fields}
          data={draft as Record<string, unknown>}
          intent={intent}
          onChange={handleFieldChange}
          errors={errors}
        />
      ))}

      {/* Submit/Cancel buttons (edit mode only) */}
      {intent === 'edit' && (
        <div className="flex items-center gap-3">
          <Btn variant="primary" onClick={handleSubmit} loading={isSubmitting}>
            Save Changes
          </Btn>
          {dirty && (
            <Btn
              variant="secondary"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Btn>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// SIMPLE BIO OBJECT (backward compatible, no validation)
// ============================================================================

function BioObjectSimple({
  schema,
  data,
  intent = 'view',
  onChange,
  groupBy,
  isLoading = false,
  className,
}: BioObjectPropsWithoutSchema) {
  // Loading state: render skeleton
  if (isLoading) {
    return (
      <div className={`space-y-6 ${className || ''}`}>
        {[1, 2].map((groupIdx) => (
          <Surface key={groupIdx} variant="base" className="p-6">
            <div className="mb-4 h-6 w-48 animate-pulse rounded-action bg-surface-flat" />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {[1, 2, 3, 4].map((fieldIdx) => (
                <div key={fieldIdx} className="space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded-action bg-surface-flat" />
                  <div className="h-10 w-full animate-pulse rounded-action bg-surface-flat" />
                </div>
              ))}
            </div>
          </Surface>
        ))}
      </div>
    )
  }

  // Filter out hidden fields
  const visibleFields = schema.filter((field) => !field.hidden)

  // Group fields if groupBy is specified
  const groupedFields = groupBy
    ? groupFieldsByGroup(visibleFields, groupBy)
    : { default: visibleFields }

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {Object.entries(groupedFields).map(([groupName, fields]) => (
        <BioObjectSection
          key={groupName}
          groupName={groupName === 'default' ? undefined : groupName}
          fields={fields}
          data={data}
          intent={intent}
          onChange={onChange}
          errors={{}}
        />
      ))}
    </div>
  )
}

// ============================================================================
// SECTION COMPONENT
// ============================================================================

interface BioObjectSectionProps {
  groupName?: string
  fields: ExtendedMetadataField[]
  data: Record<string, unknown>
  intent: BioIntent
  onChange?: (fieldName: string, value: unknown) => void
  errors: FieldErrors
}

function BioObjectSection({
  groupName,
  fields,
  data,
  intent,
  onChange,
  errors,
}: BioObjectSectionProps) {
  // Sort fields by order if specified
  const sortedFields = [...fields].sort((a, b) => {
    const orderA = a.order ?? 999
    const orderB = b.order ?? 999
    return orderA - orderB
  })

  return (
    <Surface variant="base" className="p-6">
      {groupName && (
        <Txt
          variant="h3"
          className="border-border-surface-base mb-4 border-b pb-2"
        >
          {groupName}
        </Txt>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {sortedFields.map((field) => {
          const value = data[field.technical_name]
          const isRequired = field.required
          const safeKey = String(field.technical_name).replace(
            /[^a-zA-Z0-9_-]/g,
            '_'
          )
          const inputId = `bioskin-${safeKey}`
          const labelId = `bioskin-label-${safeKey}`
          const helpId = field.description
            ? `bioskin-help-${safeKey}`
            : undefined
          const errorId = errors[field.technical_name]
            ? `bioskin-error-${safeKey}`
            : undefined
          const describedBy =
            [helpId, errorId].filter(Boolean).join(' ') || undefined

          return (
            <div key={field.technical_name} className="space-y-2">
              {/* Label - Use actual <label> for better a11y */}
              <label
                htmlFor={inputId}
                id={labelId}
                className="flex items-center gap-2"
              >
                <Txt variant="subtle" className="font-medium">
                  {field.business_term}
                </Txt>
                {isRequired && (
                  <Txt variant="small" className="text-status-error">
                    <span aria-hidden="true">*</span>
                  </Txt>
                )}
              </label>

              {/* Help Text */}
              {field.description && (
                <Txt variant="small" className="text-text-tertiary">
                  <span id={helpId}>{field.description}</span>
                </Txt>
              )}

              {/* Cell Renderer */}
              <BioCell
                fieldMeta={field}
                value={value}
                intent={intent}
                onChange={
                  onChange
                    ? (newValue) => onChange(field.technical_name, newValue)
                    : undefined
                }
                error={errors[field.technical_name]}
                inputId={inputId}
                ariaLabelledBy={labelId}
                ariaDescribedBy={describedBy}
                errorId={errorId}
              />
            </div>
          )
        })}
      </div>
    </Surface>
  )
}

// ============================================================================
// HELPERS
// ============================================================================

function groupFieldsByGroup(
  fields: ExtendedMetadataField[],
  _groupBy: string
): Record<string, ExtendedMetadataField[]> {
  const groups: Record<string, ExtendedMetadataField[]> = {}

  for (const field of fields) {
    const group = field.group || 'default'
    if (!groups[group]) {
      groups[group] = []
    }
    groups[group].push(field)
  }

  return groups
}
