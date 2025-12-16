/**
 * @aibos/bioskin - The Single Governed UI Cell
 * 
 * Hexagonal architecture per CONT_10 BioSkin Architecture
 * All governed UI components exported from this single entry point.
 * 
 * @see packages/canon/A-Governance/A-CONT/CONT_10_BioSkinArchitecture.md
 */

// ============================================================
// ATOMS (Layer 1) - Primitive components
// ============================================================
export { Surface, type SurfaceProps } from './atoms/Surface';
export { Txt, type TxtProps } from './atoms/Txt';
export { Btn, type BtnProps } from './atoms/Btn';
export { Field, type FieldProps, type FieldDefinition } from './atoms/Field';
export { Icon, type IconProps } from './atoms/Icon';

// Utilities
export { cn } from './atoms/utils';

// ============================================================
// MOLECULES (Layer 2) - Composed components
// ============================================================
export { StatusBadge, type StatusBadgeProps } from './molecules/StatusBadge';
export { StatCard, type StatCardProps } from './molecules/StatCard';
export { DetailSheet, type DetailSheetProps } from './molecules/DetailSheet';
export { ActionMenu, type ActionMenuProps, type ActionMenuItem } from './molecules/ActionMenu';
export { EmptyState, type EmptyStateProps } from './molecules/EmptyState';
export { LoadingState, type LoadingStateProps } from './molecules/LoadingState';
export { ErrorState, type ErrorStateProps } from './molecules/ErrorState';

// ============================================================
// ORGANISMS (Layer 3) - Schema-driven components
// ============================================================
export { BioTable, type BioTableProps } from './organisms/BioTable';
export { BioForm, type BioFormProps } from './organisms/BioForm';
export { BioObject, type BioObjectProps } from './organisms/BioObject';

// ============================================================
// INTROSPECTOR (Layer 0) - Schema processing
// ============================================================
export {
  introspectZodSchema,
  getFieldSchema,
  validateField,
  type BioFieldDefinition,
  type BioSchemaDefinition,
} from './introspector';
