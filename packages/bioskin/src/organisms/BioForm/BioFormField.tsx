/**
 * BioFormField - Schema-driven form field renderer
 * 
 * Sprint 3 Day 12 per BIOSKIN 2.1 PRD
 * Auto-generates appropriate input based on schema field type.
 * 
 * Enhanced with:
 * - Auto-repair suggestions
 * - Plain language error messages
 * - Validation explanations
 * - Examples
 * - Success states
 */

'use client';

import * as React from 'react';
import { type UseFormRegisterReturn, type FieldError } from 'react-hook-form';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Eye, EyeOff, Calendar, Check, Lightbulb, Sparkles } from 'lucide-react';
import { cn } from '../../atoms/utils';
import { Txt } from '../../atoms/Txt';
import { type BioFieldDefinition } from '../../introspector/ZodSchemaIntrospector';

// ============================================================
// Types
// ============================================================

export interface AutoRepairSuggestion {
  /** Pattern to match (regex or function) */
  pattern: RegExp | ((value: string) => boolean);
  /** Function to fix the value */
  fix: (value: string) => string;
  /** Description of what this repair does */
  description?: string;
}

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
  /** Auto-repair suggestions */
  autoRepair?: {
    enabled?: boolean;
    suggestions?: AutoRepairSuggestion[];
  };
  /** Plain language error messages */
  errorMessages?: Record<string, string | ((params?: any) => string)>;
  /** Example values to show */
  examples?: string[];
  /** Validation explanation text */
  validationExplanation?: string;
  /** Current field value (for auto-repair) */
  value?: string | number | boolean;
  /** Callback when value changes */
  onChange?: (value: string) => void;
  /** Show success state when valid */
  showSuccess?: boolean;
  /** Is field currently validating (async) */
  isValidating?: boolean;
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

const inputSuccessStyles = cn(
  'border-status-success focus:ring-status-success/30 focus:border-status-success'
);

// ============================================================
// Field Components
// ============================================================

