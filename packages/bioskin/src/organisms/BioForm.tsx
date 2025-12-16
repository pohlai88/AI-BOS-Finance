/**
 * BioForm - Schema-driven form component
 * 
 * Layer 3 (organisms) per CONT_10 BioSkin Architecture
 * Auto-generates a form from Zod schema introspection.
 */

'use client';

import * as React from 'react';
import { z } from 'zod';
import { Surface } from '../atoms/Surface';
import { Field } from '../atoms/Field';
import { Txt } from '../atoms/Txt';
import { Btn } from '../atoms/Btn';
import { cn } from '../atoms/utils';
import { introspectZodSchema } from '../introspector/ZodSchemaIntrospector';

export interface BioFormProps<T extends z.ZodRawShape> {
  /** Zod schema defining the form structure */
  schema: z.ZodObject<T>;
  /** Initial form data (optional) */
  defaultValues?: Partial<z.infer<z.ZodObject<T>>>;
  /** Called when form is submitted with valid data */
  onSubmit: (data: z.infer<z.ZodObject<T>>) => void | Promise<void>;
  /** Called when form is cancelled */
  onCancel?: () => void;
  /** Title for the form */
  title?: string;
  /** Submit button text */
  submitLabel?: string;
  /** Cancel button text */
  cancelLabel?: string;
  /** Show loading state */
  loading?: boolean;
  /** Layout direction */
  layout?: 'vertical' | 'horizontal' | 'grid';
  /** Fields to include (defaults to all) */
  include?: (keyof T)[];
  /** Fields to exclude */
  exclude?: (keyof T)[];
  /** Additional className */
  className?: string;
}

const layoutClasses = {
  vertical: 'flex flex-col gap-4',
  horizontal: 'flex flex-row flex-wrap gap-6',
  grid: 'grid grid-cols-1 md:grid-cols-2 gap-4',
} as const;

export function BioForm<T extends z.ZodRawShape>({
  schema,
  defaultValues,
  onSubmit,
  onCancel,
  title,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  loading = false,
  layout = 'vertical',
  include,
  exclude,
  className,
}: BioFormProps<T>) {
  const [formData, setFormData] = React.useState<Record<string, unknown>>(
    (defaultValues as Record<string, unknown>) || {}
  );
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Introspect schema
  const definition = React.useMemo(() => introspectZodSchema(schema), [schema]);

  // Filter fields based on include/exclude
  const fields = React.useMemo(() => {
    let filtered = definition.fields;

    if (include && include.length > 0) {
      const includeSet = new Set(include.map(String));
      filtered = filtered.filter((f) => includeSet.has(f.name));
    }

    if (exclude && exclude.length > 0) {
      const excludeSet = new Set(exclude.map(String));
      filtered = filtered.filter((f) => !excludeSet.has(f.name));
    }

    return filtered;
  }, [definition.fields, include, exclude]);

  // Handle field change
  const handleFieldChange = React.useCallback((name: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  // Handle form submission
  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate all fields
      const result = schema.safeParse(formData);
      if (!result.success) {
        const newErrors: Record<string, string> = {};
        // Zod v4 uses .issues instead of .errors
        const issues = (result.error as unknown as { issues?: Array<{ path: (string | number)[]; message: string }> })?.issues || [];
        for (const issue of issues) {
          const path = issue.path.join('.');
          newErrors[path] = issue.message;
        }
        setErrors(newErrors);
        return;
      }

      setIsSubmitting(true);
      try {
        await onSubmit(result.data);
      } finally {
        setIsSubmitting(false);
      }
    },
    [schema, formData, onSubmit]
  );

  const displayTitle = title || definition.name;
  const isLoading = loading || isSubmitting;

  return (
    <Surface className={cn('space-y-4', className)}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {displayTitle && displayTitle !== 'Object' && (
          <Txt variant="heading" as="h3">
            {displayTitle}
          </Txt>
        )}

        <div className={layoutClasses[layout]}>
          {fields.map((field) => (
            <Field
              key={field.name}
              field={field}
              value={formData[field.name]}
              mode="edit"
              onChange={handleFieldChange}
              error={errors[field.name]}
            />
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-default">
          {onCancel && (
            <Btn
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isLoading}
            >
              {cancelLabel}
            </Btn>
          )}
          <Btn type="submit" variant="primary" loading={isLoading}>
            {submitLabel}
          </Btn>
        </div>
      </form>
    </Surface>
  );
}

BioForm.displayName = 'BioForm';

export const COMPONENT_META = {
  code: 'BIOSKIN_BioForm',
  version: '1.0.0',
  layer: 'organisms',
  family: 'INPUT',
  status: 'stable',
} as const;
