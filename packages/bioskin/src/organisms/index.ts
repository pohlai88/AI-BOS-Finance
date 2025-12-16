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

// BioKanban - powered by @dnd-kit (Sprint 5 - ERPNext Expansion)
export {
  BioKanban,
  type BioKanbanProps,
  COMPONENT_META as BIO_KANBAN_META,
  // Sub-components
  BioKanbanColumn,
  type BioKanbanColumnProps,
  BioKanbanCard,
  type BioKanbanCardProps,
  // Hook + types
  useBioKanban,
  type KanbanCard,
  type KanbanColumn,
  type KanbanState,
  type UseBioKanbanOptions,
  type UseBioKanbanReturn,
} from './BioKanban';

// BioTree - hierarchical data view (Sprint 5 - ERPNext Expansion)
export {
  BioTree,
  type BioTreeProps,
  COMPONENT_META as BIO_TREE_META,
  // Sub-components
  BioTreeNode,
  type BioTreeNodeProps,
  // Hook + types
  useBioTree,
  type TreeNode,
  type TreeState,
  type UseBioTreeOptions,
  type UseBioTreeReturn,
} from './BioTree';

// BioTimeline - activity logs (Sprint 5 - ERPNext Expansion)
export {
  BioTimeline,
  type BioTimelineProps,
  type TimelineItem,
  type TimelineItemType,
  COMPONENT_META as BIO_TIMELINE_META,
} from './BioTimeline';

// BioDropzone - file upload (Sprint 5 - ERPNext Expansion)
export {
  BioDropzone,
  type BioDropzoneProps,
  type UploadedFile,
  type FileStatus,
  COMPONENT_META as BIO_DROPZONE_META,
} from './BioDropzone';

// BioCalendar - event calendar (Sprint 5 - ERPNext Expansion)
export {
  BioCalendar,
  type BioCalendarProps,
  type CalendarEvent,
  type CalendarEventType,
  type CalendarView,
  COMPONENT_META as BIO_CALENDAR_META,
} from './BioCalendar';

// BioGantt - project timeline (Sprint 5 - ERPNext Expansion)
export {
  BioGantt,
  type BioGanttProps,
  type GanttTask,
  type GanttTaskStatus,
  COMPONENT_META as BIO_GANTT_META,
} from './BioGantt';

// BioChart - dashboard charts (Sprint 5 - ERPNext Expansion)
export {
  BioChart,
  type BioChartProps,
  type ChartDataPoint,
  type ChartType,
  COMPONENT_META as BIO_CHART_META,
} from './BioChart';

// ============================================================
// LAYOUT COMPONENTS (Sprint Layout - Full Rewrite Support)
// ============================================================

// BioSidebar - collapsible navigation
export {
  BioSidebar,
  type BioSidebarProps,
  type BioNavItem,
  COMPONENT_META as BIO_SIDEBAR_META,
} from './BioSidebar';

// BioNavbar - top navigation bar
export {
  BioNavbar,
  type BioNavbarProps,
  type BioNavbarUser,
  type BioNavbarAction,
  COMPONENT_META as BIO_NAVBAR_META,
} from './BioNavbar';

// BioAppShell - root layout wrapper
export {
  BioAppShell,
  useAppShell,
  type BioAppShellProps,
  COMPONENT_META as BIO_APP_SHELL_META,
} from './BioAppShell';

// BioCommandPalette - global search/actions (Cmd+K)
export {
  BioCommandPalette,
  type BioCommandPaletteProps,
  type BioCommand,
  COMPONENT_META as BIO_COMMAND_PALETTE_META,
} from './BioCommandPalette';
