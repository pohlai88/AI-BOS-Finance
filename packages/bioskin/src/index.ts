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
export { LoadingState, type LoadingStateProps, type SkeletonVariant } from './molecules/LoadingState';
export { ErrorState, type ErrorStateProps, type PartialSuccessInfo } from './molecules/ErrorState';

// Error Boundary & Suspense Utilities (Optimization)
export {
  BioErrorBoundary,
  useErrorBoundary,
  withErrorBoundary,
  type BioErrorBoundaryProps,
  type ErrorFallbackProps,
} from './molecules/BioErrorBoundary';
export {
  BioSuspense,
  lazyWithPreload,
  type BioSuspenseProps,
  type LazyWithPreloadResult,
} from './molecules/BioSuspense';
export { BioTemplateSelector, type BioTemplateSelectorProps } from './molecules/BioTemplateSelector';
export { BioApprovalActions, type BioApprovalActionsProps } from './molecules/BioApprovalActions';
export { BioDiffViewer, useDiff, type BioDiffViewerProps, type DiffEntry } from './molecules/BioDiffViewer';
export { BioBreadcrumb, generateBreadcrumbs, type BioBreadcrumbProps, type BioBreadcrumbItem } from './molecules/BioBreadcrumb';
export { BioToastProvider, bioToast, type BioToastProviderProps, type BioToastPosition } from './molecules/BioToast';

// Finance ERP Components (Sprint F1-F4)
export { BioDrilldown, type BioDrilldownProps, type DrilldownFilter } from './molecules/BioDrilldown';
export { BioActiveFilters, type BioActiveFiltersProps, type ActiveFilter } from './molecules/BioActiveFilters';
export { BioSavedViews, type BioSavedViewsProps, type SavedView } from './molecules/BioSavedViews';
export { BioBulkActions, type BioBulkActionsProps, type BulkAction, type BulkActionItem, type BulkActionResult } from './molecules/BioBulkActions';
export { BioExceptionDashboard, type BioExceptionDashboardProps, type Exception, type ExceptionItem, type ExceptionAction } from './molecules/BioExceptionDashboard';
export { BioExplainer, type BioExplainerProps, type NumberExplanation, type FxRateInfo } from './molecules/BioExplainer';
export { BioPrintTemplate, type BioPrintTemplateProps, type PrintTemplateType, type PrintConfig, type CompanyInfo } from './molecules/BioPrintTemplate';

// Recent Filters (Phase Final)
export { BioRecentFilters, useRecentFilters, type BioRecentFiltersProps, type RecentFilterSet, type UseRecentFiltersOptions, type UseRecentFiltersReturn } from './molecules/BioRecentFilters';

// Module-Specific Empty States (Phase Final)
export {
  EmptyStateAP,
  EmptyStateAR,
  EmptyStateGL,
  EmptyStatePay,
  EmptyStateInventory,
  EmptyStatePurchasing,
  type ModuleEmptyStateProps,
} from './molecules/ModuleEmptyStates';

// Navigation & Multi-Tasking (Phase P1-B)
export { BioTabs, useTabs, type BioTabsProps, type BioTab, type UseTabsOptions, type UseTabsReturn } from './molecules/BioTabs';
export { BioSplitView, type BioSplitViewProps } from './molecules/BioSplitView';

// Onboarding & Guidance (Phase P2)
export { BioTour, useTour, type BioTourProps, type TourStep, type UseTourOptions, type UseTourReturn } from './molecules/BioTour';
export { BioHelpPanel, type BioHelpPanelProps, type HelpArticle, type HelpVideo } from './molecules/BioHelpPanel';
export { BioSpotlight, type BioSpotlightProps } from './molecules/BioSpotlight';

// ============================================================
// ORGANISMS (Layer 3) - Schema-driven components
// ============================================================
export { BioTable, type BioTableProps } from './organisms/BioTable';