function TextInput({
  definition,
  register,
  error,
  disabled,
  autoRepair,
  value,
  onChange,
  showSuccess,
  isValidating,
}: BioFormFieldProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const [localValue, setLocalValue] = React.useState(value || '');
  const [repairSuggestion, setRepairSuggestion] = React.useState<AutoRepairSuggestion | null>(null);

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

  // Auto-repair logic
  React.useEffect(() => {
    if (!autoRepair?.enabled || !localValue || typeof localValue !== 'string') {
      setRepairSuggestion(null);
      return;
    }

    const suggestions = autoRepair.suggestions || getDefaultAutoRepair(definition);
    for (const suggestion of suggestions) {
      const matches = typeof suggestion.pattern === 'function'
        ? suggestion.pattern(localValue)
        : suggestion.pattern.test(localValue);

      if (matches) {
        setRepairSuggestion(suggestion);
        return;
      }
    }
    setRepairSuggestion(null);
  }, [localValue, autoRepair, definition]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange?.(newValue);
    register.onChange(e);
  };

  const handleApplyRepair = () => {
    if (!repairSuggestion) return;
    const fixed = repairSuggestion.fix(localValue);
    setLocalValue(fixed);
    onChange?.(fixed);
    // Trigger RHF update
    const syntheticEvent = {
      target: { name: register.name, value: fixed },
      currentTarget: { name: register.name, value: fixed },
    } as React.ChangeEvent<HTMLInputElement>;
    register.onChange(syntheticEvent);
    setRepairSuggestion(null);
  };

  const hasError = !!error;
  const hasSuccess = showSuccess && !hasError && localValue && !isValidating;

  return (
    <div className="relative">
      <input
        id={`field-${definition.name}`}
        type={inputType}
        {...register}
        value={localValue}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          inputBaseStyles,
          hasError && inputErrorStyles,
          hasSuccess && inputSuccessStyles,
          isPassword && 'pr-10',
          isValidating && 'pr-10'
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
      {isValidating && !isPassword && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {hasSuccess && !isPassword && !isValidating && (
        <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-status-success" />
      )}
      {/* Auto-repair suggestion */}
      <AnimatePresence>
        {repairSuggestion && !hasError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-1.5 flex items-center gap-2 text-small"
          >
            <Lightbulb className="h-3.5 w-3.5 text-status-warning flex-shrink-0" />
            <Txt variant="caption" color="secondary">
              {repairSuggestion.description || 'Did you mean...?'}
            </Txt>
            <button
              type="button"
              onClick={handleApplyRepair}
              className="text-accent-primary hover:text-accent-secondary text-small font-medium underline"
            >
              Apply fix
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Default auto-repair suggestions based on field type
function getDefaultAutoRepair(definition: BioFieldDefinition): AutoRepairSuggestion[] {
  const suggestions: AutoRepairSuggestion[] = [];

  // Email fixes
  if (definition.name.toLowerCase().includes('email')) {
    suggestions.push({
      pattern: /^\s*(.+)\s*$/,
      fix: (val) => val.trim(),
      description: 'Remove extra spaces',
    });
    suggestions.push({
      pattern: /^(.+)@(.+)$/,
      fix: (val) => val.toLowerCase().trim(),
      description: 'Convert to lowercase',
    });
  }

  // Date fixes
  if (definition.type === 'date' || definition.name.toLowerCase().includes('date')) {
    suggestions.push({
      pattern: /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/,
      fix: (val) => {
        // Convert MM/DD/YYYY to YYYY-MM-DD
        const parts = val.split(/[\/\-]/);
        if (parts.length === 3) {
          const [a, b, c] = parts;
          if (c.length === 4) {
            // Assume MM/DD/YYYY
            return `${c}-${a.padStart(2, '0')}-${b.padStart(2, '0')}`;
          } else {
            // Assume MM/DD/YY
            const year = parseInt(c) < 50 ? `20${c}` : `19${c}`;
            return `${year}-${a.padStart(2, '0')}-${b.padStart(2, '0')}`;
          }
        }
        return val;
      },
      description: 'Convert to standard date format',
    });
  }

  // Currency/number fixes
  if (definition.type === 'number' || definition.name.toLowerCase().includes('amount') || definition.name.toLowerCase().includes('price')) {
    suggestions.push({
      pattern: /^\$[\d,]+\.?\d*$/,
      fix: (val) => val.replace(/[$,]/g, ''),
      description: 'Remove currency symbols',
    });
    suggestions.push({
      pattern: /^[\d,]+\.?\d*$/,
      fix: (val) => val.replace(/,/g, ''),
      description: 'Remove thousand separators',
    });
  }

  return suggestions;
}

function NumberInput({
  definition,
  register,
  error,
  disabled,
  value,
  onChange,
  showSuccess,
  isValidating,
}: BioFormFieldProps) {
  const [localValue, setLocalValue] = React.useState(value || '');
  const placeholder = definition.uiHints?.placeholder || `Enter ${definition.label.toLowerCase()}`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange?.(newValue);
    register.onChange(e);
  };

  const hasError = !!error;
  const hasSuccess = showSuccess && !hasError && localValue && !isValidating;

  return (
    <div className="relative">
      <input
        id={`field-${definition.name}`}
        type="number"
        {...register}
        value={localValue}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          inputBaseStyles,
          hasError && inputErrorStyles,
          hasSuccess && inputSuccessStyles,
          'tabular-nums',
          isValidating && 'pr-10'
        )}
      />
      {isValidating && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {hasSuccess && !isValidating && (
        <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-status-success" />
      )}
    </div>
  );
}

function TextAreaInput({
  definition,
  register,
  error,
  disabled,
  value,
  onChange,
  showSuccess,
  isValidating,
}: BioFormFieldProps) {
  const [localValue, setLocalValue] = React.useState(value || '');
  const placeholder = definition.uiHints?.placeholder || `Enter ${definition.label.toLowerCase()}`;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange?.(newValue);
    register.onChange(e);
  };

  const hasError = !!error;
  const hasSuccess = showSuccess && !hasError && localValue && !isValidating;

  return (
    <div className="relative">
      <textarea
        {...register}
        value={localValue}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        rows={4}
        className={cn(
          inputBaseStyles,
          hasError && inputErrorStyles,
          hasSuccess && inputSuccessStyles,
          'resize-y min-h-[100px]'
        )}
      />
      {hasSuccess && !isValidating && (
        <Check className="absolute right-3 top-3 h-4 w-4 text-status-success" />
      )}
    </div>
  );
}

function SelectInput({
  definition,
  register,
  error,
  disabled,
  value,
  onChange,
  showSuccess,
  isValidating,
}: BioFormFieldProps) {
  const [localValue, setLocalValue] = React.useState(value || '');
  const options = definition.validation?.options || [];

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange?.(newValue);
    register.onChange(e);
  };

  const hasError = !!error;
  const hasSuccess = showSuccess && !hasError && localValue && !isValidating;

  return (
    <div className="relative">
      <select
        id={`field-${definition.name}`}
        {...register}
        value={localValue}
        onChange={handleChange}
        disabled={disabled}
        className={cn(
          inputBaseStyles,
          hasError && inputErrorStyles,
          hasSuccess && inputSuccessStyles,
          'cursor-pointer',
          isValidating && 'pr-10'
        )}
      >
        <option value="">Select {definition.label.toLowerCase()}</option>
        {options.map((option: string) => (
          <option key={option} value={option}>
            {option.charAt(0).toUpperCase() + option.slice(1).replace(/_/g, ' ')}
          </option>
        ))}
      </select>
      {isValidating && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <div className="h-4 w-4 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {hasSuccess && !isValidating && (
        <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-status-success pointer-events-none" />
      )}
    </div>
  );
}

