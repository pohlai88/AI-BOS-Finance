// ============================================================================
// BIOSKIN: BioCell - Primitive Mapper
// ============================================================================
// Maps Kernel metadata types to atomic UI components
// 🛡️ GOVERNANCE: Only uses Surface, Txt, Btn, Input, StatusDot
// ============================================================================

'use client';

import React from 'react';
import { Txt } from '@/components/ui/Txt';
import { Input } from '@/components/ui/Input';
import { StatusDot } from '@/components/ui/StatusDot';
import type { ExtendedMetadataField, BioIntent } from './types';

// Re-export Intent for backward compatibility
export type Intent = BioIntent;

// ============================================================================
// TYPES
// ============================================================================

export interface BioCellProps {
  /** Field metadata from Kernel */
  fieldMeta: ExtendedMetadataField;
  /** Current field value */
  value: unknown;
  /** Render mode: view (read-only) or edit (editable) */
  intent?: BioIntent;
  /** Callback when value changes (edit mode only) */
  onChange?: (value: unknown) => void;
  /** Error message to display (edit mode only) */
  error?: string;
  /** Optional input id (for a11y wiring from BioObject) */
  inputId?: string;
  /** Optional aria-labelledby (for a11y wiring from BioObject) */
  ariaLabelledBy?: string;
  /** Optional aria-describedby (for a11y wiring from BioObject) */
  ariaDescribedBy?: string;
  /** Optional error id (for a11y wiring from BioObject) */
  errorId?: string;
  /** Additional className */
  className?: string;
}

// ============================================================================
// BIO CELL - Primitive Mapper
// ============================================================================

export function BioCell({
  fieldMeta,
  value,
  intent = 'view',
  onChange,
  error,
  inputId,
  ariaLabelledBy,
  ariaDescribedBy,
  errorId,
  className,
}: BioCellProps) {
  // View mode: render read-only display
  if (intent === 'view') {
    return <BioCellView fieldMeta={fieldMeta} value={value} className={className} />;
  }

  // Edit mode: render editable input
  return (
    <div className={className}>
      <BioCellEdit
        fieldMeta={fieldMeta}
        value={value}
        onChange={onChange}
        error={error}
        inputId={inputId}
        ariaLabelledBy={ariaLabelledBy}
        ariaDescribedBy={ariaDescribedBy}
      />
      {/* Error message display */}
      {error && (
        <Txt variant="small" className="text-status-error mt-1">
          {errorId ? <span id={errorId}>{error}</span> : error}
        </Txt>
      )}
    </div>
  );
}

// ============================================================================
// VIEW MODE
// ============================================================================

function BioCellView({
  fieldMeta,
  value,
  className,
}: {
  fieldMeta: ExtendedMetadataField;
  value: unknown;
  className?: string;
}) {
  const { data_type, business_term } = fieldMeta;

  // Handle null/undefined
  if (value === null || value === undefined) {
    return (
      <Txt variant="body" className="text-text-tertiary italic">
        —
      </Txt>
    );
  }

  switch (data_type) {
    case 'text':
    case 'code':
      return (
        <Txt variant="body" className={className}>
          {String(value)}
        </Txt>
      );

    case 'number':
    case 'money':
      return (
        <Txt variant="body" className={`font-mono ${className || ''}`}>
          {typeof value === 'number' ? formatNumber(value, data_type) : String(value)}
        </Txt>
      );

    case 'boolean':
      return (
        <div className={`flex items-center gap-2 ${className || ''}`}>
          <StatusDot variant={value ? 'success' : 'neutral'} size="sm" />
          <Txt variant="body">{value ? 'Yes' : 'No'}</Txt>
        </div>
      );

    case 'enum':
    case 'status':
      // Check if it's a status enum (use StatusDot)
      const statusValue = String(value);
      const isStatus = fieldMeta.business_term.toLowerCase().includes('status') ||
        statusValue.toLowerCase().includes('pending') ||
        statusValue.toLowerCase().includes('approved') ||
        statusValue.toLowerCase().includes('rejected');

      if (isStatus) {
        const statusVariant = mapStatusToVariant(statusValue);
        return (
          <div className={`flex items-center gap-2 ${className || ''}`}>
            <StatusDot variant={statusVariant} size="sm" />
            <Txt variant="body">{statusValue}</Txt>
          </div>
        );
      }

      return (
        <Txt variant="body" className={className}>
          {statusValue}
        </Txt>
      );

    case 'date':
    case 'datetime':
      return (
        <Txt variant="body" className={className}>
          {formatDate(value as string, data_type)}
        </Txt>
      );

    default:
      return (
        <Txt variant="body" className={className}>
          {String(value)}
        </Txt>
      );
  }
}