// Table Enhancements (Phase P1-A)
export {
  BioTableColumnManager,
  type BioTableColumnManagerProps,
  BioTableImport,
  type BioTableImportProps,
  BioTableResizer,
  useColumnResize,
  type BioTableResizerProps,
  useTableKeyboard,
  type UseTableKeyboardOptions,
  type UseTableKeyboardReturn,
  type CellPosition,
  // Inline Editing (Phase Final)
  BioTableInlineEdit,
  BioTableBulkEdit,
  useBioTableInlineEdit,
  type BioTableInlineEditProps,
  type BioTableBulkEditProps,
  type UseBioTableInlineEditOptions,
  type UseBioTableInlineEditReturn,
  type CellEdit,
} from './organisms/BioTable';
export { BioForm, type BioFormProps } from './organisms/BioForm';
export { BioObject, type BioObjectProps } from './organisms/BioObject';
export { BioKanban, type BioKanbanProps, type KanbanCard, type KanbanColumn } from './organisms/BioKanban';
export { BioTree, type BioTreeProps, type TreeNode } from './organisms/BioTree';
export { BioTimeline, type BioTimelineProps, type TimelineItem } from './organisms/BioTimeline';

// Timeline Enhancements (Phase P2)
export {
  BioTimelineComment,
  type BioTimelineCommentProps,
  type TimelineComment,
  type CommentReaction,
  BioTimelineFilters,
  type BioTimelineFiltersProps,
  type TimelineFilters,
  useBioTimelineExport,
  type UseBioTimelineExportReturn,
  BioTimelineAttachment,
  BioTimelineAttachments,
  type BioTimelineAttachmentProps,
  type BioTimelineAttachmentsProps,
  type TimelineAttachment,
} from './organisms/BioTimeline';
export { BioDropzone, type BioDropzoneProps, type UploadedFile } from './organisms/BioDropzone';
export { BioCalendar, type BioCalendarProps, type CalendarEvent } from './organisms/BioCalendar';
export { BioGantt, type BioGanttProps, type GanttTask } from './organisms/BioGantt';
export { BioChart, type BioChartProps, type ChartDataPoint } from './organisms/BioChart';

// Layout Components (Sprint Layout - Full Rewrite Support)
export { BioSidebar, type BioSidebarProps, type BioNavItem } from './organisms/BioSidebar';
export { BioNavbar, type BioNavbarProps, type BioNavbarUser, type BioNavbarAction } from './organisms/BioNavbar';
export { BioAppShell, useAppShell, type BioAppShellProps } from './organisms/BioAppShell';
export { BioCommandPalette, type BioCommandPaletteProps, type BioCommand } from './organisms/BioCommandPalette';

// Finance ERP Organisms
export { BioReconciliation, type BioReconciliationProps, type ReconciliationItem, type ReconciliationPane, type MatchSuggestion, type SplitItem } from './organisms/BioReconciliation';
export { BioPeriodClose, type BioPeriodCloseProps, type ChecklistItem, type ChecklistResult, type PeriodCloseState } from './organisms/BioPeriodClose';

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

// Template System
export {
  BioTemplateProvider,
  useTemplates,
  type BioTemplateProviderProps,
  type Template,
  type TemplateStorage,
  type TemplateContextValue,
} from './providers/BioTemplateProvider';

// Offline & Sync
export {
  BioOfflineProvider,
  useOffline,
  BioOfflineBanner,
  BioSyncIndicator,
  type BioOfflineProviderProps,
  type OfflineContextValue,
  type QueuedAction,
  type BioOfflineBannerProps,
  type BioSyncIndicatorProps,
} from './providers/BioOfflineProvider';

// ============================================================
// HOOKS (Cross-cutting) - Shared hooks
// ============================================================
export {
  useKeyboardNavigation,
  useRovingTabIndex,
  type UseKeyboardNavigationOptions,
  type UseKeyboardNavigationReturn,
} from './hooks';

// Smart Defaults & Utilities
export {
  useSmartDefaults,
  type UseSmartDefaultsOptions,
  type UseSmartDefaultsReturn,
  type SmartDefaultConfig,
  type SmartDefaultContext,
} from './hooks/useSmartDefaults';

export { useDebounce } from './hooks/useDebounce';

// Optimistic Mutations
export {
  useOptimisticMutation,
  type UseOptimisticMutationOptions,
  type UseOptimisticMutationReturn,
} from './hooks/useOptimisticMutation';