function CheckboxInput({
  definition,
  register,
  error,
  disabled,
}: BioFormFieldProps) {
  return (
    <label htmlFor={`field-${definition.name}`} className="flex items-center gap-3 cursor-pointer">
      <input
        id={`field-${definition.name}`}
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
  value,
  onChange,
  showSuccess,
  isValidating,
}: BioFormFieldProps) {
  const [localValue, setLocalValue] = React.useState(value || '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange?.(newValue);
    register.onChange(e);
  };

  const hasError = !!error;
  const hasSuccess = showSuccess && !hasError && localValue && !isValidating;

  return (
    <div className="relative">
      <input
        id={`field-${definition.name}`}
        type="date"
        {...register}
        value={localValue}
        onChange={handleChange}
        disabled={disabled}
        className={cn(
          inputBaseStyles,
          hasError && inputErrorStyles,
          hasSuccess && inputSuccessStyles,
          'pr-10'
        )}
      />
      {hasSuccess && !isValidating ? (
        <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-status-success" />
      ) : (
        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
      )}
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
  autoRepair,
  errorMessages,
  examples,
  validationExplanation,
  value,
  onChange,
  showSuccess = false,
  isValidating = false,
}: BioFormFieldProps) {
  // Determine field type
  const isLongText = definition.name.toLowerCase().includes('description') ||
    definition.name.toLowerCase().includes('content') ||
    definition.name.toLowerCase().includes('notes') ||
    definition.name.toLowerCase().includes('body');

  // Get human-readable error message
  const getErrorMessage = (): string | undefined => {
    if (!error) return undefined;

    // Check custom error messages first
    if (errorMessages) {
      // Try to match error type (e.g., "required", "email", "min")
      const errorType = error.toLowerCase();
      for (const [key, message] of Object.entries(errorMessages)) {
        if (errorType.includes(key.toLowerCase())) {
          return typeof message === 'function' ? message() : message;
        }
      }
    }

    // Fallback to default error or try to make it more readable
    return formatErrorMessage(error, definition);
  };

  const displayError = getErrorMessage();

  const renderInput = () => {
    const commonProps = {
      definition,
      register,
      error: displayError,
      disabled,
      value,
      onChange,
      showSuccess,
      isValidating,
    };

    // Boolean → Checkbox
    if (definition.type === 'boolean') {
      return <CheckboxInput definition={definition} register={register} error={displayError} disabled={disabled} />;
    }

    // Enum → Select
    if (definition.type === 'enum' && definition.validation?.options?.length) {
      return <SelectInput definition={definition} register={register} error={displayError} disabled={disabled} />;
    }

    // Date → Date picker
    if (definition.type === 'date') {
      return <DateInput definition={definition} register={register} error={displayError} disabled={disabled} />;
    }

    // Number → Number input
    if (definition.type === 'number') {
      return <NumberInput {...commonProps} autoRepair={autoRepair} />;
    }

    // Long text → Textarea
    if (isLongText) {
      return <TextAreaInput {...commonProps} autoRepair={autoRepair} />;
    }

    // Default → Text input
    return <TextInput {...commonProps} autoRepair={autoRepair} />;
  };

  // Boolean fields have inline label
  if (definition.type === 'boolean') {
    return (
      <div className={cn('space-y-1', className)}>
        {renderInput()}
        <FieldError error={displayError} />
      </div>
    );
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <FieldLabel definition={definition} />
      {renderInput()}
      <FieldError error={displayError} />
      {validationExplanation && !displayError && (
        <ValidationHint explanation={validationExplanation} />
      )}
      {examples && examples.length > 0 && !displayError && (
        <Examples examples={examples} />
      )}
    </div>
  );
}