// ============================================================================
// EDIT MODE
// ============================================================================

function BioCellEdit({
  fieldMeta,
  value,
  onChange,
  error,
  inputId,
  ariaLabelledBy,
  ariaDescribedBy,
  className,
}: {
  fieldMeta: ExtendedMetadataField;
  value: unknown;
  onChange?: (value: unknown) => void;
  error?: string;
  inputId?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  className?: string;
}) {
  const { data_type, business_term, readOnly, required } = fieldMeta;

  // Read-only fields: render as view
  if (readOnly) {
    return <BioCellView fieldMeta={fieldMeta} value={value} className={className} />;
  }

  const handleChange = (newValue: string) => {
    if (!onChange) return;

    // Type conversion based on data_type
    let convertedValue: unknown = newValue;

    if (data_type === 'number' || data_type === 'money') {
      convertedValue = newValue === '' ? null : Number(newValue);
    } else if (data_type === 'boolean') {
      convertedValue = newValue === 'true' || newValue === 'yes';
    }

    onChange(convertedValue);
  };

  switch (data_type) {
    case 'text':
    case 'code':
      return (
        <Input
          id={inputId}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          aria-invalid={!!error}
          value={value === null || value === undefined ? '' : String(value)}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={business_term}
          required={required}
          error={!!error}
          className={className}
        />
      );

    case 'number':
    case 'money':
      return (
        <Input
          id={inputId}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          aria-invalid={!!error}
          type="number"
          value={value === null || value === undefined ? '' : String(value)}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={business_term}
          required={required}
          error={!!error}
          className={className}
        />
      );

    case 'boolean':
      // v0: Simple text input (switch can be v1)
      return (
        <Input
          id={inputId}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          aria-invalid={!!error}
          value={value === true ? 'Yes' : value === false ? 'No' : ''}
          onChange={(e) => {
            const val = e.target.value.toLowerCase();
            onChange?.(val === 'yes' || val === 'true');
          }}
          placeholder="Yes / No"
          required={required}
          error={!!error}
          className={className}
        />
      );

    case 'enum':
      // v0: Text input (select dropdown can be v1)
      return (
        <Input
          id={inputId}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          aria-invalid={!!error}
          value={value === null || value === undefined ? '' : String(value)}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={business_term}
          required={required}
          error={!!error}
          className={className}
        />
      );

    case 'date':
    case 'datetime':
      return (
        <Input
          id={inputId}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          aria-invalid={!!error}
          type={data_type === 'date' ? 'date' : 'datetime-local'}
          value={value === null || value === undefined ? '' : String(value)}
          onChange={(e) => handleChange(e.target.value)}
          required={required}
          error={!!error}
          className={className}
        />
      );

    default:
      return (
        <Input
          id={inputId}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          aria-invalid={!!error}
          value={value === null || value === undefined ? '' : String(value)}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={business_term}
          error={!!error}
          className={className}
        />
      );
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function formatNumber(value: number, dataType: string): string {
  if (dataType === 'money') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  }
  return new Intl.NumberFormat('en-US').format(value);
}

function formatDate(value: string, dataType: string): string {
  try {
    const date = new Date(value);
    if (dataType === 'date') {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(value);
  }
}

function mapStatusToVariant(status: string): 'success' | 'warning' | 'error' | 'neutral' {
  const lower = status.toLowerCase();
  if (lower.includes('approved') || lower.includes('paid') || lower.includes('success')) {
    return 'success';
  }
  if (lower.includes('pending') || lower.includes('warning')) {
    return 'warning';
  }
  if (lower.includes('rejected') || lower.includes('error') || lower.includes('failed')) {
    return 'error';
  }
  return 'neutral';
}
