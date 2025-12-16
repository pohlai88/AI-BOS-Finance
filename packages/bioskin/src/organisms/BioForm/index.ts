/**
 * @aibos/bioskin - BioForm (Organism Layer)
 * 
 * Production-grade forms powered by React Hook Form + Zod.
 * Sprint 3 deliverable per BIOSKIN 2.1 PRD.
 */

// Main component
export { BioForm, type BioFormProps, COMPONENT_META } from './BioForm';

// Sub-components
export { BioFormField, FieldLabel, FieldError, type BioFormFieldProps } from './BioFormField';

// Hook
export {
  useBioForm,
  useFieldRegistration,
  type UseBioFormOptions,
  type UseBioFormReturn,
  type FormMode,
  type FieldRegistration,
} from './useBioForm';