// URL-Synced Filters
export {
  useUrlSyncedFilters,
  type UseUrlSyncedFiltersOptions,
  type UseUrlSyncedFiltersReturn,
  type Filters,
  type FilterValue,
} from './hooks/useUrlSyncedFilters';

// Navigation History (Phase P1-B)
export {
  useNavigationHistory,
  type UseNavigationHistoryOptions,
  type UseNavigationHistoryReturn,
  type NavigationEntry,
} from './hooks/useNavigationHistory';

// List State Preservation (Phase P1-B)
export {
  useListState,
  type UseListStateOptions,
  type UseListStateReturn,
  type ListState,
} from './hooks/useListState';

// Role-Based Suggestions (Phase Final)
export {
  useRoleBasedSuggestions,
  type UseRoleBasedSuggestionsOptions,
  type UseRoleBasedSuggestionsReturn,
  type Suggestion,
  type SuggestionConfig,
  type UserRole,
} from './hooks/useRoleBasedSuggestions';

// ============================================================
// REGISTRY (BioSkin 3.0) - Industry Adapter System
// Per CONT_12: BioRegistry & Industry Adapters
// ============================================================
export {
  // Registry Singleton
  BioRegistry,
  type BioRegistryImpl,
  type RegistryEvent,
  type RegistryEventListener,

  // React Provider
  BioRegistryProvider,
  useRegistryContext,
  useRegistryReady,
  useActiveAdapter,
  type BioRegistryContextValue,
  type BioRegistryProviderProps,

  // Adapter Types
  type AdapterCluster,
  type IndustryAdapter,
  type ModuleConfig,

  // Empty State Types
  type EmptyStateConfig,
  type QuickAction,

  // Command Types
  type CommandConfig,
  type CommandCategory,

  // Filter Types
  type FilterOperator,
  type FilterDefinition,
  type FilterPreset,

  // Exception Types
  type ExceptionSeverity,
  type ExceptionTypeConfig,

  // Design Token Types
  type DesignTokenOverrides,
  type ValidationMessages,

  // Validation
  validateAdapter,
  validateAdapterOrThrow,
  formatValidationErrors,
  type ValidationResult,

  // Schemas (for advanced usage)
  IndustryAdapterSchema,
  AdapterClusterSchema,
} from './registry';

// ============================================================
// CAPABILITIES (BioSkin 3.0) - Feature Flag System
// Per CONT_13: BioCapabilities Feature Flag System
// ============================================================
export {
  // Capabilities Singleton
  BioCapabilities,
  type BioCapabilitiesImpl,

  // React Hooks
  useCapability,
  useCapabilities,
  useCategoryCapabilities,
  useCapabilityEnabled,
  useCapabilityStats,

  // React Components
  CapabilityGate,
  CapabilitySwitch,
  RequireCapability,
  RequireAnyCapability,
  type CapabilityGateProps,
  type CapabilitySwitchProps,
  type RequireCapabilityProps,
  type RequireAnyCapabilityProps,

  // Capability Types
  type CapabilityTree,
  type CapabilityCategory,
  type CapabilityPath,
  type CapabilitySource,
  type CapabilityResult,
  type CapabilityContext,

  // Compliance Types
  type ComplianceRuleId,
  type CapabilityOverride,
  type ComplianceRule,
  type PartialCapabilityTree,

  // Compliance Utilities
  ComplianceRules,
  AdapterComplianceMap,
  getComplianceOverrides,

  // Profile Utilities
  DefaultCapabilities,
  CapabilityProfiles,
  getCapabilityProfile,
} from './capabilities';

// ============================================================
// TOKENS (BioSkin 3.0) - Design Token System
// Per CONT_14: Design Tokens Architecture
// ============================================================
export {
  // Token Provider
  BioTokenProvider,
  useTokenContext,
  useTheme,
  useTokens,
  type BioTokenContextValue,
  type BioTokenProviderProps,

  // Token Types
  type DesignTokens,
  type ThemeMode,
  type AdapterThemeId,
  type TokenOverrides,

  // Token Utilities
  getToken,
  setToken,
  removeToken,
  getAllTokens,
  invalidateTokenCache,
  applyTokenOverrides,
  removeTokenOverrides,
} from './tokens';
