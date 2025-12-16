/**
 * useBioForm - React Hook Form + Zod resolver hook
 * 
 * Sprint 3 Day 11 per BIOSKIN 2.1 PRD
 * Provides type-safe form state with Zod validation.
 * 
 * @example
 * const { form, handleSubmit, fields, isSubmitting } = useBioForm({
 *   schema: PaymentSchema,
 *   onSubmit: async (data) => { ... },
 * });
 */

import * as React from 'react';
import {
  useForm,
  type UseFormReturn,
  type FieldValues,
  type FieldErrors,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { introspectZodSchema, type BioFieldDefinition, type BioSchemaDefinition } from '../../introspector/ZodSchemaIntrospector';

// ============================================================
// Types
// ============================================================

export type FormMode = 'create' | 'edit' | 'view';

export interface UseBioFormOptions<TSchema extends z.ZodObject<z.ZodRawShape>> {
  /** Zod schema for validation */
  schema: TSchema;
  /** Initial/default values */
  defaultValues?: Partial<z.infer<TSchema>>;
  /** Submit handler */
  onSubmit: (data: z.infer<TSchema>) => void | Promise<void>;
  /** Form mode */
  mode?: FormMode;
  /** Validation mode */
  validationMode?: 'onBlur' | 'onChange' | 'onSubmit' | 'onTouched' | 'all';
  /** Fields to include */
  include?: string[];
  /** Fields to exclude */
  exclude?: string[];
  /** Reset form after successful submit */
  resetOnSuccess?: boolean;
}

export interface UseBioFormReturn<TData extends FieldValues> {
  /** React Hook Form instance */
  form: UseFormReturn<TData>;
  /** Introspected schema definition */
  definition: BioSchemaDefinition;
  /** Filtered field definitions */
  fields: BioFieldDefinition[];
  /** Form mode */
  mode: FormMode;
  /** Is form submitting */
  isSubmitting: boolean;
  /** Is form valid */
  isValid: boolean;
  /** Is form dirty (has changes) */
  isDirty: boolean;
  /** Field errors */
  errors: FieldErrors<TData>;
  /** Handle form submit */
  handleSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  /** Reset form to default values */
  reset: () => void;
  /** Set a specific field value */
  setValue: UseFormReturn<TData>['setValue'];
  /** Get a specific field value */
  getValue: UseFormReturn<TData>['getValues'];
  /** Clear all errors */
  clearErrors: () => void;
  /** Trigger validation for specific field or all */
  trigger: UseFormReturn<TData>['trigger'];
}

// ============================================================
// Main Hook
// ============================================================

export function useBioForm<TSchema extends z.ZodObject<z.ZodRawShape>>({
  schema,
  defaultValues,
  onSubmit,
  mode = 'create',
  validationMode = 'onBlur',
  include,
  exclude,
  resetOnSuccess = false,
}: UseBioFormOptions<TSchema>): UseBioFormReturn<z.infer<TSchema>> {
  type TData = z.infer<TSchema>;

  // Introspect schema
  const definition = React.useMemo(() => introspectZodSchema(schema as z.ZodObject<z.ZodRawShape>), [schema]);

  // Filter fields based on include/exclude
  const fields = React.useMemo(() => {
    let filtered = definition.fields;

    if (include && include.length > 0) {
      const includeSet = new Set(include);
      filtered = filtered.filter(f => includeSet.has(f.name));
    }

    if (exclude && exclude.length > 0) {
      const excludeSet = new Set(exclude);
      filtered = filtered.filter(f => !excludeSet.has(f.name));
    }

    return filtered;
  }, [definition.fields, include, exclude]);

  // Create form instance with Zod resolver
  const form = useForm<TData>({
    resolver: zodResolver(schema) as never,
    defaultValues: defaultValues as never,
    mode: validationMode,
  });

  const {
    handleSubmit: rhfHandleSubmit,
    reset,
    setValue,
    getValues,
    clearErrors,
    trigger,
    formState: { isSubmitting, isValid, isDirty, errors },
  } = form;

  // Wrapped submit handler
  const handleSubmit = React.useCallback(
    async (e?: React.BaseSyntheticEvent) => {
      e?.preventDefault();

      await rhfHandleSubmit(async (data) => {
        await onSubmit(data);
        if (resetOnSuccess) {
          reset();
        }
      })(e);
    },
    [rhfHandleSubmit, onSubmit, resetOnSuccess, reset]
  );

  // Reset helper
  const handleReset = React.useCallback(() => {
    reset(defaultValues as never);
  }, [reset, defaultValues]);

  return {
    form,
    definition,
    fields,
    mode,
    isSubmitting,
    isValid,
    isDirty,
    errors,
    handleSubmit,
    reset: handleReset,
    setValue,
    getValue: getValues,
    clearErrors,
    trigger,
  };
}

// ============================================================
// Field Registration Helper
// ============================================================

export interface FieldRegistration {
  /** Field name */
  name: string;
  /** Field definition from schema */
  definition: BioFieldDefinition;
  /** RHF register return */
  register: ReturnType<UseFormReturn<FieldValues>['register']>;
  /** Field error */
  error?: string;
  /** Is field required */
  required: boolean;
  /** Is field disabled (view mode) */
  disabled: boolean;
}

/**
 * Helper to get field registration for a specific field
 */
export function useFieldRegistration(
  form: UseFormReturn<FieldValues>,
  fields: BioFieldDefinition[],
  mode: FormMode
): FieldRegistration[] {
  const { register, formState: { errors } } = form;

  return fields.map(field => ({
    name: field.name,
    definition: field,
    register: register(field.name),
    error: (errors[field.name] as { message?: string })?.message,
    required: field.required,
    disabled: mode === 'view',
  }));
}
