/**
 * @aibos/bioskin - Organisms (Layer 3)
 * 
 * Schema-driven components per CONT_10 BioSkin Architecture v2.1
 * These are the "cells" that auto-generate UI from Zod schemas.
 */

// BioTable - powered by TanStack Table + Jotai (Sprint 2)
export {
  BioTable,
  type BioTableProps,
  COMPONENT_META as BIO_TABLE_META,
  // Sub-components
  BioTableHeader,
  BioTableGlobalFilter,
  BioTableColumnFilter,
  BioTableFilterBar,
  BioTablePagination,
  // Hook + atoms
  useBioTable,
  useResetBioTable,
  globalFilterAtom,
  sortingAtom,
  columnFiltersAtom,
  paginationAtom,
  rowSelectionAtom,
} from './BioTable';

// BioForm - powered by react-hook-form + Zod (Sprint 3)
export {
  BioForm,
  type BioFormProps,
  COMPONENT_META as BIO_FORM_META,
  // Sub-components
  BioFormField,
  FieldLabel,
  FieldError,
  // Hook
  useBioForm,
  useFieldRegistration,
  type FormMode,
} from './BioForm';

// BioObject - detail view from schema
export { BioObject, type BioObjectProps, COMPONENT_META as BIO_OBJECT_META } from './BioObject';
