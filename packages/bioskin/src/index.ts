// ============================================================================
// BIOSKIN - The Morphology Layer
// ============================================================================
// Schema-driven UI components that map Kernel metadata to atomic components
// 🛡️ GOVERNANCE: Only composes Surface, Txt, Btn, Input, StatusDot
// ============================================================================

export { BioCell, type BioCellProps, type Intent } from './BioCell';
export { BioObject } from './BioObject';
export { BioList, type BioListProps } from './BioList';
export { FieldContextSidebar, type FieldContextSidebarProps } from './FieldContextSidebar';
export type {
  ExtendedMetadataField,
  BioIntent,
  FieldErrors,
  BioObjectPropsWithSchema,
  BioObjectPropsWithoutSchema,
} from './types';
