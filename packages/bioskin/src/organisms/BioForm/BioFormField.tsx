/**
 * BioFormField - Schema-driven form field renderer
 * 
 * Sprint 3 Day 12 per BIOSKIN 2.1 PRD
 * Auto-generates appropriate input based on schema field type.
 */

'use client';

import * as React from 'react';
import { type UseFormRegisterReturn, type FieldError } from 'react-hook-form';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Eye, EyeOff, Calendar, Check } from 'lucide-react';
import { cn } from '../../atoms/utils';
import { Txt } from '../../atoms/Txt';
import { type BioFieldDefinition } from '../../introspector/ZodSchemaIntrospector';

// ============================================================
// Types
// ============================================================

export interface BioFormFieldProps {
  /** Field definition from schema introspection */
  definition: BioFieldDefinition;
  /** RHF register return */
  register: UseFormRegisterReturn;
  /** Field error */
  error?: string;
  /** Is field disabled */
  disabled?: boolean;
  /** Additional className */
  className?: string;
}

// ============================================================
// Base Input Styles
// ============================================================

const inputBaseStyles = cn(
  'w-full px-3 py-2 rounded-lg',
  'bg-surface-base border border-default',
  'text-body text-text-primary placeholder:text-text-muted',
  'focus:outline-none focus:ring-2 focus:ring-accent-primary/30 focus:border-accent-primary',
  'disabled:bg-surface-subtle disabled:text-text-muted disabled:cursor-not-allowed',
  'transition-colors'
);

const inputErrorStyles = cn(
  'border-status-danger focus:ring-status-danger/30 focus:border-status-danger'
);

// ============================================================
// Field Components
// ============================================================

function TextInput({
  definition,
  register,
  error,
  disabled,
}: BioFormFieldProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const isPassword = definition.name.toLowerCase().includes('password');
  const isEmail = definition.name.toLowerCase().includes('email');
  const isUrl = definition.name.toLowerCase().includes('url');
  const placeholder = definition.uiHints?.placeholder || `Enter ${definition.label.toLowerCase()}`;

  const inputType = isPassword
    ? (showPassword ? 'text' : 'password')
    : isEmail
      ? 'email'
      : isUrl
        ? 'url'
        : 'text';

  return (
    <div className="relative">
      <input
        type={inputType}
        {...register}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          inputBaseStyles,
          error && inputErrorStyles,
          isPassword && 'pr-10'
        )}
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
}

function NumberInput({
  definition,
  register,
  error,
  disabled,
}: BioFormFieldProps) {
  const placeholder = definition.uiHints?.placeholder || `Enter ${definition.label.toLowerCase()}`;

  return (
    <input
      type="number"
      {...register}
      disabled={disabled}
      placeholder={placeholder}
      className={cn(
        inputBaseStyles,
        error && inputErrorStyles,
        'tabular-nums'
      )}
    />
  );
}

function TextAreaInput({
  definition,
  register,
  error,
  disabled,
}: BioFormFieldProps) {
  const placeholder = definition.uiHints?.placeholder || `Enter ${definition.label.toLowerCase()}`;

  return (
    <textarea
      {...register}
      disabled={disabled}
      placeholder={placeholder}
      rows={4}
      className={cn(
        inputBaseStyles,
        error && inputErrorStyles,
        'resize-y min-h-[100px]'
      )}
    />
  );
}

function SelectInput({
  definition,
  register,
  error,
  disabled,
}: BioFormFieldProps) {
  const options = definition.validation?.options || [];

  return (
    <select
      {...register}
      disabled={disabled}
      className={cn(
        inputBaseStyles,
        error && inputErrorStyles,
        'cursor-pointer'
      )}
    >
      <option value="">Select {definition.label.toLowerCase()}</option>
      {options.map((option: string) => (
        <option key={option} value={option}>
          {option.charAt(0).toUpperCase() + option.slice(1).replace(/_/g, ' ')}
        </option>
      ))}
    </select>
  );
}

function CheckboxInput({
  definition,
  register,
  error,
  disabled,
}: BioFormFieldProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        {...register}
        disabled={disabled}
        className={cn(
          'h-5 w-5 rounded border-border-default',
          'text-accent-primary focus:ring-accent-primary focus:ring-offset-0',
          'cursor-pointer disabled:cursor-not-allowed',
          error && 'border-status-danger'
        )}
      />
      <span className={cn(
        'text-body',
        disabled ? 'text-text-muted' : 'text-text-primary'
      )}>
        {definition.description || definition.label}
      </span>
    </label>
  );
}

function DateInput({
  definition,
  register,
  error,
  disabled,
}: BioFormFieldProps) {
  return (
    <div className="relative">
      <input
        type="date"
        {...register}
        disabled={disabled}
        className={cn(
          inputBaseStyles,
          error && inputErrorStyles,
          'pr-10'
        )}
      />
      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function BioFormField({
  definition,
  register,
  error,
  disabled = false,
  className,
}: BioFormFieldProps) {
  // Determine field type
  const isLongText = definition.name.toLowerCase().includes('description') ||
    definition.name.toLowerCase().includes('content') ||
    definition.name.toLowerCase().includes('notes') ||
    definition.name.toLowerCase().includes('body');

  const renderInput = () => {
    // Boolean → Checkbox
    if (definition.type === 'boolean') {
      return <CheckboxInput definition={definition} register={register} error={error} disabled={disabled} />;
    }

    // Enum → Select
    if (definition.type === 'enum' && definition.validation?.options?.length) {
      return <SelectInput definition={definition} register={register} error={error} disabled={disabled} />;
    }

    // Date → Date picker
    if (definition.type === 'date') {
      return <DateInput definition={definition} register={register} error={error} disabled={disabled} />;
    }

    // Number → Number input
    if (definition.type === 'number') {
      return <NumberInput definition={definition} register={register} error={error} disabled={disabled} />;
    }

    // Long text → Textarea
    if (isLongText) {
      return <TextAreaInput definition={definition} register={register} error={error} disabled={disabled} />;
    }

    // Default → Text input
    return <TextInput definition={definition} register={register} error={error} disabled={disabled} />;
  };

  // Boolean fields have inline label
  if (definition.type === 'boolean') {
    return (
      <div className={cn('space-y-1', className)}>
        {renderInput()}
        <FieldError error={error} />
      </div>
    );
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <FieldLabel definition={definition} />
      {renderInput()}
      <FieldError error={error} />
    </div>
  );
}

// ============================================================
// Helper Components
// ============================================================

function FieldLabel({ definition }: { definition: BioFieldDefinition }) {
  return (
    <label className="flex items-center gap-1">
      <Txt variant="label" color="secondary">
        {definition.label}
      </Txt>
      {definition.required && (
        <span className="text-status-danger text-small">*</span>
      )}
    </label>
  );
}

function FieldError({ error }: { error?: string }) {
  return (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="flex items-center gap-1.5 text-status-danger"
        >
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          <Txt variant="caption" color="danger">
            {error}
          </Txt>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

BioFormField.displayName = 'BioFormField';

// Export helper components
export { FieldLabel, FieldError };
