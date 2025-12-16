'use client'

/**
 * @aibos/bioskin - The Single Governed UI Cell
 * 
 * Directive-based architecture per CONT_10 v2.1 BioSkin Architecture
 * All CLIENT components exported from this entry point.
 * 
 * For server-safe utilities, import from '@aibos/bioskin/server'
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
export { StatusBadge, PulsingDot, type StatusBadgeProps } from './molecules/StatusBadge';
export { Spinner, type SpinnerProps, type SpinnerVariant } from './molecules/Spinner';
export { MotionEffect, StaggerContainer, StaggerItem, type MotionEffectProps, type MotionPreset } from './molecules/MotionEffect';
export { StatCard, type StatCardProps } from './molecules/StatCard';
export { DetailSheet, type DetailSheetProps } from './molecules/DetailSheet';
export { ActionMenu, type ActionMenuProps, type ActionMenuItem } from './molecules/ActionMenu';
export { EmptyState, type EmptyStateProps } from './molecules/EmptyState';
export { LoadingState, type LoadingStateProps } from './molecules/LoadingState';
export { ErrorState, type ErrorStateProps } from './molecules/ErrorState';
export { BioApprovalActions, type BioApprovalActionsProps } from './molecules/BioApprovalActions';
export { BioDiffViewer, useDiff, type BioDiffViewerProps, type DiffEntry } from './molecules/BioDiffViewer';

// ============================================================
// ORGANISMS (Layer 3) - Schema-driven components
// ============================================================
export { BioTable, type BioTableProps } from './organisms/BioTable';
export { BioForm, type BioFormProps } from './organisms/BioForm';
export { BioObject, type BioObjectProps } from './organisms/BioObject';
export { BioKanban, type BioKanbanProps, type KanbanCard, type KanbanColumn } from './organisms/BioKanban';
export { BioTree, type BioTreeProps, type TreeNode } from './organisms/BioTree';
export { BioTimeline, type BioTimelineProps, type TimelineItem } from './organisms/BioTimeline';
export { BioDropzone, type BioDropzoneProps, type UploadedFile } from './organisms/BioDropzone';
export { BioCalendar, type BioCalendarProps, type CalendarEvent } from './organisms/BioCalendar';
export { BioGantt, type BioGanttProps, type GanttTask } from './organisms/BioGantt';
export { BioChart, type BioChartProps, type ChartDataPoint } from './organisms/BioChart';

// ============================================================
// PROVIDERS (Cross-cutting) - Context providers
// ============================================================
export {
  // Locale (i18n)
  BioLocaleProvider,
  useLocale,
  type BioLocaleConfig,
  type BioLocaleProviderProps,
  // Governance / RBAC (Sprint E6)
  BioPermissionProvider,
  usePermissions,
  useAudit,
  type BioUser,
  type BioPermissionMap,
  type BioFieldRule,
  type BioFieldSecurityMap,
  type BioAuditEvent,
  type BioDocumentState,
  type BioPermissionProviderProps,
  // Field-level security
  withFieldSecurity,
  useFieldSecurity,
  SecuredField,
  ActionGate,
  RoleGate,
  StateGate,
} from './providers';

// ============================================================
// HOOKS (Cross-cutting) - Shared hooks
// ============================================================
export {
  useKeyboardNavigation,
  useRovingTabIndex,
  type UseKeyboardNavigationOptions,
  type UseKeyboardNavigationReturn,
} from './hooks';
