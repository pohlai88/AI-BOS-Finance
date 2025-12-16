'use client';

/**
 * @aibos/bioskin/form - Granular entry point for BioForm
 *
 * Use this for better tree-shaking when you only need form components.
 * Powered by react-hook-form + Zod
 *
 * @example
 * import { BioForm } from '@aibos/bioskin/form';
 *
 * @see PERFORMANCE.md for optimization guide
 */

export { BioForm, type BioFormProps } from './organisms/BioForm';
export { useBioForm, type FormMode } from './organisms/BioForm/useBioForm';
export { BioFormField, type BioFormFieldProps } from './organisms/BioForm/BioFormField';