// Format error message to be more human-readable
function formatErrorMessage(error: string, definition: BioFieldDefinition): string {
  const lowerError = error.toLowerCase();

  // Common Zod error patterns
  if (lowerError.includes('required')) {
    return `${definition.label} is required`;
  }
  if (lowerError.includes('email')) {
    return 'Please enter a valid email address';
  }
  if (lowerError.includes('url')) {
    return 'Please enter a valid URL';
  }
  if (lowerError.includes('min')) {
    const minMatch = error.match(/min\((\d+)\)/);
    if (minMatch) {
      return `Must be at least ${minMatch[1]} characters`;
    }
  }
  if (lowerError.includes('max')) {
    const maxMatch = error.match(/max\((\d+)\)/);
    if (maxMatch) {
      return `Must be no more than ${maxMatch[1]} characters`;
    }
  }
  if (lowerError.includes('invalid')) {
    return `Invalid ${definition.label.toLowerCase()}`;
  }

  // Return original if we can't improve it
  return error;
}

// ============================================================
// Helper Components
// ============================================================

function FieldLabel({ definition }: { definition: BioFieldDefinition }) {
  return (
    <label htmlFor={`field-${definition.name}`} className="flex items-center gap-1">
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

function ValidationHint({ explanation }: { explanation: string }) {
  return (
    <div className="flex items-start gap-1.5 text-small text-text-tertiary">
      <Lightbulb className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
      <Txt variant="caption" color="tertiary">
        {explanation}
      </Txt>
    </div>
  );
}

function Examples({ examples }: { examples: string[] }) {
  return (
    <div className="space-y-1">
      <Txt variant="caption" color="tertiary" className="text-small">
        Examples:
      </Txt>
      <div className="flex flex-wrap gap-1.5">
        {examples.map((example, idx) => (
          <span
            key={idx}
            className="px-2 py-0.5 rounded bg-surface-nested text-small text-text-secondary font-mono"
          >
            {example}
          </span>
        ))}
      </div>
    </div>
  );
}

BioFormField.displayName = 'BioFormField';

// Export helper components
export { FieldLabel, FieldError };
