/**
 * Field - Form field primitive for schema-driven forms
 * 
 * Layer 1 (atoms) per CONT_10 BioSkin Architecture
 * Used by BioForm to render fields from Zod schema introspection
 */

import * as React from 'react';
import { cn } from './utils';
import { Txt } from './Txt';

export interface FieldDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum' | 'array' | 'object';
  label: string;
  description?: string;
  required: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
  uiHints?: {
    placeholder?: string;
    readonly?: boolean;
  };
}

export interface FieldProps {
  field: FieldDefinition;
  value: unknown;
  mode: 'view' | 'edit';
  onChange?: (name: string, value: unknown) => void;
  error?: string;
  className?: string;
}

export function Field({
  field,
  value,
  mode,
  onChange,
  error,
  className,
}: FieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (onChange) {
      let newValue: unknown = e.target.value;
      if (field.type === 'number') {
        newValue = e.target.value === '' ? undefined : Number(e.target.value);
      } else if (field.type === 'boolean') {
        newValue = (e.target as HTMLInputElement).checked;
      }
      onChange(field.name, newValue);
    }
  };

  // View mode - just display the value
  if (mode === 'view') {
    return (
      <div className={cn('space-y-1', className)}>
        <Txt variant="label" color="secondary">
          {field.label}
        </Txt>
        <Txt variant="body" className="block">
          {formatValue(value, field.type)}
        </Txt>
      </div>
    );
  }

  // Edit mode - render appropriate input
  return (
    <div className={cn('space-y-1', className)}>
      <label htmlFor={field.name} className="block">
        <Txt variant="label" color="secondary">
          {field.label}
          {field.required && <span className="text-status-danger ml-1">*</span>}
        </Txt>
      </label>

      {field.type === 'enum' && field.validation?.options ? (
        <select
          id={field.name}
          name={field.name}
          value={String(value ?? '')}
          onChange={handleChange}
          disabled={field.uiHints?.readonly}
          className={cn(
            'w-full h-10 px-3 rounded-md border border-default bg-surface-card text-text-primary',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-status-danger'
          )}
        >
          <option value="">Select {field.label}...</option>
          {field.validation.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : field.type === 'boolean' ? (
        <input
          type="checkbox"
          id={field.name}
          name={field.name}
          checked={Boolean(value)}
          onChange={handleChange}
          disabled={field.uiHints?.readonly}
          className="h-4 w-4 rounded border-default text-primary focus:ring-primary"
        />
      ) : (
        <input
          type={getInputType(field.type)}
          id={field.name}
          name={field.name}
          value={String(value ?? '')}
          onChange={handleChange}
          placeholder={field.uiHints?.placeholder || `Enter ${field.label.toLowerCase()}...`}
          readOnly={field.uiHints?.readonly}
          min={field.validation?.min}
          max={field.validation?.max}
          pattern={field.validation?.pattern}
          className={cn(
            'w-full h-10 px-3 rounded-md border border-default bg-surface-card text-text-primary',
            'placeholder:text-text-tertiary',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'read-only:bg-surface-nested',
            error && 'border-status-danger'
          )}
        />
      )}

      {field.description && !error && (
        <Txt variant="caption" color="tertiary" className="block">
          {field.description}
        </Txt>
      )}

      {error && (
        <Txt variant="caption" color="danger" className="block">
          {error}
        </Txt>
      )}
    </div>
  );
}

function getInputType(fieldType: FieldDefinition['type']): string {
  switch (fieldType) {
    case 'number':
      return 'number';
    case 'date':
      return 'date';
    default:
      return 'text';
  }
}

function formatValue(value: unknown, type: FieldDefinition['type']): string {
  if (value === null || value === undefined) return '—';
  if (type === 'boolean') return value ? 'Yes' : 'No';
  if (type === 'date' && value instanceof Date) return value.toLocaleDateString();
  if (type === 'array' && Array.isArray(value)) return value.join(', ');
  if (type === 'object') return JSON.stringify(value);
  return String(value);
}

Field.displayName = 'Field';

export const COMPONENT_META = {
  code: 'BIOSKIN_Field',
  version: '1.0.0',
  layer: 'atoms',
  family: 'INPUT',
  status: 'stable',
} as const;
