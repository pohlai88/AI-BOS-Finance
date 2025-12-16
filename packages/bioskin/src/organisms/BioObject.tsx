/**
 * BioObject - Schema-driven object display component
 * 
 * Layer 3 (organisms) per CONT_10 BioSkin Architecture
 * Auto-renders a single object from Zod schema introspection.
 */

'use client';

import * as React from 'react';
import { z } from 'zod';
import { Surface } from '../atoms/Surface';
import { Field } from '../atoms/Field';
import { Txt } from '../atoms/Txt';
import { Btn } from '../atoms/Btn';
import { cn } from '../atoms/utils';
import { introspectZodSchema, type BioSchemaDefinition } from '../introspector/ZodSchemaIntrospector';

export interface BioObjectProps<T extends z.ZodRawShape> {
  /** Zod schema defining the object structure */
  schema: z.ZodObject<T>;
  /** Data to display/edit */
  data: z.infer<z.ZodObject<T>>;
  /** Display mode */
  mode?: 'view' | 'edit';
  /** Layout direction */
  layout?: 'vertical' | 'horizontal' | 'grid';
  /** Title override (defaults to schema description) */
  title?: string;
  /** Show title */
  showTitle?: boolean;
  /** Fields to include (defaults to all) */
  include?: (keyof T)[];
  /** Fields to exclude */
  exclude?: (keyof T)[];
  /** Called when field value changes in edit mode */
  onChange?: (name: string, value: unknown) => void;
  /** Called when save is requested */
  onSave?: (data: z.infer<z.ZodObject<T>>) => void;
  /** Additional className */
  className?: string;
}

const layoutClasses = {
  vertical: 'flex flex-col gap-4',
  horizontal: 'flex flex-row flex-wrap gap-6',
  grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
} as const;

export function BioObject<T extends z.ZodRawShape>({
  schema,
  data,
  mode = 'view',
  layout = 'vertical',
  title,
  showTitle = true,
  include,
  exclude,
  onChange,
  onSave,
  className,
}: BioObjectProps<T>) {
  const [editedData, setEditedData] = React.useState<Record<string, unknown>>(
    data as Record<string, unknown>
  );
  const [errors, setErrors] = React.useState<Record<string, string>>({});

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
  const handleFieldChange = React.useCallback(
    (name: string, value: unknown) => {
      setEditedData((prev) => ({ ...prev, [name]: value }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
      onChange?.(name, value);
    },
    [onChange]
  );

  // Handle save
  const handleSave = React.useCallback(() => {
    // Validate all fields
    const result = schema.safeParse(editedData);
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

    onSave?.(result.data);
  }, [schema, editedData, onSave]);

  const displayTitle = title || definition.name;

  return (
    <Surface className={cn('space-y-4', className)}>
      {showTitle && displayTitle && displayTitle !== 'Object' && (
        <Txt variant="heading" as="h3">
          {displayTitle}
        </Txt>
      )}

      <div className={layoutClasses[layout]}>
        {fields.map((field) => (
          <Field
            key={field.name}
            field={field}
            value={mode === 'edit' ? editedData[field.name] : (data as Record<string, unknown>)[field.name]}
            mode={mode}
            onChange={handleFieldChange}
            error={errors[field.name]}
          />
        ))}
      </div>

      {mode === 'edit' && onSave && (
        <div className="flex justify-end pt-4 border-t border-default">
          <Btn onClick={handleSave} variant="primary">
            Save
          </Btn>
        </div>
      )}
    </Surface>
  );
}

BioObject.displayName = 'BioObject';

export const COMPONENT_META = {
  code: 'BIOSKIN_BioObject',
  version: '1.0.0',
  layer: 'organisms',
  family: 'DATA',
  status: 'stable',
} as const;
