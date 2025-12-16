/**
 * BioForm - Schema-driven form powered by React Hook Form + Zod
 * 
 * Sprint 3 Day 13 per BIOSKIN 2.1 PRD
 * Production-grade forms with auto-generated fields and real-time validation.
 * 
 * @example
 * // Basic usage
 * <BioForm schema={PaymentSchema} onSubmit={handleSubmit} />
 * 
 * @example
 * // Full featured
 * <BioForm
 *   schema={PaymentSchema}
 *   defaultValues={existingData}
 *   onSubmit={handleSubmit}
 *   onCancel={handleCancel}
 *   mode="edit"
 *   layout="two-column"
 * />
 */

'use client';

import * as React from 'react';
import { z } from 'zod';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

import { cn } from '../../atoms/utils';
import { Surface } from '../../atoms/Surface';
import { Txt } from '../../atoms/Txt';
import { Btn } from '../../atoms/Btn';

import { useBioForm, type FormMode } from './useBioForm';
import { BioFormField } from './BioFormField';

// ============================================================
// Types
// ============================================================

export interface BioFormProps<T extends z.ZodRawShape> {
  /** Zod schema defining the form structure */
  schema: z.ZodObject<T>;
  /** Initial form data */
  defaultValues?: Partial<z.infer<z.ZodObject<T>>>;
  /** Called when form is submitted with valid data */
  onSubmit: (data: z.infer<z.ZodObject<T>>) => void | Promise<void>;
  /** Called when form is cancelled */
  onCancel?: () => void;

  // Display
  /** Title for the form */
  title?: string;
  /** Show title */
  showTitle?: boolean;
  /** Description text */
  description?: string;
  /** Submit button text */
  submitLabel?: string;
  /** Cancel button text */
  cancelLabel?: string;

  // Layout
  /** Layout variant */
  layout?: 'single' | 'two-column' | 'custom';
  /** Form mode */
  mode?: FormMode;

  // Features
  /** Show validation summary */
  showValidationSummary?: boolean;
  /** Show success message after submit */
  showSuccessMessage?: boolean;
  /** Success message text */
  successMessage?: string;
  /** Reset form after successful submit */
  resetOnSuccess?: boolean;

  // Fields
  /** Fields to include */
  include?: string[];
  /** Fields to exclude */
  exclude?: string[];

  // External state
  /** External loading state */
  loading?: boolean;
  /** External error message */
  error?: string | null;

  /** Additional className */
  className?: string;
}

// ============================================================
// Layout Styles
// ============================================================

const layoutStyles = {
  single: 'flex flex-col gap-4',
  'two-column': 'grid grid-cols-1 md:grid-cols-2 gap-4',
  custom: '',
} as const;

// ============================================================
// Main Component
// ============================================================

export function BioForm<T extends z.ZodRawShape>({
  schema,
  defaultValues,
  onSubmit,
  onCancel,
  title,
  showTitle = true,
  description,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  layout = 'single',
  mode = 'create',
  showValidationSummary = true,
  showSuccessMessage = true,
  successMessage = 'Form submitted successfully!',
  resetOnSuccess = false,
  include,
  exclude,
  loading: externalLoading = false,
  error: externalError = null,
  className,
}: BioFormProps<T>) {
  const [showSuccess, setShowSuccess] = React.useState(false);

  // Use the form hook
  const {
    form,
    definition,
    fields,
    isSubmitting,
    isValid,
    isDirty,
    errors,
    handleSubmit,
    reset,
  } = useBioForm({
    schema,
    defaultValues,
    onSubmit: async (data) => {
      await onSubmit(data);
      if (showSuccessMessage) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    },
    mode,
    include,
    exclude,
    resetOnSuccess,
  });

  const { register } = form;
  const displayTitle = title || (definition.name !== 'Object' ? definition.name : undefined);
  const isLoading = externalLoading || isSubmitting;
  const isDisabled = mode === 'view';

  // Collect all errors for summary
  const errorList = Object.entries(errors).map(([field, error]) => ({
    field,
    message: (error as { message?: string })?.message || 'Invalid value',
  }));

  return (
    <Surface className={cn('space-y-6', className)} data-testid="bio-form">
      <form onSubmit={handleSubmit} className="space-y-6" data-testid="bio-form-element">
        {/* Header */}
        {(showTitle && displayTitle) || description ? (
          <div className="space-y-1">
            {showTitle && displayTitle && (
              <Txt variant="heading" as="h3">
                {displayTitle}
              </Txt>
            )}
            {description && (
              <Txt variant="body" color="secondary">
                {description}
              </Txt>
            )}
          </div>
        ) : null}

        {/* Success Message */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 px-4 py-3 rounded-lg bg-status-success/10 border border-status-success/30"
            >
              <CheckCircle className="h-5 w-5 text-status-success flex-shrink-0" />
              <Txt variant="body" className="text-status-success">
                {successMessage}
              </Txt>
            </motion.div>
          )}
        </AnimatePresence>

        {/* External Error */}
        <AnimatePresence>
          {externalError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 px-4 py-3 rounded-lg bg-status-danger/10 border border-status-danger/30"
            >
              <AlertCircle className="h-5 w-5 text-status-danger flex-shrink-0" />
              <Txt variant="body" className="text-status-danger">
                {externalError}
              </Txt>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Validation Summary */}
        <AnimatePresence>
          {showValidationSummary && errorList.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 py-3 rounded-lg bg-status-danger/5 border border-status-danger/20"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-status-danger flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <Txt variant="label" className="text-status-danger">
                    Please fix the following errors:
                  </Txt>
                  <ul className="text-small text-status-danger space-y-0.5">
                    {errorList.slice(0, 5).map(({ field, message }) => (
                      <li key={field}>• {message}</li>
                    ))}
                    {errorList.length > 5 && (
                      <li>...and {errorList.length - 5} more</li>
                    )}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Fields */}
        <div className={layoutStyles[layout]}>
          {fields.map((field, index) => (
            <motion.div
              key={field.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
            >
              <BioFormField
                definition={field}
                register={register(field.name as never)}
                error={(errors[field.name as keyof typeof errors] as { message?: string })?.message}
                disabled={isDisabled || isLoading}
              />
            </motion.div>
          ))}
        </div>

        {/* Actions */}
        {mode !== 'view' && (
          <div className="flex items-center justify-between pt-4 border-t border-default">
            <div className="text-small text-text-muted">
              {isDirty && (
                <span className="text-status-warning">• Unsaved changes</span>
              )}
            </div>

            <div className="flex items-center gap-3">
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
              <Btn
                type="submit"
                variant="primary"
                disabled={isLoading || (!isDirty && mode === 'edit')}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  submitLabel
                )}
              </Btn>
            </div>
          </div>
        )}
      </form>
    </Surface>
  );
}

BioForm.displayName = 'BioForm';

export const COMPONENT_META = {
  code: 'BIOSKIN_BioForm',
  version: '2.0.0',
  layer: 'organisms',
  family: 'INPUT',
  status: 'stable',
  poweredBy: ['react-hook-form', '@hookform/resolvers', 'motion'],
} as const;
